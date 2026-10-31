package com.team4.sportscenter.modules.receptionist.lostandfound.controllers;

import com.team4.sportscenter.modules.receptionist.lostandfound.dtos.*;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemCategory;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ItemStatus;
import com.team4.sportscenter.modules.receptionist.lostandfound.enums.ValuationType;
import com.team4.sportscenter.modules.receptionist.lostandfound.services.LostAndFoundService;
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

@RestController
@RequestMapping("/api/receptionist/lost-and-found")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'CENTER_MANAGER')")
public class LostAndFoundController {

    private final LostAndFoundService lostAndFoundService;

    @GetMapping("/items")
    public ResponseEntity<Page<LostItemResponse>> searchItems(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) ItemCategory category,
            @RequestParam(required = false) ValuationType valuationType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(lostAndFoundService.searchItems(keyword, status, category, valuationType, pageRequest));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<LostItemResponse> getItemById(@PathVariable Integer id) {
        return ResponseEntity.ok(lostAndFoundService.getItemById(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<LostAndFoundStatsResponse> getStats() {
        return ResponseEntity.ok(lostAndFoundService.getStats());
    }

    @PostMapping("/items")
    public ResponseEntity<LostItemResponse> createItem(
            @Valid @RequestBody CreateLostItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String staffEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(lostAndFoundService.createItem(request, staffEmail));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<LostItemResponse> updateItem(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateLostItemRequest request) {
        return ResponseEntity.ok(lostAndFoundService.updateItem(id, request));
    }

    @PostMapping("/items/{id}/claim")
    public ResponseEntity<LostItemResponse> claimItem(
            @PathVariable Integer id,
            @Valid @RequestBody ClaimItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String staffEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(lostAndFoundService.claimItem(id, request, staffEmail));
    }

    @PostMapping("/items/{id}/dispose")
    public ResponseEntity<LostItemResponse> disposeItem(
            @PathVariable Integer id,
            @Valid @RequestBody DisposeItemRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String staffEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(lostAndFoundService.disposeItem(id, request, staffEmail));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Integer id) {
        lostAndFoundService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}

