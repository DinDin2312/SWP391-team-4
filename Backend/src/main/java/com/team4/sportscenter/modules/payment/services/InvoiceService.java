package com.team4.sportscenter.modules.payment.services;

import com.team4.sportscenter.modules.payment.dtos.InvoiceResponse;
import java.util.List;

public interface InvoiceService {
    List<InvoiceResponse> getMyInvoices(String email);
}
