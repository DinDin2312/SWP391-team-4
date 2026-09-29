package com.team4.sportscenter.modules.payment.dtos;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class InvoiceResponse {
    private Integer invoiceId;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;
    
    // Payment Info
    private String paymentMethod;
    private String transactionNo;
    private LocalDateTime paymentDate;
    
    private List<InvoiceDetailResponse> details;
}
