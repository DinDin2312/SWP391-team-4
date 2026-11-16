package com.team4.sportscenter.modules.support.repositories;

import com.team4.sportscenter.modules.support.entities.SupportRequest;
import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, Integer> {
    
    List<SupportRequest> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    @Query("SELECT r FROM SupportRequest r WHERE " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:category IS NULL OR r.category = :category) AND " +
           "(:keyword IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(r.user.email) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.createdAt DESC")
    Page<SupportRequest> searchSupportRequests(
            @Param("status") SupportStatus status,
            @Param("category") SupportCategory category,
            @Param("keyword") String keyword,
            Pageable pageable);

    long countByStatus(SupportStatus status);
}
