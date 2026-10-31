package com.team4.sportscenter.modules.receptionist.lostandfound.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.receptionist.lostandfound.dtos.*;
import com.team4.sportscenter.modules.receptionist.lostandfound.entities.LostAndFoundItem;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import com.team4.sportscenter.modules.receptionist.lostandfound.repositories.LostAndFoundRepository;
import com.team4.sportscenter.modules.receptionist.lostandfound.services.LostAndFoundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class LostAndFoundServiceImpl implements LostAndFoundService {

    private final LostAndFoundRepository lostAndFoundRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Page<LostItemResponse> searchItems(
            String keyword,
            ItemStatus status,
            ItemCategory category,
            ValuationType valuationType,
            Pageable pageable) {

        // Auto-mark overdue items before querying
        syncOverdueItems();

        Page<LostAndFoundItem> page = lostAndFoundRepository.searchItems(
                keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null,
                status,
                category,
                valuationType,
                pageable
        );

        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public LostItemResponse getItemById(Integer id) {
        LostAndFoundItem item = lostAndFoundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món đồ thất lạc với ID: " + id));
        return mapToResponse(item);
    }

    @Override
    @Transactional
    public LostItemResponse createItem(CreateLostItemRequest request, String staffEmail) {
        User staff = staffEmail != null ? userRepository.findByEmail(staffEmail).orElse(null) : null;

        ValuationType valuationType = request.getValuationType() != null 
                ? request.getValuationType() 
                : determineValuationType(request.getCategory());

        LocalDate expiryDate = calculateExpiryDate(valuationType, request.getCustomRetentionDays());
        String itemCode = generateItemCode();

        LostAndFoundItem item = LostAndFoundItem.builder()
                .itemCode(itemCode)
                .itemName(request.getItemName().trim())
                .category(request.getCategory())
                .valuationType(valuationType)
                .color(request.getColor() != null ? request.getColor().trim() : null)
                .foundLocation(request.getFoundLocation().trim())
                .foundDate(request.getFoundDate() != null ? request.getFoundDate() : LocalDateTime.now())
                .foundByName(request.getFoundByName() != null ? request.getFoundByName().trim() : null)
                .storageLocation(request.getStorageLocation().trim())
                .publicDescription(request.getPublicDescription())
                .secretDetails(request.getSecretDetails())
                .imageUrl(request.getImageUrl())
                .status(ItemStatus.STORED)
                .expiryDate(expiryDate)
                .createdBy(staff)
                .build();

        LostAndFoundItem saved = lostAndFoundRepository.save(item);
        log.info("Lễ tân {} đã tiếp nhận món đồ thất lạc mới: {} [{}]", 
                staffEmail, saved.getItemName(), saved.getItemCode());
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public LostItemResponse updateItem(Integer id, UpdateLostItemRequest request) {
        LostAndFoundItem item = lostAndFoundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món đồ thất lạc với ID: " + id));

        if (item.getStatus() == ItemStatus.CLAIMED || item.getStatus() == ItemStatus.DISPOSED) {
            throw new IllegalStateException("Không thể chỉnh sửa món đồ đã được bàn giao hoặc thanh lý.");
        }

        item.setItemName(request.getItemName().trim());
        item.setCategory(request.getCategory());
        if (request.getValuationType() != null) {
            item.setValuationType(request.getValuationType());
        }
        item.setColor(request.getColor() != null ? request.getColor().trim() : null);
        item.setFoundLocation(request.getFoundLocation().trim());
        item.setFoundByName(request.getFoundByName() != null ? request.getFoundByName().trim() : null);
        item.setStorageLocation(request.getStorageLocation().trim());
        item.setPublicDescription(request.getPublicDescription());
        item.setSecretDetails(request.getSecretDetails());
        if (request.getImageUrl() != null && !request.getImageUrl().isEmpty()) {
            item.setImageUrl(request.getImageUrl());
        }

        LostAndFoundItem updated = lostAndFoundRepository.save(item);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public LostItemResponse claimItem(Integer id, ClaimItemRequest request, String staffEmail) {
        LostAndFoundItem item = lostAndFoundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món đồ thất lạc với ID: " + id));

        if (item.getStatus() == ItemStatus.CLAIMED) {
            throw new IllegalStateException("Món đồ này đã được bàn giao cho khách trước đó.");
        }
        if (item.getStatus() == ItemStatus.DISPOSED) {
            throw new IllegalStateException("Món đồ này đã được xử lý/thanh lý, không thể bàn giao.");
        }

        User staff = staffEmail != null ? userRepository.findByEmail(staffEmail).orElse(null) : null;
        User memberUser = null;
        if (request.getClaimedByUserId() != null) {
            memberUser = userRepository.findById(request.getClaimedByUserId()).orElse(null);
        }

        item.setStatus(ItemStatus.CLAIMED);
        item.setClaimedAt(LocalDateTime.now());
        item.setClaimedByStaff(staff);
        item.setClaimedByUser(memberUser);
        item.setClaimantName(request.getClaimantName().trim());
        item.setClaimantPhone(request.getClaimantPhone().trim());
        item.setClaimantIdCard(request.getClaimantIdCard() != null ? request.getClaimantIdCard().trim() : null);
        item.setClaimNotes(request.getClaimNotes());

        LostAndFoundItem claimed = lostAndFoundRepository.save(item);
        log.info("Lễ tân {} đã bàn giao món đồ {} cho khách: {} ({})",
                staffEmail, claimed.getItemCode(), claimed.getClaimantName(), claimed.getClaimantPhone());
        return mapToResponse(claimed);
    }

    @Override
    @Transactional
    public LostItemResponse disposeItem(Integer id, DisposeItemRequest request, String staffEmail) {
        LostAndFoundItem item = lostAndFoundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món đồ thất lạc với ID: " + id));

        if (item.getStatus() == ItemStatus.CLAIMED) {
            throw new IllegalStateException("Món đồ đã được bàn giao cho khách, không thể thanh lý.");
        }

        User staff = staffEmail != null ? userRepository.findByEmail(staffEmail).orElse(null) : null;

        item.setStatus(ItemStatus.DISPOSED);
        item.setDisposedAt(LocalDateTime.now());
        item.setDisposedByStaff(staff);
        item.setDisposalReason(request.getDisposalReason().trim());
        item.setDisposalNotes(request.getDisposalNotes());

        LostAndFoundItem disposed = lostAndFoundRepository.save(item);
        log.info("Đã xử lý thanh lý món đồ {} với lý do: {}", disposed.getItemCode(), disposed.getDisposalReason());
        return mapToResponse(disposed);
    }

    @Override
    @Transactional
    public void deleteItem(Integer id) {
        LostAndFoundItem item = lostAndFoundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy món đồ thất lạc với ID: " + id));
        lostAndFoundRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public LostAndFoundStatsResponse getStats() {
        long stored = lostAndFoundRepository.countByStatus(ItemStatus.STORED);
        long highValue = lostAndFoundRepository.countByValuationTypeAndStatus(ValuationType.HIGH_VALUE, ItemStatus.STORED);
        long claimed = lostAndFoundRepository.countByStatus(ItemStatus.CLAIMED);
        long overdue = lostAndFoundRepository.countByStatus(ItemStatus.OVERDUE);
        long expiringSoon = lostAndFoundRepository.countExpiringSoon(LocalDate.now().plusDays(5));

        return LostAndFoundStatsResponse.builder()
                .totalStored(stored)
                .highValueStored(highValue)
                .totalClaimed(claimed)
                .totalOverdue(overdue)
                .expiringSoon(expiringSoon)
                .build();
    }

    private void syncOverdueItems() {
        List<LostAndFoundItem> expiredStoredItems = lostAndFoundRepository.findByStatusAndExpiryDateBefore(
                ItemStatus.STORED, LocalDate.now());
        if (!expiredStoredItems.isEmpty()) {
            for (LostAndFoundItem item : expiredStoredItems) {
                item.setStatus(ItemStatus.OVERDUE);
            }
            lostAndFoundRepository.saveAll(expiredStoredItems);
            log.info("Đã cập nhật {} món đồ thất lạc sang trạng thái QUÁ HẠN (OVERDUE)", expiredStoredItems.size());
        }
    }

    private ValuationType determineValuationType(ItemCategory category) {
        if (category == null) return ValuationType.STANDARD;
        return switch (category) {
            case ELECTRONICS, DOCUMENTS_WALLET -> ValuationType.HIGH_VALUE;
            case PERISHABLE -> ValuationType.PERISHABLE;
            default -> ValuationType.STANDARD;
        };
    }

    private LocalDate calculateExpiryDate(ValuationType valuationType, Integer customDays) {
        if (customDays != null && customDays > 0) {
            return LocalDate.now().plusDays(customDays);
        }
        return switch (valuationType) {
            case PERISHABLE -> LocalDate.now().plusDays(2);
            case HIGH_VALUE -> LocalDate.now().plusDays(90);
            default -> LocalDate.now().plusDays(30);
        };
    }

    private String generateItemCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomSuffix = 1000 + new Random().nextInt(9000);
        String candidate = "LF-" + datePart + "-" + randomSuffix;
        while (lostAndFoundRepository.findByItemCode(candidate).isPresent()) {
            randomSuffix = 1000 + new Random().nextInt(9000);
            candidate = "LF-" + datePart + "-" + randomSuffix;
        }
        return candidate;
    }

    private LostItemResponse mapToResponse(LostAndFoundItem item) {
        LocalDate now = LocalDate.now();
        boolean isOverdue = (item.getStatus() == ItemStatus.OVERDUE) || 
                (item.getStatus() == ItemStatus.STORED && item.getExpiryDate().isBefore(now));

        long daysInStorage = ChronoUnit.DAYS.between(item.getCreatedAt().toLocalDate(), now);
        long daysUntilExpiry = ChronoUnit.DAYS.between(now, item.getExpiryDate());

        return LostItemResponse.builder()
                .itemId(item.getItemId())
                .itemCode(item.getItemCode())
                .itemName(item.getItemName())
                .category(item.getCategory())
                .valuationType(item.getValuationType())
                .color(item.getColor())
                .foundLocation(item.getFoundLocation())
                .foundDate(item.getFoundDate())
                .foundByName(item.getFoundByName())
                .storageLocation(item.getStorageLocation())
                .publicDescription(item.getPublicDescription())
                .secretDetails(item.getSecretDetails())
                .imageUrl(item.getImageUrl())
                .status(item.getStatus())
                .expiryDate(item.getExpiryDate())
                .createdById(item.getCreatedBy() != null ? item.getCreatedBy().getUserId() : null)
                .createdByName(item.getCreatedBy() != null ? item.getCreatedBy().getFullName() : null)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .claimedAt(item.getClaimedAt())
                .claimedByStaffId(item.getClaimedByStaff() != null ? item.getClaimedByStaff().getUserId() : null)
                .claimedByStaffName(item.getClaimedByStaff() != null ? item.getClaimedByStaff().getFullName() : null)
                .claimedByUserId(item.getClaimedByUser() != null ? item.getClaimedByUser().getUserId() : null)
                .claimantName(item.getClaimantName())
                .claimantPhone(item.getClaimantPhone())
                .claimantIdCard(item.getClaimantIdCard())
                .claimNotes(item.getClaimNotes())
                .disposedAt(item.getDisposedAt())
                .disposedByStaffId(item.getDisposedByStaff() != null ? item.getDisposedByStaff().getUserId() : null)
                .disposedByStaffName(item.getDisposedByStaff() != null ? item.getDisposedByStaff().getFullName() : null)
                .disposalReason(item.getDisposalReason())
                .disposalNotes(item.getDisposalNotes())
                .isOverdue(isOverdue)
                .daysInStorage(Math.max(0, daysInStorage))
                .daysUntilExpiry(daysUntilExpiry)
                .build();
    }
}

