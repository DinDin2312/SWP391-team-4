package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutPlanDetailRequest {
    private Integer exerciseId;
    private Integer weekNumber;
    private String dayOfWeek;
    private String dayLabel;
    private Integer sets;
    private Integer reps;
    private Integer restSeconds;
    private Integer durationMinutes;
    private java.math.BigDecimal weightKg;
    private String coachNote;
    private Integer sortOrder;
}
