package com.team4.sportscenter.modules.coach.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "COACH_WORKOUT_PLANS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachWorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Integer planId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private com.team4.sportscenter.modules.member.entities.GymClass gymClass;

    @Column(name = "plan_type")
    @Builder.Default
    private String planType = "SINGLE";

    @Column(name = "title")
    private String title;

    @Column(name = "goal")
    private String goal;

    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    @Column(name = "end_date")
    private java.time.LocalDate endDate;

    @Column(name = "total_weeks")
    @Builder.Default
    private Integer totalWeeks = 1;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "status")
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "workoutPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CoachPlanDetail> planDetails = new ArrayList<>();
}
