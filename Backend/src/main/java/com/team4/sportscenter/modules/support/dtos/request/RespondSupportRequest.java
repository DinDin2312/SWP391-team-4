package com.team4.sportscenter.modules.support.dtos.request;

import com.team4.sportscenter.modules.support.enums.SupportStatus;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespondSupportRequest {
    private SupportStatus status;
    private String responseNote;
    private String resolutionType; // "CREDIT", "GYM_MEMBERSHIP", "MANAGER_REFUND", "REJECT", "GENERAL_RESOLVED"
    private BigDecimal creditAmount; // optional override if credit granted
    private Integer validityDays; // default 60
}
