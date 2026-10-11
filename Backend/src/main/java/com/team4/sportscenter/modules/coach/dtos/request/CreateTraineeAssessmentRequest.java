package com.team4.sportscenter.modules.coach.dtos.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTraineeAssessmentRequest {

    @NotNull(message = "ID học viên không được để trống")
    private Integer studentUserId;

    private Integer scheduleId;
    private Integer bookingId;
    private Integer planId;

    private String assessmentTitle;

    private BigDecimal weight;
    private BigDecimal height;
    private BigDecimal bodyFatPercentage;
    private BigDecimal muscleMass;

    @Min(value = 1, message = "Điểm thể lực tối thiểu là 1")
    @Max(value = 5, message = "Điểm thể lực tối đa là 5")
    private Integer performanceRating;

    @Min(value = 1, message = "Điểm chuyên cần tối thiểu là 1")
    @Max(value = 5, message = "Điểm chuyên cần tối đa là 5")
    private Integer attendanceRating;

    @NotBlank(message = "Nhận xét của HLV không được để trống")
    private String feedbackNote;

    private String recommendation;
}
