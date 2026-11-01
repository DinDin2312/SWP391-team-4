package com.team4.sportscenter.modules.coach.controllers;

import com.team4.sportscenter.modules.coach.dtos.CreateRescheduleRequestDto;
import com.team4.sportscenter.modules.coach.dtos.RescheduleRequestResponseDto;
import com.team4.sportscenter.modules.coach.dtos.UpcomingScheduleOptionDto;
import com.team4.sportscenter.modules.coach.services.ScheduleRescheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coach/reschedule-requests")
@RequiredArgsConstructor
public class CoachRescheduleController {

    private final ScheduleRescheduleService scheduleRescheduleService;

    @PostMapping
    public ResponseEntity<RescheduleRequestResponseDto> createRequest(
            @Valid @RequestBody CreateRescheduleRequestDto dto,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleRescheduleService.createCoachRequest(dto, email));
    }

    @GetMapping("/my")
    public ResponseEntity<List<RescheduleRequestResponseDto>> getMyRequests(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleRescheduleService.getCoachRequests(email));
    }

    @GetMapping("/upcoming-schedules")
    public ResponseEntity<List<UpcomingScheduleOptionDto>> getUpcomingSchedules(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleRescheduleService.getCoachUpcomingSchedules(email));
    }

    @GetMapping("/check-availability")
    public ResponseEntity<Map<String, Object>> checkAvailability(
            @RequestParam Integer scheduleId,
            @RequestParam String proposedStartTime,
            @RequestParam String proposedEndTime,
            @RequestParam(required = false) Integer proposedRoomId,
            Authentication authentication) {
        String email = authentication.getName();
        LocalDateTime start = LocalDateTime.parse(proposedStartTime);
        LocalDateTime end = LocalDateTime.parse(proposedEndTime);
        return ResponseEntity.ok(scheduleRescheduleService.checkAvailability(scheduleId, start, end, proposedRoomId, email));
    }

    @PutMapping("/{requestId}/cancel")
    public ResponseEntity<RescheduleRequestResponseDto> cancelRequest(
            @PathVariable Integer requestId,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(scheduleRescheduleService.cancelCoachRequest(requestId, email));
    }
}
