package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollClassRequest {
    private Integer userId;
    private Integer classId;
    private Integer membershipId;
    private String paymentMethod;
}
