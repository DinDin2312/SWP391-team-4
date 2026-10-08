package com.team4.sportscenter;

import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.*;
import com.team4.sportscenter.modules.manager.repositories.ManagerRepository;
import com.team4.sportscenter.modules.manager.services.ManagerService;
import com.team4.sportscenter.security.jwt.JwtService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/** Uses the configured MySQL database. Fixtures are isolated by unique IDs and removed after every test. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ManagerIntegrationTests {
    @Autowired ManagerService service;
    @Autowired ManagerRepository repository;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Value("${local.server.port}") int port;
    String actor;
    int admin, coach, member, subject, room, course;
    List<Integer> userIds = new ArrayList<>(), classIds = new ArrayList<>();
    LocalDateTime start = LocalDateTime.of(2040, 6, 1, 9, 0);

    int role(String name) { return jdbc.queryForObject("SELECT role_id FROM ROLES WHERE role_name=?", Integer.class, name); }
    int user(String name, String role) {
        int id = service.createUser(new UserRequest(name, name + actor, null, "qa123456", role(role), "ACTIVE"), actor);
        userIds.add(id);
        return id;
    }

    @BeforeEach void fixtures() {
        actor = "-qa-" + UUID.randomUUID() + "@example.test";
        admin = user("admin", "Center Manager");
        coach = user("coach", "Coach");
        member = user("member", "Member");
        subject = service.saveSubject(null, new SubjectRequest("QA " + actor, "Integration fixture"), actor);
        room = service.saveRoom(null, new RoomRequest("QA " + actor, 10), actor);
        course = newClass("QA class", 5);
    }

    int newClass(String name, int slots) {
        int id = service.saveClass(null, classRequest(name, slots, "ACTIVE"), actor);
        classIds.add(id);
        return id;
    }
    ClassRequest classRequest(String name, int slots, String status) {
        return new ClassRequest(name, subject, coach, room, new BigDecimal("100000"), slots, status);
    }
    int schedule(LocalDateTime time) {
        return service.saveSchedule(null, new ScheduleRequest(course, time, time.plusHours(1), "SCHEDULED"), actor);
    }
    void booking(int schedule, String status) {
        jdbc.update("INSERT INTO BOOKINGS(user_id,schedule_id,status,attendance_status,booking_time) VALUES (?,?,?,'NOT_YET',NOW())", member, schedule, status);
    }
    int count(String sql, Object... args) { return jdbc.queryForObject(sql, Integer.class, args); }
    String token(int userId) { return jwt.generateToken(users.findById(userId).orElseThrow()); }
    HttpResponse<String> request(String method, String path, String token, String body) throws Exception {
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json");
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return HttpClient.newHttpClient().send(builder.method(method,
                body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body)).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    @AfterEach void cleanup() {
        for (Integer id : userIds) jdbc.update("DELETE FROM NOTIFICATIONS WHERE user_id=?", id);
        for (Integer id : classIds) {
            jdbc.update("DELETE b FROM BOOKINGS b JOIN SCHEDULES s ON s.schedule_id=b.schedule_id WHERE s.class_id=?", id);
            jdbc.update("DELETE FROM SCHEDULES WHERE class_id=?", id);
            jdbc.update("DELETE FROM CLASSES WHERE class_id=?", id);
        }
        jdbc.update("DELETE FROM ROOMS WHERE room_id=?", room);
        jdbc.update("DELETE FROM SUBJECTS WHERE subject_id=?", subject);
        for (Integer id : userIds) jdbc.update("DELETE FROM USERS WHERE user_id=?", id);
        jdbc.update("DELETE FROM AUDIT_LOGS WHERE actor_email=? OR actor_email=?", actor, "admin" + actor);
    }

    @Test void overviewDoesNotCapTotalsOrDropUrgentItemsAndFiltersMatch() {
        LocalDateTime now = LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        java.time.LocalDate today = now.toLocalDate();
        for(int i=0;i<10;i++) {
            LocalDateTime urgent = now.plusMinutes(10+i*10);
            jdbc.update("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,'SCHEDULED')",course,urgent,urgent.plusHours(1));
            LocalDateTime later = today.plusDays(2).atTime(8,0).plusMinutes(i*10);
            jdbc.update("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,'SCHEDULED')",course,later,later.plusHours(1));
        }
        Map<String,Object> overview = service.dashboard();
        List<Map<String,Object>> urgentRows = (List<Map<String,Object>>) overview.get("urgentSessions");
        assertEquals(10,urgentRows.stream().filter(r -> ((Number)r.get("classId")).intValue()==course).count());
        assertTrue(((Number)overview.get("urgentCount")).intValue()>=10);
        assertEquals(10,repository.filteredSchedules(today,today.plusDays(7),true,"SCHEDULED",false).stream().filter(r -> ((Number)r.get("classId")).intValue()==course && ((LocalDateTime)r.get("startTime")).toLocalDate().equals(today.plusDays(2))).count());
        Map<String,Object> attention = (Map<String,Object>) overview.get("attentionPage");
        assertTrue(((Number)attention.get("total")).intValue()>=10);
        assertEquals(6,((List<?>)attention.get("items")).size());
        assertEquals(((Number)attention.get("total")).intValue(),repository.filteredSchedules(today.plusDays(1),today.plusDays(7),true,"SCHEDULED",true).size());
        assertEquals(((Number)overview.get("lowRegistrationSessions")).intValue(),repository.filteredSchedules(today,today.plusDays(7),true,"SCHEDULED",false).size());
        assertTrue(((List<?>)repository.attentionPage(1,6).get("items")).size()>0);
        Integer packageId=jdbc.queryForObject("SELECT MIN(package_id) FROM PACKAGES",Integer.class);
        try {
            for(int i=0;i<10;i++) jdbc.update("INSERT INTO USER_MEMBERSHIPS(user_id,package_id,start_date,end_date,status) VALUES (?,?,?,?,'ACTIVE')",member,packageId,today,today.plusDays(3));
            assertTrue(((Number)repository.renewalPage(0,6).get("total")).intValue()>=10);
            assertEquals(6,((List<?>)repository.renewalPage(0,6).get("items")).size());
            assertTrue(((List<?>)repository.renewalPage(1,6).get("items")).size()>0);
        } finally { jdbc.update("DELETE FROM USER_MEMBERSHIPS WHERE user_id=?",member); }
    }

    @Test void operationalOverviewCountsBookingsAndExpiryBoundaries() {
        int lowBefore = ((Number) repository.dashboard().get("lowRegistrationSessions")).intValue();
        int todayBefore = ((Number) repository.dashboard().get("sessionsToday")).intValue();
        int expiryBefore = ((Number) repository.dashboard().get("expiringMemberships")).intValue();
        jdbc.update("UPDATE CLASSES SET max_slots=4 WHERE class_id=?", course);
        jdbc.update("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,DATE_ADD(CURDATE(),INTERVAL 1 DAY),DATE_ADD(CURDATE(),INTERVAL 25 HOUR),'SCHEDULED')", course);
        int upcoming = jdbc.queryForObject("SELECT schedule_id FROM SCHEDULES WHERE class_id=?", Integer.class, course);
        assertEquals(lowBefore + 1, ((Number) repository.dashboard().get("lowRegistrationSessions")).intValue());
        booking(upcoming, "PENDING");
        assertEquals(lowBefore, ((Number) repository.dashboard().get("lowRegistrationSessions")).intValue(), "Exactly 25% is not low; pending bookings reserve seats");
        jdbc.update("UPDATE BOOKINGS SET status='CANCELLED' WHERE schedule_id=?", upcoming);
        assertEquals(lowBefore + 1, ((Number) repository.dashboard().get("lowRegistrationSessions")).intValue());
        jdbc.update("UPDATE SCHEDULES SET status='CANCELLED' WHERE schedule_id=?", upcoming);
        assertEquals(lowBefore, ((Number) repository.dashboard().get("lowRegistrationSessions")).intValue());
        jdbc.update("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 1 HOUR),'COMPLETED')", course);
        assertEquals(todayBefore + 1, ((Number) repository.dashboard().get("sessionsToday")).intValue());
        jdbc.update("UPDATE SCHEDULES SET status='CANCELLED' WHERE class_id=?", course);
        assertEquals(todayBefore, ((Number) repository.dashboard().get("sessionsToday")).intValue());
        Integer packageId = jdbc.queryForObject("SELECT MIN(package_id) FROM PACKAGES", Integer.class);
        assertNotNull(packageId);
        try {
            jdbc.update("INSERT INTO USER_MEMBERSHIPS(user_id,package_id,start_date,end_date,status) VALUES (?,?,CURDATE(),DATE_ADD(CURDATE(),INTERVAL 7 DAY),'ACTIVE')", member, packageId);
            assertEquals(expiryBefore + 1, ((Number) repository.dashboard().get("expiringMemberships")).intValue());
            jdbc.update("UPDATE USER_MEMBERSHIPS SET end_date=DATE_ADD(CURDATE(),INTERVAL 8 DAY) WHERE user_id=?", member);
            assertEquals(expiryBefore, ((Number) repository.dashboard().get("expiringMemberships")).intValue());
            Map<String, Object> overview = service.dashboard();
            for (String key : List.of("lowRegistrationList", "expiringMembershipList")) {
                assertTrue(((List<?>) overview.get(key)).size() <= 6);
            }
        } finally {
            jdbc.update("DELETE FROM USER_MEMBERSHIPS WHERE user_id=?", member);
        }
    }

    @Test void overviewPagesRequireManagerAccessAndValidateFilters() throws Exception {
        String adminToken = token(admin);
        String memberToken = token(member);
        for (String block : List.of("attention", "renewals")) {
            String path = "/api/manager/dashboard/" + block;
            assertEquals(401, request("GET", path, null, null).statusCode());
            assertEquals(403, request("GET", path, memberToken, null).statusCode());
            assertEquals(200, request("GET", path + "?page=0&size=1", adminToken, null).statusCode());
            assertEquals(400, request("GET", path + "?page=-1", adminToken, null).statusCode());
            assertEquals(400, request("GET", path + "?size=51", adminToken, null).statusCode());
        }
        assertThrows(IllegalArgumentException.class, () -> service.overviewPage("attention", 0, 0));
        assertThrows(IllegalArgumentException.class, () -> service.overviewPage("renewals", 100001, 6));
        String dates = "?from=2040-06-01&to=2040-06-07";
        assertEquals(400, request("GET", "/api/manager/schedules" + dates + "&status=INVALID", adminToken, null).statusCode());
        assertEquals(400, request("GET", "/api/manager/schedules?from=2040-06-07&to=2040-06-01&lowRegistration=true", adminToken, null).statusCode());
    }

    @Test void onlyManagerCanAccessAndLockRevokesExistingToken() throws Exception {
        assertEquals(401, request("GET", "/api/manager/dashboard", null, null).statusCode());
        assertEquals(403, request("GET", "/api/manager/dashboard", token(member), null).statusCode());
        assertEquals(401, request("GET", "/api/receptionist/members", null, null).statusCode());
        String token = token(admin);
        assertEquals(200, request("GET", "/api/manager/dashboard", token, null).statusCode());
        service.updateUserStatus(admin, new UserStatusRequest("INACTIVE", "Security review"), actor);
        assertEquals(401, request("GET", "/api/manager/dashboard", token, null).statusCode());
        assertEquals(1, count("SELECT COUNT(*) FROM AUDIT_LOGS WHERE entity_type='USER' AND entity_id=? AND details LIKE '%Security review%'", admin));
    }

    @Test void emptyPasswordKeepsExistingPasswordAndValidationIsReadable() throws Exception {
        String before = users.findById(member).orElseThrow().getPasswordHash();
        String body = "{\"fullName\":\"Updated\",\"email\":\"member" + actor + "\",\"roleId\":" + role("Member")
                + ",\"status\":\"ACTIVE\",\"password\":\"\"}";
        assertEquals(204, request("PUT", "/api/manager/users/" + member, token(admin), body).statusCode());
        assertEquals(before, users.findById(member).orElseThrow().getPasswordHash());
        var response = request("POST", "/api/manager/rooms", token(admin), "{\"roomName\":\"\",\"capacity\":0}");
        assertEquals(400, response.statusCode());
        assertTrue(response.body().contains("errors"));
        assertFalse(response.body().contains("SQL"));
    }

    @Test void unknownUpdatesReturnNotFound() throws Exception {
        assertEquals(404, request("PUT", "/api/manager/rooms/2147483647", token(admin), "{\"roomName\":\"Missing\",\"capacity\":10}").statusCode());
        assertEquals(404, request("GET", "/api/manager/schedules/2147483647/bookings", token(admin), null).statusCode());
    }

    @Test void selfLockAndAssignedCoachDemotionAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.updateUserStatus(admin, new UserStatusRequest("INACTIVE", "Self lock"), "admin" + actor));
        assertThrows(IllegalArgumentException.class, () -> service.updateUserStatus(coach, new UserStatusRequest("INACTIVE", "Assigned coach"), actor));
        assertThrows(IllegalArgumentException.class, () -> service.updateUser(coach,
                new UserRequest("coach", "coach" + actor, null, "", role("Member"), "ACTIVE"), actor));
    }

    @Test void roomAndClassCapacityCannotInvalidateBookings() {
        assertThrows(IllegalArgumentException.class, () -> service.saveRoom(room, new RoomRequest("QA", 4), actor));
        int id = schedule(start);
        booking(id, "CONFIRMED");
        int member2 = user("member2", "Member");
        jdbc.update("INSERT INTO BOOKINGS(user_id,schedule_id,status) VALUES (?,?,'PENDING')", member2, id);
        assertThrows(IllegalArgumentException.class, () -> service.saveClass(course, classRequest("QA", 1, "ACTIVE"), actor));
        assertThrows(IllegalArgumentException.class, () -> service.saveClass(course, classRequest("QA", 5, "INACTIVE"), actor));
    }

    @Test void overlappingSchedulesFailButAdjacentSchedulesSucceed() {
        schedule(start);
        assertThrows(IllegalArgumentException.class, () -> schedule(start.plusMinutes(30)));
        assertDoesNotThrow(() -> schedule(start.plusHours(1)));
        assertThrows(IllegalArgumentException.class, () -> schedule(LocalDateTime.now().minusDays(1)));
    }

    @Test void recurringSchedulesRollbackAllInsertsAndAuditOnConflict() {
        schedule(start.plusWeeks(1));
        int before = count("SELECT COUNT(*) FROM AUDIT_LOGS WHERE actor_email=?", actor);
        assertThrows(IllegalArgumentException.class, () -> service.createScheduleSeries(
                new ScheduleSeriesRequest(course, start, start.plusHours(1), 3, 1), actor));
        assertEquals(1, count("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=?", course));
        assertEquals(before, count("SELECT COUNT(*) FROM AUDIT_LOGS WHERE actor_email=?", actor));
    }

    @Test void recurringSchedulesKeepLocalTimeAndPersistEveryOccurrence() {
        var ids = service.createScheduleSeries(new ScheduleSeriesRequest(course, start, start.plusHours(1), 3, 2), actor);
        assertEquals(3, ids.size());
        assertEquals(start.plusWeeks(4), repository.schedule(ids.get(2)).get("startTime"));
        var rows = service.schedules(start.toLocalDate(), start.plusWeeks(4).toLocalDate());
        assertTrue(rows.stream().anyMatch(row -> ids.get(0).equals(row.get("scheduleId")) && start.equals(row.get("startTime"))));
    }

    @Test void cancellationUpdatesBookingsNotifiesOnceAndCannotReopen() {
        int id = schedule(start);
        booking(id, "CONFIRMED");
        var cancelled = new ScheduleRequest(course, start, start.plusHours(1), "CANCELLED");
        service.saveSchedule(id, cancelled, actor);
        assertEquals("CANCELLED", jdbc.queryForObject("SELECT status FROM BOOKINGS WHERE schedule_id=?", String.class, id));
        assertEquals(1, count("SELECT COUNT(*) FROM NOTIFICATIONS WHERE user_id=?", member));
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(id, cancelled, actor));
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(id, new ScheduleRequest(course, start, start.plusHours(1), "SCHEDULED"), actor));
        assertEquals(1, count("SELECT COUNT(*) FROM NOTIFICATIONS WHERE user_id=?", member));
    }

    @Test void bookedSessionCannotChangeClassOrConflictWithStudents() {
        int first = schedule(start), second = schedule(start.plusHours(2));
        booking(first, "CONFIRMED"); booking(second, "PENDING");
        int another = newClass("Other class", 5);
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(first,
                new ScheduleRequest(another, start, start.plusHours(1), "SCHEDULED"), actor));
        assertTrue(assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(first,
                new ScheduleRequest(course, start.plusHours(2), start.plusHours(3), "SCHEDULED"), actor)).getMessage().contains("registered student"));
        service.saveSchedule(first, new ScheduleRequest(course, start.plusDays(1), start.plusDays(1).plusHours(1), "SCHEDULED"), actor);
        assertEquals(1, count("SELECT COUNT(*) FROM NOTIFICATIONS WHERE user_id=?", member));
    }

    @Test void occupancyCountsSeatsAcrossSessionsAndExcludesCancelledSessions() {
        int first = schedule(start), second = schedule(start.plusDays(1)), cancelled = schedule(start.plusDays(2));
        booking(first, "CONFIRMED"); booking(second, "CONFIRMED"); booking(cancelled, "CONFIRMED");
        service.saveSchedule(cancelled, new ScheduleRequest(course, start.plusDays(2), start.plusDays(2).plusHours(1), "CANCELLED"), actor);
        var result = service.report(start.toLocalDate(), start.plusDays(2).toLocalDate());
        @SuppressWarnings("unchecked") var occupancy = (List<Map<String, Object>>) result.get("classOccupancy");
        var row = occupancy.stream().filter(value -> ((Number) value.get("classId")).intValue() == course).findFirst().orElseThrow();
        assertEquals(2, ((Number) row.get("value")).intValue());
        assertEquals(10, ((Number) row.get("capacity")).intValue());
        assertDoesNotThrow(() -> service.classes());
        assertDoesNotThrow(() -> service.packages());
    }

    @Test void cannotCompleteFutureSessionAndDateRangeIsBounded() {
        int id = schedule(start);
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(id, new ScheduleRequest(course, start, start.plusHours(1), "COMPLETED"), actor));
        assertThrows(IllegalArgumentException.class, () -> service.report(start.toLocalDate(), start.minusDays(1).toLocalDate()));
        assertThrows(IllegalArgumentException.class, () -> service.schedules(start.toLocalDate(), start.plusYears(2).toLocalDate()));
    }
}
