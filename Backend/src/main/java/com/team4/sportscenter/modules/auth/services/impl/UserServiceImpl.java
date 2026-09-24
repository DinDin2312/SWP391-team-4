package com.team4.sportscenter.modules.auth.services.impl;

import com.team4.sportscenter.modules.auth.dtos.request.RegisterRequest;
import com.team4.sportscenter.modules.auth.dtos.response.RegisterResponse;
import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.RoleRepository;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.auth.services.EmailService;
import com.team4.sportscenter.modules.auth.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final com.team4.sportscenter.security.jwt.JwtService jwtService;

    // RAM storage for OTP (Email -> OTP)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @Override
    public RegisterResponse registerMember(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        Role memberRole = roleRepository.findById(4).orElseGet(() -> {
            Role newRole = new Role();
            newRole.setRoleId(4);
            newRole.setRoleName("Member");
            return roleRepository.save(newRole);
        });

        User newUser = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword())) 
                .role(memberRole)
                .status("PENDING")
                .build();

        userRepository.save(newUser);

        // Generate 6-digit random OTP
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        // Save to RAM
        otpStorage.put(request.getEmail(), otpCode);
        
        // Send email
        emailService.sendOtpEmail(request.getEmail(), otpCode, request.getFullName());

        return RegisterResponse.builder()
                .message("Registration successful! Please check your email for the OTP code.")
                .email(newUser.getEmail())
                .build();
    }

    @Override
    public void verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP code!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found with this email!"));
                
        user.setStatus("ACTIVE");
        userRepository.save(user);

        // Remove OTP from RAM after successful verification
        otpStorage.remove(email);
    }

    @Override
    public void sendForgotPasswordOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found with this email!"));

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email + "_FORGOT", otpCode);
        
        emailService.sendForgotPasswordEmail(email, otpCode, user.getFullName());
    }

    @Override
    public void verifyForgotPasswordOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email + "_FORGOT");
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP code!");
        }
    }

    @Override
    public void resetPassword(String email, String otp, String newPassword) {
        // Double check OTP before resetting password for security
        String storedOtp = otpStorage.get(email + "_FORGOT");
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP code!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found with this email!"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove OTP after reset
        otpStorage.remove(email + "_FORGOT");
    }

    @Override
    public com.team4.sportscenter.modules.auth.dtos.response.LoginResponse loginWithGoogle(com.team4.sportscenter.modules.auth.dtos.request.GoogleLoginRequest request) {
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + request.getToken();
            Map<String, Object> googleUser = restTemplate.getForObject(url, Map.class);

            if (googleUser == null || !googleUser.containsKey("email")) {
                throw new RuntimeException("Invalid Google token!");
            }

            String email = (String) googleUser.get("email");
            String fullName = (String) googleUser.get("name");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                Role memberRole = roleRepository.findById(4).orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleId(4);
                    newRole.setRoleName("Member");
                    return roleRepository.save(newRole);
                });

                User newUser = User.builder()
                        .fullName(fullName)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                        .role(memberRole)
                        .status("ACTIVE")
                        .build();
                return userRepository.save(newUser);
            });

            String jwtToken = jwtService.generateToken(user);

            return com.team4.sportscenter.modules.auth.dtos.response.LoginResponse.builder()
                    .token(jwtToken)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().getRoleName())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Google authentication error: " + e.getMessage());
        }
    }
}
