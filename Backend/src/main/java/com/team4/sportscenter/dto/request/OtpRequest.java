package com.team4.sportscenter.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpRequest {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String otp;
}
