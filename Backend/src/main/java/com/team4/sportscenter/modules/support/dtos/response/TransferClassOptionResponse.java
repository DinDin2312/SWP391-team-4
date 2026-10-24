package com.team4.sportscenter.modules.support.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferClassOptionResponse {
    private Integer classId;
    private Integer subjectId;
    private String subjectName;
    private String className;
    private String coachName;
    private String roomName;
    private BigDecimal price;
    private Integer maxSlots;
    private Integer bookedSlots;
    private Integer totalSessions;
    private LocalDateTime nextSessionTime;
    private String schedulePattern;
    private List<String> upcomingDates;
    private boolean hasConflict;
    private String conflictDetail;
    private boolean isFull;
    private boolean canSelect;
}
