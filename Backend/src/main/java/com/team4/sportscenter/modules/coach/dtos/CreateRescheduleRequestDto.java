package com.team4.sportscenter.modules.coach.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRescheduleRequestDto {

    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;

    @Builder.Default
    private String actionType = "MAKEUP_SESSION"; // "MAKEUP_SESSION" or "SUBSTITUTE_COACH"

    private LocalDateTime proposedStartTime;

    private LocalDateTime proposedEndTime;

    private Integer proposedRoomId;

    private Integer requestedSubstituteCoachId;

    @NotBlank(message = "Reason category is required")
    private String reasonCategory; // NO_SUBSTITUTE_SICK, NO_SUBSTITUTE_PERSONAL, NO_SUBSTITUTE_BUSINESS, FACILITY_ISSUE, OTHER

    private String reasonDetails;
}
