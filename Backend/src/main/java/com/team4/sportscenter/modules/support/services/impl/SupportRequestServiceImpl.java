package com.team4.sportscenter.modules.support.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.request.RespondSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.CancelClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
import com.team4.sportscenter.modules.support.dtos.response.TransferClassOptionResponse;
import com.team4.sportscenter.modules.support.dtos.response.TransferClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.UserCreditResponse;
import com.team4.sportscenter.modules.support.entities.SupportRequest;
import com.team4.sportscenter.modules.support.entities.UserCredit;
import com.team4.sportscenter.modules.support.enums.CreditStatus;
import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportPriority;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import com.team4.sportscenter.modules.support.repositories.SupportRequestRepository;
import com.team4.sportscenter.modules.support.repositories.UserCreditRepository;
import com.team4.sportscenter.modules.support.services.SupportRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SupportRequestServiceImpl implements SupportRequestService {

    private boolean isCancellationCategory(SupportCategory category) {
        return category == SupportCategory.CLASS_CANCELLATION || category == SupportCategory.REFUND_REQUEST;
    }

    private List<SupportRequest> findPendingCancellationTickets(Integer userId, Integer classId) {
        return supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), classId))
                .filter(r -> isCancellationCategory(r.getCategory()))
                .filter(r -> r.getStatus() == SupportStatus.PENDING
                        || r.getStatus() == SupportStatus.IN_PROGRESS
                        || r.getStatus() == SupportStatus.ESCALATED)
                .toList();
    }

    private String buildPendingCancellationBlocksTransferMessage(Integer requestId) {
        return "Lớp học này đang có đơn xin hủy / bảo lưu #" + requestId
                + " đang chờ Admin xét duyệt nên tạm thời không thể chuyển lớp. Vui lòng chờ kết quả duyệt hoặc rút đơn trước.";
    }

    private boolean isManagerRoutedCategory(SupportCategory category) {
        return category == SupportCategory.COACH_FEEDBACK
                || category == SupportCategory.FACILITY_ISSUE
                || isCancellationCategory(category);
    }

    private BigDecimal roundToThousand(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(1000));
    }

    private Integer resolveSubjectId(GymClass gymClass) {
        if (gymClass == null) return null;
        if (gymClass.getSubjectId() != null) return gymClass.getSubjectId();
        return gymClass.getSubject() != null ? gymClass.getSubject().getSubjectId() : null;
    }

    @jakarta.annotation.PostConstruct
    public void normalizePriorities() {
        try {
            Integer colCount = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'SUPPORT_REQUESTS' AND column_name = 'evidence_url'",
                    Integer.class
            );
            if (colCount != null && colCount == 0) {
                jdbc.execute("ALTER TABLE SUPPORT_REQUESTS ADD COLUMN evidence_url LONGTEXT NULL");
            }
            // Stop selling legacy paid AI access packages because AI is free for all users
            jdbc.update("UPDATE PACKAGES SET selling_status = 'STOPPED' WHERE package_type = 'AI_ACCESS' AND selling_status <> 'STOPPED'");
            // Only Class Cancellation and Facility Issues are HIGH priority.
            // Normalize coach feedback and general inquiry tickets to NORMAL if they were auto-set to HIGH.
            jdbc.update("UPDATE SUPPORT_REQUESTS SET priority = 'NORMAL' WHERE category IN ('COACH_FEEDBACK', 'FEEDBACK_SERVICE', 'GENERAL_INQUIRY', 'SCHEDULE_SUPPORT', 'COMPLAINT') AND priority = 'HIGH'");
            // Ensure facility issues and cancellation requests have HIGH priority
            jdbc.update("UPDATE SUPPORT_REQUESTS SET priority = 'HIGH' WHERE category IN ('FACILITY_ISSUE', 'CLASS_CANCELLATION', 'REFUND_REQUEST') AND priority = 'NORMAL'");
            // Ensure unclosed coach feedback, facility issue, and cancellation requests are routed directly to Center Manager / Admin (ESCALATED)
            jdbc.update("UPDATE SUPPORT_REQUESTS SET status = 'ESCALATED' WHERE category IN ('COACH_FEEDBACK', 'FACILITY_ISSUE', 'CLASS_CANCELLATION', 'REFUND_REQUEST') AND status = 'PENDING'");
            // Retire legacy SCHEDULE_SUPPORT category into GENERAL_INQUIRY
            jdbc.update("UPDATE SUPPORT_REQUESTS SET category = 'GENERAL_INQUIRY' WHERE category = 'SCHEDULE_SUPPORT'");
        } catch (Exception ignored) {
        }
    }


    private final SupportRequestRepository supportRequestRepository;
    private final UserCreditRepository userCreditRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final CoachClassRepository coachClassRepository;
    private final ScheduleRepository scheduleRepository;
    private final NotificationRepository notificationRepository;
    private final JdbcTemplate jdbc;

    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateCreditCode(Integer classId, Integer userId) {
        return generateCreditCodeWithPrefix("CRED-", classId, userId);
    }

    private String generateCreditCodeWithPrefix(String prefix, Integer classId, Integer userId) {
        int rand = 1000 + RANDOM.nextInt(9000);
        return prefix + (classId != null ? classId : "GEN") + "-" + userId + "-" + rand;
    }

    private record AttendanceSnapshot(int totalSessions, int attendedSessions, int remainingSessions,
                                        boolean hasStarted, boolean exceedsEightyPercent, BigDecimal proratedCredit) {}

    private List<Booking> findClassBookingsForMember(Integer classId, String memberEmail) {
        if (classId == null || memberEmail == null) return List.of();
        return bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId))
                .sorted(Comparator.comparing(b -> b.getSchedule().getStartTime()))
                .toList();
    }

    private AttendanceSnapshot evaluateAttendance(GymClass gymClass, List<Booking> bookings, LocalDateTime cutoff) {
        if (bookings == null || bookings.isEmpty()) {
            return new AttendanceSnapshot(0, 0, 0, false, false, BigDecimal.ZERO);
        }
        LocalDateTime effectiveCutoff = cutoff != null ? cutoff : LocalDateTime.now();
        int totalSessions = bookings.size();
        LocalDateTime firstSessionTime = bookings.get(0).getSchedule().getStartTime();
        int attendedSessions = (int) bookings.stream()
                .filter(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                        || (b.getSchedule() != null && b.getSchedule().getStartTime() != null
                            && b.getSchedule().getStartTime().isBefore(effectiveCutoff)))
                .count();
        boolean hasStarted = (firstSessionTime != null && firstSessionTime.isBefore(effectiveCutoff))
                || attendedSessions > 0;
        int remainingSessions = Math.max(0, totalSessions - attendedSessions);
        BigDecimal classPrice = gymClass != null && gymClass.getPrice() != null ? gymClass.getPrice() : BigDecimal.ZERO;
        boolean exceedsEightyPercent = false;

        BigDecimal credit;
        if (!hasStarted) {
            credit = roundToThousand(classPrice.multiply(BigDecimal.valueOf(50))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP));
        } else if (remainingSessions <= 0) {
            credit = BigDecimal.ZERO;
        } else {
            BigDecimal raw = classPrice
                    .multiply(BigDecimal.valueOf(remainingSessions))
                    .divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);
            credit = roundToThousand(raw);
        }
        return new AttendanceSnapshot(totalSessions, attendedSessions, remainingSessions, hasStarted, exceedsEightyPercent, credit);
    }

    private void autoRejectOverLimitCancellationTickets() {
        // Legacy 80% auto-rejection disabled per finalized 1-week + Admin evidence review rules
    }

    private String formatVndAmount(BigDecimal amount) {
        if (amount == null) return "0đ";
        return String.format("%,d", amount.longValue()).replace(',', '.') + "đ";
    }

    @Override
    @Transactional(readOnly = true)
    public CancelClassPreviewResponse getCancelClassPreview(Integer classId, String memberEmail) {
        userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        GymClass gymClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));

        List<Booking> allClassBookings = findClassBookingsForMember(classId, memberEmail);

        if (allClassBookings.isEmpty()) {
            throw new IllegalArgumentException("No bookings found for class: " + classId);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime firstSessionTime = allClassBookings.get(0).getSchedule().getStartTime();
        AttendanceSnapshot snap = evaluateAttendance(gymClass, allClassBookings, now);
        int totalSessions = snap.totalSessions();
        int attendedSessions = snap.attendedSessions();
        int remainingSessions = snap.remainingSessions();
        boolean hasStarted = snap.hasStarted();
        boolean exceedsEightyPercent = snap.exceedsEightyPercent();
        BigDecimal classPrice = gymClass.getPrice() != null ? gymClass.getPrice() : BigDecimal.ZERO;
        BigDecimal estimatedCreditAmount = snap.proratedCredit();

        boolean hasActiveBookings = allClassBookings.stream().anyMatch(b -> !"CANCELLED".equals(b.getStatus()));
        boolean isCompletedCourse = totalSessions > 0 && remainingSessions <= 0;
        boolean isAtLeastOneWeekBeforeStart = !hasStarted && firstSessionTime != null
                && !now.isAfter(firstSessionTime.minusDays(7));
        boolean withinSevenDays = !hasStarted && !isAtLeastOneWeekBeforeStart;
        long daysUntilStart = firstSessionTime != null ? Math.max(0L, ChronoUnit.DAYS.between(now, firstSessionTime)) : 0L;
        boolean canDirectCancelWithCredit = !isCompletedCourse && isAtLeastOneWeekBeforeStart && hasActiveBookings;

        String message;
        if (isCompletedCourse) {
            message = "Bạn đã hoàn thành khóa học rồi.";
        } else if (isAtLeastOneWeekBeforeStart) {
            message = "Hủy trước 1 tuần: mất 50%, hoàn 50% dưới dạng Voucher (hạn 60 ngày).";
        } else {
            message = "Hủy sau 1 tuần: mất 100% học phí. Chọn hủy ngay (0đ) hoặc gửi bằng chứng chờ Admin duyệt hoàn Voucher.";
        }

        return CancelClassPreviewResponse.builder()
                .classId(classId)
                .className(gymClass.getClassName())
                .classPrice(classPrice)
                .totalSessions(totalSessions)
                .attendedSessions(attendedSessions)
                .remainingSessions(remainingSessions)
                .firstSessionTime(firstSessionTime)
                .hasStarted(hasStarted)
                .withinSevenDays(withinSevenDays)
                .daysUntilStart(daysUntilStart)
                .canDirectCancelWithCredit(canDirectCancelWithCredit)
                .exceedsEightyPercent(exceedsEightyPercent)
                .eligibleForVoucher(!isCompletedCourse && !exceedsEightyPercent)
                .eligibleForCompensation(!isCompletedCourse && !exceedsEightyPercent)
                .estimatedCreditAmount(estimatedCreditAmount)
                .proratedCredit(estimatedCreditAmount)
                .message(message)
                .policyNotice(message)
                .build();
    }

    @Override
    public Map<String, Object> cancelClassDirectly(Integer classId, String memberEmail) {
        return cancelClassDirectly(classId, memberEmail, false);
    }

    @Override
    public Map<String, Object> cancelClassDirectly(Integer classId, String memberEmail, boolean acceptForfeit) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        CancelClassPreviewResponse preview = getCancelClassPreview(classId, memberEmail);
        if (preview.getTotalSessions() > 0 && preview.getRemainingSessions() <= 0) {
            throw new IllegalStateException("Bạn đã hoàn thành khóa học rồi.");
        }
        boolean forfeitMode = !preview.isCanDirectCancelWithCredit();
        if (forfeitMode && !acceptForfeit) {
            throw new IllegalStateException("Chỉ được hủy trực tiếp nhận 50% Voucher khi hủy trước ngày khai giảng ít nhất 1 tuần (7 ngày). Với trường hợp dưới 7 ngày hoặc lớp đã bắt đầu, vui lòng gửi đơn kèm lý do và bằng chứng để Admin xét duyệt, hoặc xác nhận chấp nhận mất 100% học phí để hủy ngay.");
        }

        GymClass gymClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));

        List<Booking> bookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                        && !"CANCELLED".equalsIgnoreCase(b.getStatus())
                        && (!forfeitMode || !"PRESENT".equalsIgnoreCase(b.getAttendanceStatus())))
                .toList();

        if (bookings.isEmpty()) {
            throw new IllegalStateException(forfeitMode
                    ? "Lớp học không còn buổi chưa điểm danh nào để hủy."
                    : "Không tìm thấy buổi học hoạt động nào để hủy.");
        }

        for (Booking b : bookings) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }

        String creditCode = null;
        BigDecimal creditAmount = BigDecimal.ZERO;
        LocalDate expiryDate = null;

        SupportRequest autoTicket = SupportRequest.builder()
                .user(user)
                .gymClass(gymClass)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution(forfeitMode ? "NO_REFUND" : "ISSUE_CREDIT")
                .title(forfeitMode
                        ? "Hủy lớp (chấp nhận mất 100% học phí): " + gymClass.getClassName()
                        : "Hoàn 50% Voucher hủy lớp trước 1 tuần: " + gymClass.getClassName())
                .content(forfeitMode
                        ? "Hội viên đã xác nhận hủy lớp sau mốc 1 tuần trước khai giảng và chấp nhận mất 100% học phí (không hoàn tiền / không cấp Voucher). Hệ thống đã giải phóng " + bookings.size() + " buổi học còn lại."
                        : "Hội viên đã hủy lớp trước ngày khai giảng từ 1 tuần (7 ngày) trở lên. Hệ thống đã tự động hoàn 50% học phí dưới dạng Voucher tín dụng (hạn 60 ngày).")
                .status(SupportStatus.APPROVED)
                .priority(SupportPriority.NORMAL)
                .respondedAt(LocalDateTime.now())
                .build();

        if (!forfeitMode) {
            creditAmount = preview.getEstimatedCreditAmount();
            creditCode = generateCreditCode(classId, user.getUserId());
            expiryDate = LocalDate.now().plusDays(60);
            autoTicket.setResponseNote("Hệ thống tự động phê duyệt hoàn 50% học phí dưới dạng Voucher cho lớp " + gymClass.getClassName() + ". Mã Voucher: " + creditCode + " trị giá " + formatVndAmount(creditAmount) + " (Hạn dùng 60 ngày).");
        } else {
            autoTicket.setResponseNote("Hệ thống đã hủy trực tiếp lớp " + gymClass.getClassName() + " theo xác nhận chấp nhận mất 100% học phí của hội viên và giải phóng " + bookings.size() + " buổi học còn lại.");
        }

        SupportRequest savedTicket = supportRequestRepository.save(autoTicket);

        if (!forfeitMode) {
            UserCredit credit = UserCredit.builder()
                    .user(user)
                    .gymClass(gymClass)
                    .supportRequest(savedTicket)
                    .creditCode(creditCode)
                    .amount(creditAmount)
                    .remainingAmount(creditAmount)
                    .reason("Hoàn 50% học phí do hủy lớp trước 1 tuần: " + gymClass.getClassName())
                    .expiryDate(expiryDate)
                    .status(CreditStatus.ACTIVE)
                    .build();
            userCreditRepository.save(credit);
        }

        // Auto-close any pending duplicate support requests for this member & class
        List<SupportRequest> pendingDuplicateTickets = findPendingCancellationTickets(user.getUserId(), classId).stream()
                .filter(r -> !Objects.equals(r.getRequestId(), savedTicket.getRequestId()))
                .toList();

        for (SupportRequest pt : pendingDuplicateTickets) {
            pt.setStatus(SupportStatus.RESOLVED);
            pt.setPreferredResolution("SUPERSEDED");
            pt.setResponseNote(forfeitMode
                    ? "Hệ thống tự động đóng đơn do hội viên đã hủy lớp trực tiếp (chấp nhận mất 100% học phí) qua đơn #" + savedTicket.getRequestId() + "."
                    : "Hệ thống tự động đóng đơn do hội viên đã hủy trực tiếp và nhận voucher 50% qua đơn #" + savedTicket.getRequestId() + ".");
            pt.setRespondedAt(LocalDateTime.now());
            supportRequestRepository.save(pt);
        }

        Notification notif = Notification.builder()
                .user(user)
                .title(forfeitMode ? "Xác nhận hủy lớp (mất 100% học phí)" : "Hoàn 50% Credit hủy lớp học")
                .message(forfeitMode
                        ? "Bạn đã xác nhận hủy trực tiếp lớp " + gymClass.getClassName() + " và chấp nhận mất 100% học phí (không hoàn tiền/Voucher). " + bookings.size() + " buổi học còn lại đã được giải phóng khỏi lịch của bạn."
                        : "Bạn đã hủy đăng ký lớp " + gymClass.getClassName() + " trước khai giảng 1 tuần và nhận được Voucher hoàn 50% học phí trị giá "
                                + formatVndAmount(creditAmount) + " (Mã: " + creditCode + "), hạn sử dụng đến ngày " + expiryDate + ".")
                .type("BOOKING")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        String cancelMemberName = user.getFullName() != null ? user.getFullName() : "Hội viên";
        notifyReceptionists(
                forfeitMode
                        ? "Hội viên hủy lớp trực tiếp (mất 100% học phí) #" + savedTicket.getRequestId()
                        : "Hội viên hủy lớp trực tiếp #" + savedTicket.getRequestId(),
                forfeitMode
                        ? "Hội viên " + cancelMemberName + " (#" + user.getUserId() + ") vừa hủy trực tiếp lớp "
                                + gymClass.getClassName() + " (chấp nhận mất 100% học phí, đã hủy " + bookings.size() + " buổi còn lại)."
                        : "Hội viên " + cancelMemberName + " (#" + user.getUserId() + ") vừa hủy lớp "
                                + gymClass.getClassName() + " trước khai giảng >= 7 ngày và nhận voucher 50% trị giá " + formatVndAmount(creditAmount) + " (Mã: " + creditCode + ").",
                "SUPPORT"
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("forfeitAccepted", forfeitMode);
        result.put("classId", classId);
        result.put("className", gymClass.getClassName());
        result.put("requestId", savedTicket.getRequestId());
        result.put("cancelledBookingsCount", bookings.size());
        result.put("creditCode", creditCode);
        result.put("creditAmount", creditAmount);
        result.put("expiryDate", expiryDate != null ? expiryDate.toString() : null);
        result.put("message", forfeitMode
                ? "Đã hủy lớp thành công (chấp nhận mất 100% học phí). Các buổi học còn lại đã được giải phóng."
                : "Đã hủy lớp thành công và hoàn 50% học phí dưới dạng Voucher tín dụng.");
        return result;
    }

    public static final long TRANSFER_MIN_HOURS_BEFORE_START = 24L;

    /**
     * Validates that a class starts at least {@link #TRANSFER_MIN_HOURS_BEFORE_START} hours in the future.
     * Returns null when eligible, or a localized error message when blocked.
     */
    public static String validateClassTransferWindow(
            LocalDateTime firstSessionTime,
            boolean anySessionStartedOrPresent,
            LocalDateTime now,
            boolean isTargetClass) {
        if (firstSessionTime == null || firstSessionTime.isBefore(now) || anySessionStartedOrPresent) {
            return isTargetClass
                    ? "Lớp học mục tiêu đã bắt đầu, không thể chuyển vào."
                    : "Khóa học đã bắt đầu hoặc đã có buổi học diễn ra. Chỉ được chuyển lớp trước giờ khai giảng tối thiểu 24 giờ. Nếu cần bảo lưu, vui lòng gửi phiếu hỗ trợ.";
        }
        if (firstSessionTime.isBefore(now.plusHours(TRANSFER_MIN_HOURS_BEFORE_START))) {
            return isTargetClass
                    ? "Lớp học mục tiêu sắp khai giảng trong vòng 24 giờ tới, không thể chuyển vào."
                    : "Chỉ được chuyển lớp trước giờ khai giảng tối thiểu 24 giờ. Lớp của bạn sắp bắt đầu trong vòng 24 giờ tới nên không thể chuyển lớp trực tiếp.";
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public TransferClassPreviewResponse getTransferClassPreview(Integer classId, String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        GymClass currentClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));

        List<Booking> currentBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                        && !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .sorted(Comparator.comparing(b -> b.getSchedule().getStartTime()))
                .toList();

        if (currentBookings.isEmpty()) {
            throw new IllegalArgumentException("Bạn chưa đăng ký lớp học này.");
        }

        LocalDateTime now = LocalDateTime.now();
        int totalSessions = currentBookings.size();
        LocalDateTime firstSessionTime = currentBookings.get(0).getSchedule().getStartTime();
        boolean anyStartedOrPresent = currentBookings.stream().anyMatch(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)));
        boolean hasStarted = firstSessionTime.isBefore(now) || anyStartedOrPresent;
        List<SupportRequest> pendingCancelTickets = findPendingCancellationTickets(user.getUserId(), classId);
        boolean blockedByPendingRequest = !pendingCancelTickets.isEmpty();
        String transferWindowError = blockedByPendingRequest
                ? buildPendingCancellationBlocksTransferMessage(pendingCancelTickets.get(0).getRequestId())
                : validateClassTransferWindow(firstSessionTime, anyStartedOrPresent, now, false);

        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("MMM dd, HH:mm");
        DateTimeFormatter conflictFmt = DateTimeFormatter.ofPattern("dd/MM HH:mm");

        Set<DayOfWeek> currentDays = currentBookings.stream()
                .map(b -> b.getSchedule().getStartTime().getDayOfWeek())
                .collect(Collectors.toSet());
        String currentPattern = currentDays.stream()
                .sorted()
                .map(d -> d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                .collect(Collectors.joining(", "));
        List<String> currentDates = currentBookings.stream()
                .map(b -> b.getSchedule().getStartTime().format(dateFmt))
                .toList();

        BigDecimal targetPrice = currentClass.getPrice() != null ? currentClass.getPrice() : BigDecimal.ZERO;

        if (transferWindowError != null) {
            return TransferClassPreviewResponse.builder()
                    .classId(classId)
                    .subjectId(currentClass.getSubject() != null ? currentClass.getSubject().getSubjectId() : null)
                    .subjectName(currentClass.getSubject() != null ? currentClass.getSubject().getSubjectName() : null)
                    .className(currentClass.getClassName())
                    .coachName(currentClass.getCoach() != null ? currentClass.getCoach().getFullName() : null)
                    .roomName(currentClass.getRoom() != null ? currentClass.getRoom().getRoomName() : null)
                    .classPrice(targetPrice)
                    .totalSessions(totalSessions)
                    .firstSessionTime(firstSessionTime)
                    .schedulePattern(currentPattern)
                    .upcomingDates(currentDates)
                    .hasStarted(hasStarted)
                    .blockedByPendingRequest(blockedByPendingRequest)
                    .canTransfer(false)
                    .message(transferWindowError)
                    .equivalentClasses(Collections.emptyList())
                    .build();
        }

        // Find other candidate classes
        List<Schedule> allAvailableSchedules = scheduleRepository.findAvailableSchedules(now);
        Map<GymClass, List<Schedule>> classSchedules = allAvailableSchedules.stream()
                .collect(Collectors.groupingBy(Schedule::getGymClass, LinkedHashMap::new, Collectors.toList()));

        Set<Integer> myConfirmedClassIds = bookingRepository.findConfirmedClassIdsByEmail(memberEmail);
        Set<Integer> myPendingClassIds = bookingRepository.findPendingClassIdsByEmail(memberEmail);

        List<Booking> otherActiveBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                .filter(b -> b.getSchedule().getGymClass() != null && !Objects.equals(b.getSchedule().getGymClass().getClassId(), classId))
                .toList();

        List<TransferClassOptionResponse> options = new ArrayList<>();
        Integer currentSubjectId = resolveSubjectId(currentClass);

        for (Map.Entry<GymClass, List<Schedule>> entry : classSchedules.entrySet()) {
            GymClass candidate = entry.getKey();
            List<Schedule> scheds = entry.getValue();

            if (Objects.equals(candidate.getClassId(), classId)) continue;
            if (!"ACTIVE".equalsIgnoreCase(candidate.getStatus())) continue;

            // Must belong to the same subject
            Integer candSubjectId = resolveSubjectId(candidate);
            if (!Objects.equals(currentSubjectId, candSubjectId)) continue;

            // Must be same price
            BigDecimal candPrice = candidate.getPrice() != null ? candidate.getPrice() : BigDecimal.ZERO;
            if (candPrice.compareTo(targetPrice) != 0) continue;

            // Member must not already be booked or pending
            if (myConfirmedClassIds.contains(candidate.getClassId()) || myPendingClassIds.contains(candidate.getClassId())) {
                continue;
            }

            scheds.sort(Comparator.comparing(Schedule::getStartTime));
            LocalDateTime candFirstSession = scheds.get(0).getStartTime();

            // Candidate class must start at least 24 hours in the future
            if (validateClassTransferWindow(candFirstSession, false, now, true) != null) continue;

            int maxBooked = 0;
            for (Schedule s : scheds) {
                int booked = bookingRepository.countBookedSlots(s.getScheduleId());
                if (booked > maxBooked) maxBooked = booked;
            }

            boolean isFull = maxBooked >= (candidate.getMaxSlots() != null ? candidate.getMaxSlots() : 0);

            // Schedule conflict check against member's other active classes
            boolean hasConflict = false;
            String conflictDetail = null;

            for (Schedule candSched : scheds) {
                for (Booking otherB : otherActiveBookings) {
                    Schedule otherSched = otherB.getSchedule();
                    if (candSched.getStartTime().isBefore(otherSched.getEndTime())
                            && otherSched.getStartTime().isBefore(candSched.getEndTime())) {
                        hasConflict = true;
                        conflictDetail = "Trùng với lớp '" + otherSched.getGymClass().getClassName()
                                + "' (" + candSched.getStartTime().format(conflictFmt) + ")";
                        break;
                    }
                }
                if (hasConflict) break;
            }

            Set<DayOfWeek> candDays = scheds.stream()
                    .map(s -> s.getStartTime().getDayOfWeek())
                    .collect(Collectors.toSet());
            String candPattern = candDays.stream()
                    .sorted()
                    .map(d -> d.getDisplayName(TextStyle.SHORT, Locale.ENGLISH))
                    .collect(Collectors.joining(", "));
            List<String> candDates = scheds.stream()
                    .map(s -> s.getStartTime().format(dateFmt))
                    .toList();

            options.add(TransferClassOptionResponse.builder()
                    .classId(candidate.getClassId())
                    .subjectId(candidate.getSubject() != null ? candidate.getSubject().getSubjectId() : null)
                    .subjectName(candidate.getSubject() != null ? candidate.getSubject().getSubjectName() : null)
                    .className(candidate.getClassName())
                    .coachName(candidate.getCoach() != null ? candidate.getCoach().getFullName() : null)
                    .roomName(candidate.getRoom() != null ? candidate.getRoom().getRoomName() : null)
                    .price(candPrice)
                    .maxSlots(candidate.getMaxSlots())
                    .bookedSlots(maxBooked)
                    .totalSessions(scheds.size())
                    .nextSessionTime(candFirstSession)
                    .schedulePattern(candPattern)
                    .upcomingDates(candDates)
                    .hasConflict(hasConflict)
                    .conflictDetail(conflictDetail)
                    .isFull(isFull)
                    .canSelect(!isFull && !hasConflict)
                    .build());
        }

        // Sort: selectable first, then related subject, then earliest start time
        options.sort(Comparator.comparing(TransferClassOptionResponse::isCanSelect).reversed()
                .thenComparing((TransferClassOptionResponse opt) -> !Objects.equals(currentSubjectId, opt.getSubjectId()))
                .thenComparing(TransferClassOptionResponse::getNextSessionTime));

        long selectableCount = options.stream().filter(TransferClassOptionResponse::isCanSelect).count();
        String message = options.isEmpty() || selectableCount == 0
                ? "Hiện tại không có lớp học phù hợp để chuyển."
                : "Tìm thấy " + selectableCount + " lớp học cùng bộ môn đồng giá (" + targetPrice.longValue() + "đ) chưa khai giảng.";

        return TransferClassPreviewResponse.builder()
                .classId(classId)
                .subjectId(currentClass.getSubject() != null ? currentClass.getSubject().getSubjectId() : null)
                .subjectName(currentClass.getSubject() != null ? currentClass.getSubject().getSubjectName() : null)
                .className(currentClass.getClassName())
                .coachName(currentClass.getCoach() != null ? currentClass.getCoach().getFullName() : null)
                .roomName(currentClass.getRoom() != null ? currentClass.getRoom().getRoomName() : null)
                .classPrice(targetPrice)
                .totalSessions(totalSessions)
                .firstSessionTime(firstSessionTime)
                .schedulePattern(currentPattern)
                .upcomingDates(currentDates)
                .hasStarted(false)
                .canTransfer(true)
                .message(message)
                .equivalentClasses(options)
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> transferClassDirectly(Integer fromClassId, Integer toClassId, String memberEmail) {
        bookingRepository.lockOperations();

        if (Objects.equals(fromClassId, toClassId)) {
            throw new IllegalArgumentException("Không thể chuyển sang cùng một lớp học.");
        }

        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        GymClass fromClass = coachClassRepository.findById(fromClassId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + fromClassId));

        GymClass toClass = coachClassRepository.findById(toClassId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + toClassId));

        // 1. Verify fromClass eligibility
        List<Booking> fromBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), fromClassId)
                        && !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .sorted(Comparator.comparing(b -> b.getSchedule().getStartTime()))
                .toList();

        if (fromBookings.isEmpty()) {
            throw new IllegalStateException("Bạn chưa đăng ký lớp học này.");
        }

        List<SupportRequest> pendingCancelTickets = findPendingCancellationTickets(user.getUserId(), fromClassId);
        if (!pendingCancelTickets.isEmpty()) {
            throw new IllegalStateException(
                    buildPendingCancellationBlocksTransferMessage(pendingCancelTickets.get(0).getRequestId()));
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromFirstSession = fromBookings.get(0).getSchedule().getStartTime();
        boolean fromAnyStartedOrPresent = fromBookings.stream().anyMatch(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)));
        String fromWindowError = validateClassTransferWindow(fromFirstSession, fromAnyStartedOrPresent, now, false);
        if (fromWindowError != null) {
            throw new IllegalStateException(fromWindowError);
        }

        // 2. Verify toClass eligibility
        if (!"ACTIVE".equalsIgnoreCase(toClass.getStatus())) {
            throw new IllegalStateException("Không thể chuyển sang lớp học đang ngừng hoạt động.");
        }

        if (!Objects.equals(resolveSubjectId(fromClass), resolveSubjectId(toClass))) {
            throw new IllegalStateException("Không thể chuyển lớp: Lớp chuyển đến phải thuộc cùng bộ môn với lớp hiện tại.");
        }

        BigDecimal fromPrice = fromClass.getPrice() != null ? fromClass.getPrice() : BigDecimal.ZERO;
        BigDecimal toPrice = toClass.getPrice() != null ? toClass.getPrice() : BigDecimal.ZERO;
        if (fromPrice.compareTo(toPrice) != 0) {
            throw new IllegalArgumentException("Không thể chuyển lớp: Học phí lớp mới (" + toPrice.longValue()
                    + "đ) không tương đương lớp cũ (" + fromPrice.longValue() + "đ).");
        }

        if (bookingRepository.existsConfirmedByEmailAndClassId(memberEmail, toClassId)
                || bookingRepository.existsPendingByEmailAndClassId(memberEmail, toClassId)) {
            throw new IllegalStateException("Bạn đã đăng ký hoặc đang giữ chỗ lớp học mục tiêu.");
        }

        List<Schedule> toSchedules = scheduleRepository.findAvailableSchedulesByClassId(toClassId, now);
        if (toSchedules.isEmpty()) {
            throw new IllegalStateException("Lớp học mục tiêu không có lịch học tương lai khả dụng.");
        }

        toSchedules.sort(Comparator.comparing(Schedule::getStartTime));
        String toWindowError = validateClassTransferWindow(toSchedules.get(0).getStartTime(), false, now, true);
        if (toWindowError != null) {
            throw new IllegalStateException(toWindowError);
        }

        int maxBooked = 0;
        for (Schedule s : toSchedules) {
            int booked = bookingRepository.countBookedSlots(s.getScheduleId());
            if (booked > maxBooked) maxBooked = booked;
        }

        if (maxBooked >= (toClass.getMaxSlots() != null ? toClass.getMaxSlots() : 0)) {
            throw new IllegalStateException("Lớp học mục tiêu đã hết chỗ trống (" + maxBooked + "/" + toClass.getMaxSlots() + ").");
        }

        // Check schedule conflict against other active bookings (excluding fromClassId)
        List<Booking> otherActiveBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                .filter(b -> b.getSchedule().getGymClass() != null && !Objects.equals(b.getSchedule().getGymClass().getClassId(), fromClassId))
                .toList();

        DateTimeFormatter conflictFmt = DateTimeFormatter.ofPattern("dd/MM HH:mm");
        for (Schedule newSched : toSchedules) {
            for (Booking otherB : otherActiveBookings) {
                Schedule otherSched = otherB.getSchedule();
                if (newSched.getStartTime().isBefore(otherSched.getEndTime())
                        && otherSched.getStartTime().isBefore(newSched.getEndTime())) {
                    throw new IllegalStateException("Xung đột lịch học! Buổi học lúc " + newSched.getStartTime().format(conflictFmt)
                            + " bị trùng với lớp '" + otherSched.getGymClass().getClassName() + "'.");
                }
            }
        }

        // 3. Perform atomic transfer
        for (Booking b : fromBookings) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }

        LocalDateTime bookingNow = LocalDateTime.now();
        List<Booking> newBookings = new ArrayList<>();
        for (Schedule s : toSchedules) {
            Booking b = new Booking();
            b.setUser(user);
            b.setSchedule(s);
            b.setStatus("CONFIRMED");
            b.setBookingTime(bookingNow);
            b.setAttendanceStatus("NOT_YET");
            newBookings.add(b);
        }
        bookingRepository.saveAllAndFlush(newBookings);

        // 4. Log 1: AUDIT_LOGS
        String changesJson = String.format("{\"fromClassId\":%d,\"fromClassName\":\"%s\",\"toClassId\":%d,\"toClassName\":\"%s\",\"price\":%s,\"transferredAt\":\"%s\"}",
                fromClassId, fromClass.getClassName().replace("\"", "\\\""),
                toClassId, toClass.getClassName().replace("\"", "\\\""),
                toPrice.toPlainString(),
                LocalDateTime.now());
        jdbc.update("INSERT INTO AUDIT_LOGS (actor_email, action, entity_type, entity_id, details, changes_json, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                memberEmail, "CLASS_TRANSFER", "CLASS", String.valueOf(toClassId),
                "Hội viên tự chuyển lớp từ '" + fromClass.getClassName() + "' sang '" + toClass.getClassName() + "'",
                changesJson);

        // 5. Log 2: SUPPORT_REQUESTS (Auto-approved history)
        SupportRequest transferTicket = SupportRequest.builder()
                .user(user)
                .gymClass(toClass)
                .category(SupportCategory.GENERAL_INQUIRY)
                .preferredResolution("APPROVE_GENERAL")
                .title("Chuyển lớp tự động: " + fromClass.getClassName() + " ➔ " + toClass.getClassName())
                .content("Học viên đã tự chuyển lớp thành công trước khai giảng từ lớp '"
                        + fromClass.getClassName() + "' sang lớp '" + toClass.getClassName() + "' (học phí tương đương).")
                .status(SupportStatus.APPROVED)
                .priority(SupportPriority.NORMAL)
                .responseNote("Hệ thống tự động phê duyệt chuyển lớp từ " + fromClass.getClassName() + " sang " + toClass.getClassName() + ".")
                .respondedAt(LocalDateTime.now())
                .build();
        SupportRequest savedTicket = supportRequestRepository.save(transferTicket);

        // Auto-close any remaining non-cancellation pending tickets for the old class
        List<SupportRequest> oldTickets = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), fromClassId))
                .filter(r -> r.getCategory() == SupportCategory.SCHEDULE_SUPPORT)
                .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                .toList();
        for (SupportRequest pt : oldTickets) {
            pt.setStatus(SupportStatus.RESOLVED);
            pt.setPreferredResolution("SUPERSEDED");
            pt.setResponseNote("Hệ thống tự động đóng đơn do học viên đã chuyển sang lớp: " + toClass.getClassName() + " (Đơn #" + savedTicket.getRequestId() + ").");
            pt.setRespondedAt(LocalDateTime.now());
            supportRequestRepository.save(pt);
        }

        // 6. Log 3: NOTIFICATIONS
        Notification notif = Notification.builder()
                .user(user)
                .title("Chuyển lớp học thành công / Class Transferred")
                .message("Bạn đã chuyển thành công từ lớp '" + fromClass.getClassName() + "' sang lớp '"
                        + toClass.getClassName() + "'. Lịch tập mới đã được cập nhật vào My Schedule.")
                .type("BOOKING")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("fromClassId", fromClassId);
        result.put("fromClassName", fromClass.getClassName());
        result.put("toClassId", toClassId);
        result.put("toClassName", toClass.getClassName());
        result.put("totalSessions", toSchedules.size());
        result.put("requestId", savedTicket.getRequestId());
        result.put("message", "Chuyển lớp thành công sang " + toClass.getClassName() + "!");
        return result;
    }

    @Override
    public SupportRequestResponse createSupportRequest(CreateSupportRequest request, String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        GymClass gymClass = null;
        if (request.getClassId() != null) {
            gymClass = coachClassRepository.findById(request.getClassId()).orElse(null);
        }

        boolean isCancellationCategory = isCancellationCategory(request.getCategory());
        String evidenceUrl = request.getEvidenceUrl() != null && !request.getEvidenceUrl().isBlank()
                ? request.getEvidenceUrl().trim()
                : null;

        if (isCancellationCategory && request.getClassId() != null) {
            // 1. Check if user actually has active bookings for this class
            List<Booking> activeBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                            && Objects.equals(b.getSchedule().getGymClass().getClassId(), request.getClassId())
                            && !"CANCELLED".equals(b.getStatus()))
                    .toList();
            if (activeBookings.isEmpty()) {
                throw new IllegalStateException("Bạn không còn lịch học khả dụng nào trong lớp này để yêu cầu hủy hoặc bảo lưu (lớp có thể đã bị hủy hoặc kết thúc trước đó).");
            }
            AttendanceSnapshot snap = evaluateAttendance(
                    gymClass,
                    findClassBookingsForMember(request.getClassId(), memberEmail),
                    LocalDateTime.now()
            );
            if (snap.totalSessions() > 0 && snap.remainingSessions() <= 0) {
                throw new IllegalStateException("Bạn đã hoàn thành khóa học rồi.");
            }

            // 2. Check if user already has an active pending/in_progress/escalated ticket for this class
            List<SupportRequest> existingActive = findPendingCancellationTickets(user.getUserId(), request.getClassId());
            if (!existingActive.isEmpty()) {
                throw new IllegalStateException("Bạn đang có đơn yêu cầu #" + existingActive.get(0).getRequestId() 
                        + " cho lớp học này đang chờ xử lý. Vui lòng không gửi lặp lại yêu cầu để tránh làm chậm tiến độ hỗ trợ.");
            }

            // 3. Check if user already had an approved/resolved cancellation/refund ticket for this class
            List<SupportRequest> resolvedWithComp = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), request.getClassId()))
                    .filter(r -> isCancellationCategory(r.getCategory()))
                    .filter(r -> r.getStatus() == SupportStatus.APPROVED || r.getStatus() == SupportStatus.RESOLVED)
                    .toList();
            if (!resolvedWithComp.isEmpty()) {
                throw new IllegalStateException("Lớp học này đã được giải quyết hủy hoặc bảo lưu học phí trước đó (Đơn #" 
                        + resolvedWithComp.get(0).getRequestId() + "). Không thể tạo thêm yêu cầu.");
            }
        }

        if (isCancellationCategory) {
            if (request.getContent() == null || request.getContent().isBlank()) {
                throw new IllegalStateException("Vui lòng nhập đầy đủ lý do hủy lớp để Admin xét duyệt.");
            }
            if (evidenceUrl == null) {
                throw new IllegalStateException("Vui lòng đính kèm file hoặc hình ảnh bằng chứng để Admin xét duyệt yêu cầu hủy lớp.");
            }
        }

        if (request.getCategory() == SupportCategory.FACILITY_ISSUE) {
            if (evidenceUrl == null) {
                throw new IllegalStateException("Vui lòng đính kèm ảnh chụp minh chứng sự cố cơ sở vật chất.");
            }
            if (evidenceUrl.toLowerCase(Locale.ROOT).startsWith("data:application/pdf")) {
                throw new IllegalStateException("Báo cáo sự cố cơ sở vật chất yêu cầu ảnh chụp minh chứng (PNG, JPG, WEBP).");
            }
        }

        // Compensation for class cancellation is strictly ISSUE_CREDIT (removed CASH_REFUND & GYM_PASS)
        String prefRes = null;
        if (isCancellationCategory) {
            prefRes = "ISSUE_CREDIT";
        } else if (request.getPreferredResolution() != null && !request.getPreferredResolution().isBlank()) {
            prefRes = request.getPreferredResolution();
        }

        boolean isCoachFeedback = request.getCategory() == SupportCategory.COACH_FEEDBACK;
        boolean isFacilityCategory = request.getCategory() == SupportCategory.FACILITY_ISSUE;
        SupportStatus initialStatus = isManagerRoutedCategory(request.getCategory()) ? SupportStatus.ESCALATED : SupportStatus.PENDING;

        // Auto-priority intelligence: Mức độ Cao (HIGH) chỉ áp dụng cho Hủy lớp hoặc Cơ sở vật chất (CSVC)
        boolean isHighPriorityCategory = isCancellationCategory || isFacilityCategory;

        SupportPriority calculatedPriority;
        if (isHighPriorityCategory) {
            calculatedPriority = (request.getPriority() == SupportPriority.URGENT) ? SupportPriority.URGENT : SupportPriority.HIGH;
        } else {
            calculatedPriority = (request.getPriority() == SupportPriority.URGENT) ? SupportPriority.URGENT : SupportPriority.NORMAL;
        }

        SupportRequest entity = SupportRequest.builder()
                .user(user)
                .gymClass(gymClass)
                .category((request.getCategory() == null || request.getCategory() == SupportCategory.SCHEDULE_SUPPORT) ? SupportCategory.GENERAL_INQUIRY : request.getCategory())
                .preferredResolution(prefRes)
                .title(request.getTitle())
                .content(request.getContent())
                .evidenceUrl(evidenceUrl)
                .status(initialStatus)
                .priority(calculatedPriority)
                .build();

        SupportRequest saved = supportRequestRepository.save(entity);

        // Notify member that ticket was received
        String memberNotifTitle = isCancellationCategory
                ? "Đơn hủy lớp kèm bằng chứng đã gửi Admin duyệt"
                : isCoachFeedback
                        ? "Phản hồi HLV đã chuyển Quản lý xử lý"
                        : isFacilityCategory
                                ? "Báo cáo sự cố CSVC đã chuyển Quản lý xử lý"
                                : "Yêu cầu hỗ trợ đã được tiếp nhận";
        String memberMsg = isCancellationCategory
                ? "Trung tâm đã tiếp nhận đơn hủy lớp #" + saved.getRequestId() + ": \"" + saved.getTitle() + "\". Đơn kèm bằng chứng đã được chuyển tới Admin/Quản lý trung tâm xét duyệt. Lịch học của bạn vẫn giữ nguyên cho đến khi đơn được duyệt."
                : isCoachFeedback
                        ? "Trung tâm đã tiếp nhận phản hồi về HLV #" + saved.getRequestId() + ": \"" + saved.getTitle() + "\". Yêu cầu được chuyển thẳng tới Quản lý trung tâm để trực tiếp thẩm định và bảo mật thông tin."
                        : isFacilityCategory
                                ? "Trung tâm đã tiếp nhận báo cáo sự cố CSVC #" + saved.getRequestId() + ": \"" + saved.getTitle() + "\". Yêu cầu được chuyển thẳng tới Quản lý trung tâm để kiểm tra kỹ thuật và điều phối xử lý."
                                : "Trung tâm đã tiếp nhận yêu cầu #" + saved.getRequestId() + ": \"" + saved.getTitle() + "\". Lễ tân sẽ phản hồi và xử lý trong thời gian sớm nhất.";

        Notification notif = Notification.builder()
                .user(user)
                .title(memberNotifTitle)
                .message(memberMsg)
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        String memberName = user.getFullName() != null ? user.getFullName() : "Hội viên";

        if (isCancellationCategory) {
            notifyManagers(
                    "Đơn hủy lớp kèm bằng chứng #" + saved.getRequestId(),
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi đơn hủy lớp kèm bằng chứng: \"" + saved.getTitle() + "\". Vui lòng kiểm tra và xét duyệt.",
                    "SUPPORT"
            );
            notifyReceptionists(
                    "Đơn hủy lớp mới #" + saved.getRequestId() + " (Chờ Admin duyệt)",
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi đơn hủy lớp kèm bằng chứng: \"" + saved.getTitle() + "\". Đơn chuyển thẳng Quản lý/Admin duyệt.",
                    "SUPPORT"
            );
        } else if (isCoachFeedback) {
            // Direct notification to Center Managers and Admins
            notifyManagers(
                    "Khiếu nại/Phản hồi HLV #" + saved.getRequestId(),
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi phản hồi về Giáo viên/HLV: \"" + saved.getTitle() + "\". Đơn đã chuyển thẳng tới Quản lý để thẩm định.",
                    "SUPPORT_COACH"
            );
            // Also notify receptionists for awareness (view-only)
            notifyReceptionists(
                    "Đơn phản hồi HLV mới #" + saved.getRequestId() + " (Đã chuyển Quản lý)",
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi phản hồi HLV: \"" + saved.getTitle() + "\". Đơn chuyển thẳng Quản lý xử lý (Lễ tân chỉ xem thông tin).",
                    "SUPPORT"
            );
        } else if (isFacilityCategory) {
            // Direct notification to Center Managers and Admins
            notifyManagers(
                    "Báo cáo sự cố CSVC #" + saved.getRequestId(),
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi báo cáo sự cố cơ sở vật chất: \"" + saved.getTitle() + "\". Đơn đã chuyển thẳng tới Quản lý để kiểm tra và điều phối sửa chữa.",
                    "SUPPORT_FACILITY"
            );
            // Also notify receptionists for awareness (view-only)
            notifyReceptionists(
                    "Báo cáo CSVC mới #" + saved.getRequestId() + " (Đã chuyển Quản lý)",
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi báo cáo sự cố CSVC: \"" + saved.getTitle() + "\". Đơn chuyển thẳng Quản lý xử lý (Lễ tân chỉ xem thông tin).",
                    "SUPPORT"
            );
        } else {
            // Notify receptionists about new member support ticket
            notifyReceptionists(
                    "Yêu cầu hỗ trợ mới #" + saved.getRequestId(),
                    "Hội viên " + memberName + " (#" + user.getUserId() + ") vừa gửi yêu cầu: \"" + saved.getTitle() + "\". Vui lòng kiểm tra và xử lý tại Bàn hỗ trợ.",
                    "SUPPORT"
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public List<SupportRequestResponse> getMemberSupportRequests(String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        autoRejectOverLimitCancellationTickets();
        return supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Page<SupportRequestResponse> searchRequestsForStaff(SupportStatus status, SupportCategory category, String keyword, Pageable pageable) {
        autoRejectOverLimitCancellationTickets();
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return supportRequestRepository.searchSupportRequests(status, category, kw, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public Map<String, Object> getStaffSupportStats() {
        autoRejectOverLimitCancellationTickets();
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", supportRequestRepository.count());
        stats.put("pending", supportRequestRepository.countByStatus(SupportStatus.PENDING));
        stats.put("inProgress", supportRequestRepository.countByStatus(SupportStatus.IN_PROGRESS));
        long approvedCount = supportRequestRepository.countByStatus(SupportStatus.APPROVED);
        long resolvedCount = supportRequestRepository.countByStatus(SupportStatus.RESOLVED);
        long rejectedCount = supportRequestRepository.countByStatus(SupportStatus.REJECTED);
        long closedTotal = approvedCount + resolvedCount + rejectedCount;
        stats.put("resolved", closedTotal);
        stats.put("approved", approvedCount);
        stats.put("escalated", supportRequestRepository.countByStatus(SupportStatus.ESCALATED));
        stats.put("rejected", rejectedCount);
        return stats;
    }

    @Override
    public SupportRequestResponse respondToRequest(Integer requestId, RespondSupportRequest dto, String staffEmail) {
        SupportRequest request = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Support request not found: " + requestId));

        if (request.getStatus() == SupportStatus.RESOLVED || request.getStatus() == SupportStatus.APPROVED) {
            throw new IllegalStateException("Đơn yêu cầu #" + requestId + " đã được phê duyệt và giải quyết trước đó, không thể sửa đổi hoặc từ chối lại.");
        }
        if (request.getStatus() == SupportStatus.REJECTED) {
            throw new IllegalStateException("Đơn yêu cầu #" + requestId + " đã bị từ chối trước đó và đã đóng hồ sơ, không thể thao tác lại.");
        }

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found: " + staffEmail));

        boolean isManagerStaff = staff.getRole() != null && staff.getRole().getRoleName() != null
                && (staff.getRole().getRoleName().toUpperCase().contains("MANAGER") || staff.getRole().getRoleName().toUpperCase().contains("ADMIN"));

        boolean isDisallowedResolution = "CASH_REFUND".equalsIgnoreCase(dto.getResolutionType())
                || "MANAGER_REFUND".equalsIgnoreCase(dto.getResolutionType())
                || "GYM_PASS".equalsIgnoreCase(dto.getResolutionType());
        if (isDisallowedResolution) {
            throw new IllegalStateException("Chính sách mới chỉ hỗ trợ cấp Voucher tín dụng hoặc Từ chối yêu cầu (đã ngừng hoàn tiền mặt và tặng thẻ tập Gym).");
        }

        if (!isManagerStaff) {
            if (request.getStatus() == SupportStatus.ESCALATED) {
                throw new IllegalStateException("Chỉ Admin / Quản lý trung tâm mới có quyền xử lý đơn đã chuyển cấp.");
            }
            if (isCancellationCategory(request.getCategory())) {
                throw new IllegalStateException("Chỉ Admin / Quản lý trung tâm mới có quyền thẩm định và phê duyệt đơn hủy lớp / bồi hoàn.");
            }
            if (request.getCategory() == SupportCategory.COACH_FEEDBACK) {
                throw new IllegalStateException("Chỉ Admin / Quản lý trung tâm mới có quyền xử lý phản hồi về Huấn luyện viên.");
            }
            if (request.getCategory() == SupportCategory.FACILITY_ISSUE) {
                throw new IllegalStateException("Chỉ Admin / Quản lý trung tâm mới có quyền xử lý báo cáo sự cố Cơ sở vật chất.");
            }
            if ("CASH_REFUND".equalsIgnoreCase(request.getPreferredResolution())
                    || "MANAGER_REFUND".equalsIgnoreCase(request.getPreferredResolution())) {
                throw new IllegalStateException("Chỉ Admin / Quản lý trung tâm mới có quyền xử lý yêu cầu hoàn trả.");
            }
        }

        request.setStatus(dto.getStatus() != null ? dto.getStatus() : SupportStatus.RESOLVED);
        request.setResponseNote(dto.getResponseNote());
        request.setRespondedBy(staff);
        request.setRespondedAt(LocalDateTime.now());

        String generatedCreditCode = null;
        BigDecimal generatedCreditAmount = null;

        // Voucher credit or reject only (cash refund and gym pass removed per finalized policy)
        boolean isApproved = request.getStatus() == SupportStatus.RESOLVED || request.getStatus() == SupportStatus.APPROVED;
        boolean wantsCredit = "CREDIT".equalsIgnoreCase(dto.getResolutionType())
                || "ISSUE_CREDIT".equalsIgnoreCase(dto.getResolutionType())
                || (dto.getCreditAmount() != null && dto.getCreditAmount().compareTo(BigDecimal.ZERO) > 0)
                || ("APPROVE_GENERAL".equalsIgnoreCase(dto.getResolutionType())
                    && (request.getGymClass() != null || isCancellationCategory(request.getCategory())));

        boolean isCompensating = isApproved && wantsCredit;

        if (isCompensating && request.getGymClass() != null) {
            Integer classId = request.getGymClass().getClassId();
            Integer memberUserId = request.getUser().getUserId();

            // 1. Safeguard: Check if this user and class was already compensated in another ticket
            List<SupportRequest> alreadyResolvedTickets = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(memberUserId).stream()
                    .filter(r -> !Objects.equals(r.getRequestId(), request.getRequestId()))
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), classId))
                    .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST)
                    .filter(r -> r.getStatus() == SupportStatus.APPROVED || r.getStatus() == SupportStatus.RESOLVED)
                    .toList();

            if (!alreadyResolvedTickets.isEmpty()) {
                throw new IllegalStateException("Lớp học này đã được giải quyết hoặc bồi thường trước đó tại đơn #" 
                        + alreadyResolvedTickets.get(0).getRequestId() 
                        + ". Không thể thực hiện bồi thường tiếp để tránh bồi hoàn trùng lặp.");
            }

            // 2. Safeguard: Check if active bookings exist
            List<Booking> activeBookings = bookingRepository.findAllBookingsByEmail(request.getUser().getEmail()).stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                            && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                            && !"CANCELLED".equals(b.getStatus()))
                    .toList();
            if (activeBookings.isEmpty()) {
                throw new IllegalStateException("Hội viên không còn buổi học khả dụng nào trong lớp này (toàn bộ lịch học đã bị hủy trước đó). Không thể thực hiện bồi thường.");
            }
        }

        // 3. Calculate and issue credit/compensation BEFORE cancelling bookings
        if (isApproved && wantsCredit) {
            BigDecimal creditAmount = dto.getCreditAmount();
            if (creditAmount == null || creditAmount.compareTo(BigDecimal.ZERO) <= 0) {
                // Auto calculate if class linked
                if (request.getGymClass() != null) {
                    AttendanceSnapshot snap = evaluateAttendance(
                            request.getGymClass(),
                            findClassBookingsForMember(request.getGymClass().getClassId(), request.getUser().getEmail()),
                            request.getCreatedAt()
                    );
                    creditAmount = snap.totalSessions() > 0 ? snap.proratedCredit() : request.getGymClass().getPrice();
                }
            } else {
                creditAmount = creditAmount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(1000));
            }

            if (creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
                Integer classId = request.getGymClass() != null ? request.getGymClass().getClassId() : null;
                generatedCreditCode = generateCreditCodeWithPrefix("CRED-", classId, request.getUser().getUserId());
                generatedCreditAmount = creditAmount;

                int validityDays = dto.getEffectiveValidityDays() != null ? dto.getEffectiveValidityDays() : 60;
                LocalDate expiryDate = LocalDate.now().plusDays(validityDays);

                String reason = "Bảo lưu theo yêu cầu #" + request.getRequestId() + ": " + request.getTitle();

                UserCredit credit = UserCredit.builder()
                        .user(request.getUser())
                        .supportRequest(request)
                        .gymClass(request.getGymClass())
                        .creditCode(generatedCreditCode)
                        .amount(creditAmount)
                        .remainingAmount(creditAmount)
                        .reason(reason)
                        .expiryDate(expiryDate)
                        .status(CreditStatus.ACTIVE)
                        .build();
                userCreditRepository.save(credit);
            }
        }

        // 4. ALWAYS cancel future un-attended bookings for this class whenever cancellation/compensation is approved
        if (isApproved && request.getGymClass() != null 
                && (request.getCategory() == SupportCategory.CLASS_CANCELLATION 
                    || request.getCategory() == SupportCategory.REFUND_REQUEST
                    || isCompensating)) {
            Integer classId = request.getGymClass().getClassId();
            List<Booking> bookings = bookingRepository.findAllBookingsByEmail(request.getUser().getEmail()).stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                            && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                            && !"CANCELLED".equals(b.getStatus())
                            && !"PRESENT".equalsIgnoreCase(b.getAttendanceStatus()))
                    .toList();
            for (Booking b : bookings) {
                b.setStatus("CANCELLED");
                bookingRepository.save(b);
            }
        }

        String trimmedNote = request.getResponseNote() != null ? request.getResponseNote().trim() : "";
        boolean hasGenericPlaceholder = trimmedNote.isEmpty()
                || trimmedNote.contains("tiếp nhận và xử lý")
                || trimmedNote.contains("trị giá 0");
        if (generatedCreditCode != null && hasGenericPlaceholder) {
            String rolePrefix = isManagerStaff ? "Quản lý trung tâm" : "Lễ tân";
            String className = request.getGymClass() != null ? (" " + request.getGymClass().getClassName()) : "";
            String formattedCredit = formatVndAmount(generatedCreditAmount);
            request.setResponseNote(rolePrefix + " đã duyệt bảo lưu lớp" + className + " và cấp mã tín dụng " + generatedCreditCode + " (" + formattedCredit + ", hạn 60 ngày).");
        }

        supportRequestRepository.save(request);

        // Auto-close any other pending duplicate tickets for this member & class if approved with compensation
        if (isCompensating && request.getGymClass() != null) {
            Integer classId = request.getGymClass().getClassId();
            Integer memberUserId = request.getUser().getUserId();
            List<SupportRequest> otherPending = findPendingCancellationTickets(memberUserId, classId).stream()
                    .filter(r -> !Objects.equals(r.getRequestId(), request.getRequestId()))
                    .toList();

            for (SupportRequest op : otherPending) {
                op.setStatus(SupportStatus.RESOLVED);
                op.setPreferredResolution("SUPERSEDED");
                op.setResponseNote("Hệ thống tự động đóng đơn do yêu cầu hủy lớp này đã được giải quyết qua đơn #" + request.getRequestId() + ".");
                op.setRespondedBy(staff);
                op.setRespondedAt(LocalDateTime.now());
                supportRequestRepository.save(op);
            }
        }

        // Send concise notification to member without repeating note/amount text
        String roleTitle = isManagerStaff ? "Quản lý trung tâm" : "Lễ tân";
        String finalNote = request.getResponseNote() != null ? request.getResponseNote().trim() : "";
        StringBuilder notifMsg = new StringBuilder();
        if (!finalNote.isEmpty()) {
            notifMsg.append(finalNote);
        } else {
            notifMsg.append(roleTitle).append(" đã xử lý yêu cầu #").append(request.getRequestId()).append(".");
        }
        if (generatedCreditCode != null && !finalNote.contains(generatedCreditCode)) {
            notifMsg.append(" Mã ưu đãi: ").append(generatedCreditCode)
                    .append(" (").append(formatVndAmount(generatedCreditAmount)).append(", hạn 60 ngày).");
        }

        Notification notif = Notification.builder()
                .user(request.getUser())
                .title("Phản hồi yêu cầu hỗ trợ #" + request.getRequestId())
                .message(notifMsg.toString().trim())
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        return mapToResponse(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserCreditResponse> getMemberCredits(String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        LocalDate today = LocalDate.now();
        return userCreditRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .map(c -> {
                    long daysUntilExpiry = ChronoUnit.DAYS.between(today, c.getExpiryDate());
                    return UserCreditResponse.builder()
                            .creditId(c.getCreditId())
                            .userId(c.getUser().getUserId())
                            .requestId(c.getSupportRequest() != null ? c.getSupportRequest().getRequestId() : null)
                            .classId(c.getGymClass() != null ? c.getGymClass().getClassId() : null)
                            .className(c.getGymClass() != null ? c.getGymClass().getClassName() : null)
                            .creditCode(c.getCreditCode())
                            .amount(c.getAmount())
                            .remainingAmount(c.getRemainingAmount())
                            .reason(c.getReason())
                            .expiryDate(c.getExpiryDate())
                            .daysUntilExpiry(Math.max(0, daysUntilExpiry))
                            .status(c.getStatus())
                            .createdAt(c.getCreatedAt())
                            .isExpired(c.getExpiryDate().isBefore(today))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public SupportRequestResponse createOnBehalfOfMember(Integer memberUserId, CreateSupportRequest request, String staffEmail) {
        User member = userRepository.findById(memberUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberUserId));
        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new IllegalArgumentException("Staff not found: " + staffEmail));

        GymClass gymClass = null;
        if (request.getClassId() != null) {
            gymClass = coachClassRepository.findById(request.getClassId()).orElse(null);
        }

        boolean isCancellationCategory = request.getCategory() == SupportCategory.CLASS_CANCELLATION
                || request.getCategory() == SupportCategory.REFUND_REQUEST;

        if (isCancellationCategory && request.getClassId() != null) {
            List<Booking> activeBookings = bookingRepository.findAllBookingsByEmail(member.getEmail()).stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                            && Objects.equals(b.getSchedule().getGymClass().getClassId(), request.getClassId())
                            && !"CANCELLED".equals(b.getStatus()))
                    .toList();
            if (activeBookings.isEmpty()) {
                throw new IllegalStateException("Hội viên không còn lịch học khả dụng nào trong lớp này để yêu cầu hủy/bảo lưu.");
            }

            List<SupportRequest> existingActive = findPendingCancellationTickets(member.getUserId(), request.getClassId());
            if (!existingActive.isEmpty()) {
                throw new IllegalStateException("Hội viên đang có đơn yêu cầu #" + existingActive.get(0).getRequestId() 
                        + " cho lớp học này đang chờ xử lý. Vui lòng không tạo thêm.");
            }
        }

        boolean isCoachFeedback = request.getCategory() == SupportCategory.COACH_FEEDBACK;
        boolean isFacilityCategory = request.getCategory() == SupportCategory.FACILITY_ISSUE;
        boolean isDirectManagerRoute = isManagerRoutedCategory(request.getCategory());
        SupportStatus initialStatus = isDirectManagerRoute ? SupportStatus.ESCALATED : SupportStatus.IN_PROGRESS;
        boolean isHighPriorityCategory = isCancellationCategory || isFacilityCategory;
        SupportPriority priority = isHighPriorityCategory ? SupportPriority.HIGH 
                : (request.getPriority() == SupportPriority.URGENT ? SupportPriority.URGENT : SupportPriority.NORMAL);

        String resolvedPreferredResolution = isCancellationCategory ? "ISSUE_CREDIT" : request.getPreferredResolution();
        if ("CASH_REFUND".equalsIgnoreCase(resolvedPreferredResolution)
                || "MANAGER_REFUND".equalsIgnoreCase(resolvedPreferredResolution)
                || "GYM_PASS".equalsIgnoreCase(resolvedPreferredResolution)) {
            resolvedPreferredResolution = "ISSUE_CREDIT";
        }

        SupportRequest entity = SupportRequest.builder()
                .user(member)
                .gymClass(gymClass)
                .category(request.getCategory() != null ? request.getCategory() : SupportCategory.GENERAL_INQUIRY)
                .preferredResolution(resolvedPreferredResolution)
                .title(request.getTitle())
                .content(request.getContent() + " (Lễ tân ghi nhận tại quầy: " + staff.getFullName() + ")")
                .evidenceUrl(request.getEvidenceUrl())
                .status(initialStatus)
                .priority(priority)
                .respondedBy(isDirectManagerRoute ? null : staff)
                .build();

        SupportRequest saved = supportRequestRepository.save(entity);

        String memberNotifTitle = isCoachFeedback
                ? "Phản hồi HLV đã chuyển Quản lý xử lý"
                : (isFacilityCategory
                        ? "Báo cáo sự cố CSVC đã chuyển Quản lý xử lý"
                        : (isCancellationCategory
                                ? "Đơn hủy lớp đã chuyển Admin / Quản lý duyệt"
                                : "Lễ tân tiếp nhận yêu cầu tại quầy"));
        String memberMsg = isCoachFeedback
                ? "Lễ tân " + staff.getFullName() + " đã ghi nhận ý kiến về HLV: \"" + saved.getTitle() + "\". Đơn đã chuyển thẳng tới Quản lý trung tâm để trực tiếp thẩm định."
                : (isFacilityCategory
                        ? "Lễ tân " + staff.getFullName() + " đã ghi nhận báo cáo sự cố CSVC: \"" + saved.getTitle() + "\". Đơn đã chuyển thẳng tới Quản lý trung tâm để kiểm tra kỹ thuật và điều phối xử lý."
                        : (isCancellationCategory
                                ? "Lễ tân " + staff.getFullName() + " đã ghi nhận yêu cầu hủy lớp: \"" + saved.getTitle() + "\" và chuyển lên Admin / Quản lý trung tâm thẩm định. Lịch học hiện tại của bạn vẫn giữ nguyên cho đến khi có quyết định phê duyệt."
                                : "Lễ tân " + staff.getFullName() + " đã ghi nhận yêu cầu hỗ trợ: \"" + saved.getTitle() + "\" tại quầy tiếp đón."));

        Notification notif = Notification.builder()
                .user(member)
                .title(memberNotifTitle)
                .message(memberMsg)
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        if (isCoachFeedback) {
            notifyManagers(
                    "Khiếu nại/Phản hồi HLV #" + saved.getRequestId() + " (Ghi nhận tại quầy)",
                    "Lễ tân " + staff.getFullName() + " vừa tiếp nhận tại quầy phản hồi về HLV từ hội viên " + member.getFullName() + ": \"" + saved.getTitle() + "\". Đơn chuyển thẳng Quản lý.",
                    "SUPPORT_COACH"
            );
        } else if (isFacilityCategory) {
            notifyManagers(
                    "Báo cáo sự cố CSVC #" + saved.getRequestId() + " (Ghi nhận tại quầy)",
                    "Lễ tân " + staff.getFullName() + " vừa tiếp nhận tại quầy báo cáo sự cố CSVC từ hội viên " + member.getFullName() + ": \"" + saved.getTitle() + "\". Đơn chuyển thẳng Quản lý.",
                    "SUPPORT_FACILITY"
            );
        } else if (isCancellationCategory) {
            notifyManagers(
                    "Đơn xin hủy lớp cần duyệt #" + saved.getRequestId() + " (Ghi nhận tại quầy)",
                    "Lễ tân " + staff.getFullName() + " vừa tiếp nhận yêu cầu hủy lớp từ hội viên " + member.getFullName() + ": \"" + saved.getTitle() + "\". Vui lòng kiểm tra bằng chứng và xét duyệt.",
                    "SUPPORT_CANCEL"
            );
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public SupportRequestResponse revokeRequest(Integer requestId, String reason, String staffEmail) {
        SupportRequest request = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Support request not found: " + requestId));

        User staff = userRepository.findByEmail(staffEmail)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found: " + staffEmail));

        boolean isManagerStaff = staff.getRole() != null && staff.getRole().getRoleName() != null 
                && (staff.getRole().getRoleName().toUpperCase().contains("MANAGER") || staff.getRole().getRoleName().toUpperCase().contains("ADMIN"));

        if (!isManagerStaff) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ Quản lý trung tâm mới có quyền thu hồi quyết định phê duyệt.");
        }

        if (request.getStatus() != SupportStatus.APPROVED && request.getStatus() != SupportStatus.RESOLVED) {
            throw new IllegalStateException("Chỉ có thể thu hồi các đơn đã được phê duyệt trước đó.");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp lý do thu hồi phê duyệt.");
        }

        // 1. Check if a Credit Voucher was generated for this request
        Optional<UserCredit> optCredit = userCreditRepository.findBySupportRequestRequestId(requestId);
        if (optCredit.isPresent()) {
            UserCredit credit = optCredit.get();
            // Check if credit was already used
            if (credit.getStatus() == CreditStatus.USED || credit.getRemainingAmount().compareTo(credit.getAmount()) < 0) {
                throw new IllegalStateException("Không thể thu hồi: Học viên đã sử dụng mã voucher " 
                        + credit.getCreditCode() + " để thanh toán khóa học khác. Vui lòng đối soát nghiệp vụ trực tiếp.");
            }
            // Invalidate the voucher
            credit.setStatus(CreditStatus.CANCELLED);
            credit.setRemainingAmount(BigDecimal.ZERO);
            credit.setReason("Đã thu hồi theo đơn #" + requestId + ": " + reason.trim());
            userCreditRepository.save(credit);
        }

        // 2. Update support request to REJECTED with clear revocation note
        request.setStatus(SupportStatus.REJECTED);
        String oldNote = request.getResponseNote() != null ? request.getResponseNote() : "";
        request.setResponseNote("[THU HỒI PHÊ DUYỆT BỞI " + staff.getFullName() + "] Lý do: " + reason.trim() 
                + (oldNote.isEmpty() ? "" : " (Ghi chú trước đó: " + oldNote + ")"));
        request.setRespondedBy(staff);
        request.setRespondedAt(LocalDateTime.now());
        supportRequestRepository.save(request);

        // 3. Send notification to member
        Notification notif = Notification.builder()
                .user(request.getUser())
                .title("Thu hồi quyết định phê duyệt đơn #" + requestId)
                .message("Quản lý trung tâm (" + staff.getFullName() + ") đã thu hồi quyết định phê duyệt của đơn hỗ trợ #" + requestId 
                        + ". Lý do: \"" + reason.trim() + "\". Quyền lợi voucher hoặc lệnh hoàn tiền liên quan đã bị hủy bỏ.")
                .type("SUPPORT_REVOKED")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        return mapToResponse(request);
    }

    @Override
    @Transactional
    public SupportRequestResponse withdrawRequest(Integer requestId, String memberEmail) {
        SupportRequest request = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn yêu cầu hỗ trợ #" + requestId));

        if (!request.getUser().getEmail().equalsIgnoreCase(memberEmail)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thao tác trên đơn yêu cầu này.");
        }

        if (request.getStatus() == SupportStatus.RESOLVED || request.getStatus() == SupportStatus.APPROVED) {
            throw new IllegalStateException("Đơn yêu cầu #" + requestId + " đã được phê duyệt và giải quyết, không thể rút lại.");
        }

        if (request.getStatus() == SupportStatus.REJECTED) {
            throw new IllegalStateException("Đơn yêu cầu #" + requestId + " đã đóng hồ sơ trước đó.");
        }

        request.setStatus(SupportStatus.REJECTED);
        String oldNote = request.getResponseNote() != null ? request.getResponseNote() : "";
        request.setResponseNote("[HỘI VIÊN CHỦ ĐỘNG RÚT ĐƠN] Học viên đã hủy yêu cầu hỗ trợ này."
                + (oldNote.isEmpty() ? "" : " (Ghi chú cũ: " + oldNote + ")"));
        request.setRespondedAt(LocalDateTime.now());
        SupportRequest saved = supportRequestRepository.save(request);

        Notification notif = Notification.builder()
                .user(request.getUser())
                .title("Rút yêu cầu hỗ trợ thành công")
                .message("Bạn đã rút yêu cầu hỗ trợ #" + requestId + " (\"" + request.getTitle() + "\") thành công. Bạn có thể gửi lại yêu cầu mới nếu cần.")
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        // Notify receptionists about withdrawn request
        String withdrawMemberName = request.getUser() != null && request.getUser().getFullName() != null ? request.getUser().getFullName() : "Hội viên";
        Integer withdrawMemberId = request.getUser() != null ? request.getUser().getUserId() : 0;
        notifyReceptionists(
                "Hội viên rút yêu cầu hỗ trợ #" + requestId,
                "Hội viên " + withdrawMemberName + " (#" + withdrawMemberId + ") đã chủ động rút yêu cầu #" + requestId + " (\"" + request.getTitle() + "\").",
                "SUPPORT"
        );

        return mapToResponse(saved);
    }

    private void notifyManagers(String title, String message, String type) {
        try {
            List<User> managers = new ArrayList<>();
            managers.addAll(userRepository.findByRoleNameIgnoreCase("Center Manager"));
            managers.addAll(userRepository.findByRoleNameIgnoreCase("Admin"));
            Set<Integer> seen = new HashSet<>();
            for (User manager : managers) {
                if (manager != null && manager.getUserId() != null && seen.add(manager.getUserId())) {
                    Notification staffNotif = Notification.builder()
                            .user(manager)
                            .title(title)
                            .message(message)
                            .type(type)
                            .isRead(false)
                            .build();
                    notificationRepository.save(staffNotif);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to notify managers: " + e.getMessage());
        }
    }

    private void notifyReceptionists(String title, String message, String type) {
        try {
            List<User> receptionists = userRepository.findByRoleNameIgnoreCase("Receptionist");
            for (User receptionist : receptionists) {
                Notification staffNotif = Notification.builder()
                        .user(receptionist)
                        .title(title)
                        .message(message)
                        .type(type)
                        .isRead(false)
                        .build();
                notificationRepository.save(staffNotif);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify receptionists: " + e.getMessage());
        }
    }

    private SupportRequestResponse mapToResponse(SupportRequest r) {
        GymClass gc = r.getGymClass();
        BigDecimal classPrice = gc != null ? gc.getPrice() : null;
        String className = gc != null ? gc.getClassName() : null;
        Integer classId = gc != null ? gc.getClassId() : null;

        Integer totalSessions = null;
        Integer attendedSessions = null;
        Integer remainingSessions = null;
        BigDecimal calculatedCredit = null;

        if (gc != null && r.getUser() != null) {
            try {
                List<Booking> bookings = bookingRepository.findAllBookingsByEmail(r.getUser().getEmail()).stream()
                        .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                                && Objects.equals(b.getSchedule().getGymClass().getClassId(), gc.getClassId()))
                        .toList();
                if (!bookings.isEmpty()) {
                    AttendanceSnapshot snap = evaluateAttendance(gc, bookings, r.getCreatedAt());
                    totalSessions = snap.totalSessions();
                    attendedSessions = snap.attendedSessions();
                    remainingSessions = snap.remainingSessions();

                    boolean isCancellationOrRefund = r.getCategory() == SupportCategory.CLASS_CANCELLATION
                            || r.getCategory() == SupportCategory.REFUND_REQUEST
                            || (r.getPreferredResolution() != null && !r.getPreferredResolution().isBlank())
                            || (r.getTitle() != null && (r.getTitle().toLowerCase().contains("cancellation")
                                    || r.getTitle().toLowerCase().contains("hủy")
                                    || r.getTitle().toLowerCase().contains("bảo lưu")));

                    if (isCancellationOrRefund && classPrice != null && totalSessions > 0) {
                        calculatedCredit = snap.proratedCredit();
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Check if a credit was already generated for this request
        Optional<UserCredit> optCredit = userCreditRepository.findBySupportRequestRequestId(r.getRequestId());
        String generatedCreditCode = optCredit.map(UserCredit::getCreditCode).orElse(null);
        BigDecimal generatedCreditAmount = optCredit.map(UserCredit::getAmount).orElse(null);

        SupportPriority effectivePriority = r.getPriority();
        boolean isHighPriorityCategory = r.getCategory() == SupportCategory.CLASS_CANCELLATION 
                || r.getCategory() == SupportCategory.REFUND_REQUEST 
                || r.getCategory() == SupportCategory.FACILITY_ISSUE;

        if (isHighPriorityCategory || "CASH_REFUND".equalsIgnoreCase(r.getPreferredResolution()) || "MANAGER_REFUND".equalsIgnoreCase(r.getPreferredResolution())) {
            effectivePriority = (effectivePriority == SupportPriority.URGENT) ? SupportPriority.URGENT : SupportPriority.HIGH;
        } else if (effectivePriority != SupportPriority.URGENT) {
            // Chỉ đơn liên quan tới Hủy lớp hoặc CSVC mới có mức độ Cao (HIGH)
            effectivePriority = SupportPriority.NORMAL;
        }

        return SupportRequestResponse.builder()
                .requestId(r.getRequestId())
                .userId(r.getUser().getUserId())
                .memberName(r.getUser().getFullName())
                .memberEmail(r.getUser().getEmail())
                .memberPhone(r.getUser().getPhone())
                .classId(classId)
                .className(className)
                .classPrice(classPrice)
                .totalSessions(totalSessions)
                .attendedSessions(attendedSessions)
                .remainingSessions(remainingSessions)
                .calculatedCreditAmount(calculatedCredit)
                .category(r.getCategory())
                .preferredResolution(r.getPreferredResolution())
                .title(r.getTitle())
                .content(r.getContent())
                .evidenceUrl(r.getEvidenceUrl())
                .status(r.getStatus())
                .priority(effectivePriority)
                .responseNote(r.getResponseNote())
                .responderId(r.getRespondedBy() != null ? r.getRespondedBy().getUserId() : null)
                .responderName(r.getRespondedBy() != null ? r.getRespondedBy().getFullName() : null)
                .respondedAt(r.getRespondedAt())
                .generatedCreditCode(generatedCreditCode)
                .generatedCreditAmount(generatedCreditAmount)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
