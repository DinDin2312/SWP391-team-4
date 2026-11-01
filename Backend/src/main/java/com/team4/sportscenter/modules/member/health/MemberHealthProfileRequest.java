package com.team4.sportscenter.modules.member.health;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberHealthProfileRequest {
    private String gender;
    private String dateOfBirth; // format yyyy-MM-dd
    private List<Boolean> parq; // exactly 7 booleans
    private List<String> conditions;
    private String notes;
    private Boolean consent;
}
