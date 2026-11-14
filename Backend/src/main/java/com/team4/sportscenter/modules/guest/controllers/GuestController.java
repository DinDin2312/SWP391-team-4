package com.team4.sportscenter.modules.guest.controllers;

import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.AvailableScheduleResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import com.team4.sportscenter.modules.member.entities.Package;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.PackageRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import com.team4.sportscenter.modules.member.services.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/guest")
@RequiredArgsConstructor
public class GuestController {

    @Qualifier("memberPackageRepository")
    private final PackageRepository packageRepository;
    
    private final ScheduleRepository scheduleRepository;
    private final BookingRepository bookingRepository;
    private final MemberService memberService;
    private final com.team4.sportscenter.modules.member.services.PackageBenefitsService packageBenefits;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;

    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    @GetMapping("/packages/{id}") public ResponseEntity<?> detail(@org.springframework.web.bind.annotation.PathVariable int id){return ResponseEntity.ok(commerce.publicDetail(id,null));}
    @GetMapping("/packages")
    public ResponseEntity<List<PackageResponse>> getPackages() {
        List<Package> packages = packageRepository.findAll();
        var allBenefits=packageBenefits.allPackageBenefits();
        var typeNames=packageTypes.names();
        List<PackageResponse> response = packages.stream()
                .filter(pkg -> "SELLING".equals(pkg.getSellingStatus()) && !"AI_ACCESS".equalsIgnoreCase(pkg.getPackageType()))
                .map(pkg -> PackageResponse.builder()
                        .packageId(pkg.getPackageId())
                        .packageName(pkg.getPackageName())
                        .packageType(pkg.getPackageType())
                        .packageTypeName(typeNames.get(pkg.getPackageType()))
                        .durationDays(pkg.getDurationDays())
                        .price(pkg.getPrice())
                        .purchaseLimitPerMember(pkg.getPurchaseLimitPerMember())
                        .benefits(allBenefits.getOrDefault(pkg.getPackageId(),List.of()))
                        .imagePath(pkg.getImagePath())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/classes")
    public ResponseEntity<List<AvailableClassResponse>> getClasses() {
        return ResponseEntity.ok(memberService.getAvailableClasses(null));
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<AvailableScheduleResponse>> getSchedules() {
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(LocalDateTime.now());
        Map<Integer, Integer> bookedSlotsBySchedule = bookingRepository.countAllBookedSlotsGroupedBySchedule().stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).intValue()
                ));
        List<AvailableScheduleResponse> response = schedules.stream()
                .map(schedule -> AvailableScheduleResponse.builder()
                        .scheduleId(schedule.getScheduleId())
                        .className(schedule.getGymClass().getClassName())
                        .coachName(schedule.getGymClass().getCoach().getFullName())
                        .roomName(schedule.getGymClass().getRoom().getRoomName())
                        .startTime(schedule.getStartTime())
                        .endTime(schedule.getEndTime())
                        .maxSlots(schedule.getGymClass().getMaxSlots())
                        .price(schedule.getGymClass().getPrice())
                        .bookedSlots(bookedSlotsBySchedule.getOrDefault(schedule.getScheduleId(), 0))
                        .isBookedByMe(false) // Always false for public guest
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
