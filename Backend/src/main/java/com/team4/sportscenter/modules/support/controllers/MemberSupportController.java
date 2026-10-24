package com.team4.sportscenter.modules.support.controllers;

import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.CancelClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
import com.team4.sportscenter.modules.support.dtos.response.TransferClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.UserCreditResponse;
import com.team4.sportscenter.modules.support.services.SupportRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/member/support")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MEMBER', 'Member')")
public class MemberSupportController {

    private final SupportRequestService supportRequestService;

    @GetMapping("/classes/{classId}/cancel-preview")
    public ResponseEntity<CancelClassPreviewResponse> getCancelClassPreview(
            @PathVariable Integer classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.getCancelClassPreview(classId, userDetails.getUsername()));
    }

    @PostMapping("/classes/{classId}/cancel-direct")
    public ResponseEntity<Map<String, Object>> cancelClassDirectly(
            @PathVariable Integer classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.cancelClassDirectly(classId, userDetails.getUsername()));
    }

    @GetMapping("/classes/{classId}/transfer-preview")
    public ResponseEntity<TransferClassPreviewResponse> getTransferClassPreview(
            @PathVariable Integer classId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.getTransferClassPreview(classId, userDetails.getUsername()));
    }

    @PostMapping("/classes/{fromClassId}/transfer-to/{toClassId}")
    public ResponseEntity<Map<String, Object>> transferClassDirectly(
            @PathVariable Integer fromClassId,
            @PathVariable Integer toClassId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.transferClassDirectly(fromClassId, toClassId, userDetails.getUsername()));
    }

    @PostMapping("/requests")
    public ResponseEntity<SupportRequestResponse> createSupportRequest(
            @Valid @RequestBody CreateSupportRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.createSupportRequest(request, userDetails.getUsername()));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<SupportRequestResponse>> getMemberRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.getMemberSupportRequests(userDetails.getUsername()));
    }

    @GetMapping("/credits")
    public ResponseEntity<List<UserCreditResponse>> getMemberCredits(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.getMemberCredits(userDetails.getUsername()));
    }

    @PutMapping("/requests/{requestId}/withdraw")
    public ResponseEntity<SupportRequestResponse> withdrawRequest(
            @PathVariable Integer requestId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.withdrawRequest(requestId, userDetails.getUsername()));
    }
}
