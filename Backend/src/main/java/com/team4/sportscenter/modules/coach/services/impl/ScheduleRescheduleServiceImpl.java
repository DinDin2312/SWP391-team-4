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

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

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

        if ("CANCELLED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã bị hủy, không thể xin dời lịch.");
        }
        if ("RESCHEDULED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã được dời lịch và phê duyệt ca dạy bù, không thể tạo thêm yêu cầu.");
        }
        if ("SUBSTITUTE_ASSIGNED".equalsIgnoreCase(schedule.getStatus())) {
            throw new IllegalStateException("Ca học này đã được phân công HLV dạy thay, không thể tạo thêm yêu cầu.");
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
                proposedRoom = roomRepository.findById(dto.getProposedRoomId()).orElse(gymClass.getRoom());
            } else {
                proposedRoom = gymClass.getRoom();
            }

            // Backend Conflict Guard: Chặn tạo đơn nếu bị xung đột lịch cá nhân hoặc phòng
            long coachCollisions = requestRepository.countCoachCollisions(
                    coach.getUserId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime());
            if (coachCollisions > 0) {
                List<Schedule> coachSchedules = requestRepository.findCoachCollidingSchedules(
                        coach.getUserId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime());
                String conflictClass = !coachSchedules.isEmpty() ? coachSchedules.get(0).getGymClass().getClassName() : "lớp khác";
                throw new IllegalStateException("Xung đột lịch dạy cá nhân: Bạn đã có lớp '" + conflictClass + "' trùng vào khung giờ này!");
            }

            if (proposedRoom != null) {
                long roomCollisions = requestRepository.countRoomCollisions(
                        proposedRoom.getRoomId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime());
                if (roomCollisions > 0) {
                    List<Schedule> roomSchedules = requestRepository.findRoomCollidingSchedules(
                            proposedRoom.getRoomId(), schedule.getScheduleId(), dto.getProposedStartTime(), dto.getProposedEndTime());
                    String conflictClass = !roomSchedules.isEmpty() ? roomSchedules.get(0).getGymClass().getClassName() : "lớp khác";
                    throw new IllegalStateException("Xung đột phòng tập: Phòng '" + proposedRoom.getRoomName() + "' đã có lớp '" + conflictClass + "' sử dụng trong khung giờ này!");
                }
            }
        }

        User substituteCoach = null;
        if (dto.getRequestedSubstituteCoachId() != null) {
            substituteCoach = userRepository.findById(dto.getRequestedSubstituteCoachId()).orElse(null);
            requireQualifiedSubstitute(substituteCoach, schedule);
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

        LocalDateTime futureThreshold = LocalDateTime.now();

        List<Schedule> schedules = scheduleRepository.findAll().stream()
                .filter(s -> s.getStartTime() != null && s.getStartTime().isAfter(futureThreshold))
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> {
                    boolean isPrimary = s.getGymClass() != null && s.getGymClass().getCoach() != null
                            && Objects.equals(s.getGymClass().getCoach().getUserId(), coach.getUserId());
                    boolean isSub = s.getSubstituteCoach() != null
                            && Objects.equals(s.getSubstituteCoach().getUserId(), coach.getUserId());
                    return isPrimary || isSub;
                })
                .sorted(Comparator.comparing(Schedule::getStartTime))
                .toList();

        List<UpcomingScheduleOptionDto> result = new ArrayList<>();
        for (Schedule s : schedules) {
            GymClass gc = s.getGymClass();
            Integer enrolledCount = bookingRepository.findBySchedule_ScheduleId(s.getScheduleId()).size();

            Optional<ScheduleRescheduleRequest> pending = requestRepository
                    .findFirstBySchedule_ScheduleIdAndStatusInOrderByCreatedAtDesc(s.getScheduleId(), List.of("PENDING"));

            result.add(UpcomingScheduleOptionDto.builder()
                    .scheduleId(s.getScheduleId())
                    .classId(gc != null ? gc.getClassId() : null)
                    .className(gc != null ? gc.getClassName() : "Lớp học")
                    .roomId(gc != null && gc.getRoom() != null ? gc.getRoom().getRoomId() : null)
                    .roomName(gc != null && gc.getRoom() != null ? gc.getRoom().getRoomName() : "Phòng tập")
                    .startTime(s.getStartTime())
                    .endTime(s.getEndTime())
                    .enrolledCount(enrolledCount)
                    .status(s.getStatus())
                    .hasPendingRequest(pending.isPresent())
                    .existingRequestId(pending.map(ScheduleRescheduleRequest::getRequestId).orElse(null))
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
            room = roomRepository.findById(proposedRoomId).orElse(gymClass != null ? gymClass.getRoom() : null);
        } else if (gymClass != null) {
            room = gymClass.getRoom();
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

        // 1. Kiểm tra va chạm lịch dạy cá nhân HLV
        List<Schedule> coachCollisions = requestRepository.findCoachCollidingSchedules(
                coach.getUserId(), scheduleId, proposedStartTime, proposedEndTime);
        boolean hasCoachConflict = !coachCollisions.isEmpty();
        String coachConflictDetail = null;
        if (hasCoachConflict) {
            Schedule cs = coachCollisions.get(0);
            String timeStr = cs.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                    + " - " + cs.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm"));
            coachConflictDetail = "Bạn đã có lịch dạy lớp '" + cs.getGymClass().getClassName() + "' (" + timeStr + ") vào khung giờ này.";
        }

        // 2. Kiểm tra va chạm phòng tập
        boolean hasRoomConflict = false;
        String roomConflictDetail = null;
        if (room != null) {
            List<Schedule> roomCollisions = requestRepository.findRoomCollidingSchedules(
                    room.getRoomId(), scheduleId, proposedStartTime, proposedEndTime);
            hasRoomConflict = !roomCollisions.isEmpty();
            if (hasRoomConflict) {
                Schedule rs = roomCollisions.get(0);
                String roomCoach = rs.getSubstituteCoach() != null
                        ? rs.getSubstituteCoach().getFullName()
                        : (rs.getGymClass().getCoach() != null ? rs.getGymClass().getCoach().getFullName() : "HLV khác");
                String timeStr = rs.getStartTime().format(DateTimeFormatter.ofPattern("HH:mm"))
                        + " - " + rs.getEndTime().format(DateTimeFormatter.ofPattern("HH:mm"));
                roomConflictDetail = "Phòng '" + room.getRoomName() + "' đã có lớp '" + rs.getGymClass().getClassName()
                        + "' của " + roomCoach + " (" + timeStr + ").";
            }
        }

        boolean available = !hasCoachConflict && !hasRoomConflict;
        result.put("available", available);
        result.put("hasCoachConflict", hasCoachConflict);
        result.put("coachConflictDetail", coachConflictDetail);
        result.put("hasRoomConflict", hasRoomConflict);
        result.put("roomConflictDetail", roomConflictDetail);
        result.put("roomName", room != null ? room.getRoomName() : null);

        // 3. Tính toán khung giờ gợi ý trống trên cùng ngày nếu bị xung đột
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

                long cCol = requestRepository.countCoachCollisions(coach.getUserId(), scheduleId, slotStartTime, slotEndTime);
                long rCol = requestRepository.countRoomCollisions(room.getRoomId(), scheduleId, slotStartTime, slotEndTime);

                if (cCol == 0 && rCol == 0) {
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

        ScheduleRescheduleRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new IllegalStateException("Đơn yêu cầu này không ở trạng thái Chờ duyệt.");
        }

        Schedule schedule = request.getSchedule();
        GymClass gymClass = request.getGymClass();

        if ("MAKEUP_SESSION".equalsIgnoreCase(request.getAction_type())) {
            Integer roomId = request.getProposedRoom() != null ? request.getProposedRoom().getRoomId() : (gymClass.getRoom() != null ? gymClass.getRoom().getRoomId() : null);
            if (roomId != null) {
                long roomCollisions = requestRepository.countRoomCollisions(
                        roomId, schedule.getScheduleId(), request.getProposedStartTime(), request.getProposedEndTime());
                if (roomCollisions > 0) {
                    throw new IllegalStateException("Xung đột phòng tập: Phòng đã có lớp khác sử dụng trong khung giờ bù đề xuất!");
                }
            }

            schedule.setStartTime(request.getProposedStartTime());
            schedule.setEndTime(request.getProposedEndTime());
            schedule.setStatus("RESCHEDULED");
            scheduleRepository.save(schedule);

            int hours = (deadlineHoursBefore != null && deadlineHoursBefore > 0) ? deadlineHoursBefore : 4;
            LocalDateTime deadline = request.getProposedStartTime().minusHours(hours);
            if (deadline.isBefore(LocalDateTime.now())) {
                deadline = LocalDateTime.now().plusHours(2);
            }
            request.setConfirmationDeadline(deadline);
            request.setMinAttendees(customMinAttendees != null && customMinAttendees > 0 ? customMinAttendees : 2);

            List<Booking> bookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId());
            for (Booking b : bookings) {
                if ("CANCELLED".equalsIgnoreCase(b.getStatus())) continue;

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
                                + request.getProposedStartTime().format(TIME_FMT) 
                                + ". Vui lòng xác nhận tham gia hoặc nhận hoàn 100% lượt tập trước " 
                                + deadline.format(TIME_FMT) + ".")
                        .type("RESCHEDULE_DECISION")
                        .isRead(false)
                        .build();
                notificationRepository.save(notif);
            }
        } else if ("SUBSTITUTE_COACH".equalsIgnoreCase(request.getAction_type())) {
            if (request.getSubstituteCoach() != null) {
                requireQualifiedSubstitute(request.getSubstituteCoach(), schedule);
                schedule.setSubstituteCoach(request.getSubstituteCoach());
                schedule.setStatus("SUBSTITUTE_ASSIGNED");
                scheduleRepository.save(schedule);

                Notification subNotif = Notification.builder()
                        .user(request.getSubstituteCoach())
                        .title("Phân công dạy thay: " + gymClass.getClassName())
                        .message("Bạn được phân công đứng lớp dạy thay HLV " + request.getCoach().getFullName() 
                                + " ca " + schedule.getStartTime().format(TIME_FMT) + ".")
                        .type("COACH_ASSIGNMENT")
                        .isRead(false)
                        .build();
                notificationRepository.save(subNotif);

                List<Booking> bookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId());
                for (Booking b : bookings) {
                    if ("CANCELLED".equalsIgnoreCase(b.getStatus())) continue;
                    Notification notif = Notification.builder()
                            .user(b.getUser())
                            .title("Thông báo HLV dạy thay: " + gymClass.getClassName())
                            .message("Buổi học lúc " + schedule.getStartTime().format(TIME_FMT) + " sẽ do HLV " 
                                    + request.getSubstituteCoach().getFullName() + " phụ trách thay thế. Khung giờ học giữ nguyên.")
                            .type("CLASS_UPDATE")
                            .isRead(false)
                            .build();
                    notificationRepository.save(notif);
                }
            }
        }

        request.setStatus("APPROVED");
        request.setAdminResponseNote(adminNote != null ? adminNote.trim() : "Quản lý đã phê duyệt yêu cầu đổi lịch.");
        request.setReviewedBy(manager);
        request.setReviewedAt(LocalDateTime.now());
        ScheduleRescheduleRequest saved = requestRepository.save(request);

        Notification coachNotif = Notification.builder()
                .user(request.getCoach())
                .title("Đơn xin đổi lịch đã được phê duyệt #" + saved.getRequestId())
                .message("Quản lý (" + manager.getFullName() + ") đã phê duyệt đơn dời lịch lớp " 
                        + gymClass.getClassName() + ". Hệ thống đã tự động gửi thông báo xác nhận đến hội viên.")
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

        ScheduleRescheduleRequest targetRequest = null;
        Integer resolvedScheduleId = scheduleId;
        if (requestId != null) {
            targetRequest = requestRepository.findById(requestId).orElse(null);
            if (targetRequest != null && resolvedScheduleId == null && targetRequest.getSchedule() != null) {
                resolvedScheduleId = targetRequest.getSchedule().getScheduleId();
            }
        }

        if (resolvedScheduleId == null) {
            throw new IllegalArgumentException("ScheduleId is required.");
        }

        final Integer finalScheduleId = resolvedScheduleId;
        Schedule schedule = scheduleRepository.findById(finalScheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + finalScheduleId));

        User substituteCoach = userRepository.findById(substituteCoachId)
                .orElseThrow(() -> new IllegalArgumentException("Substitute coach not found: " + substituteCoachId));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerEmail));

        GymClass gymClass = schedule.getGymClass();

        requireQualifiedSubstitute(substituteCoach, schedule);
        long collisions = requestRepository.countCoachCollisions(
                substituteCoachId, finalScheduleId, schedule.getStartTime(), schedule.getEndTime());
        if (collisions > 0) {
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
            // Cập nhật đơn hiện tại thành APPROVED thay vì tạo bản ghi trùng lặp
            targetRequest.setSubstituteCoach(substituteCoach);
            targetRequest.setAction_type("SUBSTITUTE_COACH");
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

        List<Booking> bookings = bookingRepository.findBySchedule_ScheduleId(schedule.getScheduleId());
        for (Booking b : bookings) {
            if ("CANCELLED".equalsIgnoreCase(b.getStatus())) continue;
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

        List<User> allCoaches = userRepository.findByRoleNameIgnoreCase("Coach");
        List<Map<String, Object>> available = new ArrayList<>();

        for (User c : allCoaches) {
            if (!canSubstitute(c, schedule)) continue;
            long collisions = requestRepository.countCoachCollisions(
                    c.getUserId(), scheduleId, schedule.getStartTime(), schedule.getEndTime());
            if (collisions == 0) {
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
        User member = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberEmail));

        RescheduleMemberResponse response = responseRepository
                .findByRequest_RequestIdAndUser_UserId(requestId, member.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin ca bù cần phản hồi cho bạn."));

        if (!"PENDING".equalsIgnoreCase(response.getResponseStatus())) {
            throw new IllegalStateException("Bạn đã phản hồi ca bù này trước đó (" + response.getResponseStatus() + ").");
        }

        ScheduleRescheduleRequest request = response.getRequest();
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
        LocalDateTime now = LocalDateTime.now();
        List<ScheduleRescheduleRequest> expiredRequests = requestRepository.findRequestsPassedDeadline(now);

        for (ScheduleRescheduleRequest req : expiredRequests) {
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

            long acceptedCount = responseRepository.countByRequest_RequestIdAndResponseStatus(req.getRequestId(), "ACCEPTED");
            if (acceptedCount < req.getMinAttendees()) {
                List<RescheduleMemberResponse> acceptedMembers = responseRepository
                        .findByRequest_RequestIdAndResponseStatus(req.getRequestId(), "ACCEPTED");

                for (RescheduleMemberResponse acc : acceptedMembers) {
                    try {
                        refundMemberCredit(acc, "Hủy ca bù do không đạt sĩ số tối thiểu (" + acceptedCount + "/" + req.getMinAttendees() + ")");
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
                        + ") không đạt mức tối thiểu (" + req.getMinAttendees() + "). Đã hoàn lượt tập 100% cho toàn bộ học viên.");
                requestRepository.save(req);

                if (req.getCoach() != null) {
                    Notification coachNotif = Notification.builder()
                            .user(req.getCoach())
                            .title("Hủy ca dạy bù lớp " + (req.getGymClass() != null ? req.getGymClass().getClassName() : ""))
                            .message("Ca dạy bù ngày " + (req.getProposedStartTime() != null ? req.getProposedStartTime().format(TIME_FMT) : "") 
                                    + " đã tự động hủy do chỉ có " + acceptedCount + " học viên xác nhận tham gia (tối thiểu " 
                                    + req.getMinAttendees() + "). Hệ thống đã giải phóng phòng tập.")
                            .type("COACH_RESCHEDULE")
                            .isRead(false)
                            .build();
                    notificationRepository.save(coachNotif);
                }
            }
        }
    }

    @Override
    public RescheduleRequestResponseDto simulateDeadlineExpiration(Integer requestId) {
        ScheduleRescheduleRequest req = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu: " + requestId));

        req.setConfirmationDeadline(LocalDateTime.now().minusMinutes(1));
        requestRepository.save(req);

        processExpiredRescheduleDeadlines();

        ScheduleRescheduleRequest updated = requestRepository.findById(requestId).orElse(req);
        return mapToDto(updated);
    }

    private RescheduleRequestResponseDto mapToDto(ScheduleRescheduleRequest r) {
        GymClass gc = r.getGymClass();
        Schedule s = r.getSchedule();
        Room origRoom = gc != null ? gc.getRoom() : null;
        Room propRoom = r.getProposedRoom();

        Integer totalEnrolled = 0;
        if (s != null) {
            totalEnrolled = bookingRepository.findBySchedule_ScheduleId(s.getScheduleId()).size();
        }

        long accepted = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "ACCEPTED");
        long declined = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "DECLINED_REFUNDED");
        long pending = responseRepository.countByRequest_RequestIdAndResponseStatus(r.getRequestId(), "PENDING");

        boolean hasRoomConflict = false;
        boolean hasCoachConflict = false;
        if (r.getProposedStartTime() != null && r.getProposedEndTime() != null) {
            Integer roomId = propRoom != null ? propRoom.getRoomId() : (origRoom != null ? origRoom.getRoomId() : null);
            if (roomId != null) {
                hasRoomConflict = requestRepository.countRoomCollisions(
                        roomId, s != null ? s.getScheduleId() : 0, r.getProposedStartTime(), r.getProposedEndTime()) > 0;
            }
            if (r.getCoach() != null) {
                hasCoachConflict = requestRepository.countCoachCollisions(
                        r.getCoach().getUserId(), s != null ? s.getScheduleId() : 0, r.getProposedStartTime(), r.getProposedEndTime()) > 0;
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
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
