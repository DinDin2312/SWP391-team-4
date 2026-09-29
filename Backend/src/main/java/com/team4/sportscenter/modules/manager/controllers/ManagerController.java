package com.team4.sportscenter.modules.manager.controllers;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests;
import com.team4.sportscenter.modules.manager.entities.AuditLog;
import com.team4.sportscenter.modules.manager.services.ManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {
    private final ManagerService managerService;

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() { return managerService.dashboard(); }

    @GetMapping("/users")
    public List<Map<String, Object>> users(@RequestParam(required = false) String keyword,
                                           @RequestParam(defaultValue = "ALL") String role,
                                           @RequestParam(defaultValue = "ALL") String status) {
        return managerService.users(keyword, role, status);
    }

    @GetMapping("/roles")
    public List<Map<String, Object>> roles() { return managerService.roles(); }

    @PostMapping("/users")
    public Map<String, Integer> createUser(@Valid @RequestBody ManagerRequests.UserRequest request, Authentication auth) {
        return Map.of("id", managerService.createUser(request, auth.getName()));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Void> updateUser(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.UserRequest request, Authentication auth) {
        managerService.updateUser(id, request, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<Void> updateUserStatus(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.UserStatusRequest request, Authentication auth) {
        managerService.updateUserStatus(id, request, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/subjects") public List<Map<String, Object>> subjects() { return managerService.subjects(); }
    @PostMapping("/subjects") public Map<String, Integer> createSubject(@Valid @RequestBody ManagerRequests.SubjectRequest request, Authentication auth) { return Map.of("id", managerService.saveSubject(null, request, auth.getName())); }
    @PutMapping("/subjects/{id}") public Map<String, Integer> updateSubject(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.SubjectRequest request, Authentication auth) { return Map.of("id", managerService.saveSubject(id, request, auth.getName())); }

    @GetMapping("/rooms") public List<Map<String, Object>> rooms() { return managerService.rooms(); }
    @PostMapping("/rooms") public Map<String, Integer> createRoom(@Valid @RequestBody ManagerRequests.RoomRequest request, Authentication auth) { return Map.of("id", managerService.saveRoom(null, request, auth.getName())); }
    @PutMapping("/rooms/{id}") public Map<String, Integer> updateRoom(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.RoomRequest request, Authentication auth) { return Map.of("id", managerService.saveRoom(id, request, auth.getName())); }

    @GetMapping("/classes") public List<Map<String, Object>> classes() { return managerService.classes(); }
    @PostMapping("/classes") public Map<String, Integer> createClass(@Valid @RequestBody ManagerRequests.ClassRequest request, Authentication auth) { return Map.of("id", managerService.saveClass(null, request, auth.getName())); }
    @PutMapping("/classes/{id}") public Map<String, Integer> updateClass(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.ClassRequest request, Authentication auth) { return Map.of("id", managerService.saveClass(id, request, auth.getName())); }

    @GetMapping("/schedules")
    public List<Map<String, Object>> schedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return managerService.schedules(from, to);
    }
    @PostMapping("/schedules") public Map<String, Integer> createSchedule(@Valid @RequestBody ManagerRequests.ScheduleRequest request, Authentication auth) { return Map.of("id", managerService.saveSchedule(null, request, auth.getName())); }
    @PostMapping("/schedules/series")
    public Map<String, List<Integer>> createScheduleSeries(@Valid @RequestBody ManagerRequests.ScheduleSeriesRequest request, Authentication auth) {
        return Map.of("ids", managerService.createScheduleSeries(request, auth.getName()));
    }

    @GetMapping("/schedules/{id}/bookings")
    public List<Map<String, Object>> scheduleBookings(@PathVariable Integer id) { return managerService.scheduleBookings(id); }
    @PutMapping("/schedules/{id}") public Map<String, Integer> updateSchedule(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.ScheduleRequest request, Authentication auth) { return Map.of("id", managerService.saveSchedule(id, request, auth.getName())); }

    @GetMapping("/packages") public List<Map<String, Object>> packages() { return managerService.packages(); }
    @PostMapping("/packages") public Map<String, Integer> createPackage(@Valid @RequestBody ManagerRequests.PackageRequest request, Authentication auth) { return Map.of("id", managerService.savePackage(null, request, auth.getName())); }
    @PutMapping("/packages/{id}") public Map<String, Integer> updatePackage(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.PackageRequest request, Authentication auth) { return Map.of("id", managerService.savePackage(id, request, auth.getName())); }

    @GetMapping("/reports")
    public Map<String, Object> reports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return managerService.report(from, to);
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> auditLogs() { return managerService.auditLogs(); }
}
