package com.team4.sportscenter.modules.support.dtos.response;

import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportPriority;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportRequestResponse {
    private Integer requestId;
    private Integer userId;
    private String memberName;
    private String memberEmail;
    private String memberPhone;
    
    // Linked class (if cancellation/refund)
    private Integer classId;
    private String className;
    private BigDecimal classPrice;
    private Integer totalSessions;
    private Integer attendedSessions;
    private Integer remainingSessions;
    private BigDecimal calculatedCreditAmount;
    
    private SupportCategory category;
    private String preferredResolution;
    private String title;
    private String content;
    private SupportStatus status;
    private SupportPriority priority;
    
    // Response details
    private String responseNote;
    private Integer responderId;
    private String responderName;
    private LocalDateTime respondedAt;
    
    // Granted credit (if any)
    private String generatedCreditCode;
    private BigDecimal generatedCreditAmount;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
