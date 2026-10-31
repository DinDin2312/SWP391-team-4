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
public class ClaimItemRequest {

    private Integer claimedByUserId;

    @NotBlank(message = "Claimant name is required")
    private String claimantName;

    @NotBlank(message = "Claimant phone is required")
    private String claimantPhone;

    private String claimantIdCard;

    private String claimNotes;
}

