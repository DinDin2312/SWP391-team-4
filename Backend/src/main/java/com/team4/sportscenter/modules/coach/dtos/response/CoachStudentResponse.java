package com.team4.sportscenter.modules.coach.dtos.response;

import com.team4.sportscenter.modules.member.health.MemberHealthSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private List<Integer> enrolledClassIds;
    private String workoutGoal;
    private String fitnessLevel;
    private List<String> assignedPlans;
    private MemberHealthSummary health;

    // Latest Physical & InBody Metrics (including member self-assessments)
    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal bodyFatPercentage;
    private BigDecimal muscleMass;
    private BigDecimal bmi;
    private String latestAssessmentTitle;
    private LocalDateTime metricsUpdatedAt;
    private Boolean isSelfRecorded;
}
