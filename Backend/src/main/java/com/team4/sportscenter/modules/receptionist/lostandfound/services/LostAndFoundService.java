package com.team4.sportscenter.modules.receptionist.lostandfound.services;

import com.team4.sportscenter.modules.receptionist.lostandfound.dtos.*;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LostAndFoundService {

    Page<LostItemResponse> searchItems(
            String keyword,
            ItemStatus status,
            ItemCategory category,
            ValuationType valuationType,
            Pageable pageable
    );

    LostItemResponse getItemById(Integer id);

    LostItemResponse createItem(CreateLostItemRequest request, String staffEmail);

    LostItemResponse updateItem(Integer id, UpdateLostItemRequest request);

    LostItemResponse claimItem(Integer id, ClaimItemRequest request, String staffEmail);

    LostItemResponse disposeItem(Integer id, DisposeItemRequest request, String staffEmail);

    void deleteItem(Integer id);

    LostAndFoundStatsResponse getStats();
}

