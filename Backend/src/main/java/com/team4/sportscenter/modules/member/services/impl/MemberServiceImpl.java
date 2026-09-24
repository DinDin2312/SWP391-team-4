package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final UserMembershipRepository membershipRepository;
    private final BookingRepository bookingRepository;

    @Override
    public MemberMembershipResponse getMyActiveMembership(String email) {
        UserMembership membership = membershipRepository.findActiveMembershipByEmail(email)
                .orElse(null);

        if (membership == null) {
            return null; // TrĂ¡ÂºÂ£ vĂ¡Â»Â null nĂ¡ÂºÂ¿u khÄ‚Â´ng cÄ‚Â³ gÄ‚Â³i nÄ‚Â o active
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
        // LĂ¡ÂºÂ¥y danh sÄ‚Â¡ch booking tĂ¡Â»Â« database
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
        
        // Ă„ÂĂ¡ÂºÂ¿m sĂ¡Â»â€˜ ngÄ‚Â y Ă„â€˜i tĂ¡ÂºÂ­p duy nhĂ¡ÂºÂ¥t (distinct date)
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

}



