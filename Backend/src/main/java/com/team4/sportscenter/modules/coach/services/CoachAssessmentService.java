package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.CreateTraineeAssessmentRequest;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse;

import java.util.List;

public interface CoachAssessmentService {
    TraineeAssessmentResponse createAssessment(CreateTraineeAssessmentRequest request, String coachEmail);
    List<TraineeAssessmentResponse> getCoachAssessments(String coachEmail, Integer studentUserId);
    List<TraineeAssessmentResponse> getStudentAssessmentHistory(Integer studentUserId, String coachEmail);
    List<EnrolledStudentResponse> getStudentsByClassId(Integer classId, String coachEmail);
    void deleteAssessment(Integer assessmentId, String coachEmail);
}
