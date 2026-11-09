package com.team4.sportscenter.modules.coach.dtos.response;

import com.team4.sportscenter.modules.member.health.MemberHealthSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolledStudentResponse {
    private Integer bookingId;
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String avatarPath;
    private String avatarUrl;
    private String bookingStatus;
    private String attendanceStatus;
    private Boolean checkedInAtFrontDesk;
    private java.time.LocalDateTime frontDeskCheckInTime;
    private String frontDeskCheckInType;
    private MemberHealthSummary health;
    private java.math.BigDecimal height;
    private java.math.BigDecimal weight;
}
