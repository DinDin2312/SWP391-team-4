package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceAutoClosureTask {

    private final BookingRepository bookingRepository;

    /**
     * Sweep completed class sessions every 15 minutes (900000 ms) and transition
     * any lingering NOT_YET / un-marked bookings into ABSENT.
     * Uses a 1-hour grace buffer after session end time so coaches who wrap up
     * the class have immediate time to finish marking attendance.
     */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void autoCloseUnmarkedAttendances() {
        LocalDateTime now = LocalDateTime.now();
        // 1-hour buffer after session ends before auto-closing to ABSENT
        LocalDateTime cutoff = now.minusHours(1);

        List<Booking> unmarkedBookings = bookingRepository.findUnmarkedBookingsForCompletedSchedules(cutoff);

        if (!unmarkedBookings.isEmpty()) {
            for (Booking booking : unmarkedBookings) {
                booking.setAttendanceStatus("ABSENT");
                bookingRepository.save(booking);
            }
            log.info("[ATTENDANCE-CRON] Auto-marked {} unmarked booking(s) as ABSENT for past completed schedules.", unmarkedBookings.size());
        }
    }
}
