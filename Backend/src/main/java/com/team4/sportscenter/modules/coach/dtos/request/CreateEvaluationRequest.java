package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEvaluationRequest {
    private Integer userId;
    private Integer classId;
    private String evaluationType; // 'PER_SESSION', 'WEEKLY', 'MONTHLY'
    private Integer attendanceScore; // 1-10
    private Integer effortScore;     // 1-10
    private Integer techniqueScore;  // 1-10
    private String coachComment;
    private String recommendations;

    // Optional physical progress metrics
    private BigDecimal weightKg;
    private BigDecimal heightCm;
    private BigDecimal bodyFatPct;
    private BigDecimal muscleMassKg;
    private String progressNotes;
}
