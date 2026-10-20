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

        assertNotNull(response, "Response should not be null");
        assertNotNull(response.getOptions(), "Options list should not be null");
        assertTrue(response.getOptions().size() >= 5, "Should return multiple next-term classes for Yoga");

        // Options should include both Class 101 and Class 126 as Best Match for T2-4-6 at 07:00
        boolean hasClass101 = response.getOptions().stream().anyMatch(o -> o.getClassId().equals(101) && o.isBestMatch());
        boolean hasClass126 = response.getOptions().stream().anyMatch(o -> o.getClassId().equals(126) && o.isBestMatch());
        assertTrue(hasClass101, "Should offer Class 101 (Coach Hoàng) as best match");
        assertTrue(hasClass126, "Should offer Class 126 (Coach Mai Anh) as best match");

        assertTrue(response.getAvailableSlots() > 0, "Top recommendation should have available slots");
        assertNotNull(response.getStartTime(), "Start time of first session should be present");
        assertEquals(7, response.getStartTime().getHour(), "Slot time should match 07:00 AM");
    }

    @Test
    void testSmartRenewalForGymMember21() {
        // Member 21 (Sinh Xuân) has booking 10336 in Class 3 (Gym Tăng Cơ Hypertrophy Toàn Thân, T2-4-6, 17:30, Coach Nguyễn Văn Tuấn)
        ClassRenewalSuggestionResponse response = receptionistMemberService.suggestNextClassRenewal(21, 10336);

        assertNotNull(response, "Response should not be null");
        assertNotNull(response.getOptions(), "Options list should not be null");
        assertTrue(response.getOptions().size() >= 5, "Should return multiple next-term classes for Gym");

        // Options should include both Class 103 and Class 122 as Best Match for T2-4-6 at 17:30
        boolean hasClass103 = response.getOptions().stream().anyMatch(o -> o.getClassId().equals(103) && o.isBestMatch());
        boolean hasClass122 = response.getOptions().stream().anyMatch(o -> o.getClassId().equals(122) && o.isBestMatch());
        assertTrue(hasClass103, "Should offer Class 103 (Coach Hoàng) as best match");
        assertTrue(hasClass122, "Should offer Class 122 (Coach Tuấn) as best match");

        assertEquals(17, response.getStartTime().getHour(), "Slot time hour should match 17:30");
        assertEquals(30, response.getStartTime().getMinute(), "Slot time minute should match 17:30");
    }
}
