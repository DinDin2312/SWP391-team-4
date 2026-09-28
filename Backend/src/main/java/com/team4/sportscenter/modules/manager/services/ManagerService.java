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

    @Transactional(readOnly = true)
    public Map<String, Object> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>(managerRepository.dashboard());
        result.put("recentActivity", managerRepository.recentActivity());
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
            throw new IllegalArgumentException("Mật khẩu là bắt buộc khi tạo tài khoản");
        }
        if (userRepository.existsByEmail(normalizeEmail(request.email()))) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        Role role = findRole(request.roleId());
        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(normalizeEmail(request.email()))
                .phone(blankToNull(request.phone()))
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(role)
                .status(request.status().toUpperCase())
                .build();
        userRepository.save(user);
        audit(actor, "CREATE", "USER", user.getUserId(), "Tạo tài khoản " + user.getEmail() + " - " + role.getRoleName());
        return user.getUserId();
    }

    public void updateUser(Integer id, ManagerRequests.UserRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), USER_STATUSES);
        validatePassword(request.password());
        User user = findUser(id);
        boolean isSelf = user.getEmail().equalsIgnoreCase(actor);
        if (isSelf && (!user.getRole().getRoleId().equals(request.roleId()) || !"ACTIVE".equalsIgnoreCase(request.status()))) {
            throw new IllegalArgumentException("Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập");
        }
        userRepository.findByEmail(request.email().trim()).filter(other -> !other.getUserId().equals(id)).ifPresent(other -> {
            throw new IllegalArgumentException("Email đã được sử dụng");
        });
        Role role = findRole(request.roleId());
        validateCoachChange(user, role, request.status());
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizeEmail(request.email()));
        user.setPhone(blankToNull(request.phone()));
        user.setRole(role);
        user.setStatus(request.status().toUpperCase());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        userRepository.save(user);
        audit(actor, "UPDATE", "USER", id, "Cập nhật tài khoản " + user.getEmail() + " - " + role.getRoleName());
    }

    public void updateUserStatus(Integer id, ManagerRequests.UserStatusRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), USER_STATUSES);
        User user = findUser(id);
        validateCoachChange(user, user.getRole(), request.status());
        if (user.getEmail().equalsIgnoreCase(actor) && !"ACTIVE".equalsIgnoreCase(request.status())) {
            throw new IllegalArgumentException("Không thể tự khóa tài khoản đang đăng nhập");
        }
        user.setStatus(request.status().toUpperCase());
        userRepository.save(user);
        audit(actor, "STATUS_CHANGE", "USER", id, "Chuyển trạng thái " + user.getEmail() + " sang " + user.getStatus());
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
                throw new IllegalArgumentException("Sức chứa phòng không được nhỏ hơn sĩ số tối đa của các lớp đang phân công");
            }
        }
        int savedId = managerRepository.saveRoom(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "ROOM", savedId, request.roomName() + " - " + request.capacity() + " chỗ");
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> classes() { return managerRepository.classes(); }

    public int saveClass(Integer id, ManagerRequests.ClassRequest request, String actor) {
        managerRepository.lockOperations();
        if (id != null) {
            managerRepository.classAssignment(id);
            if (request.maxSlots() < managerRepository.peakBookings(id)) {
                throw new IllegalArgumentException("Sĩ số không được nhỏ hơn số chỗ đã đặt hoặc đang giữ trong một buổi");
            }
            if ("INACTIVE".equalsIgnoreCase(request.status()) && managerRepository.hasUpcomingSchedules(id)) {
                throw new IllegalArgumentException("Hãy hủy các buổi sắp tới trước khi tạm dừng lớp");
            }
        }
        managerRepository.requireSubject(request.subjectId());
        validateStatus(request.status(), CLASS_STATUSES);
        User coach = findUser(request.coachId());
        if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !"ACTIVE".equalsIgnoreCase(coach.getStatus())) {
            throw new IllegalArgumentException("Chỉ có thể phân công huấn luyện viên đang hoạt động");
        }
        Integer capacity = managerRepository.roomCapacity(request.roomId());
        if (capacity == null) throw new IllegalArgumentException("Phòng tập không tồn tại");
        if (request.maxSlots() > capacity) throw new IllegalArgumentException("Số học viên tối đa vượt sức chứa phòng");
        if (id != null && managerRepository.hasAssignmentConflict(id, request.coachId(), request.roomId())) {
            throw new IllegalArgumentException("Phân công mới làm trùng lịch huấn luyện viên hoặc phòng tập");
        }
        int savedId = managerRepository.saveClass(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "CLASS", savedId, request.className() + " - HLV " + coach.getFullName());
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> schedules(LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        return managerRepository.schedules(from, to);
    }

    public int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request, String actor) {
        managerRepository.lockOperations();
        validateStatus(request.status(), SCHEDULE_STATUSES);
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }
        Map<String, Object> assignment = managerRepository.classAssignment(request.classId());
        Map<String, Object> previous = id == null ? null : managerRepository.schedule(id);
        boolean cancelled = "CANCELLED".equalsIgnoreCase(request.status());
        boolean completed = "COMPLETED".equalsIgnoreCase(request.status());
        boolean timingChanged = previous == null || !request.startTime().equals(previous.get("startTime"))
                || !request.endTime().equals(previous.get("endTime"));
        if (previous != null) {
            if (!"SCHEDULED".equals(previous.get("status"))) {
                throw new IllegalArgumentException("Buổi đã hoàn thành hoặc đã hủy không thể sửa; hãy tạo buổi mới");
            }
            if (!request.classId().equals(((Number) previous.get("classId")).intValue())
                    && !managerRepository.scheduleBookings(id).isEmpty()) {
                throw new IllegalArgumentException("Không thể chuyển buổi đã có đăng ký sang lớp khác");
            }
            if ((cancelled || completed) && (timingChanged
                    || !request.classId().equals(((Number) previous.get("classId")).intValue()))) {
                throw new IllegalArgumentException("Giữ nguyên lớp và giờ học khi hủy hoặc hoàn thành buổi");
            }
        }
        if (id == null && (cancelled || completed)) {
            throw new IllegalArgumentException("Buổi mới phải có trạng thái Đã xếp");
        }
        if (completed && request.endTime().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Chỉ được hoàn thành buổi học đã kết thúc");
        }
        if (!cancelled && !completed) {
            if (!"ACTIVE".equals(assignment.get("status"))) {
                throw new IllegalArgumentException("Chỉ có thể xếp lịch cho lớp đang hoạt động");
            }
            User coach = findUser(((Number) assignment.get("coachId")).intValue());
            if (!"Coach".equalsIgnoreCase(coach.getRole().getRoleName()) || !coach.isEnabled()) {
                throw new IllegalArgumentException("Huấn luyện viên của lớp không còn hoạt động; hãy phân công lại");
            }
            if (timingChanged && !request.startTime().isAfter(LocalDateTime.now())) {
                throw new IllegalArgumentException("Giờ bắt đầu mới phải ở tương lai");
            }
            if (id != null && timingChanged && managerRepository.hasMemberConflict(id, request.startTime(), request.endTime())) {
                throw new IllegalArgumentException("Giờ mới trùng lịch của học viên đã đăng ký");
            }
        }
        Integer coachId = ((Number) assignment.get("coachId")).intValue();
        Integer roomId = ((Number) assignment.get("roomId")).intValue();
        if (!cancelled && !completed
                && managerRepository.hasScheduleConflict(id, coachId, roomId, request.startTime(), request.endTime())) {
            throw new IllegalArgumentException("Khung giờ bị trùng lịch huấn luyện viên hoặc phòng tập");
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
            throw new IllegalArgumentException("Tạo từ 2 đến 52 buổi, cách nhau từ 1 đến 4 tuần");
        }
        List<Integer> ids = new ArrayList<>();
        for (int i = 0; i < request.occurrences(); i++) {
            long weeks = (long) i * request.intervalWeeks();
            ids.add(saveSchedule(null, new ManagerRequests.ScheduleRequest(request.classId(),
                    request.startTime().plusWeeks(weeks), request.endTime().plusWeeks(weeks), "SCHEDULED"), actor));
        }
        return ids;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> scheduleBookings(Integer id) {
        managerRepository.schedule(id);
        return managerRepository.scheduleBookings(id);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> packages() { return managerRepository.packages(); }

    public int savePackage(Integer id, ManagerRequests.PackageRequest request, String actor) {
        if (id != null) managerRepository.requirePackage(id);
        int savedId = managerRepository.savePackage(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "PACKAGE", savedId,
                request.packageName() + " - " + request.durationDays() + " ngày");
        return savedId;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report(LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        return managerRepository.report(from, to);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> auditLogs() { return auditLogRepository.findTop100ByOrderByCreatedAtDesc(); }

    private User findUser(Integer id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
    }

    private Role findRole(Integer id) {
        return roleRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Vai trò không tồn tại"));
    }

    private void validateStatus(String status, Set<String> allowed) {
        if (status == null || !allowed.contains(status.toUpperCase())) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
    }

    private String normalizeFilter(String value) { return value == null || value.isBlank() ? "ALL" : value; }
    private String normalizeEmail(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private void validatePassword(String password) {
        if (password != null && !password.isEmpty()
                && (password.isBlank() || password.length() < 6 || password.getBytes(StandardCharsets.UTF_8).length > 72)) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 6 ký tự và tối đa 72 byte UTF-8");
        }
    }

    private void validateCoachChange(User user, Role role, String status) {
        if ("Coach".equalsIgnoreCase(user.getRole().getRoleName())
                && (!"Coach".equalsIgnoreCase(role.getRoleName()) || !"ACTIVE".equalsIgnoreCase(status))
                && managerRepository.coachHasAssignments(user.getUserId())) {
            throw new IllegalArgumentException("Hãy phân công lại các lớp của huấn luyện viên trước khi khóa hoặc đổi vai trò");
        }
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from) || to.isAfter(from.plusYears(1))) {
            throw new IllegalArgumentException("Chọn khoảng ngày hợp lệ, tối đa một năm");
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
