package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachStudentResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String bio;
    private Integer totalBookings;
    private List<String> enrolledClasses;
    private String workoutGoal;
    private String fitnessLevel;
    private List<String> assignedPlans;
}
