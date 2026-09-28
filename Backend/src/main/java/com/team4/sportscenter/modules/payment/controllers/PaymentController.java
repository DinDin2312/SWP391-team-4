package com.team4.sportscenter.modules.payment.controllers;

import com.team4.sportscenter.config.VNPayConfig;
import com.team4.sportscenter.modules.payment.services.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {
    
    private final PaymentService paymentService;

    @GetMapping("/cart")
    public ResponseEntity<?> getCartItems(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(paymentService.getCartItems(email));
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(Authentication authentication, HttpServletRequest request, @RequestBody(required = false) Map<String, String> body) {
        String email = authentication.getName();
        String ipAddress = VNPayConfig.getIpAddress(request);
        String paymentMethod = (body != null && body.containsKey("paymentMethod")) ? body.get("paymentMethod") : "vnpay";
        String paymentUrl = paymentService.checkout(email, ipAddress, paymentMethod);
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }
    
    @DeleteMapping("/cart/{classId}")
    public ResponseEntity<?> removeFromCart(Authentication authentication, @PathVariable Integer classId) {
        String email = authentication.getName();
        paymentService.removeFromCart(email, classId);
        return ResponseEntity.ok(Map.of("message", "Item removed from cart."));
    }

    @GetMapping("/momo-callback")
    public ResponseEntity<?> momoCallback(@RequestParam Map<String, String> queryParams) {
        paymentService.handleMoMoCallback(queryParams);
        return ResponseEntity.ok(Map.of("message", "MoMo Payment processed successfully."));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> queryParams) {
        paymentService.handleVNPayCallback(queryParams);
        return ResponseEntity.ok(Map.of("message", "Payment processed successfully."));
    }
}
