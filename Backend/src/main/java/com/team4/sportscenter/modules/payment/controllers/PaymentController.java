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
        String creditCode = (body != null && body.containsKey("creditCode")) ? body.get("creditCode") : null;
        boolean cancelPending = body != null && "true".equalsIgnoreCase(body.get("cancelPending"));
        String paymentUrl = paymentService.checkout(email, ipAddress, paymentMethod, creditCode, cancelPending);
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl,"completed",paymentUrl.startsWith("/member/")));
    }

    @PostMapping("/cart/cancel-pending")
    public ResponseEntity<?> cancelPendingCheckout(Authentication authentication) {
        String email = authentication.getName();
        paymentService.cancelPendingCheckout(email);
        return ResponseEntity.ok(Map.of("message", "Pending checkout cancelled."));
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

    @PostMapping("/cancel-pending-checkout")
    public ResponseEntity<?> cancelPendingCheckout(Authentication authentication, @RequestBody(required = false) Map<String, Object> body) {
        String email = authentication.getName();
        Integer invoiceId = null;
        if (body != null && body.containsKey("invoiceId") && body.get("invoiceId") != null) {
            try {
                invoiceId = Integer.parseInt(String.valueOf(body.get("invoiceId")));
            } catch (Exception ignored) {}
        }
        paymentService.cancelPendingCheckout(email, invoiceId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Pending checkout cancelled."));
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

    @GetMapping("/payos-callback")
    public ResponseEntity<?> payosCallback(@RequestParam Map<String, String> queryParams) {
        paymentService.handlePayOSCallback(queryParams);
        return ResponseEntity.ok(result(Integer.parseInt(queryParams.get("orderCode"))));
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<?> payosWebhook(@RequestBody Map<String, Object> body) {
        paymentService.handlePayOSWebhook(body);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/vietqr-info/{invoiceId}")
    public ResponseEntity<?> getVietQRInfo(Authentication authentication, @PathVariable Integer invoiceId) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(paymentService.getVietQRInfo(invoiceId, email));
    }

    @PostMapping("/vietqr-confirm/{invoiceId}")
    public ResponseEntity<?> confirmVietQR(Authentication authentication, @PathVariable Integer invoiceId) {
        String email = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(paymentService.confirmVietQRPayment(invoiceId, email));
    }
}
