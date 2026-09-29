package com.team4.sportscenter.modules.payment.controllers;

import com.team4.sportscenter.modules.payment.dtos.InvoiceResponse;
import com.team4.sportscenter.modules.payment.services.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(invoiceService.getMyInvoices(email));
    }
}
