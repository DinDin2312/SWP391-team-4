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

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final UserMembershipRepository membershipRepository;
    private final BookingRepository bookingRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final com.team4.sportscenter.modules.member.repositories.PackageRepository packageRepository;
    private final NotificationRepository notificationRepository;

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

        String targetType = memberships.stream().anyMatch(m -> "GYM_ACCESS".equals(m.getAPackage().getPackageType())) ? "GYM_ACCESS" : memberships.get(0).getAPackage().getPackageType();

        long totalRemainingDays = memberships.stream()
            .filter(m -> targetType.equals(m.getAPackage().getPackageType()))
            .map(m -> m.getEndDate())
            .max(LocalDate::compareTo)
            .map(date -> ChronoUnit.DAYS.between(LocalDate.now(), date))
            .orElse(0L);

        if(totalRemainingDays < 0) totalRemainingDays = 0;

        UserMembership bestMembership = memberships.stream()
            .filter(m -> targetType.equals(m.getAPackage().getPackageType()))
            .max((m1, m2) -> Integer.compare(m1.getAPackage().getDurationDays(), m2.getAPackage().getDurationDays()))
            .orElse(memberships.get(0));

        return MemberMembershipResponse.builder()
                .packageName(bestMembership.getAPackage().getPackageName())
                .packageType(bestMembership.getAPackage().getPackageType())
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
            long duration = java.time.Duration.between(b.getSchedule().getStartTime(), b.getSchedule().getEndTime()).toMinutes();
            
            // Mocking some telemetry data
            int calories = 300 + (int)(Math.random() * 200);
            int avgHr = 110 + (int)(Math.random() * 40);

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
                        .build()
                ).collect(Collectors.toList());
    }

    @Override
    public List<AvailableClassResponse> getAvailableClasses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
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
            Integer bookedSlots = 0;
            for (Schedule s : classScheds) {
                int booked = bookingRepository.countBookedSlots(s.getScheduleId());
                if (booked > bookedSlots) bookedSlots = booked;
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
        if (bookingRepository.existsByEmailAndClassId(email, classId)) {
            throw new RuntimeException("You have already booked this course.");
        }
        
        LocalDateTime currentTime = LocalDateTime.now();
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(currentTime).stream()
            .filter(s -> s.getGymClass().getClassId().equals(classId))
            .collect(Collectors.toList());
            
        if (schedules.isEmpty()) throw new RuntimeException("No future sessions found for this class.");
        
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
            .stream().filter(b -> !b.getStatus().equals("CANCELLED")).collect(Collectors.toList());
            
        for (Schedule newSched : schedules) {
            for (Booking myB : myExistingBookings) {
                Schedule mySched = myB.getSchedule();
                // Overlap condition: StartA < EndB AND StartB < EndA
                if (newSched.getStartTime().isBefore(mySched.getEndTime()) && 
                    mySched.getStartTime().isBefore(newSched.getEndTime())) {
                    throw new RuntimeException("Schedule conflict! The session at " + newSched.getStartTime() + " overlaps with your existing course: '" + mySched.getGymClass().getClassName() + "'." );
                }
            }
        }
        // ------------------------------------
        
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        for (Schedule schedule : schedules) {
            Booking booking = new Booking();
            booking.setUser(user);
            booking.setSchedule(schedule);
            booking.setStatus("PENDING");
            booking.setBookingTime(LocalDateTime.now()); // NEW: Status changed to PENDING awaiting payment
            booking.setAttendanceStatus("NOT_YET");
            bookingRepository.save(booking);
        }
    }

    @Override
    public void cancelClass(String email, Integer classId) {
        List<Booking> myExistingBookings = bookingRepository.findAllBookingsByEmail(email).stream()
            .filter(b -> b.getSchedule().getGymClass().getClassId().equals(classId))
            .filter(b -> !b.getStatus().equals("CANCELLED"))
            .collect(Collectors.toList());

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
            if (b.getSchedule().getStartTime().isAfter(now) || "PENDING".equals(b.getStatus())) {
                b.setStatus("CANCELLED");
                bookingRepository.save(b);
                cancelledCount++;
            }
        }

        if (cancelledCount > 0) {
            Notification notification = Notification.builder()
                .user(user)
                .title("Class Cancelled")
                .message("You have successfully cancelled " + cancelledCount + " upcoming session(s) of " + className + ". Past/attended sessions were not affected.")
                .type("SYSTEM")
                .isRead(false)
                .build();
            notificationRepository.save(notification);
        }
    }

    @Override
    public List<com.team4.sportscenter.modules.member.dtos.response.PackageResponse> getAllPackages() {
        return packageRepository.findAll().stream().map(p -> com.team4.sportscenter.modules.member.dtos.response.PackageResponse.builder()
            .packageId(p.getPackageId())
            .packageName(p.getPackageName())
            .packageType(p.getPackageType() != null ? p.getPackageType() : "STANDARD")
            .durationDays(p.getDurationDays() != null ? p.getDurationDays() : 30)
            .price(p.getPrice() != null ? p.getPrice() : java.math.BigDecimal.ZERO)
            .description(null)
            .build()).collect(Collectors.toList());
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

        Map<String, List<UserMembership>> grouped = allMemberships.stream()
            .collect(Collectors.groupingBy(m -> 
                (m.getAPackage() != null ? m.getAPackage().getPackageType() : "STANDARD") + "_" + m.getStatus()
            ));

        List<com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse> result = new ArrayList<>();
        
        for (List<UserMembership> group : grouped.values()) {
            if (group.isEmpty()) continue;
            
            LocalDate minStart = group.stream()
                .map(UserMembership::getStartDate)
                .filter(d -> d != null)
                .min(LocalDate::compareTo).orElse(LocalDate.now());
            LocalDate maxEnd = group.stream()
                .map(UserMembership::getEndDate)
                .filter(d -> d != null)
                .max(LocalDate::compareTo).orElse(LocalDate.now().plusDays(30));
            
            UserMembership bestPkg = group.stream()
                .max((m1, m2) -> Integer.compare(
                    m1.getAPackage() != null ? m1.getAPackage().getDurationDays() : 0, 
                    m2.getAPackage() != null ? m2.getAPackage().getDurationDays() : 0
                )).orElse(group.get(0));
                
            result.add(com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse.builder()
                .membershipId(bestPkg.getMembershipId())
                .packageName(bestPkg.getAPackage() != null ? bestPkg.getAPackage().getPackageName() : "Basic Membership")
                .packageType(bestPkg.getAPackage() != null ? bestPkg.getAPackage().getPackageType() : "STANDARD")
                .startDate(minStart)
                .endDate(maxEnd)
                .status(bestPkg.getStatus())
                .durationDays(bestPkg.getAPackage() != null ? bestPkg.getAPackage().getDurationDays() : 30)
                .price(bestPkg.getAPackage() != null ? bestPkg.getAPackage().getPrice() : java.math.BigDecimal.ZERO)
                .build());
        }
        
        return result;
    }

    @Override
    @Transactional
    public void addPackageToCart(String email, Integer packageId) {
        com.team4.sportscenter.modules.auth.entities.User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        com.team4.sportscenter.modules.member.entities.Package pkg = packageRepository.findById(packageId)
            .orElseThrow(() -> new RuntimeException("Package not found"));

        boolean hasPending = membershipRepository.findAll().stream()
            .anyMatch(m -> m.getUser().getUserId().equals(user.getUserId()) && "PENDING".equals(m.getStatus()) && m.getAPackage().getPackageId().equals(packageId));
            
        if (hasPending) {
            throw new RuntimeException("This exact package is already in your cart.");
        }

        com.team4.sportscenter.modules.member.entities.UserMembership membership = com.team4.sportscenter.modules.member.entities.UserMembership.builder()
            .user(user)
            .aPackage(pkg)
            .status("PENDING")
            .build();
            
        membershipRepository.save(membership);
    }
}



