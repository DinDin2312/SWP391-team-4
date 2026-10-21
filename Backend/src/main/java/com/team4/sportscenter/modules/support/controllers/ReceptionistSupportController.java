package com.team4.sportscenter.modules.support.controllers;

import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.request.RespondSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import com.team4.sportscenter.modules.support.services.SupportRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/receptionist/support")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'CENTER_MANAGER')")
public class ReceptionistSupportController {

    private final SupportRequestService supportRequestService;

    @GetMapping("/requests")
    public ResponseEntity<Page<SupportRequestResponse>> searchRequests(
            @RequestParam(required = false) SupportStatus status,
            @RequestParam(required = false) SupportCategory category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(supportRequestService.searchRequestsForStaff(status, category, keyword, pageRequest));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(supportRequestService.getStaffSupportStats());
    }

    @PutMapping("/requests/{id}/respond")
    public ResponseEntity<SupportRequestResponse> respondToRequest(
            @PathVariable Integer id,
            @Valid @RequestBody RespondSupportRequest dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.respondToRequest(id, dto, userDetails.getUsername()));
    }

    @PostMapping("/requests/on-behalf/{memberUserId}")
    public ResponseEntity<SupportRequestResponse> createOnBehalf(
            @PathVariable Integer memberUserId,
            @Valid @RequestBody CreateSupportRequest dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(supportRequestService.createOnBehalfOfMember(memberUserId, dto, userDetails.getUsername()));
    }
}
