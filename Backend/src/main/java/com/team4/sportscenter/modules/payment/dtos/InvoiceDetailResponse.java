package com.team4.sportscenter.modules.payment.dtos;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class InvoiceDetailResponse {
    private String itemName;
    private String itemType; // "CLASS" or "PACKAGE"
    private BigDecimal unitPrice;
}
