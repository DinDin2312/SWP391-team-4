package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachScheduleServiceImpl implements CoachScheduleService {

    private final CoachScheduleRepository coachScheduleRepository;
    private final BookingRepository bookingRepository;
    private final com.team4.sportscenter.modules.auth.repositories.UserRepository userRepository;

    @Override
    public List<CoachScheduleResponse> getCoachSchedules(String coachEmail) {
        List<Schedule> schedules = coachScheduleRepository.findSchedulesByCoachEmail(coachEmail);

        return schedules.stream().map(schedule -> {
            List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(schedule.getScheduleId());

            List<EnrolledStudentResponse> students = bookings.stream().map(b -> EnrolledStudentResponse.builder()
                    .bookingId(b.getBookingId())
                    .userId(b.getUser().getUserId())
                    .fullName(b.getUser().getFullName())
                    .email(b.getUser().getEmail())
                    .phone(b.getUser().getPhone())
                    .bookingStatus(b.getStatus())
                    .attendanceStatus(b.getAttendanceStatus() != null ? b.getAttendanceStatus() : "NOT_YET")
                    .build()).collect(Collectors.toList());

            return CoachScheduleResponse.builder()
                    .scheduleId(schedule.getScheduleId())
                    .classId(schedule.getGymClass().getClassId())
                    .className(schedule.getGymClass().getClassName())
                    .roomName(schedule.getGymClass().getRoom().getRoomName())
                    .startTime(schedule.getStartTime())
                    .endTime(schedule.getEndTime())
                    .status(schedule.getStatus())
                    .maxSlots(schedule.getGymClass().getMaxSlots())
                    .enrolledCount(students.size())
                    .enrolledStudents(students)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public List<CoachStudentResponse> getCoachStudents(String coachEmail) {
        List<Booking> bookings = coachScheduleRepository.findBookingsByCoachEmail(coachEmail);

        // Group bookings by User
        Map<User, List<Booking>> userBookingsMap = bookings.stream()
                .collect(Collectors.groupingBy(Booking::getUser));

        List<CoachStudentResponse> result = new ArrayList<>();

        for (Map.Entry<User, List<Booking>> entry : userBookingsMap.entrySet()) {
            User user = entry.getKey();
            List<Booking> userBookings = entry.getValue();

            Set<String> enrolledClasses = userBookings.stream()
                    .map(b -> b.getSchedule().getGymClass().getClassName())
                    .collect(Collectors.toSet());

            result.add(CoachStudentResponse.builder()
                    .userId(user.getUserId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .bio(user.getBio())
                    .totalBookings(userBookings.size())
                    .enrolledClasses(new ArrayList<>(enrolledClasses))
                    .build());
        }

        return result;
    }

    @Override
    public List<EnrolledStudentResponse> getScheduleStudents(Integer scheduleId, String coachEmail) {
        List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(scheduleId);
        return bookings.stream().map(b -> EnrolledStudentResponse.builder()
                .bookingId(b.getBookingId())
                .userId(b.getUser().getUserId())
                .fullName(b.getUser().getFullName())
                .email(b.getUser().getEmail())
                .phone(b.getUser().getPhone())
                .bookingStatus(b.getStatus())
                .attendanceStatus(b.getAttendanceStatus() != null ? b.getAttendanceStatus() : "NOT_YET")
                .build()).collect(Collectors.toList());
    }

    @Transactional
    @Override
    public void updateAttendance(Integer scheduleId, UpdateAttendanceRequest request, String coachEmail) {
        Schedule schedule = coachScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("KhĂ´ng tĂ¬m tháº¥y lá»‹ch há»c vá»›i ID: " + scheduleId));

        if (!schedule.getGymClass().getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new RuntimeException("Báº¡n khĂ´ng cĂ³ quyá»n Ä‘iá»ƒm danh cho lá»‹ch há»c nĂ y.");
        }

        // Validate date: session date must be EQUAL to today (cannot be in future or past)
        LocalDate sessionDate = schedule.getStartTime().toLocalDate();
        LocalDate today = LocalDate.now();
        if (sessionDate.isAfter(today)) {
            throw new RuntimeException("ChÆ°a Ä‘áº¿n ngĂ y há»c! Chá»‰ cĂ³ thá»ƒ thá»±c hiá»‡n Ä‘iá»ƒm danh vĂ o Ä‘Ăºng ngĂ y há»c.");
        }
        if (sessionDate.isBefore(today)) {
            throw new RuntimeException("NgĂ y há»c Ä‘Ă£ trĂ´i qua! KhĂ´ng thá»ƒ thá»±c hiá»‡n hoáº·c chá»‰nh sá»­a Ä‘iá»ƒm danh cho buá»•i há»c trong quĂ¡ khá»©.");
        }

        if (request == null || request.getAttendances() == null || request.getAttendances().isEmpty()) {
            return;
        }

        List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(scheduleId);
        Map<Integer, Booking> bookingMapByBookingId = bookings.stream()
                .collect(Collectors.toMap(Booking::getBookingId, b -> b, (b1, b2) -> b1));
        Map<Integer, Booking> bookingMapByUserId = bookings.stream()
                .collect(Collectors.toMap(b -> b.getUser().getUserId(), b -> b, (b1, b2) -> b1));

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
}
