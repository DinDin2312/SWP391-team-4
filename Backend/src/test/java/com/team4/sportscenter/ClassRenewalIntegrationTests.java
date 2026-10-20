package com.team4.sportscenter;

import com.team4.sportscenter.modules.receptionist.dtos.response.ClassRenewalSuggestionResponse;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ClassRenewalIntegrationTests {

    @Autowired
    private ReceptionistMemberService receptionistMemberService;

    @Test
    void testSmartRenewalRecommendsFutureClassWithDifferentCoachAndMatchingSlot() {
        // Member 6 (Trần Bùi Thái) is currently booked in Class 1 (Yoga Vinyasa Năng Lượng Buổi Sáng, T2-4-6, 07:00, Coach Trần Mai Anh)
        // Booking ID: 10348
        ClassRenewalSuggestionResponse response = receptionistMemberService.suggestNextClassRenewal(6, 10348);

        if (response.getOptions() != null) {
            response.getOptions().forEach(o -> {
                System.out.println("DEBUG_OPTION: id=" + o.getClassId() + ", name=" + o.getClassName() + ", isBestMatch=" + o.isBestMatch() + ", alreadyEnrolled=" + o.isAlreadyEnrolled() + ", hasConflict=" + o.isHasConflict() + ", start=" + o.getStartTime());
            });
        }

        assertNotNull(response, "Response should not be null");
        assertEquals(101, response.getClassId(), "Should match Class 101 which is in the future on T2-4-6 at 07:00");
        assertEquals("Yoga Vinyasa Nâng Cao & Tái Tạo Khí Lực", response.getClassName());
        assertEquals("HLV Phạm Minh Hoàng", response.getCoachName(), "Different coach should be allowed and recommended");
        assertTrue(response.getAvailableSlots() > 0, "Should have available slots");
        assertNotNull(response.getStartTime(), "Start time of first session should be present");
        assertEquals(7, response.getStartTime().getHour(), "Slot time should match 07:00 AM");
    }

    @Test
    void testSmartRenewalForGymMember21() {
        // Member 21 (Sinh Xuân) has booking 10336 in Class 3 (Gym Tăng Cơ Hypertrophy Toàn Thân, T2-4-6, 17:30, Coach Nguyễn Văn Tuấn)
        ClassRenewalSuggestionResponse response = receptionistMemberService.suggestNextClassRenewal(21, 10336);

        assertNotNull(response, "Response should not be null");
        assertEquals(103, response.getClassId(), "Should match Class 103 which is in the future on T2-4-6 at 17:30");
        assertEquals("Gym Tăng Cơ Khối Lượng Cao & Thể Hình Chuẩn", response.getClassName());
        assertEquals("HLV Phạm Minh Hoàng", response.getCoachName(), "Different coach (Hoàng instead of Tuấn) should be allowed");
        assertEquals(17, response.getStartTime().getHour(), "Slot time hour should match 17:30");
        assertEquals(30, response.getStartTime().getMinute(), "Slot time minute should match 17:30");
    }
}
