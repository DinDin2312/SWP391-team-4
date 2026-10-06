package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.Data;
import java.util.List;

@Data
public class AssignWorkoutRequest {
    private String targetType; // "INDIVIDUAL", "CLASS", "ALL"
    private Integer recipientUserId;
    private Integer classId;
    private String title;
    private String note;
    private List<ExerciseItemRequest> exercises;

    @Data
    public static class ExerciseItemRequest {
        private Integer exerciseId;
        private Integer sets;
        private Integer reps;
        private Integer restSeconds;
    }
}
