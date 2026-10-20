package com.team4.sportscenter;

import com.team4.sportscenter.modules.receptionist.dtos.response.ClassRenewalSuggestionResponse;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ClassRenewalIntegrationTests {

    @Autowired
    private ReceptionistMemberService receptionistMemberService;

    @Autowired
    private JdbcTemplate jdbc;

    private final List<Integer> createdUserIds = new ArrayList<>();
    private final List<Integer> createdBookingIds = new ArrayList<>();
    private final List<Integer> createdScheduleIds = new ArrayList<>();
    private final List<Integer> createdClassIds = new ArrayList<>();

    @AfterEach
    void cleanup() {
        for (Integer bId : createdBookingIds) {
            jdbc.update("DELETE FROM BOOKINGS WHERE booking_id=?", bId);
        }
        for (Integer sId : createdScheduleIds) {
            jdbc.update("DELETE FROM SCHEDULES WHERE schedule_id=?", sId);
        }
        for (Integer cId : createdClassIds) {
            jdbc.update("DELETE FROM CLASSES WHERE class_id=?", cId);
        }
        for (Integer uId : createdUserIds) {
            jdbc.update("DELETE FROM USERS WHERE user_id=?", uId);
        }
    }

    private int insert(String sql, Object... params) {
        GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < params.length; i++) {
                ps.setObject(i + 1, params[i]);
            }
            return ps;
        }, keyHolder);
        return keyHolder.getKey().intValue();
    }

    @Test
    void testSmartRenewalRecommendsFutureClassWithDifferentCoachAndMatchingSlot() {
        int memberId = insert("INSERT INTO USERS(role_id, full_name, email, password_hash, status) VALUES (4, 'Test Member Yoga', ?, '123456', 'ACTIVE')",
                "test-yoga-" + UUID.randomUUID() + "@example.test");
        createdUserIds.add(memberId);

        // Current class: Yoga (subject_id=2), Coach Trần Mai Anh (coach_id=4), Mon-Wed-Fri 07:00
        LocalDate baseDate = LocalDate.now().minusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        int curClass = insert("INSERT INTO CLASSES(subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES (2,4,2,'Yoga Vinyasa Năng Lượng Buổi Sáng - Đợt 1',600000,20,'ACTIVE')");
        createdClassIds.add(curClass);

        int curSched = insert("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,?)",
                curClass, baseDate.atTime(7, 0), baseDate.atTime(8, 30), "SCHEDULED");
        createdScheduleIds.add(curSched);

        int curBooking = insert("INSERT INTO BOOKINGS(user_id,schedule_id,status,attendance_status,booking_time) VALUES (?,?,?,?,NOW())",
                memberId, curSched, "CONFIRMED", "PRESENT");
        createdBookingIds.add(curBooking);

        // Future candidate class: Yoga (subject_id=2), DIFFERENT COACH: HLV Phạm Minh Hoàng (coach_id=5), Mon-Wed-Fri 07:00
        LocalDate futureDate = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        int futureClass = insert("INSERT INTO CLASSES(subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES (2,5,2,'Yoga Vinyasa Nâng Cao & Tái Tạo Khí Lực - Đợt 2',650000,20,'ACTIVE')");
        createdClassIds.add(futureClass);

        int futureSched = insert("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,?)",
                futureClass, futureDate.atTime(7, 0), futureDate.atTime(8, 30), "SCHEDULED");
        createdScheduleIds.add(futureSched);

        ClassRenewalSuggestionResponse response = receptionistMemberService.suggestNextClassRenewal(memberId, curBooking);

        assertNotNull(response, "Response should not be null");
        assertEquals(futureClass, response.getClassId(), "Should match future candidate class with matching slot");
        assertEquals("Yoga Vinyasa Nâng Cao & Tái Tạo Khí Lực - Đợt 2", response.getClassName());
        assertEquals("HLV Phạm Minh Hoàng", response.getCoachName(), "Different coach should be allowed and recommended");
        assertTrue(response.getAvailableSlots() > 0, "Should have available slots");
        assertNotNull(response.getStartTime(), "Start time of first session should be present");
        assertEquals(7, response.getStartTime().getHour(), "Slot time should match 07:00 AM");
    }

    @Test
    void testSmartRenewalForGymMember() {
        int memberId = insert("INSERT INTO USERS(role_id, full_name, email, password_hash, status) VALUES (4, 'Test Member Gym', ?, '123456', 'ACTIVE')",
                "test-gym-" + UUID.randomUUID() + "@example.test");
        createdUserIds.add(memberId);

        // Current class: Gym (subject_id=1), Coach Nguyễn Văn Tuấn (coach_id=3), Mon-Wed-Fri 17:30
        LocalDate baseDate = LocalDate.now().minusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        int curClass = insert("INSERT INTO CLASSES(subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES (1,3,1,'Gym Tăng Cơ Hypertrophy Toàn Thân - Đợt 1',800000,10,'ACTIVE')");
        createdClassIds.add(curClass);

        int curSched = insert("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,?)",
                curClass, baseDate.atTime(17, 30), baseDate.atTime(19, 0), "SCHEDULED");
        createdScheduleIds.add(curSched);

        int curBooking = insert("INSERT INTO BOOKINGS(user_id,schedule_id,status,attendance_status,booking_time) VALUES (?,?,?,?,NOW())",
                memberId, curSched, "CONFIRMED", "PRESENT");
        createdBookingIds.add(curBooking);

        // Future candidate class: Gym (subject_id=1), DIFFERENT COACH: HLV Phạm Minh Hoàng (coach_id=5), Mon-Wed-Fri 17:30
        LocalDate futureDate = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
        int futureClass = insert("INSERT INTO CLASSES(subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES (1,5,1,'Gym Tăng Cơ Khối Lượng Cao & Thể Hình Chuẩn',850000,10,'ACTIVE')");
        createdClassIds.add(futureClass);

        int futureSched = insert("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,?)",
                futureClass, futureDate.atTime(17, 30), futureDate.atTime(19, 0), "SCHEDULED");
        createdScheduleIds.add(futureSched);

        ClassRenewalSuggestionResponse response = receptionistMemberService.suggestNextClassRenewal(memberId, curBooking);

        assertNotNull(response, "Response should not be null");
        assertEquals(futureClass, response.getClassId(), "Should match future candidate class with matching slot");
        assertEquals("Gym Tăng Cơ Khối Lượng Cao & Thể Hình Chuẩn", response.getClassName());
        assertEquals("HLV Phạm Minh Hoàng", response.getCoachName(), "Different coach (Hoàng instead of Tuấn) should be allowed");
        assertEquals(17, response.getStartTime().getHour(), "Slot time hour should match 17:30");
        assertEquals(30, response.getStartTime().getMinute(), "Slot time minute should match 17:30");
    }
}
