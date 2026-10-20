package com.team4.sportscenter.modules.receptionist.dtos.response;

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
public class ClassRenewalSuggestionResponse {
    // Current class summary
    private Integer currentBookingId;
    private String currentClassName;
    private LocalDateTime currentEndTime;
    private Integer subjectId;
    private String subjectName;
    private String currentSchedulePattern;

    // Suggested next class details (best match)
    private Integer suggestedScheduleId;
    private Integer classId;
    private String className;
    private String coachName;
    private String coachEmail;
    private String roomName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal price;
    private Integer maxSlots;
    private Integer bookedSlots;
    private Integer availableSlots;

    // List of all upcoming course options in this subject
    private List<ClassRenewalOptionItem> options;
}
