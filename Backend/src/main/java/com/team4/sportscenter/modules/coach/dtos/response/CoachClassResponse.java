package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachClassResponse {
    private Integer classId;
    private String className;
    private String roomName;
    private Integer maxSlots;
    private Integer enrolledCount;
}
