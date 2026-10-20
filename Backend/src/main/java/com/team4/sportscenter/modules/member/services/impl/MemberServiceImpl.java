package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.CalendarBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.auth.entities.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.Map;
import java.util.ArrayList;
import com.team4.sportscenter.modules.member.dtos.response.RecentActivityResponse;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.UserMembershipRepository;
import com.team4.sportscenter.modules.member.services.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.Locale;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

import java.util.Collections;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.TraineeAssessmentRepository;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.TraineeAssessment;
import com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse;
import com.team4.sportscenter.modules.coach.services.impl.CoachAssessmentServiceImpl;
import com.team4.sportscenter.modules.member.dtos.response.EnrolledClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.MemberWorkoutPlanResponse;
import com.team4.sportscenter.modules.member.dtos.response.MemberWorkoutExerciseResponse;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final UserMembershipRepository membershipRepository;
    private final com.team4.sportscenter.modules.member.services.PackageBenefitsService packageBenefits;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;
    private final com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    private final BookingRepository bookingRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final com.team4.sportscenter.modules.member.repositories.PackageRepository packageRepository;
    private final NotificationRepository notificationRepository;
    private final CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    private final CoachClassRepository coachClassRepository;
    private final TraineeAssessmentRepository traineeAssessmentRepository;

    @Override
    public MemberMembershipResponse getMyActiveMembership(String email) {
        java.util.List<UserMembership> allActive = membershipRepository.findActiveMembershipByEmail(email);
        if (allActive != null) {
            allActive.forEach(m -> {
                if (m.getEndDate() != null && m.getEndDate().isBefore(LocalDate.now())) {
                    m.setStatus("EXPIRED");
                    membershipRepository.save(m);
                }
            });
        }

        java.util.List<UserMembership> memberships = membershipRepository.findActiveMembershipByEmail(email);

        if (memberships == null || memberships.isEmpty()) {
            return null;
        }

        String targetType = memberships.stream().anyMatch(m -> "GYM_ACCESS".equals(m.purchasedType())) ? "GYM_ACCESS"
                : memberships.get(0).purchasedType();

        long totalRemainingDays = memberships.stream()
                .filter(m -> targetType.equals(m.purchasedType()))
                .map(UserMembership::getEndDate)
                .max(LocalDate::compareTo)
                .map(date -> ChronoUnit.DAYS.between(LocalDate.now(), date))
                .orElse(0L);

        if (totalRemainingDays < 0)
            totalRemainingDays = 0;

        UserMembership bestMembership = memberships.stream()
                .filter(m -> targetType.equals(m.purchasedType()))
                .max(Comparator.comparingInt(UserMembership::purchasedDuration))
                .orElse(memberships.get(0));

        return MemberMembershipResponse.builder()
                .packageName(bestMembership.purchasedName())
                .packageType(bestMembership.purchasedType())
                .startDate(bestMembership.getStartDate())
                .endDate(LocalDate.now().plusDays(totalRemainingDays))
                .status(bestMembership.getStatus())
                .remainingDays((int) totalRemainingDays)
                .build();
    }

    @Override
    public List<UpcomingBookingResponse> getMyUpcomingBookings(String email) {
        // Fetch booking list from database
        List<Booking> bookings = bookingRepository.findUpcomingBookingsByEmail(email, LocalDateTime.now());

        return bookings.stream().map(b -> {
            long duration = ChronoUnit.MINUTES.between(b.getSchedule().getStartTime(), b.getSchedule().getEndTime());
            return UpcomingBookingResponse.builder()
                    .bookingId(b.getBookingId()).classId(b.getSchedule().getGymClass().getClassId())
                    .className(b.getSchedule().getGymClass().getClassName())
                    .coachName(b.getSchedule().getGymClass().getCoach().getFullName())
                    .roomName(b.getSchedule().getGymClass().getRoom().getRoomName())
                    .startTime(b.getSchedule().getStartTime())
                    .endTime(b.getSchedule().getEndTime())
                    .durationMinutes(duration)
                    .status(b.getStatus())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public long getTotalCheckIns(String email) {
        List<Booking> attended = bookingRepository.findAttendedBookingsByEmail(email);

        // Count distinct training days
        return attended.stream()
                .map(b -> b.getSchedule().getStartTime().toLocalDate())
                .distinct()
                .count();
    }

    @Override
    public List<RecentActivityResponse> getRecentActivities(String email) {
        List<Booking> pastBookings = bookingRepository.findPastBookingsByEmail(email, LocalDateTime.now());

        return pastBookings.stream().map(b -> {
            long duration = java.time.Duration.between(b.getSchedule().getStartTime(), b.getSchedule().getEndTime())
                    .toMinutes();

            int seed = Math.abs(java.util.Objects.hash(
                    b.getBookingId(),
                    b.getSchedule().getScheduleId(),
                    b.getSchedule().getGymClass().getClassId()));
            long effectiveDuration = duration > 0 ? duration : 60;
            int calories = (int) (effectiveDuration * 5) + (seed % 120);
            int avgHr = 115 + (seed % 35);

            return RecentActivityResponse.builder()
                    .bookingId(b.getBookingId()).classId(b.getSchedule().getGymClass().getClassId())
                    .className(b.getSchedule().getGymClass().getClassName())
                    .coachName(b.getSchedule().getGymClass().getCoach().getFullName())
                    .roomName(b.getSchedule().getGymClass().getRoom().getRoomName())
                    .startTime(b.getSchedule().getStartTime())
                    .durationMinutes(duration)
                    .status(b.getStatus())
                    .calories(calories)
                    .avgHr(avgHr)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<CalendarBookingResponse> getAllCalendarBookings(String email) {
        List<Booking> bookings = bookingRepository.findAllBookingsByEmail(email);
        return bookings.stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()) && !"PENDING".equals(b.getStatus()))
                .map(b -> CalendarBookingResponse.builder()
                        .bookingId(b.getBookingId()).classId(b.getSchedule().getGymClass().getClassId())
                        .className(b.getSchedule().getGymClass().getClassName())
                        .coachName(b.getSchedule().getGymClass().getCoach().getFullName())
                        .roomName(b.getSchedule().getGymClass().getRoom().getRoomName())
                        .startTime(b.getSchedule().getStartTime())
                        .endTime(b.getSchedule().getEndTime())
                        .status(b.getStatus())
                        .attendanceStatus(b.getAttendanceStatus())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<AvailableClassResponse> getAvailableClasses() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : null;
        LocalDateTime currentTime = LocalDateTime.now();
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(currentTime);

        Map<GymClass, List<Schedule>> classSchedules = schedules.stream()
                .collect(Collectors.groupingBy(Schedule::getGymClass));

        List<AvailableClassResponse> response = new ArrayList<>();

        for (Map.Entry<GymClass, List<Schedule>> entry : classSchedules.entrySet()) {
            GymClass gymClass = entry.getKey();
            List<Schedule> classScheds = entry.getValue();

            classScheds.sort(Comparator.comparing(Schedule::getStartTime));
            Schedule nextSession = classScheds.get(0);

            // Find max booked slots across all sessions
            int bookedSlots = 0;
            for (Schedule s : classScheds) {
                int booked = bookingRepository.countBookedSlots(s.getScheduleId());
                if (booked > bookedSlots)
                    bookedSlots = booked;
            }

            Boolean isBooked = bookingRepository.existsByEmailAndClassId(email, gymClass.getClassId());

            Integer duration = (int) ChronoUnit.MINUTES.between(nextSession.getStartTime(), nextSession.getEndTime());

            Set<DayOfWeek> days = classScheds.stream()
                    .map(s -> s.getStartTime().getDayOfWeek())
                    .collect(Collectors.toSet());
            String pattern = days.stream()
                    .sorted()
                    .map(d -> d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .collect(Collectors.joining(", "));

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
            List<String> dates = classScheds.stream()
                    .map(s -> s.getStartTime().format(formatter))
                    .collect(Collectors.toList());

            response.add(AvailableClassResponse.builder()
                    .classId(gymClass.getClassId())
                    .subjectId(gymClass.getSubjectId())
                    .roomId(gymClass.getRoom().getRoomId())
                    .lastSessionTime(classScheds.stream().map(Schedule::getEndTime).max(LocalDateTime::compareTo)
                            .orElseThrow().minusNanos(1))
                    .className(gymClass.getClassName())
                    .coachName(gymClass.getCoach().getFullName())
                    .roomName(gymClass.getRoom().getRoomName())
                    .price(gymClass.getPrice())
                    .maxSlots(gymClass.getMaxSlots())
                    .bookedSlots(bookedSlots)
                    .isBookedByMe(isBooked)
                    .totalSessions(classScheds.size())
                    .nextSessionTime(nextSession.getStartTime())
                    .durationMinutes(duration)
                    .schedulePattern(pattern)
                    .upcomingDates(dates)
                    .build());
        }

        response.sort(Comparator.comparing(AvailableClassResponse::getNextSessionTime));
        return response;
    }

    @Override
    @Transactional
    public void bookClass(String email, Integer classId) {
        bookCourse(email, classId, null);
    }

    @Override
    @Transactional
    public void bookClassUsingPackage(String email, Integer classId, Integer membershipId) {
        bookCourse(email, classId, membershipId);
    }

    private void bookCourse(String email, Integer classId, Integer membershipId) {
        bookingRepository.lockOperations();
        if (bookingRepository.existsByEmailAndClassId(email, classId)) {
            throw new RuntimeException("You have already booked this course.");
        }

        LocalDateTime currentTime = LocalDateTime.now();
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(currentTime).stream()
                .filter(s -> s.getGymClass().getClassId().equals(classId))
                .toList();

        if (schedules.isEmpty())
            throw new RuntimeException("No future sessions found for this class.");

        // Find the maximum number of booked slots across all future sessions
        int maxBookedAcrossSessions = 0;
        for (Schedule s : schedules) {
            int booked = bookingRepository.countBookedSlots(s.getScheduleId());
            if (booked > maxBookedAcrossSessions) {
                maxBookedAcrossSessions = booked;
            }
        }

        if (maxBookedAcrossSessions >= schedules.get(0).getGymClass().getMaxSlots()) {
            throw new RuntimeException("This class is fully booked.");
        }

        // --- NEW: Time Overlap Validation ---
        List<Booking> myExistingBookings = bookingRepository.findAllBookingsByEmail(email)
                .stream()
                .filter(b -> !b.getStatus().equals("CANCELLED"))
                .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                .toList();

        for (Schedule newSched : schedules) {
            for (Booking myB : myExistingBookings) {
                Schedule mySched = myB.getSchedule();
                // Overlap condition: StartA < EndB AND StartB < EndA
                if (newSched.getStartTime().isBefore(mySched.getEndTime()) &&
                        mySched.getStartTime().isBefore(newSched.getEndTime())) {
                    throw new RuntimeException("Schedule conflict! The session at " + newSched.getStartTime()
                            + " overlaps with your existing course: '" + mySched.getGymClass().getClassName() + "'.");
                }
            }
        }
        // ------------------------------------

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Integer benefitId = membershipId == null ? null
                : packageBenefits.reserve(email, membershipId,
                        schedules.get(0).getGymClass().getSubjectId(),
                        schedules.get(0).getGymClass().getRoom().getRoomId(),
                        schedules.stream().map(Schedule::getStartTime).toList());

        for (Schedule schedule : schedules) {
            Booking booking = new Booking();
            booking.setUser(user);
            booking.setSchedule(schedule);
            booking.setStatus(benefitId == null ? "PENDING" : "CONFIRMED");
            booking.setBookingTime(LocalDateTime.now()); // NEW: Status changed to PENDING awaiting payment
            booking.setAttendanceStatus("NOT_YET");
            bookingRepository.saveAndFlush(booking);
            if (benefitId != null) {
                packageBenefits.allocate(booking.getBookingId(), benefitId);
                packageBenefits.validateSessionDates(schedule.getScheduleId(), schedule.getStartTime(),
                        schedule.getEndTime());
            }
        }

        if (benefitId != null) {
            try {
                notificationRepository.save(Notification.builder()
                        .user(user)
                        .title("Đăng ký khóa học thành công / Course Booked")
                        .message("Bạn đã đăng ký thành công khóa học: " + schedules.get(0).getGymClass().getClassName()
                                + " (" + schedules.size() + " buổi) sử dụng quyền lợi gói hội viên. Vui lòng kiểm tra lịch học trong My Schedule.")
                        .type("BOOKING")
                        .isRead(false)
                        .build());
            } catch (Exception ignored) {}
        }
    }

    @Override
    @Transactional
    public void cancelClass(String email, Integer classId) {
        bookingRepository.lockOperations();
        List<Booking> myExistingBookings = bookingRepository.findAllBookingsByEmail(email).stream()
                .filter(b -> b.getSchedule().getGymClass().getClassId().equals(classId))
                .filter(b -> !b.getStatus().equals("CANCELLED"))
                .toList();

        if (myExistingBookings.isEmpty()) {
            throw new RuntimeException("You are not currently booked in this class.");
        }

        // Check if all sessions are in the past
        boolean hasFutureSession = false;
        LocalDateTime now = LocalDateTime.now();
        for (Booking b : myExistingBookings) {
            if (b.getSchedule().getStartTime().isAfter(now)) {
                hasFutureSession = true;
                break;
            }
        }

        if (!hasFutureSession) {
            throw new RuntimeException("Cannot cancel: All sessions for this class are already in the past.");
        }

        int cancelledCount = 0;
        String className = myExistingBookings.get(0).getSchedule().getGymClass().getClassName();
        User user = myExistingBookings.get(0).getUser();

        for (Booking b : myExistingBookings) {
            // Only cancel future or pending/confirmed sessions, not already attended ones
            if (!"PRESENT".equals(b.getAttendanceStatus())
                    && (b.getSchedule().getStartTime().isAfter(now) || "PENDING".equals(b.getStatus()))) {
                b.setStatus("CANCELLED");
                bookingRepository.save(b);
                cancelledCount++;
            }
        }

        if (cancelledCount > 0) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title("Class Cancelled")
                    .message("You have successfully cancelled " + cancelledCount + " upcoming session(s) of "
                            + className + ". Past/attended sessions were not affected.")
                    .type("SYSTEM")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    @Override
    public List<com.team4.sportscenter.modules.member.dtos.response.PackageResponse> getAllPackages() {
        var allBenefits = packageBenefits.allPackageBenefits();
        var typeNames = packageTypes.names();
        return packageRepository.findAll().stream().filter(p -> "SELLING".equals(p.getSellingStatus()))
                .map(p -> com.team4.sportscenter.modules.member.dtos.response.PackageResponse.builder()
                        .packageId(p.getPackageId())
                        .packageName(p.getPackageName())
                        .packageType(p.getPackageType() != null ? p.getPackageType() : "STANDARD")
                        .packageTypeName(typeNames.get(p.getPackageType()))
                        .durationDays(p.getDurationDays() != null ? p.getDurationDays() : 30)
                        .price(p.getPrice() != null ? p.getPrice() : java.math.BigDecimal.ZERO)
                        .purchaseLimitPerMember(p.getPurchaseLimitPerMember())
                        .imagePath(p.getImagePath())
                        .benefits(allBenefits.getOrDefault(p.getPackageId(), List.of()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse> getMyPackages(String email) {
        List<UserMembership> allMemberships = membershipRepository.findMyPackagesByEmail(email);

        allMemberships.forEach(m -> {
            if ("ACTIVE".equals(m.getStatus()) && m.getEndDate() != null && m.getEndDate().isBefore(LocalDate.now())) {
                m.setStatus("EXPIRED");
                membershipRepository.save(m);
            }
        });

        return allMemberships.stream()
                .map(m -> com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse.builder()
                        .membershipId(m.getMembershipId()).packageName(m.purchasedName()).packageType(m.purchasedType())
                        .packageTypeName(m.getTypeNameSnapshot())
                        .startDate(m.getStartDate()).endDate(m.getEndDate()).status(m.getStatus())
                        .durationDays(m.purchasedDuration()).price(m.purchasedPrice())
                        .benefits(packageBenefits.membershipBenefits(m.getMembershipId())).build())
                .toList();
    }

    @Override
    @Transactional
    public void addPackageToCart(String email, Integer packageId) {
        bookingRepository.lockOperations();
        com.team4.sportscenter.modules.auth.entities.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        com.team4.sportscenter.modules.member.entities.Package pkg = packageRepository.findById(packageId)
                .orElseThrow(() -> new RuntimeException("Package not found"));

        commerce.checkPurchase(user.getUserId(), packageId, null, true);
        boolean hasPending = membershipRepository.findAll().stream()
                .anyMatch(m -> m.getUser().getUserId().equals(user.getUserId()) && "PENDING".equals(m.getStatus())
                        && m.getAPackage().getPackageId().equals(packageId));

        if (hasPending) {
            throw new RuntimeException("This exact package is already in your cart.");
        }

        com.team4.sportscenter.modules.member.entities.UserMembership membership = com.team4.sportscenter.modules.member.entities.UserMembership
                .builder()
                .user(user)
                .aPackage(pkg)
                .status("PENDING")
                .build();

        packageBenefits.snapshot(membership);
        membershipRepository.saveAndFlush(membership);
        packageBenefits.snapshotSubjects(membership.getMembershipId(), packageId);
    }

    @Override
    public List<EnrolledClassResponse> getEnrolledClasses(String email) {
        List<GymClass> enrolled = bookingRepository.findEnrolledClassesByEmail(email);
        List<EnrolledClassResponse> result = new ArrayList<>();

        for (GymClass c : enrolled) {
            List<Schedule> schedules = bookingRepository.findEnrolledSchedulesByEmailAndClassId(email, c.getClassId());
            Set<DayOfWeek> days = schedules.stream()
                    .map(s -> s.getStartTime().getDayOfWeek())
                    .collect(Collectors.toSet());
            String pattern = days.stream()
                    .sorted()
                    .map(d -> d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .collect(Collectors.joining(", "));

            Integer coachId = (c.getCoach() != null) ? c.getCoach().getUserId() : null;
            long workoutsCount = 0;
            if (coachId != null) {
                workoutsCount = coachWorkoutPlanRepository.countByUserEmailAndClassOrCoach(email, c.getClassId(),
                        coachId);
            }
            long assessmentsCount = traineeAssessmentRepository.countByUserEmailAndClassId(email, c.getClassId());

            result.add(EnrolledClassResponse.builder()
                    .classId(c.getClassId())
                    .className(c.getClassName())
                    .subjectId(c.getSubject() != null ? c.getSubject().getSubjectId() : null)
                    .subjectName(c.getSubject() != null ? c.getSubject().getSubjectName() : null)
                    .coachId(coachId)
                    .coachName(c.getCoach() != null ? c.getCoach().getFullName() : null)
                    .coachEmail(c.getCoach() != null ? c.getCoach().getEmail() : null)
                    .coachAvatar(c.getCoach() != null ? c.getCoach().getAvatarPath() : null)
                    .roomName(c.getRoom() != null ? c.getRoom().getRoomName() : null)
                    .imagePath(c.getImagePath())
                    .status(c.getStatus())
                    .price(c.getPrice())
                    .totalBookedSessions(schedules.size())
                    .schedulePattern(pattern)
                    .workoutsCount(workoutsCount)
                    .assessmentsCount(assessmentsCount)
                    .build());
        }
        return result;
    }

    @Override
    public List<MemberWorkoutPlanResponse> getWorkoutsByClass(String email, Integer classId) {
        if (!bookingRepository.existsConfirmedByEmailAndClassId(email, classId)) {
            return Collections.emptyList();
        }

        GymClass gymClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học ID: " + classId));

        Integer coachId = gymClass.getCoach() != null ? gymClass.getCoach().getUserId() : null;
        if (coachId == null) {
            return Collections.emptyList();
        }

        List<CoachWorkoutPlan> plans = coachWorkoutPlanRepository.findByUserEmailAndClassOrCoach(email, classId,
                coachId);
        return plans.stream().map(p -> mapToMemberWorkoutPlanResponse(p, gymClass)).collect(Collectors.toList());
    }

    @Override
    public List<MemberWorkoutPlanResponse> getMyWorkouts(String email) {
        List<CoachWorkoutPlan> plans = coachWorkoutPlanRepository.findByUserEmailOrderByCreatedAtDesc(email);
        List<GymClass> enrolled = bookingRepository.findEnrolledClassesByEmail(email);
        Set<Integer> confirmedClassIds = enrolled.stream()
                .map(GymClass::getClassId)
                .collect(Collectors.toSet());

        return plans.stream()
                .filter(p -> p.getGymClass() == null || confirmedClassIds.contains(p.getGymClass().getClassId()))
                .map(p -> mapToMemberWorkoutPlanResponse(p, p.getGymClass()))
                .collect(Collectors.toList());
    }

    private MemberWorkoutPlanResponse mapToMemberWorkoutPlanResponse(CoachWorkoutPlan p, GymClass defaultClass) {
        GymClass gymClass = p.getGymClass() != null ? p.getGymClass() : defaultClass;
        List<MemberWorkoutExerciseResponse> exercises = (p.getPlanDetails() != null)
                ? p.getPlanDetails().stream().map(d -> MemberWorkoutExerciseResponse.builder()
                        .detailId(d.getDetailId())
                        .exerciseId(d.getExercise() != null ? d.getExercise().getExerciseId() : null)
                        .exerciseName(d.getExercise() != null ? d.getExercise().getExerciseName() : "Bài tập")
                        .muscleGroup(d.getExercise() != null ? d.getExercise().getMuscleGroup() : "")
                        .videoUrl(d.getExercise() != null ? d.getExercise().getVideoUrl() : null)
                        .sets(d.getSets())
                        .reps(d.getReps())
                        .restSeconds(d.getRestSeconds())
                        .weekNumber(d.getWeekNumber() != null ? d.getWeekNumber() : 1)
                        .dayOfWeek(d.getDayOfWeek())
                        .dayLabel(d.getDayLabel())
                        .durationMinutes(d.getDurationMinutes())
                        .weightKg(d.getWeightKg())
                        .coachNote(d.getCoachNote())
                        .sortOrder(d.getSortOrder() != null ? d.getSortOrder() : 0)
                        .build()).collect(Collectors.toList())
                : Collections.emptyList();

        // Chỉ nhóm bài tập theo mốc tuần nếu là TRAINING_PLAN
        List<MemberWorkoutPlanResponse.MemberPlanWeekGroup> weeks = new ArrayList<>();
        boolean isTrainingPlan = "TRAINING_PLAN".equalsIgnoreCase(p.getPlanType());
        if (isTrainingPlan && p.getPlanDetails() != null && !p.getPlanDetails().isEmpty()) {
            Map<Integer, List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail>> byWeek = p.getPlanDetails().stream()
                    .collect(Collectors.groupingBy(d -> d.getWeekNumber() != null ? d.getWeekNumber() : 1, java.util.TreeMap::new, Collectors.toList()));

            for (Map.Entry<Integer, List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail>> entry : byWeek.entrySet()) {
                Integer weekNum = entry.getKey();
                List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail> weekDetails = entry.getValue();

                Map<String, List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail>> byDay = weekDetails.stream()
                        .collect(Collectors.groupingBy(d -> d.getDayOfWeek() != null ? d.getDayOfWeek() : "OTHER", java.util.LinkedHashMap::new, Collectors.toList()));

                List<MemberWorkoutPlanResponse.MemberPlanDayGroup> days = new ArrayList<>();
                for (Map.Entry<String, List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail>> dayEntry : byDay.entrySet()) {
                    List<com.team4.sportscenter.modules.coach.entities.CoachPlanDetail> dayDetails = dayEntry.getValue();
                    dayDetails.sort(Comparator.comparingInt(d -> d.getSortOrder() != null ? d.getSortOrder() : 0));

                    String label = dayDetails.stream()
                            .map(com.team4.sportscenter.modules.coach.entities.CoachPlanDetail::getDayLabel)
                            .filter(l -> l != null && !l.trim().isEmpty())
                            .findFirst()
                            .orElse(dayEntry.getKey());

                    List<MemberWorkoutExerciseResponse> dayExercises = dayDetails.stream()
                            .map(d -> MemberWorkoutExerciseResponse.builder()
                                    .detailId(d.getDetailId())
                                    .exerciseId(d.getExercise() != null ? d.getExercise().getExerciseId() : null)
                                    .exerciseName(d.getExercise() != null ? d.getExercise().getExerciseName() : "Bài tập")
                                    .muscleGroup(d.getExercise() != null ? d.getExercise().getMuscleGroup() : "")
                                    .videoUrl(d.getExercise() != null ? d.getExercise().getVideoUrl() : null)
                                    .sets(d.getSets())
                                    .reps(d.getReps())
                                    .restSeconds(d.getRestSeconds())
                                    .weekNumber(d.getWeekNumber() != null ? d.getWeekNumber() : 1)
                                    .dayOfWeek(d.getDayOfWeek())
                                    .dayLabel(d.getDayLabel())
                                    .durationMinutes(d.getDurationMinutes())
                                    .weightKg(d.getWeightKg())
                                    .coachNote(d.getCoachNote())
                                    .sortOrder(d.getSortOrder() != null ? d.getSortOrder() : 0)
                                    .build())
                            .collect(Collectors.toList());

                    days.add(MemberWorkoutPlanResponse.MemberPlanDayGroup.builder()
                            .dayOfWeek(dayEntry.getKey())
                            .dayLabel(label)
                            .exercises(dayExercises)
                            .build());
                }

                weeks.add(MemberWorkoutPlanResponse.MemberPlanWeekGroup.builder()
                        .weekNumber(weekNum)
                        .weekTitle("Tuần " + weekNum)
                        .days(days)
                        .build());
            }
        }

        return MemberWorkoutPlanResponse.builder()
                .planId(p.getPlanId())
                .classId(gymClass != null ? gymClass.getClassId() : null)
                .className(gymClass != null ? gymClass.getClassName() : "Bài tập cá nhân")
                .coachId(p.getCoach() != null ? p.getCoach().getUserId() : null)
                .coachName(p.getCoach() != null ? p.getCoach().getFullName() : "HLV")
                .coachEmail(p.getCoach() != null ? p.getCoach().getEmail() : "")
                .coachAvatar(p.getCoach() != null ? p.getCoach().getAvatarPath() : null)
                .title(p.getTitle())
                .note(p.getNote())
                .status(p.getStatus())
                .planType(p.getPlanType() != null ? p.getPlanType() : "SINGLE")
                .goal(p.getGoal())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .totalWeeks(p.getTotalWeeks() != null ? p.getTotalWeeks() : 1)
                .createdAt(p.getCreatedAt())
                .exercises(exercises)
                .weeks(weeks)
                .build();
    }

    @Override
    public List<TraineeAssessmentResponse> getMyAssessments(String email, Integer classId) {
        if (classId != null) {
            return getAssessmentsByClass(email, classId);
        }
        List<TraineeAssessment> list = traineeAssessmentRepository.findByUserEmailOrderByCreatedAtDesc(email);
        return list.stream()
                .map(CoachAssessmentServiceImpl::mapAssessmentToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TraineeAssessmentResponse> getAssessmentsByClass(String email, Integer classId) {
        List<TraineeAssessment> list = traineeAssessmentRepository.findByUserEmailAndClassIdOrderByCreatedAtDesc(email,
                classId);
        return list.stream()
                .map(CoachAssessmentServiceImpl::mapAssessmentToResponse)
                .collect(Collectors.toList());
    }
}
