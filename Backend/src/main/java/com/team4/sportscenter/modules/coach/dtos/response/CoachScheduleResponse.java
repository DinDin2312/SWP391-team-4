package com.team4.sportscenter.modules.coach.dtos.response;

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
public class CoachScheduleResponse {
    private Integer scheduleId;
    private Integer classId;
    private String className;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer maxSlots;
    private Integer enrolledCount;
    private List<EnrolledStudentResponse> enrolledStudents;
}
