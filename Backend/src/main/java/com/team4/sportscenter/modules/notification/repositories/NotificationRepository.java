package com.team4.sportscenter.modules.notification.repositories;

import com.team4.sportscenter.modules.notification.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUser_EmailOrderByCreatedAtDesc(String email);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.email = :email")
    void markAllAsReadByEmail(String email);
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.user.email = :email")
    void markAsReadByIdAndEmail(Integer id, String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.id = :id AND n.user.email = :email")
    void deleteByIdAndEmail(Integer id, String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.user.email = :email")
    void deleteAllByEmail(String email);
}
