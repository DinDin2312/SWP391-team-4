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
    @DisplayName("Lấy hồ sơ HLV: Hiển thị bộ môn hiện tại và số lớp đang dạy")
    void testGetCoachProfile() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        when(coachClassRepository.findActiveClassesByCoachAndSubject(10, 1)).thenReturn(List.of());
        when(subjectRepository.findAll()).thenReturn(List.of(gymSubject, yogaSubject));

        CoachProfileResponse response = coachProfileService.getCoachProfile("coach@example.com");

        assertNotNull(response);
        assertEquals("Coach John", response.getFullName());
        assertEquals("coach@example.com", response.getEmail());
        assertEquals(1, response.getCurrentSubjectId());
        assertEquals("Gym", response.getCurrentSubjectName());
        assertTrue(response.isCanChangeSubject());
        assertEquals(0, response.getActiveClassesCount());
        assertEquals(2, response.getAvailableSubjects().size());
    }

    @Test
    @DisplayName("Đổi môn thành công: Cho phép đổi khi không còn lớp học nào đang dạy")
    void testUpdateCoachProfile_SuccessWhenNoActiveClasses() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        when(subjectRepository.findById(2)).thenReturn(Optional.of(yogaSubject));
        when(coachClassRepository.findActiveClassesByCoachAndSubject(10, 1)).thenReturn(List.of());

        UpdateCoachProfileRequest request = UpdateCoachProfileRequest.builder()
                .fullName("Coach John Updated")
                .phone("0123456789")
                .bio("Updated bio")
                .subjectId(2)
                .build();

        coachProfileService.updateCoachProfile("coach@example.com", request);

        assertEquals("Coach John Updated", testCoach.getFullName());
        assertEquals("0123456789", testCoach.getPhone());
        assertEquals("Updated bio", testCoach.getBio());
        assertEquals(1, testCoach.getSpecialties().size());
        assertEquals(2, testCoach.getSpecialties().get(0).getSubjectId());
        assertEquals("Yoga", testCoach.getSpecialties().get(0).getSubjectName());

        verify(userRepository).save(testCoach);
        verify(notificationService).createNotification(eq("coach@example.com"), anyString(), anyString(), eq("SYSTEM"));
    }

    @Test
    @DisplayName("Chặn đổi môn: Báo lỗi IllegalStateException khi còn lớp đang dạy thuộc môn hiện tại")
    void testUpdateCoachProfile_ThrowsExceptionWhenActiveClassesExist() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        when(subjectRepository.findById(2)).thenReturn(Optional.of(yogaSubject));

        GymClass activeClass = GymClass.builder()
                .classId(101)
                .className("Gym Nâng Cao")
                .coach(testCoach)
                .subject(gymSubject)
                .status("ACTIVE")
                .build();

        when(coachClassRepository.findActiveClassesByCoachAndSubject(10, 1)).thenReturn(List.of(activeClass));

        UpdateCoachProfileRequest request = UpdateCoachProfileRequest.builder()
                .subjectId(2)
                .build();

        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            coachProfileService.updateCoachProfile("coach@example.com", request);
        });

        assertTrue(exception.getMessage().contains("Không thể đổi bộ môn!"));
        assertTrue(exception.getMessage().contains("Gym Nâng Cao"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Chặn đổi môn: Báo lỗi IllegalArgumentException khi môn mới không tồn tại trên hệ thống")
    void testUpdateCoachProfile_ThrowsExceptionWhenSubjectNotFound() {
        when(userRepository.findByEmail("coach@example.com")).thenReturn(Optional.of(testCoach));
        when(subjectRepository.findById(999)).thenReturn(Optional.empty());

        UpdateCoachProfileRequest request = UpdateCoachProfileRequest.builder()
                .subjectId(999)
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            coachProfileService.updateCoachProfile("coach@example.com", request);
        });

        assertTrue(exception.getMessage().contains("Bộ môn được chọn không tồn tại"));
        verify(userRepository, never()).save(any());
    }
}
