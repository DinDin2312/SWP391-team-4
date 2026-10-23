package com.team4.sportscenter.modules.support.dtos.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelClassPreviewResponse {
    private Integer classId;
    private String className;
    private BigDecimal classPrice;
    private Integer totalSessions;
    private Integer attendedSessions;
    private Integer remainingSessions;
    private LocalDateTime firstSessionTime;
    private boolean hasStarted;
    private boolean canDirectCancelWithCredit; // true if !hasStarted
    private BigDecimal estimatedCreditAmount;
    private String message;
}
