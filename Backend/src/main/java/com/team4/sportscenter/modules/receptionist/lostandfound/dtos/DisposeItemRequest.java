package com.team4.sportscenter.modules.receptionist.lostandfound.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisposeItemRequest {

    @NotBlank(message = "Disposal reason is required")
    private String disposalReason;

    private String disposalNotes;
}

