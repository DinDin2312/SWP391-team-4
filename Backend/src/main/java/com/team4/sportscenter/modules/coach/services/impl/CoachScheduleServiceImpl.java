package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachScheduleServiceImpl implements CoachScheduleService {

    private final CoachScheduleRepository coachScheduleRepository;

    @Override
    public List<CoachScheduleResponse> getCoachSchedules(String coachEmail) {
        List<Schedule> schedules = coachScheduleRepository.findSchedulesByCoachEmail(coachEmail);

        return schedules.stream().map(schedule -> {
            List<Booking> bookings = coachScheduleRepository.findBookingsByScheduleId(schedule.getScheduleId());

            List<EnrolledStudentResponse> students = bookings.stream().map(b -> 
                EnrolledStudentResponse.builder()
                    .userId(b.getUser().getUserId())
                    .fullName(b.getUser().getFullName())
                    .email(b.getUser().getEmail())
                    .phone(b.getUser().getPhone())
                    .bookingStatus(b.getStatus())
                    .attendanceStatus(b.getAttendanceStatus() != null ? b.getAttendanceStatus() : "NOT_YET")
                    .build()
            ).collect(Collectors.toList());

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
        return bookings.stream().map(b -> 
            EnrolledStudentResponse.builder()
                .userId(b.getUser().getUserId())
                .fullName(b.getUser().getFullName())
                .email(b.getUser().getEmail())
                .phone(b.getUser().getPhone())
                .bookingStatus(b.getStatus())
                .attendanceStatus(b.getAttendanceStatus() != null ? b.getAttendanceStatus() : "NOT_YET")
                .build()
        ).collect(Collectors.toList());
    }
}
