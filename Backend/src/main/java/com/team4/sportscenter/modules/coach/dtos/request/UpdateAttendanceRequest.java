package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRequest {
    private List<StudentAttendanceItem> attendances;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceItem {
        private Integer bookingId;
        private Integer userId;
        private String attendanceStatus; // "NOT_YET", "PRESENT", "ABSENT"
    }
}
