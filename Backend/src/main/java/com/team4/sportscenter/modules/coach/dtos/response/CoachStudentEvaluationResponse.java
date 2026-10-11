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
public class CoachStudentEvaluationResponse {
    private Integer evaluationId;
    private Integer coachId;
    private String coachName;
    private Integer userId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private Integer classId;
    private String className;
    private String evaluationType;
    private Integer attendanceScore;
    private Integer effortScore;
    private Integer techniqueScore;
    private Double averageScore;
    private String coachComment;
    private String recommendations;
    private LocalDateTime createdAt;

    // Body metrics
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal bodyFatPct;
    private BigDecimal muscleMassKg;
}
