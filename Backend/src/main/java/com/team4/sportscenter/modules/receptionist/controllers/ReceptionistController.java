package com.team4.sportscenter.modules.receptionist.controllers;

import com.team4.sportscenter.modules.receptionist.dtos.request.CancelClassBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.EnrollClassRequest;
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
            return ResponseEntity.ok(memberService.confirmClassRenewal(request));
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
            return ResponseEntity.ok(memberService.subscribePackageForMember(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/checkin/rooms")
    public ResponseEntity<?> getFacilityRooms() {
        try {
            return ResponseEntity.ok(memberService.getFacilityRooms());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/checkin/history")
    public ResponseEntity<?> getCheckInHistory(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        try {
            return ResponseEntity.ok(memberService.getCheckInHistory(date, keyword, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> checkInMember(@RequestBody com.team4.sportscenter.modules.receptionist.dtos.request.MemberCheckInRequest request) {
        try {
            return ResponseEntity.ok(memberService.checkInMember(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/checkin/{checkInId}/checkout")
    public ResponseEntity<?> checkOutMember(@PathVariable Long checkInId) {
        try {
            return ResponseEntity.ok(memberService.checkOutMember(checkInId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/classes/available")
    public ResponseEntity<?> getAvailableClassesForMember(@RequestParam Integer userId) {
        try {
            return ResponseEntity.ok(memberService.getAvailableClassesForMember(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/classes/enroll")
    public ResponseEntity<?> enrollMemberToClass(@RequestBody EnrollClassRequest request) {
        try {
            return ResponseEntity.ok(memberService.enrollMemberToClass(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/classes/cancel-booking")
    public ResponseEntity<?> cancelBookingForMember(@RequestBody CancelClassBookingRequest request) {
        try {
            memberService.cancelBookingForMember(request);
            return ResponseEntity.ok("Session cancelled successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/classes/cancel-course")
    public ResponseEntity<?> cancelCourseForMember(@RequestBody CancelClassBookingRequest request) {
        try {
            int count = memberService.cancelCourseForMember(request);
            return ResponseEntity.ok("Cancelled " + count + " upcoming session(s) successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> getAllInvoices() {
        try {
            return ResponseEntity.ok(memberService.getAllInvoices());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/invoices/{invoiceId}")
    public ResponseEntity<?> getInvoiceReceipt(@PathVariable Integer invoiceId) {
        try {
            return ResponseEntity.ok(memberService.getInvoiceReceipt(invoiceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/members/{userId}/invoices")
    public ResponseEntity<?> getMemberInvoices(@PathVariable Integer userId) {
        try {
            return ResponseEntity.ok(memberService.getMemberInvoices(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}