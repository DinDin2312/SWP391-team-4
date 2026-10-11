package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TraineeAssessmentResponse {
    private Integer assessmentId;

    // Coach info
    private Integer coachId;
    private String coachName;
    private String coachEmail;

    // Trainee info
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;

    // Context info
    private Integer scheduleId;
    private String className;
    private Integer bookingId;
    private Integer planId;
    private String planTitle;

    // Assessment data
    private String assessmentTitle;
    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal bodyFatPercentage;
    private BigDecimal muscleMass;
    private Integer performanceRating;
    private Integer attendanceRating;
    private String feedbackNote;
    private String recommendation;

    private LocalDateTime createdAt;
}
