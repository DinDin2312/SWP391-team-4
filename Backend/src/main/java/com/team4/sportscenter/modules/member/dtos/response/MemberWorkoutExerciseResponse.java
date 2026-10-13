package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberWorkoutExerciseResponse {
    private Integer detailId;
    private Integer exerciseId;
    private String exerciseName;
    private String muscleGroup;
    private String videoUrl;
    private Integer sets;
    private Integer reps;
    private Integer restSeconds;
}
