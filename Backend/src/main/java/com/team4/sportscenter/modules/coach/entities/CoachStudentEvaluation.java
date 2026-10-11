package com.team4.sportscenter.modules.coach.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.GymClass;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "COACH_STUDENT_EVALUATIONS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachStudentEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_id")
    private Integer evaluationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private GymClass gymClass;

    @Column(name = "evaluation_type")
    @Builder.Default
    private String evaluationType = "MONTHLY";

    @Column(name = "attendance_score")
    private Integer attendanceScore;

    @Column(name = "effort_score")
    private Integer effortScore;

    @Column(name = "technique_score")
    private Integer techniqueScore;

    @Column(name = "coach_comment", columnDefinition = "TEXT", nullable = false)
    private String coachComment;

    @Column(name = "recommendations", columnDefinition = "TEXT")
    private String recommendations;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
