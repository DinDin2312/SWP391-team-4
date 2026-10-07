package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachWorkoutPlanResponse {
    private Integer planId;
    private Integer coachId;
    private String coachName;
    private Integer userId;
    private String studentName;
    private String studentEmail;
    private String title;
    private String note;
    private String status;
    private LocalDateTime createdAt;
    private List<WorkoutPlanDetailResponse> details;
}
