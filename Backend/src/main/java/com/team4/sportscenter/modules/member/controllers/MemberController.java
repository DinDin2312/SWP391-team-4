package com.team4.sportscenter.modules.member.controllers;

import com.team4.sportscenter.modules.member.services.MemberService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
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

    @GetMapping("/enrolled-classes")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.EnrolledClassResponse>> getEnrolledClasses(Authentication authentication) {
        return ResponseEntity.ok(memberService.getEnrolledClasses(authentication.getName()));
    }

    @GetMapping("/classes/{classId}/workouts")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.MemberWorkoutPlanResponse>> getWorkoutsByClass(
            Authentication authentication,
            @PathVariable Integer classId) {
        return ResponseEntity.ok(memberService.getWorkoutsByClass(authentication.getName(), classId));
    }

    @GetMapping("/my-workouts")
    public ResponseEntity<List<com.team4.sportscenter.modules.member.dtos.response.MemberWorkoutPlanResponse>> getMyWorkouts(Authentication authentication) {
        return ResponseEntity.ok(memberService.getMyWorkouts(authentication.getName()));
    }

    @GetMapping("/assessments")
    public ResponseEntity<List<com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse>> getMyAssessments(
            Authentication authentication,
            @RequestParam(required = false) Integer classId) {
        return ResponseEntity.ok(memberService.getMyAssessments(authentication.getName(), classId));
    }

    @GetMapping("/classes/{classId}/assessments")
    public ResponseEntity<List<com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse>> getAssessmentsByClass(
            Authentication authentication,
            @PathVariable Integer classId) {
        return ResponseEntity.ok(memberService.getAssessmentsByClass(authentication.getName(), classId));
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

    @PostMapping("/book-class/{classId}/with-package/{membershipId}")
    public ResponseEntity<String> bookClassUsingPackage(Authentication auth,@PathVariable Integer classId,@PathVariable Integer membershipId) {
        try {
            memberService.bookClassUsingPackage(auth.getName(),classId,membershipId);
            return ResponseEntity.ok("Course booked using package benefits.");
        } catch(RuntimeException error) { return ResponseEntity.badRequest().body(error.getMessage()); }
    }

    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.auth.repositories.UserRepository users;
    @GetMapping("/packages/{id}") public ResponseEntity<?> packageDetail(@PathVariable int id,Authentication auth){return ResponseEntity.ok(commerce.publicDetail(id,users.findByEmail(auth.getName()).orElseThrow().getUserId()));}
    @GetMapping("/my-packages/{id}") public ResponseEntity<?> purchasedDetail(@PathVariable int id,Authentication auth){return ResponseEntity.ok(commerce.purchasedDetail(auth.getName(),id));}
    @PostMapping("/add-package-to-cart/{packageId}")
    public ResponseEntity<?> addPackageToCart(Authentication authentication, @PathVariable Integer packageId) {
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
