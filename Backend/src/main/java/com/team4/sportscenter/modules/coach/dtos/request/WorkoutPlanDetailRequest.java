package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutPlanDetailRequest {
    private Integer exerciseId;
    private Integer sets;
    private Integer reps;
    private Integer restSeconds;
}
