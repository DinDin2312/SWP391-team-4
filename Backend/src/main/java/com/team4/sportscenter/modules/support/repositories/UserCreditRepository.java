package com.team4.sportscenter.modules.support.repositories;

import com.team4.sportscenter.modules.support.entities.UserCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCreditRepository extends JpaRepository<UserCredit, Integer> {
    
    List<UserCredit> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    @Query("SELECT c FROM UserCredit c WHERE c.user.userId = :userId AND c.status = 'ACTIVE' AND c.expiryDate >= :today AND c.remainingAmount > 0 ORDER BY c.expiryDate ASC")
    List<UserCredit> findUsableCredits(@Param("userId") Integer userId, @Param("today") LocalDate today);

    Optional<UserCredit> findByCreditCode(String creditCode);

    Optional<UserCredit> findBySupportRequestRequestId(Integer requestId);

    Optional<UserCredit> findByUsedInvoiceId(Integer usedInvoiceId);
}
