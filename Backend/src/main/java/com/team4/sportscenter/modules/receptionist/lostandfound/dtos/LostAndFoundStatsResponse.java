package com.team4.sportscenter.modules.receptionist.lostandfound.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LostAndFoundStatsResponse {

    private long totalStored;
    private long highValueStored;
    private long totalClaimed;
    private long totalOverdue;
    private long expiringSoon;
}

