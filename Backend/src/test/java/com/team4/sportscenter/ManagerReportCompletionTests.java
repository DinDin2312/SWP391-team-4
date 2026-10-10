package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.repositories.ManagerRepository;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@Transactional
class ManagerReportCompletionTests {
    @Autowired ManagerRepository reports;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Value("${local.server.port}") int port;

    @Test void memberDatesAndBookingDatesUseInclusiveRangeAndActualRoles() {
        int memberRole=jdbc.queryForObject("SELECT role_id FROM ROLES WHERE role_name='Member'",Integer.class);
        int coachRole=jdbc.queryForObject("SELECT role_id FROM ROLES WHERE role_name='Coach'",Integer.class);
        int unknownBefore=jdbc.queryForObject("SELECT COUNT(*) FROM USERS WHERE role_id=? AND created_at IS NULL",Integer.class,memberRole);
        for(String date:List.of("2047-03-01 00:00:00","2047-03-03 23:59:59","2047-03-04 00:00:00")) {
            jdbc.update("INSERT INTO USERS(role_id,full_name,email,status,force_password_change,created_at) VALUES(?,'Report fixture',?,'ACTIVE',false,?)",memberRole,UUID.randomUUID()+"@test.invalid",date);
        }
        jdbc.update("INSERT INTO USERS(role_id,full_name,email,status,force_password_change,created_at) VALUES(?,'Unknown date',?,'ACTIVE',false,NULL)",memberRole,UUID.randomUUID()+"@test.invalid");
        jdbc.update("INSERT INTO USERS(role_id,full_name,email,status,force_password_change,created_at) VALUES(?,'Coach fixture',?,'ACTIVE',false,'2047-03-02 12:00:00')",coachRole,UUID.randomUUID()+"@test.invalid");
        int schedule=jdbc.queryForObject("SELECT schedule_id FROM SCHEDULES LIMIT 1",Integer.class);
        for(String status:List.of("PENDING","CONFIRMED","CANCELLED")) jdbc.update("INSERT INTO BOOKINGS(schedule_id,status,booking_time) VALUES(?,?,'2047-03-03 23:59:59')",schedule,status);
        jdbc.update("INSERT INTO BOOKINGS(schedule_id,status,booking_time) VALUES(?,'CONFIRMED','2047-03-04 00:00:00')",schedule);
        var result=reports.report(LocalDate.of(2047,3,1),LocalDate.of(2047,3,3));
        var growth=(Map<?,?>)result.get("memberGrowth");
        assertEquals(2,((Number)growth.get("newMembers")).intValue());
        assertEquals(unknownBefore+1,((Number)growth.get("unknownCreationDates")).intValue());
        var statuses=(List<Map<String,Object>>)result.get("bookingStatuses");
        assertEquals(3,statuses.size());
        assertTrue(statuses.stream().allMatch(row->((Number)row.get("value")).intValue()==1));
        jdbc.update("INSERT INTO USERS(role_id,full_name,email,status,force_password_change) VALUES(?,'New default date',?,'ACTIVE',false)",memberRole,UUID.randomUUID()+"@test.invalid");
        assertNotNull(jdbc.queryForObject("SELECT created_at FROM USERS WHERE user_id=LAST_INSERT_ID()",java.sql.Timestamp.class));
    }

    @Test void everyManagerReadSurfaceRejectsOtherRoles() throws Exception {
        var paths=List.of("/api/manager/users","/api/manager/classes","/api/manager/packages","/api/manager/audit-logs","/api/manager/reports?from=2047-03-01&to=2047-03-03");
        for(String role:List.of("Member","Coach","Receptionist","Center Manager")) {
            int id=jdbc.queryForObject("SELECT u.user_id FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name=? AND u.status='ACTIVE' LIMIT 1",Integer.class,role);
            String token=jwt.generateToken(users.findById(id).orElseThrow());
            for(String path:paths) assertEquals(role.equals("Center Manager")?200:403,get(path,token),role+" "+path);
        }
        for(String path:paths) assertTrue(Set.of(401,403).contains(get(path,null)));
    }
    int get(String path,String token)throws Exception {
        var request=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path));
        if(token!=null)request.header("Authorization","Bearer "+token);
        return HttpClient.newHttpClient().send(request.GET().build(),HttpResponse.BodyHandlers.discarding()).statusCode();
    }
}
