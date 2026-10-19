package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptResponse {
    private Integer invoiceId;
    private String invoiceCode;
    private LocalDateTime createdAt;
    private String status;
    private BigDecimal totalAmount;

    // Member Information
    private Integer userId;
    private String memberName;
    private String memberEmail;
    private String memberPhone;

    // Payment Information
    private String paymentMethod;
    private String transactionNo;
    private LocalDateTime paymentDate;

    // Receptionist / Cashier
    private String cashierName;

    // Line items
    private List<ReceiptItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReceiptItem {
        private String itemName;
        private String itemType;
        private Integer durationDays;
        private Integer totalSessions;
        private BigDecimal unitPrice;
        private BigDecimal amount;
    }
}
