package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseResponse {
    private Integer exerciseId;
    private String exerciseName;
    private String muscleGroup;
    private String videoUrl;
    private List<String> contraindications;
}
