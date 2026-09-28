package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberDetailResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String status;
    private String bio;
    private String roleName;

    // Current membership summary
    private String currentPackageName;
    private String currentPackageType;
    private String currentMembershipStatus; // ACTIVE, EXPIRED, NO_MEMBERSHIP
    private Long daysRemaining;

    // Statistics
    private Integer totalBookingsCount;
    private Integer attendedCount;
    private Integer absentCount;
    private Integer upcomingCount;

    // Detailed lists
    private List<MemberMembershipDetail> memberships;
    private List<MemberBookingDetail> bookings;
}
