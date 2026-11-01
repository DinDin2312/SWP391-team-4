package com.team4.sportscenter.modules.member.controllers;

import com.team4.sportscenter.modules.coach.services.ScheduleRescheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/member/reschedule-responses")
@RequiredArgsConstructor
public class MemberRescheduleController {

    private final ScheduleRescheduleService scheduleRescheduleService;

    @PostMapping("/{requestId}/respond")
    public ResponseEntity<Map<String, String>> respondToReschedule(
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {
        String memberEmail = authentication.getName();
        String action = payload.get("action");
        if (action == null || (!action.equalsIgnoreCase("ACCEPT") && !action.equalsIgnoreCase("DECLINE"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Action must be ACCEPT or DECLINE"));
        }
        scheduleRescheduleService.respondToReschedule(requestId, action.toUpperCase(), memberEmail);
        return ResponseEntity.ok(Map.of("message", "Response recorded successfully", "action", action.toUpperCase()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyRescheduleNotices(Authentication authentication) {
        String memberEmail = authentication.getName();
        return ResponseEntity.ok(scheduleRescheduleService.getMemberRescheduleStatus(memberEmail));
    }
}
