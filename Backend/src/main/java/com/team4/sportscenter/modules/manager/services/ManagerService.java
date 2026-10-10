package com.team4.sportscenter.modules.manager.services;

import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.RoleRepository;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests;
import com.team4.sportscenter.modules.manager.entities.AuditLog;
import com.team4.sportscenter.modules.manager.repositories.AuditLogRepository;
import com.team4.sportscenter.modules.manager.repositories.ManagerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.Locale;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Transactional
public class ManagerService {
    private static final Set<String> USER_STATUSES = Set.of("ACTIVE", "INACTIVE", "PENDING");
    private static final Set<String> CLASS_STATUSES = Set.of("ACTIVE", "INACTIVE");
    private static final Set<String> SCHEDULE_STATUSES = Set.of("SCHEDULED", "COMPLETED", "CANCELLED");

    private final ManagerRepository managerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;
    private final ResourceImageStorageService resourceImageStorageService;
    private final com.team4.sportscenter.modules.member.services.PackageBenefitsService packageBenefits;
    private final PackageTypeCatalog packageTypes;
    private final com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;

    public String updateResourceImage(String resource, Integer id, MultipartFile file, String actor) {
        String previous = managerRepository.lockResourceImage(resource, id);
        String stored = resourceImageStorageService.store(file);
        replaceResourceImage(resource, id, previous, stored, actor);
        return stored;
    }

    public void removeResourceImage(String resource, Integer id, String actor) {
        String previous = managerRepository.lockResourceImage(resource, id);
        replaceResourceImage(resource, id, previous, null, actor);
    }

