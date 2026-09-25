package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarBookingResponse {
    private Integer bookingId;
    private String className;
    private String coachName;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
}
