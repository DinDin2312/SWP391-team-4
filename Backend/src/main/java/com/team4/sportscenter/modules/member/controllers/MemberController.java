package com.team4.sportscenter.modules.member.controllers;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.CalendarBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.team4.sportscenter.modules.member.dtos.response.RecentActivityResponse;
import com.team4.sportscenter.modules.member.services.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/member")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/my-membership")
    public ResponseEntity<MemberMembershipResponse> getMyMembership(Authentication authentication) {
        String email = authentication.getName(); 
        
        MemberMembershipResponse response = memberService.getMyActiveMembership(email);
        
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/upcoming-bookings")
    public ResponseEntity<List<UpcomingBookingResponse>> getUpcomingBookings(Authentication authentication) {
        String email = authentication.getName();
        List<UpcomingBookingResponse> response = memberService.getMyUpcomingBookings(email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/total-checkins")
    public ResponseEntity<Long> getTotalCheckIns(Authentication authentication) {
        String email = authentication.getName();
        long total = memberService.getTotalCheckIns(email);
        return ResponseEntity.ok(total);
    }
    @GetMapping("/recent-activities")
    public ResponseEntity<List<RecentActivityResponse>> getRecentActivities(Authentication authentication) {
        String email = authentication.getName();
        List<RecentActivityResponse> response = memberService.getRecentActivities(email);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/calendar-bookings")
    public ResponseEntity<List<CalendarBookingResponse>> getCalendarBookings(Authentication authentication) {
        return ResponseEntity.ok(memberService.getAllCalendarBookings(authentication.getName()));
    }

    @GetMapping("/available-classes")
    public ResponseEntity<List<AvailableClassResponse>> getAvailableClasses() {
        return ResponseEntity.ok(memberService.getAvailableClasses());
    }

    @PostMapping("/book-class/{classId}")
    public ResponseEntity<String> bookClass(@PathVariable Integer classId, Authentication authentication) {
        try {
            memberService.bookClass(authentication.getName(), classId);
            return ResponseEntity.ok("Booked course successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
