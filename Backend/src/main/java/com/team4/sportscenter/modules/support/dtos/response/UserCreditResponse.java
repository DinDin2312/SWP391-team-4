package com.team4.sportscenter.modules.support.dtos.response;

import com.team4.sportscenter.modules.support.enums.CreditStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserCreditResponse {
    private Integer creditId;
    private Integer userId;
    private Integer requestId;
    private Integer classId;
    private String className;
    private String creditCode;
    private BigDecimal amount;
    private BigDecimal remainingAmount;
    private String reason;
    private LocalDate expiryDate;
    private CreditStatus status;
    private LocalDateTime createdAt;
    private boolean isExpired;
}
