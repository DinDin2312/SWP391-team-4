package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachWorkoutPlanResponse {
    private Integer planId;
    private Integer coachId;
    private String coachName;
    private Integer userId;
    private String studentName;
    private String title;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private List<ExerciseDetailDto> details;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExerciseDetailDto {
        private Integer detailId;
        private Integer exerciseId;
        private String exerciseName;
        private String muscleGroup;
        private String videoUrl;
        private Integer sets;
        private Integer reps;
        private Integer restSeconds;
    }
}
