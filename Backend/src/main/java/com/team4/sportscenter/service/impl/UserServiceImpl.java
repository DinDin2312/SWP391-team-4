package com.team4.sportscenter.service.impl;

import com.team4.sportscenter.dto.request.RegisterRequest;
import com.team4.sportscenter.dto.response.RegisterResponse;
import com.team4.sportscenter.model.Role;
import com.team4.sportscenter.model.User;
import com.team4.sportscenter.repository.RoleRepository;
import com.team4.sportscenter.repository.UserRepository;
import com.team4.sportscenter.service.EmailService;
import com.team4.sportscenter.service.UserService;
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

    // Bộ nhớ RAM lưu trữ tạm mã OTP (Email -> OTP)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @Override
    public RegisterResponse registerMember(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
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
                .status("PENDING") // Chuyển thành PENDING chờ xác thực
                .build();

        userRepository.save(newUser);

        // Sinh mã OTP 6 số ngẫu nhiên
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        // Lưu vào RAM
        otpStorage.put(request.getEmail(), otpCode);
        
        // Bắn email
        emailService.sendOtpEmail(request.getEmail(), otpCode, request.getFullName());

        return RegisterResponse.builder()
                .message("Đăng ký thành công! Vui lòng kiểm tra email để nhận mã OTP.")
                .email(newUser.getEmail())
                .build();
    }

    @Override
    public void verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn!");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này!"));
                
        user.setStatus("ACTIVE");
        userRepository.save(user);

        // Xóa OTP khỏi RAM sau khi xác thực thành công
        otpStorage.remove(email);
    }
}
