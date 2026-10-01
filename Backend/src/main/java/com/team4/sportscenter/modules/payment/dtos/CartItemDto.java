package com.team4.sportscenter.modules.payment.dtos;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CartItemDto {
    private String type; // "CLASS" or "PACKAGE"
    private Integer classId;
    private String className;
    private String coachName;
    private int sessionCount;
    private Integer packageId;
    private String packageName;
    private Integer durationDays;
    private BigDecimal price;
}