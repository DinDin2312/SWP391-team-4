package com.team4.sportscenter.modules.member.health;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberHealthProfileResponse {
    private String gender;
    private String dateOfBirth;
    private Integer age;
    private List<Boolean> parq;
    private List<String> conditions;
    private String notes;
    private boolean clearanceRecommended;
    private boolean completed;
    private LocalDateTime consentAt;
    private LocalDateTime updatedAt;
}
