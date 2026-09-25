package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableClassResponse {
    private Integer classId;
    private String className;
    private String coachName;
    private String roomName;
    private java.math.BigDecimal price;
    private Integer maxSlots;
    private Integer bookedSlots;
    private Boolean isBookedByMe;
    private Integer totalSessions;
    private LocalDateTime nextSessionTime;
    private Integer durationMinutes;
    private String schedulePattern;
    private List<String> upcomingDates;
}
