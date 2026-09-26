package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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
}
