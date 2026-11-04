package com.team4.sportscenter.modules.coach.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "COACH_WORKOUT_SUBMISSIONS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachWorkoutSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Integer submissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private CoachWorkoutPlan workoutPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detail_id")
    private CoachPlanDetail planDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @Column(name = "video_url", nullable = false, length = 500)
    private String videoUrl;

    @Column(name = "student_note", columnDefinition = "TEXT")
    private String studentNote;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "SUBMITTED";

    @Column(name = "coach_feedback", columnDefinition = "TEXT")
    private String coachFeedback;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "submitted_at", nullable = false)
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}

