package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachWorkoutPlanResponse;
import com.team4.sportscenter.modules.coach.dtos.response.ExerciseResponse;

import java.util.List;
import java.util.Map;

public interface CoachWorkoutService {
    List<ExerciseResponse> getAllExercises();
    Map<String, Object> assignWorkout(AssignWorkoutRequest request, String coachEmail);
    List<CoachWorkoutPlanResponse> getCoachAssignedWorkouts(String coachEmail);
}
