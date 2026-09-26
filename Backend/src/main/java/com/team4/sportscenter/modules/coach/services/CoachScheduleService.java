package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import java.util.List;

public interface CoachScheduleService {
    List<CoachScheduleResponse> getCoachSchedules(String coachEmail);
}
