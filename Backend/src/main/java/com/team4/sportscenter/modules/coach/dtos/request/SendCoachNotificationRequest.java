package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendCoachNotificationRequest {
    private String targetType; // "ALL", "CLASS", "INDIVIDUAL"
    private Integer classId;    // Required when targetType is "CLASS"
    private Integer recipientUserId; // Required when targetType is "INDIVIDUAL"
    private String title;
    private String message;
    private String type; // e.g., "COACH", "ANNOUNCEMENT", "SCHEDULE", "URGENT"
}
