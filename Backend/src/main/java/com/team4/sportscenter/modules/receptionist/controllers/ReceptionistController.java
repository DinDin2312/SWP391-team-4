package com.team4.sportscenter.modules.receptionist.controllers;

import com.team4.sportscenter.modules.receptionist.dtos.request.MemberRegisterRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.RenewBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberDetailResponse;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberMembershipDetail;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberSummaryResponse;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/receptionist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReceptionistController {

    private final ReceptionistMemberService memberService;

    // Khớp với receptionistService.searchMembers ở Front-end
    @GetMapping("/members/search")
    public ResponseEntity<List<MemberSummaryResponse>> searchMembers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String membershipFilter) {
        return ResponseEntity.ok(memberService.searchMembers(keyword, status, membershipFilter));
    }

    // Khớp với receptionistService.getMemberDetail ở Front-end
    @GetMapping("/members/{userId}")
    public ResponseEntity<MemberDetailResponse> getMemberDetail(@PathVariable Integer userId) {
        return ResponseEntity.ok(memberService.getMemberDetail(userId));
    }

    // Khớp với receptionistService.getMemberMemberships ở Front-end
    @GetMapping("/members/{userId}/memberships")
    public ResponseEntity<List<MemberMembershipDetail>> getMemberMemberships(@PathVariable Integer userId) {
        return ResponseEntity.ok(memberService.getMemberMemberships(userId));
    }

    @PostMapping("/members/register")
    public ResponseEntity<?> registerMember(@RequestBody MemberRegisterRequest request) {
        try {
            memberService.registerMember(request);
            return ResponseEntity.ok("Member registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while creating member account.");
        }
    }

    @GetMapping("/classes/suggest-renewal")
    public ResponseEntity<?> suggestNextClassRenewal(
            @RequestParam Integer userId,
            @RequestParam Integer bookingId) {
        try {
            return ResponseEntity.ok(memberService.suggestNextClassRenewal(userId, bookingId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/classes/confirm-renewal")
    public ResponseEntity<?> confirmClassRenewal(@RequestBody RenewBookingRequest request) {
        try {
            memberService.confirmClassRenewal(request);
            return ResponseEntity.ok("Course renewed and enrolled successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/packages")
    public ResponseEntity<?> getAllPackages() {
        try {
            return ResponseEntity.ok(memberService.getAllActivePackages());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/packages/subscribe")
    public ResponseEntity<?> subscribePackage(@RequestBody SubscribePackageRequest request) {
        try {
            memberService.subscribePackageForMember(request);
            return ResponseEntity.ok("Combo package subscribed successfully!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}