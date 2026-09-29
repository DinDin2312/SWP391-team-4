package com.team4.sportscenter.modules.receptionist.services.impl;

import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.RoleRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.member.repositories.UserMembershipRepository;
import com.team4.sportscenter.modules.receptionist.dtos.request.MemberRegisterRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.RenewBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest;
import com.team4.sportscenter.modules.receptionist.dtos.response.*;
import com.team4.sportscenter.modules.receptionist.repositories.*;
import com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService;
import com.team4.sportscenter.modules.member.entities.Package;
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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final ReceptionistUserRepository userRepository;
    private final ReceptionistUserMembershipRepository userMembershipRepository;
    private final ReceptionistBookingRepository bookingRepository;
    private final ReceptionistPackageRepository packageRepository;


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

    @Override
    @Transactional
    public void registerMember(MemberRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("This email address is already registered in the system.");
        }

        Role memberRole = roleRepository.findById(4)
                .orElseGet(() -> roleRepository.findByRoleName("Member")
                        .orElseThrow(() -> new RuntimeException("Role 'Member' not found.")));

        User newUser = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getDefaultPassword()))
                .bio(request.getBio())
                .role(memberRole)
                .status("ACTIVE")
                .build();

        userRepository.save(newUser);
    }

    private final ReceptionistScheduleRepository scheduleRepository;

    @Override
    public ClassRenewalSuggestionResponse suggestNextClassRenewal(Integer userId, Integer bookingId) {
        Booking currentBooking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking record not found with ID: " + bookingId));

        if (!currentBooking.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("This booking does not belong to the selected member.");
        }

        Schedule curSchedule = currentBooking.getSchedule();
        if (curSchedule == null || curSchedule.getGymClass() == null) {
            throw new RuntimeException("Current course details are missing for this booking.");
        }

        String className = curSchedule.getGymClass().getClassName();
        LocalDateTime curEndTime = curSchedule.getEndTime() != null ? curSchedule.getEndTime() : LocalDateTime.now();

        // Tìm các lớp kế tiếp cùng tên có thời gian bắt đầu sau thời điểm kết thúc khóa cũ
        List<Schedule> futureSchedules = scheduleRepository.findUpcomingSchedulesByClassName(className, curEndTime);

        Schedule bestMatch = null;
        int bookedSlots = 0;
        int maxSlots = 0;

        for (Schedule s : futureSchedules) {
            // Khớp cùng khung giờ bắt đầu trong ngày (+- 1 tiếng hoặc đúng giờ)
            if (s.getStartTime() != null && curSchedule.getStartTime() != null) {
                if (s.getStartTime().toLocalTime().equals(curSchedule.getStartTime().toLocalTime())) {
                    int booked = bookingRepository.countBookedSlots(s.getScheduleId());
                    int max = (s.getGymClass().getMaxSlots() != null) ? s.getGymClass().getMaxSlots() : 30;

                    // Kiểm tra còn chỗ trống
                    if (booked < max) {
                        bestMatch = s;
                        bookedSlots = booked;
                        maxSlots = max;
                        break;
                    }
                }
            }
        }

        // Nếu không có lớp đúng chuẩn từng phút, lấy lớp cùng tên gần nhất còn chỗ
        if (bestMatch == null) {
            for (Schedule s : futureSchedules) {
                int booked = bookingRepository.countBookedSlots(s.getScheduleId());
                int max = (s.getGymClass().getMaxSlots() != null) ? s.getGymClass().getMaxSlots() : 30;
                if (booked < max) {
                    bestMatch = s;
                    bookedSlots = booked;
                    maxSlots = max;
                    break;
                }
            }
        }

        if (bestMatch == null) {
            throw new RuntimeException("No available upcoming schedule found for course: " + className);
        }

        return ClassRenewalSuggestionResponse.builder()
                .currentBookingId(currentBooking.getBookingId())
                .currentClassName(className)
                .currentEndTime(curEndTime)
                .suggestedScheduleId(bestMatch.getScheduleId())
                .classId(bestMatch.getGymClass().getClassId())
                .className(bestMatch.getGymClass().getClassName())
                .coachName(bestMatch.getGymClass().getCoach() != null ? bestMatch.getGymClass().getCoach().getFullName() : "N/A")
                .coachEmail(bestMatch.getGymClass().getCoach() != null ? bestMatch.getGymClass().getCoach().getEmail() : null)
                .roomName(bestMatch.getGymClass().getRoom() != null ? bestMatch.getGymClass().getRoom().getRoomName() : "N/A")
                .startTime(bestMatch.getStartTime())
                .endTime(bestMatch.getEndTime())
                .price(bestMatch.getGymClass().getPrice())
                .maxSlots(maxSlots)
                .bookedSlots(bookedSlots)
                .availableSlots(maxSlots - bookedSlots)
                .build();
    }

    @Override
    @Transactional
    public void confirmClassRenewal(RenewBookingRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        Schedule schedule = scheduleRepository.findById(request.getNewScheduleId())
                .orElseThrow(() -> new RuntimeException("Target schedule not found with ID: " + request.getNewScheduleId()));

        if (bookingRepository.existsByUserIdAndScheduleId(user.getUserId(), schedule.getScheduleId())) {
            throw new IllegalArgumentException("This member is already registered for this schedule.");
        }

        int bookedSlots = bookingRepository.countBookedSlots(schedule.getScheduleId());
        int maxSlots = (schedule.getGymClass().getMaxSlots() != null) ? schedule.getGymClass().getMaxSlots() : 30;
        if (bookedSlots >= maxSlots) {
            throw new IllegalStateException("Class is fully booked. Cannot complete renewal.");
        }

        Booking newBooking = Booking.builder()
                .user(user)
                .schedule(schedule)
                .status("CONFIRMED")
                .attendanceStatus("ABSENT")
                .bookingTime(LocalDateTime.now())
                .build();

        bookingRepository.save(newBooking);
    }

    @Override
    public List<PackageResponse> getAllActivePackages() {
        return packageRepository.findAll().stream()
                .map(p -> PackageResponse.builder()
                        .packageId(p.getPackageId())
                        .packageName(p.getPackageName())
                        .packageType(p.getPackageType())
                        .durationDays(p.getDurationDays())
                        .price(p.getPrice())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void subscribePackageForMember(SubscribePackageRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        Package pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package not found with ID: " + request.getPackageId()));

        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate end = start.plusDays(pkg.getDurationDays() != null ? pkg.getDurationDays() : 30);

        UserMembership membership = new UserMembership();
        membership.setUser(user);
        // Lưu ý: Nếu trong UserMembership đặt tên là pkg thì dùng membership.setPkg(pkg)
        // Nếu đặt tên là aPackage thì dùng membership.setPackage(pkg)
        membership.setAPackage(pkg);
        membership.setStartDate(start);
        membership.setEndDate(end);
        membership.setStatus("ACTIVE");

        userMembershipRepository.save(membership);
    }

}
