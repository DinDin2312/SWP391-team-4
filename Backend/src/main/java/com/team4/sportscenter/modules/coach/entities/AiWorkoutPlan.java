package com.team4.sportscenter.modules.coach.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "AI_WORKOUT_PLANS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiWorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Integer planId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "goal")
    private String goal;

    @Column(name = "fitness_level")
    private String fitnessLevel;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
