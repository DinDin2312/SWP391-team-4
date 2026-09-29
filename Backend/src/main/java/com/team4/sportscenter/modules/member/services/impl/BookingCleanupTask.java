package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BookingCleanupTask {
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    // Runs every 5 minutes (300000 ms)
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        // Cancel PENDING bookings that have existed for more than 24 hours
        LocalDateTime cutoffTime = now.minusHours(24);
        
        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(cutoffTime, now);
        
        if (!expiredBookings.isEmpty()) {
            for (Booking booking : expiredBookings) {
                booking.setStatus("CANCELLED");
                bookingRepository.save(booking);
                
                String className = booking.getSchedule() != null && booking.getSchedule().getGymClass() != null 
                    ? booking.getSchedule().getGymClass().getClassName() : "Unknown Class";
                
                notificationService.createNotification(
                    booking.getUser().getEmail(),
                    "Booking Cancelled",
                    "Your pending booking for '" + className + "' was automatically cancelled because it was not paid within 24 hours or the class has already started.",
                    "BOOKING"
                );
            }
            System.out.println("[CRON JOB] Auto-cancelled " + expiredBookings.size() + " PENDING bookings. Notifications sent.");
        }
    }
}
