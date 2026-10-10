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
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;
    private Map<String,String> result(int id){String state=jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,id);return Map.of("status",state,"message","PAID".equals(state)?"Payment completed.":"REVIEW".equals(state)?"Payment received and awaiting reconciliation. Contact reception.":"Payment failed or cancelled.");}

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
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl,"completed",paymentUrl.startsWith("/member/")));
    }
    
    @DeleteMapping("/cart/{classId}")
    public ResponseEntity<?> removeFromCart(Authentication authentication, @PathVariable Integer classId) {
        String email = authentication.getName();
        paymentService.removeFromCart(email, classId);
        return ResponseEntity.ok(Map.of("message", "Item removed from cart."));
    }

    @DeleteMapping("/cart/package/{packageId}")
    public ResponseEntity<?> removePackageFromCart(Authentication authentication, @PathVariable Integer packageId) {
        String email = authentication.getName();
        paymentService.removePackageFromCart(email, packageId);
        return ResponseEntity.ok(Map.of("message", "Package removed from cart."));
    }

    @DeleteMapping("/cart/clear")
    public ResponseEntity<?> clearCart(Authentication authentication) {
        String email = authentication.getName();
        paymentService.clearCart(email);
        return ResponseEntity.ok(Map.of("message", "Cart cleared."));
    }

    @GetMapping("/momo-callback")
    public ResponseEntity<?> momoCallback(@RequestParam Map<String, String> queryParams) {
        paymentService.handleMoMoCallback(queryParams);
        return ResponseEntity.ok(result(Integer.parseInt(queryParams.get("orderId").split("_")[0])));
    }

    @GetMapping("/vnpay-callback")
    public ResponseEntity<?> vnpayCallback(@RequestParam Map<String, String> queryParams) {
        paymentService.handleVNPayCallback(queryParams);
        return ResponseEntity.ok(result(Integer.parseInt(queryParams.get("vnp_TxnRef"))));
    }
}
