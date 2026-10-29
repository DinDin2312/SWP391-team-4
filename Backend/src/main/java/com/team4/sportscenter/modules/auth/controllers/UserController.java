package com.team4.sportscenter.modules.auth.controllers;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.manager.services.AvatarStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.team4.sportscenter.modules.notification.services.NotificationService;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final com.team4.sportscenter.modules.auth.services.UserService userService;
    private final NotificationService notificationService;
    private final AvatarStorageService avatarStorageService;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", user.getUserId());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("phone", user.getPhone());
        profile.put("bio", user.getBio());
        profile.put("avatarPath", user.getAvatarPath());
        profile.put("avatarUrl", user.getAvatarPath() != null && !user.getAvatarPath().isBlank() ? "/api/avatars/" + user.getAvatarPath() : null);
        int points = user.getLoyaltyPoints() == null ? 0 : user.getLoyaltyPoints();
        profile.put("loyaltyPoints", points);
        String memberTier = "MEMBER";
        if (points >= 3000) memberTier = "PLATINUM";
        else if (points >= 1500) memberTier = "GOLD";
        else if (points >= 500) memberTier = "SILVER";
        profile.put("memberTier", memberTier);
        profile.put("hasSetPassword", !Boolean.TRUE.equals(user.getForcePasswordChange()));
        
        return ResponseEntity.ok(profile);
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadAvatar(Authentication authentication, @RequestPart("avatar") MultipartFile avatar) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String previousAvatar = user.getAvatarPath();
        String storedAvatar = avatarStorageService.store(avatar);
        user.setAvatarPath(storedAvatar);
        userRepository.save(user);
        if (previousAvatar != null && !previousAvatar.isBlank()) {
            avatarStorageService.delete(previousAvatar);
        }
        return ResponseEntity.ok(Map.of(
            "avatarPath", storedAvatar,
            "avatarUrl", "/api/avatars/" + storedAvatar,
            "message", "Avatar updated successfully"
        ));
    }

    @DeleteMapping("/avatar")
    public ResponseEntity<?> deleteAvatar(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String previousAvatar = user.getAvatarPath();
        user.setAvatarPath(null);
        userRepository.save(user);
        if (previousAvatar != null && !previousAvatar.isBlank()) {
            avatarStorageService.delete(previousAvatar);
        }
        return ResponseEntity.ok(Map.of("message", "Avatar removed successfully"));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody Map<String, String> payload) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (payload.containsKey("fullName")) user.setFullName(payload.get("fullName"));
        if (payload.containsKey("phone")) user.setPhone(payload.get("phone"));
        if (payload.containsKey("bio")) user.setBio(payload.get("bio"));
        
        userRepository.save(user);
        
        notificationService.createNotification(
            email,
            "Profile Updated",
            "Your profile information has been successfully updated.",
            "SYSTEM"
        );
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Profile updated successfully!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/email-change/send-otp")
    public ResponseEntity<?> sendEmailChangeOtp(Authentication authentication, @RequestBody Map<String, String> payload) {
        String currentEmail = authentication.getName();
        String newEmail = payload.get("newEmail");
        if (newEmail == null || newEmail.isBlank()) {
            throw new RuntimeException("New email is required");
        }
        userService.sendEmailUpdateOtp(currentEmail, newEmail);
        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent to new email address");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/email-change/verify")
    public ResponseEntity<?> verifyEmailChangeOtp(Authentication authentication, @RequestBody Map<String, String> payload) {
        String currentEmail = authentication.getName();
        String newEmail = payload.get("newEmail");
        String otp = payload.get("otp");
        if (newEmail == null || otp == null) {
            throw new RuntimeException("New email and OTP are required");
        }
        userService.verifyAndChangeEmail(currentEmail, newEmail, otp);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Email updated successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping({"/change-password", "/password"})
    public ResponseEntity<?> changePassword(Authentication authentication, @RequestBody Map<String, String> payload) {
        String email = authentication.getName();
        String currentPassword = payload.get("currentPassword");
        String newPassword = payload.get("newPassword");
        userService.changePassword(email, currentPassword, newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Mật khẩu đã được thay đổi thành công!");
        return ResponseEntity.ok(response);
    }
}
