package com.team4.sportscenter.modules.payment.controllers;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
public class PaymentController {
    
    @GetMapping("/cart")
    public ResponseEntity<?> getCartItems() {
        return ResponseEntity.ok("TODO: Trả về danh sách các lớp đang PENDING");
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout() {
        return ResponseEntity.ok("TODO: Xử lý thanh toán và chuyển PENDING thành ENROLLED");
    }
}