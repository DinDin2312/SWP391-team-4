package com.team4.sportscenter.modules.member.controllers;

import com.team4.sportscenter.modules.member.health.MemberHealthProfileRequest;
import com.team4.sportscenter.modules.member.health.MemberHealthProfileResponse;
import com.team4.sportscenter.modules.member.health.MemberHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/member/health-profile")
public class MemberHealthController {

    private final MemberHealthService healthService;

    public MemberHealthController(MemberHealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping
    public ResponseEntity<MemberHealthProfileResponse> get(Authentication authentication) {
        return ResponseEntity.ok(healthService.get(authentication.getName()));
    }

    @PutMapping
    public ResponseEntity<MemberHealthProfileResponse> save(Authentication authentication,
                                                            @RequestBody MemberHealthProfileRequest request) {
        return ResponseEntity.ok(healthService.save(authentication.getName(), request));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> withdraw(Authentication authentication) {
        healthService.withdraw(authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Health data withdrawn"));
    }
}
