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
    private String resolutionType; // "CREDIT", "ISSUE_CREDIT", "GYM_MEMBERSHIP", "MANAGER_REFUND", "REJECT", "GENERAL_RESOLVED"
    private BigDecimal creditAmount; // optional override if credit granted
    private Integer validityDays; // default 60
    private Integer creditExpiryDays; // alias for validityDays

    public Integer getEffectiveValidityDays() {
        if (validityDays != null && validityDays > 0) return validityDays;
        if (creditExpiryDays != null && creditExpiryDays > 0) return creditExpiryDays;
        return 60;
    }
}
