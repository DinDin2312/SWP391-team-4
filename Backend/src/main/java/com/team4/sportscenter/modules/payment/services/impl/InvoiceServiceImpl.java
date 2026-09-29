package com.team4.sportscenter.modules.payment.services.impl;

import com.team4.sportscenter.modules.payment.dtos.InvoiceDetailResponse;
import com.team4.sportscenter.modules.payment.dtos.InvoiceResponse;
import com.team4.sportscenter.modules.payment.entities.Invoice;
import com.team4.sportscenter.modules.payment.entities.InvoiceDetail;
import com.team4.sportscenter.modules.payment.entities.PaymentEntity;
import com.team4.sportscenter.modules.payment.repositories.InvoiceDetailRepository;
import com.team4.sportscenter.modules.payment.repositories.InvoiceRepository;
import com.team4.sportscenter.modules.payment.repositories.PaymentRepository;
import com.team4.sportscenter.modules.payment.services.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public List<InvoiceResponse> getMyInvoices(String email) {
        List<Invoice> invoices = invoiceRepository.findByUser_EmailOrderByCreatedAtDesc(email);
        
        return invoices.stream().map(invoice -> {
            List<InvoiceDetail> details = invoiceDetailRepository.findByInvoice_InvoiceId(invoice.getInvoiceId());
            Optional<PaymentEntity> paymentOpt = paymentRepository.findByInvoice_InvoiceId(invoice.getInvoiceId());
            
            List<InvoiceDetailResponse> detailResponses = details.stream().map(d -> {
                String itemName = "Unknown";
                String itemType = "UNKNOWN";
                if (d.getGymClass() != null) {
                    itemName = d.getGymClass().getClassName();
                    itemType = "CLASS";
                } else if (d.getAPackage() != null) {
                    itemName = d.getAPackage().getPackageName();
                    itemType = "PACKAGE";
                } else if (d.getSchedule() != null) {
                    // For schedules, it could be a single class booking
                    itemName = d.getSchedule().getGymClass() != null ? 
                        d.getSchedule().getGymClass().getClassName() + " (Schedule)" : "Class Booking";
                    itemType = "CLASS_SCHEDULE";
                }
                
                return InvoiceDetailResponse.builder()
                        .itemName(itemName)
                        .itemType(itemType)
                        .unitPrice(d.getUnitPrice())
                        .build();
            }).collect(Collectors.toList());
            
            return InvoiceResponse.builder()
                    .invoiceId(invoice.getInvoiceId())
                    .totalAmount(invoice.getTotalAmount())
                    .status(invoice.getStatus())
                    .createdAt(invoice.getCreatedAt())
                    .paymentMethod(paymentOpt.map(PaymentEntity::getPaymentMethod).orElse("N/A"))
                    .transactionNo(paymentOpt.map(PaymentEntity::getTransactionNo).orElse(null))
                    .paymentDate(paymentOpt.map(PaymentEntity::getPaymentDate).orElse(null))
                    .details(detailResponses)
                    .build();
        }).collect(Collectors.toList());
    }
}
