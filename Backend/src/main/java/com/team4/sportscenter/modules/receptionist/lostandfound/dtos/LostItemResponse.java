package com.team4.sportscenter.modules.receptionist.lostandfound.dtos;

import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LostItemResponse {

    private Integer itemId;
    private String itemCode;
    private String itemName;
    private ItemCategory category;
    private ValuationType valuationType;
    private String color;
    private String foundLocation;
    private LocalDateTime foundDate;
    private String foundByName;
    private String storageLocation;
    private String publicDescription;
    private String secretDetails;
    private String imageUrl;
    private ItemStatus status;
    private LocalDate expiryDate;

    private Integer createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Claim details
    private LocalDateTime claimedAt;
    private Integer claimedByStaffId;
    private String claimedByStaffName;
    private Integer claimedByUserId;
    private String claimantName;
    private String claimantPhone;
    private String claimantIdCard;
    private String claimNotes;

    // Disposal details
    private LocalDateTime disposedAt;
    private Integer disposedByStaffId;
    private String disposedByStaffName;
    private String disposalReason;
    private String disposalNotes;

    // Computed helper flags
    private boolean isOverdue;
    private long daysInStorage;
    private long daysUntilExpiry;
}

