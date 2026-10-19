package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelClassBookingRequest {
    private Integer userId;
    private Integer bookingId;
    private Integer classId;
    private String reason;
}
