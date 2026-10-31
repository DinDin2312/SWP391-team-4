package com.team4.sportscenter.modules.receptionist.lostandfound.repositories;

import com.team4.sportscenter.modules.receptionist.lostandfound.entities.LostAndFoundItem;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LostAndFoundRepository extends JpaRepository<LostAndFoundItem, Integer>, JpaSpecificationExecutor<LostAndFoundItem> {

    Optional<LostAndFoundItem> findByItemCode(String itemCode);

    @Query("SELECT item FROM LostAndFoundItem item WHERE " +
           "(:status IS NULL OR item.status = :status) AND " +
           "(:category IS NULL OR item.category = :category) AND " +
           "(:valuationType IS NULL OR item.valuationType = :valuationType) AND " +
           "(:keyword IS NULL OR :keyword = '' OR " +
           " LOWER(item.itemCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.itemName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.foundLocation) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.storageLocation) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.color) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.claimantName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(item.claimantPhone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<LostAndFoundItem> searchItems(
            @Param("keyword") String keyword,
            @Param("status") ItemStatus status,
            @Param("category") ItemCategory category,
            @Param("valuationType") ValuationType valuationType,
            Pageable pageable
    );

    long countByStatus(ItemStatus status);

    long countByValuationTypeAndStatus(ValuationType valuationType, ItemStatus status);

    @Query("SELECT COUNT(item) FROM LostAndFoundItem item WHERE item.status = 'STORED' AND item.expiryDate <= :targetDate")
    long countExpiringSoon(@Param("targetDate") LocalDate targetDate);

    List<LostAndFoundItem> findByStatusAndExpiryDateBefore(ItemStatus status, LocalDate date);
}

