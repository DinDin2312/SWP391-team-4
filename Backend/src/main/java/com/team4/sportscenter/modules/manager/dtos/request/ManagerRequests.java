package com.team4.sportscenter.modules.manager.dtos.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class ManagerRequests {
    private ManagerRequests() {
    }

    public record UserRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            String phone,
            @Size(min = 6) String password,
            @NotNull Integer roleId,
            @NotBlank String status) {
    }

    public record UserStatusRequest(@NotBlank String status) {
    }

    public record SubjectRequest(@NotBlank String subjectName, String description) {
    }

    public record RoomRequest(@NotBlank String roomName, @NotNull @Min(1) Integer capacity) {
    }

    public record ClassRequest(
            @NotBlank String className,
            @NotNull Integer subjectId,
            @NotNull Integer coachId,
            @NotNull Integer roomId,
            @NotNull @DecimalMin("0") BigDecimal price,
            @NotNull @Min(1) Integer maxSlots,
            @NotBlank String status) {
    }

    public record ScheduleRequest(
            @NotNull Integer classId,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @NotBlank String status) {
    }

    public record PackageRequest(
            @NotBlank String packageName,
            @NotBlank String packageType,
            @NotNull @Min(1) Integer durationDays,
            @NotNull @DecimalMin("0") BigDecimal price) {
    }
}
