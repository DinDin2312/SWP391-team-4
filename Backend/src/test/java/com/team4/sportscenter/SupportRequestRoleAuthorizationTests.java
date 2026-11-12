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
    void respondToRequestAllowsReceptionistForCreditCancellationAndRejectsCashRefund() {
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
                .status(SupportStatus.PENDING)
                .title("Xin hủy lớp [YOGA-102]")
                .createdAt(now.minusHours(2))
                .build();

        SupportRequest cashRequest = SupportRequest.builder()
                .requestId(95)
                .user(member)
                .gymClass(yoga)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("CASH_REFUND")
                .priority(SupportPriority.HIGH)
                .status(SupportStatus.PENDING)
                .title("Xin hoàn tiền mặt")
                .createdAt(now.minusHours(2))
                .build();

        User receptionist = User.builder()
                .userId(20)
                .email("reception@gym.vn")
                .fullName("Lễ Tân")
                .role(Role.builder().roleId(2).roleName("Receptionist").build())
                .build();

        when(supportRequestRepository.findById(94)).thenReturn(Optional.of(creditRequest));
        when(supportRequestRepository.findById(95)).thenReturn(Optional.of(cashRequest));
        when(userRepository.findByEmail("reception@gym.vn")).thenReturn(Optional.of(receptionist));
        when(bookingRepository.findAllBookingsByEmail("member@gym.vn"))
                .thenReturn(buildBookings(member, yoga, now, 3, 2, false));
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(10)).thenReturn(List.of());
        when(userCreditRepository.findBySupportRequestRequestId(94)).thenReturn(Optional.empty());
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        RespondSupportRequest approveCredit = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("ISSUE_CREDIT")
                .responseNote("Lễ tân đã duyệt bảo lưu tín dụng.")
                .build();

        SupportRequestResponse okRes = supportRequestService.respondToRequest(94, approveCredit, "reception@gym.vn");
        assertEquals(SupportStatus.APPROVED, okRes.getStatus());

        RespondSupportRequest tryCashAction = RespondSupportRequest.builder()
                .status(SupportStatus.APPROVED)
                .resolutionType("CASH_REFUND")
                .responseNote("Duyệt hoàn tiền mặt.")
                .build();

        IllegalStateException cashTicketEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(95, approveCredit, "reception@gym.vn")
        );
        assertTrue(cashTicketEx.getMessage().contains("hoàn tiền mặt"));

        creditRequest.setStatus(SupportStatus.PENDING);
        IllegalStateException cashActionEx = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.respondToRequest(94, tryCashAction, "reception@gym.vn")
        );
        assertTrue(cashActionEx.getMessage().contains("hoàn tiền mặt"));
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
    void createSupportRequestBlocksCancellationOverEightyPercent() {
        User member = User.builder().userId(7).email("oanh@gym.vn").fullName("Nguyễn Kiều Oanh").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime now = LocalDateTime.now();

        when(userRepository.findByEmail("oanh@gym.vn")).thenReturn(Optional.of(member));
        when(coachClassRepository.findById(2)).thenReturn(Optional.of(yoga));
        when(bookingRepository.findAllBookingsByEmail("oanh@gym.vn"))
                .thenReturn(buildBookings(member, yoga, now, 5, 0, false));
        when(supportRequestRepository.findByUserUserIdOrderByCreatedAtDesc(7)).thenReturn(List.of());

        CreateSupportRequest createDto = CreateSupportRequest.builder()
                .classId(2)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .title("Xin hủy lớp [YOGA-102]")
                .content("Chuyển ca làm")
                .build();

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> supportRequestService.createSupportRequest(createDto, "oanh@gym.vn")
        );
        assertTrue(ex.getMessage().contains("80%"));
        verify(supportRequestRepository, never()).save(any());
    }

    @Test
    void createdAtCutoffProtectsEligibleTicketAndAutoRejectsIfAttendedPastLimit() {
        User member = User.builder().userId(7).email("oanh@gym.vn").fullName("Nguyễn Kiều Oanh").build();
        GymClass yoga = GymClass.builder().classId(2).className("[YOGA-102]").price(new BigDecimal("750000")).build();
        LocalDateTime submittedAt = LocalDateTime.now().minusDays(2);

        // 4 sessions before submittedAt + 1 session between submittedAt and now (yesterday)
        java.util.ArrayList<Booking> notYetOn5th = new java.util.ArrayList<>();
        for (int i = 0; i < 4; i++) {
            Schedule s = Schedule.builder().scheduleId(i + 1).gymClass(yoga)
                    .startTime(submittedAt.minusDays(4 - i)).endTime(submittedAt.minusDays(4 - i).plusHours(1)).build();
            notYetOn5th.add(Booking.builder().bookingId(i + 1).user(member).schedule(s)
                    .status("CONFIRMED").attendanceStatus("PRESENT").build());
        }
        Schedule elapsedAfterSubmit = Schedule.builder().scheduleId(5).gymClass(yoga)
                .startTime(LocalDateTime.now().minusHours(2)).endTime(LocalDateTime.now().minusHours(1)).build();
        notYetOn5th.add(Booking.builder().bookingId(5).user(member).schedule(elapsedAfterSubmit)
                .status("CONFIRMED").attendanceStatus("NOT_YET").build());

        SupportRequest ticket = SupportRequest.builder()
                .requestId(94)
                .user(member)
                .gymClass(yoga)
                .category(SupportCategory.CLASS_CANCELLATION)
                .preferredResolution("ISSUE_CREDIT")
                .status(SupportStatus.PENDING)
                .priority(SupportPriority.HIGH)
                .title("Xin hủy lớp [YOGA-102]")
                .createdAt(submittedAt)
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        when(supportRequestRepository.findByCategoryInAndStatusIn(any(), any())).thenReturn(List.of(ticket));
        when(supportRequestRepository.searchSupportRequests(any(), any(), any(), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(ticket), pageable, 1));
        when(userCreditRepository.findBySupportRequestRequestId(94)).thenReturn(Optional.empty());
        when(bookingRepository.findAllBookingsByEmail("oanh@gym.vn")).thenReturn(notYetOn5th);

        // Subcase 1: Member waited in queue & did NOT check in 5th session -> stays 4/5 (80%) PENDING & eligible for 150k
        Page<SupportRequestResponse> page = supportRequestService.searchRequestsForStaff(null, null, null, pageable);
        SupportRequestResponse res = page.getContent().get(0);
        assertEquals(SupportStatus.PENDING, res.getStatus());
        assertEquals(4, res.getAttendedSessions());
        assertEquals(new BigDecimal("150000"), res.getCalculatedCreditAmount());

        // Subcase 2: Member checked in PRESENT on 5th session -> exceeds 80%, auto-rejected cleanly (no longer PENDING)
        notYetOn5th.get(4).setAttendanceStatus("PRESENT");
        when(supportRequestRepository.save(any(SupportRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        Page<SupportRequestResponse> pageAfterAttendance = supportRequestService.searchRequestsForStaff(null, null, null, pageable);
        SupportRequestResponse rejectedRes = pageAfterAttendance.getContent().get(0);
        assertEquals(SupportStatus.REJECTED, rejectedRes.getStatus());
        assertEquals(5, rejectedRes.getAttendedSessions());
        assertEquals(BigDecimal.ZERO, rejectedRes.getCalculatedCreditAmount());
        verify(notificationRepository).save(any(Notification.class));
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

        CreateSupportRequest createDto = CreateSupportRequest.builder()
                .category(SupportCategory.FACILITY_ISSUE)
                .title("[Sự cố CSVC] Máy chạy bộ số 3 bị kẹt băng tải")
                .content("Cần kỹ thuật viên kiểm tra an toàn trước giờ cao điểm.")
                .build();

        SupportRequestResponse response = supportRequestService.createSupportRequest(createDto, "member@gym.vn");

        assertEquals(SupportStatus.ESCALATED, response.getStatus());
        assertEquals(SupportPriority.HIGH, response.getPriority());

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
}
