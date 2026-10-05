package com.team4.sportscenter.modules.member.controllers;

import com.team4.sportscenter.modules.member.services.MemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/member")
public class MemberController {

    private final MemberService memberService;
    private final com.team4.sportscenter.modules.member.services.AiChatService aiChatService;

    public MemberController(MemberService memberService, com.team4.sportscenter.modules.member.services.AiChatService aiChatService) {
        this.memberService = memberService;
        this.aiChatService = aiChatService;
    }

    @GetMapping("/my-membership")
    public ResponseEntity<com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse> getMyMembership(Authentication authentication) {
        return ResponseEntity.ok(memberService.getMyActiveMembership(authentication.getName()));
    }

    @GetMapping("/upcoming-bookings")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse>> getUpcomingBookings(Authentication authentication) {
        return ResponseEntity.ok(memberService.getMyUpcomingBookings(authentication.getName()));
    }

    @GetMapping("/total-checkins")
    public ResponseEntity<Long> getTotalCheckIns(Authentication authentication) {
        return ResponseEntity.ok(memberService.getTotalCheckIns(authentication.getName()));
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.RecentActivityResponse>> getRecentActivities(Authentication authentication) {
        return ResponseEntity.ok(memberService.getRecentActivities(authentication.getName()));
    }

    @GetMapping("/calendar-bookings")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.CalendarBookingResponse>> getCalendarBookings(Authentication authentication) {
        return ResponseEntity.ok(memberService.getAllCalendarBookings(authentication.getName()));
    }

    @GetMapping("/available-classes")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse>> getAvailableClasses() {
        return ResponseEntity.ok(memberService.getAvailableClasses());
    }

    @PostMapping("/book-class/{classId}")
    public ResponseEntity<String> bookClass(Authentication authentication, @PathVariable Integer classId) {
        try {
            memberService.bookClass(authentication.getName(), classId);
            return ResponseEntity.ok("Successfully booked class");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/cancel-class/{classId}")
    public ResponseEntity<String> cancelClass(Authentication authentication, @PathVariable Integer classId) {
        try {
            memberService.cancelClass(authentication.getName(), classId);
            return ResponseEntity.ok("Successfully cancelled class");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/add-package-to-cart/{packageId}")
    public ResponseEntity<String> addPackageToCart(Authentication authentication, @PathVariable Integer packageId) {
        try {
            memberService.addPackageToCart(authentication.getName(), packageId);
            return ResponseEntity.ok("Successfully added to cart");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/packages")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.PackageResponse>> getAllPackages() {
        return ResponseEntity.ok(memberService.getAllPackages());
    }

    @GetMapping("/my-packages")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse>> getMyPackages(Authentication authentication) {
        return ResponseEntity.ok(memberService.getMyPackages(authentication.getName()));
    }

    @PostMapping("/ai/chat")
    public ResponseEntity<String> chatWithAi(Authentication authentication, @RequestBody com.team4.sportscenter.modules.member.dtos.AiMessageRequest request) {
        return ResponseEntity.ok(aiChatService.chat(request.getMessage(), authentication.getName()));
    }
}
