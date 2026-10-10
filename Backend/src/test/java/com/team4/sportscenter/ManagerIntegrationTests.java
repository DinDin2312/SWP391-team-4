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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.mock.web.MockMultipartFile;

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
    @Autowired com.team4.sportscenter.modules.member.services.PackageCommerceService commerce;
    @Autowired com.team4.sportscenter.config.VNPayConfig vnPay;
    @Autowired ManagerRepository repository;
    @Autowired UserRepository users;
    @Autowired JwtService jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactions;
    @Autowired com.team4.sportscenter.modules.member.services.MemberService members;
    @Autowired com.team4.sportscenter.modules.member.services.PackageBenefitsService benefits;
    @Autowired com.team4.sportscenter.modules.payment.services.PaymentService payments;
    @Autowired com.team4.sportscenter.modules.receptionist.services.ReceptionistMemberService reception;
    @Value("${local.server.port}") int port;
    String actor;
    int admin, coach, member, subject, room, course;
    List<Integer> userIds = new ArrayList<>(), classIds = new ArrayList<>();
    List<Integer> packageIds = new ArrayList<>();
    List<String> typeCodes = new ArrayList<>();
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

    HttpResponse<String> photoRequest(String resource, int id, String token, byte[] image) throws Exception {
        String boundary = "photo-" + UUID.randomUUID();
        var output = new java.io.ByteArrayOutputStream();
        output.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"image\"; filename=\"photo.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        output.write(image);
        output.write(("\r\n--" + boundary + "--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        var builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/manager/" + resource + "/" + id + "/image"))
                .header("Content-Type", "multipart/form-data; boundary=" + boundary);
        if (token != null) builder.header("Authorization", "Bearer " + token);
        return HttpClient.newHttpClient().send(builder.POST(HttpRequest.BodyPublishers.ofByteArray(output.toByteArray())).build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test void resourcePhotosEnforceAccessPersistAcrossEditsAndAppearInMemberPackages() throws Exception {
        byte[] image = ResourceImageStorageServiceTests.image(24, 12, "png");
        assertEquals(401, photoRequest("rooms", room, null, image).statusCode());
        assertEquals(403, photoRequest("rooms", room, token(coach), image).statusCode());
        assertEquals(404, photoRequest("rooms", Integer.MAX_VALUE, token(admin), image).statusCode());
        assertEquals(400, photoRequest("users", admin, token(admin), image).statusCode());
        assertEquals(400, photoRequest("rooms", room, token(admin), "not an image".getBytes()).statusCode());
        int packageId = service.savePackage(null, new PackageRequest("QA photo " + actor, "GYM_ACCESS", 30, new BigDecimal("500000")), actor);
        Map<String,Integer> targets = Map.of("rooms", room, "classes", course, "packages", packageId, "subjects", subject);
        try {
            for (var target : targets.entrySet()) {
                var response = photoRequest(target.getKey(), target.getValue(), token(admin), image);
                assertEquals(200, response.statusCode(), response.body());
                var matcher = java.util.regex.Pattern.compile("\"imagePath\"\\s*:\\s*\"([a-f0-9-]+\\.jpg)\"").matcher(response.body());
                assertTrue(matcher.find(), response.body());
                String path = matcher.group(1);
                assertEquals(200, request("GET", "/api/resource-images/" + path, null, null).statusCode());
                assertEquals(403, request("DELETE", "/api/manager/" + target.getKey() + "/" + target.getValue() + "/image", token(coach), null).statusCode());
            }
            String roomPath = jdbc.queryForObject("SELECT image_path FROM ROOMS WHERE room_id=?", String.class, room);
            service.saveRoom(room, new RoomRequest("QA photo room", 10), actor);
            assertEquals(roomPath, service.rooms().stream().filter(r -> ((Number)r.get("roomId")).intValue()==room).findFirst().orElseThrow().get("imagePath"));
            assertNotNull(service.classes().stream().filter(r -> ((Number)r.get("classId")).intValue()==course).findFirst().orElseThrow().get("imagePath"));
            assertNotNull(service.subjects().stream().filter(r -> ((Number)r.get("subjectId")).intValue()==subject).findFirst().orElseThrow().get("imagePath"));
            String packagePath = jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?", String.class, packageId);
            var packages = request("GET", "/api/v1/member/packages", token(member), null);
            assertEquals(200, packages.statusCode()); assertTrue(packages.body().contains(packagePath));
            var replace = photoRequest("rooms", room, token(admin), image);
            assertEquals(200, replace.statusCode());
            assertEquals(404, request("GET", "/api/resource-images/" + roomPath, null, null).statusCode());
            assertEquals(204, request("DELETE", "/api/manager/packages/" + packageId + "/image", token(admin), null).statusCode());
            assertNull(jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?", String.class, packageId));
            assertEquals(404, request("GET", "/api/resource-images/" + packagePath, null, null).statusCode());
        } finally {
            for (var target : targets.entrySet()) service.removeResourceImage(target.getKey(), target.getValue(), actor);
            jdbc.update("DELETE FROM PACKAGES WHERE package_id=?", packageId);
        }
    }

    @Test void photoRollbackKeepsOldImageAndRemovesNewFile() throws Exception {
        byte[] image = ResourceImageStorageServiceTests.image(24, 12, "png");
        String original = service.updateResourceImage("rooms", room, new MockMultipartFile("image", image), actor);
        String[] rolledBack = new String[1];
        try {
            new TransactionTemplate(transactions).execute(status -> {
                rolledBack[0] = service.updateResourceImage("rooms", room, new MockMultipartFile("image", image), actor);
                status.setRollbackOnly(); return null;
            });
            assertEquals(original, jdbc.queryForObject("SELECT image_path FROM ROOMS WHERE room_id=?", String.class, room));
            assertEquals(200, request("GET", "/api/resource-images/" + original, null, null).statusCode());
            assertEquals(404, request("GET", "/api/resource-images/" + rolledBack[0], null, null).statusCode());
        } finally { service.removeResourceImage("rooms", room, actor); }
    }

    HttpResponse<String> packagePhotoRequest(String method,Integer id,String details,byte[] image,boolean remove,String auth) throws Exception {
        String boundary="package-"+UUID.randomUUID();var output=new java.io.ByteArrayOutputStream();
        output.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"details\"\r\nContent-Type: application/json\r\n\r\n"+details+"\r\n--"+boundary+"\r\nContent-Disposition: form-data; name=\"removeImage\"\r\n\r\n"+remove+"\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if(image!=null){output.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"image\"; filename=\"photo.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));output.write(image);output.write("\r\n".getBytes());}
        output.write(("--"+boundary+"--\r\n").getBytes());
        var builder=HttpRequest.newBuilder(URI.create("http://localhost:"+port+"/api/manager/packages/"+(id==null?"":id+"/")+"with-image")).header("Content-Type","multipart/form-data; boundary="+boundary);
        if(auth!=null)builder.header("Authorization","Bearer "+auth);
        return HttpClient.newHttpClient().send(builder.method(method,HttpRequest.BodyPublishers.ofByteArray(output.toByteArray())).build(),HttpResponse.BodyHandlers.ofString());
    }

    @Test void packageEditorSavesMetadataAndPhotoAtomicallyAndSupportsRemoval() throws Exception {
        var image=ResourceImageStorageServiceTests.image(24,12,"png");
        var details="{\"packageName\":\"QA editor "+actor+"\",\"packageType\":\"GYM_ACCESS\",\"durationDays\":30,\"price\":100000}";
        assertEquals(403,packagePhotoRequest("POST",null,details,image,false,token(coach)).statusCode());
        var created=packagePhotoRequest("POST",null,details,image,false,token(admin));assertEquals(200,created.statusCode(),created.body());
        var matcher=java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)").matcher(created.body());assertTrue(matcher.find());int id=Integer.parseInt(matcher.group(1));
        try {
            String previous=jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?",String.class,id);
            assertNotNull(previous);
            assertEquals(400,packagePhotoRequest("PUT",id,details.replace("100000","200000"),"invalid image".getBytes(),false,token(admin)).statusCode());
            assertEquals(100000,jdbc.queryForObject("SELECT price FROM PACKAGES WHERE package_id=?",BigDecimal.class,id).intValue());
            assertEquals(previous,jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?",String.class,id));
            assertEquals(200,request("GET","/api/resource-images/"+previous,null,null).statusCode());
            var replaced=packagePhotoRequest("PUT",id,details.replace("100000","200000"),image,false,token(admin));assertEquals(200,replaced.statusCode(),replaced.body());
            String current=jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?",String.class,id);assertNotEquals(previous,current);
            assertEquals(404,request("GET","/api/resource-images/"+previous,null,null).statusCode());
            assertEquals(200000,jdbc.queryForObject("SELECT price FROM PACKAGES WHERE package_id=?",BigDecimal.class,id).intValue());
            assertEquals(400,packagePhotoRequest("PUT",id,details,image,true,token(admin)).statusCode());
            var removed=packagePhotoRequest("PUT",id,details,null,true,token(admin));assertEquals(200,removed.statusCode(),removed.body());
            assertNull(jdbc.queryForObject("SELECT image_path FROM PACKAGES WHERE package_id=?",String.class,id));
            assertEquals(404,request("GET","/api/resource-images/"+current,null,null).statusCode());
        } finally {service.removeResourceImage("packages",id,actor);jdbc.update("DELETE FROM PACKAGES WHERE package_id=?",id);}
        int before=count("SELECT COUNT(*) FROM PACKAGES");
        assertEquals(400,packagePhotoRequest("POST",null,details,"invalid image".getBytes(),false,token(admin)).statusCode());
        assertEquals(before,count("SELECT COUNT(*) FROM PACKAGES"));
    }

    @AfterEach void cleanup() {
        for(Integer id:userIds){
            jdbc.update("DELETE ib FROM INVOICE_BOOKINGS ib JOIN INVOICES i ON i.invoice_id=ib.invoice_id WHERE i.user_id=?",id);
            jdbc.update("DELETE p FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id WHERE i.user_id=?",id);
            jdbc.update("DELETE d FROM INVOICE_DETAILS d JOIN INVOICES i ON i.invoice_id=d.invoice_id WHERE i.user_id=?",id);
            jdbc.update("DELETE FROM INVOICES WHERE user_id=?",id);
        }
        for (Integer id : userIds) jdbc.update("DELETE FROM NOTIFICATIONS WHERE user_id=?", id);
        for (Integer id : classIds) {
            jdbc.update("DELETE b FROM BOOKINGS b JOIN SCHEDULES s ON s.schedule_id=b.schedule_id WHERE s.class_id=?", id);
            jdbc.update("DELETE FROM SCHEDULES WHERE class_id=?", id);
            jdbc.update("DELETE FROM CLASSES WHERE class_id=?", id);
        }
        for(Integer id:userIds) jdbc.update("DELETE FROM USER_MEMBERSHIPS WHERE user_id=?",id);
        for(Integer id:packageIds) {
            jdbc.update("DELETE FROM PACKAGE_SUBJECT_BENEFITS WHERE package_id=?",id);
            jdbc.update("DELETE FROM PACKAGES WHERE package_id=?",id);
        }
        for(String code:typeCodes)jdbc.update("DELETE FROM PACKAGE_TYPES WHERE type_code=?",code);
        jdbc.update("DELETE FROM ROOMS WHERE room_id=?", room);
        jdbc.update("DELETE FROM SUBJECTS WHERE subject_id=?", subject);
        for (Integer id : userIds) jdbc.update("DELETE FROM USERS WHERE user_id=?", id);
        jdbc.update("DELETE FROM AUDIT_LOGS WHERE actor_email=? OR actor_email=?", actor, "admin" + actor);
    }


    PackageRequest commerceRequest(String description,String terms,Integer limit,BigDecimal price){return new PackageRequest("QA trial","GYM_ACCESS",7,price,List.of(),description,terms,limit,true);}
    int commercePackage(Integer limit,BigDecimal price){int id=service.savePackage(null,commerceRequest("Original description","Original terms\nSecond line",limit,price),actor);packageIds.add(id);return id;}
    int checkoutInvoice(){return jdbc.queryForObject("SELECT MAX(invoice_id) FROM INVOICES WHERE user_id=?",Integer.class,member);}
    void callback(int invoice,boolean success){
        var fields=new HashMap<String,String>();fields.put("vnp_TxnRef",String.valueOf(invoice));fields.put("vnp_ResponseCode",success?"00":"24");fields.put("vnp_TransactionNo","QA-"+invoice);
        fields.put("vnp_Amount",jdbc.queryForObject("SELECT total_amount*100 FROM INVOICES WHERE invoice_id=?",BigDecimal.class,invoice).toPlainString());
        fields.put("vnp_SecureHash",vnPay.hashAllFields(fields));payments.handleVNPayCallback(fields);
    }

    @Test void freeTrialCompletesOnceAndSnapshotsContentEvenAfterStop(){
        int pkg=commercePackage(1,BigDecimal.ZERO);
        members.addPackageToCart("member"+actor,pkg);
        assertEquals("/member/memberships",payments.checkout("member"+actor,"127.0.0.1","vnpay"));
        assertEquals(1,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND purchase_completed_at IS NOT NULL",member));
        assertEquals("PAID",jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,checkoutInvoice()));
        int membership=jdbc.queryForObject("SELECT membership_id FROM USER_MEMBERSHIPS WHERE user_id=?",Integer.class,member);
        jdbc.update("UPDATE USER_MEMBERSHIPS SET status='EXPIRED' WHERE membership_id=?",membership);
        assertThrows(com.team4.sportscenter.common.exception.PackageRuleException.class,()->members.addPackageToCart("member"+actor,pkg));
        service.savePackage(pkg,commerceRequest("Changed description","Changed terms",1,BigDecimal.TEN),actor);
        commerce.selling(pkg,"STOPPED",actor);
        var detail=commerce.purchasedDetail("member"+actor,membership);
        assertEquals("Original description",detail.get("description"));assertEquals("Original terms\nSecond line",detail.get("terms"));
        assertFalse(members.getAllPackages().stream().anyMatch(p->p.getPackageId().equals(pkg)));
        assertThrows(Exception.class,()->commerce.purchasedDetail("coach"+actor,membership));
        assertTrue(commerce.history(pkg,1).toString().contains("Changed description"));
        assertTrue(commerce.history(pkg,1).toString().contains("sellingStatus"));
        assertFalse(service.packages().stream().filter(p->p.get("packageId").equals(pkg)).findFirst().orElseThrow().containsKey("terms"));
    }

    @Test void failedCheckoutDoesNotConsumeLimitAndReissuedCheckoutIsExact(){
        int pkg=commercePackage(1,BigDecimal.TEN);members.addPackageToCart("member"+actor,pkg);
        payments.checkout("member"+actor,"127.0.0.1","vnpay");int first=checkoutInvoice();
        assertThrows(com.team4.sportscenter.common.exception.PackageRuleException.class,()->payments.checkout("member"+actor,"127.0.0.1","vnpay"));
        callback(first,false);assertEquals("FAILED",jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,first));
        assertEquals(0,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND purchase_completed_at IS NOT NULL",member));
        payments.checkout("member"+actor,"127.0.0.1","vnpay");int second=checkoutInvoice();
        callback(first,true);assertEquals("REVIEW",jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,first));
        callback(second,true);callback(second,true);
        assertEquals(1,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND purchase_completed_at IS NOT NULL",member));
    }

    @Test void stoppingBlocksNewCheckoutButHonorsAlreadyIssuedInvoice(){
        int pkg=commercePackage(1,BigDecimal.TEN);members.addPackageToCart("member"+actor,pkg);
        commerce.selling(pkg,"STOPPED",actor);
        assertThrows(com.team4.sportscenter.common.exception.PackageRuleException.class,()->payments.checkout("member"+actor,"127.0.0.1","vnpay"));
        commerce.selling(pkg,"SELLING",actor);payments.checkout("member"+actor,"127.0.0.1","vnpay");int invoice=checkoutInvoice();
        int other=commercePackage(null,BigDecimal.TEN);members.addPackageToCart("member"+actor,other);
        commerce.selling(pkg,"STOPPED",actor);callback(invoice,true);
        assertEquals("ACTIVE",jdbc.queryForObject("SELECT status FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=?",String.class,member,pkg));
        assertEquals("PENDING",jdbc.queryForObject("SELECT status FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=?",String.class,member,other));
    }

    @Test void expiredCapturedCheckoutIsRecordedForReconciliation(){
        int pkg=commercePackage(1,BigDecimal.TEN);members.addPackageToCart("member"+actor,pkg);payments.checkout("member"+actor,"127.0.0.1","vnpay");int invoice=checkoutInvoice();
        jdbc.update("UPDATE INVOICES SET created_at=DATE_SUB(NOW(),INTERVAL 16 MINUTE) WHERE invoice_id=?",invoice);
        callback(invoice,true);assertEquals("REVIEW",jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,invoice));
        assertEquals("COMPLETED",jdbc.queryForObject("SELECT status FROM PAYMENTS WHERE invoice_id=?",String.class,invoice));
        assertEquals(0,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND purchase_completed_at IS NOT NULL",member));
    }

    @Test void counterSaleCountsAndSharesReservationWithOnline(){
        int pkg=commercePackage(1,BigDecimal.TEN);members.addPackageToCart("member"+actor,pkg);payments.checkout("member"+actor,"127.0.0.1","vnpay");
        var request=new com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest();request.setUserId(member);request.setPackageId(pkg);
        assertThrows(com.team4.sportscenter.common.exception.PackageRuleException.class,()->reception.subscribePackageForMember(request));
        callback(checkoutInvoice(),false);reception.subscribePackageForMember(request);
        assertThrows(com.team4.sportscenter.common.exception.PackageRuleException.class,()->reception.subscribePackageForMember(request));
    }

    @Test void simultaneousFreeCheckoutAndCounterSaleConsumeOnlyOnePurchase() throws Exception {
        int pkg=commercePackage(1,BigDecimal.ZERO);members.addPackageToCart("member"+actor,pkg);
        var request=new com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest();request.setUserId(member);request.setPackageId(pkg);
        var gate=new java.util.concurrent.CountDownLatch(1);var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try{
            var a=pool.submit(()->{gate.await();try{payments.checkout("member"+actor,"127.0.0.1","vnpay");return true;}catch(RuntimeException e){return false;}});
            var b=pool.submit(()->{gate.await();try{reception.subscribePackageForMember(request);return true;}catch(RuntimeException e){return false;}});
            gate.countDown();assertNotEquals(a.get(),b.get());
            assertEquals(1,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=? AND purchase_completed_at IS NOT NULL",member,pkg));
        }finally{pool.shutdownNow();}
    }

    @Test void optionalFieldsPreserveLegacyUpdatesAndStatusNeedsManager() throws Exception {
        int pkg=commercePackage(1,BigDecimal.TEN);
        service.savePackage(pkg,new PackageRequest("Legacy update","GYM_ACCESS",30,BigDecimal.TEN),actor);
        assertEquals("Original description",commerce.detail(pkg).get("description"));assertEquals(1,commerce.detail(pkg).get("purchaseLimitPerMember"));
        assertEquals(403,request("PATCH","/api/manager/packages/"+pkg+"/selling-status",token(coach),"{\"status\":\"STOPPED\"}").statusCode());
        assertEquals(200,request("GET","/api/manager/packages/"+pkg,token(admin),null).statusCode());
        service.savePackage(pkg,commerceRequest("","",null,BigDecimal.TEN),actor);
        assertNull(commerce.detail(pkg).get("purchaseLimitPerMember"));
    }

    @Test void momoCallbackRequiresAuthenticSignatureAndMatchingAmount() throws Exception {
        int pkg=commercePackage(1,BigDecimal.TEN);members.addPackageToCart("member"+actor,pkg);
        payments.checkout("member"+actor,"127.0.0.1","vnpay");int invoice=checkoutInvoice();
        jdbc.update("UPDATE PAYMENTS SET payment_method='MOMO' WHERE invoice_id=?",invoice);
        var fields=new HashMap<String,String>();fields.put("orderId",invoice+"_qa");fields.put("amount","10");fields.put("resultCode","0");fields.put("transId","QA-MOMO");
        fields.put("partnerCode",com.team4.sportscenter.config.MoMoConfig.PARTNER_CODE);fields.put("orderType","momo_wallet");fields.put("payType","webApp");
        fields.put("requestId","QA-request");fields.put("responseTime",String.valueOf(System.currentTimeMillis()));fields.put("message","Successful");fields.put("extraData","");fields.put("orderInfo","QA invoice");
        fields.put("signature","forged");assertThrows(IllegalArgumentException.class,()->payments.handleMoMoCallback(fields));
        String raw="accessKey="+com.team4.sportscenter.config.MoMoConfig.ACCESS_KEY;
        for(String key:List.of("amount","extraData","message","orderId","orderInfo","orderType","partnerCode","payType","requestId","responseTime","resultCode","transId"))raw+="&"+key+"="+fields.getOrDefault(key,"");
        fields.put("signature",com.team4.sportscenter.config.MoMoConfig.signHmacSHA256(raw,com.team4.sportscenter.config.MoMoConfig.SECRET_KEY));
        payments.handleMoMoCallback(fields);payments.handleMoMoCallback(fields);
        assertEquals("PAID",jdbc.queryForObject("SELECT status FROM INVOICES WHERE invoice_id=?",String.class,invoice));
        assertEquals(1,count("SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE user_id=? AND purchase_completed_at IS NOT NULL",member));
    }

    @Test void packageTypesAreDynamicAndRenameDoesNotChangePurchasedLabels() throws Exception {
        String name="QA swim type "+UUID.randomUUID();
        var created=request("POST","/api/manager/package-types",token(admin),"{\"typeName\":\""+name+"\",\"requiresSubjects\":true}");
        assertEquals(200,created.statusCode());
        String code=new com.fasterxml.jackson.databind.ObjectMapper().readTree(created.body()).get("typeCode").asText();typeCodes.add(code);
        assertEquals(403,request("POST","/api/manager/package-types",token(coach),"{\"typeName\":\"Blocked\"}").statusCode());
        assertEquals(400,request("POST","/api/manager/package-types",token(admin),"{\"typeName\":\""+name+"\"}").statusCode());
        int pkg=service.savePackage(null,new PackageRequest("Dynamic swimming package",code,30,BigDecimal.TEN,List.of(new SubjectBenefitRequest(subject,4))),actor);packageIds.add(pkg);
        int membership=purchasedPackage(pkg);
        assertTrue(service.packages().stream().anyMatch(p->p.get("packageType").equals(code)&&p.get("packageTypeName").equals(name)));
        service.savePackageType(code,new PackageTypeRequest(name+" renamed",true),actor);
        assertEquals(name,members.getMyPackages("member"+actor).get(0).getPackageTypeName());
        assertEquals(4,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        assertThrows(IllegalArgumentException.class,()->service.savePackage(pkg,new PackageRequest("Missing definition",code,30,BigDecimal.TEN,List.of()),actor));
        assertThrows(IllegalArgumentException.class,()->service.savePackage(pkg,new PackageRequest("Unknown type","CUSTOM_missing",30,BigDecimal.TEN,List.of()),actor));
    }

    int subjectPackage(int quota) {
        int id=service.savePackage(null,new PackageRequest("QA subject package","SUBJECT_ACCESS",30,new BigDecimal("200000"),List.of(new SubjectBenefitRequest(subject,quota))),actor);
        packageIds.add(id);return id;
    }

    @Test void roomScopeIsSnapshottedAndEnforcedForBookingAndClassMoves() throws Exception {
        int otherRoom=jdbc.queryForObject("SELECT room_id FROM ROOMS WHERE room_id<>? ORDER BY room_id LIMIT 1",Integer.class,room);
        int pkg=service.savePackage(null,new PackageRequest("Pool A only","SUBJECT_ACCESS",30,BigDecimal.TEN,List.of(new SubjectBenefitRequest(subject,4,List.of(room)))),actor);
        packageIds.add(pkg);
        int membership=purchasedPackage(pkg);
        assertEquals(List.of(room),benefits.membershipBenefits(membership).get(0).get("roomIds"));
        service.savePackage(pkg,new PackageRequest("Pool B only","SUBJECT_ACCESS",30,BigDecimal.TEN,List.of(new SubjectBenefitRequest(subject,4,List.of(otherRoom)))),actor);
        assertEquals(List.of(otherRoom),benefits.packageBenefits(pkg).get(0).get("roomIds"));
        assertEquals(List.of(room),benefits.membershipBenefits(membership).get(0).get("roomIds"));
        // An older client omitting roomIds must preserve the explicit scope.
        service.savePackage(pkg,new PackageRequest("Old client edit","SUBJECT_ACCESS",30,BigDecimal.TEN,List.of(new SubjectBenefitRequest(subject,4))),actor);
        assertEquals(List.of(otherRoom),benefits.packageBenefits(pkg).get(0).get("roomIds"));
        assertThrows(IllegalArgumentException.class,()->service.savePackage(pkg,new PackageRequest("Invalid room","SUBJECT_ACCESS",30,BigDecimal.TEN,List.of(new SubjectBenefitRequest(subject,4,List.of(Integer.MAX_VALUE)))),actor));
        schedule(LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0));
        jdbc.update("UPDATE CLASSES SET room_id=? WHERE class_id=?",otherRoom,course);
        assertThrows(IllegalArgumentException.class,()->members.bookClassUsingPackage("member"+actor,course,membership));
        assertEquals(0,count("SELECT COUNT(*) FROM BOOKINGS WHERE user_id=?",member));
        jdbc.update("UPDATE CLASSES SET room_id=? WHERE class_id=?",room,course);
        members.bookClassUsingPackage("member"+actor,course,membership);
        assertEquals(3,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        assertThrows(IllegalArgumentException.class,()->benefits.validateClassRoom(course,otherRoom));
        assertThrows(IllegalArgumentException.class,()->service.saveClass(course,new ClassRequest("Move pool",subject,coach,otherRoom,BigDecimal.TEN,5,"ACTIVE"),actor));
        assertEquals(room,jdbc.queryForObject("SELECT room_id FROM CLASSES WHERE class_id=?",Integer.class,course));
    }
    int purchasedPackage(int pkg) {
        members.addPackageToCart("member"+actor,pkg);
        int id=jdbc.queryForObject("SELECT membership_id FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=? AND status='PENDING'",Integer.class,member,pkg);
        jdbc.update("UPDATE USER_MEMBERSHIPS SET status='ACTIVE',start_date=CURDATE(),end_date=DATE_ADD(CURDATE(),INTERVAL 29 DAY) WHERE membership_id=?",id);
        return id;
    }

    @Test void subjectPackagesValidateDefinitionsAndKeepPurchaseSnapshots() throws Exception {
        int before=count("SELECT COUNT(*) FROM PACKAGES");
        String payload="{\"packageName\":\"QA\",\"packageType\":\"SUBJECT_ACCESS\",\"durationDays\":30,\"price\":200000,\"benefits\":[]}";
        assertEquals(400,request("POST","/api/manager/packages",token(admin),payload).statusCode());
        assertEquals(before,count("SELECT COUNT(*) FROM PACKAGES"));
        int pkg=subjectPackage(12);
        members.addPackageToCart("member"+actor,pkg);
        int membership=jdbc.queryForObject("SELECT membership_id FROM USER_MEMBERSHIPS WHERE user_id=? AND package_id=?",Integer.class,member,pkg);
        service.savePackage(pkg,new PackageRequest("Changed package","SUBJECT_ACCESS",90,new BigDecimal("900000"),List.of(new SubjectBenefitRequest(subject,3))),actor);
        var cart=payments.getCartItems("member"+actor);
        assertEquals(new BigDecimal("200000.00"),cart.getTotalPrice());
        assertEquals(30,cart.getItems().get(0).getDurationDays());
        assertEquals(12,((Number)benefits.membershipBenefits(membership).get(0).get("sessionLimit")).intValue());
        assertEquals(3,((Number)benefits.packageBenefits(pkg).get(0).get("sessionLimit")).intValue());
        assertThrows(IllegalArgumentException.class,()->service.savePackage(pkg,new PackageRequest("Broken","SUBJECT_ACCESS",30,BigDecimal.ZERO,List.of(new SubjectBenefitRequest(subject,2),new SubjectBenefitRequest(subject,3))),actor));
        assertEquals("Changed package",jdbc.queryForObject("SELECT package_name FROM PACKAGES WHERE package_id=?",String.class,pkg));
    }

    @Test void packageCourseBookingReservesQuotaRejectsInvalidUseAndRefundsOnlyFutureCancellation() throws Exception {
        var time=LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0);
        int first=schedule(time),second=schedule(time.plusDays(1));
        int pkg=subjectPackage(2),membership=purchasedPackage(pkg);
        assertEquals(403,request("POST","/api/v1/member/book-class/"+course+"/with-package/"+membership,token(coach),"{}").statusCode());
        assertThrows(IllegalArgumentException.class,()->members.bookClassUsingPackage("admin"+actor,course,membership));
        jdbc.update("UPDATE USER_MEMBERSHIPS SET end_date=CURDATE() WHERE membership_id=?",membership);
        assertThrows(IllegalArgumentException.class,()->members.bookClassUsingPackage("member"+actor,course,membership));
        jdbc.update("UPDATE USER_MEMBERSHIPS SET end_date=DATE_ADD(CURDATE(),INTERVAL 29 DAY) WHERE membership_id=?",membership);
        assertEquals(200,request("POST","/api/v1/member/book-class/"+course+"/with-package/"+membership,token(member),"{}").statusCode());
        assertEquals(2,count("SELECT COUNT(*) FROM BOOKINGS WHERE user_id=? AND status='CONFIRMED'",member));
        assertEquals(0,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        assertEquals(0,payments.getCartItems("member"+actor).getItems().size());
        int other=newClass("Another course",5);
        service.saveSchedule(null,new ScheduleRequest(other,time.plusDays(4),time.plusDays(4).plusHours(1),"SCHEDULED"),actor);
        assertThrows(IllegalArgumentException.class,()->members.bookClassUsingPackage("member"+actor,other,membership));
        assertThrows(IllegalArgumentException.class,()->service.saveSchedule(second,new ScheduleRequest(course,time.plusDays(40),time.plusDays(40).plusHours(1),"SCHEDULED"),actor));
        jdbc.update("UPDATE SCHEDULES SET start_time=DATE_SUB(NOW(),INTERVAL 2 HOUR),end_time=DATE_SUB(NOW(),INTERVAL 1 HOUR) WHERE schedule_id=?",first);
        jdbc.update("UPDATE BOOKINGS SET attendance_status='PRESENT' WHERE schedule_id=? AND user_id=?",first,member);
        members.cancelClass("member"+actor,course);
        assertEquals(1,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        jdbc.update("UPDATE BOOKINGS SET status='CANCELLED' WHERE schedule_id=? AND user_id=?",first,member);
        assertEquals(1,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        members.bookClassUsingPackage("member"+actor,other,membership);
        assertEquals(0,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
        int otherSchedule=jdbc.queryForObject("SELECT schedule_id FROM SCHEDULES WHERE class_id=?",Integer.class,other);
        service.saveSchedule(otherSchedule,new ScheduleRequest(other,time.plusDays(4),time.plusDays(4).plusHours(1),"CANCELLED"),actor);
        assertEquals(1,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
    }

    @Test void receptionSubscriptionsSnapshotBenefitsAndRemainSeparateOnMemberScreens() {
        int pkg=subjectPackage(8);
        for(int i=0;i<2;i++) reception.subscribePackageForMember(new com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest(member,pkg,java.time.LocalDate.now()));
        service.savePackage(pkg,new PackageRequest("Changed","SUBJECT_ACCESS",90,new BigDecimal("900000"),List.of(new SubjectBenefitRequest(subject,2))),actor);
        var owned=members.getMyPackages("member"+actor);
        assertEquals(2,owned.size());
        for(var purchase:owned) {
            assertEquals("QA subject package",purchase.getPackageName());
            assertEquals(30,purchase.getDurationDays());
            assertEquals(java.time.LocalDate.now().plusDays(29),purchase.getEndDate());
            assertEquals(8,((Number)purchase.getBenefits().get(0).get("remainingSessions")).intValue());
        }
    }

    @Test void simultaneousBookingsCannotSpendTheLastSessionTwice() throws Exception {
        int pkg=subjectPackage(1),membership=purchasedPackage(pkg),other=newClass("Other course",5);
        var time=LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0);
        schedule(time);
        service.saveSchedule(null,new ScheduleRequest(other,time.plusDays(1),time.plusDays(1).plusHours(1),"SCHEDULED"),actor);
        var gate=new java.util.concurrent.CountDownLatch(1);
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try {
            List<java.util.concurrent.Future<Boolean>> calls=new ArrayList<>();
            for(int classId:List.of(course,other)) calls.add(pool.submit(()->{
                gate.await();
                try {members.bookClassUsingPackage("member"+actor,classId,membership);return true;}
                catch(IllegalArgumentException failure){assertTrue(failure.getMessage().contains("Not enough"));return false;}
            }));
            gate.countDown();int successes=0;
            for(var call:calls)if(call.get(15,java.util.concurrent.TimeUnit.SECONDS))successes++;
            assertEquals(1,successes);
        } finally {pool.shutdownNow();}
        assertEquals(1,count("SELECT COUNT(*) FROM BOOKINGS WHERE user_id=? AND status='CONFIRMED'",member));
        assertEquals(0,((Number)benefits.membershipBenefits(membership).get(0).get("remainingSessions")).intValue());
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

    SchedulePlanRequest planRules() {
        return new SchedulePlanRequest(course,start.toLocalDate(),start.plusDays(14).toLocalDate(),3,60,List.of(1,2,3,4,5,6,7),java.time.LocalTime.of(9,0),java.time.LocalTime.of(12,0),java.time.LocalTime.of(10,0),15,List.of(start.plusDays(1).toLocalDate()));
    }
    @SuppressWarnings("unchecked")
    List<PlannedSession> planned(Map<String,Object> preview) {return (List<PlannedSession>)preview.get("sessions");}

    @Test void automaticPreviewAvoidsOccupiedResourcesAndCommitIsAtomic() {
        int other=newClass("Busy class",5);
        service.saveSchedule(null,new ScheduleRequest(other,start,start.plusHours(1),"SCHEDULED"),actor);
        var rules=planRules();var preview=service.previewSchedulePlan(rules);
        assertEquals(0,preview.get("missing"));assertEquals(0,count("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=?",course));
        var sessions=planned(preview);assertEquals(start.plusHours(1).plusMinutes(15),sessions.get(0).startTime());
        assertEquals(start.plusDays(2).toLocalDate(),sessions.get(1).startTime().toLocalDate());
        // Someone takes a later slot after preview; no earlier session or audit can leak through.
        var taken=sessions.get(1);
        service.saveSchedule(null,new ScheduleRequest(other,taken.startTime(),taken.endTime(),"SCHEDULED"),actor);
        int audits=count("SELECT COUNT(*) FROM AUDIT_LOGS WHERE actor_email=?",actor);
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,sessions),actor));
        assertEquals(0,count("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=?",course));
        assertEquals(audits,count("SELECT COUNT(*) FROM AUDIT_LOGS WHERE actor_email=?",actor));
        var refreshed=planned(service.previewSchedulePlan(rules));
        assertEquals(3,service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,refreshed),actor).size());
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,refreshed),actor));
        assertEquals(3,count("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=?",course));
    }

    @Test void automaticPlanRejectsRegistrationIncompleteAndTamperedSessions() {
        var rules=planRules();var sessions=planned(service.previewSchedulePlan(rules));
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,sessions.subList(0,2)),actor));
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach+1,room,sessions),actor));
        var tampered=new ArrayList<>(sessions);tampered.set(0,new PlannedSession(start.minusHours(1),start));
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,tampered),actor));
        int id=schedule(start);booking(id,"PENDING");
        assertThrows(IllegalArgumentException.class,()->service.previewSchedulePlan(rules));
        assertThrows(IllegalArgumentException.class,()->service.commitSchedulePlan(new SchedulePlanCommitRequest(rules,coach,room,sessions),actor));
    }

    @Test void automaticPlanEndpointsRequireManagerAndValidateInput() throws Exception {
        var body="{\"classId\":"+course+",\"fromDate\":\"2040-06-01\",\"toDate\":\"2040-06-15\",\"sessions\":3,\"durationMinutes\":60,\"weekdays\":[1,2,3,4,5,6,7],\"availableFrom\":\"09:00\",\"availableTo\":\"12:00\",\"preferredTime\":\"10:00\",\"breakMinutes\":15,\"excludedDates\":[]}";
        assertEquals(401,request("POST","/api/manager/schedules/plan/preview",null,body).statusCode());
        assertEquals(403,request("POST","/api/manager/schedules/plan/preview",token(coach),body).statusCode());
        var previewResponse=request("POST","/api/manager/schedules/plan/preview",token(admin),body);
        assertEquals(200,previewResponse.statusCode());assertTrue(previewResponse.body().contains("2040-06-01T10:00"),previewResponse.body());
        assertEquals(400,request("POST","/api/manager/schedules/plan/preview",token(admin),body.replace("\"sessions\":3","\"sessions\":0")).statusCode());
        assertEquals(400,request("POST","/api/manager/schedules/plan",token(admin),"{}").statusCode());
        var batch="{\"rules\":"+body+",\"coachId\":"+coach+",\"roomId\":"+room+",\"sessions\":[{\"startTime\":\"2040-06-01T10:00:00\",\"endTime\":\"2040-06-01T11:00:00\"},{\"startTime\":\"2040-06-02T10:00:00\",\"endTime\":\"2040-06-02T11:00:00\"},{\"startTime\":\"2040-06-03T10:00:00\",\"endTime\":\"2040-06-03T11:00:00\"}]}";
        assertEquals(403,request("POST","/api/manager/schedules/plan",token(coach),batch).statusCode());
        var saved=request("POST","/api/manager/schedules/plan",token(admin),batch);
        assertEquals(200,saved.statusCode(),saved.body());
        assertEquals(400,request("POST","/api/manager/schedules/plan",token(admin),batch).statusCode());
        assertEquals(3,count("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=?",course));
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
