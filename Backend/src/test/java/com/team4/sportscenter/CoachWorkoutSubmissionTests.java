package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.SubmissionFeedbackRequest;
import com.team4.sportscenter.modules.coach.dtos.request.SubmitWorkoutRequest;
import com.team4.sportscenter.modules.coach.dtos.response.WorkoutSubmissionResponse;
import com.team4.sportscenter.modules.coach.entities.CoachPlanDetail;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutSubmission;
import com.team4.sportscenter.modules.coach.entities.Exercise;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachPlanDetailRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutSubmissionRepository;
import com.team4.sportscenter.modules.coach.repositories.ExerciseRepository;
import com.team4.sportscenter.modules.coach.services.impl.CoachWorkoutServiceImpl;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CoachWorkoutSubmissionTests {

    @Mock private CoachWorkoutSubmissionRepository workoutSubmissionRepository;
    @Mock private CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    @Mock private CoachPlanDetailRepository coachPlanDetailRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private ExerciseRepository exerciseRepository;
    @Mock private CoachClassRepository coachClassRepository;

    @InjectMocks
    private MemberServiceImpl memberService;

    @InjectMocks
    private CoachWorkoutServiceImpl coachWorkoutService;

    private User student;
    private User coach;
    private GymClass gymClass;
    private CoachWorkoutPlan singlePlan;
    private CoachWorkoutPlan trainingPlan;
    private CoachPlanDetail detail;
    private Exercise exercise;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .userId(101)
                .email("student@test.com")
                .fullName("Nguyen Van Hoc Vien")
                .avatarPath("https://avatar.test/student.png")
                .build();

        coach = User.builder()
                .userId(501)
                .email("coach@test.com")
                .fullName("Tran Van Coach")
                .build();

        gymClass = GymClass.builder()
                .classId(12)
                .className("Lop Boi & Yoga")
                .coach(coach)
                .build();

        exercise = Exercise.builder()
                .exerciseId(1)
                .exerciseName("Boi sai 100m")
                .muscleGroup("Toan than")
                .build();

        detail = CoachPlanDetail.builder()
                .detailId(88)
                .exercise(exercise)
                .sets(3)
                .reps(12)
                .restSeconds(60)
                .build();

        // 1. Single workout plan (Bài giao 1 lần)
        singlePlan = CoachWorkoutPlan.builder()
                .planId(10)
                .title("Bai Tap Nhanh - Boi Loi")
                .planType("SINGLE")
                .user(student)
                .coach(coach)
                .gymClass(gymClass)
                .planDetails(List.of(detail))
                .build();

        // 2. Milestone training plan (Kế hoạch theo mốc)
        trainingPlan = CoachWorkoutPlan.builder()
                .planId(20)
                .title("Lo Trinh 4 Tuan The Luc")
                .planType("TRAINING_PLAN")
                .user(student)
                .coach(coach)
                .gymClass(gymClass)
                .totalWeeks(4)
                .planDetails(List.of(detail))
                .build();
    }

    // =========================================================================
    // SCENARIO 1: Member Submits Workout for Single Assignment (Bài giao 1 lần)
    // =========================================================================
    @Test
    @DisplayName("SubmitWorkout - Single Plan: Saves submission and notifies coach")
    void testSubmitWorkout_SinglePlan_Success() {
        SubmitWorkoutRequest request = SubmitWorkoutRequest.builder()
                .detailId(88)
                .videoUrl("https://youtube.com/watch?v=single123")
                .studentNote("Em hoan thanh 3 hiep bai tap 1 lan")
                .build();

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(coachWorkoutPlanRepository.findById(10)).thenReturn(Optional.of(singlePlan));
        when(coachPlanDetailRepository.findById(88)).thenReturn(Optional.of(detail));

        when(workoutSubmissionRepository.save(any(CoachWorkoutSubmission.class))).thenAnswer(invocation -> {
            CoachWorkoutSubmission sub = invocation.getArgument(0);
            sub.setSubmissionId(1);
            return sub;
        });

        WorkoutSubmissionResponse response = memberService.submitWorkout("student@test.com", 10, request);

        assertNotNull(response);
        assertEquals(1, response.getSubmissionId());
        assertEquals("SUBMITTED", response.getStatus());
        assertEquals("https://youtube.com/watch?v=single123", response.getVideoUrl());
        assertEquals("Em hoan thanh 3 hiep bai tap 1 lan", response.getStudentNote());
        assertEquals("Boi sai 100m", response.getExerciseName());
        assertEquals(12, response.getClassId());
        assertEquals("Lop Boi & Yoga", response.getClassName());

        // Verify coach receives notification
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());
        Notification notif = notifCaptor.getValue();
        assertEquals(coach.getUserId(), notif.getUser().getUserId());
        assertEquals("WORKOUT_SUBMISSION", notif.getType());
        assertTrue(notif.getMessage().contains("Boi sai 100m"));
    }

    // =========================================================================
    // SCENARIO 2: Member Submits Workout for Milestone Plan (Kế hoạch theo mốc)
    // =========================================================================
    @Test
    @DisplayName("SubmitWorkout - Milestone Plan: Saves submission and notifies coach")
    void testSubmitWorkout_MilestonePlan_Success() {
        SubmitWorkoutRequest request = SubmitWorkoutRequest.builder()
                .detailId(88)
                .videoUrl("https://drive.google.com/file/d/milestone/view")
                .studentNote("Hoan thanh tuan 1")
                .build();

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(student));
        when(coachWorkoutPlanRepository.findById(20)).thenReturn(Optional.of(trainingPlan));
        when(coachPlanDetailRepository.findById(88)).thenReturn(Optional.of(detail));

        when(workoutSubmissionRepository.save(any(CoachWorkoutSubmission.class))).thenAnswer(invocation -> {
            CoachWorkoutSubmission sub = invocation.getArgument(0);
            sub.setSubmissionId(2);
            return sub;
        });

        WorkoutSubmissionResponse response = memberService.submitWorkout("student@test.com", 20, request);

        assertNotNull(response);
        assertEquals(2, response.getSubmissionId());
        assertEquals("SUBMITTED", response.getStatus());
        assertEquals("Lo Trinh 4 Tuan The Luc", response.getPlanTitle());
        verify(workoutSubmissionRepository).save(any());
        verify(notificationRepository).save(any());
    }

    // =========================================================================
    // SCENARIO 3: Validation - Empty video URL throws RuntimeException
    // =========================================================================
    @Test
    @DisplayName("SubmitWorkout - Empty videoUrl throws validation error")
    void testSubmitWorkout_EmptyVideoUrl_ThrowsValidationException() {
        SubmitWorkoutRequest request = SubmitWorkoutRequest.builder()
                .videoUrl("   ")
                .studentNote("Note")
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                memberService.submitWorkout("student@test.com", 10, request)
        );
        assertTrue(ex.getMessage().contains("Vui lòng cung cấp đường dẫn video"));
    }

    // =========================================================================
    // SCENARIO 4: Coach Reviews & Approves Submission (5 Stars)
    // =========================================================================
    @Test
    @DisplayName("SubmitCoachFeedback - Approve: Updates status to APPROVED and notifies student")
    void testSubmitFeedback_Approved_Success() {
        CoachWorkoutSubmission submission = CoachWorkoutSubmission.builder()
                .submissionId(1)
                .workoutPlan(singlePlan)
                .planDetail(detail)
                .user(student)
                .coach(coach)
                .videoUrl("https://youtube.com/watch?v=sample")
                .status("SUBMITTED")
                .submittedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("coach@test.com")).thenReturn(Optional.of(coach));
        when(workoutSubmissionRepository.findById(1)).thenReturn(Optional.of(submission));
        when(workoutSubmissionRepository.save(any(CoachWorkoutSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmissionFeedbackRequest feedbackReq = SubmissionFeedbackRequest.builder()
                .status("APPROVED")
                .rating(5)
                .coachFeedback("Ky thuat rat tot, giu vung phong do nhe!")
                .build();

        WorkoutSubmissionResponse response = coachWorkoutService.submitCoachFeedback("coach@test.com", 1, feedbackReq);

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals(5, response.getRating());
        assertEquals("Ky thuat rat tot, giu vung phong do nhe!", response.getCoachFeedback());

        // Verify notification sent to student
        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(notifCaptor.capture());
        Notification notif = notifCaptor.getValue();
        assertEquals(student.getUserId(), notif.getUser().getUserId());
        assertEquals("COACH", notif.getType());
        assertTrue(notif.getMessage().contains("5 ⭐"));
    }

    // =========================================================================
    // SCENARIO 5: Coach Requests Revision (Cần tập lại)
    // =========================================================================
    @Test
    @DisplayName("SubmitCoachFeedback - Revision: Updates status to REVISION_REQUESTED and notifies student")
    void testSubmitFeedback_RevisionRequested_Success() {
        CoachWorkoutSubmission submission = CoachWorkoutSubmission.builder()
                .submissionId(2)
                .workoutPlan(trainingPlan)
                .planDetail(detail)
                .user(student)
                .coach(coach)
                .videoUrl("https://youtube.com/watch?v=sample2")
                .status("SUBMITTED")
                .submittedAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("coach@test.com")).thenReturn(Optional.of(coach));
        when(workoutSubmissionRepository.findById(2)).thenReturn(Optional.of(submission));
        when(workoutSubmissionRepository.save(any(CoachWorkoutSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubmissionFeedbackRequest feedbackReq = SubmissionFeedbackRequest.builder()
                .status("REVISION_REQUESTED")
                .rating(2)
                .coachFeedback("Lung hoi cong o hiep cuoi, chu y siet co bung va tap lai nhe!")
                .build();

        WorkoutSubmissionResponse response = coachWorkoutService.submitCoachFeedback("coach@test.com", 2, feedbackReq);

        assertNotNull(response);
        assertEquals("REVISION_REQUESTED", response.getStatus());
        assertEquals(2, response.getRating());
        assertEquals("Lung hoi cong o hiep cuoi, chu y siet co bung va tap lai nhe!", response.getCoachFeedback());
    }

    // =========================================================================
    // SCENARIO 6: Coach Queries Submissions with Class Filter
    // =========================================================================
    @Test
    @DisplayName("GetCoachSubmissions - Calls filtered query with classId")
    void testGetCoachSubmissions_FilterByClassId_Success() {
        when(userRepository.findByEmail("coach@test.com")).thenReturn(Optional.of(coach));

        CoachWorkoutSubmission submission = CoachWorkoutSubmission.builder()
                .submissionId(1)
                .workoutPlan(singlePlan)
                .planDetail(detail)
                .user(student)
                .coach(coach)
                .status("SUBMITTED")
                .submittedAt(LocalDateTime.now())
                .build();

        when(workoutSubmissionRepository.findCoachSubmissionsFiltered(501, null, null, null, 12))
                .thenReturn(List.of(submission));

        List<WorkoutSubmissionResponse> list = coachWorkoutService.getCoachSubmissions("coach@test.com", null, null, null, 12);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals(12, list.get(0).getClassId());
        assertEquals("Lop Boi & Yoga", list.get(0).getClassName());
        verify(workoutSubmissionRepository).findCoachSubmissionsFiltered(501, null, null, null, 12);
    }
}
