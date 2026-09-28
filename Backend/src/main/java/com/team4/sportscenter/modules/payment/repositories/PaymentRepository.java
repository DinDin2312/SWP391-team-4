package com.team4.sportscenter.modules.payment.repositories;

import com.team4.sportscenter.modules.payment.entities.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Integer> {
}
