package com.team4.sportscenter.modules.coach.dtos;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RescheduleRequestResponseDto {

    private Integer requestId;
    private Integer scheduleId;
    private Integer classId;
    private String className;
    private Integer coachId;
    private String coachName;
    private String coachEmail;
    private Integer substituteCoachId;
    private String substituteCoachName;

    private String actionType; // MAKEUP_SESSION or SUBSTITUTE_COACH

    private LocalDateTime originalStartTime;
    private LocalDateTime originalEndTime;
    private Integer originalRoomId;
    private String originalRoomName;

    private LocalDateTime proposedStartTime;
    private LocalDateTime proposedEndTime;
    private Integer proposedRoomId;
    private String proposedRoomName;

    private String reasonCategory;
    private String reasonDetails;

    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
    private String adminResponseNote;
    private Integer reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;

    private LocalDateTime confirmationDeadline;
    private Integer minAttendees;

    private Integer totalEnrolledMembers;
    private Integer acceptedCount;
    private Integer declinedCount;
    private Integer pendingCount;

    private Boolean hasRoomConflict;
    private Boolean hasCoachConflict;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Integer getAcceptedMembersCount() {
        return acceptedCount != null ? acceptedCount : 0;
    }

    public Integer getMinAttendeesRequired() {
        return minAttendees != null ? minAttendees : 1;
    }
}
