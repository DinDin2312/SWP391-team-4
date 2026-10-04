package com.team4.sportscenter.modules.coach.controllers;

import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateAttendanceRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachClassResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.services.CoachNotificationService;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
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
}

