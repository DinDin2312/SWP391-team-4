package com.team4.sportscenter.modules.auth.dtos.request;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String token; // The Google ID Token from Frontend
}
