package com.team4.sportscenter.modules.auth.dtos.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String email;
    private String fullName;
    private String role;
}
