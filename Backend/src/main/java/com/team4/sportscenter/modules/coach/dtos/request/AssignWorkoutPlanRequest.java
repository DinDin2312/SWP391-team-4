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

    private String title;
    private String note;

    private List<WorkoutPlanDetailRequest> exerciseDetails;
}
