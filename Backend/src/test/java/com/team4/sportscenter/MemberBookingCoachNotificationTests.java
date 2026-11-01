package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.TraineeAssessmentRepository;
import com.team4.sportscenter.modules.manager.services.PackageTypeCatalog;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Room;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.PackageRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import com.team4.sportscenter.modules.member.repositories.UserMembershipRepository;
import com.team4.sportscenter.modules.member.services.PackageBenefitsService;
import com.team4.sportscenter.modules.member.services.PackageCommerceService;
import com.team4.sportscenter.modules.member.services.impl.MemberServiceImpl;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberBookingCoachNotificationTests {

    @Mock private UserMembershipRepository membershipRepository;
    @Mock private PackageBenefitsService packageBenefits;
    @Mock private PackageTypeCatalog packageTypes;
    @Mock private PackageCommerceService commerce;
    @Mock private BookingRepository bookingRepository;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private UserRepository userRepository;
    @Mock private PackageRepository packageRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    @Mock private CoachClassRepository coachClassRepository;
    @Mock private TraineeAssessmentRepository traineeAssessmentRepository;

    @InjectMocks
    private MemberServiceImpl memberService;

    private User trainee;
    private User coach;
    private GymClass gymClass;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        trainee = User.builder()
                .userId(101)
                .email("trainee@gmail.com")
                .fullName("Nguyen Van A")
                .build();

        coach = User.builder()
                .userId(202)
                .email("coach.tuan@gmail.com")
                .fullName("HLV Nguyen Van Tuan")
                .build();

        Room room = Room.builder()
                .roomId(1)
                .roomName("Phong Gym Tang 1")
                .build();

        gymClass = GymClass.builder()
                .classId(1)
                .className("The Hinh Co Ban")
                .subjectId(1)
                .coach(coach)
                .room(room)
                .maxSlots(20)
                .build();

        schedule = Schedule.builder()
                .scheduleId(501)
                .gymClass(gymClass)
                .startTime(LocalDateTime.now().plusDays(2))
                .endTime(LocalDateTime.now().plusDays(2).plusHours(2))
                .status("SCHEDULED")
                .build();
    }

    @Test
    @DisplayName("Should reject booking class using package because courses are enrolled separately")
    void testBookClassUsingPackageRejected() {
        assertThrows(
                IllegalArgumentException.class,
                () -> memberService.bookClassUsingPackage(trainee.getEmail(), 1, 10)
        );
    }

    @Test
    @DisplayName("Should send notification to coach when member cancels a class")
    void testCancelClassNotifiesCoach() {
        Booking booking = Booking.builder()
                .bookingId(1001)
                .user(trainee)
                .schedule(schedule)
                .status("CONFIRMED")
                .attendanceStatus("NOT_YET")
                .build();

        when(bookingRepository.findAllBookingsByEmail(trainee.getEmail())).thenReturn(List.of(booking));

        memberService.cancelClass(trainee.getEmail(), 1);

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeastOnce()).save(notifCaptor.capture());

        List<Notification> captured = notifCaptor.getAllValues();
        boolean notifiedCoach = captured.stream().anyMatch(n ->
                n.getUser() != null &&
                "coach.tuan@gmail.com".equals(n.getUser().getEmail()) &&
                n.getTitle().contains("Học viên hủy đăng ký lớp")
        );

        assertTrue(notifiedCoach, "Coach should receive a cancellation notification");
    }

    @Test
    @DisplayName("Should safely handle booking and cancellation when coach is null")
    void testNullCoachDoesNotThrow() {
        gymClass.setCoach(null);

        Booking booking = Booking.builder()
                .bookingId(1002)
                .user(trainee)
                .schedule(schedule)
                .status("CONFIRMED")
                .attendanceStatus("NOT_YET")
                .build();

        when(bookingRepository.findAllBookingsByEmail(trainee.getEmail())).thenReturn(List.of(booking));

        assertDoesNotThrow(() -> memberService.cancelClass(trainee.getEmail(), 1));
    }
}
