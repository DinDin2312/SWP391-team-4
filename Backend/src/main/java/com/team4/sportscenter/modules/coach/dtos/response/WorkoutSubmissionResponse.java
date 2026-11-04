package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutSubmissionResponse {

    private Integer submissionId;
    private Integer planId;
    private String planTitle;
    private Integer classId;
    private String className;
    private Integer detailId;
    private Integer exerciseId;
    private String exerciseName;
    private Integer weekNumber;
    private String dayOfWeek;
    private String dayLabel;

    private Integer userId;
    private String studentName;
    private String studentEmail;
    private String studentAvatar;

    private Integer coachId;
    private String coachName;
    private String coachEmail;

    private String videoUrl;
    private String studentNote;
    private String status;
    private String coachFeedback;
    private Integer rating;

    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
}
