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
public class MemberBookingDetail {
    private Integer bookingId;
    private Integer scheduleId;
    private Integer classId;
    private String className;
    private String coachName;
    private String coachEmail;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String bookingStatus;
    private String attendanceStatus;
    private LocalDateTime bookingTime;
}
