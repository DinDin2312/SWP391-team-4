package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberMembershipDetail {
    private Integer membershipId;
    private Integer packageId;
    private String packageName;
    private String packageType;
    private Integer durationDays;
    private BigDecimal price;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Long daysRemaining;
    private Boolean active;
}
