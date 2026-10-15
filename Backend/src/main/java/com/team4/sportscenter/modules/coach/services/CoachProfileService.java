package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.UpdateCoachProfileRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachProfileResponse;
import com.team4.sportscenter.modules.coach.dtos.response.SubjectOptionResponse;

import java.util.List;

public interface CoachProfileService {
    CoachProfileResponse getCoachProfile(String coachEmail);
    void updateCoachProfile(String coachEmail, UpdateCoachProfileRequest request);
    List<SubjectOptionResponse> getAllSubjects();
}
