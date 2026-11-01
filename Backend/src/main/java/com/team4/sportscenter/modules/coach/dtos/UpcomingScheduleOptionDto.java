package com.team4.sportscenter.modules.coach.dtos;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpcomingScheduleOptionDto {
    private Integer scheduleId;
    private Integer classId;
    private String className;
    private Integer roomId;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer enrolledCount;
    private String status;
    private Boolean hasPendingRequest;
    private Integer existingRequestId;
}
