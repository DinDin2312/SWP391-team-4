package com.team4.sportscenter.modules.member.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.math.BigDecimal;

@Data
@Builder
public class MemberPackageResponse {
    private Integer membershipId;
    private String packageName;
    private String packageType;
    private String packageTypeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Integer durationDays;
    private BigDecimal price;
    private java.util.List<java.util.Map<String,Object>> benefits;
}
