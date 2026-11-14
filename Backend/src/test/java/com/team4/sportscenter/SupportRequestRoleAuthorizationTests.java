package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.entities.Role;
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
import com.team4.sportscenter.modules.support.controllers.ReceptionistSupportController;
import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.request.RespondSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
import com.team4.sportscenter.modules.support.entities.SupportRequest;
import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportPriority;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import com.team4.sportscenter.modules.support.repositories.SupportRequestRepository;
import com.team4.sportscenter.modules.support.repositories.UserCreditRepository;
import com.team4.sportscenter.modules.support.services.impl.SupportRequestServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UserDetails;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportRequestRoleAuthorizationTests {

    @Mock
    private SupportRequestRepository supportRequestRepository;
    @Mock
    private UserCreditRepository userCreditRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private CoachClassRepository coachClassRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private JdbcTemplate jdbc;

    @InjectMocks
    private SupportRequestServiceImpl supportRequestService;

    private List<Booking> buildBookings(User member, GymClass gymClass, LocalDateTime now, int pastCount, int futureCount, boolean futurePresent) {
        java.util.ArrayList<Booking> list = new java.util.ArrayList<>();
        for (int i = 0; i < pastCount; i++) {
            Schedule s = Schedule.builder()
                    .scheduleId(i + 1)
                    .gymClass(gymClass)
                    .startTime(now.minusDays(pastCount - i))
                    .endTime(now.minusDays(pastCount - i).plusHours(1))
                    .build();
            list.add(Booking.builder()
                    .bookingId(100 + i)
                    .user(member)
                    .schedule(s)
                    .status("CONFIRMED")
                    .attendanceStatus("PRESENT")
                    .build());
        }
        for (int j = 0; j < futureCount; j++) {
            Schedule s = Schedule.builder()
                    .scheduleId(10 + j)
                    .gymClass(gymClass)
                    .startTime(now.plusDays(j + 1))
                    .endTime(now.plusDays(j + 1).plusHours(1))
                    .build();
            list.add(Booking.builder()
                    .bookingId(200 + j)
                    .user(member)
                    .schedule(s)
                    .status("CONFIRMED")
                    .attendanceStatus(futurePresent ? "PRESENT" : "NOT_YET")
                    .build());
        }
        return list;
    }

    @Test
    void respondEndpointAllowsReceptionistManagerAndAdminWhileRevokeRemainsManagerOnly() throws NoSuchMethodException {
        Method respondMethod = ReceptionistSupportController.class.getMethod(
                "respondToRequest",
                Integer.class,
                RespondSupportRequest.class,
                UserDetails.class
        );
        PreAuthorize respondAuth = respondMethod.getAnnotation(PreAuthorize.class);
        assertNotNull(respondAuth);
        assertEquals("hasAnyRole('RECEPTIONIST', 'CENTER_MANAGER', 'ADMIN')", respondAuth.value());

        Method revokeMethod = ReceptionistSupportController.class.getMethod(
                "revokeRequest",
                Integer.class,
                Map.class,
                UserDetails.class
        );
        PreAuthorize revokeAuth = revokeMethod.getAnnotation(PreAuthorize.class);
        assertNotNull(revokeAuth);
        assertEquals("hasAnyRole('CENTER_MANAGER', 'ADMIN')", revokeAuth.value());
    }

    @Test
    void respondToRequestAllowsManagerOnlyForCancellationAndRejectsCashOrGymPass() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime now = LocalDateTime.now();

        SupportRequest creditRequest = SupportRequest.builder()
                .requestId(94)
                .user(member)
                .gymClass(yoga)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.ESCALATED)
                .title("Xin hủy lớp [YOGA-102]")
                .evidenceUrl("data:image/jpeg;base64,evidence")
                .createdAt(now.minusHours(2))
                .build();

        User receptionist = User.builder()
                .userId(20)
                .email("reception@gym.vn")
                .fullName("Lễ Tân")
                .role(Role.builder().roleId(2).roleName("Receptionist").build())
                .build();

        User manager = User.builder()
                .userId(1)
                .email("manager@gym.vn")
                .fullName("Quản Lý")
                .role(Role.builder().roleId(1).roleName("Center Manager").build())
                .build();

        List<Booking> memberBookings = buildBookings(member, yoga, now, 3, 2, false);

        when(supportRequestRepository.findById(94)).thenReturn(Optional.of(creditRequest));
        when(userRepository.findByEmail("reception@gym.vn")).thenReturn(Optional.of(receptionist));
        when(userRepository.findByEmail("manager@gym.vn")).thenReturn(Optional.of(manager));
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn")).thenReturn(memberBookings);
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of());
        when(userCreditRepository.findBySupportRequestRequestId(94)).thenReturn(Optional.empty());
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        RespondSupportRequest approveCredit = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("ISSUE_CREDIT")
                .responseNote("Quản lý đã duyệt hủy lớp và cấp Voucher.")
                .build();

        // Receptionist must NOT process ESCALATED / CLASS_CANCELLATION requests
        IllegalStateException recEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(94, approveCredit, "reception@gym.vn")
        );
        assertTrue(recEx.getMessage().contains("Admin / Quản lý"));

        // Cash refund & Gym pass must be blocked even for Manager
        RespondSupportRequest tryCashAction = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("CASH_REFUND")
                .responseNote("Duyệt hoàn tiền mặt.")
                .build();
        RespondSupportRequest tryGymPassAction = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("GYM_PASS")
                .responseNote("Đổi thẻ gym.")
                .build();

        assertThrows(IllegalStateException.class, () -> supportRequestService.respondToRequest(94, tryCashAction, "manager@gym.vn"));
        assertThrows(IllegalStateException.class, () -> supportRequestService.respondToRequest(94, tryGymPassAction, "manager@gym.vn"));

        // If Manager rejects first (using a fresh copy), future bookings remain CONFIRMED
        SupportRequest rejectableReq = SupportRequest.builder()
                .requestId(96)
                .user(member)
                .gymClass(yoga)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.ESCALATED)
                .title("Xin hủy lớp [YOGA-102]")
                .createdAt(now.minusHours(2))
                .build();
        when(supportRequestRepository.findById(96)).thenReturn(Optional.of(rejectableReq));
        when(userCreditRepository.findBySupportRequestRequestId(96)).thenReturn(Optional.empty());

        RespondSupportRequest rejectAction = RespondSupportRequest.builder()
                .status(SupportStatus.REJECTED)
                .resolutionType("REJECT")
                .responseNote("Bằng chứng chưa hợp lệ.")
                .build();
        SupportRequestResponse rejectedRes = supportRequestService.respondToRequest(96, rejectAction, "manager@gym.vn");
        assertEquals(SupportStatus.REJECTED, rejectedRes.getStatus());
        assertTrue(memberBookings.stream().allMatch(b -> "CONFIRMED".equals(b.getStatus())));

        // When Manager approves ISSUE_CREDIT, un-attended bookings become CANCELLED
        SupportRequestResponse okRes = supportRequestService.respondToRequest(94, approveCredit, "manager@gym.vn");
        assertEquals(SupportStatus.APPROVED, okRes.getStatus());
        long cancelledCount = memberBookings.stream().filter(b -> "CANCELLED".equals(b.getStatus())).count();
        assertEquals(2L, cancelledCount);
    }

    @Test
    void sevenDayRuleDirectCancelGrants50PercentAndLateCancelRequiresEvidenceWithScheduleRetained() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        GymClass earlyClass = GymClass.builder().classId(11).className("[YOGA-EARLY]").price(new BigDecimal("1000000")).build();
        GymClass lateClass = GymClass.builder().classId(12).className("[YOGA-LATE]").price(new BigDecimal("1000000")).build();
        LocalDateTime now = LocalDateTime.now();

        Schedule earlySched = Schedule.builder().scheduleId(501).gymClass(earlyClass)
                .startTime(now.plusDays(9)).endTime(now.plusDays(9).plusHours(1)).build();
        List<Booking> earlyBookings = List.of(Booking.builder().bookingId(601).user(member).schedule(earlySched)
                .status("CONFIRMED").attendanceStatus("NOT_YET").build());

        Schedule lateSched = Schedule.builder().scheduleId(502).gymClass(lateClass)
                .startTime(now.plusDays(3)).endTime(now.plusDays(3).plusHours(1)).build();
        List<Booking> lateBookings = List.of(Booking.builder().bookingId(602).user(member).schedule(lateSched)
                .status("CONFIRMED").attendanceStatus("NOT_YET").build());

        when(userRepository.findByEmail("member@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(11)).thenReturn(Optional.of(earlyClass));
        when(coachClassRepository.findById(12)).thenReturn(Optional.of(lateClass));
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of());
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> {
            SupportRequest r = inv.getArgument(0);
            if (r.getRequestId() == null) r.setRequestId(300);
            return r;
        });

        // >= 7 days: direct cancel eligible with 50% voucher
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn")).thenReturn(earlyBookings);
        var earlyPreview = supportRequestService.getCancelClassPreview(11, "member@gym.vn");
        assertTrue(earlyPreview.isCanDirectCancelWithCredit());
        assertFalse(earlyPreview.isWithinSevenDays());
        assertEquals(new BigDecimal("500000"), earlyPreview.getEstimatedCreditAmount());

        Map<String, Object> directResult = supportRequestService.cancelClassDirectly(11, "member@gym.vn");
        assertEquals(new BigDecimal("500000"), directResult.get("creditAmount"));
        assertEquals("CANCELLED", earlyBookings.get(0).getStatus());

        // < 7 days: direct cancel blocked; createSupportRequest requires evidence and keeps bookings CONFIRMED
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn")).thenReturn(lateBookings);
        var latePreview = supportRequestService.getCancelClassPreview(12, "member@gym.vn");
        assertFalse(latePreview.isCanDirectCancelWithCredit());
        assertTrue(latePreview.isWithinSevenDays());
        assertThrows(IllegalStateException.class, () -> supportRequestService.cancelClassDirectly(12, "member@gym.vn"));

        CreateSupportRequest missingEvidence = CreateSupportRequest.builder()
                .classId(12)
                .category(SupportCategory.CLASS_CANCELLATION)
                .title("Xin hủy lớp muộn")
                .content("Công tác đột xuất")
                .build();
        IllegalStateException evEx = assertThrows(IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(missingEvidence, "member@gym.vn"));
        assertTrue(evEx.getMessage().contains("bằng chứng"));

        CreateSupportRequest withEvidence = CreateSupportRequest.builder()
                .classId(12)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("CASH_REFUND")
                .title("Xin hủy lớp muộn")
                .content("Có quyết định điều động công tác")
                .evidenceUrl("data:image/jpeg;base64,/9j/valid")
                .build();
        when(userCreditRepository.findBySupportRequestRequestId(300)).thenReturn(Optional.empty());

        SupportRequestResponse created = supportRequestService.createSupportRequest(withEvidence, "member@gym.vn");
        assertEquals(SupportStatus.ESCALATED, created.getStatus());
        assertEquals("ISSUE_CREDIT", created.getPreferredResolution());
        assertEquals("data:image/jpeg;base64,/9j/valid", created.getEvidenceUrl());
        assertEquals("CONFIRMED", lateBookings.get(0).getStatus());
    }

    @Test
    void cancelClassDirectlyWithAcceptForfeitCancelsRemainingSessionsWithoutCredit() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Hội Viên A").build();
        GymClass startedClass = GymClass.builder().classId(13).className("[GYM-201] Gym Nâng Cao").price(new BigDecimal("800000")).build();
        LocalDateTime now = LocalDateTime.now();

        Schedule pastSchedule = Schedule.builder().scheduleId(131).gymClass(startedClass)
                .startTime(now.minusDays(2)).endTime(now.minusDays(2).plusHours(1)).build();
        Schedule futureSchedule = Schedule.builder().scheduleId(132).gymClass(startedClass)
                .startTime(now.plusDays(2)).endTime(now.plusDays(2).plusHours(1)).build();

        Booking attendedBooking = Booking.builder().bookingId(1301).user(member).schedule(pastSchedule)
                .status("CONFIRMED").attendanceStatus("PRESENT").build();
        Booking remainingBooking = Booking.builder().bookingId(1302).user(member).schedule(futureSchedule)
                .status("CONFIRMED").build();

        when(userRepository.findByEmail("member@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(13)).thenReturn(Optional.of(startedClass));
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn")).thenReturn(List.of(attendedBooking, remainingBooking));
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of());
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> {
            SupportRequest r = inv.getArgument(0);
            if (r.getRequestId() == null) r.setRequestId(399);
            return r;
        });

        Map<String, Object> result = supportRequestService.cancelClassDirectly(13, "member@gym.vn", true);
        assertEquals(true, result.get("success"));
        assertEquals(true, result.get("forfeitAccepted"));
        assertEquals(1, result.get("cancelledBookingsCount"));
        assertEquals(BigDecimal.ZERO, result.get("creditAmount"));
        assertNull(result.get("creditCode"));
        assertEquals("CONFIRMED", attendedBooking.getStatus());
        assertEquals("CANCELLED", remainingBooking.getStatus());
        verify(userCreditRepository, never()).save(any());
    }

    @Test
    void respondToRequestRejectsReceptionistForCoachFeedbackAndEscalated() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        SupportRequest coachTicket = SupportRequest.builder()
                .requestId(102)
                .user(member)
                .category(SupportCategory.COACH_FEEDBACK)
                .priority(SupportPriority.NORMAL)
                .status(SupportStatus.PENDING)
                .title("Góp ý HLV")
                .build();
        SupportRequest escalatedTicket = SupportRequest.builder()
                .requestId(103)
                .user(member)
                .category(SupportCategory.COMPLAINT)
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.ESCALATED)
                .title("Khiếu nại chuyển cấp")
                .build();
        User receptionist = User.builder()
                .userId(20)
                .email("reception@gym.vn")
                .fullName("Lễ Tân")
                .role(Role.builder().roleId(2).roleName("Receptionist").build())
                .build();

        when(supportRequestRepository.findById(102)).thenReturn(Optional.of(coachTicket));
        when(supportRequestRepository.findById(103)).thenReturn(Optional.of(escalatedTicket));
        when(userRepository.findByEmail("reception@gym.vn")).thenReturn(Optional.of(receptionist));

        RespondSupportRequest dto = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .responseNote("Ghi nhận")
                .build();

        IllegalStateException coachEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(102, dto, "reception@gym.vn")
        );
        assertTrue(coachEx.getMessage().contains("Huấn luyện viên"));

        IllegalStateException escalatedEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(103, dto, "reception@gym.vn")
        );
        assertTrue(escalatedEx.getMessage().contains("chuyển cấp"));
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    void respondToRequestAllowsCenterManagerForGeneralAndCashRefund() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        SupportRequest request = SupportRequest.builder()
                .requestId(101)
                .user(member)
                .category(SupportCategory.GENERAL_INQUIRY)
                .priority(SupportPriority.NORMAL)
                .status(SupportStatus.PENDING)
                .title("Hỏi gia hạn gói")
                .content("Nhờ Admin tư vấn gia hạn")
                .build();
        User manager = User.builder()
                .userId(1)
                .email("manager@gym.vn")
                .fullName("Quản lý")
                .role(Role.builder().roleId(1).roleName("Center Manager").build())
                .build();

        when(supportRequestRepository.findById(101)).thenReturn(Optional.of(request));
        when(userRepository.findByEmail("manager@gym.vn")).thenReturn(Optional.of(manager));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userCreditRepository.findBySupportRequestRequestId(101)).thenReturn(Optional.empty());

        RespondSupportRequest dto = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("GENERAL_RESOLVED")
                .responseNote("Quản lý đã xác nhận hỗ trợ.")
                .build();

        SupportRequestResponse response = supportRequestService.respondToRequest(101, dto, "manager@gym.vn");
        assertEquals(SupportStatus.APPROVED, response.getStatus());
        assertEquals("Quản lý đã xác nhận hỗ trợ.", response.getResponseNote());
        verify(supportRequestRepository).save(request);
    }

    @Test
    void createSupportRequestRequiresReasonAndEvidenceForLateCancellationEvenAfterMostSessions() {
        User member = User.builder().userId(7).email("oanh@gym.vn").fullName("Nguyễn Kiều Oanh").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime now = LocalDateTime.now();

        when(userRepository.findByEmail("oanh@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(2)).thenReturn(Optional.of(yoga));
        when(bookingRepository.findAllBookingsByEmail("oanh@gym.vn"))
                .thenReturn(buildBookings(member, yoga, now, 5, 1, false));
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(7)).thenReturn(List.of());
        when(userRepository.findByRoleNameIgnoreCase(any())).thenReturn(List.of());
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> {
            SupportRequest r = inv.getArgument(0);
            if (r.getRequestId() == null) r.setRequestId(301);
            return r;
        });

        CreateSupportRequest withoutEvidence = CreateSupportRequest.builder()
                .classId(2)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .title("Xin hủy lớp [YOGA-102]")
                .content("Chuyển ca làm")
                .build();

        IllegalStateException missingEvidenceEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(withoutEvidence, "oanh@gym.vn")
        );
        assertTrue(missingEvidenceEx.getMessage().contains("bằng chứng"));
        verify(supportRequestRepository, never()).save(any());

        CreateSupportRequest withEvidence = CreateSupportRequest.builder()
                .classId(2)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .title("Xin hủy lớp [YOGA-102]")
                .content("Có quyết định điều chuyển công tác đột xuất")
                .evidenceUrl("data:image/png;base64,iVBORw0KGgo=")
                .build();

        SupportRequestResponse created = supportRequestService.createSupportRequest(withEvidence, "oanh@gym.vn");
        assertEquals(SupportStatus.ESCALATED, created.getStatus());
        assertEquals("ISSUE_CREDIT", created.getPreferredResolution());
        assertEquals("data:image/png;base64,iVBORw0KGgo=", created.getEvidenceUrl());
    }

    @Test
    void completedCourseLocksCancellationPreviewDirectCancelAndComplaintSubmission() {
        User member = User.builder().userId(7).email("oanh@gym.vn").fullName("Nguyễn Kiều Oanh").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime now = LocalDateTime.now();

        when(userRepository.findByEmail("oanh@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(2)).thenReturn(Optional.of(yoga));
        when(bookingRepository.findAllBookingsByEmail("oanh@gym.vn"))
                .thenReturn(buildBookings(member, yoga, now, 5, 0, false));

        var preview = supportRequestService.getCancelClassPreview(2, "oanh@gym.vn");
        assertEquals(0, preview.getRemainingSessions());
        assertFalse(preview.isCanDirectCancelWithCredit());
        assertFalse(preview.isEligibleForVoucher());
        assertEquals(BigDecimal.ZERO, preview.getEstimatedCreditAmount());
        assertEquals("Bạn đã hoàn thành khóa học rồi.", preview.getMessage());

        IllegalStateException directEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.cancelClassDirectly(2, "oanh@gym.vn", true)
        );
        assertTrue(directEx.getMessage().contains("hoàn thành khóa học"));

        CreateSupportRequest completedComplaint = CreateSupportRequest.builder()
                .classId(2)
                .category(SupportCategory.CLASS_CANCELLATION)
                .title("Xin hủy lớp [YOGA-102]")
                .content("Muốn khiếu nại hoàn tiền dù đã học xong")
                .evidenceUrl("data:image/png;base64,iVBORw0KGgo=")
                .build();
        IllegalStateException createEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(completedComplaint, "oanh@gym.vn")
        );
        assertTrue(createEx.getMessage().contains("hoàn thành khóa học"));
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    void searchRequestsForStaffKeepsLateCancellationTicketEscalatedEvenAfterAllSessionsElapsed() {
        User member = User.builder().userId(7).email("oanh@gym.vn").fullName("Nguyễn Kiều Oanh").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime submittedAt = LocalDateTime.now().minusDays(2);

        java.util.ArrayList<Booking> bookings = new java.util.ArrayList<>();
        for (int i = 0; i < 4; i++) {
            Schedule s = Schedule.builder().scheduleId(i + 1).gymClass(yoga)
                    .startTime(submittedAt.minusDays(4 - i)).endTime(submittedAt.minusDays(4 - i).plusHours(1)).build();
            bookings.add(Booking.builder().bookingId(i + 1).user(member).schedule(s)
                    .status("CONFIRMED").attendanceStatus("PRESENT").build());
        }
        Schedule elapsedAfterSubmit = Schedule.builder().scheduleId(5).gymClass(yoga)
                .startTime(LocalDateTime.now().minusHours(2)).endTime(LocalDateTime.now().minusHours(1)).build();
        bookings.add(Booking.builder().bookingId(5).user(member).schedule(elapsedAfterSubmit)
                .status("CONFIRMED").attendanceStatus("PRESENT").build());

        SupportRequest ticket = SupportRequest.builder()
                .requestId(94)
                .user(member)
                .gymClass(yoga)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .status(SupportStatus.ESCALATED)
                .priority(SupportPriority.HIGH)
                .title("Xin hủy lớp [YOGA-102]")
                .createdAt(submittedAt)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        when(supportRequestRepository.searchSupportRequests(any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(ticket), pageable, 1));
        when(userCreditRepository.findBySupportRequestRequestId(94)).thenReturn(Optional.empty());
        when(bookingRepository.findAllBookingsByEmail("oanh@gym.vn")).thenReturn(bookings);

        Page<SupportRequestResponse> page = supportRequestService.searchRequestsForStaff(null, null, null, pageable);
        SupportRequestResponse res = page.getContent().get(0);
        assertEquals(SupportStatus.ESCALATED, res.getStatus());
        assertEquals(5, res.getAttendedSessions());
        assertEquals(0, res.getRemainingSessions());
        assertEquals(BigDecimal.ZERO, res.getCalculatedCreditAmount());
    }

    @Test
    void facilityIssueRoutesToManagementWithEscalatedStatusAndNotifications() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Hội Viên A").build();
        User manager = User.builder()
                .userId(1)
                .email("manager@gym.vn")
                .fullName("Quản Lý")
                .role(Role.builder().roleId(1).roleName("Center Manager").build())
                .build();
        User receptionist = User.builder()
                .userId(20)
                .email("reception@gym.vn")
                .fullName("Lễ Tân")
                .role(Role.builder().roleId(2).roleName("Receptionist").build())
                .build();

        when(userRepository.findByEmail("member@gym.vn")).thenReturn(Optional.of(member));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> {
            SupportRequest entity = inv.getArgument(0);
            entity.setRequestId(205);
            return entity;
        });
        when(userCreditRepository.findBySupportRequestRequestId(205)).thenReturn(Optional.empty());
        when(userRepository.findByRoleNameIgnoreCase("Center Manager")).thenReturn(List.of(manager));
        when(userRepository.findByRoleNameIgnoreCase("Admin")).thenReturn(List.of());
        when(userRepository.findByRoleNameIgnoreCase("Receptionist")).thenReturn(List.of(receptionist));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSupportRequest missingPhotoDto = CreateSupportRequest.builder()
                .category(SupportCategory.FACILITY_ISSUE)
                .title("[Sự cố CSVC] Máy chạy bộ số 3 bị kẹt băng tải")
                .content("Cần kỹ thuật viên kiểm tra an toàn trước giờ cao điểm.")
                .build();
        IllegalStateException missingPhotoEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(missingPhotoDto, "member@gym.vn")
        );
        assertTrue(missingPhotoEx.getMessage().contains("ảnh chụp"));
        verify(supportRequestRepository, never()).save(any());

        CreateSupportRequest pdfInsteadOfPhotoDto = CreateSupportRequest.builder()
                .category(SupportCategory.FACILITY_ISSUE)
                .title("[Sự cố CSVC] Máy chạy bộ số 3 bị kẹt băng tải")
                .content("Cần kỹ thuật viên kiểm tra an toàn trước giờ cao điểm.")
                .evidenceUrl("data:application/pdf;base64,JVBERi0xLjQ=")
                .build();
        IllegalStateException pdfEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(pdfInsteadOfPhotoDto, "member@gym.vn")
        );
        assertTrue(pdfEx.getMessage().contains("ảnh chụp"));
        verify(supportRequestRepository, never()).save(any());

        CreateSupportRequest createDto = CreateSupportRequest.builder()
                .category(SupportCategory.FACILITY_ISSUE)
                .title("[Sự cố CSVC] Máy chạy bộ số 3 bị kẹt băng tải")
                .content("Cần kỹ thuật viên kiểm tra an toàn trước giờ cao điểm.")
                .evidenceUrl("data:image/jpeg;base64,/9j/valid")
                .build();

        SupportRequestResponse response = supportRequestService.createSupportRequest(createDto, "member@gym.vn");

        assertEquals(SupportStatus.ESCALATED, response.getStatus());
        assertEquals(SupportPriority.HIGH, response.getPriority());
        assertEquals("data:image/jpeg;base64,/9j/valid", response.getEvidenceUrl());

        ArgumentCaptor<Notification> notifCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(3)).save(notifCaptor.capture());
        List<Notification> savedNotifs = notifCaptor.getAllValues();

        assertTrue(savedNotifs.stream().anyMatch(n ->
                n.getUser().getUserId().equals(10)
                        && "SUPPORT".equals(n.getType())
                        && n.getTitle().contains("CSVC đã chuyển Quản lý")));
        assertTrue(savedNotifs.stream().anyMatch(n ->
                n.getUser().getUserId().equals(1)
                        && "SUPPORT_FACILITY".equals(n.getType())
                        && n.getTitle().contains("#205")));
        assertTrue(savedNotifs.stream().anyMatch(n ->
                n.getUser().getUserId().equals(20)
                        && "SUPPORT".equals(n.getType())
                        && n.getMessage().contains("chỉ xem thông tin")));
    }

    @Test
    void facilityIssueRejectsReceptionistAndAllowsCenterManager() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        SupportRequest pendingLegacyFacility = SupportRequest.builder()
                .requestId(206)
                .user(member)
                .category(SupportCategory.FACILITY_ISSUE)
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.PENDING)
                .title("Hỏng điều hòa phòng Yoga")
                .build();
        SupportRequest escalatedFacility = SupportRequest.builder()
                .requestId(207)
                .user(member)
                .category(SupportCategory.FACILITY_ISSUE)
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.ESCALATED)
                .title("Rò rỉ nước khu tủ đồ")
                .build();
        User receptionist = User.builder()
                .userId(20)
                .email("reception@gym.vn")
                .fullName("Lễ Tân")
                .role(Role.builder().roleId(2).roleName("Receptionist").build())
                .build();
        User manager = User.builder()
                .userId(1)
                .email("manager@gym.vn")
                .fullName("Quản Lý")
                .role(Role.builder().roleId(1).roleName("Center Manager").build())
                .build();

        when(supportRequestRepository.findById(206)).thenReturn(Optional.of(pendingLegacyFacility));
        when(supportRequestRepository.findById(207)).thenReturn(Optional.of(escalatedFacility));
        when(userRepository.findByEmail("reception@gym.vn")).thenReturn(Optional.of(receptionist));
        when(userRepository.findByEmail("manager@gym.vn")).thenReturn(Optional.of(manager));
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userCreditRepository.findBySupportRequestRequestId(207)).thenReturn(Optional.empty());

        RespondSupportRequest dto = RespondSupportRequest.builder()
                .status(SupportStatus.RESOLVED)
                .resolutionType("ASSIGN_MAINTENANCE")
                .responseNote("Quản lý đã điều phối đội kỹ thuật sửa chữa ngay trong ngày.")
                .build();

        IllegalStateException categoryEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(206, dto, "reception@gym.vn")
        );
        assertTrue(categoryEx.getMessage().contains("Cơ sở vật chất"));

        IllegalStateException escalatedEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(207, dto, "reception@gym.vn")
        );
        assertTrue(escalatedEx.getMessage().contains("chuyển cấp"));

        SupportRequestResponse response = supportRequestService.respondToRequest(207, dto, "manager@gym.vn");
        assertEquals(SupportStatus.RESOLVED, response.getStatus());
        assertEquals("Quản lý đã điều phối đội kỹ thuật sửa chữa ngay trong ngày.", response.getResponseNote());
        verify(supportRequestRepository).save(escalatedFacility);
    }

    @Test
    void legacyScheduleSupportCategoryMapsToGeneralInquiry() {
        assertEquals(SupportCategory.GENERAL_INQUIRY, SupportCategory.fromString("SCHEDULE_SUPPORT"));
        assertEquals(SupportCategory.GENERAL_INQUIRY, SupportCategory.fromString("schedule_request"));
        assertEquals(SupportCategory.CLASS_CANCELLATION, SupportCategory.fromString("CLASS_CANCELLATION"));
    }

    @Test
    void transferIsBlockedWhileCancellationRequestAwaitsAdminApproval() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        GymClass fromClass = GymClass.builder().classId(12).className("Yoga K2").price(new BigDecimal("1000000")).status("ACTIVE").build();
        GymClass toClass = GymClass.builder().classId(13).className("Yoga K3").price(new BigDecimal("1000000")).status("ACTIVE").build();
        LocalDateTime now = LocalDateTime.now();

        Schedule sched = Schedule.builder().scheduleId(502).gymClass(fromClass)
                .startTime(now.plusDays(3)).endTime(now.plusDays(3).plusHours(1)).build();
        List<Booking> bookings = List.of(Booking.builder().bookingId(602).user(member).schedule(sched)
                .status("CONFIRMED").attendanceStatus("NOT_YET").build());

        SupportRequest pendingCancel = SupportRequest.builder()
                .requestId(401)
                .user(member)
                .gymClass(fromClass)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .status(SupportStatus.ESCALATED)
                .title("Xin hủy lớp muộn")
                .build();

        when(userRepository.findByEmail("member@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(12)).thenReturn(Optional.of(fromClass));
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn")).thenReturn(bookings);
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of(pendingCancel));

        var preview = supportRequestService.getTransferClassPreview(12, "member@gym.vn");
        assertFalse(preview.isCanTransfer());
        assertTrue(preview.isBlockedByPendingRequest());
        assertTrue(preview.getMessage().contains("#401"));
        assertTrue(preview.getEquivalentClasses().isEmpty());

        when(coachClassRepository.findById(13)).thenReturn(Optional.of(toClass));
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> supportRequestService.transferClassDirectly(12, 13, "member@gym.vn"));
        assertTrue(ex.getMessage().contains("#401"));
        verify(bookingRepository, never()).save(any());
        verify(bookingRepository, never()).saveAllAndFlush(any());
        verify(userCreditRepository, never()).save(any());
    }

    @Test
    void getMemberCreditsIsReadOnlyAndNeverAutoMintsVouchers() {
        User member = User.builder().userId(10).email("member@gym.vn").fullName("Member").build();
        when(userRepository.findByEmail("member@gym.vn")).thenReturn(Optional.of(member));
        when(userCreditRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of());

        var credits = supportRequestService.getMemberCredits("member@gym.vn");
        assertTrue(credits.isEmpty());
        verify(userCreditRepository, never()).save(any());
        verify(supportRequestRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
    }
}
