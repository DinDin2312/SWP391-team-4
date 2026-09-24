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

    // Chạy mỗi 1 phút (60000 ms)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredBookings() {
        // Hủy các booking PENDING đã tồn tại quá 15 phút
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(15);
        int cancelledCount = bookingRepository.cancelExpiredPendingBookings(cutoffTime);
        if (cancelledCount > 0) {
            System.out.println("[CRON JOB] Đã hủy tự động " + cancelledCount + " vé PENDING quá hạn (15 phút). Giải phóng chỗ trống!");
        }
    }
}
