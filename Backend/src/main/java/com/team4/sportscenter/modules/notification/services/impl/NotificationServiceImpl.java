package com.team4.sportscenter.modules.notification.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.notification.dtos.NotificationResponse;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<NotificationResponse> getMyNotifications(String email) {
        List<Notification> notifications = notificationRepository.findByUser_EmailOrderByCreatedAtDesc(email);
        return notifications.stream().map(n -> NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Integer id, String email) {
        notificationRepository.markAsReadByIdAndEmail(id, email);
    }

    @Override
    public void markAllAsRead(String email) {
        notificationRepository.markAllAsReadByEmail(email);
    }

    @Override
    public void createNotification(String email, String title, String message, String type) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            Notification notification = Notification.builder()
                    .user(user)
                    .title(title)
                    .message(message)
                    .type(type)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);
        }
    }

    @Override
    public void deleteNotification(Integer id, String email) {
        notificationRepository.deleteByIdAndEmail(id, email);
    }

    @Override
    public void deleteAllNotifications(String email) {
        notificationRepository.deleteAllByEmail(email);
    }
}
