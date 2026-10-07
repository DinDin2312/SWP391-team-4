package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutPlanRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateExerciseRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachWorkoutPlanResponse;
import com.team4.sportscenter.modules.coach.dtos.response.ExerciseResponse;

import java.util.List;
import java.util.Map;

public interface CoachWorkoutService {
    List<ExerciseResponse> getAllExercises();

    ExerciseResponse createExercise(CreateExerciseRequest request);

    Map<String, Object> assignWorkoutPlan(AssignWorkoutPlanRequest request, String coachEmail);

    List<CoachWorkoutPlanResponse> getCoachWorkoutPlans(String coachEmail, Integer studentUserId);

    CoachWorkoutPlanResponse getWorkoutPlanById(Integer planId, String coachEmail);

    void deleteWorkoutPlan(Integer planId, String coachEmail);
}
