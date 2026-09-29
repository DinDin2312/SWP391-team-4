package com.team4.sportscenter.modules.manager.dtos.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Digits;
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
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 30) String phone,
            @Pattern(regexp = "(?s)(|.{6,72})", message = "Password must contain between 6 and 72 characters") String password,
            @NotNull Integer roleId,
            @NotBlank String status) {
    }

    public record UserStatusRequest(@NotBlank String status, @Size(max = 500) String reason) {
    }

    public record SubjectRequest(@NotBlank @Size(max = 255) String subjectName, @Size(max = 10000) String description) {
    }

    public record RoomRequest(@NotBlank @Size(max = 255) String roomName, @NotNull @Min(1) Integer capacity) {
    }

    public record ClassRequest(
            @NotBlank @Size(max = 255) String className,
            @NotNull Integer subjectId,
            @NotNull Integer coachId,
            @NotNull Integer roomId,
            @NotNull @DecimalMin("0") @Digits(integer = 8, fraction = 2) BigDecimal price,
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
            @NotBlank @Size(max = 255) String packageName,
            @NotBlank @Pattern(regexp = "GYM_ACCESS|AI_ACCESS|PREMIUM", message = "Invalid package type") String packageType,
            @NotNull @Min(1) Integer durationDays,
            @NotNull @DecimalMin("0") @Digits(integer = 8, fraction = 2) BigDecimal price) {
    }

    public record ScheduleSeriesRequest(
            @NotNull Integer classId,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @NotNull @Min(2) @Max(52) Integer occurrences,
            @NotNull @Min(1) @Max(4) Integer intervalWeeks) {
    }
}
