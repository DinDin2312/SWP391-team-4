package com.team4.sportscenter.modules.receptionist.services.impl;

import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.RoleRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.receptionist.dtos.request.CancelClassBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.EnrollClassRequest;
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

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings({"SqlResolve", "SqlNoDataSourceInspection"})
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
                        if (activeMembership == null) {
                            activeMembership = um;
                        } else if (um.getEndDate() != null && (activeMembership.getEndDate() == null || um.getEndDate().isAfter(activeMembership.getEndDate()))) {
                            activeMembership = um;
                        }
                    }
                }
            }

            String currentMembershipStatus = "NO_MEMBERSHIP";
            Integer currentMembershipId = null;
            String currentPackageName = null;
            String currentPackageType = null;
            LocalDate startDate = null;
            LocalDate endDate = null;
            long daysRemaining = 0L;

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
                    daysRemaining = ChronoUnit.DAYS.between(today, endDate) + 1L;
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
            if (um.getEndDate() != null && isNotExpired) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate()) + 1L;
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
        })
        .sorted((a, b) -> {
            if (Boolean.TRUE.equals(a.getActive()) && !Boolean.TRUE.equals(b.getActive())) return -1;
            if (!Boolean.TRUE.equals(a.getActive()) && Boolean.TRUE.equals(b.getActive())) return 1;
            if (a.getEndDate() != null && b.getEndDate() != null) {
                int cmp = b.getEndDate().compareTo(a.getEndDate());
                if (cmp != 0) return cmp;
            }
            if (a.getEndDate() != null) return -1;
            if (b.getEndDate() != null) return 1;
            return 0;
        })
        .toList();

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

            Integer subjectId = (s != null && s.getGymClass() != null) ? s.getGymClass().getSubjectId() : null;
            String subjectName = (s != null && s.getGymClass() != null && s.getGymClass().getSubject() != null)
                    ? s.getGymClass().getSubject().getSubjectName() : null;

            bookingDetails.add(MemberBookingDetail.builder()
                    .bookingId(b.getBookingId())
                    .scheduleId(s != null ? s.getScheduleId() : null)
                    .classId(s != null && s.getGymClass() != null ? s.getGymClass().getClassId() : null)
                    .subjectId(subjectId)
                    .subjectName(subjectName)
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
                        java.util.Map<String, Object> map = jsonMapper.readValue(cJson, new com.fasterxml.jackson.core.type.TypeReference<>() {});
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
        return userMembershipRepository.findByUser_UserId(userId).stream().map(um -> {
            boolean isStarted = um.getStartDate() == null || !um.getStartDate().isAfter(today);
            boolean isNotExpired = um.getEndDate() == null || !um.getEndDate().isBefore(today);
            boolean isActive = "ACTIVE".equalsIgnoreCase(um.getStatus()) && isStarted && isNotExpired;
            boolean isUpcoming = "ACTIVE".equalsIgnoreCase(um.getStatus()) && !isStarted && isNotExpired;
            long remaining = 0L;
            if (um.getEndDate() != null && isNotExpired) {
                remaining = ChronoUnit.DAYS.between(today, um.getEndDate()) + 1L;
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
        })
        .sorted((a, b) -> {
            if (Boolean.TRUE.equals(a.getActive()) && !Boolean.TRUE.equals(b.getActive())) return -1;
            if (!Boolean.TRUE.equals(a.getActive()) && Boolean.TRUE.equals(b.getActive())) return 1;
            if (a.getEndDate() != null && b.getEndDate() != null) {
                int cmp = b.getEndDate().compareTo(a.getEndDate());
                if (cmp != 0) return cmp;
            }
            if (a.getEndDate() != null) return -1;
            if (b.getEndDate() != null) return 1;
            return 0;
        })
        .toList();
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

        GymClass curClass = curSchedule.getGymClass();
        String className = curClass.getClassName();
        Integer curClassId = curClass.getClassId();

        // Tách tên gốc của khóa học (bỏ hậu tố " - Đợt 1", " (Đợt 1)", " - Tháng 10", " - T10", " - K01", v.v.)
        String baseName = className.replaceAll("(?i)\\s*[-–(]?\\s*(Đợt|Khóa|K|Tháng|T)\\s*\\d+.*[)]?", "").trim();

        // Tìm thời gian kết thúc của buổi cuối cùng trong khóa học hiện tại
        List<Schedule> curClassSchedules = scheduleRepository.findAllSchedulesByClassId(curClassId);
        LocalDateTime curEndTime = curClassSchedules.stream()
                .map(Schedule::getEndTime)
                .filter(java.util.Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(curSchedule.getEndTime() != null ? curSchedule.getEndTime() : LocalDateTime.now());

        // Lấy các thứ trong tuần và giờ học của khóa học hiện tại để so khớp lịch tương tự
        java.util.Set<java.time.DayOfWeek> curDaysOfWeek = curClassSchedules.stream()
                .map(s -> s.getStartTime().getDayOfWeek())
                .collect(Collectors.toSet());
        java.time.LocalTime curStartTime = (curSchedule.getStartTime() != null)
                ? curSchedule.getStartTime().toLocalTime()
                : java.time.LocalTime.of(18, 0);

        // Tìm các lịch học của đợt tiếp theo (bắt đầu sau hoặc sát thời điểm khóa hiện tại kết thúc)
        LocalDateTime searchAfterTime = curEndTime.isAfter(LocalDateTime.now())
                ? curEndTime.minusDays(2)
                : LocalDateTime.now();
        List<Schedule> futureSchedules = new ArrayList<>(scheduleRepository.findUpcomingSchedulesByBaseName(
                baseName, className, curClassId, searchAfterTime));

        // Bổ sung các lớp học cùng bộ môn (Subject) được Manager tạo theo quy tắc Fixed Teaching Slots mới
        if (curClass.getSubjectId() != null) {
            Set<Integer> existingSchedIds = futureSchedules.stream()
                    .map(Schedule::getScheduleId)
                    .collect(Collectors.toSet());
            List<Schedule> sameSubjectSchedules = scheduleRepository.findUpcomingSchedulesBySubjectId(
                    curClass.getSubjectId(), curClassId, searchAfterTime);
            for (Schedule s : sameSubjectSchedules) {
                if (!existingSchedIds.contains(s.getScheduleId())) {
                    futureSchedules.add(s);
                }
            }
        }

        if (futureSchedules.isEmpty()) {
            throw new RuntimeException("Không tìm thấy lớp học tiếp theo phù hợp cho khóa học: " + className);
        }

        // Nhóm các lịch học theo từng GymClass (từng đợt mở lớp)
        Map<Integer, List<Schedule>> schedulesByClass = new java.util.LinkedHashMap<>();
        for (Schedule s : futureSchedules) {
            schedulesByClass.computeIfAbsent(s.getGymClass().getClassId(), k -> new java.util.ArrayList<>()).add(s);
        }

        // Sắp xếp các lớp ứng viên cho kỳ sau theo 4 tiêu chí cốt lõi:
        // 1. Cùng loại lớp / bộ môn (Subject)
        // 2. Của tương lai (Bắt đầu sau khi khóa hiện tại kết thúc)
        // 3. Cùng lịch học: 100% cùng các thứ trong tuần (curDaysOfWeek)
        // 4. Cùng khung giờ ca học (curStartTime)
        // 5. Khai giảng sớm nhất tiếp nối khóa cũ
        // 6. Khác giáo viên thì được (Coach có thể khác nhau, không bị ràng buộc)
        List<Map.Entry<Integer, List<Schedule>>> rankedCandidateClasses = new java.util.ArrayList<>(schedulesByClass.entrySet());
        rankedCandidateClasses.sort((e1, e2) -> {
            List<Schedule> list1 = e1.getValue();
            List<Schedule> list2 = e2.getValue();
            GymClass c1 = list1.get(0).getGymClass();
            GymClass c2 = list2.get(0).getGymClass();

            // 1. Cùng bộ môn (Subject)
            boolean sameSubj1 = curClass.getSubjectId() != null && curClass.getSubjectId().equals(c1.getSubjectId());
            boolean sameSubj2 = curClass.getSubjectId() != null && curClass.getSubjectId().equals(c2.getSubjectId());
            if (sameSubj1 != sameSubj2) {
                return sameSubj1 ? -1 : 1;
            }

            // 2. Của tương lai (Bắt đầu sau khi khóa hiện tại kết thúc hoặc sau searchAfterTime)
            boolean afterCur1 = !list1.get(0).getStartTime().isBefore(searchAfterTime);
            boolean afterCur2 = !list2.get(0).getStartTime().isBefore(searchAfterTime);
            if (afterCur1 != afterCur2) {
                return afterCur1 ? -1 : 1;
            }

            // 3. Cùng lịch học - 100% cùng các thứ trong tuần (ví dụ cùng T2-4-6, hoặc cùng T3-5-7)
            java.util.Set<java.time.DayOfWeek> days1 = list1.stream().map(s -> s.getStartTime().getDayOfWeek()).collect(Collectors.toSet());
            java.util.Set<java.time.DayOfWeek> days2 = list2.stream().map(s -> s.getStartTime().getDayOfWeek()).collect(Collectors.toSet());
            boolean exactDays1 = days1.equals(curDaysOfWeek);
            boolean exactDays2 = days2.equals(curDaysOfWeek);
            if (exactDays1 != exactDays2) {
                return exactDays1 ? -1 : 1;
            }

            long matchCount1 = days1.stream().filter(curDaysOfWeek::contains).count();
            long matchCount2 = days2.stream().filter(curDaysOfWeek::contains).count();
            if (matchCount1 != matchCount2) {
                return Long.compare(matchCount2, matchCount1);
            }

            // 4. Cùng khung giờ ca học (Slot)
            java.time.LocalTime t1 = list1.get(0).getStartTime().toLocalTime();
            java.time.LocalTime t2 = list2.get(0).getStartTime().toLocalTime();
            long diff1 = Math.abs(java.time.temporal.ChronoUnit.MINUTES.between(curStartTime, t1));
            long diff2 = Math.abs(java.time.temporal.ChronoUnit.MINUTES.between(curStartTime, t2));
            if (diff1 != diff2) {
                return Long.compare(diff1, diff2);
            }

            // 5. Khai giảng sớm nhất tiếp nối khóa cũ
            int cmpStart = list1.get(0).getStartTime().compareTo(list2.get(0).getStartTime());
            if (cmpStart != 0) {
                return cmpStart;
            }

            // 6. Khác giáo viên thì được (ưu tiên cùng HLV nếu có, nhưng khác HLV vẫn đứng ngay sau)
            boolean sameCoach1 = curClass.getCoach() != null && c1.getCoach() != null && curClass.getCoach().getUserId().equals(c1.getCoach().getUserId());
            boolean sameCoach2 = curClass.getCoach() != null && c2.getCoach() != null && curClass.getCoach().getUserId().equals(c2.getCoach().getUserId());
            if (sameCoach1 != sameCoach2) {
                return sameCoach1 ? -1 : 1;
            }

            return 0;
        });

        List<Booking> activeMemberBookings = bookingRepository.findByUserIdWithDetails(userId).stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                .filter(b -> b.getSchedule().getGymClass() == null || !curClassId.equals(b.getSchedule().getGymClass().getClassId()))
                .toList();

        // 1. Chuỗi mô tả thói quen tập luyện của lớp hiện tại
        LocalTime curEndTimeOfDay = (curSchedule.getEndTime() != null) ? curSchedule.getEndTime().toLocalTime() : curStartTime.plusMinutes(90);
        String currentSchedulePattern = formatDaysOfWeek(curDaysOfWeek) + " (" + formatTimeSlot(curStartTime, curEndTimeOfDay) + ")";

        // 2. Danh sách tất cả các lớp ứng viên cho kỳ tiếp theo (Direction 1: Chọn lớp có gắn sao gợi ý)
        List<ClassRenewalOptionItem> options = new ArrayList<>();
        DateTimeFormatter conflictFmt = DateTimeFormatter.ofPattern("HH:mm dd/MM");

        for (Map.Entry<Integer, List<Schedule>> entry : rankedCandidateClasses) {
            List<Schedule> candidateSchedules = entry.getValue();
            if (candidateSchedules.isEmpty()) continue;
            candidateSchedules.sort(Comparator.comparing(Schedule::getStartTime));
            GymClass candidateClass = candidateSchedules.get(0).getGymClass();

            Schedule firstSession = candidateSchedules.get(0);
            List<Schedule> allClassSessions = scheduleRepository.findAllSchedulesByClassId(candidateClass.getClassId());
            if (!allClassSessions.isEmpty() && allClassSessions.get(0).getStartTime().isBefore(searchAfterTime)) {
                // Khóa học này đã bắt đầu từ kỳ trước (chỉ còn vài buổi sót lại), bỏ qua để chỉ lấy lớp kỳ sau
                continue;
            }
            if (firstSession.getStartTime().isBefore(searchAfterTime)) {
                continue;
            }
            Schedule lastSession = candidateSchedules.get(candidateSchedules.size() - 1);

            Set<DayOfWeek> candDays = candidateSchedules.stream()
                    .map(s -> s.getStartTime().getDayOfWeek())
                    .collect(Collectors.toSet());
            LocalTime candStartTime = firstSession.getStartTime().toLocalTime();
            LocalTime candEndTime = (firstSession.getEndTime() != null)
                    ? firstSession.getEndTime().toLocalTime()
                    : candStartTime.plusMinutes(90);

            boolean isBest = candDays.equals(curDaysOfWeek)
                    && Math.abs(ChronoUnit.MINUTES.between(curStartTime, candStartTime)) <= 15;

            boolean alreadyEnrolled = bookingRepository.existsByUserIdAndClassId(userId, candidateClass.getClassId());

            boolean hasConflict = false;
            String conflictReason = null;
            for (Schedule candSched : candidateSchedules) {
                if (candSched.getStartTime() == null || candSched.getEndTime() == null) continue;
                for (Booking existB : activeMemberBookings) {
                    Schedule existSched = existB.getSchedule();
                    if (existSched != null && existSched.getStartTime() != null && existSched.getEndTime() != null
                            && candSched.getStartTime().isBefore(existSched.getEndTime())
                            && existSched.getStartTime().isBefore(candSched.getEndTime())) {
                        hasConflict = true;
                        String conflictName = (existSched.getGymClass() != null) ? existSched.getGymClass().getClassName() : "Lớp khác";
                        conflictReason = "Trùng giờ với '" + conflictName + "' (" + existSched.getStartTime().format(conflictFmt) + ")";
                        break;
                    }
                }
                if (hasConflict) break;
            }

            int candidateMax = (candidateClass.getMaxSlots() != null) ? candidateClass.getMaxSlots() : 30;
            int candidateBooked = bookingRepository.countBookedUsersByClassId(candidateClass.getClassId());
            int candidateAvail = Math.max(0, candidateMax - candidateBooked);

            ClassRenewalOptionItem item = ClassRenewalOptionItem.builder()
                    .classId(candidateClass.getClassId())
                    .suggestedScheduleId(firstSession.getScheduleId())
                    .className(candidateClass.getClassName())
                    .coachName(candidateClass.getCoach() != null ? candidateClass.getCoach().getFullName() : "N/A")
                    .coachEmail(candidateClass.getCoach() != null ? candidateClass.getCoach().getEmail() : null)
                    .roomName(candidateClass.getRoom() != null ? candidateClass.getRoom().getRoomName() : "N/A")
                    .startTime(firstSession.getStartTime())
                    .endTime(lastSession.getEndTime())
                    .price(candidateClass.getPrice())
                    .maxSlots(candidateMax)
                    .bookedSlots(candidateBooked)
                    .availableSlots(candidateAvail)
                    .daysOfWeekText(formatDaysOfWeek(candDays))
                    .timeSlotText(formatTimeSlot(candStartTime, candEndTime))
                    .isBestMatch(isBest)
                    .matchBadge(isBest ? "⭐ Gợi ý khớp lịch cũ nhất" : null)
                    .alreadyEnrolled(alreadyEnrolled)
                    .hasConflict(hasConflict)
                    .conflictReason(conflictReason)
                    .build();

            options.add(item);
        }

        // Sắp xếp danh sách options:
        // 1. isBestMatch lên đầu
        // 2. Các lớp chưa đăng ký và còn chỗ
        // 3. Khởi hành sớm nhất
        options.sort((o1, o2) -> {
            if (o1.isBestMatch() != o2.isBestMatch()) {
                return o1.isBestMatch() ? -1 : 1;
            }
            if (o1.isAlreadyEnrolled() != o2.isAlreadyEnrolled()) {
                return o1.isAlreadyEnrolled() ? 1 : -1;
            }
            return o1.getStartTime().compareTo(o2.getStartTime());
        });

        // 3. Chọn default target class cho backward compatibility (lấy option khả dụng đầu tiên)
        ClassRenewalOptionItem defaultTarget = options.stream()
                .filter(o -> !o.isAlreadyEnrolled() && !o.isHasConflict() && o.getAvailableSlots() > 0)
                .findFirst()
                .orElse(options.isEmpty() ? null : options.get(0));

        if (defaultTarget == null) {
            throw new RuntimeException("Không tìm thấy lớp học tiếp theo phù hợp cho khóa học: " + className);
        }

        Integer subjectId = curClass.getSubjectId() != null
                ? curClass.getSubjectId()
                : (curClass.getSubject() != null ? curClass.getSubject().getSubjectId() : null);
        String subjectName = (curClass.getSubject() != null)
                ? curClass.getSubject().getSubjectName()
                : null;

        return ClassRenewalSuggestionResponse.builder()
                .currentBookingId(currentBooking.getBookingId())
                .currentClassName(className)
                .currentEndTime(curEndTime)
                .subjectId(subjectId)
                .subjectName(subjectName)
                .currentSchedulePattern(currentSchedulePattern)
                .suggestedScheduleId(defaultTarget.getSuggestedScheduleId())
                .classId(defaultTarget.getClassId())
                .className(defaultTarget.getClassName())
                .coachName(defaultTarget.getCoachName())
                .coachEmail(defaultTarget.getCoachEmail())
                .roomName(defaultTarget.getRoomName())
                .startTime(defaultTarget.getStartTime())
                .endTime(defaultTarget.getEndTime())
                .price(defaultTarget.getPrice())
                .maxSlots(defaultTarget.getMaxSlots())
                .bookedSlots(defaultTarget.getBookedSlots())
                .availableSlots(defaultTarget.getAvailableSlots())
                .options(options)
                .build();
    }

    private String formatDaysOfWeek(Set<DayOfWeek> days) {
        if (days == null || days.isEmpty()) return "";
        List<String> list = new ArrayList<>();
        if (days.contains(DayOfWeek.MONDAY)) list.add("T2");
        if (days.contains(DayOfWeek.TUESDAY)) list.add("T3");
        if (days.contains(DayOfWeek.WEDNESDAY)) list.add("T4");
        if (days.contains(DayOfWeek.THURSDAY)) list.add("T5");
        if (days.contains(DayOfWeek.FRIDAY)) list.add("T6");
        if (days.contains(DayOfWeek.SATURDAY)) list.add("T7");
        if (days.contains(DayOfWeek.SUNDAY)) list.add("CN");
        return "Thứ " + String.join(", ", list);
    }

    private String formatTimeSlot(LocalTime start, LocalTime end) {
        if (start == null) return "";
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        if (end == null) return start.format(timeFmt);
        return start.format(timeFmt) + " - " + end.format(timeFmt);
    }

    @Override
    @Transactional
    public ReceiptResponse confirmClassRenewal(RenewBookingRequest request) {
        bookingRepository.lockOperations();
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        Schedule schedule = scheduleRepository.findById(request.getNewScheduleId())
                .orElseThrow(() -> new RuntimeException("Target schedule not found with ID: " + request.getNewScheduleId()));

        GymClass targetClass = schedule.getGymClass();
        if (targetClass == null) {
            throw new RuntimeException("Target class information is missing.");
        }

        if (bookingRepository.existsByUserIdAndClassId(user.getUserId(), targetClass.getClassId())) {
            throw new IllegalArgumentException("Hội viên đã được đăng ký/gia hạn vào khóa học này rồi (" + targetClass.getClassName() + ").");
        }

        int maxSlots = (targetClass.getMaxSlots() != null) ? targetClass.getMaxSlots() : 30;
        int bookedMembers = bookingRepository.countBookedUsersByClassId(targetClass.getClassId());
        if (bookedMembers >= maxSlots) {
            throw new IllegalStateException("Lớp học đã đủ số lượng học viên (" + maxSlots + "/" + maxSlots + "). Không thể gia hạn.");
        }

        List<Schedule> allBatchSchedules = scheduleRepository.findAllSchedulesByClassId(targetClass.getClassId());
        if (allBatchSchedules.isEmpty()) {
            throw new RuntimeException("Không tìm thấy danh sách buổi học của khóa học đợt mới.");
        }

        List<Booking> existingActiveBookings = bookingRepository.findByUserIdWithDetails(user.getUserId()).stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                .collect(Collectors.toList());

        DateTimeFormatter overlapFmt = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");
        for (Schedule targetSchedule : allBatchSchedules) {
            if ("CANCELLED".equalsIgnoreCase(targetSchedule.getStatus())
                    || targetSchedule.getStartTime() == null
                    || targetSchedule.getEndTime() == null) {
                continue;
            }
            for (Booking existing : existingActiveBookings) {
                Schedule exSched = existing.getSchedule();
                if (exSched == null || exSched.getStartTime() == null || exSched.getEndTime() == null) {
                    continue;
                }
                if (exSched.getGymClass() != null && targetClass.getClassId().equals(exSched.getGymClass().getClassId())) {
                    continue;
                }
                if (targetSchedule.getStartTime().isBefore(exSched.getEndTime())
                        && targetSchedule.getEndTime().isAfter(exSched.getStartTime())) {
                    String conflictClassName = exSched.getGymClass() != null
                            ? exSched.getGymClass().getClassName()
                            : "Lớp học khác";
                    throw new IllegalStateException("Khóa học gia hạn bị trùng lịch với lớp '" + conflictClassName
                            + "' vào lúc " + exSched.getStartTime().format(overlapFmt) + ".");
                }
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<Booking> createdBookings = new ArrayList<>();
        for (Schedule s : allBatchSchedules) {
            if (!bookingRepository.existsByUserIdAndScheduleId(user.getUserId(), s.getScheduleId())) {
                Booking newBooking = Booking.builder()
                        .user(user)
                        .schedule(s)
                        .status("CONFIRMED")
                        .attendanceStatus("NOT_YET")
                        .bookingTime(now)
                        .build();
                newBooking = bookingRepository.save(newBooking);
                createdBookings.add(newBooking);
            }
        }

        // Ghi nhận thanh toán tại quầy (Invoice & Payment)
        java.math.BigDecimal amount = (targetClass.getPrice() != null)
                ? targetClass.getPrice()
                : java.math.BigDecimal.ZERO;

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty())
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";

        com.team4.sportscenter.modules.payment.entities.Invoice invoice = com.team4.sportscenter.modules.payment.entities.Invoice.builder()
                .user(user)
                .totalAmount(amount)
                .status("PAID")
                .createdAt(now)
                .build();
        invoice = invoiceRepository.saveAndFlush(invoice);

        for (Booking b : createdBookings) {
            jdbcTemplate.update("INSERT INTO INVOICE_BOOKINGS(invoice_id, booking_id) VALUES(?, ?)", invoice.getInvoiceId(), b.getBookingId());
        }

        com.team4.sportscenter.modules.payment.entities.InvoiceDetail detail = com.team4.sportscenter.modules.payment.entities.InvoiceDetail.builder()
                .invoice(invoice)
                .gymClass(targetClass)
                .unitPrice(amount)
                .build();
        invoiceDetailRepository.save(detail);

        com.team4.sportscenter.modules.payment.entities.PaymentEntity payment = com.team4.sportscenter.modules.payment.entities.PaymentEntity.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .transactionNo("COUNTER-RENEWAL-" + invoice.getInvoiceId())
                .status("COMPLETED")
                .paymentDate(now)
                .build();
        paymentRepository.saveAndFlush(payment);

        if (notificationService != null && user.getEmail() != null) {
            try {
                notificationService.createNotification(
                        user.getEmail(),
                        "Gia hạn khóa học thành công tại quầy / Class Renewed",
                        "Lễ tân đã hỗ trợ bạn gia hạn thành công khóa học: " + targetClass.getClassName() + ". Học phí: " + amount + " đ (" + method + "). Vui lòng kiểm tra lịch học trong My Schedule.",
                        "PAYMENT"
                );
            } catch (Exception ignored) {}
        }
        return buildReceiptResponse(invoice);
    }

    @Override
    public List<PackageResponse> getAllActivePackages() {
        return packageRepository.findBySellingStatus("SELLING").stream()
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
    public ReceiptResponse subscribePackageForMember(SubscribePackageRequest request) {
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

        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank())
                ? request.getPaymentMethod().toUpperCase()
                : "CASH";

        com.team4.sportscenter.modules.payment.entities.PaymentEntity payment = com.team4.sportscenter.modules.payment.entities.PaymentEntity.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .transactionNo("COUNTER-PKG-" + invoice.getInvoiceId())
                .status("COMPLETED")
                .paymentDate(now)
                .build();
        paymentRepository.saveAndFlush(payment);

        if (notificationService != null && user.getEmail() != null) {
            try {
                notificationService.createNotification(
                        user.getEmail(),
                        "Đăng ký gói hội viên thành công tại quầy / Package Subscribed",
                        "Lễ tân đã hỗ trợ bạn đăng ký thành công gói hội viên: " + pkg.getPackageName()
                                + " (" + (pkg.getDurationDays() != null ? pkg.getDurationDays() : 30) + " ngày). "
                                + "Thời hạn kích hoạt từ " + start + " đến " + end + ". "
                                + "Số tiền: " + amount + " đ (" + method + "). "
                                + "Vui lòng kiểm tra quyền lợi trong mục Package Benefits.",
                        "PAYMENT"
                );
            } catch (Exception ignored) {}
        }
        return buildReceiptResponse(invoice);
    }

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.team4.sportscenter.modules.notification.services.NotificationService notificationService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.team4.sportscenter.modules.member.services.MemberService memberService;

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
                        new com.fasterxml.jackson.core.type.TypeReference<>() {}
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

    @Override
    @Transactional
    public void cancelBookingForMember(CancelClassBookingRequest request) {
        if (request.getBookingId() == null) {
            throw new IllegalArgumentException("Booking ID is required for cancelling a session.");
        }
        bookingRepository.lockOperations();

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + request.getBookingId()));

        if (request.getUserId() != null && !booking.getUser().getUserId().equals(request.getUserId())) {
            throw new IllegalArgumentException("This booking does not belong to the selected member.");
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("This session is already cancelled.");
        }

        if ("PRESENT".equalsIgnoreCase(booking.getAttendanceStatus())) {
            throw new IllegalStateException("Cannot cancel a session that the member has already attended.");
        }

        Schedule schedule = booking.getSchedule();
        if (schedule != null && schedule.getEndTime() != null && schedule.getEndTime().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Cannot cancel a past session.");
        }

        booking.setStatus("CANCELLED");
        bookingRepository.save(booking);

        User member = booking.getUser();
        String className = (schedule != null && schedule.getGymClass() != null)
                ? schedule.getGymClass().getClassName() : "Class Session";
        String sessionTime = (schedule != null && schedule.getStartTime() != null)
                ? schedule.getStartTime().toString().replace('T', ' ') : "";

        // Send in-app notification to member
        if (notificationService != null && member != null && member.getEmail() != null) {
            try {
                String reasonSuffix = (request.getReason() != null && !request.getReason().isBlank())
                        ? " Lý do: " + request.getReason().trim() + "." : "";
                notificationService.createNotification(
                        member.getEmail(),
                        "Lịch tập đã được hủy tại quầy / Session Cancelled",
                        "Lễ tân đã hỗ trợ hủy buổi tập lớp " + className + " (" + sessionTime + ")." + reasonSuffix,
                        "SYSTEM"
                );
            } catch (Exception ignored) {}
        }

        // Record Audit Log
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String actorEmail = (auth != null && auth.getName() != null) ? auth.getName() : "receptionist@nexus.com";
            java.util.Map<String, Object> auditData = new java.util.HashMap<>();
            auditData.put("bookingId", booking.getBookingId());
            auditData.put("userId", member != null ? member.getUserId() : null);
            auditData.put("className", className);
            auditData.put("sessionTime", sessionTime);
            auditData.put("reason", request.getReason());
            auditData.put("actionType", "CANCEL_SINGLE_SESSION");

            jdbcTemplate.update(
                    "INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at) " +
                            "VALUES (?, 'CANCEL_BOOKING_SUPPORT', 'BOOKING', ?, ?, ?, ?)",
                    actorEmail,
                    String.valueOf(booking.getBookingId()),
                    "Receptionist cancelled single session for member " + (member != null ? member.getFullName() : ""),
                    jsonMapper.writeValueAsString(auditData),
                    LocalDateTime.now()
            );
        } catch (Exception ignored) {}
    }

    @Override
    @Transactional
    public int cancelCourseForMember(CancelClassBookingRequest request) {
        if (request.getUserId() == null || request.getClassId() == null) {
            throw new IllegalArgumentException("User ID and Class ID are required to cancel a course.");
        }
        bookingRepository.lockOperations();

        User member = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        List<Booking> userBookings = bookingRepository.findByUserIdWithDetails(request.getUserId()).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && request.getClassId().equals(b.getSchedule().getGymClass().getClassId()))
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .toList();

        if (userBookings.isEmpty()) {
            throw new IllegalStateException("Member does not have any active bookings in this class.");
        }

        LocalDateTime now = LocalDateTime.now();
        List<Booking> cancellableBookings = userBookings.stream()
                .filter(b -> !"PRESENT".equalsIgnoreCase(b.getAttendanceStatus()))
                .filter(b -> b.getSchedule() != null && b.getSchedule().getEndTime() != null && b.getSchedule().getEndTime().isAfter(now))
                .toList();

        if (cancellableBookings.isEmpty()) {
            throw new IllegalStateException("Cannot cancel: All upcoming sessions are already attended or in the past.");
        }

        for (Booking b : cancellableBookings) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }

        String className = cancellableBookings.get(0).getSchedule().getGymClass().getClassName();
        int cancelledCount = cancellableBookings.size();

        // Send Notification
        if (notificationService != null && member.getEmail() != null) {
            try {
                String reasonSuffix = (request.getReason() != null && !request.getReason().isBlank())
                        ? " Lý do: " + request.getReason().trim() + "." : "";
                notificationService.createNotification(
                        member.getEmail(),
                        "Khóa học đã được hủy tại quầy / Course Cancelled",
                        "Lễ tân đã hỗ trợ hủy " + cancelledCount + " buổi học còn lại của khóa " + className + "." + reasonSuffix,
                        "SYSTEM"
                );
            } catch (Exception ignored) {}
        }

        // Record Audit log
        try {
            org.springframework.security.core.Authentication auth =
                    org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String actorEmail = (auth != null && auth.getName() != null) ? auth.getName() : "receptionist@nexus.com";
            java.util.Map<String, Object> auditData = new java.util.HashMap<>();
            auditData.put("classId", request.getClassId());
            auditData.put("userId", member.getUserId());
            auditData.put("className", className);
            auditData.put("cancelledSessionsCount", cancelledCount);
            auditData.put("reason", request.getReason());
            auditData.put("actionType", "CANCEL_ENTIRE_COURSE");

            jdbcTemplate.update(
                    "INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at) " +
                            "VALUES (?, 'CANCEL_COURSE_SUPPORT', 'CLASSES', ?, ?, ?, ?)",
                    actorEmail,
                    String.valueOf(request.getClassId()),
                    "Receptionist cancelled " + cancelledCount + " sessions of " + className + " for member " + member.getFullName(),
                    jsonMapper.writeValueAsString(auditData),
                    LocalDateTime.now()
            );
        } catch (Exception ignored) {}

        return cancelledCount;
    }

    @Override
    public List<com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse> getAvailableClassesForMember(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID is required.");
        }
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("Member not found with ID: " + userId);
        }

        // Get all active classes
        List<Map<String, Object>> activeClassRows = jdbcTemplate.queryForList("""
            SELECT c.class_id, c.class_name, c.price, c.max_slots, c.subject_id,
                   sub.duration_minutes as subject_duration_minutes,
                   u.user_id as coach_id, u.full_name as coach_name,
                   r.room_id, r.room_name
            FROM CLASSES c
            LEFT JOIN SUBJECTS sub ON sub.subject_id = c.subject_id
            LEFT JOIN USERS u ON u.user_id = c.coach_id
            LEFT JOIN ROOMS r ON r.room_id = c.room_id
            WHERE c.status = 'ACTIVE'
            ORDER BY c.class_name
        """);

        // Set of classIds member already booked and CONFIRMED
        Set<Integer> bookedClassIds = bookingRepository.findByUserIdWithDetails(userId).stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null)
                .map(b -> b.getSchedule().getGymClass().getClassId())
                .collect(Collectors.toSet());

        List<com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse> results = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, HH:mm");

        for (Map<String, Object> crow : activeClassRows) {
            Integer classId = (Integer) crow.get("class_id");
            String className = (String) crow.get("class_name");
            java.math.BigDecimal price = (java.math.BigDecimal) crow.get("price");
            Integer maxSlots = crow.get("max_slots") != null ? ((Number) crow.get("max_slots")).intValue() : 20;
            Integer subjectId = crow.get("subject_id") != null ? ((Number) crow.get("subject_id")).intValue() : null;
            Integer subjectDurationMinutes = crow.get("subject_duration_minutes") != null
                    ? ((Number) crow.get("subject_duration_minutes")).intValue()
                    : 90;
            String coachName = (String) crow.get("coach_name");
            Integer roomId = crow.get("room_id") != null ? ((Number) crow.get("room_id")).intValue() : null;
            String roomName = (String) crow.get("room_name");

            // Query future schedules for this class
            List<Map<String, Object>> scheduleRows = jdbcTemplate.queryForList("""
                SELECT schedule_id, start_time, end_time, status
                FROM SCHEDULES
                WHERE class_id = ? AND start_time >= NOW() AND status = 'SCHEDULED'
                ORDER BY start_time
            """, classId);

            if (scheduleRows.isEmpty()) {
                // If there are no future schedules, skip so receptionist only sees classes that can actually be booked
                continue;
            }

            int bookedSlots = 0;
            List<LocalDateTime> startTimes = new ArrayList<>();
            List<LocalDateTime> endTimes = new ArrayList<>();
            List<String> formattedDates = new ArrayList<>();
            Set<DayOfWeek> days = new HashSet<>();

            for (Map<String, Object> srow : scheduleRows) {
                Integer scheduleId = ((Number) srow.get("schedule_id")).intValue();
                Object stObj = srow.get("start_time");
                Object etObj = srow.get("end_time");

                LocalDateTime st = null;
                if (stObj instanceof java.sql.Timestamp ts) st = ts.toLocalDateTime();
                else if (stObj instanceof LocalDateTime ldt) st = ldt;

                LocalDateTime et = null;
                if (etObj instanceof java.sql.Timestamp ts) et = ts.toLocalDateTime();
                else if (etObj instanceof LocalDateTime ldt) et = ldt;

                if (st != null) {
                    startTimes.add(st);
                    days.add(st.getDayOfWeek());
                    formattedDates.add(st.format(formatter));
                }
                if (et != null) {
                    endTimes.add(et);
                }

                // Count booked slots for this schedule
                Integer bCount = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM BOOKINGS WHERE schedule_id = ? AND status = 'CONFIRMED'",
                        Integer.class, scheduleId
                );
                if (bCount != null && bCount > bookedSlots) {
                    bookedSlots = bCount;
                }
            }

            LocalDateTime nextSessionTime = startTimes.isEmpty() ? null : startTimes.get(0);
            LocalDateTime lastSessionTime = endTimes.isEmpty() ? nextSessionTime : endTimes.stream().max(LocalDateTime::compareTo).orElse(nextSessionTime);

            int durationMinutes = subjectDurationMinutes != null ? subjectDurationMinutes : 90;
            if (nextSessionTime != null && !endTimes.isEmpty() && endTimes.get(0) != null) {
                durationMinutes = (int) ChronoUnit.MINUTES.between(nextSessionTime, endTimes.get(0));
            }

            String pattern = days.stream()
                    .sorted()
                    .map(d -> d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .collect(Collectors.joining(", "));

            boolean isBooked = bookedClassIds.contains(classId);

            results.add(com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse.builder()
                    .classId(classId)
                    .subjectId(subjectId)
                    .roomId(roomId)
                    .lastSessionTime(lastSessionTime)
                    .className(className)
                    .coachName(coachName != null ? coachName : "Chưa phân công")
                    .roomName(roomName != null ? roomName : "Phòng tập")
                    .price(price)
                    .maxSlots(maxSlots)
                    .bookedSlots(bookedSlots)
                    .isBookedByMe(isBooked)
                    .totalSessions(scheduleRows.size())
                    .nextSessionTime(nextSessionTime)
                    .durationMinutes(durationMinutes)
                    .schedulePattern(pattern)
                    .upcomingDates(formattedDates)
                    .build());
        }

        results.sort(Comparator.comparing(
                com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse::getNextSessionTime,
                Comparator.nullsLast(Comparator.naturalOrder())
        ).thenComparing(
                com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse::getClassId,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));
        return results;
    }

    @Override
    @Transactional
    public ReceiptResponse enrollMemberToClass(EnrollClassRequest request) {
        if (request.getUserId() == null || request.getClassId() == null) {
            throw new IllegalArgumentException("User ID and Class ID are required to enroll.");
        }
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Member not found with ID: " + request.getUserId()));

        if (memberService == null) {
            throw new IllegalStateException("MemberService is not available.");
        }

        // Check if member already booked this course and CONFIRMED
        boolean alreadyBooked = bookingRepository.findByUserIdWithDetails(user.getUserId()).stream()
                .anyMatch(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus())
                        && b.getSchedule() != null
                        && b.getSchedule().getGymClass() != null
                        && b.getSchedule().getGymClass().getClassId().equals(request.getClassId()));
        if (alreadyBooked) {
            throw new IllegalArgumentException("Hội viên đã tham gia lớp học này rồi / Member is already enrolled in this class.");
        }

        List<Schedule> allClassSchedules = scheduleRepository.findAllSchedulesByClassId(request.getClassId());
        GymClass gymClass = (!allClassSchedules.isEmpty()) ? allClassSchedules.get(0).getGymClass() : null;
        if (gymClass == null) {
            throw new RuntimeException("Không tìm thấy thông tin lớp học / Class not found.");
        }

        int maxSlots = (gymClass.getMaxSlots() != null) ? gymClass.getMaxSlots() : 30;
        int bookedMembers = bookingRepository.countBookedUsersByClassId(gymClass.getClassId());
        if (bookedMembers >= maxSlots) {
            throw new IllegalStateException("Lớp học đã đủ số lượng học viên (" + maxSlots + "/" + maxSlots + ").");
        }

        // Kiểm tra xem hội viên này đã có booking PENDING (trong giỏ hàng) chưa
        List<Booking> pendingBookings = bookingRepository.findByUserIdWithDetails(user.getUserId()).stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())
                        && b.getSchedule() != null
                        && b.getSchedule().getGymClass() != null
                        && b.getSchedule().getGymClass().getClassId().equals(request.getClassId()))
                .toList();

        List<Booking> createdBookings;
        if (!pendingBookings.isEmpty()) {
            // Đã có trong giỏ hàng -> Chuyển trực tiếp sang CONFIRMED
            for (Booking b : pendingBookings) {
                b.setStatus("CONFIRMED");
                bookingRepository.save(b);
            }
            createdBookings = pendingBookings;
        } else {
            // Đặt lớp trực tiếp cho hội viên (tạo các bản ghi bookings)
            memberService.bookClass(user.getEmail(), request.getClassId());

            // Cập nhật tất cả các booking PENDING vừa tạo thành CONFIRMED
            createdBookings = bookingRepository.findByUserIdWithDetails(user.getUserId()).stream()
                    .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus())
                            && b.getSchedule() != null
                            && b.getSchedule().getGymClass() != null
                            && b.getSchedule().getGymClass().getClassId().equals(request.getClassId()))
                    .toList();

            for (Booking b : createdBookings) {
                b.setStatus("CONFIRMED");
                bookingRepository.save(b);
            }
        }

        // Ghi nhận hóa đơn & thanh toán trực tiếp tại quầy (Invoice & Payment)
        java.math.BigDecimal amount = (gymClass.getPrice() != null)
                ? gymClass.getPrice()
                : java.math.BigDecimal.ZERO;

        LocalDateTime now = LocalDateTime.now();
        String method = (request.getPaymentMethod() != null && !request.getPaymentMethod().trim().isEmpty())
                ? request.getPaymentMethod().trim().toUpperCase()
                : "CASH";

        com.team4.sportscenter.modules.payment.entities.Invoice invoice = com.team4.sportscenter.modules.payment.entities.Invoice.builder()
                .user(user)
                .totalAmount(amount)
                .status("PAID")
                .createdAt(now)
                .build();
        invoice = invoiceRepository.saveAndFlush(invoice);

        for (Booking b : createdBookings) {
            jdbcTemplate.update("INSERT INTO INVOICE_BOOKINGS(invoice_id, booking_id) VALUES(?, ?)", invoice.getInvoiceId(), b.getBookingId());
        }

        com.team4.sportscenter.modules.payment.entities.InvoiceDetail detail = com.team4.sportscenter.modules.payment.entities.InvoiceDetail.builder()
                .invoice(invoice)
                .gymClass(gymClass)
                .unitPrice(amount)
                .build();
        invoiceDetailRepository.save(detail);

        com.team4.sportscenter.modules.payment.entities.PaymentEntity payment = com.team4.sportscenter.modules.payment.entities.PaymentEntity.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .transactionNo("COUNTER-CLASS-" + invoice.getInvoiceId())
                .status("COMPLETED")
                .paymentDate(now)
                .build();
        paymentRepository.saveAndFlush(payment);

        if (notificationService != null && user.getEmail() != null) {
            try {
                notificationService.createNotification(
                        user.getEmail(),
                        "Đăng ký lớp học thành công tại quầy / Class Enrolled",
                        "Lễ tân đã hỗ trợ bạn đăng ký thành công vào lớp học: " + gymClass.getClassName() + ". Học phí: " + amount + " đ (" + method + "). Vui lòng kiểm tra lịch học trong My Schedule.",
                        "PAYMENT"
                );
            } catch (Exception ignored) {}
        }
        return buildReceiptResponse(invoice);
    }

    @Override
    public ReceiptResponse getInvoiceReceipt(Integer invoiceId) {
        com.team4.sportscenter.modules.payment.entities.Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found with ID: " + invoiceId));
        return buildReceiptResponse(invoice);
    }

    @Override
    public List<ReceiptResponse> getMemberInvoices(Integer userId) {
        List<com.team4.sportscenter.modules.payment.entities.Invoice> invoices = invoiceRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
        return invoices.stream().map(this::buildReceiptResponse).toList();
    }

    @Override
    public List<ReceiptResponse> getAllInvoices() {
        List<com.team4.sportscenter.modules.payment.entities.Invoice> invoices = invoiceRepository.findAllByOrderByCreatedAtDesc();
        return invoices.stream().map(this::buildReceiptResponse).toList();
    }

    private ReceiptResponse buildReceiptResponse(com.team4.sportscenter.modules.payment.entities.Invoice invoice) {
        if (invoice == null) return null;
        User user = invoice.getUser();

        com.team4.sportscenter.modules.payment.entities.PaymentEntity payment = paymentRepository
                .findByInvoice_InvoiceId(invoice.getInvoiceId())
                .orElse(null);

        List<com.team4.sportscenter.modules.payment.entities.InvoiceDetail> details = invoiceDetailRepository
                .findByInvoice_InvoiceId(invoice.getInvoiceId());

        List<ReceiptResponse.ReceiptItem> items = new ArrayList<>();
        for (com.team4.sportscenter.modules.payment.entities.InvoiceDetail d : details) {
            String itemName = "Dịch vụ thể thao";
            String itemType = "SERVICE";
            Integer durationDays = null;
            Integer totalSessions = null;

            if (d.getAPackage() != null) {
                itemName = d.getAPackage().getPackageName();
                itemType = "PACKAGE";
                durationDays = d.getAPackage().getDurationDays();
            } else if (d.getGymClass() != null) {
                itemName = d.getGymClass().getClassName();
                itemType = "CLASS";
                try {
                    List<Schedule> scheds = scheduleRepository.findAllSchedulesByClassId(d.getGymClass().getClassId());
                    totalSessions = (scheds != null && !scheds.isEmpty()) ? scheds.size() : null;
                } catch (Exception ignored) {}
            }

            items.add(ReceiptResponse.ReceiptItem.builder()
                    .itemName(itemName)
                    .itemType(itemType)
                    .durationDays(durationDays)
                    .totalSessions(totalSessions)
                    .unitPrice(d.getUnitPrice() != null ? d.getUnitPrice() : invoice.getTotalAmount())
                    .amount(d.getUnitPrice() != null ? d.getUnitPrice() : invoice.getTotalAmount())
                    .build());
        }

        if (items.isEmpty()) {
            items.add(ReceiptResponse.ReceiptItem.builder()
                    .itemName("Dịch vụ thể thao / Sports Service")
                    .itemType("OTHER")
                    .unitPrice(invoice.getTotalAmount())
                    .amount(invoice.getTotalAmount())
                    .build());
        }

        String cashier = "Lễ tân quầy / Front Desk";
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !auth.getName().equalsIgnoreCase("anonymousUser")) {
                User cashierUser = userRepository.findByEmail(auth.getName()).orElse(null);
                if (cashierUser != null && cashierUser.getFullName() != null && !cashierUser.getFullName().isBlank()) {
                    cashier = cashierUser.getFullName();
                } else if (auth.getName() != null) {
                    cashier = auth.getName();
                }
            }
        } catch (Exception ignored) {}

        return ReceiptResponse.builder()
                .invoiceId(invoice.getInvoiceId())
                .invoiceCode(String.format("INV-%06d", invoice.getInvoiceId()))
                .createdAt(invoice.getCreatedAt())
                .status(invoice.getStatus())
                .totalAmount(invoice.getTotalAmount())
                .userId(user != null ? user.getUserId() : null)
                .memberName(user != null ? user.getFullName() : null)
                .memberEmail(user != null ? user.getEmail() : null)
                .memberPhone(user != null ? user.getPhone() : null)
                .paymentMethod(payment != null ? payment.getPaymentMethod() : "CASH")
                .transactionNo(payment != null ? payment.getTransactionNo() : ("INV-" + invoice.getInvoiceId()))
                .paymentDate(payment != null ? payment.getPaymentDate() : invoice.getCreatedAt())
                .cashierName(cashier)
                .items(items)
                .build();
    }
}

