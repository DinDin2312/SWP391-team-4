package com.team4.sportscenter.modules.payment.dtos;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CartItemDto {
    private Integer classId;
    private String className;
    private String coachName;
    private BigDecimal price;
    private int sessionCount;
}