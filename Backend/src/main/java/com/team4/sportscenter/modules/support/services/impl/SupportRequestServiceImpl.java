package com.team4.sportscenter.modules.support.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.request.RespondSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.CancelClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final NotificationRepository notificationRepository;

    private static final SecureRandom RANDOM = new SecureRandom();

    private String generateCreditCode(Integer classId, Integer userId) {
        int rand = 1000 + RANDOM.nextInt(9000);
        return "CRED-" + (classId != null ? classId : "GEN") + "-" + userId + "-" + rand;
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
            estimatedCreditAmount = classPrice
                    .multiply(BigDecimal.valueOf(remainingSessions))
                    .divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);
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

        UserCredit credit = UserCredit.builder()
                .user(user)
                .gymClass(gymClass)
                .creditCode(creditCode)
                .amount(creditAmount)
                .remainingAmount(creditAmount)
                .reason("Bảo lưu 100% học phí hủy lớp trước khai giảng: " + gymClass.getClassName())
                .expiryDate(expiryDate)
                .status(CreditStatus.ACTIVE)
                .build();
        userCreditRepository.save(credit);

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
        result.put("creditCode", creditCode);
        result.put("creditAmount", creditAmount);
        result.put("expiryDate", expiryDate.toString());
        result.put("message", "Đã hủy lớp thành công và cấp Credit bảo lưu 100% học phí.");
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

        SupportRequest entity = SupportRequest.builder()
                .user(user)
                .gymClass(gymClass)
                .category(request.getCategory() != null ? request.getCategory() : SupportCategory.GENERAL_INQUIRY)
                .title(request.getTitle())
                .content(request.getContent())
                .status(SupportStatus.PENDING)
                .priority(request.getPriority() != null ? request.getPriority() : SupportPriority.NORMAL)
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
        stats.put("resolved", supportRequestRepository.countByStatus(SupportStatus.RESOLVED) + supportRequestRepository.countByStatus(SupportStatus.APPROVED));
        stats.put("approved", supportRequestRepository.countByStatus(SupportStatus.APPROVED));
        stats.put("escalated", supportRequestRepository.countByStatus(SupportStatus.ESCALATED));
        stats.put("rejected", supportRequestRepository.countByStatus(SupportStatus.REJECTED));
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
        boolean wantsCredit = !isCashRefund && ("CREDIT".equalsIgnoreCase(dto.getResolutionType()) 
                || "ISSUE_CREDIT".equalsIgnoreCase(dto.getResolutionType()) 
                || (dto.getCreditAmount() != null && dto.getCreditAmount().compareTo(BigDecimal.ZERO) > 0));

        if (isApproved && isCashRefund) {
            // Manager approved cash / bank refund: cancel future bookings so remaining slots are released
            Integer classId = request.getGymClass() != null ? request.getGymClass().getClassId() : null;
            if (classId != null) {
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
        } else if (isApproved && wantsCredit) {
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
            }

            if (creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
                Integer classId = request.getGymClass() != null ? request.getGymClass().getClassId() : null;
                generatedCreditCode = generateCreditCode(classId, request.getUser().getUserId());
                generatedCreditAmount = creditAmount;

                int validityDays = dto.getEffectiveValidityDays() != null ? dto.getEffectiveValidityDays() : 60;
                LocalDate expiryDate = LocalDate.now().plusDays(validityDays);

                UserCredit credit = UserCredit.builder()
                        .user(request.getUser())
                        .supportRequest(request)
                        .gymClass(request.getGymClass())
                        .creditCode(generatedCreditCode)
                        .amount(creditAmount)
                        .remainingAmount(creditAmount)
                        .reason("Bảo lưu theo yêu cầu #" + request.getRequestId() + ": " + request.getTitle())
                        .expiryDate(expiryDate)
                        .status(CreditStatus.ACTIVE)
                        .build();
                userCreditRepository.save(credit);

                // Cancel future bookings of this class if linked
                if (classId != null) {
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
            }
        }

        supportRequestRepository.save(request);

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
    @Transactional(readOnly = true)
    public List<UserCreditResponse> getMemberCredits(String memberEmail) {
        User user = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + memberEmail));

        LocalDate today = LocalDate.now();
        return userCreditRepository.findByUserUserIdOrderByCreatedAtDesc(user.getUserId()).stream()
                .map(c -> UserCreditResponse.builder()
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
                        .status(c.getStatus())
                        .createdAt(c.getCreatedAt())
                        .isExpired(c.getExpiryDate().isBefore(today))
                        .build())
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
                    if (classPrice != null && totalSessions > 0) {
                        calculatedCredit = classPrice
                                .multiply(BigDecimal.valueOf(remainingSessions))
                                .divide(BigDecimal.valueOf(totalSessions), 0, RoundingMode.HALF_UP);
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // Check if a credit was already generated for this request
        Optional<UserCredit> optCredit = userCreditRepository.findBySupportRequestRequestId(r.getRequestId());
        String generatedCreditCode = optCredit.map(UserCredit::getCreditCode).orElse(null);
        BigDecimal generatedCreditAmount = optCredit.map(UserCredit::getAmount).orElse(null);

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
                .title(r.getTitle())
                .content(r.getContent())
                .status(r.getStatus())
                .priority(r.getPriority())
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
