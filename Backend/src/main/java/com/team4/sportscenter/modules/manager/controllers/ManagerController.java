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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerController {
    private final ManagerService managerService;

    @PostMapping(value = "/{resource}/{id}/image", consumes = "multipart/form-data")
    public Map<String, String> updateResourceImage(@PathVariable String resource, @PathVariable Integer id,
                                                   @RequestPart("image") MultipartFile image, Authentication auth) {
        String path = managerService.updateResourceImage(resource, id, image, auth.getName());
        return Map.of("imagePath", path, "imageUrl", "/api/resource-images/" + path);
    }

    @DeleteMapping("/{resource}/{id}/image")
    public ResponseEntity<Void> removeResourceImage(@PathVariable String resource, @PathVariable Integer id, Authentication auth) {
        managerService.removeResourceImage(resource, id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() { return managerService.dashboard(); }

    @GetMapping("/dashboard/attention")
    public Map<String,Object> attention(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="6") int size) { return managerService.overviewPage("attention",page,size); }
    @GetMapping("/dashboard/renewals")
    public Map<String,Object> renewals(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="6") int size) { return managerService.overviewPage("renewals",page,size); }

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

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id, Authentication auth) {
        managerService.deleteUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/users/{id}/avatar", consumes = "multipart/form-data")
    public Map<String, String> updateUserAvatar(@PathVariable Integer id,
                                                @RequestPart("avatar") MultipartFile avatar,
                                                Authentication auth) {
        String avatarPath = managerService.updateUserAvatar(id, avatar, auth.getName());
        return Map.of("avatarPath", avatarPath, "avatarUrl", "/api/avatars/" + avatarPath);
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue="false") boolean lowRegistration,
            @RequestParam(required=false) String status,
            @RequestParam(defaultValue="false") boolean excludeUrgent) {
        if(lowRegistration || excludeUrgent || status!=null) return managerService.filteredSchedules(from,to,lowRegistration,status,excludeUrgent);
        return managerService.schedules(from, to);
    }
    @PostMapping("/schedules") public Map<String, Integer> createSchedule(@Valid @RequestBody ManagerRequests.ScheduleRequest request, Authentication auth) { return Map.of("id", managerService.saveSchedule(null, request, auth.getName())); }
    @PostMapping("/schedules/series")
    public Map<String, List<Integer>> createScheduleSeries(@Valid @RequestBody ManagerRequests.ScheduleSeriesRequest request, Authentication auth) {
        return Map.of("ids", managerService.createScheduleSeries(request, auth.getName()));
    }

    @GetMapping("/schedules/{id}/bookings")
    public List<Map<String, Object>> scheduleBookings(@PathVariable Integer id) { return managerService.scheduleBookings(id); }

    @PostMapping("/schedules/plan/preview")
    public Map<String,Object> previewSchedulePlan(@Valid @RequestBody ManagerRequests.SchedulePlanRequest request) {
        return managerService.previewSchedulePlan(request);
    }

    @PostMapping("/schedules/plan")
    public Map<String,List<Integer>> commitSchedulePlan(@Valid @RequestBody ManagerRequests.SchedulePlanCommitRequest request, Authentication auth) {
        return Map.of("ids",managerService.commitSchedulePlan(request,auth.getName()));
    }
    @PutMapping("/schedules/{id}") public Map<String, Integer> updateSchedule(@PathVariable Integer id, @Valid @RequestBody ManagerRequests.ScheduleRequest request, Authentication auth) { return Map.of("id", managerService.saveSchedule(id, request, auth.getName())); }

    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    @GetMapping("/packages/{id}") public Map<String,Object> packageDetail(@PathVariable int id){return commerce.detail(id);}
    @GetMapping("/packages/{id}/history") public Map<String,Object> packageHistory(@PathVariable int id,@RequestParam(defaultValue="1") int page){return commerce.history(id,page);}
    @PatchMapping("/packages/{id}/selling-status") public ResponseEntity<Void> selling(@PathVariable int id,@RequestBody Map<String,String> body,Authentication auth){commerce.selling(id,body.getOrDefault("status",""),auth.getName());return ResponseEntity.noContent().build();}
    @GetMapping("/packages") public List<Map<String, Object>> packages() { return managerService.packages(); }
    @PostMapping(value="/packages/with-image",consumes="multipart/form-data")
    public Map<String,Integer> createPackageWithImage(@Valid @RequestPart("details") ManagerRequests.PackageRequest details,
            @RequestPart(value="image",required=false) MultipartFile image,@RequestParam(defaultValue="false") boolean removeImage,Authentication auth) {
        return Map.of("id",managerService.savePackageWithImage(null,details,image,removeImage,auth.getName()));
    }
    @PutMapping(value="/packages/{id}/with-image",consumes="multipart/form-data")
    public Map<String,Integer> updatePackageWithImage(@PathVariable Integer id,@Valid @RequestPart("details") ManagerRequests.PackageRequest details,
            @RequestPart(value="image",required=false) MultipartFile image,@RequestParam(defaultValue="false") boolean removeImage,Authentication auth) {
        return Map.of("id",managerService.savePackageWithImage(id,details,image,removeImage,auth.getName()));
    }
    @GetMapping("/package-types") public List<Map<String,Object>> packageTypes(){return managerService.packageTypes();}
    @PostMapping("/package-types") public Map<String,String> createPackageType(@Valid @RequestBody ManagerRequests.PackageTypeRequest request,Authentication auth){return Map.of("typeCode",managerService.savePackageType(null,request,auth.getName()));}
    @PutMapping("/package-types/{code}") public Map<String,String> renamePackageType(@PathVariable String code,@Valid @RequestBody ManagerRequests.PackageTypeRequest request,Authentication auth){return Map.of("typeCode",managerService.savePackageType(code,request,auth.getName()));}
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
