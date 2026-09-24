package com.team4.sportscenter.modules.auth.controllers;

import com.team4.sportscenter.modules.auth.dtos.request.RegisterRequest;
import com.team4.sportscenter.modules.auth.dtos.response.RegisterResponse;
import com.team4.sportscenter.modules.auth.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.team4.sportscenter.modules.auth.dtos.request.LoginRequest;
import com.team4.sportscenter.modules.auth.dtos.response.LoginResponse;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.security.jwt.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

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
    public ResponseEntity<String> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        userService.verifyOtp(email, otp);
        return ResponseEntity.ok("OTP verified successfully!");
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<String> sendForgotPasswordOtp(@RequestParam String email) {
        userService.sendForgotPasswordOtp(email);
        return ResponseEntity.ok("OTP sent to your email!");
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<String> resetPassword(@RequestParam String email, @RequestParam String otp, @RequestParam String newPassword) {
        userService.resetPassword(email, otp, newPassword);
        return ResponseEntity.ok("Password has been reset successfully!");
    }
}
