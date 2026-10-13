package com.team4.sportscenter.modules.member.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrolledClassResponse {
    private Integer classId;
    private String className;
    private Integer subjectId;
    private String subjectName;
    private Integer coachId;
    private String coachName;
    private String coachEmail;
    private String coachAvatar;
    private String roomName;
    private String imagePath;
    private String status;
    private BigDecimal price;
    private Integer totalBookedSessions;
    private String schedulePattern;
    private Long workoutsCount;
}
