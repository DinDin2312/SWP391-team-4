package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberRegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String defaultPassword;
    private String bio;
}