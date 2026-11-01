package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.member.entities.MemberHealthProfile;
import com.team4.sportscenter.modules.member.health.*;
import com.team4.sportscenter.modules.member.repositories.MemberHealthProfileRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberHealthServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private MemberHealthProfileRepository healthProfileRepository;

    @InjectMocks
    private MemberHealthService healthService;

    @Test
    @DisplayName("ageOn calculates exact age based on birth date and reference date")
    void testAgeOn() {
        assertEquals(25, MemberHealthService.ageOn(LocalDate.of(2000, 11, 2), LocalDate.of(2026, 11, 1)));
        assertEquals(26, MemberHealthService.ageOn(LocalDate.of(2000, 11, 1), LocalDate.of(2026, 11, 1)));
    }

    @Test
    @DisplayName("save persists valid profile and returns response with clearanceRecommended=true if PAR-Q has any true")
    void testSaveValidProfile() {
        User user = User.builder().userId(10).email("member@example.com").build();
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(user));
        when(healthProfileRepository.findById(10)).thenReturn(Optional.empty());

        MemberHealthProfileRequest request = MemberHealthProfileRequest.builder()
                .gender("FEMALE")
                .dateOfBirth("1974-05-10")
                .parq(List.of(false, false, false, false, false, true, false))
                .conditions(List.of("KNEE"))
                .notes("  Đau gối khi đi bộ nhiều  ")
                .consent(true)
                .build();

        MemberHealthProfileResponse response = healthService.save("member@example.com", request);

        assertTrue(response.isCompleted());
        assertTrue(response.isClearanceRecommended());
        assertEquals("FEMALE", response.getGender());
        assertEquals("1974-05-10", response.getDateOfBirth());
        assertEquals(List.of("KNEE"), response.getConditions());
        assertEquals("Đau gối khi đi bộ nhiều", response.getNotes());

        ArgumentCaptor<MemberHealthProfile> captor = ArgumentCaptor.forClass(MemberHealthProfile.class);
        verify(healthProfileRepository).save(captor.capture());
        MemberHealthProfile saved = captor.getValue();
        assertEquals(10, saved.getUserId());
        assertEquals("0000010", saved.getParqAnswers());
        assertEquals("KNEE", saved.getConditions());
        assertEquals("Đau gối khi đi bộ nhiều", saved.getNotes());
        assertNotNull(saved.getConsentAt());
    }

    @Test
    @DisplayName("save throws 400 when consent is not given")
    void testSaveWithoutConsentThrows() {
        MemberHealthProfileRequest request = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth("1995-01-01")
                .parq(List.of(false, false, false, false, false, false, false))
                .consent(false)
                .build();

        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", request));
        verify(healthProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("save throws 400 when gender is invalid")
    void testSaveInvalidGenderThrows() {
        MemberHealthProfileRequest request = MemberHealthProfileRequest.builder()
                .gender("INVALID_GENDER")
                .dateOfBirth("1995-01-01")
                .parq(List.of(false, false, false, false, false, false, false))
                .consent(true)
                .build();

        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", request));
    }

    @Test
    @DisplayName("save throws 400 when dateOfBirth is in future or age < 12 or format is invalid")
    void testSaveInvalidDobThrows() {
        MemberHealthProfileRequest reqFuture = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth(LocalDate.now().plusDays(1).toString())
                .parq(List.of(false, false, false, false, false, false, false))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqFuture));

        MemberHealthProfileRequest reqTooYoung = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth(LocalDate.now().minusYears(10).toString())
                .parq(List.of(false, false, false, false, false, false, false))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqTooYoung));

        MemberHealthProfileRequest reqBadFormat = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth("10/05/1990")
                .parq(List.of(false, false, false, false, false, false, false))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqBadFormat));
    }

    @Test
    @DisplayName("save throws 400 when parq size is not 7 or contains null")
    void testSaveInvalidParqThrows() {
        MemberHealthProfileRequest reqShort = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth("1990-01-01")
                .parq(List.of(false, false, false))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqShort));

        List<Boolean> withNull = new ArrayList<>(List.of(false, false, false, false, false, false));
        withNull.add(null);
        MemberHealthProfileRequest reqNull = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth("1990-01-01")
                .parq(withNull)
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqNull));
    }

    @Test
    @DisplayName("save throws 400 when male user selects PREGNANCY or condition is invalid")
    void testSaveMalePregnancyThrows() {
        MemberHealthProfileRequest reqPreg = MemberHealthProfileRequest.builder()
                .gender("MALE")
                .dateOfBirth("1990-01-01")
                .parq(List.of(false, false, false, false, false, false, false))
                .conditions(List.of("PREGNANCY"))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqPreg));

        MemberHealthProfileRequest reqUnknown = MemberHealthProfileRequest.builder()
                .gender("FEMALE")
                .dateOfBirth("1990-01-01")
                .parq(List.of(false, false, false, false, false, false, false))
                .conditions(List.of("FLU"))
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqUnknown));
    }

    @Test
    @DisplayName("save throws 400 when notes exceed 500 chars")
    void testSaveNotesTooLongThrows() {
        String longNotes = "a".repeat(501);
        MemberHealthProfileRequest reqLong = MemberHealthProfileRequest.builder()
                .gender("FEMALE")
                .dateOfBirth("1990-01-01")
                .parq(List.of(false, false, false, false, false, false, false))
                .notes(longNotes)
                .consent(true)
                .build();
        assertThrows(ResponseStatusException.class, () -> healthService.save("test@example.com", reqLong));
    }

    @Test
    @DisplayName("withdraw removes health profile from repository")
    void testWithdraw() {
        User user = User.builder().userId(15).email("test@example.com").build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        healthService.withdraw("test@example.com");
        verify(healthProfileRepository).deleteById(15);
    }

    @Test
    @DisplayName("summaryFor returns empty when user is null or has no profile/gender/dob")
    void testSummaryForEmpty() {
        MemberHealthSummary empty1 = healthService.summaryFor(null);
        assertEquals(MemberHealthSummary.empty(), empty1);

        User userNoProfile = User.builder().userId(20).build();
        when(healthProfileRepository.findById(20)).thenReturn(Optional.empty());

        MemberHealthSummary summary = healthService.summaryFor(userNoProfile);
        assertFalse(summary.completed());
        assertFalse(summary.clearanceRecommended());
        assertTrue(summary.conditions().isEmpty());
    }

    @Test
    @DisplayName("summaryFor parses conditions and calculates clearance flag and age")
    void testSummaryForCompleted() {
        User user = User.builder()
                .userId(25)
                .gender("MALE")
                .dateOfBirth(LocalDate.now().minusYears(40))
                .build();

        MemberHealthProfile profile = MemberHealthProfile.builder()
                .userId(25)
                .parqAnswers("1000000")
                .conditions("KNEE,LOWER_BACK")
                .notes("Đau lưng dưới")
                .consentAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(healthProfileRepository.findById(25)).thenReturn(Optional.of(profile));

        MemberHealthSummary summary = healthService.summaryFor(user);
        assertTrue(summary.completed());
        assertTrue(summary.clearanceRecommended());
        assertEquals("MALE", summary.gender());
        assertEquals(40, summary.age());
        assertEquals(List.of("KNEE", "LOWER_BACK"), summary.conditions());
        assertEquals("Đau lưng dưới", summary.notes());
    }
}
