package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignWorkoutPlanRequest {
    /**
     * "INDIVIDUAL" or "CLASS"
     */
    private String targetType;

    /**
     * Required if targetType is "INDIVIDUAL"
     */
    private Integer studentUserId;

    /**
     * Required if targetType is "CLASS"
     */
    private Integer classId;

    /**
     * "SINGLE" (default) or "TRAINING_PLAN"
     */
    private String planType;

    private String title;
    private String goal;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private Integer totalWeeks;
    private String note;

    private List<WorkoutPlanDetailRequest> exerciseDetails;
}
