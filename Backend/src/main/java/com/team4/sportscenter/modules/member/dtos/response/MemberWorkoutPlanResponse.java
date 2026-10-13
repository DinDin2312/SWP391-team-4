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
    private LocalDateTime createdAt;
    private List<MemberWorkoutExerciseResponse> exercises;
}
