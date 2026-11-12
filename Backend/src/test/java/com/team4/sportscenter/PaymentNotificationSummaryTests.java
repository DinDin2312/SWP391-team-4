package com.team4.sportscenter;

import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.payment.services.impl.PaymentServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PaymentNotificationSummaryTests {

    private static Booking bookingForClass(String className) {
        GymClass gc = new GymClass();
        gc.setClassName(className);
        Schedule s = new Schedule();
        s.setGymClass(gc);
        Booking b = new Booking();
        b.setSchedule(s);
        return b;
    }

    @Test
    void summarizeBookedClasses_countsEachClassSeparatelyWithoutDroppingClasses() {
        List<Booking> booked = List.of(
                bookingForClass("[SWIM-202] Bơi Bướm Nâng Cao"),
                bookingForClass("[SWIM-202] Bơi Bướm Nâng Cao"),
                bookingForClass("[SWIM-203] Bơi Bướm & Thể Lực"),
                bookingForClass("[SWIM-201] Bơi Thủy Liệu"),
                bookingForClass("[SWIM-204] Bơi Sải Tốc Độ"),
                bookingForClass("[SWIM-204] Bơi Sải Tốc Độ"),
                bookingForClass("[SWIM-204] Bơi Sải Tốc Độ")
        );

        Map<String, Integer> counts = PaymentServiceImpl.summarizeBookedClasses(booked);
        assertEquals(4, counts.size());
        assertEquals(2, counts.get("[SWIM-202] Bơi Bướm Nâng Cao"));
        assertEquals(1, counts.get("[SWIM-203] Bơi Bướm & Thể Lực"));
        assertEquals(1, counts.get("[SWIM-201] Bơi Thủy Liệu"));
        assertEquals(3, counts.get("[SWIM-204] Bơi Sải Tốc Độ"));

        List<String> items = PaymentServiceImpl.buildPaidItemSummaries(List.<UserMembership>of(), booked);
        assertEquals(4, items.size());
        assertTrue(items.get(0).contains("[SWIM-202] Bơi Bướm Nâng Cao (2 buổi)"));
        assertTrue(items.get(3).contains("[SWIM-204] Bơi Sải Tốc Độ (3 buổi)"));
    }
}
