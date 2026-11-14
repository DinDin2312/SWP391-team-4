package com.team4.sportscenter;

import com.team4.sportscenter.modules.support.services.impl.SupportRequestServiceImpl;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ClassTransferWindowTests {

    @Test
    void allowsTransferAtLeast24HoursBeforeFirstSession() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 14, 19, 0);

        assertNull(SupportRequestServiceImpl.validateClassTransferWindow(now.plusHours(25), false, now, false));
        assertNull(SupportRequestServiceImpl.validateClassTransferWindow(now.plusHours(24), false, now, false));
        assertNull(SupportRequestServiceImpl.validateClassTransferWindow(now.plusHours(24), false, now, true));
    }

    @Test
    void blocksTransferWithin24HoursBeforeFirstSession() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 14, 19, 0);
        LocalDateTime within24h = now.plusHours(23).plusMinutes(59);

        String sourceErr = SupportRequestServiceImpl.validateClassTransferWindow(within24h, false, now, false);
        String targetErr = SupportRequestServiceImpl.validateClassTransferWindow(within24h, false, now, true);

        assertNotNull(sourceErr);
        assertTrue(sourceErr.contains("24 giờ"));
        assertNotNull(targetErr);
        assertTrue(targetErr.contains("24 giờ"));
    }

    @Test
    void blocksTransferWhenCourseAlreadyStartedOrPresent() {
        LocalDateTime now = LocalDateTime.of(2026, 11, 14, 19, 0);

        String pastErr = SupportRequestServiceImpl.validateClassTransferWindow(now.minusHours(1), false, now, false);
        String presentErr = SupportRequestServiceImpl.validateClassTransferWindow(now.plusDays(3), true, now, false);
        String targetPastErr = SupportRequestServiceImpl.validateClassTransferWindow(now.minusMinutes(10), false, now, true);

        assertNotNull(pastErr);
        assertTrue(pastErr.contains("đã bắt đầu"));
        assertNotNull(presentErr);
        assertNotNull(targetPastErr);
    }
}
