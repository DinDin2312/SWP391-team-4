package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class BookingCleanupTask {
    private final BookingRepository bookingRepository;

    // Runs every 1 minute (60000 ms)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredBookings() {
        // Cancel PENDING bookings that have existed for more than 15 minutes
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(15);
        int cancelledCount = bookingRepository.cancelExpiredPendingBookings(cutoffTime);
        if (cancelledCount > 0) {
            System.out.println("[CRON JOB] Auto-cancelled " + cancelledCount + " PENDING bookings (expired > 15 min). Slots freed.");
        }
    }
}
