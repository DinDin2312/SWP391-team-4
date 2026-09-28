package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolledStudentResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String bookingStatus;
    private String attendanceStatus;
}
