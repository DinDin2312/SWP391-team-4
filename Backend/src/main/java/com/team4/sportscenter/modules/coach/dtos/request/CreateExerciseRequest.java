package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateExerciseRequest {
    private String exerciseName;
    private String muscleGroup;
    private String videoUrl;
}
