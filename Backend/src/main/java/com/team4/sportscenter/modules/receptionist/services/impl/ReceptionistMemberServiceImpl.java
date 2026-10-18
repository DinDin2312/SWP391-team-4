package com.team4.sportscenter.modules.receptionist.services.impl;

import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.RoleRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
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
import java.util.*;
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
    private final com.team4.sportscenter.modules.member.services.PackageBenefitsService packageBenefits;


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
                    boolean isStarted = um.getStartDate() == null || !um.getStartDate().isAfter(today);
                    boolean isNotExpired = um.getEndDate() == null || !um.getEndDate().isBefore(today);
                    if (isStarted && isNotExpired) {
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
                    currentPackageName = activeMembership.purchasedName();
                    currentPackageType = activeMembership.purchasedType();
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
                    currentPackageName = latestMembership.purchasedName();
                    currentPackageType = latestMembership.purchasedType();
                }
                startDate = latestMembership.getStartDate();
                endDate = latestMembership.getEndDate();
                daysRemaining = 0L;
            }

            // Apply membershipFilter if requested
            if (membershipFilter != null && !membershipFilter.trim().isEmpty() && !membershipFilter.equalsIgnoreCase("ALL")) {
                String filter = membershipFilter.trim().toUpperCase();
                if ("EXPIRING_SOON".equals(filter)) {
                    if (!"ACTIVE".equalsIgnoreCase(currentMembershipStatus) || daysRemaining > 7) {
                        continue;
                    }
                } else if (!currentMembershipStatus.equalsIgnoreCase(filter)) {
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
            boolean isStarted = um.getStartDate() == null || !um.getStartDate().isAfter(today);
            boolean isNotExpired = um.getEndDate() == null || !um.getEndDate().isBefore(today);
            boolean isActive = "ACTIVE".equalsIgnoreCase(um.getStatus()) && isStarted && isNotExpired;
            boolean isUpcoming = "ACTIVE".equalsIgnoreCase(um.getStatus()) && !isStarted && isNotExpired;
            long remaining = 0L;
            if (um.getEndDate() != null) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate());
                if (remaining < 0) remaining = 0L;
            }
            return MemberMembershipDetail.builder()
                    .membershipId(um.getMembershipId())
                    .packageId(um.getAPackage() != null ? um.getAPackage().getPackageId() : null)
                    .packageName(um.getAPackage() != null ? um.purchasedName() : "N/A")
                    .packageType(um.getAPackage() != null ? um.purchasedType() : "N/A")
                    .durationDays(um.getAPackage() != null ? um.purchasedDuration() : null)
                    .price(um.getAPackage() != null ? um.purchasedPrice() : null)
                    .startDate(um.getStartDate())
                    .endDate(um.getEndDate())
                    .status(isActive ? "ACTIVE" : (isUpcoming ? "UPCOMING" : ("ACTIVE".equalsIgnoreCase(um.getStatus()) ? "EXPIRED" : um.getStatus())))
                    .daysRemaining(remaining)
                    .active(isActive)
                    .benefits(um.getMembershipId() != null ? packageBenefits.membershipBenefits(um.getMembershipId()) : List.of())
                    .build();
        }).collect(Collectors.toList());

        // Ưu tiên gói đang có hiệu lực trong ngày hôm nay lên đầu
        membershipDetails.sort((a, b) -> {
            if (Boolean.TRUE.equals(a.getActive()) && !Boolean.TRUE.equals(b.getActive())) return -1;
            if (!Boolean.TRUE.equals(a.getActive()) && Boolean.TRUE.equals(b.getActive())) return 1;
            return 0;
        });

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
            Integer roomId = (s != null && s.getGymClass() != null && s.getGymClass().getRoom() != null)
                    ? s.getGymClass().getRoom().getRoomId() : null;

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
                    .roomId(roomId)
                    .roomName(roomName)
                    .startTime(s != null ? s.getStartTime() : null)
                    .endTime(s != null ? s.getEndTime() : null)
                    .bookingStatus(b.getStatus())
                    .attendanceStatus(b.getAttendanceStatus())
                    .bookingTime(b.getBookingTime())
                    .build());
        }

        boolean hasGymAccess = membershipDetails.stream().anyMatch(m -> Boolean.TRUE.equals(m.getActive()));
        MemberBookingDetail todayBooking = bookingDetails.stream()
                .filter(b -> b.getStartTime() != null && b.getStartTime().toLocalDate().isEqual(today) && "CONFIRMED".equalsIgnoreCase(b.getBookingStatus()))
                .findFirst()
                .orElse(null);
        boolean hasTodayClass = (todayBooking != null);
        Integer todayBookingId = todayBooking != null ? todayBooking.getBookingId() : null;
        String todayClassName = todayBooking != null ? todayBooking.getClassName() : null;
        String todayClassTime = todayBooking != null && todayBooking.getStartTime() != null
                ? todayBooking.getStartTime().toLocalTime().withNano(0).toString() : null;
        String todayRoomName = todayBooking != null ? todayBooking.getRoomName() : null;

        int anomalyCount = 0;
        String lastAnomalyNote = null;
        try {
            List<java.util.Map<String, Object>> anomalyCheckIns = jdbcTemplate.queryForList(
                    "SELECT changes_json, created_at FROM AUDIT_LOGS " +
                    "WHERE entity_type = 'MEMBER_CHECKIN' AND entity_id = ? " +
                    "ORDER BY created_at DESC",
                    String.valueOf(user.getUserId())
            );
            for (java.util.Map<String, Object> aRow : anomalyCheckIns) {
                String cJson = (String) aRow.get("changes_json");
                if (cJson != null && !cJson.isBlank()) {
                    try {
                        java.util.Map<String, Object> map = jsonMapper.readValue(cJson, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                        if (map.get("bookingId") instanceof Number n) {
                            Integer bId = n.intValue();
                            Optional<Booking> optB = bookingRepository.findById(bId);
                            if (optB.isPresent() && "ABSENT".equalsIgnoreCase(optB.get().getAttendanceStatus())) {
                                anomalyCount++;
                                if (lastAnomalyNote == null) {
                                    String cName = optB.get().getSchedule() != null && optB.get().getSchedule().getGymClass() != null
                                            ? optB.get().getSchedule().getGymClass().getClassName() : "lớp học";
                                    lastAnomalyNote = "Check-in vào lớp " + cName + " nhưng bị HLV ghi nhận VẮNG MẶT.";
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception ignored) {}

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
                .hasGymAccess(hasGymAccess)
                .hasTodayClass(hasTodayClass)
                .todayBookingId(todayBookingId)
                .todayClassName(todayClassName)
                .todayClassTime(todayClassTime)
                .todayRoomName(todayRoomName)
                .anomalyCount(anomalyCount)
                .lastAnomalyNote(lastAnomalyNote)
                .memberships(membershipDetails)
                .bookings(bookingDetails)
                .build();
    }

    @Override
    public List<MemberMembershipDetail> getMemberMemberships(Integer userId) {
        LocalDate today = LocalDate.now();
        List<UserMembership> memberships = userMembershipRepository.findByUser_UserId(userId);
        List<MemberMembershipDetail> list = memberships.stream().map(um -> {
            boolean isStarted = um.getStartDate() == null || !um.getStartDate().isAfter(today);
            boolean isNotExpired = um.getEndDate() == null || !um.getEndDate().isBefore(today);
            boolean isActive = "ACTIVE".equalsIgnoreCase(um.getStatus()) && isStarted && isNotExpired;
            boolean isUpcoming = "ACTIVE".equalsIgnoreCase(um.getStatus()) && !isStarted && isNotExpired;
            long remaining = 0L;
            if (um.getEndDate() != null) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate());
                if (remaining < 0) remaining = 0L;
            }
            return MemberMembershipDetail.builder()
                    .membershipId(um.getMembershipId())
                    .packageId(um.getAPackage() != null ? um.getAPackage().getPackageId() : null)
                    .packageName(um.getAPackage() != null ? um.purchasedName() : "N/A")
                    .packageType(um.getAPackage() != null ? um.purchasedType() : "N/A")
                    .durationDays(um.getAPackage() != null ? um.purchasedDuration() : null)
                    .price(um.getAPackage() != null ? um.purchasedPrice() : null)
                    .startDate(um.getStartDate())
                    .endDate(um.getEndDate())
                    .status(isActive ? "ACTIVE" : (isUpcoming ? "UPCOMING" : ("ACTIVE".equalsIgnoreCase(um.getStatus()) ? "EXPIRED" : um.getStatus())))
                    .daysRemaining(remaining)
                    .active(isActive)
                    .benefits(um.getMembershipId() != null ? packageBenefits.membershipBenefits(um.getMembershipId()) : List.of())
                    .build();
        }).collect(Collectors.toList());

        // Ưu tiên gói đang có hiệu lực trong ngày hôm nay lên đầu
        list.sort((a, b) -> {
            if (Boolean.TRUE.equals(a.getActive()) && !Boolean.TRUE.equals(b.getActive())) return -1;
            if (!Boolean.TRUE.equals(a.getActive()) && Boolean.TRUE.equals(b.getActive())) return 1;
            return 0;
        });
        return list;
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
        bookingRepository.lockOperations();
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
                .attendanceStatus("NOT_YET")
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

    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.payment.repositories.InvoiceRepository invoiceRepository;
    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.payment.repositories.InvoiceDetailRepository invoiceDetailRepository;
    @org.springframework.beans.factory.annotation.Autowired private com.team4.sportscenter.modules.payment.repositories.PaymentRepository paymentRepository;

    @Override
    @Transactional
    public void subscribePackageForMember(SubscribePackageRequest request) {
        bookingRepository.lockOperations();
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        Package pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new RuntimeException("Package not found with ID: " + request.getPackageId()));

        commerce.checkPurchase(user.getUserId(),pkg.getPackageId(),null,true);
        LocalDate today = LocalDate.now();
        LocalDate start = request.getStartDate() != null ? request.getStartDate() : today;
        LocalDate end = start.plusDays((pkg.getDurationDays() != null ? pkg.getDurationDays() : 30)-1);
        LocalDateTime now = LocalDateTime.now();

        UserMembership membership = new UserMembership();
        membership.setUser(user);
        membership.setAPackage(pkg);
        membership.setStartDate(start);
        membership.setEndDate(end);
        membership.setStatus("ACTIVE");
        membership.setPurchaseCompletedAt(now);
        membership.setPurchaseSource("COUNTER");

        packageBenefits.snapshot(membership);

        java.math.BigDecimal amount = membership.purchasedPrice() != null
                ? membership.purchasedPrice()
                : (pkg.getPrice() != null ? pkg.getPrice() : java.math.BigDecimal.ZERO);

        com.team4.sportscenter.modules.payment.entities.Invoice invoice = com.team4.sportscenter.modules.payment.entities.Invoice.builder()
                .user(user)
                .totalAmount(amount)
                .status("PAID")
                .createdAt(now)
                .build();
        invoice = invoiceRepository.saveAndFlush(invoice);

        membership.setCheckoutInvoiceId(invoice.getInvoiceId());
        userMembershipRepository.saveAndFlush(membership);
        packageBenefits.snapshotSubjects(membership.getMembershipId(),pkg.getPackageId());

        com.team4.sportscenter.modules.payment.entities.InvoiceDetail detail = com.team4.sportscenter.modules.payment.entities.InvoiceDetail.builder()
                .invoice(invoice)
                .aPackage(pkg)
                .membershipId(membership.getMembershipId())
                .unitPrice(amount)
                .build();
        invoiceDetailRepository.save(detail);

        com.team4.sportscenter.modules.payment.entities.PaymentEntity payment = com.team4.sportscenter.modules.payment.entities.PaymentEntity.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod("CASH")
                .transactionNo("COUNTER-" + invoice.getInvoiceId())
                .status("COMPLETED")
                .paymentDate(now)
                .build();
        paymentRepository.saveAndFlush(payment);
    }

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.team4.sportscenter.modules.notification.services.NotificationService notificationService;

    private final com.fasterxml.jackson.databind.ObjectMapper jsonMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Override
    public List<FacilityRoomResponse> getFacilityRooms() {
        List<MemberCheckInRecordResponse> activeToday = getCheckInHistory(LocalDate.now(), null, "CHECKED_IN");
        java.util.Map<Integer, Long> checkInOccupancyByRoom = activeToday.stream()
                .filter(r -> r.getRoomId() != null)
                .collect(Collectors.groupingBy(MemberCheckInRecordResponse::getRoomId, Collectors.counting()));

        // Tránh cộng trùng những học viên đã check-in qua quầy lễ tân
        List<Integer> activeUserIds = activeToday.stream()
                .map(MemberCheckInRecordResponse::getUserId)
                .filter(java.util.Objects::nonNull)
                .toList();
        String notInClause = activeUserIds.isEmpty() ? "" : " AND b.user_id NOT IN (" +
                activeUserIds.stream().map(String::valueOf).collect(Collectors.joining(",")) + ")";

        // Cộng dồn số học viên của các lớp học đang diễn ra trong phòng tại thời điểm hiện tại (nếu chưa check-in quầy)
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<java.util.Map<String, Object>> classOccupancyRows = jdbcTemplate.queryForList(
                "SELECT c.room_id, COUNT(b.booking_id) AS student_count " +
                "FROM SCHEDULES s " +
                "JOIN CLASSES c ON s.class_id = c.class_id " +
                "JOIN BOOKINGS b ON s.schedule_id = b.schedule_id " +
                "WHERE (s.status IS NULL OR s.status != 'CANCELLED') " +
                "  AND b.status = 'CONFIRMED' " +
                "  AND (b.attendance_status IS NULL OR b.attendance_status != 'ABSENT') " +
                "  AND ? BETWEEN s.start_time AND s.end_time " +
                "  AND c.room_id IS NOT NULL " + notInClause +
                " GROUP BY c.room_id",
                now
        );
        java.util.Map<Integer, Long> classOccupancyByRoom = new java.util.HashMap<>();
        for (java.util.Map<String, Object> r : classOccupancyRows) {
            Integer rId = ((Number) r.get("room_id")).intValue();
            Long count = ((Number) r.get("student_count")).longValue();
            classOccupancyByRoom.put(rId, count);
        }

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT room_id, room_name, capacity FROM ROOMS ORDER BY room_id"
        );

        List<FacilityRoomResponse> result = new ArrayList<>();
        for (java.util.Map<String, Object> row : rows) {
            Integer roomId = ((Number) row.get("room_id")).intValue();
            String roomName = (String) row.get("room_name");
            Integer capacity = row.get("capacity") != null ? ((Number) row.get("capacity")).intValue() : 50;
            Long checkInCount = checkInOccupancyByRoom.getOrDefault(roomId, 0L);
            Long classCount = classOccupancyByRoom.getOrDefault(roomId, 0L);
            Long totalOccupancy = checkInCount + classCount;

            result.add(FacilityRoomResponse.builder()
                    .roomId(roomId)
                    .roomName(roomName)
                    .capacity(capacity)
                    .currentOccupancy(totalOccupancy)
                    .build());
        }
        return result;
    }

    @Override
    @Transactional
    public MemberCheckInRecordResponse checkInMember(com.team4.sportscenter.modules.receptionist.dtos.request.MemberCheckInRequest request) {
        if (request.getUserId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn hội viên để thực hiện Check-in.");
        }

        bookingRepository.lockOperations();

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hội viên với ID: " + request.getUserId()));

        if (user.getRole() == null || (!"Member".equalsIgnoreCase(user.getRole().getRoleName()) && user.getRole().getRoleId() != 4)) {
            throw new IllegalArgumentException("Tài khoản này không phải là hội viên (Member).");
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản hội viên đang bị khóa hoặc ngưng hoạt động. Không thể Check-in.");
        }

        LocalDate today = LocalDate.now();
        List<MemberCheckInRecordResponse> activeCheckInsToday = getCheckInHistory(today, null, "CHECKED_IN");
        for (MemberCheckInRecordResponse existing : activeCheckInsToday) {
            if (user.getUserId().equals(existing.getUserId())) {
                throw new IllegalArgumentException("Hội viên " + user.getFullName() + " đã Check-in vào lúc "
                        + (existing.getCheckInTime() != null ? existing.getCheckInTime().toLocalTime().withNano(0) : "hôm nay")
                        + " tại [" + existing.getFacilityName() + "] và hiện đang ở trong trung tâm. Vui lòng Check-out trước khi tạo lượt mới.");
            }
        }

        // 1. Tự động kiểm tra Quyền tập Gym (Gói tập có hiệu lực hôm nay)
        List<UserMembership> memberships = userMembershipRepository.findByUser_UserId(user.getUserId());
        UserMembership activeGymMembership = null;
        for (UserMembership um : memberships) {
            if ("ACTIVE".equalsIgnoreCase(um.getStatus())) {
                boolean isStarted = um.getStartDate() == null || !um.getStartDate().isAfter(today);
                boolean isNotExpired = um.getEndDate() == null || !um.getEndDate().isBefore(today);
                if (isStarted && isNotExpired) {
                    activeGymMembership = um;
                    break;
                } else if (!isStarted && isNotExpired && Boolean.TRUE.equals(request.getActivateEarly())) {
                    long duration = 30L;
                    if (um.getStartDate() != null && um.getEndDate() != null) {
                        duration = ChronoUnit.DAYS.between(um.getStartDate(), um.getEndDate()) + 1;
                    } else if (um.getAPackage() != null && um.getAPackage().getDurationDays() != null) {
                        duration = um.getAPackage().getDurationDays();
                    }
                    um.setStartDate(today);
                    um.setEndDate(today.plusDays(duration - 1));
                    userMembershipRepository.saveAndFlush(um);
                    activeGymMembership = um;
                    break;
                }
            }
        }
        boolean hasGymAccess = (activeGymMembership != null);

        // 2. Tự động kiểm tra Quyền vào Lớp (Có lịch học đã CONFIRMED trong ngày hôm nay)
        List<Booking> userBookings = bookingRepository.findByUserIdWithDetails(user.getUserId());
        Booking todayClassBooking = null;
        if (request.getBookingId() != null) {
            todayClassBooking = bookingRepository.findById(request.getBookingId()).orElse(null);
        }
        if (todayClassBooking == null) {
            todayClassBooking = userBookings.stream()
                    .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus())
                            && b.getSchedule() != null
                            && b.getSchedule().getStartTime() != null
                            && b.getSchedule().getStartTime().toLocalDate().isEqual(today))
                    .findFirst()
                    .orElse(null);
        }
        boolean hasTodayClass = (todayClassBooking != null);

        // 3. Xử lý Ma trận 4 trường hợp (Tự động nhận diện)
        if (!hasGymAccess && !hasTodayClass) {
            throw new IllegalArgumentException("Hội viên không có gói tập hợp lệ và không có lịch học nào hôm nay. Vui lòng đăng ký gói tập hoặc mua vé ngày để vào trung tâm.");
        }

        String checkInType;
        boolean gymAccessGranted;
        boolean classAccessGranted;
        String accessCode = null;
        String packageName;
        String packageType;
        Integer membershipId = null;
        Integer bookingId = null;
        Integer selectedRoomId = request.getRoomId();
        String facilityName;

        if (hasGymAccess && hasTodayClass) {
            // TH3: Cả Gym lẫn Lớp học hôm nay
            checkInType = "COMBO_ALL";
            gymAccessGranted = true;
            classAccessGranted = true;
            accessCode = "GYM-PASS-" + user.getUserId() + "-" + (System.currentTimeMillis() % 10000);
            membershipId = activeGymMembership.getMembershipId();
            bookingId = todayClassBooking.getBookingId();
            String cName = todayClassBooking.getSchedule().getGymClass() != null
                    ? todayClassBooking.getSchedule().getGymClass().getClassName() : "Lớp học";
            packageName = activeGymMembership.purchasedName() + " + Lớp " + cName;
            packageType = "COMBO";
            if (todayClassBooking.getSchedule().getGymClass() != null && todayClassBooking.getSchedule().getGymClass().getRoom() != null) {
                selectedRoomId = todayClassBooking.getSchedule().getGymClass().getRoom().getRoomId();
            }
            facilityName = "Khu Gym & CSVC + Lớp: " + cName;
        } else if (hasGymAccess) {
            // TH1: Chỉ có Gym
            checkInType = "GYM_FACILITY";
            gymAccessGranted = true;
            classAccessGranted = false;
            accessCode = "GYM-PASS-" + user.getUserId() + "-" + (System.currentTimeMillis() % 10000);
            membershipId = activeGymMembership.getMembershipId();
            packageName = activeGymMembership.purchasedName();
            packageType = activeGymMembership.purchasedType();
            facilityName = (request.getFacilityName() != null && !request.getFacilityName().trim().isEmpty())
                    ? request.getFacilityName().trim()
                    : "Khu vực Gym & CSVC chung";
        } else {
            // TH2: Chỉ có Lớp (KHÔNG cấp mã mở cửa phòng gym!)
            checkInType = "CLASS_SESSION";
            gymAccessGranted = false;
            classAccessGranted = true;
            accessCode = null;
            bookingId = todayClassBooking.getBookingId();
            String cName = todayClassBooking.getSchedule().getGymClass() != null
                    ? todayClassBooking.getSchedule().getGymClass().getClassName() : "Lớp học";
            packageName = "Lớp: " + cName;
            packageType = "CLASS";
            String rName = "Phòng tập";
            if (todayClassBooking.getSchedule().getGymClass() != null && todayClassBooking.getSchedule().getGymClass().getRoom() != null) {
                selectedRoomId = todayClassBooking.getSchedule().getGymClass().getRoom().getRoomId();
                rName = todayClassBooking.getSchedule().getGymClass().getRoom().getRoomName();
            }
            facilityName = "Lớp: " + cName + " (" + rName + ")";
        }

        user.setLoyaltyPoints((user.getLoyaltyPoints() != null ? user.getLoyaltyPoints() : 0) + 1);
        userRepository.saveAndFlush(user);

        LocalDateTime now = LocalDateTime.now().withNano(0);
        String cleanNote = (request.getNote() != null && !request.getNote().trim().isEmpty()) ? request.getNote().trim() : null;
        String actorEmail = (request.getReceptionistEmail() != null && !request.getReceptionistEmail().trim().isEmpty())
                ? request.getReceptionistEmail().trim()
                : "receptionist@sport.com";

        java.util.Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("userId", user.getUserId());
        payload.put("memberName", user.getFullName());
        payload.put("memberEmail", user.getEmail());
        payload.put("memberPhone", user.getPhone());
        payload.put("membershipId", membershipId);
        payload.put("bookingId", bookingId);
        payload.put("checkInType", checkInType);
        payload.put("gymAccessGranted", gymAccessGranted);
        payload.put("classAccessGranted", classAccessGranted);
        payload.put("accessCode", accessCode);
        payload.put("packageName", packageName);
        payload.put("packageType", packageType);
        payload.put("roomId", selectedRoomId);
        payload.put("facilityName", facilityName);
        payload.put("note", cleanNote);
        payload.put("status", "CHECKED_IN");
        payload.put("checkInTime", now.toString());
        payload.put("checkOutTime", null);
        payload.put("checkedInBy", actorEmail);

        String jsonString;
        try {
            jsonString = jsonMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi ghi dữ liệu Check-in.", e);
        }

        String details = String.format("Check-in hội viên %s (#%d) - %s - Quyền: Gym=%s, Lớp=%s",
                user.getFullName(), user.getUserId(), packageName, gymAccessGranted ? "Có" : "Không", classAccessGranted ? "Có" : "Không");

        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(
                    "INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    java.sql.Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, actorEmail);
            ps.setString(2, "CHECK_IN");
            ps.setString(3, "MEMBER_CHECKIN");
            ps.setString(4, String.valueOf(user.getUserId()));
            ps.setString(5, details);
            ps.setString(6, jsonString);
            ps.setTimestamp(7, java.sql.Timestamp.valueOf(now));
            return ps;
        }, keyHolder);

        Long checkInId = keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;

        if (notificationService != null && user.getEmail() != null) {
            try {
                String notifMsg = String.format("Check-in thành công tại trung tâm (%s) lúc %s. Chúc bạn có buổi rèn luyện hiệu quả!",
                        packageName, now.toLocalTime());
                notificationService.createNotification(
                        user.getEmail(),
                        "Check-in thành công tại trung tâm",
                        notifMsg,
                        "SYSTEM"
                );
            } catch (Exception ignored) {
            }
        }

        return MemberCheckInRecordResponse.builder()
                .checkInId(checkInId)
                .userId(user.getUserId())
                .memberName(user.getFullName())
                .memberEmail(user.getEmail())
                .memberPhone(user.getPhone())
                .membershipId(membershipId)
                .bookingId(bookingId)
                .checkInType(checkInType)
                .gymAccessGranted(gymAccessGranted)
                .classAccessGranted(classAccessGranted)
                .accessCode(accessCode)
                .packageName(packageName)
                .packageType(packageType)
                .roomId(selectedRoomId)
                .facilityName(facilityName)
                .note(cleanNote)
                .status("CHECKED_IN")
                .checkInTime(now)
                .checkOutTime(null)
                .checkedInBy(actorEmail)
                .hasAnomaly(false)
                .build();
    }

    @Override
    @Transactional
    public MemberCheckInRecordResponse checkOutMember(Long checkInId) {
        if (checkInId == null) {
            throw new IllegalArgumentException("Mã lượt Check-in không hợp lệ.");
        }

        List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT audit_id, actor_email, action, entity_id, details, changes_json, created_at " +
                "FROM AUDIT_LOGS WHERE audit_id = ? AND entity_type = 'MEMBER_CHECKIN'",
                checkInId
        );

        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Không tìm thấy bản ghi Check-in với mã #" + checkInId);
        }

        java.util.Map<String, Object> row = rows.get(0);
        MemberCheckInRecordResponse record = parseCheckInRow(row);
        if ("CHECKED_OUT".equalsIgnoreCase(record.getStatus())) {
            throw new IllegalArgumentException("Hội viên này đã được Check-out trước đó rồi.");
        }

        LocalDateTime now = LocalDateTime.now().withNano(0);
        record.setStatus("CHECKED_OUT");
        record.setCheckOutTime(now);

        java.util.Map<String, Object> payload = new java.util.LinkedHashMap<>();
        payload.put("userId", record.getUserId());
        payload.put("memberName", record.getMemberName());
        payload.put("memberEmail", record.getMemberEmail());
        payload.put("memberPhone", record.getMemberPhone());
        payload.put("membershipId", record.getMembershipId());
        payload.put("bookingId", record.getBookingId());
        payload.put("checkInType", record.getCheckInType());
        payload.put("gymAccessGranted", record.getGymAccessGranted());
        payload.put("classAccessGranted", record.getClassAccessGranted());
        payload.put("accessCode", record.getAccessCode());
        payload.put("packageName", record.getPackageName());
        payload.put("packageType", record.getPackageType());
        payload.put("roomId", record.getRoomId());
        payload.put("facilityName", record.getFacilityName());
        payload.put("note", record.getNote());
        payload.put("status", "CHECKED_OUT");
        payload.put("checkInTime", record.getCheckInTime() != null ? record.getCheckInTime().toString() : now.toString());
        payload.put("checkOutTime", now.toString());
        payload.put("checkedInBy", record.getCheckedInBy());

        try {
            String updatedJson = jsonMapper.writeValueAsString(payload);
            jdbcTemplate.update(
                    "UPDATE AUDIT_LOGS SET action = 'CHECK_OUT', changes_json = ? WHERE audit_id = ?",
                    updatedJson, checkInId
            );
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi cập nhật trạng thái Check-out.", e);
        }

        return record;
    }

    @Override
    public List<MemberCheckInRecordResponse> getCheckInHistory(LocalDate date, String keyword, String statusFilter) {
        List<java.util.Map<String, Object>> rows;
        if (date != null) {
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();
            rows = jdbcTemplate.queryForList(
                    "SELECT audit_id, actor_email, action, entity_id, details, changes_json, created_at " +
                    "FROM AUDIT_LOGS WHERE entity_type = 'MEMBER_CHECKIN' AND created_at >= ? AND created_at < ? " +
                    "ORDER BY created_at DESC, audit_id DESC",
                    java.sql.Timestamp.valueOf(startOfDay),
                    java.sql.Timestamp.valueOf(endOfDay)
            );
        } else {
            rows = jdbcTemplate.queryForList(
                    "SELECT audit_id, actor_email, action, entity_id, details, changes_json, created_at " +
                    "FROM AUDIT_LOGS WHERE entity_type = 'MEMBER_CHECKIN' " +
                    "ORDER BY created_at DESC, audit_id DESC LIMIT 200"
            );
        }

        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim().toLowerCase() : null;
        String cleanStatus = (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter.trim()))
                ? statusFilter.trim().toUpperCase()
                : null;

        List<MemberCheckInRecordResponse> parsedList = new ArrayList<>();
        Set<Integer> bookingIdsToFetch = new HashSet<>();
        for (java.util.Map<String, Object> row : rows) {
            MemberCheckInRecordResponse item = parseCheckInRow(row);
            parsedList.add(item);
            if (item.getBookingId() != null) {
                bookingIdsToFetch.add(item.getBookingId());
            }
        }

        Map<Integer, String> bookingAttendanceMap = new HashMap<>();
        if (!bookingIdsToFetch.isEmpty()) {
            List<Booking> fetchedBookings = bookingRepository.findAllById(bookingIdsToFetch);
            for (Booking fb : fetchedBookings) {
                bookingAttendanceMap.put(fb.getBookingId(), fb.getAttendanceStatus() != null ? fb.getAttendanceStatus() : "NOT_YET");
            }
        }

        List<MemberCheckInRecordResponse> results = new ArrayList<>();
        for (MemberCheckInRecordResponse item : parsedList) {
            if (item.getBookingId() != null) {
                String att = bookingAttendanceMap.get(item.getBookingId());
                if (att != null) {
                    item.setAttendanceStatus(att);
                    if ("ABSENT".equalsIgnoreCase(att)) {
                        item.setHasAnomaly(true);
                        item.setAnomalyReason("Check-in vào trung tâm học lớp nhưng HLV ghi nhận VẮNG MẶT trong lớp");
                    }
                }
            }

            if (cleanStatus != null) {
                if ("ANOMALY".equalsIgnoreCase(cleanStatus)) {
                    if (!Boolean.TRUE.equals(item.getHasAnomaly())) {
                        continue;
                    }
                } else if (!cleanStatus.equalsIgnoreCase(item.getStatus())) {
                    continue;
                }
            }

            if (cleanKeyword != null) {
                boolean matched = (item.getMemberName() != null && item.getMemberName().toLowerCase().contains(cleanKeyword))
                        || (item.getMemberPhone() != null && item.getMemberPhone().toLowerCase().contains(cleanKeyword))
                        || (item.getMemberEmail() != null && item.getMemberEmail().toLowerCase().contains(cleanKeyword))
                        || (item.getPackageName() != null && item.getPackageName().toLowerCase().contains(cleanKeyword))
                        || (item.getFacilityName() != null && item.getFacilityName().toLowerCase().contains(cleanKeyword))
                        || (item.getNote() != null && item.getNote().toLowerCase().contains(cleanKeyword))
                        || (item.getAccessCode() != null && item.getAccessCode().toLowerCase().contains(cleanKeyword))
                        || (item.getUserId() != null && String.valueOf(item.getUserId()).contains(cleanKeyword));
                if (!matched) {
                    continue;
                }
            }
            results.add(item);
        }
        return results;
    }

    private MemberCheckInRecordResponse parseCheckInRow(java.util.Map<String, Object> row) {
        Long auditId = row.get("audit_id") != null ? ((Number) row.get("audit_id")).longValue() : null;
        String actorEmail = (String) row.get("actor_email");
        String action = (String) row.get("action");
        String changesJson = (String) row.get("changes_json");

        LocalDateTime createdAt = null;
        Object createdObj = row.get("created_at");
        if (createdObj instanceof java.sql.Timestamp ts) {
            createdAt = ts.toLocalDateTime();
        } else if (createdObj instanceof LocalDateTime ldt) {
            createdAt = ldt;
        }

        MemberCheckInRecordResponse.MemberCheckInRecordResponseBuilder builder = MemberCheckInRecordResponse.builder()
                .checkInId(auditId)
                .checkedInBy(actorEmail)
                .status("CHECK_OUT".equalsIgnoreCase(action) ? "CHECKED_OUT" : "CHECKED_IN")
                .checkInTime(createdAt)
                .hasAnomaly(false);

        if (changesJson != null && !changesJson.isBlank()) {
            try {
                java.util.Map<String, Object> map = jsonMapper.readValue(
                        changesJson,
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {}
                );
                if (map.get("userId") instanceof Number n) builder.userId(n.intValue());
                if (map.get("memberName") instanceof String s) builder.memberName(s);
                if (map.get("memberEmail") instanceof String s) builder.memberEmail(s);
                if (map.get("memberPhone") instanceof String s) builder.memberPhone(s);
                if (map.get("membershipId") instanceof Number n) builder.membershipId(n.intValue());
                if (map.get("packageName") instanceof String s) builder.packageName(s);
                if (map.get("packageType") instanceof String s) builder.packageType(s);
                if (map.get("roomId") instanceof Number n) builder.roomId(n.intValue());
                if (map.get("facilityName") instanceof String s) builder.facilityName(s);
                if (map.get("note") instanceof String s) builder.note(s);
                if (map.get("status") instanceof String s) builder.status(s);
                if (map.get("checkedInBy") instanceof String s) builder.checkedInBy(s);
                if (map.get("bookingId") instanceof Number n) builder.bookingId(n.intValue());
                if (map.get("checkInType") instanceof String s) builder.checkInType(s);
                if (map.get("gymAccessGranted") instanceof Boolean b) builder.gymAccessGranted(b);
                if (map.get("classAccessGranted") instanceof Boolean b) builder.classAccessGranted(b);
                if (map.get("accessCode") instanceof String s) builder.accessCode(s);
                if (map.get("attendanceStatus") instanceof String s) builder.attendanceStatus(s);
                if (map.get("hasAnomaly") instanceof Boolean b) builder.hasAnomaly(b);
                if (map.get("anomalyReason") instanceof String s) builder.anomalyReason(s);
                if (map.get("checkInTime") instanceof String s && !s.isBlank()) {
                    try { builder.checkInTime(LocalDateTime.parse(s)); } catch (Exception ignored) {}
                }
                if (map.get("checkOutTime") instanceof String s && !s.isBlank()) {
                    try { builder.checkOutTime(LocalDateTime.parse(s)); } catch (Exception ignored) {}
                }
            } catch (Exception ignored) {
            }
        }
        return builder.build();
    }

}

