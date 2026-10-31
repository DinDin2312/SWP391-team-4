package com.team4.sportscenter.modules.member.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "MEMBER_HEALTH_PROFILES")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberHealthProfile {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "parq_answers", length = 7)
    private String parqAnswers;

    @Column(name = "conditions", length = 255)
    private String conditions;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "consent_at", nullable = false)
    private LocalDateTime consentAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
