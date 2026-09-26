package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberSummaryResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private String bio;

    // Current active membership info
    private Integer currentMembershipId;
    private String currentPackageName;
    private String currentPackageType;
    private LocalDate membershipStartDate;
    private LocalDate membershipEndDate;
    private String membershipStatus; // ACTIVE, EXPIRED, NO_MEMBERSHIP
    private Long daysRemaining;

    // Statistics
    private Long totalBookings;
}
