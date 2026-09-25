package com.team4.sportscenter.modules.auth.controllers;

import com.team4.sportscenter.modules.auth.dtos.request.LoginRequest;
import com.team4.sportscenter.modules.auth.dtos.request.OtpRequest;
import com.team4.sportscenter.modules.auth.dtos.request.RegisterRequest;
import com.team4.sportscenter.modules.auth.dtos.request.ResetPasswordRequest;
import com.team4.sportscenter.modules.auth.dtos.response.LoginResponse;
import com.team4.sportscenter.modules.auth.dtos.response.RegisterResponse;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.auth.services.UserService;
import com.team4.sportscenter.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("System error: User not found"));

        String jwtToken = jwtService.generateToken(user);

        return ResponseEntity.ok(LoginResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName())
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> loginWithGoogle(@RequestBody com.team4.sportscenter.modules.auth.dtos.request.GoogleLoginRequest request) {
        return ResponseEntity.ok(userService.loginWithGoogle(request));
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerMember(@RequestBody RegisterRequest request) {
        RegisterResponse response = userService.registerMember(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(
            @RequestBody(required = false) OtpRequest request,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String otp) {
        String targetEmail = (request != null && request.getEmail() != null) ? request.getEmail() : email;
        String targetOtp = (request != null && request.getOtp() != null) ? request.getOtp() : otp;

        userService.verifyOtp(targetEmail, targetOtp);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully!"));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<Map<String, String>> sendForgotPasswordOtp(
            @RequestBody(required = false) OtpRequest request,
            @RequestParam(required = false) String email) {
        String targetEmail = (request != null && request.getEmail() != null) ? request.getEmail() : email;

        userService.sendForgotPasswordOtp(targetEmail);
        return ResponseEntity.ok(Map.of("message", "OTP sent to your email!"));
    }

    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<Map<String, String>> verifyForgotPasswordOtp(
            @RequestBody(required = false) OtpRequest request,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String otp) {
        String targetEmail = (request != null && request.getEmail() != null) ? request.getEmail() : email;
        String targetOtp = (request != null && request.getOtp() != null) ? request.getOtp() : otp;

        userService.verifyForgotPasswordOtp(targetEmail, targetOtp);
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully!"));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody(required = false) ResetPasswordRequest request,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String otp,
            @RequestParam(required = false) String newPassword) {
        String targetEmail = (request != null && request.getEmail() != null) ? request.getEmail() : email;
        String targetOtp = (request != null && request.getOtp() != null) ? request.getOtp() : otp;
        String targetNewPassword = (request != null && request.getNewPassword() != null) ? request.getNewPassword() : newPassword;

        userService.resetPassword(targetEmail, targetOtp, targetNewPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully!"));
    }
}
