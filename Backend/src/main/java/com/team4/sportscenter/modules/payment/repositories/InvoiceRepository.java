package com.team4.sportscenter.modules.payment.repositories;

import com.team4.sportscenter.modules.payment.entities.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Integer> {
    List<Invoice> findByUser_EmailOrderByCreatedAtDesc(String email);
}
