package com.team4.sportscenter.modules.manager.controllers;

import com.team4.sportscenter.modules.coach.dtos.RescheduleRequestResponseDto;
import com.team4.sportscenter.modules.coach.services.ScheduleRescheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/manager/reschedule-requests")
@RequiredArgsConstructor
public class ManagerRescheduleController {

    private final ScheduleRescheduleService scheduleRescheduleService;

    @GetMapping
    public ResponseEntity<List<RescheduleRequestResponseDto>> getAllRequests(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(scheduleRescheduleService.getAllRequestsForManager(status));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<RescheduleRequestResponseDto> getRequestDetails(@PathVariable Integer requestId) {
        return ResponseEntity.ok(scheduleRescheduleService.getRequestDetails(requestId));
    }

    // Approve: JSON body
    @RequestMapping(value = "/{requestId}/approve", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RescheduleRequestResponseDto> approveRequestJson(
            @PathVariable Integer requestId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        Integer customMinAttendees = null;
        Integer deadlineHoursBefore = null;
        String adminNote = null;

        if (body != null) {
            if (body.get("minAttendees") != null) {
                try { customMinAttendees = Integer.parseInt(body.get("minAttendees").toString()); } catch (Exception ignored) {}
            } else if (body.get("customMinAttendees") != null) {
                try { customMinAttendees = Integer.parseInt(body.get("customMinAttendees").toString()); } catch (Exception ignored) {}
            }

            if (body.get("deadlineHoursBefore") != null) {
                try { deadlineHoursBefore = Integer.parseInt(body.get("deadlineHoursBefore").toString()); } catch (Exception ignored) {}
            }

            if (body.get("adminNote") != null) {
                adminNote = body.get("adminNote").toString();
            }
        }

        return ResponseEntity.ok(scheduleRescheduleService.approveRequest(
                requestId, customMinAttendees, deadlineHoursBefore, adminNote, authentication.getName()));
    }

    // Approve: Form URL-encoded / Query params
    @RequestMapping(value = "/{requestId}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<RescheduleRequestResponseDto> approveRequestParams(
            @PathVariable Integer requestId,
            @RequestParam(required = false) Integer customMinAttendees,
            @RequestParam(required = false) Integer deadlineHoursBefore,
            @RequestParam(required = false) String adminNote,
            Authentication authentication) {
        return ResponseEntity.ok(scheduleRescheduleService.approveRequest(
                requestId, customMinAttendees, deadlineHoursBefore, adminNote, authentication.getName()));
    }

    // Reject: JSON body
    @RequestMapping(value = "/{requestId}/reject", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RescheduleRequestResponseDto> rejectRequestJson(
            @PathVariable Integer requestId,
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        String finalReason = "";
        if (body != null) {
            if (body.get("reason") != null) finalReason = body.get("reason").toString();
            else if (body.get("rejectionReason") != null) finalReason = body.get("rejectionReason").toString();
        }
        return ResponseEntity.ok(scheduleRescheduleService.rejectRequest(requestId, finalReason, authentication.getName()));
    }

    // Reject: Form URL-encoded / Query params
    @RequestMapping(value = "/{requestId}/reject", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<RescheduleRequestResponseDto> rejectRequestParams(
            @PathVariable Integer requestId,
            @RequestParam(required = false) String rejectionReason,
            @RequestParam(required = false) String reason,
            Authentication authentication) {
        String finalReason = (rejectionReason != null && !rejectionReason.isEmpty()) ? rejectionReason : (reason != null ? reason : "");
        return ResponseEntity.ok(scheduleRescheduleService.rejectRequest(requestId, finalReason, authentication.getName()));
    }

    // Assign Substitute: JSON body
    @RequestMapping(value = "/assign-substitute", method = {RequestMethod.POST, RequestMethod.PUT}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RescheduleRequestResponseDto> assignSubstituteJson(
            @RequestBody(required = false) Map<String, Object> body,
            Authentication authentication) {
        Integer requestId = null;
        Integer scheduleId = null;
        Integer substituteCoachId = null;
        String managerNote = null;

        if (body != null) {
            if (body.get("requestId") != null) {
                try { requestId = Integer.parseInt(body.get("requestId").toString()); } catch (Exception ignored) {}
            }
            if (body.get("scheduleId") != null) {
                try { scheduleId = Integer.parseInt(body.get("scheduleId").toString()); } catch (Exception ignored) {}
            }
            if (body.get("substituteCoachId") != null) {
                try { substituteCoachId = Integer.parseInt(body.get("substituteCoachId").toString()); } catch (Exception ignored) {}
            }
            if (body.get("managerNote") != null) {
                managerNote = body.get("managerNote").toString();
            }
        }

        if (substituteCoachId == null || (scheduleId == null && requestId == null)) {
            throw new IllegalArgumentException("Vui lòng cung cấp substituteCoachId và scheduleId/requestId.");
        }

        return ResponseEntity.ok(scheduleRescheduleService.assignSubstituteCoachDirectly(
                requestId, scheduleId, substituteCoachId, managerNote, authentication.getName()));
    }

    // Assign Substitute: Form URL-encoded / Query params
    @RequestMapping(value = "/assign-substitute", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<RescheduleRequestResponseDto> assignSubstituteParams(
            @RequestParam(required = false) Integer requestId,
            @RequestParam(required = false) Integer scheduleId,
            @RequestParam(required = false) Integer substituteCoachId,
            @RequestParam(required = false) String managerNote,
            Authentication authentication) {
        if (substituteCoachId == null || (scheduleId == null && requestId == null)) {
            throw new IllegalArgumentException("Vui lòng cung cấp substituteCoachId và scheduleId/requestId.");
        }

        return ResponseEntity.ok(scheduleRescheduleService.assignSubstituteCoachDirectly(
                requestId, scheduleId, substituteCoachId, managerNote, authentication.getName()));
    }

    @GetMapping("/available-coaches")
    public ResponseEntity<List<Map<String, Object>>> getAvailableCoaches(
            @RequestParam Integer scheduleId) {
        return ResponseEntity.ok(scheduleRescheduleService.getAvailableCoachesForSchedule(scheduleId));
    }
}
