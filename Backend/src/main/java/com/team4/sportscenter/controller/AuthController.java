package com.team4.sportscenter.controller;

import com.team4.sportscenter.dto.request.RegisterRequest;
import com.team4.sportscenter.dto.response.RegisterResponse;
import com.team4.sportscenter.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.team4.sportscenter.dto.request.LoginRequest;
import com.team4.sportscenter.dto.response.LoginResponse;
import com.team4.sportscenter.model.User;
import com.team4.sportscenter.repository.UserRepository;
import com.team4.sportscenter.security.JwtService;
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
                .orElseThrow(() -> new RuntimeException("Lỗi hệ thống: Không tìm thấy user"));

        String jwtToken = jwtService.generateToken(user);

        return ResponseEntity.ok(LoginResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName())
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> registerMember(@RequestBody RegisterRequest request) {
        RegisterResponse response = userService.registerMember(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody com.team4.sportscenter.dto.request.OtpRequest request) {
        userService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok().body(java.util.Map.of("message", "Xác thực OTP thành công!"));
    }
}
