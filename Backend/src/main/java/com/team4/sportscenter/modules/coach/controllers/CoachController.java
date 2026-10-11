package com.team4.sportscenter.modules.coach.controllers;

import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutPlanRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateEvaluationRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateExerciseRequest;
import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.*;
import com.team4.sportscenter.modules.coach.services.CoachEvaluationService;
import com.team4.sportscenter.modules.coach.services.CoachNotificationService;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import com.team4.sportscenter.modules.coach.services.CoachWorkoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CoachController {

    private final CoachScheduleService coachScheduleService;
    private final CoachNotificationService coachNotificationService;
    private final CoachWorkoutService coachWorkoutService;
    private final CoachEvaluationService coachEvaluationService;

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
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachWorkoutService.getCoachWorkoutPlans(coachEmail, studentUserId));
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

    @GetMapping("/classes/{classId}/students")
    public ResponseEntity<List<CoachStudentItemResponse>> getClassStudents(
            @PathVariable Integer classId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachEvaluationService.getStudentsByClassId(classId, coachEmail));
    }

    @PostMapping("/evaluations")
    public ResponseEntity<?> createEvaluation(
            @RequestBody CreateEvaluationRequest request,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        Map<String, Object> result = coachEvaluationService.createEvaluation(request, coachEmail);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/evaluations")
    public ResponseEntity<List<CoachStudentEvaluationResponse>> getEvaluations(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer classId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        return ResponseEntity.ok(coachEvaluationService.getEvaluations(coachEmail, userId, classId));
    }

    @DeleteMapping("/evaluations/{evaluationId}")
    public ResponseEntity<?> deleteEvaluation(
            @PathVariable Integer evaluationId,
            Authentication authentication) {
        String coachEmail = authentication.getName();
        coachEvaluationService.deleteEvaluation(evaluationId, coachEmail);
        return ResponseEntity.ok(Map.of("message", "Xóa bản ghi đánh giá thành công!"));
    }
}


