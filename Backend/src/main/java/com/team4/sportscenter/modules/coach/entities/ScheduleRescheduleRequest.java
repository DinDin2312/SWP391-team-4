package com.team4.sportscenter.modules.coach.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Room;
import com.team4.sportscenter.modules.member.entities.Schedule;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "SCHEDULE_RESCHEDULE_REQUESTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleRescheduleRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Integer requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", nullable = false)
    private GymClass gymClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", nullable = false)
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "substitute_coach_id")
    private User substituteCoach;

    @Column(name = "action_type", nullable = false, length = 30)
    @Builder.Default
    private String action_type = "MAKEUP_SESSION"; // "MAKEUP_SESSION" or "SUBSTITUTE_COACH"

    @Column(name = "original_start_time", nullable = false)
    private LocalDateTime originalStartTime;

    @Column(name = "original_end_time", nullable = false)
    private LocalDateTime originalEndTime;

    @Column(name = "proposed_start_time")
    private LocalDateTime proposedStartTime;

    @Column(name = "proposed_end_time")
    private LocalDateTime proposedEndTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_room_id")
    private Room proposedRoom;

    @Column(name = "reason_category", nullable = false, length = 50)
    private String reasonCategory; // NO_SUBSTITUTE_SICK, NO_SUBSTITUTE_PERSONAL, NO_SUBSTITUTE_BUSINESS, FACILITY_ISSUE, OTHER

    @Column(name = "reason_details", nullable = false, columnDefinition = "TEXT")
    private String reasonDetails;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, CANCELLED

    @Column(name = "admin_response_note", columnDefinition = "TEXT")
    private String adminResponseNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "confirmation_deadline")
    private LocalDateTime confirmationDeadline;

    @Column(name = "min_attendees", nullable = false)
    @Builder.Default
    private Integer minAttendees = 2;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
