package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.services.ScheduleRescheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RescheduleDeadlineTask {

    private final ScheduleRescheduleService scheduleRescheduleService;

    /**
     * Sweep approved reschedule requests every 5 minutes (300,000 ms) to process expired member confirmation deadlines.
     * Members who haven't responded by the deadline are automatically refunded credit.
     * If total accepted members < minimum required quorum, the make-up session is cancelled and all members refunded.
     */
    @Scheduled(fixedRate = 300000)
    public void sweepExpiredRescheduleDeadlines() {
        try {
            scheduleRescheduleService.processExpiredRescheduleDeadlines();
        } catch (Exception e) {
            log.error("[RESCHEDULE-CRON] Error during sweepExpiredRescheduleDeadlines: {}", e.getMessage(), e);
        }
    }
}
