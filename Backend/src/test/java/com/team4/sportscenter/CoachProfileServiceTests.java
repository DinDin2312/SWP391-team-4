package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateCoachProfileRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachProfileResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.services.impl.CoachProfileServiceImpl;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Subject;
import com.team4.sportscenter.modules.member.repositories.SubjectRepository;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CoachProfileServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private CoachClassRepository coachClassRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CoachProfileServiceImpl coachProfileService;

    private User testCoach;
    private Subject gymSubject;
    private Subject yogaSubject;

    @BeforeEach
    void setUp() {
        gymSubject = Subject.builder()
                .subjectId(1)
                .subjectName("Gym")
                .description("Weight training")
                .build();

        yogaSubject = Subject.builder()
                .subjectId(2)
                .subjectName("Yoga")
                .description("Flexibility and breath")
                .build();

        List<Subject> specialties = new ArrayList<>();
        specialties.add(gymSubject);

        testCoach = User.builder()
                .userId(10)
                .email("coach@example.com")
                .fullName("Coach John")
                .phone("0987654321")
                .bio("10 years experience")
                .role(Role.builder().roleId(3).roleName("Coach").build())
                .specialties(specialties)
                .build();
    }

    @Test
    @DisplayName("Profile exposes only manager-assigned subjects and disables self assignment")
    void testGetCoachProfile() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        when(coachClassRepository.findActiveClassesByCoachAndSubject(10,1)).thenReturn(List.of());
        var response=coachProfileService.getCoachProfile("coach@example.com");
        assertEquals("Coach John",response.getFullName());
        assertEquals(1,response.getCurrentSubjectId());
        assertFalse(response.isCanChangeSubject());
        assertEquals(1,response.getAvailableSubjects().size());
        assertEquals(1,response.getAvailableSubjects().get(0).getSubjectId());
        assertNotNull(response.getWarningMessage());
    }
    @Test
    @DisplayName("Personal details may change without changing teaching assignments")
    void testUpdatePersonalDetailsKeepsSubjects() {
        testCoach.getSpecialties().add(yogaSubject);
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        var request=UpdateCoachProfileRequest.builder().fullName("Updated").phone("0123456789").bio("Updated bio").subjectId(1).build();
        coachProfileService.updateCoachProfile("coach@example.com",request);
        assertEquals("Updated",testCoach.getFullName());assertEquals(2,testCoach.getSpecialties().size());
        verify(userRepository).save(testCoach);
        verify(notificationService).createNotification(eq("coach@example.com"),anyString(),anyString(),eq("SYSTEM"));
    }
    @Test
    @DisplayName("A coach cannot self assign an existing unassigned subject even without active classes")
    void testCannotSelfAssignSubject() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        assertThrows(IllegalArgumentException.class,()->coachProfileService.updateCoachProfile("coach@example.com",UpdateCoachProfileRequest.builder().subjectId(2).build()));
        assertEquals(1,testCoach.getSpecialties().get(0).getSubjectId());
        verify(userRepository,never()).save(any());
    }
    @Test
    @DisplayName("Unknown subject requests cannot bypass manager assignment")
    void testUnknownSubjectRejected() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        var error=assertThrows(IllegalArgumentException.class,()->coachProfileService.updateCoachProfile("coach@example.com",UpdateCoachProfileRequest.builder().subjectId(999).build()));
        assertTrue(error.getMessage().contains("quản lý"));
        verify(userRepository,never()).save(any());
    }
}
