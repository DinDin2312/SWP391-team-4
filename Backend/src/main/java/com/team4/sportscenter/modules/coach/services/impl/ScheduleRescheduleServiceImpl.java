package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.CreateRescheduleRequestDto;
import com.team4.sportscenter.modules.coach.dtos.RescheduleRequestResponseDto;
import com.team4.sportscenter.modules.coach.dtos.UpcomingScheduleOptionDto;
import com.team4.sportscenter.modules.coach.entities.RescheduleMemberResponse;
import com.team4.sportscenter.modules.coach.entities.ScheduleRescheduleRequest;
import com.team4.sportscenter.modules.coach.repositories.RescheduleMemberResponseRepository;
import com.team4.sportscenter.modules.coach.repositories.ScheduleRescheduleRequestRepository;
import com.team4.sportscenter.modules.coach.services.ScheduleRescheduleService;
import com.team4.sportscenter.modules.manager.repositories.ManagerRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Room;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.RoomRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.support.entities.UserCredit;
import com.team4.sportscenter.modules.support.enums.CreditStatus;
import com.team4.sportscenter.modules.support.repositories.UserCreditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleRescheduleServiceImpl implements ScheduleRescheduleService {

    private final ScheduleRescheduleRequestRepository requestRepository;
    private final RescheduleMemberResponseRepository responseRepository;
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final UserCreditRepository userCreditRepository;
    private final NotificationRepository notificationRepository;
    private final JdbcTemplate jdbc;
    private final ManagerRepository managerRepository;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
    private static final Set<String> ACTIVE_SESSION_STATUSES = Set.of("SCHEDULED", "SUBSTITUTE_ASSIGNED", "RESCHEDULED");

    private boolean isActiveScheduleStatus(String status) {
        return status != null && ACTIVE_SESSION_STATUSES.contains(status.trim().toUpperCase(Locale.ROOT));
    }

    private int resolveChangeoverMinutes(Schedule schedule, GymClass gymClass) {
        if (schedule != null && schedule.getScheduleId() != null) {
            List<Integer> values = jdbc.queryForList(
                    "SELECT changeover_minutes FROM SCHEDULES WHERE schedule_id = ?",
                    Integer.class, schedule.getScheduleId());
            if (!values.isEmpty() && values.get(0) != null) {
                return Math.max(0, values.get(0));
            }
        }
        if (gymClass != null && gymClass.getClassId() != null) {
            return managerRepository.classSlotPolicy(gymClass.getClassId()).breakMinutes();
        }
        return 15;
    }

    private void validateOperatingHours(GymClass gymClass, LocalDateTime start, LocalDateTime end, int changeoverMinutes) {
        if (start == null || end == null || gymClass == null || gymClass.getClassId() == null) return;
        if (!start.toLocalDate().equals(end.toLocalDate())) {
            throw new IllegalArgumentException("Ca dạy bù phải bắt đầu và kết thúc trong cùng một ngày.");
        }
        var policy = managerRepository.classSlotPolicy(gymClass.getClassId());
        LocalDate date = start.toLocalDate();
        LocalDateTime opensAt = date.atTime(policy.opensAt());
        LocalDateTime closesAt = date.atTime(policy.closesAt());
        if (start.isBefore(opensAt) || end.plusMinutes(Math.max(0, changeoverMinutes)).isAfter(closesAt)) {
            throw new IllegalArgumentException(
                    "Ca dạy bù (bao gồm " + changeoverMinutes + " phút chuyển ca) phải nằm trong giờ mở cửa trung tâm ("
                            + policy.opensAt() + " - " + policy.closesAt() + ").");
        }
    }

    private List<Integer> findRoomCollisionScheduleIds(
            Integer roomId, Integer excludeScheduleId, LocalDateTime start, LocalDateTime end, int changeoverMinutes) {
        if (roomId == null || start == null || end == null) return List.of();
        LocalDateTime effectiveEnd = end.plusMinutes(Math.max(0, changeoverMinutes));
        return jdbc.queryForList("""
                SELECT sc.schedule_id
                FROM SCHEDULES sc
                JOIN CLASSES c ON c.class_id = sc.class_id
                WHERE COALESCE(sc.room_id, c.room_id) = ?
                  AND sc.schedule_id <> ?
                  AND sc.status NOT IN ('CANCELLED', 'CANCELLED_INSUFFICIENT_ATTENDEES', 'COMPLETED')
                  AND sc.start_time < ?
                  AND TIMESTAMPADD(MINUTE, sc.changeover_minutes, sc.end_time) > ?
                ORDER BY sc.start_time ASC
                """, Integer.class, roomId, excludeScheduleId != null ? excludeScheduleId : -1, effectiveEnd, start);
    }

    private List<Integer> findCoachCollisionScheduleIds(
            Integer coachId, Integer excludeScheduleId, LocalDateTime start, LocalDateTime end, int changeoverMinutes) {
        if (coachId == null || start == null || end == null) return List.of();
        LocalDateTime effectiveEnd = end.plusMinutes(Math.max(0, changeoverMinutes));
        return jdbc.queryForList("""
                SELECT sc.schedule_id
                FROM SCHEDULES sc
                JOIN CLASSES c ON c.class_id = sc.class_id
                WHERE (c.coach_id = ? OR sc.substitute_coach_id = ?)
                  AND sc.schedule_id <> ?
                  AND sc.status NOT IN ('CANCELLED', 'CANCELLED_INSUFFICIENT_ATTENDEES', 'COMPLETED')
                  AND sc.start_time < ?
                  AND TIMESTAMPADD(MINUTE, sc.changeover_minutes, sc.end_time) > ?
                ORDER BY sc.start_time ASC
                """, Integer.class, coachId, coachId, excludeScheduleId != null ? excludeScheduleId : -1, effectiveEnd, start);
    }

    private boolean hasConfirmedMemberConflict(Integer scheduleId, LocalDateTime start, LocalDateTime end) {
        if (scheduleId == null || start == null || end == null) return false;
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*)
                FROM BOOKINGS own_b
                JOIN BOOKINGS other_b ON other_b.user_id = own_b.user_id
                JOIN SCHEDULES s ON s.schedule_id = other_b.schedule_id
                WHERE own_b.schedule_id = ?
                  AND other_b.schedule_id <> ?
                  AND own_b.status = 'CONFIRMED'
                  AND other_b.status = 'CONFIRMED'
                  AND s.status NOT IN ('CANCELLED', 'CANCELLED_INSUFFICIENT_ATTENDEES', 'COMPLETED')
                  AND s.start_time < ?
                  AND s.end_time > ?
                """, Integer.class, scheduleId, scheduleId, end, start);
        return count != null && count > 0;
    }

    private boolean isConfirmedBooking(Booking b) {
        return b != null && "CONFIRMED".equalsIgnoreCase(b.getStatus());
    }

    @Override
    public RescheduleRequestResponseDto createCoachRequest(CreateRescheduleRequestDto dto, String coachEmail) {
        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new IllegalArgumentException("Coach not found: " + coachEmail));

        Schedule schedule = scheduleRepository.findById(dto.getScheduleId())
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + dto.getScheduleId()));

        GymClass gymClass = schedule.getGymClass();
        if (gymClass == null) {
            throw new IllegalArgumentException("Class not associated with schedule: " + dto.getScheduleId());
        }

        boolean isAssignedCoach = (gymClass.getCoach() != null && Objects.equals(gymClass.getCoach().getUserId(), coach.getUserId()))
                || (schedule.getSubstituteCoach() != null && Objects.equals(schedule.getSubstituteCoach().getUserId(), coach.getUserId()));

        if (!isAssignedCoach) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không phải Huấn luyện viên phụ trách ca học này.");
        }

        if (schedule.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Không thể xin đổi lịch cho ca học đã diễn ra hoặc trong quá khứ.");
        }

        if ("CANCELLED".equalsIgnoreCase(schedule.getStatus())
                || "CANCELLED_INSUFFICIENT_ATTENDEES".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã bị hủy, không thể xin dời lịch.");
        }
        if ("COMPLETED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã hoàn thành, không thể xin dời lịch.");
        }
        if ("RESCHEDULED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã được dời lịch và phê duyệt ca dạy bù, không thể tạo thêm yêu cầu.");
        }
        if ("SUBSTITUTE_ASSIGNED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã được phân công HLV dạy thay, không thể tạo thêm yêu cầu.");
        }
        if (!isActiveScheduleStatus(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này không ở trạng thái có thể xin đổi lịch.");
        }

        Optional<ScheduleRescheduleRequest> existingPending = requestRepository
                .findFirstBySchedule_ScheduleIdAndStatusInOrderByCreatedAtDesc(schedule.getScheduleId(), List.of("PENDING"));
        if (existingPending.isPresent()) {
            throw new IllegalStateException("Ca học này đã có đơn xin đổi lịch đang chờ Quản lý phê duyệt (Mã đơn #" 
                    + existingPending.get().getRequestId() + ").");
        }

        Optional<ScheduleRescheduleRequest> existingApproved = requestRepository
                .findFirstBySchedule_ScheduleIdAndStatusInOrderByCreatedAtDesc(schedule.getScheduleId(), List.of("APPROVED"));
        if (existingApproved.isPresent()) {
            throw new IllegalStateException("Ca học này đã có đơn dời lịch được phê duyệt (Mã đơn #" 
                    + existingApproved.get().getRequestId() + ").");
        }

        String rawAction = (dto.getActionType() != null && !dto.getActionType().trim().isEmpty())
                ? dto.getActionType().trim().toUpperCase() : "MAKEUP_SESSION";
        String actionType = "MAKE_UP_SESSION".equals(rawAction) ? "MAKEUP_SESSION" : rawAction;

        Room proposedRoom = null;
        if ("MAKEUP_SESSION".equals(actionType)) {
            if (dto.getProposedStartTime() == null || dto.getProposedEndTime() == null) {
                throw new IllegalArgumentException("Vui lòng chọn thời gian bắt đầu và kết thúc cho ca dạy bù.");
            }
            if (dto.getProposedStartTime().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("Thời gian dạy bù phải ở tương lai.");
            }
            if (!dto.getProposedEndTime().isAfter(dto.getProposedStartTime())) {
                throw new IllegalArgumentException("Thời gian kết thúc ca bù phải sau thời gian bắt đầu.");
            }

            if (dto.getProposedRoomId() != null) {
                proposedRoom = roomRepository.findById(dto.getProposedRoomId()).orElse(schedule.getEffectiveRoom());
            } else {
                proposedRoom = schedule.getEffectiveRoom();
            }

            int changeover = resolveChangeoverMinutes(schedule, gymClass);
            validateOperatingHours(gymClass, dto.getProposedStartTime(), dto.getProposedEndTime(), changeover);

            // Backend Conflict Guard: Chặn tạo đơn nếu bị xung đột lịch cá nhân, phòng tập (kể cả thời gian chuyển ca) hoặc học viên
            List<Integer> coachColIds = findCoachCollisionScheduleIds(
                    coach.getUserId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime(), changeover);
            if (!coachColIds.isEmpty()) {
                Schedule conflictSch = scheduleRepository.findById(coachColIds.get(0)).orElse(null);
                String conflictClass = (conflictSch != null && conflictSch.getGymClass() != null)
                        ? conflictSch.getGymClass().getClassName() : "lớp khác";
                throw new IllegalStateException("Xung đột lịch dạy cá nhân: Bạn đã có lớp '" + conflictClass + "' trùng vào khung giờ này!");
            }

            if (proposedRoom != null) {
                List<Integer> roomColIds = findRoomCollisionScheduleIds(
                        proposedRoom.getRoomId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime(), changeover);
                if (!roomColIds.isEmpty()) {
                    Schedule conflictSch = scheduleRepository.findById(roomColIds.get(0)).orElse(null);
                    String conflictClass = (conflictSch != null && conflictSch.getGymClass() != null)
                            ? conflictSch.getGymClass().getClassName() : "lớp khác";
                    throw new IllegalStateException("Xung đột phòng tập: Phòng '" + proposedRoom.getRoomName() + "' đã có lớp '" + conflictClass + "' sử dụng trong khung giờ này!");
                }
            }

            if (hasConfirmedMemberConflict(schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime())) {
                throw new IllegalStateException("Xung đột lịch học viên: Có hội viên đã đăng ký trùng lịch ở một lớp khác vào khung giờ này!");
            }
        }

        User substituteCoach = null;
        if (dto.getRequestedSubstituteCoachId() != null) {
            substituteCoach = userRepository.findById(dto.getRequestedSubstituteCoachId()).orElse(null);
            requireQualifiedSubstitute(substituteCoach, schedule);
            int changeover = resolveChangeoverMinutes(schedule, gymClass);
            if (!findCoachCollisionScheduleIds(
                    substituteCoach.getUserId(), schedule.getScheduleId(), schedule.getStartTime(), schedule.getEndTime(), changeover).isEmpty()) {
                throw new IllegalStateException("HLV dạy thay được đề xuất đang bận lịch dạy khác vào khung giờ này.");
            }
        }

        String reasonDetails = (dto.getReasonDetails() != null && !dto.getReasonDetails().trim().isEmpty())
                ? dto.getReasonDetails().trim()
                : (dto.getReasonCategory() != null ? dto.getReasonCategory() : "Không có HLV dạy thay");

        ScheduleRescheduleRequest entity = ScheduleRescheduleRequest.builder()
                .schedule(schedule)
                .gymClass(gymClass)
                .coach(coach)
                .substituteCoach(substituteCoach)
                .action_type(actionType)
                .originalStartTime(schedule.getStartTime())
                .originalEndTime(schedule.getEndTime())
                .proposedStartTime(dto.getProposedStartTime())
                .proposedEndTime(dto.getProposedEndTime())
                .proposedRoom(proposedRoom)
                .reasonCategory(dto.getReasonCategory())
                .reasonDetails(reasonDetails)
                .status("PENDING")
                .minAttendees(2)
                .build();

        ScheduleRescheduleRequest saved = requestRepository.save(entity);

        // Notify Managers
        try {
            List<User> managers = userRepository.findByRoleNameIgnoreCase("Center Manager");
            if (managers.isEmpty()) {
                managers = userRepository.findByRoleNameIgnoreCase("Admin");
            }
            for (User manager : managers) {
                Notification notif = Notification.builder()
                        .user(manager)
                        .title("Yêu cầu dời lịch dạy bù #" + saved.getRequestId())
                        .message("HLV " + coach.getFullName() + " vừa gửi đơn xin dời ca dạy lớp " 
                                + gymClass.getClassName() + " (" + schedule.getStartTime().format(TIME_FMT) 
                                + "). Vui lòng thẩm định tại trang Quản lý vận hành.")
                        .type("COACH_RESCHEDULE")
                        .isRead(false)
                        .build();
                notificationRepository.save(notif);
            }
        } catch (Exception ex) {
            System.err.println("Failed to notify managers of reschedule request: " + ex.getMessage());
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RescheduleRequestResponseDto> getCoachRequests(String coachEmail) {
        return requestRepository.findByCoach_EmailOrderByCreatedAtDesc(coachEmail).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UpcomingScheduleOptionDto> getCoachUpcomingSchedules(String coachEmail) {
        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new IllegalArgumentException("Coach not found: " + coachEmail));

        List<Schedule> schedules = scheduleRepository.findUpcomingSchedulesByCoachId(
                coach.getUserId(), LocalDateTime.now());
        if (schedules.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> scheduleIds = schedules.stream().map(Schedule::getScheduleId).toList();
        Map<Integer, Integer> enrolledCounts = new HashMap<>();
        for (Object[] row : bookingRepository.countBookingsByScheduleIds(scheduleIds)) {
            if (row != null && row.length >= 2 && row[0] instanceof Number && row[1] instanceof Number) {
                enrolledCounts.put(((Number) row[0]).intValue(), ((Number) row[1]).intValue());
            }
        }

        Map<Integer, Integer> pendingRequestIds = new HashMap<>();
        for (ScheduleRescheduleRequest req : requestRepository
                .findBySchedule_ScheduleIdInAndStatusInOrderByCreatedAtDesc(scheduleIds, List.of("PENDING"))) {
            if (req.getSchedule() != null) {
                pendingRequestIds.putIfAbsent(req.getSchedule().getScheduleId(), req.getRequestId());
            }
        }

        List<UpcomingScheduleOptionDto> result = new ArrayList<>(schedules.size());
        for (Schedule s : schedules) {
            GymClass gc = s.getGymClass();
            Integer pendingReqId = pendingRequestIds.get(s.getScheduleId());

            result.add(UpcomingScheduleOptionDto.builder()
                    .scheduleId(s.getScheduleId())
                    .classId(gc != null ? gc.getClassId() : null)
                    .className(gc != null ? gc.getClassName() : "Lớp học")
                    .roomId(s.getEffectiveRoom() != null ? s.getEffectiveRoom().getRoomId() : null)
                    .roomName(s.getEffectiveRoom() != null ? s.getEffectiveRoom().getRoomName() : "Phòng tập")
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .enrolledCount(enrolledCounts.getOrDefault(s.getScheduleId(), 0))
                    .status(s.getStatus())
                    .hasPendingRequest(pendingReqId != null)
                    .existingRequestId(pendingReqId)
                    .build());
        }

        return result;
    }

    @Override
    public Map<String, Object> checkAvailability(
            Integer scheduleId,
            LocalDateTime proposedStartTime,
            LocalDateTime proposedEndTime,
            Integer proposedRoomId,
            String coachEmail) {

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new IllegalArgumentException("Coach not found: " + coachEmail));

        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));

        GymClass gymClass = schedule.getGymClass();
        Room room = null;
        if (proposedRoomId != null) {
            room = roomRepository.findById(proposedRoomId).orElse(schedule.getEffectiveRoom());
        } else {
            room = schedule.getEffectiveRoom();
        }

        Map<String, Object> result = new LinkedHashMap<>();

        if (proposedStartTime == null || proposedEndTime == null) {
            result.put("available", false);
            result.put("message", "Vui lòng chọn thời gian bắt đầu và kết thúc.");
            return result;
        }

        if (proposedStartTime.isBefore(LocalDateTime.now())) {
            result.put("available", false);
            result.put("message", "Thời gian dạy bù phải ở tương lai.");
            return result;
        }

        if (!proposedEndTime.isAfter(proposedStartTime)) {
            result.put("available", false);
            result.put("message", "Giờ kết thúc phải sau giờ bắt đầu.");
            return result;
        }

        int changeover = resolveChangeoverMinutes(schedule, gymClass);

        if (!proposedStartTime.toLocalDate().equals(proposedEndTime.toLocalDate())) {
            result.put("available", false);
            result.put("message", "Ca dạy bù phải bắt đầu và kết thúc trong cùng một ngày.");
            return result;
        }
        if (gymClass != null && gymClass.getClassId() != null) {
            var policy = managerRepository.classSlotPolicy(gymClass.getClassId());
            LocalDate d = proposedStartTime.toLocalDate();
            if (proposedStartTime.isBefore(d.atTime(policy.opensAt()))
                    || proposedEndTime.plusMinutes(changeover).isAfter(d.atTime(policy.closesAt()))) {
                result.put("available", false);
                result.put("message", "Khung giờ vượt ngoài giờ mở cửa trung tâm (" + policy.opensAt() + " - " + policy.closesAt() + ").");
                return result;
            }
        }

        // 1. Kiểm tra va chạm lịch dạy cá nhân HLV (kể cả thời gian chuyển ca)
        List<Integer> coachCollisionIds = findCoachCollisionScheduleIds(
                coach.getUserId(), scheduleId, proposedStartTime, proposedEndTime, changeover);
        boolean hasCoachConflict = !coachCollisionIds.isEmpty();
        String coachConflictDetail = null;
        if (hasCoachConflict) {
            Schedule cs = scheduleRepository.findById(coachCollisionIds.get(0)).orElse(null);
            if (cs != null && cs.getGymClass() != null) {
                String timeStr = cs.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                        + " - " + cs.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                coachConflictDetail = "Bạn đã có lịch dạy lớp '" + cs.getGymClass().getClassName() + "' (" + timeStr + ") vào khung giờ này.";
            } else {
                coachConflictDetail = "Bạn đã có lịch dạy lớp khác trùng vào khung giờ này.";
            }
        }

        // 2. Kiểm tra va chạm phòng tập (kể cả thời gian chuyển ca)
        boolean hasRoomConflict = false;
        String roomConflictDetail = null;
        if (room != null) {
            List<Integer> roomCollisionIds = findRoomCollisionScheduleIds(
                    room.getRoomId(), scheduleId, proposedStartTime, proposedEndTime, changeover);
            hasRoomConflict = !roomCollisionIds.isEmpty();
            if (hasRoomConflict) {
                Schedule rs = scheduleRepository.findById(roomCollisionIds.get(0)).orElse(null);
                if (rs != null && rs.getGymClass() != null) {
                    String roomCoach = rs.getSubstituteCoach() != null
                            ? rs.getSubstituteCoach().getFullName()
                            : (rs.getGymClass().getCoach() != null ? rs.getGymClass().getCoach().getFullName() : "HLV khác");
                    String timeStr = rs.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                            + " - " + rs.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                    roomConflictDetail = "Phòng '" + room.getRoomName() + "' đã có lớp '" + rs.getGymClass().getClassName()
                            + "' của " + roomCoach + " (" + timeStr + ").";
                } else {
                    roomConflictDetail = "Phòng '" + room.getRoomName() + "' đã có lớp khác sử dụng trong khung giờ này.";
                }
            }
        }

        // 3. Kiểm tra xung đột lịch của hội viên đã xác nhận
        boolean hasMemberConflict = hasConfirmedMemberConflict(scheduleId, proposedStartTime, proposedEndTime);
        String memberConflictDetail = hasMemberConflict
                ? "Có hội viên trong lớp đang có lịch học lớp khác trùng vào khung giờ này."
                : null;

        boolean available = !hasCoachConflict && !hasRoomConflict && !hasMemberConflict;
        result.put("available", available);
        result.put("hasCoachConflict", hasCoachConflict);
        result.put("coachConflictDetail", coachConflictDetail);
        result.put("hasRoomConflict", hasRoomConflict);
        result.put("roomConflictDetail", roomConflictDetail);
        result.put("hasMemberConflict", hasMemberConflict);
        result.put("memberConflictDetail", memberConflictDetail);
        result.put("roomName", room != null ? room.getRoomName() : null);

        // 4. Tính toán khung giờ gợi ý trống trên cùng ngày nếu bị xung đột
        List<Map<String, String>> suggestions = new ArrayList<>();
        if (!available && room != null) {
            LocalDate targetDate = proposedStartTime.toLocalDate();
            long durationMinutes = ChronoUnit.MINUTES.between(proposedStartTime, proposedEndTime);
            if (durationMinutes <= 0 || durationMinutes > 180) durationMinutes = 90;

            List<LocalTime> standardSlots = List.of(
                    LocalTime.of(7, 0),
                    LocalTime.of(8, 45),
                    LocalTime.of(10, 30),
                    LocalTime.of(14, 0),
                    LocalTime.of(15, 45),
                    LocalTime.of(17, 30),
                    LocalTime.of(19, 15)
            );

            for (LocalTime slotStart : standardSlots) {
                LocalDateTime slotStartTime = targetDate.atTime(slotStart);
                LocalDateTime slotEndTime = slotStartTime.plusMinutes(durationMinutes);

                if (slotStartTime.isBefore(LocalDateTime.now())) continue;
                if (slotStartTime.equals(proposedStartTime)) continue;

                boolean coachBusy = !findCoachCollisionScheduleIds(
                        coach.getUserId(), scheduleId, slotStartTime, slotEndTime, changeover).isEmpty();
                boolean roomBusy = !findRoomCollisionScheduleIds(
                        room.getRoomId(), scheduleId, slotStartTime, slotEndTime, changeover).isEmpty();
                boolean memberBusy = hasConfirmedMemberConflict(scheduleId, slotStartTime, slotEndTime);

                if (!coachBusy && !roomBusy && !memberBusy) {
                    Map<String, String> sug = new LinkedHashMap<>();
                    sug.put("startTime", slotStart.format(DateTimeFormatter.ofPattern("HH:mm")));
                    sug.put("endTime", slotEndTime.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
                    sug.put("label", slotStart.format(DateTimeFormatter.ofPattern("HH:mm"))
                            + " - " + slotEndTime.toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")));
                    suggestions.add(sug);
                    if (suggestions.size() >= 3) break;
                }
            }
        }
        result.put("suggestedSlots", suggestions);

        return result;
    }

    @Override
    public RescheduleRequestResponseDto cancelCoachRequest(Integer requestId, String coachEmail) {
        ScheduleRescheduleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        if (!request.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thao tác trên đơn này.");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Chỉ có thể hủy đơn đang ở trạng thái Chờ duyệt.");
        }

        request.setStatus("CANCELLED");
        request.setAdminResponseNote("[HLV CHỦ ĐỘNG HỦY YÊU CẦU] HLV đã rút lại đơn xin dời ca này.");
        ScheduleRescheduleRequest saved = requestRepository.save(request);

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RescheduleRequestResponseDto> getAllRequestsForManager(String status) {
        List<ScheduleRescheduleRequest> list;
        if (status == null || status.trim().isEmpty() || "ALL".equalsIgnoreCase(status.trim())) {
            list = requestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            list = requestRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        }
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RescheduleRequestResponseDto getRequestDetails(Integer requestId) {
        ScheduleRescheduleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));
        return mapToDto(request);
    }

    @Override
    public RescheduleRequestResponseDto approveRequest(
            Integer requestId,
            Integer customMinAttendees,
            Integer deadlineHoursBefore,
            String adminNote,
            String managerEmail) {

        bookingRepository.lockOperations();

        ScheduleRescheduleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Đơn yêu cầu này không ở trạng thái Chờ duyệt.");
        }

        Schedule schedule = request.getSchedule();
        GymClass gymClass = request.getGymClass();
        if (schedule == null || gymClass == null || schedule.getStartTime() == null) {
            throw new IllegalStateException("Thông tin ca học của yêu cầu này không hợp lệ.");
        }
        if (!isActiveScheduleStatus(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này không còn ở trạng thái hoạt động để phê duyệt (hiện tại: " + schedule.getStatus() + ").");
        }
        LocalDateTime now = LocalDateTime.now();
        if (!schedule.getStartTime().isAfter(now)) {
            throw new IllegalStateException("Không thể phê duyệt yêu cầu cho ca học đã bắt đầu hoặc ở trong quá khứ.");
        }

        int changeover = resolveChangeoverMinutes(schedule, gymClass);
        String finalStatus = "APPROVED";
        String coachNotifMessage;

        if ("MAKEUP_SESSION".equalsIgnoreCase(request.getAction_type())) {
            LocalDateTime proposedStart = request.getProposedStartTime();
            LocalDateTime proposedEnd = request.getProposedEndTime();
            if (proposedStart == null || proposedEnd == null || !proposedEnd.isAfter(proposedStart)) {
                throw new IllegalArgumentException("Thời gian ca dạy bù đề xuất không hợp lệ.");
            }
            if (!proposedStart.isAfter(now)) {
                throw new IllegalStateException("Không thể phê duyệt ca dạy bù có thời gian ở quá khứ.");
            }

            validateOperatingHours(gymClass, proposedStart, proposedEnd, changeover);

            Room targetRoom = request.getProposedRoom() != null ? request.getProposedRoom() : schedule.getEffectiveRoom();
            if (targetRoom != null && !findRoomCollisionScheduleIds(
                    targetRoom.getRoomId(), schedule.getScheduleId(), proposedStart, proposedEnd, changeover).isEmpty()) {
                throw new IllegalStateException("Xung đột phòng tập: Phòng đã có lớp khác sử dụng trong khung giờ bù đề xuất!");
            }

            if (request.getCoach() != null && !findCoachCollisionScheduleIds(
                    request.getCoach().getUserId(), schedule.getScheduleId(), proposedStart, proposedEnd, changeover).isEmpty()) {
                throw new IllegalStateException("Xung đột lịch HLV: Huấn luyện viên đã có ca dạy khác trong khung giờ bù đề xuất!");
            }
            if (gymClass.getCoach() != null
                    && (request.getCoach() == null || !Objects.equals(gymClass.getCoach().getUserId(), request.getCoach().getUserId()))
                    && !findCoachCollisionScheduleIds(
                            gymClass.getCoach().getUserId(), schedule.getScheduleId(), proposedStart, proposedEnd, changeover).isEmpty()) {
                throw new IllegalStateException("Xung đột lịch HLV: HLV phụ trách lớp đã có ca dạy khác trong khung giờ bù đề xuất!");
            }

            if (hasConfirmedMemberConflict(schedule.getScheduleId(), proposedStart, proposedEnd)) {
                throw new IllegalStateException("Xung đột lịch học viên: Có hội viên đã đăng ký lớp khác trùng khung giờ ca bù đề xuất!");
            }

            schedule.setStartTime(proposedStart);
            schedule.setEndTime(proposedEnd);
            // Preserve V36 per-session room override; keep null when running in the class's default room.
            if (request.getProposedRoom() != null) {
                boolean isClassRoom = gymClass.getRoom() != null && gymClass.getRoom().getRoomId().equals(request.getProposedRoom().getRoomId());
                schedule.setRoom(isClassRoom ? null : request.getProposedRoom());
            }
            schedule.setSubstituteCoach(null);
            schedule.setStatus("RESCHEDULED");
            scheduleRepository.save(schedule);

            List<Booking> confirmedBookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId())
                    .stream()
                    .filter(this::isConfirmedBooking)
                    .toList();
            int confirmedCount = confirmedBookings.size();

            if (confirmedCount == 0) {
                request.setMinAttendees(0);
                request.setConfirmationDeadline(null);
                finalStatus = "COMPLETED";
                coachNotifMessage = "Quản lý (" + manager.getFullName() + ") đã phê duyệt dời lịch lớp "
                        + gymClass.getClassName() + " sang " + proposedStart.format(TIME_FMT)
                        + " (lớp hiện có 0 học viên đã xác nhận, ca bù được chốt ngay).";
            } else {
                int defaultMin = Math.min(2, confirmedCount);
                int effectiveMin = customMinAttendees != null ? customMinAttendees : defaultMin;
                if (effectiveMin < 1 || effectiveMin > confirmedCount) {
                    throw new IllegalArgumentException(
                            "Sĩ số tối thiểu phải từ 1 đến " + confirmedCount + " học viên đã xác nhận.");
                }
                request.setMinAttendees(effectiveMin);

                int hours = (deadlineHoursBefore != null && deadlineHoursBefore > 0) ? deadlineHoursBefore : 4;
                LocalDateTime deadline = proposedStart.minusHours(hours);
                if (!deadline.isAfter(now)) {
                    LocalDateTime tightDeadline = proposedStart.minusMinutes(30);
                    deadline = tightDeadline.isAfter(now) ? tightDeadline : proposedStart;
                }
                request.setConfirmationDeadline(deadline);

                coachNotifMessage = "Quản lý (" + manager.getFullName() + ") đã phê duyệt đơn dời lịch lớp "
                        + gymClass.getClassName() + ". Hệ thống đã tự động gửi thông báo xác nhận đến hội viên.";

                for (Booking b : confirmedBookings) {
                    Optional<RescheduleMemberResponse> optResp = responseRepository
                            .findByRequest_RequestIdAndUser_UserId(request.getRequestId(), b.getUser().getUserId());
                    if (optResp.isEmpty()) {
                        RescheduleMemberResponse memberResp = RescheduleMemberResponse.builder()
                                .request(request)
                                .user(b.getUser())
                                .booking(b)
                                .responseStatus("PENDING")
                                .build();
                        responseRepository.save(memberResp);
                    }

                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Thông báo dời lịch ca bù: " + gymClass.getClassName())
                            .message("Do HLV " + request.getCoach().getFullName() + " bận đột xuất và không có HLV dạy thay, ca học ngày "
                                    + request.getOriginalStartTime().format(TIME_FMT) + " được dời sang "
                                    + proposedStart.format(TIME_FMT)
                                    + ". Vui lòng xác nhận tham gia hoặc nhận hoàn 100% lượt tập trước "
                                    + deadline.format(TIME_FMT) + ".")
                            .type("RESCHEDULE_DECISION")
                            .isRead(false)
                            .build();
                    notificationRepository.save(notif);
                }
            }
        } else if ("SUBSTITUTE_COACH".equalsIgnoreCase(request.getAction_type())) {
            User substitute = request.getSubstituteCoach();
            if (substitute == null) {
                throw new IllegalStateException("Đơn xin dạy thay chưa có HLV thay thế; vui lòng chọn HLV dạy thay trực tiếp.");
            }
            requireQualifiedSubstitute(substitute, schedule);
            if (!findCoachCollisionScheduleIds(
                    substitute.getUserId(), schedule.getScheduleId(), schedule.getStartTime(), schedule.getEndTime(), changeover).isEmpty()) {
                throw new IllegalStateException("Xung đột lịch HLV: HLV dạy thay đã có ca dạy khác trong khung giờ này!");
            }

            schedule.setSubstituteCoach(substitute);
            schedule.setStatus("SUBSTITUTE_ASSIGNED");
            scheduleRepository.save(schedule);
            request.setConfirmationDeadline(null);

            Notification subNotif = Notification.builder()
                    .user(substitute)
                    .title("Phân công dạy thay: " + gymClass.getClassName())
                    .message("Bạn được phân công đứng lớp dạy thay HLV " + request.getCoach().getFullName()
                            + " ca " + schedule.getStartTime().format(TIME_FMT) + ".")
                    .type("COACH_ASSIGNMENT")
                    .isRead(false)
                    .build();
            notificationRepository.save(subNotif);

            List<Booking> confirmedBookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId())
                    .stream()
                    .filter(this::isConfirmedBooking)
                    .toList();
            for (Booking b : confirmedBookings) {
                Notification notif = Notification.builder()
                        .user(b.getUser())
                        .title("Thông báo HLV dạy thay: " + gymClass.getClassName())
                        .message("Buổi học lúc " + schedule.getStartTime().format(TIME_FMT) + " sẽ do HLV "
                                + substitute.getFullName() + " phụ trách thay thế. Khung giờ học giữ nguyên.")
                        .type("CLASS_UPDATE")
                        .isRead(false)
                        .build();
                notificationRepository.save(notif);
            }

            coachNotifMessage = "Quản lý (" + manager.getFullName() + ") đã phê duyệt phân công HLV "
                    + substitute.getFullName() + " dạy thay lớp " + gymClass.getClassName() + ".";
        } else {
            throw new IllegalStateException("Loại yêu cầu đổi lịch không hợp lệ: " + request.getAction_type());
        }

        request.setStatus(finalStatus);
        request.setAdminResponseNote(adminNote != null ? adminNote.trim() : "Quản lý đã phê duyệt yêu cầu đổi lịch.");
        request.setReviewedBy(manager);
        request.setReviewedAt(now);
        ScheduleRescheduleRequest saved = requestRepository.save(request);

        Notification coachNotif = Notification.builder()
                .user(request.getCoach())
                .title("Đơn xin đổi lịch đã được phê duyệt #" + saved.getRequestId())
                .message(coachNotifMessage)
                .type("COACH_RESCHEDULE")
                .isRead(false)
                .build();
        notificationRepository.save(coachNotif);

        return mapToDto(saved);
    }

    @Override
    public RescheduleRequestResponseDto rejectRequest(Integer requestId, String rejectionReason, String managerEmail) {
        ScheduleRescheduleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Đơn yêu cầu này không ở trạng thái Chờ duyệt.");
        }

        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp lý do từ chối yêu cầu.");
        }

        request.setStatus("REJECTED");
        request.setAdminResponseNote(rejectionReason.trim());
        request.setReviewedBy(manager);
        request.setReviewedAt(LocalDateTime.now());
        ScheduleRescheduleRequest saved = requestRepository.save(request);

        Notification coachNotif = Notification.builder()
                .user(request.getCoach())
                .title("Đơn xin đổi lịch bị từ chối #" + saved.getRequestId())
                .message("Quản lý (" + manager.getFullName() + ") đã từ chối đơn đổi lịch lớp " 
                        + request.getGymClass().getClassName() + ". Lý do: \"" + rejectionReason.trim() + "\".")
                .type("COACH_RESCHEDULE")
                .isRead(false)
                .build();
        notificationRepository.save(coachNotif);

        return mapToDto(saved);
    }

    @Override
    public RescheduleRequestResponseDto assignSubstituteCoachDirectly(
            Integer requestId,
            Integer scheduleId,
            Integer substituteCoachId,
            String managerNote,
            String managerEmail) {

        bookingRepository.lockOperations();

        ScheduleRescheduleRequest targetRequest = null;
        Integer resolvedScheduleId = scheduleId;
        if (requestId != null) {
            targetRequest = requestRepository.findById(requestId)
                    .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));
            if (!"PENDING".equalsIgnoreCase(targetRequest.getStatus())) {
                throw new IllegalStateException("Đơn yêu cầu này không ở trạng thái Chờ duyệt.");
            }
            if (resolvedScheduleId == null && targetRequest.getSchedule() != null) {
                resolvedScheduleId = targetRequest.getSchedule().getScheduleId();
            } else if (resolvedScheduleId != null && targetRequest.getSchedule() != null
                    && !Objects.equals(resolvedScheduleId, targetRequest.getSchedule().getScheduleId())) {
                throw new IllegalArgumentException("Mã đơn không khớp với lịch học được chỉ định.");
            }
        }

        if (resolvedScheduleId == null) {
            throw new IllegalArgumentException("ScheduleId is required.");
        }

        final Integer finalScheduleId = resolvedScheduleId;
        Schedule schedule = scheduleRepository.findById(finalScheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + finalScheduleId));

        if (!isActiveScheduleStatus(schedule.getStatus())) {
            throw new IllegalStateException("Chỉ có thể chỉ định HLV dạy thay cho ca học đang hoạt động.");
        }
        if (schedule.getStartTime() == null || !schedule.getStartTime().isAfter(LocalDateTime.now())) {
            throw new IllegalStateException("Không thể chỉ định HLV dạy thay cho ca học đã bắt đầu hoặc ở quá khứ.");
        }

        User substituteCoach = userRepository.findById(substituteCoachId)
                .orElseThrow(() -> new IllegalArgumentException("Substitute coach not found: " + substituteCoachId));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        GymClass gymClass = schedule.getGymClass();

        requireQualifiedSubstitute(substituteCoach, schedule);
        int changeover = resolveChangeoverMinutes(schedule, gymClass);
        if (!findCoachCollisionScheduleIds(
                substituteCoachId, finalScheduleId, schedule.getStartTime(), schedule.getEndTime(), changeover).isEmpty()) {
            throw new IllegalStateException("HLV này đã có ca dạy khác trùng vào khung giờ này!");
        }

        schedule.setSubstituteCoach(substituteCoach);
        schedule.setStatus("SUBSTITUTE_ASSIGNED");
        scheduleRepository.save(schedule);

        // Tìm đơn đang chờ nếu chưa xác định targetRequest
        if (targetRequest == null) {
            targetRequest = requestRepository.findFirstBySchedule_ScheduleIdAndStatusInOrderByCreatedAtDesc(
                    finalScheduleId, List.of("PENDING")).orElse(null);
        }

        ScheduleRescheduleRequest saved;
        if (targetRequest != null) {
            // Cập nhật đơn hiện tại thành APPROVED với HLV dạy thay, xóa dữ liệu ca bù cũ nếu có
            targetRequest.setSubstituteCoach(substituteCoach);
            targetRequest.setAction_type("SUBSTITUTE_COACH");
            targetRequest.setProposedStartTime(null);
            targetRequest.setProposedEndTime(null);
            targetRequest.setProposedRoom(null);
            targetRequest.setConfirmationDeadline(null);
            targetRequest.setStatus("APPROVED");
            targetRequest.setReviewedBy(manager);
            targetRequest.setReviewedAt(LocalDateTime.now());
            targetRequest.setAdminResponseNote(managerNote != null && !managerNote.isBlank() ? managerNote : "Quản lý đã chỉ định HLV dạy thay (" + substituteCoach.getFullName() + ").");
            saved = requestRepository.save(targetRequest);
        } else {
            // Tạo mới nếu quản lý chủ động chỉ định ngoài quy trình đơn từ
            ScheduleRescheduleRequest auditRecord = ScheduleRescheduleRequest.builder()
                    .schedule(schedule)
                    .gymClass(gymClass)
                    .coach(gymClass.getCoach() != null ? gymClass.getCoach() : substituteCoach)
                    .substituteCoach(substituteCoach)
                    .action_type("SUBSTITUTE_COACH")
                    .originalStartTime(schedule.getStartTime())
                    .originalEndTime(schedule.getEndTime())
                    .reasonCategory("ADMIN_OVERRIDE")
                    .reasonDetails(managerNote != null ? managerNote : "Quản lý chỉ định HLV dạy thay trực tiếp.")
                    .status("APPROVED")
                    .adminResponseNote(managerNote)
                    .reviewedBy(manager)
                    .reviewedAt(LocalDateTime.now())
                    .build();
            saved = requestRepository.save(auditRecord);
        }

        Notification subNotif = Notification.builder()
                .user(substituteCoach)
                .title("Phân công dạy thay: " + gymClass.getClassName())
                .message("Quản lý (" + manager.getFullName() + ") đã phân công bạn dạy thay lớp "
                        + gymClass.getClassName() + " lúc " + schedule.getStartTime().format(TIME_FMT) + ".")
                .type("COACH_ASSIGNMENT")
                .isRead(false)
                .build();
        notificationRepository.save(subNotif);

        List<Booking> confirmedBookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId())
                .stream()
                .filter(this::isConfirmedBooking)
                .toList();
        for (Booking b : confirmedBookings) {
            Notification notif = Notification.builder()
                    .user(b.getUser())
                    .title("Thông báo HLV dạy thay: " + gymClass.getClassName())
                    .message("Buổi học lúc " + schedule.getStartTime().format(TIME_FMT) + " sẽ do HLV "
                            + substituteCoach.getFullName() + " phụ trách thay thế. Khung giờ học giữ nguyên không đổi.")
                    .type("CLASS_UPDATE")
                    .isRead(false)
                    .build();
            notificationRepository.save(notif);
        }

        return mapToDto(saved);
    }

    // A substitute must be an active coach, not the class's own coach, and qualified for the class's subject.
    private boolean canSubstitute(User candidate, Schedule schedule) {
        GymClass gymClass = schedule.getGymClass();
        if (candidate == null || gymClass == null || !candidate.isEnabled()) return false;
        if (gymClass.getCoach() != null && gymClass.getCoach().getUserId().equals(candidate.getUserId())) return false;
        Integer subjectId = gymClass.getSubjectId() != null ? gymClass.getSubjectId() : (gymClass.getSubject() != null ? gymClass.getSubject().getSubjectId() : null);
        return candidate.getSpecialties() != null && candidate.getSpecialties().stream().anyMatch(sub -> sub.getSubjectId().equals(subjectId));
    }

    private void requireQualifiedSubstitute(User candidate, Schedule schedule) {
        if (!canSubstitute(candidate, schedule))
            throw new IllegalArgumentException("HLV dạy thay phải là HLV khác, đang hoạt động và được phân công dạy bộ môn của lớp này.");
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAvailableCoachesForSchedule(Integer scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));

        if (!isActiveScheduleStatus(schedule.getStatus())
                || schedule.getStartTime() == null
                || !schedule.getStartTime().isAfter(LocalDateTime.now())) {
            return Collections.emptyList();
        }

        int changeover = resolveChangeoverMinutes(schedule, schedule.getGymClass());
        List<User> allCoaches = userRepository.findByRoleNameIgnoreCase("Coach");
        List<Map<String, Object>> available = new ArrayList<>();

        for (User c : allCoaches) {
            if (!canSubstitute(c, schedule)) continue;
            if (findCoachCollisionScheduleIds(
                    c.getUserId(), scheduleId, schedule.getStartTime(), schedule.getEndTime(), changeover).isEmpty()) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("coachId", c.getUserId());
                map.put("userId", c.getUserId());
                map.put("fullName", c.getFullName());
                map.put("email", c.getEmail());
                map.put("phone", c.getPhone());
                map.put("avatarPath", c.getAvatarPath());
                available.add(map);
            }
        }
        return available;
    }

    @Override
    public void respondToReschedule(Integer requestId, String action, String memberEmail) {
        bookingRepository.lockOperations();

        User member = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberEmail));

        RescheduleMemberResponse response = responseRepository
                .findByRequest_RequestIdAndUser_UserId(requestId, member.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin ca bù cần phản hồi cho bạn."));

        if (!"PENDING".equalsIgnoreCase(response.getResponseStatus())) {
            throw new IllegalStateException("Bạn đã phản hồi ca bù này trước đó (" + response.getResponseStatus() + ").");
        }

        ScheduleRescheduleRequest request = response.getRequest();
        if (!"APPROVED".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Yêu cầu dời lịch này không còn hiệu lực phản hồi (" + request.getStatus() + ").");
        }
        if (request.getConfirmationDeadline() != null && LocalDateTime.now().isAfter(request.getConfirmationDeadline())) {
            throw new IllegalStateException("Đã quá thời hạn xác nhận ca học bù.");
        }
        GymClass gymClass = request.getGymClass();

        if ("ACCEPT".equalsIgnoreCase(action)) {
            response.setResponseStatus("ACCEPTED");
            response.setRespondedAt(LocalDateTime.now());
            responseRepository.save(response);

            Notification notif = Notification.builder()
                    .user(member)
                    .title("Xác nhận tham gia ca bù thành công")
                    .message("Bạn đã xác nhận tham gia buổi học bù lớp " + gymClass.getClassName() 
                            + " vào lúc " + request.getProposedStartTime().format(TIME_FMT) + ".")
                    .type("BOOKING")
                    .isRead(false)
                    .build();
            notificationRepository.save(notif);

        } else if ("DECLINE".equalsIgnoreCase(action)) {
            String cName = gymClass != null ? gymClass.getClassName() : "Lớp học";
            refundMemberCredit(response, "Từ chối ca học bù lớp " + cName);
        } else {
            throw new IllegalArgumentException("Hành động không hợp lệ: " + action);
        }
    }

    private void refundMemberCredit(RescheduleMemberResponse response, String reasonNote) {
        User member = response.getUser();
        ScheduleRescheduleRequest request = response.getRequest();
        GymClass gymClass = request.getGymClass();

        response.setResponseStatus("DECLINED_REFUNDED");
        response.setRespondedAt(LocalDateTime.now());

        Booking booking = response.getBooking();
        if (booking != null) {
            booking.setStatus("CANCELLED");
            bookingRepository.save(booking);
        }

        BigDecimal classPrice = (gymClass != null && gymClass.getPrice() != null && gymClass.getPrice().compareTo(BigDecimal.ZERO) > 0)
                ? gymClass.getPrice() : BigDecimal.valueOf(750000);

        long totalSessions = 12;
        if (gymClass != null && gymClass.getClassId() != null) {
            long count = scheduleRepository.countByGymClass_ClassId(gymClass.getClassId());
            if (count > 0) {
                totalSessions = count;
            }
        }
        BigDecimal sessionPrice = classPrice.divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);

        int rand = 1000 + RANDOM.nextInt(9000);
        Integer classId = gymClass != null ? gymClass.getClassId() : 0;
        String creditCode = "CRED-RESCHED-" + classId + "-" + member.getUserId() + "-" + rand;
        LocalDate expiryDate = LocalDate.now().plusDays(60);

        UserCredit credit = UserCredit.builder()
                .user(member)
                .gymClass(gymClass)
                .creditCode(creditCode)
                .amount(sessionPrice)
                .remainingAmount(sessionPrice)
                .reason(reasonNote + " (Giá trị 1 buổi: " + sessionPrice.longValue() + "đ)")
                .expiryDate(expiryDate)
                .status(CreditStatus.ACTIVE)
                .build();
        UserCredit savedCredit = userCreditRepository.save(credit);
        response.setCredit(savedCredit);
        responseRepository.save(response);

        String cName = gymClass != null ? gymClass.getClassName() : "Lớp học";
        Notification notif = Notification.builder()
                .user(member)
                .title("Hoàn 100% giá trị 1 buổi tập ca bù lớp " + cName)
                .message("Hệ thống đã tự động hoàn 1 lượt tập (Mã tín dụng: " + creditCode 
                        + " trị giá " + sessionPrice.longValue() + "đ / 1 buổi) vào ví của bạn. Lý do: " + reasonNote + ". Hạn dùng đến " 
                        + expiryDate + ".")
                .type("REFUND")
                .isRead(false)
                .build();
        notificationRepository.save(notif);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMemberRescheduleStatus(String memberEmail) {
        User member = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberEmail));

        List<RescheduleMemberResponse> responses = responseRepository.findByUser_EmailOrderByCreatedAtDesc(memberEmail);
        List<Map<String, Object>> result = new ArrayList<>();

        for (RescheduleMemberResponse r : responses) {
            ScheduleRescheduleRequest req = r.getRequest();
            GymClass gc = req.getGymClass();

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("responseId", r.getResponseId());
            map.put("requestId", req.getRequestId());
            map.put("classId", gc != null ? gc.getClassId() : null);
            map.put("className", gc != null ? gc.getClassName() : "Lớp học");
            map.put("coachName", req.getCoach() != null ? req.getCoach().getFullName() : "HLV");
            map.put("originalStartTime", req.getOriginalStartTime());
            map.put("proposedStartTime", req.getProposedStartTime());
            map.put("proposedEndTime", req.getProposedEndTime());
            map.put("responseStatus", r.getResponseStatus());
            map.put("confirmationDeadline", req.getConfirmationDeadline());
            map.put("reasonCategory", req.getReasonCategory());
            map.put("reasonDetails", req.getReasonDetails());
            map.put("creditCode", r.getCredit() != null ? r.getCredit().getCreditCode() : null);
            map.put("creditVoucherCode", r.getCredit() != null ? r.getCredit().getCreditCode() : null);
            map.put("creditAmount", r.getCredit() != null ? r.getCredit().getAmount() : null);
            result.add(map);
        }

        return result;
    }

    @Override
    public void processExpiredRescheduleDeadlines() {
        bookingRepository.lockOperations();
        LocalDateTime now = LocalDateTime.now();
        List<ScheduleRescheduleRequest> expiredRequests = requestRepository.findRequestsPassedDeadline(now);

        for (ScheduleRescheduleRequest req : expiredRequests) {
            if (!"MAKEUP_SESSION".equalsIgnoreCase(req.getAction_type())) {
                continue;
            }
            List<RescheduleMemberResponse> memberResponses = responseRepository.findByRequest_RequestId(req.getRequestId());

            for (RescheduleMemberResponse resp : memberResponses) {
                if ("PENDING".equalsIgnoreCase(resp.getResponseStatus())) {
                    try {
                        refundMemberCredit(resp, "Hết hạn xác nhận ca học bù: " + (req.getGymClass() != null ? req.getGymClass().getClassName() : ""));
                    } catch (Exception ex) {
                        System.err.println("Error auto-declining expired reschedule for user "
                                + resp.getUser().getEmail() + ": " + ex.getMessage());
                    }
                }
            }

            int minRequired = req.getMinAttendees() != null ? req.getMinAttendees() : 0;
            long acceptedCount = responseRepository.countByRequest_RequestIdAndResponseStatus(req.getRequestId(), "ACCEPTED");
            if (acceptedCount < minRequired) {
                List<RescheduleMemberResponse> acceptedMembers = responseRepository
                        .findByRequest_RequestIdAndResponseStatus(req.getRequestId(), "ACCEPTED");

                for (RescheduleMemberResponse acc : acceptedMembers) {
                    try {
                        refundMemberCredit(acc, "Hủy ca bù do không đạt sĩ số tối thiểu (" + acceptedCount + "/" + minRequired + ")");
                    } catch (Exception ex) {
                        System.err.println("Error refunding accepted member on canceled makeup session: " + ex.getMessage());
                    }
                }

                Schedule schedule = req.getSchedule();
                if (schedule != null) {
                    schedule.setStatus("CANCELLED_INSUFFICIENT_ATTENDEES");
                    scheduleRepository.save(schedule);
                }

                req.setStatus("CANCELLED");
                req.setAdminResponseNote("[HỦY CA BÙ TỰ ĐỘNG] Sĩ số học viên đồng ý (" + acceptedCount
                        + ") không đạt mức tối thiểu (" + minRequired + "). Đã hoàn lượt tập 100% cho toàn bộ học viên.");
                requestRepository.save(req);

                if (req.getCoach() != null) {
                    Notification coachNotif = Notification.builder()
                            .user(req.getCoach())
                            .title("Hủy ca dạy bù lớp " + (req.getGymClass() != null ? req.getGymClass().getClassName() : ""))
                            .message("Ca dạy bù ngày " + (req.getProposedStartTime() != null ? req.getProposedStartTime().format(TIME_FMT) : "")
                                    + " đã tự động hủy do chỉ có " + acceptedCount + " học viên xác nhận tham gia (tối thiểu "
                                    + minRequired + "). Hệ thống đã giải phóng phòng tập.")
                            .type("COACH_RESCHEDULE")
                            .isRead(false)
                            .build();
                    notificationRepository.save(coachNotif);
                }
            } else {
                req.setStatus("COMPLETED");
                String prevNote = req.getAdminResponseNote();
                String summary = "[CHỐT CA BÙ THÀNH CÔNG] Đạt đủ sĩ số tối thiểu (" + acceptedCount + "/" + minRequired + " học viên xác nhận tham gia).";
                req.setAdminResponseNote(prevNote != null && !prevNote.isBlank() ? prevNote + " | " + summary : summary);
                requestRepository.save(req);

                if (req.getCoach() != null) {
                    Notification coachNotif = Notification.builder()
                            .user(req.getCoach())
                            .title("Chốt ca dạy bù thành công: " + (req.getGymClass() != null ? req.getGymClass().getClassName() : ""))
                            .message("Ca dạy bù ngày " + (req.getProposedStartTime() != null ? req.getProposedStartTime().format(TIME_FMT) : "")
                                    + " đã đủ sĩ số (" + acceptedCount + "/" + minRequired + ") và chính thức được chốt.")
                            .type("COACH_RESCHEDULE")
                            .isRead(false)
                            .build();
                    notificationRepository.save(coachNotif);
                }
            }
        }
    }

    private RescheduleRequestResponseDto mapToDto(ScheduleRescheduleRequest r) {
        GymClass gc = r.getGymClass();
        Schedule s = r.getSchedule();
        Room origRoom = s != null ? s.getEffectiveRoom() : (gc != null ? gc.getRoom() : null);
        Room propRoom = r.getProposedRoom();

        long accepted = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "ACCEPTED");
        long declined = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "DECLINED_REFUNDED");
        long pending = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "PENDING");

        int totalEnrolled = 0;
        if (s != null) {
            int confirmedCount = (int) bookingRepository.findBySchedule_ScheduleId(s.getScheduleId())
                    .stream()
                    .filter(this::isConfirmedBooking)
                    .count();
            int respondedTotal = (int) (accepted + declined + pending);
            totalEnrolled = Math.max(confirmedCount, respondedTotal);
        }

        boolean hasRoomConflict = false;
        boolean hasCoachConflict = false;
        boolean hasMemberConflict = false;
        int changeover = resolveChangeoverMinutes(s, gc);
        Integer scheduleId = s != null ? s.getScheduleId() : null;

        if ("PENDING".equalsIgnoreCase(r.getStatus())) {
            if ("MAKEUP_SESSION".equalsIgnoreCase(r.getAction_type())
                    && r.getProposedStartTime() != null && r.getProposedEndTime() != null) {
                Integer roomId = propRoom != null ? propRoom.getRoomId() : (origRoom != null ? origRoom.getRoomId() : null);
                if (roomId != null) {
                    hasRoomConflict = !findRoomCollisionScheduleIds(
                            roomId, scheduleId, r.getProposedStartTime(), r.getProposedEndTime(), changeover).isEmpty();
                }
                if (r.getCoach() != null) {
                    hasCoachConflict = !findCoachCollisionScheduleIds(
                            r.getCoach().getUserId(), scheduleId, r.getProposedStartTime(), r.getProposedEndTime(), changeover).isEmpty();
                }
                if (!hasCoachConflict && gc != null && gc.getCoach() != null
                        && (r.getCoach() == null || !Objects.equals(gc.getCoach().getUserId(), r.getCoach().getUserId()))) {
                    hasCoachConflict = !findCoachCollisionScheduleIds(
                            gc.getCoach().getUserId(), scheduleId, r.getProposedStartTime(), r.getProposedEndTime(), changeover).isEmpty();
                }
                if (scheduleId != null) {
                    hasMemberConflict = hasConfirmedMemberConflict(scheduleId, r.getProposedStartTime(), r.getProposedEndTime());
                }
            } else if ("SUBSTITUTE_COACH".equalsIgnoreCase(r.getAction_type())
                    && r.getSubstituteCoach() != null && s != null
                    && s.getStartTime() != null && s.getEndTime() != null) {
                hasCoachConflict = !findCoachCollisionScheduleIds(
                        r.getSubstituteCoach().getUserId(), scheduleId, s.getStartTime(), s.getEndTime(), changeover).isEmpty();
            }
        }

        return RescheduleRequestResponseDto.builder()
                .requestId(r.getRequestId())
                .scheduleId(s != null ? s.getScheduleId() : null)
                .classId(gc != null ? gc.getClassId() : null)
                .className(gc != null ? gc.getClassName() : "Lớp học")
                .coachId(r.getCoach() != null ? r.getCoach().getUserId() : null)
                .coachName(r.getCoach() != null ? r.getCoach().getFullName() : "HLV")
                .coachEmail(r.getCoach() != null ? r.getCoach().getEmail() : null)
                .substituteCoachId(r.getSubstituteCoach() != null ? r.getSubstituteCoach().getUserId() : null)
                .substituteCoachName(r.getSubstituteCoach() != null ? r.getSubstituteCoach().getFullName() : null)
                .actionType(r.getAction_type())
                .originalStartTime(r.getOriginalStartTime())
                .originalEndTime(r.getOriginalEndTime())
                .originalRoomId(origRoom != null ? origRoom.getRoomId() : null)
                .originalRoomName(origRoom != null ? origRoom.getRoomName() : "Phòng tập")
                .proposedStartTime(r.getProposedStartTime())
                .proposedEndTime(r.getProposedEndTime())
                .proposedRoomId(propRoom != null ? propRoom.getRoomId() : null)
                .proposedRoomName(propRoom != null ? propRoom.getRoomName() : (origRoom != null ? origRoom.getRoomName() : null))
                .reasonCategory(r.getReasonCategory())
                .reasonDetails(r.getReasonDetails())
                .status(r.getStatus())
                .adminResponseNote(r.getAdminResponseNote())
                .reviewedById(r.getReviewedBy() != null ? r.getReviewedBy().getUserId() : null)
                .reviewedByName(r.getReviewedBy() != null ? r.getReviewedBy().getFullName() : null)
                .reviewedAt(r.getReviewedAt())
                .confirmationDeadline(r.getConfirmationDeadline())
                .minAttendees(r.getMinAttendees())
                .totalEnrolledMembers(totalEnrolled)
                .acceptedCount((int) accepted)
                .declinedCount((int) declined)
                .pendingCount((int) pending)
                .hasRoomConflict(hasRoomConflict)
                .hasCoachConflict(hasCoachConflict)
                .hasMemberConflict(hasMemberConflict)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
