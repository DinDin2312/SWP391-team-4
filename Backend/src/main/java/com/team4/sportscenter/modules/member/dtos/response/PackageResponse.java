package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageResponse {
    private Integer packageId;
    private String packageName;
    private String packageType;
    private String packageTypeName;
    private Integer durationDays;
    private BigDecimal price;
    private Integer purchaseLimitPerMember;
    private Boolean canPurchase;
    private String purchaseBlockCode;
    private String purchaseBlockReason;
    private String imagePath;
    private java.util.List<java.util.Map<String,Object>> benefits;
}
