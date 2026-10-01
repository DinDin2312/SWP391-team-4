package com.team4.sportscenter.modules.payment.services;

import com.team4.sportscenter.modules.payment.dtos.CartResponse;
import java.util.Map;

public interface PaymentService {
    CartResponse getCartItems(String email);
    String checkout(String email, String ipAddress, String paymentMethod);
    void removeFromCart(String email, Integer classId);
    void removePackageFromCart(String email, Integer packageId);
    void clearCart(String email);
    void handleVNPayCallback(Map<String, String> queryParams);
    void handleMoMoCallback(Map<String, String> queryParams);
}