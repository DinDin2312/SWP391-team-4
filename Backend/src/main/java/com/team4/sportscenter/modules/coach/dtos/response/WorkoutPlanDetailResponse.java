package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutPlanDetailResponse {
    private Integer detailId;
    private Integer exerciseId;
    private String exerciseName;
    private String muscleGroup;
    private String videoUrl;
    private Integer sets;
    private Integer reps;
    private Integer restSeconds;
}
