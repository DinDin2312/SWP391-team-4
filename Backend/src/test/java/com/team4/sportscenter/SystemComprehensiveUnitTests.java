package com.team4.sportscenter;

import com.team4.sportscenter.common.exception.GlobalExceptionHandler;
import com.team4.sportscenter.common.exception.PackageRuleException;
import com.team4.sportscenter.modules.auth.entities.Role;
import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.CreateTraineeAssessmentRequest;
import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachClassResponse;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.TraineeAssessment;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.TraineeAssessmentRepository;
import com.team4.sportscenter.modules.coach.services.impl.CoachAssessmentServiceImpl;
import com.team4.sportscenter.modules.coach.services.impl.CoachNotificationServiceImpl;
import com.team4.sportscenter.modules.manager.controllers.ManagerExceptionHandler;
import com.team4.sportscenter.modules.manager.services.PackageTypeCatalog;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Package;
import com.team4.sportscenter.modules.member.entities.Room;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.services.impl.BookingCleanupTask;
import com.team4.sportscenter.modules.notification.dtos.NotificationResponse;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import com.team4.sportscenter.modules.notification.services.impl.NotificationServiceImpl;
import com.team4.sportscenter.modules.payment.dtos.InvoiceResponse;
import com.team4.sportscenter.modules.payment.entities.Invoice;
import com.team4.sportscenter.modules.payment.entities.InvoiceDetail;
import com.team4.sportscenter.modules.payment.entities.PaymentEntity;
import com.team4.sportscenter.modules.payment.repositories.InvoiceDetailRepository;
import com.team4.sportscenter.modules.payment.repositories.InvoiceRepository;
import com.team4.sportscenter.modules.payment.repositories.PaymentRepository;
import com.team4.sportscenter.modules.payment.services.impl.InvoiceServiceImpl;
import com.team4.sportscenter.security.auth.UserDetailsServiceImpl;
import com.team4.sportscenter.security.jwt.JwtAuthenticationFilter;
import com.team4.sportscenter.security.jwt.JwtService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemComprehensiveUnitTests {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void jwtServiceAndAuthenticationFilterEnforceRoleAndStatusSecurity() throws Exception {
        JwtService jwtService = new JwtService();
        User activeUser = User.builder()
                .userId(7)
                .email("member@gym.vn")
                .fullName("Member One")
                .status("ACTIVE")
                .role(Role.builder().roleId(4).roleName("Member").build())
                .build();

        String token = jwtService.generateToken(activeUser);
        assertEquals("member@gym.vn", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, activeUser));

        User otherUser = User.builder()
                .userId(8)
                .email("other@gym.vn")
                .status("ACTIVE")
                .role(Role.builder().roleId(4).roleName("Member").build())
                .build();
        assertFalse(jwtService.isTokenValid(token, otherUser));

        UserRepository userRepo = mock(UserRepository.class);
        UserDetailsServiceImpl userDetailsService = new UserDetailsServiceImpl(userRepo);
        when(userRepo.findByEmail("member@gym.vn")).thenReturn(Optional.of(activeUser));
        when(userRepo.findByEmail("missing@gym.vn")).thenReturn(Optional.empty());

        assertEquals(activeUser, userDetailsService.loadUserByUsername("member@gym.vn"));
        assertThrows(UsernameNotFoundException.class, () -> userDetailsService.loadUserByUsername("missing@gym.vn"));

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, userDetailsService);
        FilterChain chain = mock(FilterChain.class);

        // 1. Request without Authorization header passes through unauthenticated
        MockHttpServletRequest reqNoHeader = new MockHttpServletRequest();
        MockHttpServletResponse res = new MockHttpServletResponse();
        filter.doFilter(reqNoHeader, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // 2. Request with non-Bearer header passes through unauthenticated
        MockHttpServletRequest reqBasic = new MockHttpServletRequest();
        reqBasic.addHeader("Authorization", "Basic abc");
        filter.doFilter(reqBasic, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // 3. Request with valid Bearer token authenticates active user
        MockHttpServletRequest reqValid = new MockHttpServletRequest();
        reqValid.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(reqValid, res, chain);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("member@gym.vn", SecurityContextHolder.getContext().getAuthentication().getName());

        // 4. Locked/disabled user is rejected by filter
        SecurityContextHolder.clearContext();
        User lockedUser = User.builder()
                .userId(7)
                .email("member@gym.vn")
                .status("LOCKED")
                .role(Role.builder().roleId(4).roleName("Member").build())
                .build();
        when(userRepo.findByEmail("member@gym.vn")).thenReturn(Optional.of(lockedUser));
        MockHttpServletRequest reqLocked = new MockHttpServletRequest();
        reqLocked.addHeader("Authorization", "Bearer " + token);
        filter.doFilter(reqLocked, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());

        // 5. Malformed token is caught safely without breaking filter chain
        MockHttpServletRequest reqMalformed = new MockHttpServletRequest();
        reqMalformed.addHeader("Authorization", "Bearer malformed.jwt.token");
        filter.doFilter(reqMalformed, res, chain);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void globalAndManagerExceptionHandlersFormatConsistentApiErrors() throws Exception {
        GlobalExceptionHandler global = new GlobalExceptionHandler();

        ResponseEntity<Map<String, String>> badCred = global.handleBadCredentialsException(new BadCredentialsException("bad"));
        assertEquals(HttpStatus.UNAUTHORIZED, badCred.getStatusCode());
        assertEquals("Invalid email or password.", badCred.getBody().get("message"));

        PackageRuleException pkgErr = new PackageRuleException("DUPLICATE_SUBJECT", "Duplicate subject in package");
        ResponseEntity<Map<String, String>> conflict = global.packageRule(pkgErr);
        assertEquals(HttpStatus.CONFLICT, conflict.getStatusCode());
        assertEquals("DUPLICATE_SUBJECT", conflict.getBody().get("code"));

        ResponseEntity<Map<String, String>> biz = global.handleBusinessException(new IllegalArgumentException("Invalid slot"));
        assertEquals(HttpStatus.BAD_REQUEST, biz.getStatusCode());
        assertEquals("Invalid slot", biz.getBody().get("message"));

        ResponseEntity<Map<String, String>> sys = global.handleException(new Exception("DB timeout"));
        assertEquals(HttpStatus.BAD_REQUEST, sys.getStatusCode());
        assertTrue(sys.getBody().get("message").contains("DB timeout"));

        ManagerExceptionHandler managerHandler = new ManagerExceptionHandler();
        Method validationMethod = ManagerExceptionHandler.class.getDeclaredMethod("validation", MethodArgumentNotValidException.class);
        validationMethod.setAccessible(true);
        Method businessMethod = ManagerExceptionHandler.class.getDeclaredMethod("business", IllegalArgumentException.class);
        businessMethod.setAccessible(true);
        Method missingMethod = ManagerExceptionHandler.class.getDeclaredMethod("missing");
        missingMethod.setAccessible(true);
        Method malformedMethod = ManagerExceptionHandler.class.getDeclaredMethod("malformed");
        malformedMethod.setAccessible(true);
        Method conflictMethod = ManagerExceptionHandler.class.getDeclaredMethod("conflict");
        conflictMethod.setAccessible(true);

        MethodArgumentNotValidException validEx = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        when(validEx.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(new FieldError("obj", "email", "Invalid email")));

        ResponseEntity<?> validRes = (ResponseEntity<?>) validationMethod.invoke(managerHandler, validEx);
        assertEquals(HttpStatus.BAD_REQUEST, validRes.getStatusCode());

        ResponseEntity<?> bizRes = (ResponseEntity<?>) businessMethod.invoke(managerHandler, new IllegalArgumentException("Bad input"));
        assertEquals(HttpStatus.BAD_REQUEST, bizRes.getStatusCode());

        ResponseEntity<?> missingRes = (ResponseEntity<?>) missingMethod.invoke(managerHandler);
        assertEquals(HttpStatus.NOT_FOUND, missingRes.getStatusCode());

        ResponseEntity<?> malformedRes = (ResponseEntity<?>) malformedMethod.invoke(managerHandler);
        assertEquals(HttpStatus.BAD_REQUEST, malformedRes.getStatusCode());

        ResponseEntity<?> conflictRes = (ResponseEntity<?>) conflictMethod.invoke(managerHandler);
        assertEquals(HttpStatus.CONFLICT, conflictRes.getStatusCode());
    }

    @Test
    void packageTypeCatalogValidatesSavesAndMapsPackageTypes() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        PackageTypeCatalog catalog = new PackageTypeCatalog(jdbc);

        when(jdbc.queryForList(anyString())).thenReturn(List.of(
                Map.of("typeCode", "GYM_ACCESS", "typeName", "Gym Access", "requiresSubjects", false)
        ));
        assertEquals(1, catalog.list().size());
        assertEquals("Gym Access", catalog.names().get("GYM_ACCESS"));

        when(jdbc.queryForList(anyString(), eq("GYM_ACCESS"))).thenReturn(List.of(
                Map.of("typeCode", "GYM_ACCESS", "typeName", "Gym Access", "requiresSubjects", false)
        ));
        assertEquals("GYM_ACCESS", catalog.require("GYM_ACCESS").get("typeCode"));

        when(jdbc.queryForList(anyString(), eq("MISSING"))).thenReturn(List.of());
        assertThrows(IllegalArgumentException.class, () -> catalog.require("MISSING"));

        assertThrows(IllegalArgumentException.class, () -> catalog.save(null, "   ", false));
        assertThrows(IllegalArgumentException.class, () -> catalog.save(null, "x".repeat(256), false));

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("Dup Name"), isNull())).thenReturn(1);
        assertThrows(IllegalArgumentException.class, () -> catalog.save(null, "Dup Name", false));

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("New Custom"), isNull())).thenReturn(0);
        String createdCode = catalog.save(null, "New Custom", true);
        assertTrue(createdCode.startsWith("CUSTOM_"));

        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq("Updated Gym"), eq("GYM_ACCESS"))).thenReturn(0);
        assertEquals("GYM_ACCESS", catalog.save("GYM_ACCESS", "Updated Gym", false));
    }

    @Test
    void notificationServiceAndBookingCleanupTaskCoordinateCrossModuleAlerts() {
        NotificationRepository notifRepo = mock(NotificationRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        NotificationServiceImpl notifService = new NotificationServiceImpl(notifRepo, userRepo);

        LocalDateTime now = LocalDateTime.now();
        when(notifRepo.findByUser_EmailOrderByCreatedAtDesc("member@gym.vn")).thenReturn(List.of(
                Notification.builder().id(1).title("Welcome").message("Hello").type("SYSTEM").isRead(false).createdAt(now).build()
        ));

        List<NotificationResponse> list = notifService.getMyNotifications("member@gym.vn");
        assertEquals(1, list.size());
        assertEquals("Welcome", list.get(0).getTitle());

        notifService.markAsRead(1, "member@gym.vn");
        verify(notifRepo).markAsReadByIdAndEmail(1, "member@gym.vn");

        notifService.markAllAsRead("member@gym.vn");
        verify(notifRepo).markAllAsReadByEmail("member@gym.vn");

        notifService.deleteNotification(1, "member@gym.vn");
        verify(notifRepo).deleteByIdAndEmail(1, "member@gym.vn");

        notifService.deleteAllNotifications("member@gym.vn");
        verify(notifRepo).deleteAllByEmail("member@gym.vn");

        User user = User.builder().userId(1).email("member@gym.vn").build();
        when(userRepo.findByEmail("member@gym.vn")).thenReturn(Optional.of(user));
        when(userRepo.findByEmail("ghost@gym.vn")).thenReturn(Optional.empty());

        notifService.createNotification("member@gym.vn", "Booked", "Confirmed", "BOOKING");
        notifService.createNotification("ghost@gym.vn", "Booked", "Confirmed", "BOOKING");
        verify(notifRepo, times(1)).save(any(Notification.class));

        BookingRepository bookingRepo = mock(BookingRepository.class);
        BookingCleanupTask cleanupTask = new BookingCleanupTask(bookingRepo, notifService);

        // Empty expired list
        when(bookingRepo.findExpiredPendingBookings(any(), any())).thenReturn(List.of());
        cleanupTask.cleanupExpiredBookings();

        // Non-empty expired list with named class and unknown class
        Booking b1 = Booking.builder()
                .bookingId(10)
                .user(user)
                .status("PENDING")
                .schedule(Schedule.builder().gymClass(GymClass.builder().className("Yoga Morning").build()).build())
                .build();
        Booking b2 = Booking.builder()
                .bookingId(11)
                .user(user)
                .status("PENDING")
                .schedule(null)
                .build();
        when(bookingRepo.findExpiredPendingBookings(any(), any())).thenReturn(List.of(b1, b2));
        cleanupTask.cleanupExpiredBookings();

        assertEquals("CANCELLED", b1.getStatus());
        assertEquals("CANCELLED", b2.getStatus());
        verify(bookingRepo, times(2)).save(any(Booking.class));
    }

    @Test
    void coachNotificationAndAssessmentServicesEnforceOwnershipAndNotifyTrainees() {
        CoachClassRepository classRepo = mock(CoachClassRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        NotificationRepository notifRepo = mock(NotificationRepository.class);
        CoachNotificationServiceImpl coachNotif = new CoachNotificationServiceImpl(classRepo, userRepo, notifRepo);

        User coach = User.builder().userId(2).email("coach@gym.vn").fullName("HLV Tuấn").build();
        User student = User.builder().userId(9).email("student@gym.vn").fullName("Học Viên A").phone("0909").build();
        GymClass c1 = GymClass.builder().classId(100).className("Gym T1").room(Room.builder().roomName("Floor 1").build()).maxSlots(30).coach(coach).build();
        GymClass c2 = GymClass.builder().classId(101).className("Outdoor").room(null).maxSlots(20).coach(null).build();

        when(classRepo.findClassesByCoachEmail("coach@gym.vn")).thenReturn(List.of(c1, c2));
        when(classRepo.findDistinctStudentsByClassIdAndCoachEmail(100, "coach@gym.vn")).thenReturn(List.of(student));
        when(classRepo.findDistinctStudentsByClassIdAndCoachEmail(101, "coach@gym.vn")).thenReturn(List.of());

        List<CoachClassResponse> classes = coachNotif.getCoachClasses("coach@gym.vn");
        assertEquals(2, classes.size());
        assertEquals("Floor 1", classes.get(0).getRoomName());
        assertEquals("N/A", classes.get(1).getRoomName());

        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(null, "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(SendCoachNotificationRequest.builder().title(" ").build(), "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(SendCoachNotificationRequest.builder().title("T").message(" ").build(), "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(SendCoachNotificationRequest.builder().title("T").message("M").targetType(" ").build(), "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(SendCoachNotificationRequest.builder().title("T").message("M").targetType("INVALID").build(), "coach@gym.vn"));

        // ALL target
        when(classRepo.findDistinctStudentsByCoachEmail("coach@gym.vn")).thenReturn(List.of());
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("ALL").build(), "coach@gym.vn"));

        when(classRepo.findDistinctStudentsByCoachEmail("coach@gym.vn")).thenReturn(List.of(student));
        when(userRepo.findByEmail("coach@gym.vn")).thenReturn(Optional.of(coach));
        Map<String, Object> allRes = coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("ALL").type("REMINDER").build(), "coach@gym.vn");
        assertEquals(1, allRes.get("sentCount"));

        // CLASS target validation & success
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("CLASS").build(), "coach@gym.vn"));
        when(classRepo.findById(101)).thenReturn(Optional.of(c2));
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("CLASS").classId(101).build(), "coach@gym.vn"));
        when(classRepo.findById(100)).thenReturn(Optional.of(c1));
        Map<String, Object> classRes = coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("CLASS").classId(100).build(), "coach@gym.vn");
        assertEquals(1, classRes.get("sentCount"));

        // INDIVIDUAL target validation & success
        assertThrows(RuntimeException.class, () -> coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("INDIVIDUAL").build(), "coach@gym.vn"));
        when(userRepo.findById(9)).thenReturn(Optional.of(student));
        Map<String, Object> indRes = coachNotif.sendNotification(
                SendCoachNotificationRequest.builder().title("T").message("M").targetType("INDIVIDUAL").recipientUserId(9).build(), "coach@gym.vn");
        assertEquals(1, indRes.get("sentCount"));

        // CoachAssessmentServiceImpl tests
        TraineeAssessmentRepository assessRepo = mock(TraineeAssessmentRepository.class);
        CoachScheduleRepository schedRepo = mock(CoachScheduleRepository.class);
        CoachWorkoutPlanRepository planRepo = mock(CoachWorkoutPlanRepository.class);
        BookingRepository bookingRepo = mock(BookingRepository.class);
        CoachAssessmentServiceImpl assessService = new CoachAssessmentServiceImpl(
                assessRepo, userRepo, classRepo, schedRepo, planRepo, bookingRepo, notifRepo);

        assertThrows(RuntimeException.class, () -> assessService.createAssessment(null, "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> assessService.createAssessment(CreateTraineeAssessmentRequest.builder().build(), "coach@gym.vn"));
        assertThrows(RuntimeException.class, () -> assessService.createAssessment(
                CreateTraineeAssessmentRequest.builder().studentUserId(9).feedbackNote(" ").build(), "coach@gym.vn"));

        Schedule sched = Schedule.builder().scheduleId(50).gymClass(c1).build();
        Booking booking = Booking.builder().bookingId(60).schedule(sched).build();
        CoachWorkoutPlan plan = CoachWorkoutPlan.builder().planId(70).title("Plan A").gymClass(c1).build();

        when(bookingRepo.findEnrolledSchedulesByEmailAndClassId("student@gym.vn", 100)).thenReturn(List.of(sched));
        when(bookingRepo.findAllBookingsByEmail("student@gym.vn")).thenReturn(List.of(booking));
        when(planRepo.findById(70)).thenReturn(Optional.of(plan));
        when(assessRepo.save(any(TraineeAssessment.class))).thenAnswer(inv -> {
            TraineeAssessment a = inv.getArgument(0);
            a.setAssessmentId(500);
            return a;
        });

        TraineeAssessmentResponse created = assessService.createAssessment(
                CreateTraineeAssessmentRequest.builder()
                        .studentUserId(9)
                        .classId(100)
                        .planId(70)
                        .weight(new BigDecimal("68.5"))
                        .height(new BigDecimal("172.0"))
                        .bodyFatPercentage(new BigDecimal("16.2"))
                        .muscleMass(new BigDecimal("32.1"))
                        .performanceRating(5)
                        .attendanceRating(5)
                        .feedbackNote("Great squat depth")
                        .recommendation("Increase protein")
                        .build(),
                "coach@gym.vn"
        );
        assertEquals(500, created.getAssessmentId());
        assertEquals("Đánh giá tiến độ buổi tập", created.getAssessmentTitle());
        assertEquals(100, created.getClassId());

        // Map assessment via booking and via workoutPlan branches
        TraineeAssessment viaBooking = TraineeAssessment.builder().assessmentId(501).booking(booking).build();
        assertEquals(100, CoachAssessmentServiceImpl.mapAssessmentToResponse(viaBooking).getClassId());
        TraineeAssessment viaPlan = TraineeAssessment.builder().assessmentId(502).workoutPlan(plan).build();
        assertEquals(100, CoachAssessmentServiceImpl.mapAssessmentToResponse(viaPlan).getClassId());

        when(assessRepo.findByCoachEmailAndUserIdOrderByCreatedAtDesc("coach@gym.vn", 9)).thenReturn(List.of(viaPlan));
        when(assessRepo.findByCoachEmailOrderByCreatedAtDesc("coach@gym.vn")).thenReturn(List.of(viaBooking));
        assertEquals(1, assessService.getCoachAssessments("coach@gym.vn", 9).size());
        assertEquals(1, assessService.getCoachAssessments("coach@gym.vn", null).size());
        assertEquals(1, assessService.getStudentAssessmentHistory(9, "coach@gym.vn").size());

        List<EnrolledStudentResponse> students = assessService.getStudentsByClassId(100, "coach@gym.vn");
        assertEquals(1, students.size());
        assertEquals("student@gym.vn", students.get(0).getEmail());

        TraineeAssessment owned = TraineeAssessment.builder().assessmentId(500).coach(coach).build();
        when(assessRepo.findById(500)).thenReturn(Optional.of(owned));
        assertThrows(RuntimeException.class, () -> assessService.deleteAssessment(500, "intruder@gym.vn"));
        assessService.deleteAssessment(500, "coach@gym.vn");
        verify(assessRepo).delete(owned);
    }

    @Test
    void invoiceServiceMapsClassPackageAndScheduleLineItemsWithPaymentStatus() {
        InvoiceRepository invRepo = mock(InvoiceRepository.class);
        InvoiceDetailRepository detailRepo = mock(InvoiceDetailRepository.class);
        PaymentRepository payRepo = mock(PaymentRepository.class);
        InvoiceServiceImpl service = new InvoiceServiceImpl(invRepo, detailRepo, payRepo);

        LocalDateTime now = LocalDateTime.now();
        Invoice inv1 = Invoice.builder().invoiceId(1).totalAmount(new BigDecimal("1500000")).status("PAID").createdAt(now).build();
        Invoice inv2 = Invoice.builder().invoiceId(2).totalAmount(new BigDecimal("500000")).status("PENDING").createdAt(now).build();

        when(invRepo.findByUser_EmailOrderByCreatedAtDesc("member@gym.vn")).thenReturn(List.of(inv1, inv2));

        InvoiceDetail dClass = InvoiceDetail.builder()
                .gymClass(GymClass.builder().className("Zumba T3").build())
                .unitPrice(new BigDecimal("500000"))
                .build();
        InvoiceDetail dPkg = InvoiceDetail.builder()
                .aPackage(Package.builder().packageName("VIP 6M").build())
                .unitPrice(new BigDecimal("1000000"))
                .build();
        InvoiceDetail dSchedWithClass = InvoiceDetail.builder()
                .schedule(Schedule.builder().gymClass(GymClass.builder().className("Spinning").build()).build())
                .unitPrice(new BigDecimal("250000"))
                .build();
        InvoiceDetail dSchedNoClass = InvoiceDetail.builder()
                .schedule(Schedule.builder().gymClass(null).build())
                .unitPrice(new BigDecimal("250000"))
                .build();
        InvoiceDetail dUnknown = InvoiceDetail.builder().unitPrice(BigDecimal.ZERO).build();

        when(detailRepo.findByInvoice_InvoiceId(1)).thenReturn(List.of(dClass, dPkg));
        when(detailRepo.findByInvoice_InvoiceId(2)).thenReturn(List.of(dSchedWithClass, dSchedNoClass, dUnknown));

        PaymentEntity payment = PaymentEntity.builder()
                .paymentMethod("SEPAY")
                .transactionNo("TXN-999")
                .paymentDate(now)
                .build();
        when(payRepo.findByInvoice_InvoiceId(1)).thenReturn(Optional.of(payment));
        when(payRepo.findByInvoice_InvoiceId(2)).thenReturn(Optional.empty());

        List<InvoiceResponse> responses = service.getMyInvoices("member@gym.vn");
        assertEquals(2, responses.size());
        assertEquals("SEPAY", responses.get(0).getPaymentMethod());
        assertEquals("CLASS", responses.get(0).getDetails().get(0).getItemType());
        assertEquals("PACKAGE", responses.get(0).getDetails().get(1).getItemType());

        assertEquals("N/A", responses.get(1).getPaymentMethod());
        assertEquals("Spinning (Schedule)", responses.get(1).getDetails().get(0).getItemName());
        assertEquals("Class Booking", responses.get(1).getDetails().get(1).getItemName());
        assertEquals("UNKNOWN", responses.get(1).getDetails().get(2).getItemType());
    }

    @Test
    void paymentServiceCancelsPendingInvoicesAndReleasesLockOnRetry() {
        BookingRepository bookingRepo = mock(BookingRepository.class);
        com.team4.sportscenter.modules.member.repositories.UserMembershipRepository membershipRepo = mock(com.team4.sportscenter.modules.member.repositories.UserMembershipRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        InvoiceRepository invoiceRepo = mock(InvoiceRepository.class);
        InvoiceDetailRepository detailRepo = mock(InvoiceDetailRepository.class);
        PaymentRepository paymentRepo = mock(PaymentRepository.class);
        com.team4.sportscenter.config.VNPayConfig vnPay = mock(com.team4.sportscenter.config.VNPayConfig.class);
        com.team4.sportscenter.config.PayOSConfig payOS = mock(com.team4.sportscenter.config.PayOSConfig.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        com.team4.sportscenter.modules.member.services.PackageCommerceService commerce = mock(com.team4.sportscenter.modules.member.services.PackageCommerceService.class);
        com.team4.sportscenter.modules.notification.services.NotificationService notifService = mock(com.team4.sportscenter.modules.notification.services.NotificationService.class);
        PackageTypeCatalog pkgTypes = mock(PackageTypeCatalog.class);
        com.team4.sportscenter.modules.support.repositories.UserCreditRepository creditRepo = mock(com.team4.sportscenter.modules.support.repositories.UserCreditRepository.class);

        com.team4.sportscenter.modules.payment.services.impl.PaymentServiceImpl paymentService = new com.team4.sportscenter.modules.payment.services.impl.PaymentServiceImpl(
            bookingRepo, membershipRepo, userRepo, invoiceRepo, detailRepo, paymentRepo,
            vnPay, payOS, jdbc, commerce, notifService, pkgTypes, creditRepo
        );

        User user = User.builder().userId(10).email("member@gym.vn").build();
        when(userRepo.findByEmail("member@gym.vn")).thenReturn(Optional.of(user));
        when(jdbc.queryForList(anyString(), eq(Integer.class), eq(10))).thenReturn(List.of(99));

        paymentService.cancelPendingCheckout("member@gym.vn");

        verify(jdbc).update(contains("UPDATE INVOICES SET status='CANCELLED'"), eq(99));
        verify(jdbc).update(contains("UPDATE PAYMENTS SET status='CANCELLED'"), eq(99));
    }

    @Test
    void userControllerUploadsAndDeletesAvatarSuccessfully() {
        UserRepository userRepo = mock(UserRepository.class);
        com.team4.sportscenter.modules.auth.services.UserService userService = mock(com.team4.sportscenter.modules.auth.services.UserService.class);
        com.team4.sportscenter.modules.notification.services.NotificationService notifService = mock(com.team4.sportscenter.modules.notification.services.NotificationService.class);
        com.team4.sportscenter.modules.manager.services.AvatarStorageService avatarStorage = mock(com.team4.sportscenter.modules.manager.services.AvatarStorageService.class);

        com.team4.sportscenter.modules.auth.controllers.UserController controller = new com.team4.sportscenter.modules.auth.controllers.UserController(
            userRepo, userService, notifService, avatarStorage
        );

        User user = User.builder().userId(1).email("test@gym.vn").fullName("Test User").avatarPath("old.png").build();
        when(userRepo.findByEmail("test@gym.vn")).thenReturn(Optional.of(user));
        org.springframework.security.core.Authentication auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.getName()).thenReturn("test@gym.vn");

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(avatarStorage.store(mockFile)).thenReturn("new-uuid.png");

        // Test Upload
        org.springframework.http.ResponseEntity<?> uploadRes = controller.uploadAvatar(auth, mockFile);
        assertEquals(200, uploadRes.getStatusCode().value());
        assertEquals("new-uuid.png", user.getAvatarPath());
        verify(avatarStorage).delete("old.png");
        verify(userRepo).save(user);

        // Test Delete
        org.springframework.http.ResponseEntity<?> deleteRes = controller.deleteAvatar(auth);
        assertEquals(200, deleteRes.getStatusCode().value());
        assertNull(user.getAvatarPath());
        verify(avatarStorage).delete("new-uuid.png");
    }

}
