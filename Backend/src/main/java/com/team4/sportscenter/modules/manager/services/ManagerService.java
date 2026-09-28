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
        validateStatus(request.status(), USER_STATUSES);
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Mật khẩu là bắt buộc khi tạo tài khoản");
        }
        if (userRepository.existsByEmail(request.email().trim())) {
            throw new IllegalArgumentException("Email đã được sử dụng");
        }
        Role role = findRole(request.roleId());
        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(request.email().trim().toLowerCase())
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
        validateStatus(request.status(), USER_STATUSES);
        User user = findUser(id);
        boolean isSelf = user.getEmail().equalsIgnoreCase(actor);
        if (isSelf && (!user.getRole().getRoleId().equals(request.roleId()) || !"ACTIVE".equalsIgnoreCase(request.status()))) {
            throw new IllegalArgumentException("Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập");
        }
        userRepository.findByEmail(request.email().trim()).filter(other -> !other.getUserId().equals(id)).ifPresent(other -> {
            throw new IllegalArgumentException("Email đã được sử dụng");
        });
        Role role = findRole(request.roleId());
        user.setFullName(request.fullName().trim());
        user.setEmail(request.email().trim().toLowerCase());
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
        validateStatus(request.status(), USER_STATUSES);
        User user = findUser(id);
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
        int savedId = managerRepository.saveSubject(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "SUBJECT", savedId, request.subjectName());
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> rooms() { return managerRepository.rooms(); }

    public int saveRoom(Integer id, ManagerRequests.RoomRequest request, String actor) {
        int savedId = managerRepository.saveRoom(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "ROOM", savedId, request.roomName() + " - " + request.capacity() + " chỗ");
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> classes() { return managerRepository.classes(); }

    public int saveClass(Integer id, ManagerRequests.ClassRequest request, String actor) {
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
        if (to.isBefore(from)) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        return managerRepository.schedules(from, to);
    }

    public int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request, String actor) {
        validateStatus(request.status(), SCHEDULE_STATUSES);
        if (!request.endTime().isAfter(request.startTime())) {
            throw new IllegalArgumentException("Giờ kết thúc phải sau giờ bắt đầu");
        }
        Map<String, Object> assignment = managerRepository.classAssignment(request.classId());
        Integer coachId = ((Number) assignment.get("coachId")).intValue();
        Integer roomId = ((Number) assignment.get("roomId")).intValue();
        if (!"CANCELLED".equalsIgnoreCase(request.status())
                && managerRepository.hasScheduleConflict(id, coachId, roomId, request.startTime(), request.endTime())) {
            throw new IllegalArgumentException("Khung giờ bị trùng lịch huấn luyện viên hoặc phòng tập");
        }
        int savedId = managerRepository.saveSchedule(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "SCHEDULE", savedId,
                request.startTime() + " - " + request.endTime() + " / " + request.status());
        return savedId;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> packages() { return managerRepository.packages(); }

    public int savePackage(Integer id, ManagerRequests.PackageRequest request, String actor) {
        int savedId = managerRepository.savePackage(id, request);
        audit(actor, id == null ? "CREATE" : "UPDATE", "PACKAGE", savedId,
                request.packageName() + " - " + request.durationDays() + " ngày");
        return savedId;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> report(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
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
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

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
