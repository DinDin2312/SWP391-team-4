package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachClassResponse;

import java.util.List;
import java.util.Map;

public interface CoachNotificationService {
    List<CoachClassResponse> getCoachClasses(String coachEmail);
    Map<String, Object> sendNotification(SendCoachNotificationRequest request, String coachEmail);
}
