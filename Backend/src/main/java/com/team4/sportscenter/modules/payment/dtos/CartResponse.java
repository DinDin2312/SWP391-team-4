package com.team4.sportscenter.modules.payment.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    private List<CartItemDto> items;
    private BigDecimal totalPrice;
    @Builder.Default
    private boolean hasPendingCheckout = false;
    private Integer pendingInvoiceId;
    private String pendingPaymentUrl;
    private String pendingPaymentMethod;
}
