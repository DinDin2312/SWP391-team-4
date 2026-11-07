package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.entities.AiWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.TraineeAssessment;
import com.team4.sportscenter.modules.coach.repositories.AiWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.repositories.ScheduleRescheduleRequestRepository;
import com.team4.sportscenter.modules.coach.entities.ScheduleRescheduleRequest;
import com.team4.sportscenter.modules.coach.repositories.TraineeAssessmentRepository;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.health.MemberHealthSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachScheduleServiceImpl implements CoachScheduleService {

    private final CoachScheduleRepository coachScheduleRepository;
    private final BookingRepository bookingRepository;
    private final com.team4.sportscenter.modules.auth.repositories.UserRepository userRepository;
    private final AiWorkoutPlanRepository aiWorkoutPlanRepository;
    private final CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    private final TraineeAssessmentRepository traineeAssessmentRepository;
    private final ScheduleRescheduleRequestRepository rescheduleRequestRepository;
    private final com.team4.sportscenter.modules.member.health.MemberHealthService memberHealthService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper jsonMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    public static class FrontDeskCheckInInfo {
        private final boolean checkedIn;
        private final java.time.LocalDateTime checkInTime;
        private final String checkInType;

        public FrontDeskCheckInInfo(boolean checkedIn, java.time.LocalDateTime checkInTime, String checkInType) {
            this.checkedIn = checkedIn;
            this.checkInTime = checkInTime;
            this.checkInType = checkInType;
        }

        public boolean isCheckedIn() { return checkedIn; }
        public java.time.LocalDateTime getCheckInTime() { return checkInTime; }
        public String getCheckInType() { return checkInType; }
    }

    private Map<Integer, FrontDeskCheckInInfo> getTodayFrontDeskCheckInsByUser() {
        LocalDate today = LocalDate.now();
        java.time.LocalDateTime startOfDay = today.atStartOfDay();
        java.time.LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT entity_id, changes_json, created_at FROM AUDIT_LOGS " +
                "WHERE entity_type = 'MEMBER_CHECKIN' AND created_at >= ? AND created_at < ?",
                java.sql.Timestamp.valueOf(startOfDay),
                java.sql.Timestamp.valueOf(endOfDay)
        );

        Map<Integer, FrontDeskCheckInInfo> userMap = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String entityId = (String) row.get("entity_id");
            String changesJson = (String) row.get("changes_json");
            java.time.LocalDateTime createdAt = null;
            Object createdObj = row.get("created_at");
            if (createdObj instanceof java.sql.Timestamp ts) {
                createdAt = ts.toLocalDateTime();
            } else if (createdObj instanceof java.time.LocalDateTime ldt) {
                createdAt = ldt;
            }

            Integer userId = null;
            String checkInType = "CLASS_SESSION";
            if (changesJson != null && !changesJson.isBlank()) {
                try {
                    Map<String, Object> map = jsonMapper.readValue(changesJson, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});
                    if (map.get("userId") instanceof Number n) userId = n.intValue();
                    if (map.get("checkInType") instanceof String s) checkInType = s;
                } catch (Exception ignored) {}
            }
            if (userId == null && entityId != null) {
                try { userId = Integer.parseInt(entityId); } catch (Exception ignored) {}
            }
            if (userId != null) {
                userMap.put(userId, new FrontDeskCheckInInfo(true, createdAt, checkInType));
            }
        }
        return userMap;
    }

    private Map<Integer, TraineeAssessment> findLatestAssessmentsByUserIds(List<Integer> userIds) {
        if (userIds == null || userIds.isEmpty()) return Collections.emptyMap();
        Map<Integer, TraineeAssessment> latestMap = new HashMap<>();
        for (TraineeAssessment a : traineeAssessmentRepository.findByUserIdsOrderByCreatedAtDesc(userIds)) {
            if (a.getUser() != null) {
                latestMap.putIfAbsent(a.getUser().getUserId(), a);
            }
        }
        return latestMap;
    }

    private EnrolledStudentResponse toEnrolledStudent(
            Booking b,
            FrontDeskCheckInInfo fd,
            MemberHealthSummary health,
            TraineeAssessment latestAssessment) {
        User u = b.getUser();
        String avatarPath = u.getAvatarPath();
        return EnrolledStudentResponse.builder()
                .bookingId(b.getBookingId())
                .userId(u.getUserId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .avatarPath(avatarPath)
                .avatarUrl(avatarPath != null && !avatarPath.isBlank() ? "/api/avatars/" + avatarPath : null)
                .bookingStatus(b.getStatus())
                .attendanceStatus(b.getAttendanceStatus() != null ? b.getAttendanceStatus() : "NOT_YET")
                .checkedInAtFrontDesk(fd != null && fd.isCheckedIn())
                .frontDeskCheckInTime(fd != null ? fd.getCheckInTime() : null)
                .frontDeskCheckInType(fd != null ? fd.getCheckInType() : null)
                .health(health)
                .height(latestAssessment != null ? latestAssessment.getHeight() : null)
                .weight(latestAssessment != null ? latestAssessment.getWeight() : null)
                .build();
    }

    @Override
    public List<CoachScheduleResponse> getCoachSchedules(String coachEmail) {
        List<Schedule> schedules = coachScheduleRepository.findSchedulesByCoachEmail(coachEmail);
        if (schedules == null || schedules.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Integer, FrontDeskCheckInInfo> frontDeskMap = getTodayFrontDeskCheckInsByUser();
        List<Integer> scheduleIds = schedules.stream().map(Schedule::getScheduleId).collect(Collectors.toList());

        List<Booking> allBookings = coachScheduleRepository.findBookingsByScheduleIds(scheduleIds);
        Map<Integer, List<Booking>> bookingsByScheduleId = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getSchedule().getScheduleId()));

        List<ScheduleRescheduleRequest> pendingRequests = rescheduleRequestRepository
                .findBySchedule_ScheduleIdInAndStatusInOrderByCreatedAtDesc(scheduleIds, List.of("PENDING"));
        Map<Integer, ScheduleRescheduleRequest> pendingMapByScheduleId = new HashMap<>();
        for (ScheduleRescheduleRequest req : pendingRequests) {
            if (req.getSchedule() != null) {
                pendingMapByScheduleId.putIfAbsent(req.getSchedule().getScheduleId(), req);
            }
        }

        List<User> distinctUsers = allBookings.stream().map(Booking::getUser).filter(Objects::nonNull).toList();
        List<Integer> distinctUserIds = distinctUsers.stream().map(User::getUserId).distinct().toList();
        Map<Integer, MemberHealthSummary> healthCache = memberHealthService.summariesFor(distinctUsers);
        Map<Integer, TraineeAssessment> latestAssessments = findLatestAssessmentsByUserIds(distinctUserIds);

        return schedules.stream().map(schedule -> {
            List<Booking> bookings = bookingsByScheduleId.getOrDefault(schedule.getScheduleId(), Collections.emptyList());

            List<EnrolledStudentResponse> students = bookings.stream().map(b -> {
                Integer uid = b.getUser().getUserId();
                return toEnrolledStudent(
                        b,
                        frontDeskMap.get(uid),
                        healthCache.get(uid),
                        latestAssessments.get(uid)
                );
            }).collect(Collectors.toList());

            boolean isSub = schedule.getSubstituteCoach() != null && schedule.getSubstituteCoach().getEmail().equalsIgnoreCase(coachEmail);
            String primaryCoachName = schedule.getGymClass().getCoach() != null ? schedule.getGymClass().getCoach().getFullName() : null;
            ScheduleRescheduleRequest pendingReq = pendingMapByScheduleId.get(schedule.getScheduleId());

            return CoachScheduleResponse.builder()
                    .scheduleId(schedule.getScheduleId())
                    .classId(schedule.getGymClass().getClassId())
                    .className(schedule.getGymClass().getClassName())
                    .roomName(schedule.getGymClass().getRoom().getRoomName())
                    .startTime(schedule.getStartTime())
                    .endTime(schedule.getEndTime())
                    .status(schedule.getStatus())
                    .coachName(primaryCoachName)
                    .substituteCoachName(schedule.getSubstituteCoach() != null ? schedule.getSubstituteCoach().getFullName() : null)
                    .isSubstituteForCurrentCoach(isSub)
                    .hasPendingReschedule(pendingReq != null)
                    .pendingRescheduleRequestId(pendingReq != null ? pendingReq.getRequestId() : null)
                    .maxSlots(schedule.getGymClass().getMaxSlots())
                    .enrolledCount(students.size())
                    .enrolledStudents(students)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<CoachStudentResponse> getCoachStudents(String coachEmail) {
        return getCoachStudents(coachEmail, null);
    }

    @Override
    public List<CoachStudentResponse> getCoachStudents(String coachEmail, Integer classId) {
        List<Booking> bookings = coachScheduleRepository.findBookingsByCoachEmail(coachEmail);

        if (classId != null) {
            bookings = bookings.stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                            && classId.equals(b.getSchedule().getGymClass().getClassId()))
                    .collect(Collectors.toList());
        }

        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }

        Map<User, List<Booking>> userBookingsMap = bookings.stream()
                .collect(Collectors.groupingBy(Booking::getUser));
        List<Integer> userIds = userBookingsMap.keySet().stream().map(User::getUserId).toList();

        // Batch fetch AI workout plans, Coach workout plans, Assessments & Health profiles in 4 queries total
        Map<Integer, AiWorkoutPlan> latestAiPlanByUser = new HashMap<>();
        for (AiWorkoutPlan p : aiWorkoutPlanRepository.findByUserIdsOrderByCreatedAtDesc(userIds)) {
            if (p.getUser() != null) {
                latestAiPlanByUser.putIfAbsent(p.getUser().getUserId(), p);
            }
        }

        Map<Integer, List<String>> assignedPlansByUser = new HashMap<>();
        for (CoachWorkoutPlan p : coachWorkoutPlanRepository.findByCoachEmailAndUserIdsOrderByCreatedAtDesc(coachEmail, userIds)) {
            if (p.getUser() != null) {
                assignedPlansByUser.computeIfAbsent(p.getUser().getUserId(), k -> new ArrayList<>()).add(p.getTitle());
            }
        }

        Map<Integer, TraineeAssessment> latestAssessmentByUser = findLatestAssessmentsByUserIds(userIds);
        Map<Integer, MemberHealthSummary> healthByUser = memberHealthService.summariesFor(userBookingsMap.keySet());

        List<CoachStudentResponse> result = new ArrayList<>(userBookingsMap.size());

        for (Map.Entry<User, List<Booking>> entry : userBookingsMap.entrySet()) {
            User user = entry.getKey();
            Integer uid = user.getUserId();
            List<Booking> userBookings = entry.getValue();

            Set<String> enrolledClasses = userBookings.stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null)
                    .map(b -> b.getSchedule().getGymClass().getClassName())
                    .collect(Collectors.toSet());

            Set<Integer> enrolledClassIds = userBookings.stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null)
                    .map(b -> b.getSchedule().getGymClass().getClassId())
                    .collect(Collectors.toSet());

            AiWorkoutPlan latestAi = latestAiPlanByUser.get(uid);
            String workoutGoal = latestAi != null ? latestAi.getGoal() : null;
            String fitnessLevel = latestAi != null ? latestAi.getFitnessLevel() : null;
            List<String> assignedPlans = assignedPlansByUser.getOrDefault(uid, Collections.emptyList());

            TraineeAssessment latestAssessment = latestAssessmentByUser.get(uid);

            BigDecimal weight = null;
            BigDecimal height = null;
            BigDecimal bodyFatPercentage = null;
            BigDecimal muscleMass = null;
            BigDecimal bmi = null;
            String latestAssessmentTitle = null;
            LocalDateTime metricsUpdatedAt = null;
            Boolean isSelfRecorded = null;

            if (latestAssessment != null) {
                weight = latestAssessment.getWeight();
                height = latestAssessment.getHeight();
                bodyFatPercentage = latestAssessment.getBodyFatPercentage();
                muscleMass = latestAssessment.getMuscleMass();
                latestAssessmentTitle = latestAssessment.getAssessmentTitle();
                metricsUpdatedAt = latestAssessment.getCreatedAt();
                isSelfRecorded = latestAssessment.getCoach() != null && latestAssessment.getCoach().getUserId().equals(uid);
                if (weight != null && height != null && height.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal heightMeters = height.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
                    BigDecimal heightSquared = heightMeters.multiply(heightMeters);
                    if (heightSquared.compareTo(BigDecimal.ZERO) > 0) {
                        bmi = weight.divide(heightSquared, 1, RoundingMode.HALF_UP);
                    }
                }
            }

            result.add(CoachStudentResponse.builder()
                    .userId(uid)
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .bio(user.getBio())
                    .avatarPath(user.getAvatarPath())
                    .avatarUrl(user.getAvatarPath() != null && !user.getAvatarPath().isBlank() ? "/api/avatars/" + user.getAvatarPath() : null)
                    .totalBookings(userBookings.size())
                    .enrolledClasses(new ArrayList<>(enrolledClasses))
                    .enrolledClassIds(new ArrayList<>(enrolledClassIds))
                    .workoutGoal(workoutGoal)
                    .fitnessLevel(fitnessLevel)
                    .assignedPlans(assignedPlans)
                    .health(healthByUser.get(uid))
                    .weight(weight)
                    .height(height)
                    .bodyFatPercentage(bodyFatPercentage)
                    .muscleMass(muscleMass)
                    .bmi(bmi)
                    .latestAssessmentTitle(latestAssessmentTitle)
                    .metricsUpdatedAt(metricsUpdatedAt)
                    .isSelfRecorded(isSelfRecorded)
                    .build());
        }

        return result;
    }

    @Override
    public List<EnrolledStudentResponse> getScheduleStudents(Integer scheduleId, String coachEmail) {
        Schedule schedule = coachScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch học với ID: " + scheduleId));

        boolean isMainCoach = schedule.getGymClass() != null && schedule.getGymClass().getCoach() != null
                && schedule.getGymClass().getCoach().getEmail().equalsIgnoreCase(coachEmail);
        boolean isSubCoach = schedule.getSubstituteCoach() != null
                && schedule.getSubstituteCoach().getEmail().equalsIgnoreCase(coachEmail);
        if (!isMainCoach && !isSubCoach) {
            throw new RuntimeException("Bạn không có quyền xem danh sách học viên của lịch học này.");
        }

        List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(scheduleId);
        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }
        Map<Integer, FrontDeskCheckInInfo> frontDeskMap = getTodayFrontDeskCheckInsByUser();
        List<User> users = bookings.stream().map(Booking::getUser).filter(Objects::nonNull).toList();
        List<Integer> userIds = users.stream().map(User::getUserId).distinct().toList();
        Map<Integer, MemberHealthSummary> healthMap = memberHealthService.summariesFor(users);
        Map<Integer, TraineeAssessment> latestAssessments = findLatestAssessmentsByUserIds(userIds);

        return bookings.stream().map(b -> {
            Integer uid = b.getUser().getUserId();
            return toEnrolledStudent(b, frontDeskMap.get(uid), healthMap.get(uid), latestAssessments.get(uid));
        }).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateAttendance(Integer scheduleId, UpdateAttendanceRequest request, String coachEmail) {
        Schedule schedule = coachScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch học với ID: " + scheduleId));

        boolean isMainCoach = schedule.getGymClass().getCoach() != null && schedule.getGymClass().getCoach().getEmail().equalsIgnoreCase(coachEmail);
        boolean isSubCoach = schedule.getSubstituteCoach() != null && schedule.getSubstituteCoach().getEmail().equalsIgnoreCase(coachEmail);

        if (!isMainCoach && !isSubCoach) {
            throw new RuntimeException("Bạn không có quyền điểm danh cho lịch học này.");
        }

        // Validate date: allow attendance on session date OR within 24 hours after session ends
        LocalDate sessionDate = schedule.getStartTime().toLocalDate();
        LocalDate today = LocalDate.now();
        if (sessionDate.isAfter(today)) {
            throw new RuntimeException("Chưa đến ngày học! Chỉ có thể thực hiện điểm danh khi buổi học diễn ra hoặc trong vòng 24 giờ sau ca học.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (schedule.getEndTime().plusHours(24).isBefore(now)) {
            throw new RuntimeException("Buổi học đã kết thúc quá 24 giờ! Đã hết thời hạn điểm danh cho ca học này.");
        }

        if (request == null || request.getAttendances() == null || request.getAttendances().isEmpty()) {
            return;
        }

        List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(scheduleId);
        Map<Integer, Booking> bookingMapByBookingId = bookings.stream()
                .collect(Collectors.toMap(Booking::getBookingId, b -> b, (b1, b2) -> b1));
        Map<Integer, Booking> bookingMapByUserId = bookings.stream()
                .collect(Collectors.toMap(b -> b.getUser().getUserId(), b -> b, (b1, b2) -> b1));
        Map<Integer, FrontDeskCheckInInfo> frontDeskMap = getTodayFrontDeskCheckInsByUser();

        for (UpdateAttendanceRequest.StudentAttendanceItem item : request.getAttendances()) {
            Booking booking = null;
            if (item.getBookingId() != null) {
                booking = bookingMapByBookingId.get(item.getBookingId());
            }
            if (booking == null && item.getUserId() != null) {
                booking = bookingMapByUserId.get(item.getUserId());
            }

            if (booking != null) {
                String oldStatus = booking.getAttendanceStatus() == null ? "NOT_YET" : booking.getAttendanceStatus();
                String newStatus = item.getAttendanceStatus();
                if (newStatus != null) {
                    newStatus = newStatus.trim().toUpperCase();
                    if ("PRESENT".equals(newStatus)) {
                        FrontDeskCheckInInfo fd = frontDeskMap.get(booking.getUser().getUserId());
                        boolean checkedIn = fd != null && fd.isCheckedIn();
                        boolean overrideAllowed = Boolean.TRUE.equals(item.getOverrideFrontDeskCheckIn());
                        if (!checkedIn && !overrideAllowed) {
                            throw new RuntimeException("Học viên " + booking.getUser().getFullName() + " chưa thực hiện Check-in tại quầy lễ tân hôm nay. Vui lòng nhắc học viên qua quầy lễ tân hoặc chọn 'Xác nhận có mặt trực tiếp'.");
                        }
                        if (!checkedIn && overrideAllowed) {
                            backfillMemberCheckIn(booking, schedule, coachEmail);
                            frontDeskMap.put(booking.getUser().getUserId(), new FrontDeskCheckInInfo(true, LocalDateTime.now(), "COACH_OVERRIDE"));
                        }
                    }
                    if (newStatus.equals("PRESENT") || newStatus.equals("ABSENT") || newStatus.equals("NOT_YET")) {
                        booking.setAttendanceStatus(newStatus);
                        bookingRepository.save(booking);
                        
                        com.team4.sportscenter.modules.auth.entities.User member = booking.getUser();
                        int points = member.getLoyaltyPoints() == null ? 0 : member.getLoyaltyPoints();
                        
                        if (!"PRESENT".equals(oldStatus) && "PRESENT".equals(newStatus)) {
                            member.setLoyaltyPoints(points + 10);
                            userRepository.save(member);
                        } else if ("PRESENT".equals(oldStatus) && !"PRESENT".equals(newStatus)) {
                            member.setLoyaltyPoints(Math.max(0, points - 10));
                            userRepository.save(member);
                        }
                    }
                }
            }
        }
    }

    private void backfillMemberCheckIn(Booking booking, Schedule schedule, String coachEmail) {
        try {
            User member = booking.getUser();
            User coach = schedule.getGymClass() != null ? schedule.getGymClass().getCoach() : null;
            String coachName = coach != null && coach.getFullName() != null ? coach.getFullName() : coachEmail;
            String cleanCoachName = coachName.replaceFirst("^(?i)(HLV|Coach)\\s+", "").trim();
            String displayCoachName = "HLV " + cleanCoachName;
            String className = schedule.getGymClass() != null && schedule.getGymClass().getClassName() != null
                    ? schedule.getGymClass().getClassName() : "lớp học";
            String roomName = (schedule.getGymClass() != null && schedule.getGymClass().getRoom() != null)
                    ? schedule.getGymClass().getRoom().getRoomName() : "Phòng tập";
            Integer roomId = (schedule.getGymClass() != null && schedule.getGymClass().getRoom() != null)
                    ? schedule.getGymClass().getRoom().getRoomId() : null;

            LocalDateTime now = LocalDateTime.now().withNano(0);
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("userId", member.getUserId());
            payload.put("memberName", member.getFullName());
            payload.put("memberEmail", member.getEmail());
            payload.put("memberPhone", member.getPhone());
            payload.put("membershipId", null);
            payload.put("bookingId", booking.getBookingId());
            payload.put("checkInType", "COACH_OVERRIDE");
            payload.put("gymAccessGranted", false);
            payload.put("classAccessGranted", true);
            payload.put("accessCode", "CLASS-" + booking.getBookingId());
            payload.put("packageName", "Lớp: " + className);
            payload.put("packageType", "CLASS");
            payload.put("roomId", roomId);
            payload.put("facilityName", roomName);
            payload.put("note", "Check-in bổ sung: " + displayCoachName + " xác nhận có mặt trực tiếp tại lớp " + className);
            payload.put("status", "CHECKED_IN");
            payload.put("attendanceStatus", "PRESENT");
            payload.put("hasAnomaly", true);
            payload.put("anomalyReason", "Chưa qua cổng lễ tân: " + displayCoachName + " xác nhận có mặt trực tiếp tại lớp " + className);
            payload.put("checkInTime", now.toString());
            payload.put("checkOutTime", null);
            payload.put("checkedInBy", coachEmail);

            String jsonString = jsonMapper.writeValueAsString(payload);
            String details = String.format("Check-in bổ sung: %s duyệt có mặt trực tiếp cho hội viên %s (#%d) - Lớp %s",
                    displayCoachName, member.getFullName(), member.getUserId(), className);

            jdbcTemplate.update(
                    "INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at) " +
                    "VALUES (?, 'CHECK_IN', 'MEMBER_CHECKIN', ?, ?, ?, ?)",
                    coachEmail,
                    String.valueOf(member.getUserId()),
                    details,
                    jsonString,
                    java.sql.Timestamp.valueOf(now)
            );
        } catch (Exception e) {
            System.err.println("Failed to backfill member check-in: " + e.getMessage());
        }
    }
}
