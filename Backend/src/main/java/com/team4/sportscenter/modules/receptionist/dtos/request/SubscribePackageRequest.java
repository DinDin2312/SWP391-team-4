package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscribePackageRequest {
    private Integer userId;
    private Integer packageId;
    private LocalDate startDate; // Ngày bắt đầu có hiệu lực (nếu null lấy ngày hiện tại)
}