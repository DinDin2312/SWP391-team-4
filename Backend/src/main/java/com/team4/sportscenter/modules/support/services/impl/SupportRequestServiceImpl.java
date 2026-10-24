package com.team4.sportscenter.modules.support.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Room;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.Subject;
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

    @Override
    @Transactional(readOnly = true)
    public CancelClassPreviewResponse getCancelClassPreview(Integer classId, String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        GymClass gymClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));

        List<Booking> classBookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                        && !"CANCELLED".equals(b.getStatus()))
                .sorted(Comparator.comparing(b -> b.getSchedule().getStartTime()))
                .toList();

        if (classBookings.isEmpty()) {
            throw new IllegalArgumentException("No active bookings found for class: " + classId);
        }

        LocalDateTime now = LocalDateTime.now();
        int totalSessions = classBookings.size();
        LocalDateTime firstSessionTime = classBookings.get(0).getSchedule().getStartTime();
        boolean hasStarted = firstSessionTime.isBefore(now)
                || classBookings.stream().anyMatch(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)));

        int attendedSessions = (int) classBookings.stream()
                .filter(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                        || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)))
                .count();

        int remainingSessions = Math.max(0, totalSessions - attendedSessions);
        BigDecimal classPrice = gymClass.getPrice() != null ? gymClass.getPrice() : BigDecimal.ZERO;

        BigDecimal estimatedCreditAmount;
        if (!hasStarted) {
            estimatedCreditAmount = classPrice;
        } else if (totalSessions > 0) {
            BigDecimal raw = classPrice
                    .multiply(BigDecimal.valueOf(remainingSessions))
                    .divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);
            estimatedCreditAmount = raw.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(1000));
        } else {
            estimatedCreditAmount = BigDecimal.ZERO;
        }

        String message;
        if (!hasStarted) {
            message = "Khóa học chưa khai giảng. Bạn có thể hủy trực tiếp và nhận Credit bảo lưu 100% học phí có hạn 60 ngày.";
        } else {
            message = "Khóa học đã diễn ra " + attendedSessions + "/" + totalSessions + " buổi. Bạn có thể gửi phiếu hỗ trợ để Lễ tân xét duyệt bảo lưu số buổi còn lại.";
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
                .canDirectCancelWithCredit(!hasStarted)
                .estimatedCreditAmount(estimatedCreditAmount)
                .message(message)
                .build();
    }

    @Override
    public Map<String, Object> cancelClassDirectly(Integer classId, String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        CancelClassPreviewResponse preview = getCancelClassPreview(classId, memberEmail);
        if (preview.isHasStarted()) {
            throw new IllegalStateException("Khóa học đã diễn ra. Không thể hủy trực tiếp tự động, vui lòng gửi phiếu hỗ trợ đến Lễ tân để được xét bảo lưu.");
        }

        GymClass gymClass = coachClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Class not found: " + classId));

        // Mark all bookings for this class as CANCELLED
        List<Booking> bookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                        && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                        && !"CANCELLED".equals(b.getStatus()))
                .toList();

        for (Booking b : bookings) {
            b.setStatus("CANCELLED");
            bookingRepository.save(b);
        }

        // Generate 100% UserCredit voucher valid for 60 days
        BigDecimal creditAmount = preview.getEstimatedCreditAmount();
        String creditCode = generateCreditCode(classId, user.getUserId());
        LocalDate expiryDate = LocalDate.now().plusDays(60);

        // 1. Create auto-approved SupportRequest for audit trail & tracking
        SupportRequest autoTicket = SupportRequest.builder()
                .user(user)
                .gymClass(gymClass)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .title("Bảo lưu học phí tự động: " + gymClass.getClassName())
                .content("Hội viên đã hủy lớp trước ngày khai giảng. Hệ thống đã tự động phê duyệt và cấp Voucher tín dụng 100% học phí theo quy chế trung tâm.")
                .status(SupportStatus.APPROVED)
                .priority(SupportPriority.NORMAL)
                .responseNote("Hệ thống tự động phê duyệt bảo lưu 100% học phí lớp " + gymClass.getClassName() + ". Cấp mã tín dụng: " + creditCode + " trị giá " + creditAmount.longValue() + "đ (Hạn dùng 60 ngày).")
                .respondedAt(LocalDateTime.now())
                .build();
        SupportRequest savedTicket = supportRequestRepository.save(autoTicket);

        // 2. Generate 100% UserCredit voucher linked to the SupportRequest
        UserCredit credit = UserCredit.builder()
                .user(user)
                .gymClass(gymClass)
                .supportRequest(savedTicket)
                .creditCode(creditCode)
                .amount(creditAmount)
                .remainingAmount(creditAmount)
                .reason("Bảo lưu 100% học phí hủy lớp trước khai giảng: " + gymClass.getClassName())
                .expiryDate(expiryDate)
                .status(CreditStatus.ACTIVE)
                .build();
        userCreditRepository.save(credit);

        // 3. Auto-close any pending duplicate support requests for this member & class
        List<SupportRequest> pendingDuplicateTickets = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .filter(r -> !Objects.equals(r.getRequestId(), savedTicket.getRequestId()))
                .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), classId))
                .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST)
                .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                .toList();

        for (SupportRequest pt : pendingDuplicateTickets) {
            pt.setStatus(SupportStatus.RESOLVED);
            pt.setResponseNote("Hệ thống tự động đóng đơn do hội viên đã hủy trực tiếp và nhận voucher bảo lưu học phí qua đơn #" + savedTicket.getRequestId() + ".");
            pt.setRespondedAt(LocalDateTime.now());
            supportRequestRepository.save(pt);
        }

        // Send confirmation notification to member
        Notification notif = Notification.builder()
                .user(user)
                .title("Bảo lưu học phí lớp học")
                .message("Bạn đã hủy đăng ký lớp " + gymClass.getClassName() + " và nhận được Credit bảo lưu 100% học phí trị giá "
                        + creditAmount.longValue() + "đ (Mã: " + creditCode + "), có hạn sử dụng đến ngày " + expiryDate + ".")
                .type("BOOKING")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("classId", classId);
        result.put("className", gymClass.getClassName());
        result.put("requestId", savedTicket.getRequestId());
        result.put("creditCode", creditCode);
        result.put("creditAmount", creditAmount);
        result.put("expiryDate", expiryDate.toString());
        result.put("message", "Đã hủy lớp thành công và cấp Credit bảo lưu 100% học phí.");
        return result;
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
        boolean hasStarted = firstSessionTime.isBefore(now)
                || currentBookings.stream().anyMatch(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)));

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

        if (hasStarted) {
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
                    .hasStarted(true)
                    .canTransfer(false)
                    .message("Khóa học đã bắt đầu hoặc đã có buổi học diễn ra. Chỉ được chuyển lớp trước ngày khai giảng. Nếu cần bảo lưu, vui lòng gửi phiếu hỗ trợ.")
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

        for (Map.Entry<GymClass, List<Schedule>> entry : classSchedules.entrySet()) {
            GymClass candidate = entry.getKey();
            List<Schedule> scheds = entry.getValue();

            if (Objects.equals(candidate.getClassId(), classId)) continue;
            if (!"ACTIVE".equalsIgnoreCase(candidate.getStatus())) continue;

            // Must be same price
            BigDecimal candPrice = candidate.getPrice() != null ? candidate.getPrice() : BigDecimal.ZERO;
            if (candPrice.compareTo(targetPrice) != 0) continue;

            // Member must not already be booked or pending
            if (myConfirmedClassIds.contains(candidate.getClassId()) || myPendingClassIds.contains(candidate.getClassId())) {
                continue;
            }

            scheds.sort(Comparator.comparing(Schedule::getStartTime));
            LocalDateTime candFirstSession = scheds.get(0).getStartTime();

            // Candidate class must not have started
            if (candFirstSession.isBefore(now)) continue;

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

        // Sort: selectable first, then by nextSessionTime
        options.sort(Comparator.comparing(TransferClassOptionResponse::isCanSelect).reversed()
                .thenComparing(TransferClassOptionResponse::getNextSessionTime));

        String message = options.isEmpty()
                ? "Hiện tại không có lớp học nào cùng mức học phí (" + targetPrice.longValue() + "đ) chưa khai giảng để chuyển sang."
                : "Tìm thấy " + options.size() + " lớp học tương đương đồng giá (" + targetPrice.longValue() + "đ) chưa khai giảng.";

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

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromFirstSession = fromBookings.get(0).getSchedule().getStartTime();
        boolean fromStarted = fromFirstSession.isBefore(now)
                || fromBookings.stream().anyMatch(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)));

        if (fromStarted) {
            throw new IllegalStateException("Không thể chuyển lớp: Khóa học hiện tại đã bắt đầu hoặc đã có buổi học diễn ra.");
        }

        // 2. Verify toClass eligibility
        if (!"ACTIVE".equalsIgnoreCase(toClass.getStatus())) {
            throw new IllegalStateException("Không thể chuyển sang lớp học đang ngừng hoạt động.");
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
        if (toSchedules.get(0).getStartTime().isBefore(now)) {
            throw new IllegalStateException("Lớp học mục tiêu đã bắt đầu, không thể chuyển vào.");
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
                .category(SupportCategory.SCHEDULE_SUPPORT)
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

        // Auto-close any pending tickets for the old class
        List<SupportRequest> oldTickets = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), fromClassId))
                .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST || r.getCategory() == SupportCategory.SCHEDULE_SUPPORT)
                .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                .toList();
        for (SupportRequest pt : oldTickets) {
            pt.setStatus(SupportStatus.RESOLVED);
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

        boolean isCancellationCategory = request.getCategory() == SupportCategory.CLASS_CANCELLATION
                || request.getCategory() == SupportCategory.REFUND_REQUEST;

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

            // 2. Check if user already has an active pending/in_progress/escalated ticket for this class
            List<SupportRequest> existingActive = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), request.getClassId()))
                    .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST)
                    .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                    .toList();
            if (!existingActive.isEmpty()) {
                throw new IllegalStateException("Bạn đang có đơn yêu cầu #" + existingActive.get(0).getRequestId() 
                        + " cho lớp học này đang chờ xử lý. Vui lòng không gửi lặp lại yêu cầu để tránh làm chậm tiến độ hỗ trợ.");
            }

            // 3. Check if user already had an approved/resolved ticket for this class
            List<SupportRequest> resolvedWithComp = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), request.getClassId()))
                    .filter(r -> r.getStatus() == SupportStatus.APPROVED || r.getStatus() == SupportStatus.RESOLVED)
                    .toList();
            if (!resolvedWithComp.isEmpty()) {
                throw new IllegalStateException("Lớp học này đã được giải quyết hủy hoặc bảo lưu học phí trước đó (Đơn #" 
                        + resolvedWithComp.get(0).getRequestId() + "). Không thể tạo thêm yêu cầu.");
            }
        }

        String prefRes = null;
        if (request.getPreferredResolution() != null && !request.getPreferredResolution().isBlank()) {
            prefRes = request.getPreferredResolution();
        } else if (isCancellationCategory) {
            prefRes = "ISSUE_CREDIT";
        }

        // Auto-priority intelligence
        SupportPriority calculatedPriority = request.getPriority();
        if (calculatedPriority == null || calculatedPriority == SupportPriority.NORMAL) {
            if ("CASH_REFUND".equalsIgnoreCase(prefRes) || "MANAGER_REFUND".equalsIgnoreCase(prefRes)) {
                calculatedPriority = SupportPriority.HIGH;
            } else if (request.getCategory() == SupportCategory.COMPLAINT) {
                calculatedPriority = SupportPriority.HIGH;
            } else if (isCancellationCategory && request.getContent() != null) {
                String cLower = request.getContent().toLowerCase();
                if (cLower.contains("cấp cứu") || cLower.contains("y tế") || cLower.contains("tai nạn") 
                        || cLower.contains("bệnh") || cLower.contains("medical") || cLower.contains("emergency")) {
                    calculatedPriority = SupportPriority.HIGH;
                }
            }
        }
        if (calculatedPriority == null) {
            calculatedPriority = SupportPriority.NORMAL;
        }

        SupportRequest entity = SupportRequest.builder()
                .user(user)
                .gymClass(gymClass)
                .category(request.getCategory() != null ? request.getCategory() : SupportCategory.GENERAL_INQUIRY)
                .preferredResolution(prefRes)
                .title(request.getTitle())
                .content(request.getContent())
                .status(SupportStatus.PENDING)
                .priority(calculatedPriority)
                .build();

        SupportRequest saved = supportRequestRepository.save(entity);

        // Notify member that ticket was received
        Notification notif = Notification.builder()
                .user(user)
                .title("Yêu cầu hỗ trợ đã được tiếp nhận")
                .message("Trung tâm đã tiếp nhận yêu cầu #" + saved.getRequestId() + ": \"" + saved.getTitle() + "\". Lễ tân sẽ phản hồi và xử lý trong thời gian sớm nhất.")
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportRequestResponse> getMemberSupportRequests(String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        return supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SupportRequestResponse> searchRequestsForStaff(SupportStatus status, SupportCategory category, String keyword, Pageable pageable) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return supportRequestRepository.searchSupportRequests(status, category, kw, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStaffSupportStats() {
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

        if (request.getStatus() == SupportStatus.ESCALATED && !isManagerStaff) {
            throw new IllegalStateException("Đơn yêu cầu này đã được chuyển lên Quản lý trung tâm. Chỉ Quản lý mới có thẩm quyền giải quyết.");
        }

        request.setStatus(dto.getStatus() != null ? dto.getStatus() : SupportStatus.RESOLVED);
        request.setResponseNote(dto.getResponseNote());
        request.setRespondedBy(staff);
        request.setRespondedAt(LocalDateTime.now());

        String generatedCreditCode = null;
        BigDecimal generatedCreditAmount = null;

        // If resolution grants Credit or Cash Refund
        boolean isApproved = request.getStatus() == SupportStatus.RESOLVED || request.getStatus() == SupportStatus.APPROVED;
        boolean isCashRefund = "CASH_REFUND".equalsIgnoreCase(dto.getResolutionType()) 
                || "MANAGER_REFUND".equalsIgnoreCase(dto.getResolutionType());
        boolean isGymPass = "GYM_PASS".equalsIgnoreCase(dto.getResolutionType())
                || ("APPROVE_GENERAL".equalsIgnoreCase(dto.getResolutionType()) && "GYM_PASS".equalsIgnoreCase(request.getPreferredResolution()));
        boolean wantsCredit = !isCashRefund && ("CREDIT".equalsIgnoreCase(dto.getResolutionType()) 
                || "ISSUE_CREDIT".equalsIgnoreCase(dto.getResolutionType()) 
                || isGymPass
                || (dto.getCreditAmount() != null && dto.getCreditAmount().compareTo(BigDecimal.ZERO) > 0)
                || ("APPROVE_GENERAL".equalsIgnoreCase(dto.getResolutionType())
                    && (request.getGymClass() != null || request.getCategory() == SupportCategory.CLASS_CANCELLATION)
                    && (request.getPreferredResolution() == null 
                        || "ISSUE_CREDIT".equalsIgnoreCase(request.getPreferredResolution()) 
                        || "CREDIT".equalsIgnoreCase(request.getPreferredResolution())
                        || "GYM_PASS".equalsIgnoreCase(request.getPreferredResolution())))
        );

        boolean isCompensating = isApproved && (isCashRefund || wantsCredit || isGymPass);

        if (isCompensating && request.getGymClass() != null) {
            Integer classId = request.getGymClass().getClassId();
            Integer memberUserId = request.getUser().getUserId();

            // 1. Safeguard: Check if this user and class was already compensated in another ticket
            List<SupportRequest> alreadyResolvedTickets = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(memberUserId).stream()
                    .filter(r -> !Objects.equals(r.getRequestId(), request.getRequestId()))
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), classId))
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

        // 3. ALWAYS cancel future un-attended bookings for this class whenever cancellation/compensation is approved
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

        if (isApproved && wantsCredit) {
            BigDecimal creditAmount = dto.getCreditAmount();
            if (creditAmount == null || creditAmount.compareTo(BigDecimal.ZERO) <= 0) {
                // Auto calculate if class linked
                if (request.getGymClass() != null) {
                    try {
                        CancelClassPreviewResponse preview = getCancelClassPreview(request.getGymClass().getClassId(), request.getUser().getEmail());
                        creditAmount = preview.getEstimatedCreditAmount();
                    } catch (Exception e) {
                        creditAmount = request.getGymClass().getPrice();
                    }
                }
            } else {
                creditAmount = creditAmount.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(1000));
            }

            if (creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
                Integer classId = request.getGymClass() != null ? request.getGymClass().getClassId() : null;
                String prefix = isGymPass ? "GYMPASS-" : "CRED-";
                generatedCreditCode = generateCreditCodeWithPrefix(prefix, classId, request.getUser().getUserId());
                generatedCreditAmount = creditAmount;

                int validityDays = dto.getEffectiveValidityDays() != null ? dto.getEffectiveValidityDays() : 60;
                LocalDate expiryDate = LocalDate.now().plusDays(validityDays);

                String reason = isGymPass
                        ? ("Thẻ tập Gym 01 tháng (Chuyển đổi theo đơn #" + request.getRequestId() + ": " + request.getTitle() + ")")
                        : ("Bảo lưu theo yêu cầu #" + request.getRequestId() + ": " + request.getTitle());

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

        if (generatedCreditCode != null && (request.getResponseNote() == null || request.getResponseNote().contains("tiếp nhận và xử lý") || isGymPass)) {
            String rolePrefix = isManagerStaff ? "Quản lý trung tâm" : "Lễ tân";
            String className = request.getGymClass() != null ? (" " + request.getGymClass().getClassName()) : "";
            if (isGymPass) {
                request.setResponseNote(rolePrefix + " đã phê duyệt chuyển đổi lớp" + className
                        + " sang Thẻ tập Gym 01 tháng miễn phí cho học viên. Mã kích hoạt voucher: " + generatedCreditCode + " trị giá " + generatedCreditAmount.longValue() + "đ (Hạn dùng 60 ngày).");
            } else {
                request.setResponseNote(rolePrefix + " đã phê duyệt yêu cầu bảo lưu lớp" + className
                        + ". Mã tín dụng 60 ngày " + generatedCreditCode + " trị giá " + generatedCreditAmount.longValue() + "đ đã được cấp vào tài khoản học viên.");
            }
        }

        supportRequestRepository.save(request);

        // Auto-close any other pending duplicate tickets for this member & class if approved with compensation
        if (isCompensating && request.getGymClass() != null) {
            Integer classId = request.getGymClass().getClassId();
            Integer memberUserId = request.getUser().getUserId();
            List<SupportRequest> otherPending = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(memberUserId).stream()
                    .filter(r -> !Objects.equals(r.getRequestId(), request.getRequestId()))
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), classId))
                    .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST)
                    .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                    .toList();

            for (SupportRequest op : otherPending) {
                op.setStatus(SupportStatus.RESOLVED);
                op.setResponseNote("Hệ thống tự động đóng đơn do yêu cầu hủy lớp này đã được giải quyết qua đơn #" + request.getRequestId() + ".");
                op.setRespondedBy(staff);
                op.setRespondedAt(LocalDateTime.now());
                supportRequestRepository.save(op);
            }
        }

        // Send notification to member with appropriate role title
        String roleTitle = isManagerStaff ? "Quản lý trung tâm" : "Lễ tân";

        StringBuilder notifMsg = new StringBuilder();
        if (dto.getResponseNote() != null && !dto.getResponseNote().trim().isEmpty()) {
            notifMsg.append(roleTitle).append(" phản hồi: \"").append(dto.getResponseNote()).append("\". ");
        }
        if (isCashRefund) {
            BigDecimal refundVal = dto.getCreditAmount();
            if (refundVal != null && refundVal.compareTo(BigDecimal.ZERO) > 0) {
                notifMsg.append("Khoản hoàn tiền mặt/chuyển khoản trị giá ").append(refundVal.longValue()).append("đ đã được Quản lý phê duyệt giải quyết.");
            } else {
                notifMsg.append("Lệnh hoàn tiền đã được Quản lý trung tâm phê duyệt giải quyết.");
            }
        } else if (generatedCreditCode != null) {
            notifMsg.append("Bạn được cấp Credit bảo lưu: ").append(generatedCreditCode)
                    .append(" trị giá ").append(generatedCreditAmount.longValue()).append("đ (hạn 60 ngày).");
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
    @Transactional
    public List<UserCreditResponse> getMemberCredits(String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        // Auto-heal: Ensure approved requests that intended to grant credit have their UserCredit generated
        List<SupportRequest> approvedRequests = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .filter(r -> r.getStatus() == SupportStatus.APPROVED || r.getStatus() == SupportStatus.RESOLVED)
                .filter(r -> r.getGymClass() != null)
                .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST || "ISSUE_CREDIT".equalsIgnoreCase(r.getPreferredResolution()) || "GYM_PASS".equalsIgnoreCase(r.getPreferredResolution()))
                .filter(r -> !"CASH_REFUND".equalsIgnoreCase(r.getPreferredResolution()))
                .filter(r -> userCreditRepository.findBySupportRequestRequestId(r.getRequestId()).isEmpty())
                .toList();

        for (SupportRequest req : approvedRequests) {
            BigDecimal creditAmount = null;
            try {
                CancelClassPreviewResponse preview = getCancelClassPreview(req.getGymClass().getClassId(), memberEmail);
                creditAmount = preview.getEstimatedCreditAmount();
            } catch (Exception e) {
                creditAmount = req.getGymClass().getPrice();
            }

            if (creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
                Integer classId = req.getGymClass().getClassId();
                boolean reqIsGymPass = "GYM_PASS".equalsIgnoreCase(req.getPreferredResolution());
                String prefix = reqIsGymPass ? "GYMPASS-" : "CRED-";
                String creditCode = generateCreditCodeWithPrefix(prefix, classId, user.getUserId());
                LocalDate expiryDate = LocalDate.now().plusDays(60);

                String reason = reqIsGymPass
                        ? ("Thẻ tập Gym 01 tháng (Chuyển đổi theo đơn #" + req.getRequestId() + ": " + req.getTitle() + ")")
                        : ("Bảo lưu theo yêu cầu #" + req.getRequestId() + ": " + req.getTitle());

                UserCredit credit = UserCredit.builder()
                        .user(user)
                        .supportRequest(req)
                        .gymClass(req.getGymClass())
                        .creditCode(creditCode)
                        .amount(creditAmount)
                        .remainingAmount(creditAmount)
                        .reason(reason)
                        .expiryDate(expiryDate)
                        .status(CreditStatus.ACTIVE)
                        .build();
                userCreditRepository.save(credit);

                // Cancel future bookings of this class
                List<Booking> bookings = bookingRepository.findAllBookingsByEmail(memberEmail).stream()
                        .filter(b -> b.getSchedule() != null && b.getSchedule().getGymClass() != null
                                && Objects.equals(b.getSchedule().getGymClass().getClassId(), classId)
                                && !"CANCELLED".equals(b.getStatus())
                                && !"PRESENT".equalsIgnoreCase(b.getAttendanceStatus()))
                        .toList();
                for (Booking b : bookings) {
                    b.setStatus("CANCELLED");
                    bookingRepository.save(b);
                }

                if (req.getResponseNote() == null || req.getResponseNote().contains("tiếp nhận và xử lý")) {
                    req.setResponseNote("Lễ tân đã phê duyệt yêu cầu bảo lưu lớp " + req.getGymClass().getClassName()
                            + ". Mã tín dụng 60 ngày " + creditCode + " trị giá " + creditAmount.longValue() + "đ đã được cấp vào tài khoản học viên.");
                    supportRequestRepository.save(req);
                }
            }
        }

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

            List<SupportRequest> existingActive = supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(member.getUserId()).stream()
                    .filter(r -> r.getGymClass() != null && Objects.equals(r.getGymClass().getClassId(), request.getClassId()))
                    .filter(r -> r.getCategory() == SupportCategory.CLASS_CANCELLATION || r.getCategory() == SupportCategory.REFUND_REQUEST)
                    .filter(r -> r.getStatus() == SupportStatus.PENDING || r.getStatus() == SupportStatus.IN_PROGRESS || r.getStatus() == SupportStatus.ESCALATED)
                    .toList();
            if (!existingActive.isEmpty()) {
                throw new IllegalStateException("Hội viên đang có đơn yêu cầu #" + existingActive.get(0).getRequestId() 
                        + " cho lớp học này đang chờ xử lý. Vui lòng không tạo thêm.");
            }
        }

        SupportRequest entity = SupportRequest.builder()
                .user(member)
                .gymClass(gymClass)
                .category(request.getCategory() != null ? request.getCategory() : SupportCategory.GENERAL_INQUIRY)
                .title(request.getTitle())
                .content(request.getContent() + " (Lễ tân ghi nhận tại quầy: " + staff.getFullName() + ")")
                .status(SupportStatus.IN_PROGRESS)
                .priority(request.getPriority() != null ? request.getPriority() : SupportPriority.NORMAL)
                .respondedBy(staff)
                .build();

        SupportRequest saved = supportRequestRepository.save(entity);

        Notification notif = Notification.builder()
                .user(member)
                .title("Lễ tân tiếp nhận yêu cầu tại quầy")
                .message("Lễ tân " + staff.getFullName() + " đã ghi nhận yêu cầu hỗ trợ: \"" + saved.getTitle() + "\" tại quầy tiếp đón.")
                .type("SUPPORT")
                .isRead(false)
                .build();
        notificationRepository.save(notif);

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

        return mapToResponse(saved);
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
                    LocalDateTime now = LocalDateTime.now();
                    totalSessions = bookings.size();
                    attendedSessions = (int) bookings.stream()
                            .filter(b -> "PRESENT".equalsIgnoreCase(b.getAttendanceStatus())
                                    || (b.getSchedule() != null && b.getSchedule().getStartTime().isBefore(now)))
                            .count();
                    remainingSessions = Math.max(0, totalSessions - attendedSessions);

                    boolean isCancellationOrRefund = r.getCategory() == SupportCategory.CLASS_CANCELLATION
                            || r.getCategory() == SupportCategory.REFUND_REQUEST
                            || (r.getPreferredResolution() != null && !r.getPreferredResolution().isBlank())
                            || (r.getTitle() != null && (r.getTitle().toLowerCase().contains("cancellation")
                                    || r.getTitle().toLowerCase().contains("hủy")
                                    || r.getTitle().toLowerCase().contains("bảo lưu")));

                    // ONLY calculate prorated credit if this request is a cancellation/refund request
                    if (isCancellationOrRefund && classPrice != null && totalSessions > 0) {
                        BigDecimal raw = classPrice
                                .multiply(BigDecimal.valueOf(remainingSessions))
                                .divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);
                        calculatedCredit = raw.divide(BigDecimal.valueOf(1000), 0, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(1000));
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
        if (effectivePriority == SupportPriority.NORMAL && "CASH_REFUND".equalsIgnoreCase(r.getPreferredResolution())) {
            effectivePriority = SupportPriority.HIGH;
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
