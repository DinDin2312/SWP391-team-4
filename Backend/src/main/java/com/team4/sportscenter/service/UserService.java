package com.team4.sportscenter.service;

import com.team4.sportscenter.dto.request.RegisterRequest;
import com.team4.sportscenter.dto.response.RegisterResponse;

public interface UserService {
    RegisterResponse registerMember(RegisterRequest request);
    void verifyOtp(String email, String otp);
}
