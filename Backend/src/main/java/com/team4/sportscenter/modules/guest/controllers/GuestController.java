package com.team4.sportscenter.modules.guest.controllers;

import com.team4.sportscenter.modules.member.dtos.response.AvailableScheduleResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import com.team4.sportscenter.modules.member.entities.Package;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.PackageRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/guest")
@RequiredArgsConstructor
public class GuestController {

    @Qualifier("memberPackageRepository")
    private final PackageRepository packageRepository;
    
    private final ScheduleRepository scheduleRepository;

    @GetMapping("/packages")
    public ResponseEntity<List<PackageResponse>> getPackages() {
        List<Package> packages = packageRepository.findAll();
        List<PackageResponse> response = packages.stream()
                .map(pkg -> PackageResponse.builder()
                        .packageId(pkg.getPackageId())
                        .packageName(pkg.getPackageName())
                        .packageType(pkg.getPackageType())
                        .durationDays(pkg.getDurationDays())
                        .price(pkg.getPrice())
                        .description("") // Package entity doesn't have description
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<AvailableScheduleResponse>> getSchedules() {
        List<Schedule> schedules = scheduleRepository.findAvailableSchedules(LocalDateTime.now());
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
                        .bookedSlots(0) // Mock for public view
                        .isBookedByMe(false) // Always false for public guest
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
}
