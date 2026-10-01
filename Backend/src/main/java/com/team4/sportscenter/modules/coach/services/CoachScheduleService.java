package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;

import java.util.List;

public interface CoachScheduleService {
    List<CoachScheduleResponse> getCoachSchedules(String coachEmail);
    List<CoachStudentResponse> getCoachStudents(String coachEmail);
    List<EnrolledStudentResponse> getScheduleStudents(Integer scheduleId, String coachEmail);
    void updateAttendance(Integer scheduleId, UpdateAttendanceRequest request, String coachEmail);
}
