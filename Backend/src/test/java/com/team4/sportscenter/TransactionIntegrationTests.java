package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.TransactionService;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@Transactional
class TransactionIntegrationTests {
    @Autowired TransactionService ledger;
    @Autowired com.team4.sportscenter.modules.manager.repositories.ManagerRepository reports;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Value("${local.server.port}") int port;
    @Test void invoiceAndAttemptsAreSeparateSearchableAndPaginated() {
        String tag="ledger-"+UUID.randomUUID();
        jdbc.update("INSERT INTO INVOICES(user_id,total_amount,status,created_at) VALUES(NULL,100000,'PAID','2043-02-01 10:00:00')");
        int id=jdbc.queryForObject("SELECT LAST_INSERT_ID()",Integer.class);
        jdbc.update("INSERT INTO INVOICE_DETAILS(invoice_id,unit_price) VALUES(?,100000)",id);
        jdbc.update("INSERT INTO PAYMENTS(invoice_id,amount,payment_method,transaction_no,status,payment_date) VALUES(?,100000,'vnpay',?,'FAILED','2043-02-02 10:00:00'),(?,100000,'vnpay',?,'SUCCESS','2043-02-03 23:59:59')",id,tag+"-failed",id,tag+"-success");
        var first=LocalDate.of(2043,2,1);var last=first.plusDays(2);
        assertEquals(2L,ledger.list("payments",first,last,"ALL","ALL",tag,0,1).get("total"));
        var rows=(List<?>)ledger.list("payments",first,last,"ALL","ALL",tag,0,1).get("items");assertEquals(1,rows.size());assertEquals("SUCCESS",((Map<?,?>)rows.get(0)).get("paymentStatus"));
        assertEquals(1,((List<?>)ledger.list("payments",first,last,"ALL","ALL",tag,1,1).get("items")).size());
        assertEquals(1L,ledger.list("invoices",first,first,"PAID","VNPAY",tag,0,20).get("total"));
        assertEquals(0L,ledger.list("payments",first,first,"SUCCESS","ALL",tag,0,20).get("total"));
        assertEquals(1L,ledger.list("payments",last,last,"SUCCESS","VNPAY",tag,0,20).get("total"));
        assertEquals(0L,ledger.list("payments",first,last,"ALL","ALL","%' OR 1=1 --",0,20).get("total"));
        var detail=ledger.detail(id);assertEquals(2,((List<?>)detail.get("payments")).size());assertEquals(1,((List<?>)detail.get("items")).size());
        assertThrows(IllegalArgumentException.class,()->ledger.list("payments",last,first,"ALL","ALL","",0,20));
        assertThrows(IllegalArgumentException.class,()->ledger.list("payments",first,last,"ALL","ALL","",0,101));
        assertThrows(IllegalArgumentException.class,()->ledger.list("payments",first,last,"PAID","ALL","",0,20));
        jdbc.update("INSERT INTO INVOICES(user_id,total_amount,status,created_at) VALUES(NULL,50000,'PENDING','2043-02-01 11:00:00')");
        int pending=jdbc.queryForObject("SELECT LAST_INSERT_ID()",Integer.class);
        assertEquals(1L,ledger.list("invoices",first,first,"PENDING","ALL",String.valueOf(pending),0,20).get("total"));
        assertTrue(((List<?>)ledger.detail(pending).get("payments")).isEmpty());
        jdbc.update("UPDATE PAYMENTS SET status='COMPLETED' WHERE invoice_id=? AND status='SUCCESS'",id);
        assertEquals(1L,ledger.list("payments",last,last,"SUCCESS","ALL",tag,0,20).get("total"));
        var summary=(Map<?,?>)reports.report(first,last).get("summary");assertEquals(100000,((Number)summary.get("revenue")).intValue());
        jdbc.update("UPDATE INVOICES SET status='REVIEW' WHERE invoice_id=?",id);
        assertEquals(1L,ledger.list("payments",last,last,"REVIEW","ALL",tag,0,20).get("total"));
        assertEquals(0L,ledger.list("payments",last,last,"SUCCESS","ALL",tag,0,20).get("total"));
        summary=(Map<?,?>)reports.report(first,last).get("summary");assertEquals(0,((Number)summary.get("revenue")).intValue());
    }
    @Test void endpointsRequireManagerAndRejectInvalidFilters() throws Exception {
        var manager=jdbc.queryForObject("SELECT u.user_id FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Center Manager' LIMIT 1",Integer.class);
        var member=jdbc.queryForObject("SELECT u.user_id FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Member' LIMIT 1",Integer.class);
        String list="/api/manager/transactions?from=2043-02-01&to=2043-02-03";
        assertTrue(Set.of(401,403).contains(get(list,null).statusCode()));
        assertEquals(403,get(list,jwt.generateToken(users.findById(member).orElseThrow())).statusCode());
        String token=jwt.generateToken(users.findById(manager).orElseThrow());
        assertEquals(200,get(list,token).statusCode());
        assertEquals(400,get(list+"&size=101",token).statusCode());
        assertEquals(404,get("/api/manager/transactions/2147483647",token).statusCode());
        assertEquals(403,get("/api/manager/transactions/1",jwt.generateToken(users.findById(member).orElseThrow())).statusCode());
    }
    HttpResponse<String> get(String path,String token)throws Exception {
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+path));if(token!=null)builder.header("Authorization","Bearer "+token);
        return HttpClient.newHttpClient().send(builder.GET().build(),HttpResponse.BodyHandlers.ofString());
    }
}
