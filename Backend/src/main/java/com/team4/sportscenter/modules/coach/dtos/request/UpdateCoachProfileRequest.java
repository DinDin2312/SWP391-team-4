package com.team4.sportscenter.modules.coach.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCoachProfileRequest {
    private String fullName;
    private String phone;
    private String bio;
    private Integer subjectId;
}
