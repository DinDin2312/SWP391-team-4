package com.team4.sportscenter.modules.coach.controllers;

import com.team4.sportscenter.modules.coach.dtos.response.CoachScheduleResponse;
import com.team4.sportscenter.modules.coach.services.CoachScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coach")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CoachController {

    private final CoachScheduleService coachScheduleService;

    @GetMapping("/schedules")
    public ResponseEntity<List<CoachScheduleResponse>> getCoachSchedules(Authentication authentication) {
        String coachEmail = authentication.getName();
        List<CoachScheduleResponse> schedules = coachScheduleService.getCoachSchedules(coachEmail);
        return ResponseEntity.ok(schedules);
    }
}
