package com.team4.sportscenter.modules.auth.services;

import com.team4.sportscenter.modules.auth.dtos.request.RegisterRequest;
import com.team4.sportscenter.modules.auth.dtos.response.RegisterResponse;

public interface UserService {
    RegisterResponse registerMember(RegisterRequest request);
    void verifyOtp(String email, String otp);
    void sendForgotPasswordOtp(String email);
    void verifyForgotPasswordOtp(String email, String otp);
    void resetPassword(String email, String otp, String newPassword);
    com.team4.sportscenter.modules.auth.dtos.response.LoginResponse loginWithGoogle(com.team4.sportscenter.modules.auth.dtos.request.GoogleLoginRequest request);
}
