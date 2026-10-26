package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachScheduleCheckInResponse {
    private Integer coachId;
    private String coachName;
    private String coachEmail;
    private String coachPhone;

    private Integer scheduleId;
    private Integer classId;
    private String className;
    private Integer roomId;
    private String roomName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Long checkInId;
    private String checkInStatus; // "PENDING", "CHECKED_IN", "COMPLETED"
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String checkedInBy;
    private String note;
}
