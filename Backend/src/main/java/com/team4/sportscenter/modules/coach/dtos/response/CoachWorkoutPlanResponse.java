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
    private Integer classId;
    private String className;
    private String planType;
    private String goal;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private Integer totalWeeks;
    private List<WorkoutPlanDetailResponse> details;
    private List<PlanWeekGroup> weeks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanWeekGroup {
        private Integer weekNumber;
        private String weekTitle;
        private List<PlanDayGroup> days;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlanDayGroup {
        private String dayOfWeek;
        private String dayLabel;
        private List<WorkoutPlanDetailResponse> exercises;
    }
}
