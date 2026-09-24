package com.team4.sportscenter.modules.member.dtos.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class RecentActivityResponse {
    private Integer bookingId;
    private String className;
    private String coachName;
    private String roomName;
    private LocalDateTime startTime;
    private long durationMinutes;
    private String status;
    private Integer calories; // Mocked for now
    private Integer avgHr;    // Mocked for now
}
