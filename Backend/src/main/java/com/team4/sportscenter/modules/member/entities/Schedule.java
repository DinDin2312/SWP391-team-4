package com.team4.sportscenter.modules.member.entities;

import com.team4.sportscenter.modules.auth.entities.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SCHEDULES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Integer scheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private GymClass gymClass;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "substitute_coach_id")
    private User substituteCoach;

    /** Room of this session only; null means the class room. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_id")
    private Room room;

    /** The room this session really uses: its own room when set, otherwise the class room. */
    @Transient
    public Room getEffectiveRoom() {
        if (room != null) return room;
        return gymClass != null ? gymClass.getRoom() : null;
    }
}
