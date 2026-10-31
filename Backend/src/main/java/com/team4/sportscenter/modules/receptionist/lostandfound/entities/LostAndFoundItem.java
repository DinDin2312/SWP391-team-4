package com.team4.sportscenter.modules.receptionist.lostandfound.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "LOST_AND_FOUND_ITEMS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LostAndFoundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Integer itemId;

    @Column(name = "item_code", nullable = false, unique = true, length = 50)
    private String itemCode;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ItemCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "valuation_type", nullable = false, length = 30)
    private ValuationType valuationType;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "found_location", nullable = false, length = 255)
    private String foundLocation;

    @Column(name = "found_date", nullable = false)
    private LocalDateTime foundDate;

    @Column(name = "found_by_name", length = 100)
    private String foundByName;

    @Column(name = "storage_location", nullable = false, length = 100)
    private String storageLocation;

    @Column(name = "public_description", columnDefinition = "TEXT")
    private String publicDescription;

    @Column(name = "secret_details", columnDefinition = "TEXT")
    private String secretDetails;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ItemStatus status;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Claiming details
    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_staff_id")
    private User claimedByStaff;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "claimed_by_user_id")
    private User claimedByUser;

    @Column(name = "claimant_name", length = 100)
    private String claimantName;

    @Column(name = "claimant_phone", length = 20)
    private String claimantPhone;

    @Column(name = "claimant_id_card", length = 50)
    private String claimantIdCard;

    @Column(name = "claim_notes", columnDefinition = "TEXT")
    private String claimNotes;

    // Disposal details
    @Column(name = "disposed_at")
    private LocalDateTime disposedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disposed_by_staff_id")
    private User disposedByStaff;

    @Column(name = "disposal_reason", length = 255)
    private String disposalReason;

    @Column(name = "disposal_notes", columnDefinition = "TEXT")
    private String disposalNotes;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (foundDate == null) {
            foundDate = LocalDateTime.now();
        }
        if (status == null) {
            status = ItemStatus.STORED;
        }
        if (valuationType == null) {
            valuationType = ValuationType.STANDARD;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