    private void replaceResourceImage(String resource, Integer id, String previous, String stored, String actor) {
        // Rollback removes only the new file; the old image stays valid until commit.
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { resourceImageStorageService.delete(previous); }
            @Override public void afterCompletion(int status) {
                if (status != TransactionSynchronization.STATUS_COMMITTED) resourceImageStorageService.delete(stored);
            }
        });
        var imageBefore="packages".equals(resource)?commerce.detail(id):Map.<String,Object>of();
        managerRepository.updateResourceImage(resource, id, stored);
        if("packages".equals(resource)){commerce.audit(id,"UPDATE_IMAGE",actor,imageBefore,commerce.detail(id));return;}
        audit(actor, stored == null ? "REMOVE_IMAGE" : "UPDATE_IMAGE", resource.toUpperCase(Locale.ROOT), id, stored == null ? "Removed resource image" : "Updated resource image");
    }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>(managerRepository.dashboard());
        result.put("recentActivity", managerRepository.recentActivity());
        result.putAll(managerRepository.operationalOverview());
        result.put("lowRegistrationList", managerRepository.lowRegistrationSessions());
        result.put("expiringMembershipList", managerRepository.expiringMemberships());
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> users(String keyword, String role, String status) {
        return managerRepository.users(keyword, normalizeFilter(role), normalizeFilter(status));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> roles() { return managerRepository.roles(); }

    public Integer createUser(ManagerRequests.UserRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), USER_STATUSES);
        validatePassword(request.password());
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("A password is required when creating an account");
        }
        if (userRepository.existsByEmail(normalizeEmail(request.email()))) {
            throw new IllegalArgumentException("This email address is already in use");
        }
        Role role = findRole(request.roleId());
        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(normalizeEmail(request.email()))
                .phone(blankToNull(request.phone()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(request.status().toUpperCase())
                .forcePasswordChange(Boolean.TRUE.equals(request.forcePasswordChange()))
                .build();
        userRepository.save(user);
        audit(actor, "CREATE", "USER", user.getUserId(), "Created account " + user.getEmail() + " - " + role.getRoleName());
        return user.getUserId();
    }

    public void updateUser(Integer id, ManagerRequests.UserRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), USER_STATUSES);
        validatePassword(request.password());
        User user = findUser(id);
        boolean isSelf = user.getEmail().equalsIgnoreCase(actor);
        if (isSelf && (!user.getRole().getRoleId().equals(request.roleId()) || !"ACTIVE".equalsIgnoreCase(request.status()))) {
            throw new IllegalArgumentException("You cannot deactivate or downgrade the account currently signed in");
        }
        userRepository.findByEmail(request.email().trim()).filter(other -> !other.getUserId().equals(id)).ifPresent(other -> {
            throw new IllegalArgumentException("This email address is already in use");
        });
        Role role = findRole(request.roleId());
        validateLastManager(user, role, request.status());
        validateCoachChange(user, role, request.status());
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizeEmail(request.email()));
        user.setPhone(blankToNull(request.phone()));
        user.setRole(role);
        user.setStatus(request.status().toUpperCase());
        user.setForcePasswordChange(Boolean.TRUE.equals(request.forcePasswordChange()));
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        userRepository.save(user);
        audit(actor, "UPDATE", "USER", id, "Updated account " + user.getEmail() + " - " + role.getRoleName());
    }

    public void deleteUser(Integer id, String actor) {
        managerRepository.lockOperations();
        User user = findUser(id);
        if (user.getEmail().equalsIgnoreCase(actor)) {
            throw new IllegalArgumentException("You cannot delete the account currently signed in");
        }
        validateLastManager(user, user.getRole(), "INACTIVE");
        validateCoachChange(user, user.getRole(), "INACTIVE");
        String email = user.getEmail();
        String avatar = user.getAvatarPath();
        userRepository.delete(user);
        userRepository.flush();
        audit(actor, "DELETE", "USER", id, "Deleted account " + email);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() { avatarStorageService.delete(avatar); }
        });
    }

    public void updateUserStatus(Integer id, ManagerRequests.UserStatusRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), USER_STATUSES);
        User user = findUser(id);
        if ("INACTIVE".equalsIgnoreCase(request.status()) && (request.reason() == null || request.reason().isBlank())) {
            throw new IllegalArgumentException("A reason is required when locking an account");
        }
        validateLastManager(user, user.getRole(), request.status());
        validateCoachChange(user, user.getRole(), request.status());
        if (user.getEmail().equalsIgnoreCase(actor) && !"ACTIVE".equalsIgnoreCase(request.status())) {
            throw new IllegalArgumentException("You cannot deactivate the account currently signed in");
        }
        user.setStatus(request.status().toUpperCase());
        userRepository.save(user);
        String reason = request.reason() == null || request.reason().isBlank() ? "" : " - Reason: " + request.reason().trim();
        audit(actor, "STATUS_CHANGE", "USER", id, "Changed " + user.getEmail() + " status to " + user.getStatus() + reason);
    }

    public String updateUserAvatar(Integer id, MultipartFile file, String actor) {
        User user = findUser(id);
        String previousAvatar = user.getAvatarPath();
        String storedAvatar = avatarStorageService.store(file);
        user.setAvatarPath(storedAvatar);
        userRepository.save(user);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() { avatarStorageService.delete(previousAvatar); }

            @Override
            public void afterCompletion(int status) {
                if (status != TransactionSynchronization.STATUS_COMMITTED) avatarStorageService.delete(storedAvatar);
            }
        });
        audit(actor, "UPDATE_AVATAR", "USER", id, "Updated avatar for " + user.getEmail());
        return storedAvatar;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> subjects() { return managerRepository.subjects(); }

    public int saveSubject(Integer id, ManagerRequests.SubjectRequest request, String actor) {
        if (id != null) managerRepository.requireSubject(id);
        int savedId = managerRepository.saveSubject(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "SUBJECT", savedId, request.subjectName());
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> rooms() { return managerRepository.rooms(); }

    public int saveRoom(Integer id, ManagerRequests.RoomRequest request, String actor) {
        managerRepository.lockOperations();
        if (id != null) {
            managerRepository.requireRoom(id);
            if (request.capacity() < managerRepository.requiredRoomCapacity(id)) {
                throw new IllegalArgumentException("Room capacity cannot be lower than the maximum capacity of its assigned classes");
            }
        }
        int savedId = managerRepository.saveRoom(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "ROOM", savedId, request.roomName() + " - " + request.capacity() + " seats");
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> classes() { return managerRepository.classes(); }

    public int saveClass(Integer id, ManagerRequests.ClassRequest request, String actor) {
        managerRepository.lockOperations();
        if (id != null) {
            var previous=managerRepository.classAssignment(id);
            if(!request.subjectId().equals(((Number)previous.get("subjectId")).intValue()) && managerRepository.hasClassBookings(id))
                throw new IllegalArgumentException("A class with registrations cannot be moved to another subject.");
            if (request.maxSlots() < managerRepository.peakBookings(id)) {
                throw new IllegalArgumentException("Class capacity cannot be lower than the number of booked or held seats in a session");
            }
            if ("INACTIVE".equalsIgnoreCase(request.status()) && managerRepository.hasUpcomingSchedules(id)) {
                throw new IllegalArgumentException("Cancel upcoming sessions before deactivating the class");
            }
        }
        managerRepository.requireSubject(request.subjectId());
        validateStatus(request.status(), CLASS_STATUSES);
        User coach = findUser(request.coachId());
        if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !"ACTIVE".equalsIgnoreCase(coach.getStatus())) {
            throw new IllegalArgumentException("Only active coaches can be assigned");
        }
        Integer capacity = managerRepository.roomCapacity(request.roomId());
        if (capacity == null) throw new IllegalArgumentException("The room does not exist");
        if (request.maxSlots() > capacity) throw new IllegalArgumentException("Maximum class capacity exceeds room capacity");
        if (id != null && managerRepository.hasAssignmentConflict(id, request.coachId(), request.roomId())) {
            throw new IllegalArgumentException("The new assignment conflicts with the coach or room schedule");
        }
        if(id!=null) packageBenefits.validateClassRoom(id,request.roomId());
        int savedId = managerRepository.saveClass(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "CLASS", savedId, request.className() + " - HLV " + coach.getFullName());
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> schedules(LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        return managerRepository.schedules(from, to);
    }

    @Transactional(readOnly = true)
    public Map<String,Object> overviewPage(String block,int page,int size) {
        if(page<0 || page>100000 || size<1 || size>50) throw new IllegalArgumentException("Invalid page or size");
        return block.equals("attention") ? managerRepository.attentionPage(page,size) : managerRepository.renewalPage(page,size);
    }

    @Transactional(readOnly = true)
    public List<Map<String,Object>> filteredSchedules(LocalDate from,LocalDate to,boolean low,String status,boolean excludeUrgent) {
        validateDateRange(from,to);
        if(status!=null && !status.isBlank()) validateStatus(status,SCHEDULE_STATUSES);
        return managerRepository.filteredSchedules(from,to,low,status,excludeUrgent);
    }

    public int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), SCHEDULE_STATUSES);
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("The end time must be after the start time");
        }
        Map<String, Object> assignment = managerRepository.classAssignment(request.classId());
        Map<String, Object> previous = id == null ? null : managerRepository.schedule(id);
        boolean cancelled = "CANCELLED".equalsIgnoreCase(request.status());
        boolean completed = "COMPLETED".equalsIgnoreCase(request.status());
        boolean timingChanged = previous == null || !request.startTime().equals(previous.get("startTime"))
                || !request.endTime().equals(previous.get("endTime"));
        if (previous != null) {
            if (!"SCHEDULED".equals(previous.get("status"))) {
                throw new IllegalArgumentException("Completed or cancelled sessions cannot be edited; create a new session instead");
            }
            if (!request.classId().equals(((Number) previous.get("classId")).intValue())
                    && !managerRepository.scheduleBookings(id).isEmpty()) {
                throw new IllegalArgumentException("A session with bookings cannot be moved to another class");
            }
            if ((cancelled || completed) && (timingChanged
                    || !request.classId().equals(((Number) previous.get("classId")).intValue()))) {
                throw new IllegalArgumentException("Keep the class and times unchanged when cancelling or completing a session");
            }
        }
        if (id == null && (cancelled || completed)) {
            throw new IllegalArgumentException("A new session must have Scheduled status");
        }
        if (completed && request.endTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Only sessions that have ended can be completed");
        }
        if (!cancelled && !completed) {
            if (!"ACTIVE".equals(assignment.get("status"))) {
                throw new IllegalArgumentException("Only active classes can be scheduled");
            }
            User coach = findUser(((Number) assignment.get("coachId")).intValue());
            if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !coach.isEnabled()) {
                throw new IllegalArgumentException("The assigned coach is no longer active; assign another coach");
            }
            if (timingChanged && !request.startTime().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("The new start time must be in the future");
            }
            if (id != null && timingChanged && managerRepository.hasMemberConflict(id, request.startTime(), request.endTime())) {
                throw new IllegalArgumentException("The new time conflicts with the schedule of a registered student");
            }
            if (id != null && timingChanged) packageBenefits.validateSessionDates(id,request.startTime(),request.endTime());
        }
        Integer coachId = ((Number) assignment.get("coachId")).intValue();
        Integer roomId = ((Number) assignment.get("roomId")).intValue();
        if (!cancelled && !completed
                && managerRepository.hasScheduleConflict(id, coachId, roomId, request.startTime(), request.endTime())) {
            throw new IllegalArgumentException("The time slot conflicts with the coach or room schedule");
        }
        int savedId = managerRepository.saveSchedule(id, request);
        if (id != null && cancelled) {
            managerRepository.notifyScheduleBookings(id, "Buổi học đã hủy",
                    assignment.get("className") + " lúc " + request.startTime()
                            + " đã hủy. Liên hệ lễ tân để được hỗ trợ về học phí.");
            managerRepository.cancelScheduleBookings(id);
        } else if (id != null && timingChanged) {
            managerRepository.notifyScheduleBookings(id, "Thay đổi lịch học",
                    assignment.get("className") + " chuyển sang " + request.startTime() + " - " + request.endTime());
        }
        audit(actor, id == null ? "CREATE" : "UPDATE", "SCHEDULE", savedId,
                request.startTime() + " - " + request.endTime() + " / " + request.status());
        return savedId;
    }

    public List<Integer> createScheduleSeries(ManagerRequests.ScheduleSeriesRequest request, String actor) {
        managerRepository.lockOperations();
        if (request.occurrences() < 2 || request.occurrences() > 52 || request.intervalWeeks() < 1 || request.intervalWeeks() > 4) {
            throw new IllegalArgumentException("Create 2 to 52 sessions at intervals of 1 to 4 weeks");
        }
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < request.occurrences(); i++) {
            long weeks = (long) i * request.intervalWeeks();
            ids.add(saveSchedule(null, new ManagerRequests.ScheduleRequest(request.classId(),
                    request.startTime().plusWeeks(weeks), request.endTime().plusWeeks(weeks), "SCHEDULED"), actor));
        }
        return ids;
    }

    private Map<String,Object> planningAssignment(Integer classId) {
        var assignment=managerRepository.classAssignment(classId);
        if (!"ACTIVE".equals(assignment.get("status"))) throw new IllegalArgumentException("Only active classes can be scheduled");
        var coach=findUser(((Number)assignment.get("coachId")).intValue());
        if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !coach.isEnabled())
            throw new IllegalArgumentException("The assigned coach is no longer active; assign another coach");
        if (managerRepository.hasClassBookings(classId))
            throw new IllegalArgumentException("Automatic planning is only available before class registration. Manage existing sessions or make-up sessions separately.");
        return assignment;
    }

    @Transactional(readOnly=true)
    public Map<String,Object> previewSchedulePlan(ManagerRequests.SchedulePlanRequest request) {
        var now=LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        SchedulePlanner.validateRules(request,now);
        var assignment=planningAssignment(request.classId());
        int coachId=((Number)assignment.get("coachId")).intValue(), roomId=((Number)assignment.get("roomId")).intValue();
        var busy=managerRepository.occupiedSlots(coachId,roomId,request.fromDate().atStartOfDay().minusMinutes(request.breakMinutes()),request.toDate().plusDays(1).atStartOfDay().plusMinutes(request.breakMinutes()));
        var plan=SchedulePlanner.propose(request,busy,now);
        return Map.of("sessions",plan.sessions(),"missing",plan.missing(),"skipped",plan.skipped(),"coachId",coachId,"roomId",roomId);
    }

    public List<Integer> commitSchedulePlan(ManagerRequests.SchedulePlanCommitRequest request, String actor) {
        managerRepository.lockOperations();
        var now=LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        var rules=request.rules(); SchedulePlanner.validateRules(rules,now);
        var assignment=planningAssignment(rules.classId());
        int coachId=((Number)assignment.get("coachId")).intValue(), roomId=((Number)assignment.get("roomId")).intValue();
        if (!java.util.Objects.equals(request.coachId(),coachId) || !java.util.Objects.equals(request.roomId(),roomId))
            throw new IllegalArgumentException("Class assignment changed. Generate a new preview.");
        if(request.sessions()==null || request.sessions().size()!=rules.sessions())
            throw new IllegalArgumentException("Generate a complete plan before saving.");
        var busy=new ArrayList<>(managerRepository.occupiedSlots(coachId,roomId,rules.fromDate().atStartOfDay().minusMinutes(rules.breakMinutes()),rules.toDate().plusDays(1).atStartOfDay().plusMinutes(rules.breakMinutes())));
        var dates=new java.util.HashSet<java.time.LocalDate>();
        for(var session:request.sessions()) {
            SchedulePlanner.validateSession(rules,session,now);
            if(!dates.add(session.startTime().toLocalDate())) throw new IllegalArgumentException("Plan at most one session per day.");
            if(!SchedulePlanner.free(session,busy,rules.breakMinutes()))
                throw new IllegalArgumentException("The preview conflicts with a coach or room booking. Generate a new preview.");
            busy.add(new SchedulePlanner.BusyPeriod(session.startTime(),session.endTime()));
        }
        List<Integer> ids=new ArrayList<>();
        for(var session:request.sessions()) ids.add(saveSchedule(null,new ManagerRequests.ScheduleRequest(rules.classId(),session.startTime(),session.endTime(),"SCHEDULED"),actor));
        return ids;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> scheduleBookings(Integer id) {
        managerRepository.schedule(id);
        return managerRepository.scheduleBookings(id);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> packages() {
        var packages=managerRepository.packages();
        var allBenefits=packageBenefits.allPackageBenefits();
        var typeNames=packageTypes.names();
        for(var pkg:packages)pkg.put("packageTypeName",typeNames.get(pkg.get("packageType")));
        for(var pkg:packages) pkg.put("benefits",allBenefits.getOrDefault(((Number)pkg.get("packageId")).intValue(),List.of()));
        return packages;
    }

    public int savePackage(Integer id, ManagerRequests.PackageRequest request, String actor) {
        managerRepository.lockOperations();
        packageTypes.require(request.packageType());
        if (id != null) managerRepository.requirePackage(id);
        var before=id==null?Map.<String,Object>of():commerce.detail(id);
        int savedId = managerRepository.savePackage(id, request);
        commerce.saveContent(savedId,request);
        packageBenefits.saveDefinition(savedId,request.packageType(),request.benefits());
        commerce.audit(savedId,id==null?"CREATE":"UPDATE",actor,before,commerce.detail(savedId));
        return savedId;
    }

    public int savePackageWithImage(Integer id, ManagerRequests.PackageRequest request, MultipartFile image, boolean removeImage, String actor) {
        if (image != null && removeImage) throw new IllegalArgumentException("Choose either a replacement photo or removal.");
        int savedId=savePackage(id,request,actor);
        if(image!=null) updateResourceImage("packages",savedId,image,actor);
        else if(removeImage) removeResourceImage("packages",savedId,actor);
        return savedId;
    }

    @Transactional(readOnly=true)
    public List<Map<String,Object>> packageTypes(){return packageTypes.list();}
    public String savePackageType(String code,ManagerRequests.PackageTypeRequest request,String actor){
        managerRepository.lockOperations();
        String saved=packageTypes.save(code,request.typeName(),request.requiresSubjects());
        audit(actor,code==null?"CREATE":"UPDATE","PACKAGE_TYPE",saved,request.typeName());
        return saved;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report(LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        return managerRepository.report(from, to);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> auditLogs() { return auditLogRepository.findTop100ByOrderByCreatedAtDesc(); }

    private User findUser(Integer id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("The account does not exist"));
    }

    private Role findRole(Integer id) {
        return roleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("The role does not exist"));
    }

    private void validateStatus(String status, Set<String> allowed) {
        if (status == null || !allowed.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Invalid status");
        }
    }

    private String normalizeFilter(String value) { return value == null || value.isBlank() ? "ALL" : value; }
    private String normalizeEmail(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private void validatePassword(String password) {
        if (password != null && !password.isEmpty()
                && (password.isBlank() || password.length() < 6 || password.getBytes(StandardCharsets.UTF_8).length > 72)) {
            throw new IllegalArgumentException("The password must contain at least 6 characters and no more than 72 UTF-8 bytes");
        }
    }

    private void validateCoachChange(User user, Role role, String status) {
        if ("Coach".equalsIgnoreCase(user.getRole().getRoleName())
                && (!"Coach".equalsIgnoreCase(role.getRoleName()) || !"ACTIVE".equalsIgnoreCase(status))
                && managerRepository.coachHasAssignments(user.getUserId())) {
            throw new IllegalArgumentException("Reassign the coach's classes before deactivating the account or changing its role");
        }
    }

    private void validateLastManager(User user, Role nextRole, String nextStatus) {
        boolean currentlyActiveManager = "Center Manager".equalsIgnoreCase(user.getRole().getRoleName())
                && "ACTIVE".equalsIgnoreCase(user.getStatus());
        boolean remainsActiveManager = "Center Manager".equalsIgnoreCase(nextRole.getRoleName())
                && "ACTIVE".equalsIgnoreCase(nextStatus);
        if (currentlyActiveManager && !remainsActiveManager && managerRepository.activeManagerCount() <= 1) {
            throw new IllegalArgumentException("The last active manager cannot be locked or demoted");
        }
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from) || to.isAfter(from.plusYears(1))) {
            throw new IllegalArgumentException("Select a valid date range of no more than one year");
        }
    }

    private void audit(String actor, String action, String entityType, Object entityId, String details) {
        auditLogRepository.save(AuditLog.builder()
                .actorEmail(actor)
                .action(action)
                .entityType(entityType)
                .entityId(String.valueOf(entityId))
                .details(details)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
