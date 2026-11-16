package com.team4.sportscenter.modules.support.repositories;

import com.team4.sportscenter.modules.support.entities.UserCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCreditRepository extends JpaRepository<UserCredit, Integer> {
    
    List<UserCredit> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    Optional<UserCredit> findByCreditCode(String creditCode);

    Optional<UserCredit> findBySupportRequestRequestId(Integer requestId);

    Optional<UserCredit> findByUsedInvoiceId(Integer usedInvoiceId);
}
