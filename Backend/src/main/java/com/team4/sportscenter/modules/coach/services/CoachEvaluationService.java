package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.CreateEvaluationRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentEvaluationResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentItemResponse;

import java.util.List;
import java.util.Map;

public interface CoachEvaluationService {
    List<CoachStudentItemResponse> getStudentsByClassId(Integer classId, String coachEmail);
    Map<String, Object> createEvaluation(CreateEvaluationRequest request, String coachEmail);
    List<CoachStudentEvaluationResponse> getEvaluations(String coachEmail, Integer userId, Integer classId);
    void deleteEvaluation(Integer evaluationId, String coachEmail);
}
