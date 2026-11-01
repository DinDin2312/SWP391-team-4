package com.team4.sportscenter;

import com.team4.sportscenter.modules.member.controllers.MemberHealthController;
import com.team4.sportscenter.modules.member.health.MemberHealthProfileRequest;
import com.team4.sportscenter.modules.member.health.MemberHealthProfileResponse;
import com.team4.sportscenter.modules.member.health.MemberHealthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberHealthControllerTests {

    @Mock
    private MemberHealthService healthService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private MemberHealthController controller;

    @BeforeEach
    void setUp() {
        lenient().when(authentication.getName()).thenReturn("member@test.com");
    }

    @Test
    @DisplayName("GET delegates to service.get with authentication email")
    void testGetHealthProfile() {
        MemberHealthProfileResponse expected = new MemberHealthProfileResponse(
                "FEMALE", "1990-05-10", 36,
                List.of(false, false, false, false, false, false, false),
                List.of("KNEE"), "Mild discomfort", false, true,
                LocalDateTime.now(), LocalDateTime.now()
        );
        when(healthService.get("member@test.com")).thenReturn(expected);

        ResponseEntity<MemberHealthProfileResponse> res = controller.get(authentication);

        assertEquals(200, res.getStatusCode().value());
        assertEquals(expected, res.getBody());
        verify(healthService).get("member@test.com");
    }

    @Test
    @DisplayName("PUT delegates to service.save with authentication email and body")
    void testSaveHealthProfile() {
        MemberHealthProfileRequest req = new MemberHealthProfileRequest();
        req.setGender("MALE");
        req.setDateOfBirth("1995-01-01");
        req.setParq(List.of(false, false, false, false, false, false, false));
        req.setConditions(List.of());
        req.setNotes("No conditions");
        req.setConsent(true);

        MemberHealthProfileResponse expected = new MemberHealthProfileResponse(
                "MALE", "1995-01-01", 31,
                req.getParq(), List.of(), "No conditions", false, true,
                LocalDateTime.now(), LocalDateTime.now()
        );
        when(healthService.save("member@test.com", req)).thenReturn(expected);

        ResponseEntity<MemberHealthProfileResponse> res = controller.save(authentication, req);

        assertEquals(200, res.getStatusCode().value());
        assertEquals(expected, res.getBody());
        verify(healthService).save("member@test.com", req);
    }

    @Test
    @DisplayName("DELETE calls service.withdraw and returns confirmation message")
    void testWithdrawHealthProfile() {
        ResponseEntity<Map<String, String>> res = controller.withdraw(authentication);

        assertEquals(200, res.getStatusCode().value());
        assertNotNull(res.getBody());
        assertEquals("Health data withdrawn", res.getBody().get("message"));
        verify(healthService).withdraw("member@test.com");
    }
}
