package com.team4.sportscenter.modules.member.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UpcomingBookingResponse {
    private Integer bookingId;
    private String className;
    private String coachName;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private long durationMinutes;
    private String status;
}
