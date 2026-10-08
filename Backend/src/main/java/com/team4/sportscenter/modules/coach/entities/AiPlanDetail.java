package com.team4.sportscenter.modules.coach.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "AI_PLAN_DETAILS")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPlanDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    private Integer detailId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private AiWorkoutPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Column(name = "sets")
    private Integer sets;

    @Column(name = "reps")
    private Integer reps;

    @Column(name = "rest_seconds")
    private Integer restSeconds;
}
