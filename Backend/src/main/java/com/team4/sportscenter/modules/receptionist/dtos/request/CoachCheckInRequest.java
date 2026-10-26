package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachCheckInRequest {
    private Integer coachId;
    private Integer scheduleId;
    private String note;
    private String receptionistEmail;
}
