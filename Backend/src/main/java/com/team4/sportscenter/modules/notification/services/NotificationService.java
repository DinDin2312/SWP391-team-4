package com.team4.sportscenter.modules.notification.services;

import com.team4.sportscenter.modules.notification.dtos.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(String email);
    void markAsRead(Integer id, String email);
    void markAllAsRead(String email);
    void createNotification(String email, String title, String message, String type);
    void deleteNotification(Integer id, String email);
    void deleteAllNotifications(String email);
}
