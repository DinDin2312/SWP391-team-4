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
    // Sessions that will still take place: a substitute coach or a make-up time does not cancel them.
    public static final Set<String> ACTIVE_SESSION_STATUSES = Set.of("SCHEDULED", "SUBSTITUTE_ASSIGNED", "RESCHEDULED");

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

    public int saveSubjectWithImage(Integer id, ManagerRequests.SubjectRequest request, MultipartFile image, boolean removeImage, String actor) {
        if(image!=null && removeImage) throw new IllegalArgumentException("Choose either a new photo or photo removal.");
        int savedId=saveSubject(id,request,actor);
        if(image!=null) updateResourceImage("subjects",savedId,image,actor);
        else if(removeImage) removeResourceImage("subjects",savedId,actor);
        return savedId;
    }

    public int saveRoomWithImage(Integer id, ManagerRequests.RoomRequest request, MultipartFile image, boolean removeImage, String actor) {
        if(image!=null && removeImage) throw new IllegalArgumentException("Choose either a new photo or photo removal.");
        int savedId=saveRoom(id,request,actor);
        if(image!=null) updateResourceImage("rooms",savedId,image,actor);
        else if(removeImage) removeResourceImage("rooms",savedId,actor);
        return savedId;
    }

    public int saveClassWithImage(Integer id, ManagerRequests.ClassRequest request, MultipartFile image, boolean removeImage, String actor) {
        if(image!=null && removeImage) throw new IllegalArgumentException("Choose either a new photo or photo removal.");
        int savedId=saveClass(id,request,actor);
        if(image!=null) updateResourceImage("classes",savedId,image,actor);
        else if(removeImage) removeResourceImage("classes",savedId,actor);
        return savedId;
    }

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
    public List<Map<String, Object>> decisions() { return managerRepository.decisions(); }

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>(managerRepository.dashboard());
        result.put("recentActivity", managerRepository.recentActivity());
        result.putAll(managerRepository.operationalOverview());
        result.put("pulse", managerRepository.todayPulse());
        result.put("decisions", managerRepository.decisions());
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
        userRepository.saveAndFlush(user);
        saveCoachSubjects(user,request);
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
        userRepository.saveAndFlush(user);
        saveCoachSubjects(user,request);
        audit(actor, "UPDATE", "USER", id, "Updated account " + user.getEmail() + " - " + role.getRoleName());
    }

    private void saveCoachSubjects(User user,ManagerRequests.UserRequest request) {
        if("Coach".equalsIgnoreCase(user.getRole().getRoleName())) {
            if(request.subjectIds()!=null) {
                if(!request.subjectIds().containsAll(managerRepository.activeCoachSubjects(user.getUserId())))
                    throw new IllegalArgumentException("Reassign or deactivate active classes before removing their coach's subject.");
                managerRepository.saveCoachSubjects(user.getUserId(),request.subjectIds());
            }
        } else managerRepository.saveCoachSubjects(user.getUserId(),List.of());
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
        if (request.status() != null) validateStatus(request.status(), CLASS_STATUSES);
        managerRepository.lockOperations();
        if (id != null) managerRepository.requireSubject(id);
        // Session length and slots are set once for the whole center, not per subject.
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
        if (request.status() != null) validateStatus(request.status(), Set.of("ACTIVE", "MAINTENANCE", "INACTIVE"));
        int savedId = managerRepository.saveRoom(id, request);
        if (request.subjectIds() != null) managerRepository.replaceRoomSubjects(savedId, request.subjectIds());
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
        if(!managerRepository.coachTeachesSubject(request.coachId(),request.subjectId()))
            throw new IllegalArgumentException("The selected coach is not assigned to this subject.");
        Integer capacity = managerRepository.roomCapacity(request.roomId());
        if (capacity == null) throw new IllegalArgumentException("The room does not exist");
        var previousAssignment = id == null ? null : managerRepository.classAssignment(id);
        boolean roomChanged = previousAssignment == null || !request.roomId().equals(((Number) previousAssignment.get("roomId")).intValue());
        boolean subjectChanged = previousAssignment == null || !request.subjectId().equals(((Number) previousAssignment.get("subjectId")).intValue());
        if (roomChanged && !"ACTIVE".equals(managerRepository.roomStatus(request.roomId())))
            throw new IllegalArgumentException("This room is under maintenance or no longer in use. Choose another room.");
        if (subjectChanged && !"ACTIVE".equals(managerRepository.subjectStatus(request.subjectId())))
            throw new IllegalArgumentException("This subject is no longer offered. Choose another subject.");
        if (request.maxSlots() > capacity) throw new IllegalArgumentException("Maximum class capacity exceeds room capacity");
        if (id != null && managerRepository.hasAssignmentConflict(id, request.coachId(), request.roomId())) {
            var clash = managerRepository.assignmentConflict(id, request.coachId(), request.roomId());
            if (clash == null) throw new IllegalArgumentException("The new assignment conflicts with the coach or room schedule");
            var at = clash.get("startTime") instanceof java.sql.Timestamp ts ? ts.toLocalDateTime() : (LocalDateTime) clash.get("startTime");
            throw new IllegalArgumentException("Schedule conflict: " + ("coach".equals(clash.get("clash")) ? "the coach" : "the room")
                    + " already has " + clash.get("otherClass") + " at " + at.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")) + ".");
        }
        if(id!=null) packageBenefits.validateClassRoom(id,request.roomId());
        int savedId = managerRepository.saveClass(id, request);
        managerRepository.linkRoomSubject(request.roomId(), request.subjectId());
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

    @Transactional(readOnly=true)
    public Map<String,Object> classSlotPolicy(Integer classId) {
        var p=managerRepository.classSlotPolicy(classId);
        return Map.of("classId",classId,"opensAt",p.opensAt(),"closesAt",p.closesAt(),"breakMinutes",p.breakMinutes(),"durationMinutes",p.durationMinutes(),"starts",p.starts(),
            "courseLeadDays",managerRepository.courseLeadDays(),"earliestCourseStart",earliestCourseStart().toString());
    }
    public Map<String,Object> slotPolicy() {
        var p=managerRepository.slotPolicy();
        return Map.of("opensAt",p.opensAt(),"closesAt",p.closesAt(),"breakMinutes",p.breakMinutes(),"durationMinutes",p.durationMinutes(),"starts",p.starts(),
            "courseLeadDays",managerRepository.courseLeadDays(),"earliestCourseStart",earliestCourseStart().toString());
    }

    // A new course may start no earlier than today + the configured lead time.
    private java.time.LocalDate earliestCourseStart() {
        return java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(managerRepository.courseLeadDays());
    }

    private void requireCourseLead(java.time.LocalDate fromDate) {
        var earliest = earliestCourseStart();
        if (fromDate.isBefore(earliest))
            throw new IllegalArgumentException("A new course must start on or after " + earliest.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " (" + managerRepository.courseLeadDays() + " days notice).");
    }

    public Map<String,Object> saveCourseLeadDays(int days, String actor) {
        if (days < 0 || days > 180) throw new IllegalArgumentException("Choose 0 to 180 days of notice.");
        managerRepository.saveCourseLeadDays(days);
        audit(actor,"UPDATE","SCHEDULE_POLICY",1,"courseLeadDays=" + days);
        return slotPolicy();
    }
    public Map<String,Object> saveSlotPolicy(TeachingSlots.Policy policy,String actor) {
        managerRepository.lockOperations();
        var saved=new TeachingSlots.Policy(policy.opensAt(),policy.closesAt(),policy.breakMinutes(),policy.durationMinutes(),List.of());
        managerRepository.saveSlotPolicy(saved);
        audit(actor,"UPDATE","SCHEDULE_POLICY",1,"Giờ mở cửa " + saved.opensAt() + "–" + saved.closesAt() + ", mỗi buổi " + saved.durationMinutes() + " phút, chuyển ca " + saved.breakMinutes() + " phút");
        return slotPolicy();
    }
    private ManagerRequests.SchedulePlanRequest fixedRules(ManagerRequests.SchedulePlanRequest r) {
        var p=managerRepository.classSlotPolicy(r.classId());
        if(r.durationMinutes()==null || !r.durationMinutes().equals(p.durationMinutes()) || !java.util.Objects.equals(r.breakMinutes(),p.breakMinutes()))
            throw new IllegalArgumentException("Scheduling settings changed. Reload the fixed teaching slots.");
        return r;
    }
    public int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request, String actor) {
        return saveSchedule(id, request, actor, true);
    }

    private static final java.time.format.DateTimeFormatter AUDIT_TIME = java.time.format.DateTimeFormatter.ofPattern("dd/MM HH:mm");

    // record=false when the caller writes one summary entry for a whole batch.
    private int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request, String actor, boolean record) {
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
            if (!ACTIVE_SESSION_STATUSES.contains(String.valueOf(previous.get("status")))) {
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
        var policy=managerRepository.classSlotPolicy(request.classId());
        int changeover=previous==null?policy.breakMinutes():((Number)previous.get("changeoverMinutes")).intValue();
        if(timingChanged && !cancelled && !completed) {
            policy.validate(request.startTime(),request.endTime()); changeover=policy.breakMinutes();
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
                && managerRepository.hasScheduleConflict(id, coachId, roomId, request.startTime(), request.endTime().plusMinutes(changeover))) {
            throw new IllegalArgumentException("The time slot conflicts with the coach or room schedule");
        }
        int savedId = managerRepository.saveSchedule(id, request);
        managerRepository.setChangeover(savedId,changeover);
        // Editing a session that has a substitute coach or a make-up time keeps that status.
        if (previous != null && !cancelled && !completed && !"SCHEDULED".equals(previous.get("status"))
                && ACTIVE_SESSION_STATUSES.contains(String.valueOf(previous.get("status"))))
            managerRepository.setScheduleStatus(savedId, String.valueOf(previous.get("status")));
        if (id != null && cancelled) {
            managerRepository.notifyScheduleBookings(id, "Buổi học đã hủy",
                    assignment.get("className") + " lúc " + request.startTime()
                            + " đã hủy. Liên hệ lễ tân để được hỗ trợ về học phí.");
            managerRepository.cancelScheduleBookings(id);
        } else if (id != null && timingChanged) {
            managerRepository.notifyScheduleBookings(id, "Thay đổi lịch học",
                    assignment.get("className") + " chuyển sang " + request.startTime() + " - " + request.endTime());
        }
        if (record) {
            String change;
            if (id == null) change = request.startTime().format(AUDIT_TIME) + "–" + request.endTime().toLocalTime();
            else if (cancelled) change = "Hủy buổi " + request.startTime().format(AUDIT_TIME);
            else if (completed) change = "Hoàn thành buổi " + request.startTime().format(AUDIT_TIME);
            else if (timingChanged) change = ((LocalDateTime) previous.get("startTime")).format(AUDIT_TIME) + " → " + request.startTime().format(AUDIT_TIME);
            else change = "Cập nhật buổi " + request.startTime().format(AUDIT_TIME);
            audit(actor, id == null ? "CREATE" : cancelled ? "CANCEL" : "UPDATE", "SCHEDULE", savedId, change);
        }
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
                    request.startTime().plusWeeks(weeks), request.endTime().plusWeeks(weeks), "SCHEDULED"), actor, false));
        }
        audit(actor, "CREATE_SERIES", "CLASS", request.classId(), ids.size() + " buổi từ " + request.startTime().format(AUDIT_TIME));
        return ids;
    }

    public Map<String, Integer> enrollClassMembers(Integer scheduleId, String actor) {
        managerRepository.lockOperations();
        var schedule = managerRepository.schedule(scheduleId);
        if (!ACTIVE_SESSION_STATUSES.contains(String.valueOf(schedule.get("status")))) throw new IllegalArgumentException("Only scheduled sessions can receive members");
        var result = managerRepository.enrollClassMembers(scheduleId);
        if (result.get("added") > 0) {
            var assignment = managerRepository.classAssignment(((Number) schedule.get("classId")).intValue());
            managerRepository.notifyScheduleBookings(scheduleId, "Buổi học bổ sung", assignment.get("className") + " có thêm buổi lúc " + schedule.get("startTime") + ". Bạn đã được xếp vào buổi này.");
        }
        audit(actor, "ENROLL", "SCHEDULE", scheduleId, "Added " + result.get("added") + " class members, skipped " + result.get("skipped"));
        return result;
    }

    // Cancels every upcoming session (members are notified, seats released), then deactivates the class.
    public int deactivateClass(Integer id, String actor) {
        managerRepository.lockOperations();
        var assignment = managerRepository.classAssignment(id);
        List<Integer> upcoming = managerRepository.upcomingScheduleIds(id);
        for (Integer scheduleId : upcoming) {
            var s = managerRepository.schedule(scheduleId);
            saveSchedule(scheduleId, new ManagerRequests.ScheduleRequest(id, LocalDateTime.parse(String.valueOf(s.get("startTime"))),
                    LocalDateTime.parse(String.valueOf(s.get("endTime"))), "CANCELLED"), actor, false);
        }
        managerRepository.setClassStatus(id, "INACTIVE");
        audit(actor, "DEACTIVATE", "CLASS", id, upcoming.isEmpty() ? "Ngừng lớp" : "Ngừng lớp, hủy " + upcoming.size() + " buổi sắp tới");
        return upcoming.size();
    }

    private Map<String,Object> planningAssignment(Integer classId) {
        var assignment=managerRepository.classAssignment(classId);
        if (!"ACTIVE".equals(assignment.get("status"))) throw new IllegalArgumentException("Only active classes can be scheduled");
        if (!"ACTIVE".equals(managerRepository.roomStatus(((Number)assignment.get("roomId")).intValue())))
            throw new IllegalArgumentException("The class room is under maintenance or no longer in use. Move the class to another room first.");
        var coach=findUser(((Number)assignment.get("coachId")).intValue());
        if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !coach.isEnabled())
            throw new IllegalArgumentException("The assigned coach is no longer active; assign another coach");
        if (managerRepository.hasClassBookings(classId))
            throw new IllegalArgumentException("Automatic planning is only available before class registration. Manage existing sessions or make-up sessions separately.");
        return assignment;
    }

    @Transactional(readOnly=true)
    public Map<String,Object> scheduleAvailability(ManagerRequests.SchedulePlanRequest request) {
        var now=LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        fixedRules(request);SchedulePlanner.validateRules(request,now);
        var assignment=planningAssignment(request.classId());
        int coachId=((Number)assignment.get("coachId")).intValue(),roomId=((Number)assignment.get("roomId")).intValue();
        var busy=managerRepository.occupiedSlots(coachId,roomId,request.fromDate().atStartOfDay().minusMinutes(request.breakMinutes()),request.toDate().plusDays(1).atStartOfDay().plusMinutes(request.breakMinutes()));
        return Map.of("slots",CourseSchedulePlanner.availability(request,busy,now,managerRepository.classSlotPolicy(request.classId())));
    }

    @Transactional(readOnly=true)
    public Map<String,Object> previewSchedulePlan(ManagerRequests.SchedulePlanRequest request) {
        var now=LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        fixedRules(request); SchedulePlanner.validateRules(request,now); requireCourseLead(request.fromDate());
        var assignment=planningAssignment(request.classId());
        int coachId=((Number)assignment.get("coachId")).intValue(), roomId=((Number)assignment.get("roomId")).intValue();
        var busy=managerRepository.occupiedSlots(coachId,roomId,request.fromDate().atStartOfDay().minusMinutes(request.breakMinutes()),request.toDate().plusDays(1).atStartOfDay().plusMinutes(request.breakMinutes()));
        if(request.weekdaySlots()!=null) {
            var weekly=CourseSchedulePlanner.propose(request,busy,now,managerRepository.classSlotPolicy(request.classId()));
            return Map.of("sessions",weekly.sessions(),"missing",weekly.missing(),"skipped",weekly.skipped(),
                "conflicts",weekly.conflicts(),"requestedSessions",weekly.requestedSessions(),"coachId",coachId,"roomId",roomId);
        }
        var plan=SchedulePlanner.proposeFixed(request,busy,now,managerRepository.classSlotPolicy(request.classId()));
        return Map.of("sessions",plan.sessions(),"missing",plan.missing(),"skipped",plan.skipped(),"coachId",coachId,"roomId",roomId);
    }

    public List<Integer> commitSchedulePlan(ManagerRequests.SchedulePlanCommitRequest request, String actor) {
        managerRepository.lockOperations();
        var now=LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        var rules=fixedRules(request.rules()); SchedulePlanner.validateRules(rules,now); requireCourseLead(rules.fromDate());
        var assignment=planningAssignment(rules.classId());
        int coachId=((Number)assignment.get("coachId")).intValue(), roomId=((Number)assignment.get("roomId")).intValue();
        if (!java.util.Objects.equals(request.coachId(),coachId) || !java.util.Objects.equals(request.roomId(),roomId))
            throw new IllegalArgumentException("Class assignment changed. Generate a new preview.");
        if(request.sessions()==null || request.sessions().size()!=rules.sessions())
            throw new IllegalArgumentException("Generate a complete plan before saving.");
        var busy=new ArrayList<>(managerRepository.occupiedSlots(coachId,roomId,rules.fromDate().atStartOfDay().minusMinutes(rules.breakMinutes()),rules.toDate().plusDays(1).atStartOfDay().plusMinutes(rules.breakMinutes())));
        if(rules.weekdaySlots()!=null) {
            var expected=CourseSchedulePlanner.propose(rules,busy,now,managerRepository.classSlotPolicy(rules.classId()));
            if(expected.missing()!=0 || !expected.sessions().equals(request.sessions()))
                throw new IllegalArgumentException("The weekly plan changed or contains conflicts. Generate a new preview.");
        }
        var dates=new java.util.HashSet<java.time.LocalDate>();
        for(var session:request.sessions()) {
            if(rules.weekdaySlots()==null) SchedulePlanner.validateSession(rules,session,now);
            managerRepository.classSlotPolicy(rules.classId()).validate(session.startTime(),session.endTime());
            if(!dates.add(session.startTime().toLocalDate())) throw new IllegalArgumentException("Plan at most one session per day.");
            if(!SchedulePlanner.free(new ManagerRequests.PlannedSession(session.startTime(),session.endTime().plusMinutes(rules.breakMinutes())),busy,0))
                throw new IllegalArgumentException("The preview conflicts with a coach or room booking. Generate a new preview.");
            busy.add(new SchedulePlanner.BusyPeriod(session.startTime(),session.endTime().plusMinutes(rules.breakMinutes())));
        }
        List<Integer> ids=new ArrayList<>();
        for(var session:request.sessions()) ids.add(saveSchedule(null,new ManagerRequests.ScheduleRequest(rules.classId(),session.startTime(),session.endTime(),"SCHEDULED"),actor,false));
        if(!ids.isEmpty()) audit(actor,"SCHEDULE_COURSE","CLASS",rules.classId(),ids.size()+" buổi từ "+request.sessions().get(0).startTime().format(AUDIT_TIME));
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
    public Map<String, Object> coachTeachingReport(LocalDate from, LocalDate to, Integer coachId) {
        validateDateRange(from, to);
        return managerRepository.coachTeachingReport(from, to, coachId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> auditSearch(String q, String type, java.time.LocalDate from, java.time.LocalDate to, int page, int size) {
        return managerRepository.auditSearch(q, type, from, to, Math.max(0, page), Math.min(100, Math.max(1, size)));
    }

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
