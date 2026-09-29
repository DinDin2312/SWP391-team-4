package com.team4.sportscenter.modules.notification.controllers;

import com.team4.sportscenter.modules.notification.dtos.NotificationResponse;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getMyNotifications(email));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Integer id, Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAsRead(id, email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Marked as read");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAllAsRead(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "All marked as read");
        return ResponseEntity.ok(response);
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer id, Authentication authentication) {
        String email = authentication.getName();
        notificationService.deleteNotification(id, email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Deleted successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<?> deleteAllNotifications(Authentication authentication) {
        String email = authentication.getName();
        notificationService.deleteAllNotifications(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Deleted all successfully");
        return ResponseEntity.ok(response);
    }
}
