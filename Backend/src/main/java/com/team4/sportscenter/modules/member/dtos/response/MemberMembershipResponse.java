package com.team4.sportscenter.modules.member.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class MemberMembershipResponse {
    private String packageName;
    private String packageType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private int remainingDays;
}
