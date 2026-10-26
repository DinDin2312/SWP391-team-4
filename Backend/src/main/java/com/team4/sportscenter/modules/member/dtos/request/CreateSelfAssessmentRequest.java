package com.team4.sportscenter.modules.member.dtos.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
public class CreateSelfAssessmentRequest {

    @NotNull(message = "Cân nặng không được để trống")
    @DecimalMin(value = "20.0", message = "Cân nặng tối thiểu là 20kg")
    @DecimalMax(value = "300.0", message = "Cân nặng tối đa là 300kg")
    private BigDecimal weight;

    @NotNull(message = "Chiều cao không được để trống")
    @DecimalMin(value = "50.0", message = "Chiều cao tối thiểu là 50cm")
    @DecimalMax(value = "250.0", message = "Chiều cao tối đa là 250cm")
    private BigDecimal height;

    @DecimalMin(value = "3.0", message = "Tỷ lệ mỡ tối thiểu là 3%")
    @DecimalMax(value = "60.0", message = "Tỷ lệ mỡ tối đa là 60%")
    private BigDecimal bodyFatPercentage;

    @DecimalMin(value = "10.0", message = "Khối lượng cơ tối thiểu là 10kg")
    @DecimalMax(value = "150.0", message = "Khối lượng cơ tối đa là 150kg")
    private BigDecimal muscleMass;

    private String feedbackNote;
}
