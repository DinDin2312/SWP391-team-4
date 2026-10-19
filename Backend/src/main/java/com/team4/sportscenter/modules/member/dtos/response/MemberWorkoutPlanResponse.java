package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberWorkoutPlanResponse {
    private Integer planId;
    private Integer classId;
    private String className;
    private Integer coachId;
    private String coachName;
    private String coachEmail;
    private String coachAvatar;
    private String title;
    private String note;
    private String status;
    private String planType;
    private String goal;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private Integer totalWeeks;
    private LocalDateTime createdAt;
    private List<MemberWorkoutExerciseResponse> exercises;
    private List<MemberPlanWeekGroup> weeks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberPlanWeekGroup {
        private Integer weekNumber;
        private String weekTitle;
        private List<MemberPlanDayGroup> days;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberPlanDayGroup {
        private String dayOfWeek;
        private String dayLabel;
        private List<MemberWorkoutExerciseResponse> exercises;
    }
}
