package com.team4.sportscenter.modules.receptionist.lostandfound.dtos;

import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateLostItemRequest {

    @NotBlank(message = "Item name cannot be blank")
    private String itemName;

    @NotNull(message = "Category is required")
    private ItemCategory category;

    private ValuationType valuationType;

    private String color;

    @NotBlank(message = "Found location is required")
    private String foundLocation;

    private String foundByName;

    @NotBlank(message = "Storage location is required")
    private String storageLocation;

    private String publicDescription;

    private String secretDetails;

    private String imageUrl;
}

