package com.team4.sportscenter.modules.receptionist.controllers;

import com.team4.sportscenter.modules.receptionist.dtos.response.MemberDetailResponse;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberMembershipDetail;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberSummaryResponse;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/receptionist")
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
}