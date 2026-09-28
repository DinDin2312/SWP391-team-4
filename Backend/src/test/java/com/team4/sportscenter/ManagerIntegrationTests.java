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

    @Test void onlyManagerCanAccessAndLockRevokesExistingToken() throws Exception {
        assertEquals(401, request("GET", "/api/manager/dashboard", null, null).statusCode());
        assertEquals(403, request("GET", "/api/manager/dashboard", token(member), null).statusCode());
        assertEquals(401, request("GET", "/api/receptionist/members", null, null).statusCode());
        String token = token(admin);
        assertEquals(200, request("GET", "/api/manager/dashboard", token, null).statusCode());
        service.updateUserStatus(admin, new UserStatusRequest("INACTIVE"), actor);
        assertEquals(401, request("GET", "/api/manager/dashboard", token, null).statusCode());
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
        assertThrows(IllegalArgumentException.class, () -> service.updateUserStatus(admin, new UserStatusRequest("INACTIVE"), "admin" + actor));
        assertThrows(IllegalArgumentException.class, () -> service.updateUserStatus(coach, new UserStatusRequest("INACTIVE"), actor));
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
                new ScheduleRequest(course, start.plusHours(2), start.plusHours(3), "SCHEDULED"), actor)).getMessage().contains("học viên"));
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
