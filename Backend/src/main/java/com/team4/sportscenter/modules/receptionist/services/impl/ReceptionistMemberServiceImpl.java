package com.team4.sportscenter.modules.receptionist.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberBookingDetail;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberDetailResponse;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberMembershipDetail;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberSummaryResponse;
import com.team4.sportscenter.modules.receptionist.repositories.ReceptionistBookingRepository;
import com.team4.sportscenter.modules.receptionist.repositories.ReceptionistUserMembershipRepository;
import com.team4.sportscenter.modules.receptionist.repositories.ReceptionistUserRepository;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReceptionistMemberServiceImpl implements ReceptionistMemberService {

    private final ReceptionistUserRepository userRepository;
    private final ReceptionistUserMembershipRepository userMembershipRepository;
    private final ReceptionistBookingRepository bookingRepository;

    @Override
    public List<MemberSummaryResponse> searchMembers(String keyword, String status, String membershipFilter) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim().toUpperCase() : null;

        List<User> members = userRepository.searchMembers(cleanKeyword, cleanStatus);
        LocalDate today = LocalDate.now();

        List<MemberSummaryResponse> results = new ArrayList<>();

        for (User user : members) {
            List<UserMembership> memberships = userMembershipRepository.findByUser_UserId(user.getUserId());

            UserMembership activeMembership = null;
            UserMembership latestMembership = memberships.isEmpty() ? null : memberships.get(0);

            for (UserMembership um : memberships) {
                if ("ACTIVE".equalsIgnoreCase(um.getStatus())) {
                    if (um.getEndDate() == null || !um.getEndDate().isBefore(today)) {
                        activeMembership = um;
                        break;
                    }
                }
            }

            String currentMembershipStatus = "NO_MEMBERSHIP";
            Integer currentMembershipId = null;
            String currentPackageName = null;
            String currentPackageType = null;
            LocalDate startDate = null;
            LocalDate endDate = null;
            Long daysRemaining = 0L;

            if (activeMembership != null) {
                currentMembershipStatus = "ACTIVE";
                currentMembershipId = activeMembership.getMembershipId();
                if (activeMembership.getAPackage() != null) {
                    currentPackageName = activeMembership.getAPackage().getPackageName();
                    currentPackageType = activeMembership.getAPackage().getPackageType();
                }
                startDate = activeMembership.getStartDate();
                endDate = activeMembership.getEndDate();
                if (endDate != null) {
                    daysRemaining = ChronoUnit.DAYS.between(today, endDate);
                    if (daysRemaining < 0) daysRemaining = 0L;
                }
            } else if (latestMembership != null) {
                currentMembershipStatus = "EXPIRED";
                currentMembershipId = latestMembership.getMembershipId();
                if (latestMembership.getAPackage() != null) {
                    currentPackageName = latestMembership.getAPackage().getPackageName();
                    currentPackageType = latestMembership.getAPackage().getPackageType();
                }
                startDate = latestMembership.getStartDate();
                endDate = latestMembership.getEndDate();
                daysRemaining = 0L;
            }

            // Apply membershipFilter if requested
            if (membershipFilter != null && !membershipFilter.trim().isEmpty() && !membershipFilter.equalsIgnoreCase("ALL")) {
                if (!currentMembershipStatus.equalsIgnoreCase(membershipFilter.trim())) {
                    continue; // Skip members that don't match membership filter
                }
            }

            Long totalBookings = bookingRepository.countByUserId(user.getUserId());

            results.add(MemberSummaryResponse.builder()
                    .userId(user.getUserId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .status(user.getStatus())
                    .bio(user.getBio())
                    .currentMembershipId(currentMembershipId)
                    .currentPackageName(currentPackageName)
                    .currentPackageType(currentPackageType)
                    .membershipStartDate(startDate)
                    .membershipEndDate(endDate)
                    .membershipStatus(currentMembershipStatus)
                    .daysRemaining(daysRemaining)
                    .totalBookings(totalBookings != null ? totalBookings : 0L)
                    .build());
        }

        return results;
    }

    @Override
    public MemberDetailResponse getMemberDetail(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hội viên với mã ID: " + userId));

        // Ensure user is Member
        if (user.getRole() == null || (!"Member".equalsIgnoreCase(user.getRole().getRoleName()) && user.getRole().getRoleId() != 4)) {
            throw new RuntimeException("Tài khoản này không phải là hội viên (Member).");
        }

        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();

        // 1. Memberships
        List<UserMembership> memberships = userMembershipRepository.findByUser_UserId(userId);
        List<MemberMembershipDetail> membershipDetails = memberships.stream().map(um -> {
            boolean isActive = "ACTIVE".equalsIgnoreCase(um.getStatus()) && (um.getEndDate() == null || !um.getEndDate().isBefore(today));
            long remaining = 0L;
            if (um.getEndDate() != null) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate());
                if (remaining < 0) remaining = 0L;
            }
            return MemberMembershipDetail.builder()
                    .membershipId(um.getMembershipId())
                    .packageId(um.getAPackage() != null ? um.getAPackage().getPackageId() : null)
                    .packageName(um.getAPackage() != null ? um.getAPackage().getPackageName() : "N/A")
                    .packageType(um.getAPackage() != null ? um.getAPackage().getPackageType() : "N/A")
                    .durationDays(um.getAPackage() != null ? um.getAPackage().getDurationDays() : null)
                    .price(um.getAPackage() != null ? um.getAPackage().getPrice() : null)
                    .startDate(um.getStartDate())
                    .endDate(um.getEndDate())
                    .status(um.getStatus())
                    .daysRemaining(remaining)
                    .active(isActive)
                    .build();
        }).collect(Collectors.toList());

        // Find active or latest
        MemberMembershipDetail currentActive = membershipDetails.stream()
                .filter(MemberMembershipDetail::getActive)
                .findFirst()
                .orElse(null);

        String currentStatus = "NO_MEMBERSHIP";
        String currentPkgName = null;
        String currentPkgType = null;
        Long daysRemaining = 0L;

        if (currentActive != null) {
            currentStatus = "ACTIVE";
            currentPkgName = currentActive.getPackageName();
            currentPkgType = currentActive.getPackageType();
            daysRemaining = currentActive.getDaysRemaining();
        } else if (!membershipDetails.isEmpty()) {
            currentStatus = "EXPIRED";
            currentPkgName = membershipDetails.get(0).getPackageName();
            currentPkgType = membershipDetails.get(0).getPackageType();
            daysRemaining = 0L;
        }

        // 2. Bookings
        List<Booking> bookings = bookingRepository.findByUserIdWithDetails(userId);
        int attendedCount = 0;
        int absentCount = 0;
        int upcomingCount = 0;

        List<MemberBookingDetail> bookingDetails = new ArrayList<>();
        for (Booking b : bookings) {
            Schedule s = b.getSchedule();
            String className = (s != null && s.getGymClass() != null) ? s.getGymClass().getClassName() : "N/A";
            String coachName = (s != null && s.getGymClass() != null && s.getGymClass().getCoach() != null)
                    ? s.getGymClass().getCoach().getFullName() : "N/A";
            String coachEmail = (s != null && s.getGymClass() != null && s.getGymClass().getCoach() != null)
                    ? s.getGymClass().getCoach().getEmail() : null;
            String roomName = (s != null && s.getGymClass() != null && s.getGymClass().getRoom() != null)
                    ? s.getGymClass().getRoom().getRoomName() : "N/A";

            if ("PRESENT".equalsIgnoreCase(b.getAttendanceStatus())) {
                attendedCount++;
            } else if ("ABSENT".equalsIgnoreCase(b.getAttendanceStatus())) {
                absentCount++;
            }

            if (s != null && s.getStartTime() != null && s.getStartTime().isAfter(now) && "CONFIRMED".equalsIgnoreCase(b.getStatus())) {
                upcomingCount++;
            }

            bookingDetails.add(MemberBookingDetail.builder()
                    .bookingId(b.getBookingId())
                    .scheduleId(s != null ? s.getScheduleId() : null)
                    .classId(s != null && s.getGymClass() != null ? s.getGymClass().getClassId() : null)
                    .className(className)
                    .coachName(coachName)
                    .coachEmail(coachEmail)
                    .roomName(roomName)
                    .startTime(s != null ? s.getStartTime() : null)
                    .endTime(s != null ? s.getEndTime() : null)
                    .bookingStatus(b.getStatus())
                    .attendanceStatus(b.getAttendanceStatus())
                    .bookingTime(b.getBookingTime())
                    .build());
        }

        return MemberDetailResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(user.getStatus())
                .bio(user.getBio())
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "Member")
                .currentPackageName(currentPkgName)
                .currentPackageType(currentPkgType)
                .currentMembershipStatus(currentStatus)
                .daysRemaining(daysRemaining)
                .totalBookingsCount(bookings.size())
                .attendedCount(attendedCount)
                .absentCount(absentCount)
                .upcomingCount(upcomingCount)
                .memberships(membershipDetails)
                .bookings(bookingDetails)
                .build();
    }

    @Override
    public List<MemberMembershipDetail> getMemberMemberships(Integer userId) {
        LocalDate today = LocalDate.now();
        List<UserMembership> memberships = userMembershipRepository.findByUser_UserId(userId);
        return memberships.stream().map(um -> {
            boolean isActive = "ACTIVE".equalsIgnoreCase(um.getStatus()) && (um.getEndDate() == null || !um.getEndDate().isBefore(today));
            long remaining = 0L;
            if (um.getEndDate() != null) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate());
                if (remaining < 0) remaining = 0L;
            }
            return MemberMembershipDetail.builder()
                    .membershipId(um.getMembershipId())
                    .packageId(um.getAPackage() != null ? um.getAPackage().getPackageId() : null)
                    .packageName(um.getAPackage() != null ? um.getAPackage().getPackageName() : "N/A")
                    .packageType(um.getAPackage() != null ? um.getAPackage().getPackageType() : "N/A")
                    .durationDays(um.getAPackage() != null ? um.getAPackage().getDurationDays() : null)
                    .price(um.getAPackage() != null ? um.getAPackage().getPrice() : null)
                    .startDate(um.getStartDate())
                    .endDate(um.getEndDate())
                    .status(um.getStatus())
                    .daysRemaining(remaining)
                    .active(isActive)
                    .build();
        }).collect(Collectors.toList());
    }
}
