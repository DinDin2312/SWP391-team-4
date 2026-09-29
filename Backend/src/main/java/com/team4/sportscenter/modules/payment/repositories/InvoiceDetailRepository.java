package com.team4.sportscenter.modules.payment.repositories;

import com.team4.sportscenter.modules.payment.entities.InvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceDetailRepository extends JpaRepository<InvoiceDetail, Integer> {
    List<InvoiceDetail> findByInvoice_InvoiceId(Integer invoiceId);
}
