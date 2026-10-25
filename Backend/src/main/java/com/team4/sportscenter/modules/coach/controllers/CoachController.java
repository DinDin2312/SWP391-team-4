package com.team4.sportscenter.modules.coach.controllers;

import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutPlanRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateExerciseRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateTraineeAssessmentRequest;
import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.*;
import com.team4.sportscenter.modules.coach.services.CoachAssessmentService;
import com.team4.sportscenter.modules.coach.services.CoachNotificationService;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.coach.services.CoachWorkoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateCoachProfileRequest;
import com.team4.sportscenter.modules.coach.services.CoachProfileService;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coach")
public class CoachController {

    private final CoachScheduleService coachScheduleService;
    private final CoachNotificationService coachNotificationService;
    private final CoachWorkoutService coachWorkoutService;
    private final CoachAssessmentService coachAssessmentService;
    private final CoachProfileService coachProfileService;

    public CoachController(
            CoachScheduleService coachScheduleService,
            CoachNotificationService coachNotificationService,
            CoachWorkoutService coachWorkoutService,
            CoachAssessmentService coachAssessmentService,
            CoachProfileService coachProfileService) {
        this.coachScheduleService = coachScheduleService;
        this.coachNotificationService = coachNotificationService;
        this.coachWorkoutService = coachWorkoutService;
        this.coachAssessmentService = coachAssessmentService;
        this.coachProfileService = coachProfileService;
    }

    // ==================== HỒ SƠ & CÀI ĐẶT HUẤN LUYỆN VIÊN ====================

    @GetMapping("/profile")
    public ResponseEntity<CoachProfileResponse> getCoachProfile(Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachProfileService.getCoachProfile(coachEmail));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateCoachProfile(
            @RequestBody UpdateCoachProfileRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        coachProfileService.updateCoachProfile(coachEmail, request);
        return ResponseEntity.ok(Map.of("message", "Cập nhật hồ sơ huấn luyện viên thành công!"));
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectOptionResponse>> getCoachSubjects() {
        return ResponseEntity.ok(coachProfileService.getAllSubjects());
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<CoachScheduleResponse>> getCoachSchedules(Authentication authentication) {
        String coachEmail = authentication.getName();
        List<CoachScheduleResponse> schedules = coachScheduleService.getCoachSchedules(coachEmail);
        return ResponseEntity.ok(schedules);
    }

    @GetMapping("/schedules/{scheduleId}/students")
    public ResponseEntity<List<EnrolledStudentResponse>> getScheduleStudents(
            @PathVariable Integer scheduleId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        List<EnrolledStudentResponse> students = coachScheduleService.getScheduleStudents(scheduleId, coachEmail);
        return ResponseEntity.ok(students);
    }

    @PutMapping("/schedules/{scheduleId}/attendance")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Integer scheduleId,
            @RequestBody UpdateAttendanceRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        coachScheduleService.updateAttendance(scheduleId, request, coachEmail);
        return ResponseEntity.ok(Map.of("message", "Cập nhật điểm danh thành công!"));
    }

    @GetMapping("/students")
    public ResponseEntity<List<CoachStudentResponse>> getCoachStudents(Authentication authentication) {
        String coachEmail = authentication.getName();
        List<CoachStudentResponse> students = coachScheduleService.getCoachStudents(coachEmail);
        return ResponseEntity.ok(students);
    }

    @GetMapping("/classes")
    public ResponseEntity<List<CoachClassResponse>> getCoachClasses(Authentication authentication) {
        String coachEmail = authentication.getName();
        List<CoachClassResponse> classes = coachNotificationService.getCoachClasses(coachEmail);
        return ResponseEntity.ok(classes);
    }

    @GetMapping("/classes/{classId}/students")
    public ResponseEntity<List<EnrolledStudentResponse>> getStudentsByClassId(
            @PathVariable Integer classId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        List<EnrolledStudentResponse> students = coachAssessmentService.getStudentsByClassId(classId, coachEmail);
        return ResponseEntity.ok(students);
    }

    @PostMapping("/notifications/send")
    public ResponseEntity<?> sendNotification(
            @RequestBody SendCoachNotificationRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        Map<String, Object> result = coachNotificationService.sendNotification(request, coachEmail);
        return ResponseEntity.ok(result);
    }

    // ==================== BÀI TẬP & GIÁO ÁN HL ====================

    @GetMapping("/exercises")
    public ResponseEntity<List<ExerciseResponse>> getAllExercises() {
        return ResponseEntity.ok(coachWorkoutService.getAllExercises());
    }

    @PostMapping("/exercises")
    public ResponseEntity<ExerciseResponse> createExercise(@RequestBody CreateExerciseRequest request) {
        return ResponseEntity.ok(coachWorkoutService.createExercise(request));
    }

    @PostMapping("/workouts/assign")
    public ResponseEntity<?> assignWorkoutPlan(
            @RequestBody AssignWorkoutPlanRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        Map<String, Object> result = coachWorkoutService.assignWorkoutPlan(request, coachEmail);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/workouts")
    public ResponseEntity<List<CoachWorkoutPlanResponse>> getCoachWorkoutPlans(
            @RequestParam(required = false) Integer studentUserId,
            @RequestParam(required = false) String planType,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachWorkoutService.getCoachWorkoutPlans(coachEmail, studentUserId, planType));
    }

    @GetMapping("/workouts/{planId}")
    public ResponseEntity<CoachWorkoutPlanResponse> getWorkoutPlanById(
            @PathVariable Integer planId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachWorkoutService.getWorkoutPlanById(planId, coachEmail));
    }

    @DeleteMapping("/workouts/{planId}")
    public ResponseEntity<?> deleteWorkoutPlan(
            @PathVariable Integer planId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        coachWorkoutService.deleteWorkoutPlan(planId, coachEmail);
        return ResponseEntity.ok(Map.of("message", "Xóa giáo án bài tập thành công!"));
    }

    // ==================== ĐÁNH GIÁ TIẾN ĐỘ HỌC VIÊN ====================

    @PostMapping("/assessments")
    public ResponseEntity<TraineeAssessmentResponse> createAssessment(
            @Valid @RequestBody CreateTraineeAssessmentRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        TraineeAssessmentResponse response = coachAssessmentService.createAssessment(request, coachEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assessments")
    public ResponseEntity<List<TraineeAssessmentResponse>> getCoachAssessments(
            @RequestParam(required = false) Integer studentUserId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachAssessmentService.getCoachAssessments(coachEmail, studentUserId));
    }

    @GetMapping("/assessments/student/{studentUserId}")
    public ResponseEntity<List<TraineeAssessmentResponse>> getStudentAssessmentHistory(
            @PathVariable Integer studentUserId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachAssessmentService.getStudentAssessmentHistory(studentUserId, coachEmail));
    }

    @DeleteMapping("/assessments/{assessmentId}")
    public ResponseEntity<?> deleteAssessment(
            @PathVariable Integer assessmentId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        coachAssessmentService.deleteAssessment(assessmentId, coachEmail);
        return ResponseEntity.ok(Map.of("message", "Xóa đánh giá tiến độ thành công!"));
    }
}
