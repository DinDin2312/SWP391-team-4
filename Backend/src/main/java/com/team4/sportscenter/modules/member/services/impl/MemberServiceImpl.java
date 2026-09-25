package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.CalendarBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
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

    @Override
    public MemberMembershipResponse getMyActiveMembership(String email) {
        UserMembership membership = membershipRepository.findActiveMembershipByEmail(email)
                .orElse(null);

        if (membership == null) {
            return null; // TrĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â£ vĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â null nĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿u khÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â´ng cÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³ gÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â³i nÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â o active
        }

        long remainingDays = ChronoUnit.DAYS.between(LocalDate.now(), membership.getEndDate());
        if(remainingDays < 0) remainingDays = 0;

        return MemberMembershipResponse.builder()
                .packageName(membership.getAPackage().getPackageName())
                .packageType(membership.getAPackage().getPackageType())
                .startDate(membership.getStartDate())
                .endDate(membership.getEndDate())
                .status(membership.getStatus())
                .remainingDays((int) remainingDays)
                .build();
    }

    @Override
    public List<UpcomingBookingResponse> getMyUpcomingBookings(String email) {
        // LĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥y danh sÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â¡ch booking tĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚â€Ă‚Â« database
        List<Booking> bookings = bookingRepository.findUpcomingBookingsByEmail(email, LocalDateTime.now());
        
        // Convert qua DTO
        return bookings.stream().map(b -> {
            long duration = ChronoUnit.MINUTES.between(b.getSchedule().getStartTime(), b.getSchedule().getEndTime());
            return UpcomingBookingResponse.builder()
                    .bookingId(b.getBookingId())
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
        
        // Ă„â€Ă¢â‚¬ÂÄ‚â€Ă‚ÂĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¿m sĂ„â€Ă‚Â¡Ä‚â€Ă‚Â»Ä‚Â¢Ă¢â€Â¬Ă‹Å“ ngÄ‚â€Ă¢â‚¬ÂÄ‚â€Ă‚Â y Ă„â€Ă¢â‚¬ÂÄ‚Â¢Ă¢â€Â¬Ă‹Å“i tĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â­p duy nhĂ„â€Ă‚Â¡Ä‚â€Ă‚ÂºÄ‚â€Ă‚Â¥t (distinct date)
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
                    .bookingId(b.getBookingId())
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
        return bookings.stream().map(b -> CalendarBookingResponse.builder()
                .bookingId(b.getBookingId())
                .className(b.getSchedule().getGymClass().getClassName())
                .coachName(b.getSchedule().getGymClass().getCoach().getFullName())
                .roomName(b.getSchedule().getGymClass().getRoom().getRoomName())
                .startTime(b.getSchedule().getStartTime())
                .endTime(b.getSchedule().getEndTime())
                .status(b.getStatus())
                .build()
        ).collect(Collectors.toList());
    }

    @Override
    public List<AvailableClassResponse> getAvailableClasses() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        LocalDateTime currentTime = LocalDateTime.of(2026, 10, 1, 0, 0); 
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(currentTime);
        
        Map<GymClass, List<Schedule>> classSchedules = schedules.stream()
            .collect(Collectors.groupingBy(Schedule::getGymClass));
            
        List<AvailableClassResponse> response = new ArrayList<>();
        
        for (Map.Entry<GymClass, List<Schedule>> entry : classSchedules.entrySet()) {
            GymClass gymClass = entry.getKey();
            List<Schedule> classScheds = entry.getValue();
            
            classScheds.sort(Comparator.comparing(Schedule::getStartTime));
            Schedule nextSession = classScheds.get(0);
            
            Integer bookedSlots = bookingRepository.countBookedSlots(nextSession.getScheduleId());
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
        
        LocalDateTime currentTime = LocalDateTime.of(2026, 10, 1, 0, 0); 
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(currentTime).stream()
            .filter(s -> s.getGymClass().getClassId().equals(classId))
            .collect(Collectors.toList());
            
        if (schedules.isEmpty()) throw new RuntimeException("No future sessions found for this class.");
        
        Integer bookedSlots = bookingRepository.countBookedSlots(schedules.get(0).getScheduleId());
        if (bookedSlots >= schedules.get(0).getGymClass().getMaxSlots()) {
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
}
