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
public class TransferClassPreviewResponse {
    private Integer classId;
    private Integer subjectId;
    private String subjectName;
    private String className;
    private String coachName;
    private String roomName;
    private BigDecimal classPrice;
    private Integer totalSessions;
    private LocalDateTime firstSessionTime;
    private String schedulePattern;
    private List<String> upcomingDates;
    private boolean hasStarted;
    private boolean canTransfer;
    private String message;
    private List<TransferClassOptionResponse> equivalentClasses;
}
