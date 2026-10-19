package com.team4.sportscenter.modules.coach.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "COACH_PLAN_DETAILS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachPlanDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Integer detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private CoachWorkoutPlan workoutPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Column(name = "week_number")
    @Builder.Default
    private Integer weekNumber = 1;

    @Column(name = "day_of_week")
    private String dayOfWeek;

    @Column(name = "day_label")
    private String dayLabel;

    @Column(name = "sets")
    private Integer sets;

    @Column(name = "reps")
    private Integer reps;

    @Column(name = "rest_seconds")
    private Integer restSeconds;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "weight_kg")
    private java.math.BigDecimal weightKg;

    @Column(name = "coach_note")
    private String coachNote;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;
}
