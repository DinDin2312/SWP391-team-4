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
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import jakarta.validation.Valid;

public final class ManagerRequests {
    private ManagerRequests() {
    }

    public record UserRequest(
            @NotBlank @Size(max = 255) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @Size(max = 30) String phone,
            @Pattern(regexp = "(?s)(|.{6,72})", message = "Password must contain between 6 and 72 characters") String password,
            @NotNull Integer roleId,
            @NotBlank String status,
            Boolean forcePasswordChange) {
        public UserRequest(String fullName, String email, String phone, String password, Integer roleId, String status) {
            this(fullName, email, phone, password, roleId, status, false);
        }
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
            @NotBlank @Size(max=100) String packageType,
            @NotNull @Min(1) Integer durationDays,
            @NotNull @DecimalMin("0") @Digits(integer = 8, fraction = 2) BigDecimal price,
            @jakarta.validation.Valid @Size(max=100) java.util.List<SubjectBenefitRequest> benefits,
            @Size(max=1000) String description, @Size(max=10000) String terms,
            @Min(1) Integer purchaseLimitPerMember, Boolean updatePurchaseLimit) {
        public PackageRequest(String name,String type,Integer days,BigDecimal price,java.util.List<SubjectBenefitRequest> benefits){this(name,type,days,price,benefits,null,null,null,null);}
        public PackageRequest(String packageName,String packageType,Integer durationDays,BigDecimal price) {
            this(packageName,packageType,durationDays,price,null,null,null,null,null);
        }
    }

    public record SubjectBenefitRequest(@NotNull @Min(1) Integer subjectId,@NotNull @Min(1) @Max(10000) Integer sessionLimit,
            @Size(max=100) java.util.List<@NotNull @Min(1) Integer> roomIds) {
        public SubjectBenefitRequest(Integer subjectId,Integer sessionLimit){this(subjectId,sessionLimit,null);}
    }
    public record PackageTypeRequest(@NotBlank @Size(max=255) String typeName,boolean requiresSubjects) {}

    public record ScheduleSeriesRequest(
            @NotNull Integer classId,
            @NotNull LocalDateTime startTime,
            @NotNull LocalDateTime endTime,
            @NotNull @Min(2) @Max(52) Integer occurrences,
            @NotNull @Min(1) @Max(4) Integer intervalWeeks) {
    }

    public record SchedulePlanRequest(
            @NotNull Integer classId,
            @NotNull LocalDate fromDate, @NotNull LocalDate toDate,
            @NotNull @Min(1) @Max(52) Integer sessions,
            @NotNull @Min(15) @Max(240) Integer durationMinutes,
            @NotNull @Size(min=1, max=7) List<@NotNull @Min(1) @Max(7) Integer> weekdays,
            @NotNull LocalTime availableFrom, @NotNull LocalTime availableTo,
            @NotNull LocalTime preferredTime,
            @NotNull @Min(0) @Max(120) Integer breakMinutes,
            @NotNull @Size(max=366) List<@NotNull LocalDate> excludedDates) { }

    public record PlannedSession(@NotNull LocalDateTime startTime, @NotNull LocalDateTime endTime) { }

    public record SchedulePlanCommitRequest(
            @NotNull @Valid SchedulePlanRequest rules,
            @NotNull Integer coachId, @NotNull Integer roomId,
            @NotNull @Size(min=1, max=52) List<@NotNull @Valid PlannedSession> sessions) { }
}
