package com.team4.sportscenter.modules.manager.repositories;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ManagerRepository {
    public static final double LOW_REGISTRATION_THRESHOLD = 0.25;
    public static final int URGENT_WINDOW_HOURS = 6;
    private static final java.time.ZoneId CENTER_ZONE = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
    private LocalDateTime centerNow() { return LocalDateTime.now(CENTER_ZONE); }

    // Pending and confirmed bookings both reserve seats; the threshold is strictly below 25%.
    private static final String BOOKED_SQL = "(SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id=s.schedule_id AND b.status IN ('CONFIRMED','PENDING'))";
    private static final String SESSION_SQL = "SELECT s.schedule_id scheduleId,s.class_id classId,c.class_name className,c.image_path classImagePath,u.avatar_path coachAvatarPath,u.full_name coachName,r.image_path roomImagePath,r.room_name roomName,s.start_time startTime,s.end_time endTime,s.status," + BOOKED_SQL + " booked,c.max_slots maxSlots FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id JOIN USERS u ON u.user_id=c.coach_id JOIN ROOMS r ON r.room_id=c.room_id ";

    public Map<String, Object> operationalOverview() {
        LocalDateTime now = centerNow();
        LocalDate today = now.toLocalDate();
        String low = "s.status='SCHEDULED' AND c.max_slots>0 AND " + BOOKED_SQL + "<c.max_slots*?";
        String future = "s.start_time>=? AND s.start_time<? AND " + low;
        List<Map<String, Object>> todayRows = jdbc.queryForList(SESSION_SQL + "WHERE s.start_time>=? AND s.start_time<? AND s.status<>'CANCELLED' ORDER BY s.start_time,s.schedule_id", today.atStartOfDay(),today.plusDays(1).atStartOfDay()).stream().map(this::localTimes).toList();
        List<Map<String, Object>> urgent = jdbc.queryForList(SESSION_SQL + "WHERE " + future + " ORDER BY s.start_time,s.schedule_id", now,now.plusHours(URGENT_WINDOW_HOURS),LOW_REGISTRATION_THRESHOLD).stream().map(this::localTimes).toList();
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("sessionsToday", todayRows.size());
        result.put("todaySessions", todayRows);
        result.put("urgentSessions", urgent);
        result.put("urgentCount", urgent.size());
        result.put("lowRegistrationSessions", jdbc.queryForObject("SELECT COUNT(*) FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id WHERE " + future, Integer.class,now,today.plusDays(8).atStartOfDay(),LOW_REGISTRATION_THRESHOLD));
        result.put("attentionPage", attentionPage(0,6));
        Map<String,Object> renewals = renewalPage(0,6);
        result.put("renewalPage",renewals);
        result.put("expiringMemberships",renewals.get("total"));
        result.put("centerDate",today.toString());
        result.put("serverNow", now.toString());
        result.put("lowRegistrationThreshold",LOW_REGISTRATION_THRESHOLD);
        result.put("urgentWindowHours",URGENT_WINDOW_HOURS);
        return result;
    }

    // One queue of items only the manager can resolve, ordered by deadline.
    public List<Map<String, Object>> decisions() {
        LocalDateTime now = centerNow();
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        jdbc.queryForList("""
                SELECT rr.request_id id,rr.action_type actionType,c.class_name className,u.full_name coachName,
                       rr.original_start_time dueAt,rr.proposed_start_time proposedAt,rr.reason_details detail
                FROM SCHEDULE_RESCHEDULE_REQUESTS rr JOIN CLASSES c ON c.class_id=rr.class_id JOIN USERS u ON u.user_id=rr.coach_id
                WHERE rr.status='PENDING' ORDER BY rr.original_start_time LIMIT 20
                """).forEach(r -> items.add(decision("RESCHEDULE", r)));
        jdbc.queryForList("""
                SELECT sr.request_id id,sr.title className,u.full_name coachName,sr.category actionType,
                       sr.created_at createdAt,sr.priority detail
                FROM SUPPORT_REQUESTS sr JOIN USERS u ON u.user_id=sr.user_id
                WHERE sr.status='ESCALATED' ORDER BY sr.created_at LIMIT 20
                """).forEach(r -> items.add(decision("ESCALATION", r)));
        jdbc.queryForList("""
                SELECT i.invoice_id id,u.full_name coachName,i.total_amount amount,i.created_at createdAt
                FROM INVOICES i LEFT JOIN USERS u ON u.user_id=i.user_id
                WHERE i.status='REVIEW' ORDER BY i.created_at LIMIT 20
                """).forEach(r -> items.add(decision("PAYMENT_REVIEW", r)));
        jdbc.queryForList(SESSION_SQL + "WHERE s.start_time>=? AND s.start_time<? AND s.status='SCHEDULED' AND c.max_slots>0 AND " + BOOKED_SQL + "<c.max_slots*? ORDER BY s.start_time",
                now, now.plusHours(24), LOW_REGISTRATION_THRESHOLD).stream().map(this::localTimes)
                .forEach(r -> { Map<String, Object> d = decision("LOW_FILL", r); d.put("id", r.get("scheduleId")); d.put("dueAt", r.get("startTime")); items.add(d); });
        items.sort(java.util.Comparator.comparing(d -> String.valueOf(d.getOrDefault("dueAt", d.get("createdAt")))));
        return items;
    }

    private Map<String, Object> decision(String type, Map<String, Object> row) {
        Map<String, Object> d = new java.util.LinkedHashMap<>(row);
        d.put("type", type);
        d.replaceAll((k, v) -> v instanceof Timestamp ts ? ts.toLocalDateTime().toString() : v instanceof LocalDateTime ldt ? ldt.toString() : v);
        if (!d.containsKey("dueAt")) d.put("dueAt", d.get("createdAt"));
        return d;
    }

    // Live floor numbers for today. A front-desk check-in stays CHECK_IN until checked out.
    public Map<String, Object> todayPulse() {
        LocalDateTime now = centerNow();
        LocalDateTime start = now.toLocalDate().atStartOfDay(), end = start.plusDays(1);
        Map<String, Object> p = new java.util.LinkedHashMap<>();
        p.put("checkInsToday", jdbc.queryForObject("SELECT COUNT(*) FROM AUDIT_LOGS WHERE entity_type='MEMBER_CHECKIN' AND created_at>=? AND created_at<?", Integer.class, start, end));
        p.put("onSiteNow", jdbc.queryForObject("SELECT COUNT(*) FROM AUDIT_LOGS WHERE entity_type='MEMBER_CHECKIN' AND action='CHECK_IN' AND created_at>=? AND created_at<?", Integer.class, start, end));
        Map<String, Object> fill = jdbc.queryForMap("SELECT COALESCE(SUM(" + BOOKED_SQL + "),0) booked,COALESCE(SUM(c.max_slots),0) seats FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id WHERE s.start_time>=? AND s.start_time<? AND s.status<>'CANCELLED'", start, end);
        p.put("bookedSeatsToday", ((Number) fill.get("booked")).intValue());
        p.put("totalSeatsToday", ((Number) fill.get("seats")).intValue());
        p.put("roomsInUse", jdbc.queryForObject("SELECT COUNT(DISTINCT c.room_id) FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id WHERE s.start_time<=? AND s.end_time>? AND s.status<>'CANCELLED'", Integer.class, now, now));
        p.put("totalRooms", jdbc.queryForObject("SELECT COUNT(*) FROM ROOMS", Integer.class));
        return p;
    }

    public Map<String,Object> attentionPage(int page,int size) {
        LocalDateTime now = centerNow();
        LocalDate today = now.toLocalDate();
        String where = "WHERE s.start_time>=? AND s.start_time<? AND s.status='SCHEDULED' AND c.max_slots>0 AND " + BOOKED_SQL + "<c.max_slots*? AND NOT(s.start_time>=? AND s.start_time<?)";
        Object[] args = {today.plusDays(1).atStartOfDay(),today.plusDays(8).atStartOfDay(),LOW_REGISTRATION_THRESHOLD,now,now.plusHours(URGENT_WINDOW_HOURS)};
        int total = jdbc.queryForObject("SELECT COUNT(*) FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id " + where,Integer.class,args);
        java.util.List<Object> params = new java.util.ArrayList<>(java.util.Arrays.asList(args)); params.add(size); params.add(page*size);
        List<Map<String,Object>> items = jdbc.queryForList(SESSION_SQL + where + " ORDER BY s.start_time,s.schedule_id LIMIT ? OFFSET ?",params.toArray()).stream().map(this::localTimes).toList();
        return Map.of("items",items,"total",total,"page",page,"size",size);
    }

    public Map<String,Object> renewalPage(int page,int size) {
        LocalDate today = centerNow().toLocalDate();
        String where = "FROM USER_MEMBERSHIPS um JOIN USERS u ON u.user_id=um.user_id JOIN PACKAGES p ON p.package_id=um.package_id WHERE um.status='ACTIVE' AND um.start_date<=? AND um.end_date>=? AND um.end_date<=?";
        int total = jdbc.queryForObject("SELECT COUNT(*) " + where,Integer.class,today,today,today.plusDays(7));
        List<Map<String,Object>> items = jdbc.queryForList("SELECT um.membership_id membershipId,u.full_name fullName,u.phone,p.package_name packageName,um.end_date endDate " + where + " ORDER BY um.end_date,um.membership_id LIMIT ? OFFSET ?",today,today,today.plusDays(7),size,page*size);
        return Map.of("items",items,"total",total,"page",page,"size",size);
    }

    public List<Map<String,Object>> filteredSchedules(LocalDate from,LocalDate to,boolean lowRegistration,String status,boolean excludeUrgent) {
        String where = "WHERE s.start_time>=? AND s.start_time<?";
        java.util.List<Object> args = new java.util.ArrayList<>(List.of(from.atStartOfDay(),to.plusDays(1).atStartOfDay()));
        if(status!=null && !status.isBlank()) { where += " AND s.status=?";args.add(status); }
        if(lowRegistration) { where += " AND s.status='SCHEDULED' AND s.start_time>=? AND c.max_slots>0 AND " + BOOKED_SQL + "<c.max_slots*?"; args.add(centerNow());args.add(LOW_REGISTRATION_THRESHOLD); }
        if(excludeUrgent) { LocalDateTime now=centerNow();where += " AND NOT(s.start_time>=? AND s.start_time<?)";args.add(now);args.add(now.plusHours(URGENT_WINDOW_HOURS)); }
        return jdbc.queryForList(SESSION_SQL + where + " ORDER BY s.start_time,s.schedule_id",args.toArray()).stream().map(this::localTimes).toList();
    }

    private final JdbcTemplate jdbc;

    // Serialize manager assignment/capacity changes, including requests on different server instances.
    // Always acquire this row before checking constraints and hold it until the service transaction commits.
    public void lockOperations() {
        jdbc.queryForList("SELECT role_id FROM ROLES WHERE role_name='Center Manager' FOR UPDATE");
    }

    public int activeManagerCount() {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id
                WHERE r.role_name='Center Manager' AND u.status='ACTIVE'
                """, Integer.class);
    }

    public void requireSubject(Integer id) {
        jdbc.queryForObject("SELECT subject_id FROM SUBJECTS WHERE subject_id=?", Integer.class, id);
    }

    public void requireRoom(Integer id) {
        jdbc.queryForObject("SELECT room_id FROM ROOMS WHERE room_id=?", Integer.class, id);
    }

    public void requirePackage(Integer id) {
        jdbc.queryForObject("SELECT package_id FROM PACKAGES WHERE package_id=?", Integer.class, id);
    }

    public boolean coachHasAssignments(Integer id) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM CLASSES c WHERE c.coach_id=? AND
                (c.status='ACTIVE' OR EXISTS (SELECT 1 FROM SCHEDULES s WHERE s.class_id=c.class_id
                  AND s.status='SCHEDULED' AND s.end_time>NOW()))
                """, Integer.class, id) > 0;
    }

    public int requiredRoomCapacity(Integer id) {
        return jdbc.queryForObject("SELECT COALESCE(MAX(max_slots),0) FROM CLASSES WHERE room_id=?",
                Integer.class, id);
    }

    public int peakBookings(Integer id) {
        return jdbc.queryForObject("""
                SELECT COALESCE(MAX(n),0) FROM (
                  SELECT COUNT(*) n FROM BOOKINGS b JOIN SCHEDULES s ON s.schedule_id=b.schedule_id
                  WHERE s.class_id=? AND s.status<>'CANCELLED' AND b.status IN ('CONFIRMED','PENDING')
                  GROUP BY s.schedule_id
                ) counts
                """, Integer.class, id);
    }

    public boolean hasUpcomingSchedules(Integer id) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM SCHEDULES WHERE class_id=? AND status='SCHEDULED' AND end_time>NOW()",
                Integer.class, id) > 0;
    }

    public Map<String, Object> schedule(Integer id) {
        return localTimes(jdbc.queryForMap("SELECT schedule_id scheduleId,class_id classId,start_time startTime,end_time endTime,changeover_minutes changeoverMinutes,status FROM SCHEDULES WHERE schedule_id=?", id));
    }

    public List<Map<String, Object>> scheduleBookings(Integer id) {
        return jdbc.queryForList("""
                SELECT b.booking_id bookingId,u.full_name fullName,u.email,u.phone,b.status,b.attendance_status attendanceStatus
                FROM BOOKINGS b JOIN USERS u ON u.user_id=b.user_id WHERE b.schedule_id=? ORDER BY u.full_name,b.booking_id
                """, id);
    }

    public boolean hasMemberConflict(Integer id, LocalDateTime start, LocalDateTime end) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM BOOKINGS own_b JOIN BOOKINGS other_b ON other_b.user_id=own_b.user_id
                JOIN SCHEDULES s ON s.schedule_id=other_b.schedule_id
                WHERE own_b.schedule_id=? AND other_b.schedule_id<>? AND own_b.status IN ('CONFIRMED','PENDING')
                  AND other_b.status IN ('CONFIRMED','PENDING') AND s.status<>'CANCELLED'
                  AND s.start_time<? AND s.end_time>?
                """, Integer.class, id, id, end, start) > 0;
    }

    public void notifyScheduleBookings(Integer id, String title, String message) {
        jdbc.update("""
                INSERT INTO NOTIFICATIONS(user_id,title,message,type,is_read,created_at)
                SELECT DISTINCT user_id,?,?,?,false,NOW() FROM BOOKINGS
                WHERE schedule_id=? AND status IN ('CONFIRMED','PENDING')
                """, title, message, "BOOKING", id);
    }

    // Members holding a confirmed seat in this class; each is booked into the session unless they are busy then.
    public Map<String, Integer> enrollClassMembers(Integer scheduleId) {
        var s = jdbc.queryForMap("SELECT sc.class_id classId,sc.start_time startTime,sc.end_time endTime,c.max_slots maxSlots FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id WHERE sc.schedule_id=?", scheduleId);
        List<Integer> members = jdbc.queryForList("""
                SELECT DISTINCT b.user_id FROM BOOKINGS b JOIN SCHEDULES x ON x.schedule_id=b.schedule_id
                WHERE x.class_id=? AND x.schedule_id<>? AND b.status='CONFIRMED' AND x.status<>'CANCELLED'
                """, Integer.class, s.get("classId"), scheduleId);
        int added = 0, skipped = 0;
        int seats = ((Number) s.get("maxSlots")).intValue() - jdbc.queryForObject("SELECT COUNT(*) FROM BOOKINGS WHERE schedule_id=? AND status IN ('CONFIRMED','PENDING')", Integer.class, scheduleId);
        for (Integer userId : members) {
            Integer busy = jdbc.queryForObject("""
                    SELECT COUNT(*) FROM BOOKINGS b JOIN SCHEDULES x ON x.schedule_id=b.schedule_id
                    WHERE b.user_id=? AND b.status IN ('CONFIRMED','PENDING') AND x.status<>'CANCELLED'
                      AND (x.schedule_id=? OR (x.start_time<? AND x.end_time>?))
                    """, Integer.class, userId, scheduleId, s.get("endTime"), s.get("startTime"));
            if (busy > 0 || seats <= 0) { skipped++; continue; }
            jdbc.update("INSERT INTO BOOKINGS(user_id,schedule_id,status,booking_time,attendance_status) VALUES (?,?,'CONFIRMED',NOW(),'NOT_YET')", userId, scheduleId);
            added++; seats--;
        }
        return Map.of("added", added, "skipped", skipped);
    }

    public void cancelScheduleBookings(Integer id) {
        jdbc.update("UPDATE BOOKINGS SET status='CANCELLED' WHERE schedule_id=? AND status IN ('CONFIRMED','PENDING')", id);
    }

    private Map<String, Object> localTimes(Map<String, Object> row) {
        row.replaceAll((key, value) -> value instanceof Timestamp timestamp ? timestamp.toLocalDateTime() : value);
        return row;
    }

    public Map<String, Object> dashboard() {
        return jdbc.queryForMap("""
                SELECT
                  (SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Member') totalMembers,
                  (SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Coach' AND u.status='ACTIVE') activeCoaches,
                  (SELECT COUNT(*) FROM CLASSES WHERE status='ACTIVE') activeClasses,
                  (SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE status='ACTIVE' AND start_date<=CURDATE() AND end_date >= CURDATE()) activeMemberships,
                  (SELECT COALESCE(SUM(amount),0) FROM PAYMENTS WHERE status IN ('SUCCESS','COMPLETED') AND YEAR(payment_date)=YEAR(CURDATE()) AND MONTH(payment_date)=MONTH(CURDATE())) monthlyRevenue,
                  (SELECT COUNT(*) FROM SCHEDULES WHERE status='SCHEDULED' AND start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)) upcomingSchedules,
                  (SELECT COUNT(*) FROM SCHEDULES WHERE status<>'CANCELLED' AND start_time>=CURDATE() AND start_time<DATE_ADD(CURDATE(), INTERVAL 1 DAY)) sessionsToday,
                  (SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE status='ACTIVE' AND start_date<=CURDATE() AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) expiringMemberships,
                  (SELECT COUNT(*) FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id
                   WHERE s.status='SCHEDULED' AND s.start_time>=NOW() AND s.start_time<DATE_ADD(CURDATE(), INTERVAL 8 DAY)
                   AND c.max_slots>0 AND (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id=s.schedule_id AND b.status IN ('CONFIRMED','PENDING'))<c.max_slots*0.25) lowRegistrationSessions
                """);
    }

    public List<Map<String, Object>> todaySessions() {
        return jdbc.queryForList("""
                SELECT s.schedule_id scheduleId,c.class_name className,u.full_name coachName,r.room_name roomName,
                       s.start_time startTime,s.end_time endTime,s.status,
                       (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id=s.schedule_id AND b.status IN ('CONFIRMED','PENDING')) booked,c.max_slots maxSlots
                FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id
                JOIN USERS u ON u.user_id=c.coach_id JOIN ROOMS r ON r.room_id=c.room_id
                WHERE s.status<>'CANCELLED' AND s.start_time>=CURDATE() AND s.start_time<DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                ORDER BY CASE WHEN s.end_time>NOW() THEN 0 ELSE 1 END,s.start_time,s.schedule_id LIMIT 6
                """).stream().map(this::localTimes).toList();
    }

    public List<Map<String, Object>> lowRegistrationSessions() {
        return jdbc.queryForList("""
                SELECT s.schedule_id scheduleId,c.class_name className,s.start_time startTime,r.room_name roomName,
                       (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id=s.schedule_id AND b.status IN ('CONFIRMED','PENDING')) booked,c.max_slots maxSlots
                FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id JOIN ROOMS r ON r.room_id=c.room_id
                WHERE s.status='SCHEDULED' AND s.start_time>=NOW() AND s.start_time<DATE_ADD(CURDATE(), INTERVAL 8 DAY)
                  AND c.max_slots>0
                  AND (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id=s.schedule_id AND b.status IN ('CONFIRMED','PENDING'))<c.max_slots*0.25
                ORDER BY s.start_time,s.schedule_id LIMIT 6
                """).stream().map(this::localTimes).toList();
    }

    public List<Map<String, Object>> expiringMemberships() {
        return jdbc.queryForList("""
                SELECT um.membership_id membershipId,u.full_name fullName,u.phone,p.package_name packageName,um.end_date endDate
                FROM USER_MEMBERSHIPS um JOIN USERS u ON u.user_id=um.user_id JOIN PACKAGES p ON p.package_id=um.package_id
                WHERE um.status='ACTIVE' AND um.start_date<=CURDATE() AND um.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY um.end_date,um.membership_id LIMIT 6
                """);
    }

    public List<Map<String, Object>> recentActivity() {
        return jdbc.queryForList("""
                SELECT 'PAYMENT' type, CONCAT('Payment #', payment_id) title,
                       CONCAT(FORMAT(amount,0),' VND - ',payment_method) detail, payment_date occurredAt
                FROM PAYMENTS WHERE status IN ('SUCCESS','COMPLETED')
                UNION ALL
                SELECT 'MEMBERSHIP', CONCAT('Membership for ',u.full_name), p.package_name, um.start_date
                FROM USER_MEMBERSHIPS um JOIN USERS u ON u.user_id=um.user_id JOIN PACKAGES p ON p.package_id=um.package_id
                ORDER BY occurredAt DESC LIMIT 8
                """);
    }

    public List<Map<String, Object>> users(String keyword, String role, String status) {
        String search = "%" + (keyword == null ? "" : keyword.trim()) + "%";
        var rows=jdbc.queryForList("""
                SELECT u.user_id userId,u.full_name fullName,u.email,u.phone,u.status,u.avatar_path avatarPath,
                       u.force_password_change forcePasswordChange,u.created_at joinedAt,
                       r.role_id roleId,r.role_name roleName
                FROM USERS u JOIN ROLES r ON r.role_id=u.role_id
                WHERE (u.full_name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone,'') LIKE ?)
                  AND (?='ALL' OR r.role_name=?) AND (?='ALL' OR u.status=?)
                ORDER BY u.user_id DESC
                """, search, search, search, role, role, status, status);
        var specialties=jdbc.queryForList("SELECT user_id userId,subject_id subjectId FROM USER_SUBJECTS ORDER BY subject_id");
        for(var row:rows)row.put("subjectIds",specialties.stream().filter(s->s.get("userId").equals(row.get("userId"))).map(s->((Number)s.get("subjectId")).intValue()).toList());
        return rows;
    }

    public boolean coachTeachesSubject(Integer coachId,Integer subjectId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM USER_SUBJECTS WHERE user_id=? AND subject_id=?",Integer.class,coachId,subjectId)>0;
    }
    public List<Integer> activeCoachSubjects(Integer coachId) {
        return jdbc.queryForList("SELECT DISTINCT subject_id FROM CLASSES WHERE coach_id=? AND status='ACTIVE'",Integer.class,coachId);
    }
    public void saveCoachSubjects(Integer coachId,List<Integer> subjects) {
        jdbc.update("DELETE FROM USER_SUBJECTS WHERE user_id=?",coachId);
        for(var subjectId:new java.util.HashSet<>(subjects)) {
            requireSubject(subjectId);
            jdbc.update("INSERT INTO USER_SUBJECTS(user_id,subject_id) VALUES (?,?)",coachId,subjectId);
        }
    }

    public List<Map<String, Object>> roles() {
        return jdbc.queryForList("SELECT role_id roleId,role_name roleName FROM ROLES ORDER BY role_id");
    }

    public List<Map<String, Object>> subjects() {
        var rows=jdbc.queryForList("""
            SELECT s.subject_id subjectId,s.subject_name subjectName,s.description,s.image_path imagePath,s.status,
                s.duration_minutes durationMinutes,s.slot_starts slotStarts,COUNT(c.class_id) classCount
            FROM SUBJECTS s LEFT JOIN CLASSES c ON c.subject_id=s.subject_id
            GROUP BY s.subject_id,s.subject_name,s.description,s.image_path,s.status,s.duration_minutes,s.slot_starts ORDER BY s.subject_name
            """);
        rows.forEach(row->row.put("slotStarts",parseStarts((String)row.get("slotStarts"))));return rows;
    }
    private List<java.time.LocalTime> parseStarts(String starts) {
        return starts==null || starts.isBlank()?List.of():java.util.Arrays.stream(starts.split(",")).map(java.time.LocalTime::parse).toList();
    }
    public com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy subjectPolicy(Integer subjectId) {
        var base=slotPolicy();
        var row=jdbc.queryForMap("SELECT duration_minutes,slot_starts FROM SUBJECTS WHERE subject_id=?",subjectId);
        return new com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy(base.opensAt(),base.closesAt(),base.breakMinutes(),((Number)row.get("duration_minutes")).intValue(),parseStarts((String)row.get("slot_starts")));
    }
    public com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy classSlotPolicy(Integer classId) {
        return subjectPolicy(jdbc.queryForObject("SELECT subject_id FROM CLASSES WHERE class_id=?",Integer.class,classId));
    }
    public int saveSubject(Integer id, ManagerRequests.SubjectRequest request) {
        if(id==null)id=insert("INSERT INTO SUBJECTS(subject_name,description) VALUES (?,?)",request.subjectName(),request.description());
        else jdbc.update("UPDATE SUBJECTS SET subject_name=?,description=? WHERE subject_id=?",request.subjectName(),request.description(),id);
        if(request.status()!=null)jdbc.update("UPDATE SUBJECTS SET status=? WHERE subject_id=?",request.status(),id);
        if(request.durationMinutes()!=null)jdbc.update("UPDATE SUBJECTS SET duration_minutes=? WHERE subject_id=?",request.durationMinutes(),id);
        if(request.slotStarts()!=null)jdbc.update("UPDATE SUBJECTS SET slot_starts=? WHERE subject_id=?",String.join(",",request.slotStarts().stream().sorted().map(Object::toString).toList()),id);
        return id;
    }

    public List<Map<String, Object>> rooms() {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT r.room_id roomId,r.room_name roomName,r.capacity,r.image_path imagePath,r.status,COUNT(c.class_id) classCount
                FROM ROOMS r LEFT JOIN CLASSES c ON c.room_id=r.room_id
                GROUP BY r.room_id,r.room_name,r.capacity,r.image_path,r.status ORDER BY r.room_name
                """);
        List<Map<String, Object>> links = jdbc.queryForList("SELECT room_id roomId,subject_id subjectId FROM ROOM_SUBJECTS");
        rows.forEach(row -> row.put("subjectIds", links.stream().filter(l -> l.get("roomId").equals(row.get("roomId"))).map(l -> ((Number) l.get("subjectId")).intValue()).toList()));
        return rows;
    }

    public void replaceRoomSubjects(int roomId, List<Integer> subjectIds) {
        jdbc.update("DELETE FROM ROOM_SUBJECTS WHERE room_id=?", roomId);
        for (Integer subjectId : new java.util.LinkedHashSet<>(subjectIds)) {
            requireSubject(subjectId);
            jdbc.update("INSERT INTO ROOM_SUBJECTS(room_id,subject_id) VALUES (?,?)", roomId, subjectId);
        }
    }

    public void linkRoomSubject(int roomId, int subjectId) {
        jdbc.update("INSERT IGNORE INTO ROOM_SUBJECTS(room_id,subject_id) VALUES (?,?)", roomId, subjectId);
    }

    public int saveRoom(Integer id, ManagerRequests.RoomRequest request) {
        if (id == null) {
            int created = insert("INSERT INTO ROOMS(room_name,capacity) VALUES (?,?)", request.roomName(), request.capacity());
            if (request.status() != null) jdbc.update("UPDATE ROOMS SET status=? WHERE room_id=?", request.status(), created);
            return created;
        }
        jdbc.update("UPDATE ROOMS SET room_name=?,capacity=? WHERE room_id=?", request.roomName(), request.capacity(), id);
        if (request.status() != null) jdbc.update("UPDATE ROOMS SET status=? WHERE room_id=?", request.status(), id);
        return id;
    }

    public Integer roomCapacity(Integer roomId) {
        List<Integer> values = jdbc.query("SELECT capacity FROM ROOMS WHERE room_id=?", (rs, row) -> rs.getInt(1), roomId);
        return values.isEmpty() ? null : values.get(0);
    }

    public List<Map<String, Object>> classes() {
        return jdbc.queryForList("""
                SELECT c.class_id classId,c.class_name className,c.subject_id subjectId,s.subject_name subjectName,
                       c.coach_id coachId,u.full_name coachName,u.avatar_path coachAvatarPath,c.room_id roomId,r.room_name roomName,r.image_path roomImagePath,
                       c.price,c.max_slots maxSlots,c.status,c.image_path imagePath,
                       COALESCE((SELECT MAX(booked) FROM (
                         SELECT sx.class_id,COUNT(*) booked FROM SCHEDULES sx JOIN BOOKINGS bx ON bx.schedule_id=sx.schedule_id
                         WHERE sx.status<>'CANCELLED' AND bx.status IN ('CONFIRMED','PENDING') GROUP BY sx.class_id,sx.schedule_id
                       ) counts WHERE counts.class_id=c.class_id),0) enrolled
                FROM CLASSES c JOIN SUBJECTS s ON s.subject_id=c.subject_id
                JOIN USERS u ON u.user_id=c.coach_id JOIN ROOMS r ON r.room_id=c.room_id
                LEFT JOIN SCHEDULES sc ON sc.class_id=c.class_id LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                GROUP BY c.class_id,c.class_name,c.subject_id,s.subject_name,c.coach_id,u.full_name,u.avatar_path,c.room_id,r.room_name,r.image_path,c.price,c.max_slots,c.status,c.image_path
                ORDER BY c.class_id DESC
                """);
    }

    public int saveClass(Integer id, ManagerRequests.ClassRequest request) {
        if (id == null) {
            return insert("INSERT INTO CLASSES(subject_id,coach_id,room_id,class_name,price,max_slots,status) VALUES (?,?,?,?,?,?,?)",
                    request.subjectId(), request.coachId(), request.roomId(), request.className(), request.price(), request.maxSlots(), request.status().toUpperCase(java.util.Locale.ROOT));
        }
        jdbc.update("UPDATE CLASSES SET subject_id=?,coach_id=?,room_id=?,class_name=?,price=?,max_slots=?,status=? WHERE class_id=?",
                request.subjectId(), request.coachId(), request.roomId(), request.className(), request.price(), request.maxSlots(), request.status().toUpperCase(java.util.Locale.ROOT), id);
        return id;
    }

    public void setClassStatus(Integer classId, String status) {
        jdbc.update("UPDATE CLASSES SET status=? WHERE class_id=?", status, classId);
    }

    public String roomStatus(Integer roomId) {
        List<String> v = jdbc.queryForList("SELECT status FROM ROOMS WHERE room_id=?", String.class, roomId);
        return v.isEmpty() ? null : v.get(0);
    }

    public String subjectStatus(Integer subjectId) {
        List<String> v = jdbc.queryForList("SELECT status FROM SUBJECTS WHERE subject_id=?", String.class, subjectId);
        return v.isEmpty() ? null : v.get(0);
    }

    public List<Integer> upcomingScheduleIds(Integer classId) {
        return jdbc.queryForList("SELECT schedule_id FROM SCHEDULES WHERE class_id=? AND status='SCHEDULED' AND end_time>NOW() ORDER BY start_time", Integer.class, classId);
    }

    // First session that would clash if the class moved to this coach/room, for a precise error message.
    public Map<String, Object> assignmentConflict(Integer classId, Integer coachId, Integer roomId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT other_c.class_name otherClass,other_sc.start_time startTime,IF(other_c.coach_id=?,'coach','room') clash
                FROM SCHEDULES own_sc
                JOIN SCHEDULES other_sc ON other_sc.schedule_id <> own_sc.schedule_id
                  AND other_sc.status <> 'CANCELLED'
                  AND other_sc.start_time < TIMESTAMPADD(MINUTE,own_sc.changeover_minutes,own_sc.end_time) AND TIMESTAMPADD(MINUTE,other_sc.changeover_minutes,other_sc.end_time) > own_sc.start_time
                JOIN CLASSES other_c ON other_c.class_id=other_sc.class_id
                WHERE own_sc.class_id=? AND own_sc.status <> 'CANCELLED' AND own_sc.end_time>NOW()
                  AND other_c.class_id <> ? AND (other_c.coach_id=? OR other_c.room_id=?)
                ORDER BY other_sc.start_time LIMIT 1
                """, coachId, classId, classId, coachId, roomId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public boolean hasAssignmentConflict(Integer classId, Integer coachId, Integer roomId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM SCHEDULES own_sc
                JOIN SCHEDULES other_sc ON other_sc.schedule_id <> own_sc.schedule_id
                  AND other_sc.status <> 'CANCELLED'
                  AND other_sc.start_time < TIMESTAMPADD(MINUTE,own_sc.changeover_minutes,own_sc.end_time) AND TIMESTAMPADD(MINUTE,other_sc.changeover_minutes,other_sc.end_time) > own_sc.start_time
                JOIN CLASSES other_c ON other_c.class_id=other_sc.class_id
                WHERE own_sc.class_id=? AND own_sc.status <> 'CANCELLED'
                  AND other_c.class_id <> ? AND (other_c.coach_id=? OR other_c.room_id=?)
                """, Integer.class, classId, classId, coachId, roomId);
        return count != null && count > 0;
    }

    public List<Map<String, Object>> schedules(LocalDate from, LocalDate to) {
        return jdbc.queryForList("""
                SELECT sc.schedule_id scheduleId,sc.class_id classId,c.class_name className,
                       c.coach_id coachId,u.full_name coachName,u.avatar_path coachAvatarPath,c.room_id roomId,r.room_name roomName,c.image_path classImagePath,r.image_path roomImagePath,
                       sc.start_time startTime,sc.end_time endTime,sc.status,
                       COUNT(CASE WHEN b.status IN ('CONFIRMED','PENDING') THEN 1 END) booked,c.max_slots maxSlots
                FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id JOIN USERS u ON u.user_id=c.coach_id
                JOIN ROOMS r ON r.room_id=c.room_id LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                WHERE sc.start_time >= ? AND sc.start_time < ?
                GROUP BY sc.schedule_id,sc.class_id,c.class_name,c.coach_id,u.full_name,u.avatar_path,c.room_id,r.room_name,c.image_path,r.image_path,sc.start_time,sc.end_time,sc.status,c.max_slots
                ORDER BY sc.start_time
                """, from.atStartOfDay(), to.plusDays(1).atStartOfDay()).stream().map(this::localTimes).toList();
    }

    public Map<String, Object> classAssignment(Integer classId) {
        return jdbc.queryForMap("SELECT subject_id subjectId,coach_id coachId,room_id roomId,status,class_name className FROM CLASSES WHERE class_id=?", classId);
    }

    public com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy slotPolicy() {
        return jdbc.queryForObject("SELECT opens_at,closes_at,break_minutes FROM CENTER_SCHEDULE_POLICY WHERE policy_id=1",
            (rs,n)->new com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy(rs.getTime(1).toLocalTime(),rs.getTime(2).toLocalTime(),rs.getInt(3)));
    }
    public void saveSlotPolicy(com.team4.sportscenter.modules.manager.services.TeachingSlots.Policy p) {
        jdbc.update("UPDATE CENTER_SCHEDULE_POLICY SET opens_at=?,closes_at=?,break_minutes=? WHERE policy_id=1",p.opensAt(),p.closesAt(),p.breakMinutes());
    }
    public void setChangeover(int id,int minutes) { jdbc.update("UPDATE SCHEDULES SET changeover_minutes=? WHERE schedule_id=?",minutes,id); }
    public boolean hasScheduleConflict(Integer scheduleId, Integer coachId, Integer roomId, LocalDateTime start, LocalDateTime end) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id
                WHERE sc.status <> 'CANCELLED' AND sc.schedule_id <> COALESCE(?, -1)
                  AND (c.coach_id=? OR c.room_id=?) AND sc.start_time < ? AND TIMESTAMPADD(MINUTE,sc.changeover_minutes,sc.end_time) > ?
                """, Integer.class, scheduleId, coachId, roomId, end, start);
        return count != null && count > 0;
    }

    public int saveSchedule(Integer id, ManagerRequests.ScheduleRequest request) {
        if (id == null) {
            return insert("INSERT INTO SCHEDULES(class_id,start_time,end_time,status) VALUES (?,?,?,?)",
                    request.classId(), request.startTime(), request.endTime(), request.status().toUpperCase(java.util.Locale.ROOT));
        }
        jdbc.update("UPDATE SCHEDULES SET class_id=?,start_time=?,end_time=?,status=? WHERE schedule_id=?",
                request.classId(), request.startTime(), request.endTime(), request.status().toUpperCase(java.util.Locale.ROOT), id);
        return id;
    }

    public List<Map<String, Object>> packages() {
        return jdbc.queryForList("""
                SELECT p.package_id packageId,p.package_name packageName,p.package_type packageType,
                       p.duration_days durationDays,p.price,p.image_path imagePath,p.selling_status sellingStatus,p.purchase_limit_per_member purchaseLimitPerMember,
                       COUNT(um.membership_id) subscribers,
                       COUNT(CASE WHEN um.status='ACTIVE' AND um.start_date<=CURDATE() AND um.end_date>=CURDATE() THEN 1 END) activeSubscribers
                FROM PACKAGES p LEFT JOIN USER_MEMBERSHIPS um ON um.package_id=p.package_id
                GROUP BY p.package_id,p.package_name,p.package_type,p.duration_days,p.price,p.image_path,p.selling_status,p.purchase_limit_per_member ORDER BY p.package_id DESC
                """);
    }

    public int savePackage(Integer id, ManagerRequests.PackageRequest request) {
        if (id == null) {
            return insert("INSERT INTO PACKAGES(package_name,package_type,duration_days,price,selling_status) VALUES (?,?,?,?,'SELLING')",
                    request.packageName(), request.packageType(), request.durationDays(), request.price());
        }
        jdbc.update("UPDATE PACKAGES SET package_name=?,package_type=?,duration_days=?,price=? WHERE package_id=?",
                request.packageName(), request.packageType(), request.durationDays(), request.price(), id);
        return id;
    }

    public boolean hasClassBookings(Integer classId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM BOOKINGS b JOIN SCHEDULES s ON s.schedule_id=b.schedule_id WHERE s.class_id=? AND b.status<>'CANCELLED'", Integer.class,classId)>0;
    }

    public List<com.team4.sportscenter.modules.manager.services.SchedulePlanner.BusyPeriod> occupiedSlots(
            Integer coachId, Integer roomId, LocalDateTime from, LocalDateTime to) {
        return jdbc.query("SELECT s.start_time,TIMESTAMPADD(MINUTE,s.changeover_minutes,s.end_time) FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id WHERE s.status<>'CANCELLED' AND (c.coach_id=? OR c.room_id=?) AND s.start_time < ? AND TIMESTAMPADD(MINUTE,s.changeover_minutes,s.end_time) > ?",
                (rs,n)->new com.team4.sportscenter.modules.manager.services.SchedulePlanner.BusyPeriod(rs.getTimestamp(1).toLocalDateTime(),rs.getTimestamp(2).toLocalDateTime()),coachId,roomId,to,from);
    }

    private String[] imageTarget(String resource) {
        // All SQL identifiers come from this fixed whitelist, never from request input.
        return switch (resource) {
            case "subjects" -> new String[] { "SUBJECTS", "subject_id" };
            case "rooms" -> new String[] { "ROOMS", "room_id" };
            case "classes" -> new String[] { "CLASSES", "class_id" };
            case "packages" -> new String[] { "PACKAGES", "package_id" };
            default -> throw new IllegalArgumentException("Unsupported image resource.");
        };
    }

    public String lockResourceImage(String resource, Integer id) {
        String[] target = imageTarget(resource);
        return jdbc.queryForObject("SELECT image_path FROM " + target[0] + " WHERE " + target[1] + "=? FOR UPDATE", (rs, row) -> rs.getString(1), id);
    }

    public void updateResourceImage(String resource, Integer id, String imagePath) {
        String[] target = imageTarget(resource);
        jdbc.update("UPDATE " + target[0] + " SET image_path=? WHERE " + target[1] + "=?", imagePath, id);
    }

    public Map<String, Object> report(LocalDate from, LocalDate to) {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        // Comparison window: the same number of days immediately before the selected range.
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate previousTo = from.minusDays(1);
        LocalDate previousFrom = previousTo.minusDays(days - 1);
        result.put("summary", summary(from, to));
        result.put("previousPeriod", Map.of("from", previousFrom.toString(), "to", previousTo.toString()));
        Map<String, Object> previous = new java.util.LinkedHashMap<>(summary(previousFrom, previousTo));
        previous.put("newMembers", jdbc.queryForObject("""
                SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id
                WHERE r.role_name='Member' AND u.created_at>=? AND u.created_at<?
                """, Long.class, previousFrom.atStartOfDay(), previousTo.plusDays(1).atStartOfDay()));
        result.put("previousSummary", previous);
        result.put("memberGrowth", jdbc.queryForMap("""
                SELECT COUNT(CASE WHEN u.created_at>=? AND u.created_at<? THEN 1 END) newMembers,
                       COUNT(CASE WHEN u.created_at IS NULL THEN 1 END) unknownCreationDates
                FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Member'
                """, from.atStartOfDay(),to.plusDays(1).atStartOfDay()));
        result.put("bookingStatuses", jdbc.queryForList("""
                SELECT b.status status,COUNT(*) value FROM BOOKINGS b
                WHERE b.booking_time>=? AND b.booking_time<?
                GROUP BY b.status ORDER BY b.status
                """,from.atStartOfDay(),to.plusDays(1).atStartOfDay()));
        result.put("revenueByDay", jdbc.queryForList("""
                SELECT DATE_FORMAT(p.payment_date,'%Y-%m-%d') label,SUM(p.amount) value FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id
                WHERE p.status IN ('SUCCESS','COMPLETED') AND i.status<>'REVIEW' AND DATE(p.payment_date) BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(p.payment_date,'%Y-%m-%d') ORDER BY label
                """, from, to));
        result.put("memberships", jdbc.queryForList("""
                SELECT p.package_name label,COUNT(um.membership_id) value
                FROM PACKAGES p LEFT JOIN USER_MEMBERSHIPS um ON um.package_id=p.package_id AND um.start_date BETWEEN ? AND ?
                GROUP BY p.package_id,p.package_name ORDER BY value DESC
                """, from, to));
        // Popularity counts each member once per class: one registration creates one booking per session,
        // so counting bookings would rank classes by how many sessions they have, not by demand.
        result.put("classPopularity", jdbc.queryForList("""
                SELECT c.class_id classId,c.class_name label,s.subject_name subject,u.full_name coach,
                       COUNT(DISTINCT CASE WHEN b.status='CONFIRMED' THEN b.user_id END) students,
                       COUNT(DISTINCT CASE WHEN b.status='CONFIRMED' AND b.booking_time>=? AND b.booking_time<? THEN b.user_id END) newStudents
                FROM CLASSES c JOIN SCHEDULES sc ON sc.class_id=c.class_id AND sc.status<>'CANCELLED'
                  AND sc.start_time>=? AND sc.start_time<?
                JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                LEFT JOIN SUBJECTS s ON s.subject_id=c.subject_id
                LEFT JOIN USERS u ON u.user_id=c.coach_id
                GROUP BY c.class_id,c.class_name,s.subject_name,u.full_name
                HAVING students>0 ORDER BY students DESC,newStudents DESC,c.class_name LIMIT 10
                """, from.atStartOfDay(), to.plusDays(1).atStartOfDay(), from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
        // Lowest occupancy first: these are the classes a manager needs to act on.
        result.put("classOccupancy", jdbc.queryForList("""
                SELECT c.class_id classId,c.class_name label,s.subject_name subject,u.full_name coach,
                       c.max_slots*COUNT(DISTINCT sc.schedule_id) capacity,COUNT(DISTINCT sc.schedule_id) sessions,
                       COUNT(CASE WHEN b.status='CONFIRMED' THEN 1 END) value,
                       COUNT(DISTINCT CASE WHEN b.status='CONFIRMED' THEN b.user_id END) students
                FROM CLASSES c JOIN SCHEDULES sc ON sc.class_id=c.class_id AND sc.status<>'CANCELLED'
                  AND sc.start_time>=? AND sc.start_time<?
                LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                LEFT JOIN SUBJECTS s ON s.subject_id=c.subject_id
                LEFT JOIN USERS u ON u.user_id=c.coach_id
                GROUP BY c.class_id,c.class_name,c.max_slots,s.subject_name,u.full_name
                ORDER BY COUNT(CASE WHEN b.status='CONFIRMED' THEN 1 END)/NULLIF(c.max_slots*COUNT(DISTINCT sc.schedule_id),0) ASC,c.class_name
                LIMIT 10
                """, from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
        return result;
    }

    private Map<String, Object> summary(LocalDate from, LocalDate to) {
        return jdbc.queryForMap("""
                SELECT
                  (SELECT COALESCE(SUM(p.amount),0) FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id WHERE p.status IN ('SUCCESS','COMPLETED') AND i.status<>'REVIEW' AND DATE(p.payment_date) BETWEEN ? AND ?) revenue,
                  (SELECT COUNT(*) FROM PAYMENTS p JOIN INVOICES i ON i.invoice_id=p.invoice_id WHERE p.status IN ('SUCCESS','COMPLETED') AND i.status<>'REVIEW' AND DATE(p.payment_date) BETWEEN ? AND ?) successfulPayments,
                  (SELECT COUNT(*) FROM INVOICES WHERE status='PENDING' AND DATE(created_at) BETWEEN ? AND ?) pendingInvoices,
                  (SELECT COUNT(*) FROM BOOKINGS b JOIN SCHEDULES sc ON sc.schedule_id=b.schedule_id
                    WHERE b.status='CONFIRMED' AND DATE(sc.start_time) BETWEEN ? AND ?) confirmedBookings
                """, from, to, from, to, from, to, from, to);
    }

    private int insert(String sql, Object... values) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < values.length; i++) {
                statement.setObject(i + 1, values[i]);
            }
            return statement;
        }, keyHolder);
        if (keyHolder.getKey() == null) {
            throw new IllegalStateException("Unable to create a new record");
        }
        return keyHolder.getKey().intValue();
    }

    public Map<String, Object> coachTeachingReport(LocalDate from, LocalDate to, Integer selectedCoachId) {
        LocalDateTime now = centerNow();
        LocalDateTime fromTime = from.atStartOfDay();
        LocalDateTime toTime = to.plusDays(1).atStartOfDay();

        // 1. All active coaches for dropdown
        List<Map<String, Object>> coaches = jdbc.queryForList("""
                SELECT u.user_id id, u.full_name name, u.email email, u.avatar_path avatar
                FROM USERS u
                JOIN ROLES r ON r.role_id = u.role_id
                WHERE r.role_name = 'Coach' AND u.status = 'ACTIVE'
                ORDER BY u.full_name ASC
                """);

        // 2. Fetch all sessions in the range with coach, class, room, and booking counts
        List<Map<String, Object>> rawSessions = jdbc.queryForList("""
                SELECT
                    s.schedule_id scheduleId,
                    s.class_id classId,
                    c.class_name className,
                    sub.subject_name subjectName,
                    r.room_name roomName,
                    s.start_time startTime,
                    s.end_time endTime,
                    s.status status,
                    c.max_slots maxSlots,
                    c.coach_id originalCoachId,
                    orig_u.full_name originalCoachName,
                    s.substitute_coach_id substituteCoachId,
                    sub_u.full_name substituteCoachName,
                    COALESCE(s.substitute_coach_id, c.coach_id) actualCoachId,
                    COALESCE(sub_u.full_name, orig_u.full_name) actualCoachName,
                    (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id = s.schedule_id AND b.status = 'CONFIRMED') bookedStudents,
                    (SELECT COUNT(*) FROM BOOKINGS b WHERE b.schedule_id = s.schedule_id AND b.status = 'CONFIRMED' AND b.attendance_status = 'PRESENT') presentStudents
                FROM SCHEDULES s
                JOIN CLASSES c ON c.class_id = s.class_id
                LEFT JOIN SUBJECTS sub ON sub.subject_id = c.subject_id
                LEFT JOIN ROOMS r ON r.room_id = c.room_id
                LEFT JOIN USERS orig_u ON orig_u.user_id = c.coach_id
                LEFT JOIN USERS sub_u ON sub_u.user_id = s.substitute_coach_id
                WHERE s.start_time >= ? AND s.start_time < ?
                ORDER BY s.start_time ASC
                """, fromTime, toTime);

        // 3. Unique students per actual coach for completed sessions in range
        Map<Integer, Integer> uniqueStudentsMap = new java.util.HashMap<>();
        List<Map<String, Object>> uniqueRows = jdbc.queryForList("""
                SELECT COALESCE(s.substitute_coach_id, c.coach_id) actualCoachId,
                       COUNT(DISTINCT b.user_id) uniqueCount
                FROM BOOKINGS b
                JOIN SCHEDULES s ON s.schedule_id = b.schedule_id
                JOIN CLASSES c ON c.class_id = s.class_id
                WHERE b.status = 'CONFIRMED' AND s.status <> 'CANCELLED' AND s.end_time <= ?
                  AND s.start_time >= ? AND s.start_time < ?
                GROUP BY COALESCE(s.substitute_coach_id, c.coach_id)
                """, now, fromTime, toTime);
        for (Map<String, Object> uRow : uniqueRows) {
            Number cid = (Number) uRow.get("actualCoachId");
            Number cnt = (Number) uRow.get("uniqueCount");
            if (cid != null && cnt != null) {
                uniqueStudentsMap.put(cid.intValue(), cnt.intValue());
            }
        }

        // 4. Group session metrics by coach
        Map<Integer, CoachStatAccumulator> accumulators = new java.util.LinkedHashMap<>();
        for (Map<String, Object> coach : coaches) {
            int cid = ((Number) coach.get("id")).intValue();
            accumulators.put(cid, new CoachStatAccumulator(
                    cid,
                    (String) coach.get("name"),
                    (String) coach.get("email"),
                    (String) coach.get("avatar")
            ));
        }

        List<Map<String, Object>> processedSessions = new java.util.ArrayList<>();

        for (Map<String, Object> session : rawSessions) {
            localTimes(session);
            LocalDateTime start = (LocalDateTime) session.get("startTime");
            LocalDateTime end = (LocalDateTime) session.get("endTime");
            String status = (String) session.get("status");
            boolean isCancelled = "CANCELLED".equalsIgnoreCase(status);
            boolean isCompleted = !isCancelled && end != null && !end.isAfter(now);
            boolean isScheduled = !isCancelled && end != null && end.isAfter(now);

            String computedStatus = isCancelled ? "CANCELLED" : (isCompleted ? "COMPLETED" : "SCHEDULED");
            session.put("status", computedStatus);

            long durationMinutes = (start != null && end != null) ? java.time.Duration.between(start, end).toMinutes() : 0;
            double hours = Math.round((durationMinutes / 60.0) * 10.0) / 10.0;
            session.put("durationMinutes", durationMinutes);
            session.put("durationHours", hours);

            Number origCoachIdNum = (Number) session.get("originalCoachId");
            Number subCoachIdNum = (Number) session.get("substituteCoachId");
            Number actualCoachIdNum = (Number) session.get("actualCoachId");
            int origCoachId = origCoachIdNum != null ? origCoachIdNum.intValue() : 0;
            Integer subCoachId = subCoachIdNum != null ? subCoachIdNum.intValue() : null;
            int actualCoachId = actualCoachIdNum != null ? actualCoachIdNum.intValue() : 0;

            boolean isSubstitute = subCoachId != null && !subCoachId.equals(origCoachId);
            session.put("isSubstitute", isSubstitute);

            String origCoachName = (String) session.get("originalCoachName");
            String subCoachName = (String) session.get("substituteCoachName");

            if (isSubstitute) {
                session.put("substituteNote", "Dạy thay cho " + (origCoachName != null ? origCoachName : "HLV chính"));
            } else {
                session.put("substituteNote", null);
            }

            int maxSlots = session.get("maxSlots") != null ? ((Number) session.get("maxSlots")).intValue() : 0;
            int bookedStudents = session.get("bookedStudents") != null ? ((Number) session.get("bookedStudents")).intValue() : 0;
            int presentStudents = session.get("presentStudents") != null ? ((Number) session.get("presentStudents")).intValue() : 0;

            double occRate = maxSlots > 0 ? Math.round((bookedStudents * 100.0 / maxSlots) * 10.0) / 10.0 : 0.0;
            session.put("occupancyRate", occRate);

            // Accumulate for actual coach (who actually taught / is scheduled)
            CoachStatAccumulator actualAcc = accumulators.get(actualCoachId);
            if (actualAcc != null) {
                actualAcc.totalSessions++;
                if (isCancelled) {
                    actualAcc.cancelledSessions++;
                } else if (isCompleted) {
                    actualAcc.completedSessions++;
                    actualAcc.totalMinutes += durationMinutes;
                    actualAcc.totalStudents += bookedStudents;
                    actualAcc.attendedStudents += presentStudents;
                    actualAcc.totalCapacity += maxSlots;
                } else if (isScheduled) {
                    actualAcc.scheduledSessions++;
                }
                if (isSubstitute) {
                    actualAcc.substituteSessionsCount++;
                }
            }

            // Accumulate transferred sessions for original coach
            if (isSubstitute) {
                CoachStatAccumulator origAcc = accumulators.get(origCoachId);
                if (origAcc != null) {
                    origAcc.transferredSessionsCount++;
                }
            }

            // Filter sessions for output based on selectedCoachId
            if (selectedCoachId == null || selectedCoachId <= 0) {
                processedSessions.add(session);
            } else if (actualCoachId == selectedCoachId) {
                processedSessions.add(session);
            } else if (origCoachId == selectedCoachId && isSubstitute) {
                // Also display the transferred session with explicit note
                Map<String, Object> transferredCopy = new java.util.LinkedHashMap<>(session);
                transferredCopy.put("isTransferred", true);
                transferredCopy.put("substituteNote", "Đã nhờ " + (subCoachName != null ? subCoachName : "HLV khác") + " dạy thay");
                processedSessions.add(transferredCopy);
            }
        }

        // Build coachStats list
        List<Map<String, Object>> coachStats = new java.util.ArrayList<>();
        int overviewCompleted = 0;
        int overviewScheduled = 0;
        int overviewCancelled = 0;
        int overviewSubstitute = 0;
        long overviewTotalMinutes = 0;
        int overviewStudents = 0;
        int overviewCapacity = 0;

        for (CoachStatAccumulator acc : accumulators.values()) {
            if (selectedCoachId != null && selectedCoachId > 0 && acc.coachId != selectedCoachId) {
                continue;
            }
            int uCount = uniqueStudentsMap.getOrDefault(acc.coachId, 0);
            double totalHours = Math.round((acc.totalMinutes / 60.0) * 10.0) / 10.0;
            double avgOcc = acc.totalCapacity > 0
                    ? Math.round((acc.totalStudents * 100.0 / acc.totalCapacity) * 10.0) / 10.0
                    : 0.0;

            Map<String, Object> stat = new java.util.LinkedHashMap<>();
            stat.put("coachId", acc.coachId);
            stat.put("coachName", acc.coachName);
            stat.put("coachEmail", acc.coachEmail);
            stat.put("avatarPath", acc.avatarPath);
            stat.put("completedSessions", acc.completedSessions);
            stat.put("scheduledSessions", acc.scheduledSessions);
            stat.put("cancelledSessions", acc.cancelledSessions);
            stat.put("totalSessions", acc.totalSessions);
            stat.put("totalHours", totalHours);
            stat.put("substituteSessionsCount", acc.substituteSessionsCount);
            stat.put("transferredSessionsCount", acc.transferredSessionsCount);
            stat.put("totalStudents", acc.totalStudents);
            stat.put("attendedStudents", acc.attendedStudents);
            stat.put("uniqueStudents", uCount);
            stat.put("totalCapacity", acc.totalCapacity);
            stat.put("avgOccupancyRate", avgOcc);

            coachStats.add(stat);

            overviewCompleted += acc.completedSessions;
            overviewScheduled += acc.scheduledSessions;
            overviewCancelled += acc.cancelledSessions;
            overviewSubstitute += acc.substituteSessionsCount;
            overviewTotalMinutes += acc.totalMinutes;
            overviewStudents += acc.totalStudents;
            overviewCapacity += acc.totalCapacity;
        }

        double overviewHours = Math.round((overviewTotalMinutes / 60.0) * 10.0) / 10.0;
        double overviewOcc = overviewCapacity > 0
                ? Math.round((overviewStudents * 100.0 / overviewCapacity) * 10.0) / 10.0
                : 0.0;

        Map<String, Object> overview = new java.util.LinkedHashMap<>();
        overview.put("totalCoaches", coaches.size());
        overview.put("completedSessions", overviewCompleted);
        overview.put("scheduledSessions", overviewScheduled);
        overview.put("cancelledSessions", overviewCancelled);
        overview.put("substituteSessions", overviewSubstitute);
        overview.put("totalTeachingHours", overviewHours);
        overview.put("totalStudents", overviewStudents);
        overview.put("avgOccupancyRate", overviewOcc);

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("coaches", coaches);
        response.put("overview", overview);
        response.put("coachStats", coachStats);
        response.put("sessions", processedSessions);
        response.put("selectedCoachId", selectedCoachId);
        response.put("from", from.toString());
        response.put("to", to.toString());

        return response;
    }

    private static class CoachStatAccumulator {
        final int coachId;
        final String coachName;
        final String coachEmail;
        final String avatarPath;
        int completedSessions = 0;
        int scheduledSessions = 0;
        int cancelledSessions = 0;
        int totalSessions = 0;
        long totalMinutes = 0;
        int substituteSessionsCount = 0;
        int transferredSessionsCount = 0;
        int totalStudents = 0;
        int attendedStudents = 0;
        int totalCapacity = 0;

        CoachStatAccumulator(int coachId, String coachName, String coachEmail, String avatarPath) {
            this.coachId = coachId;
            this.coachName = coachName;
            this.coachEmail = coachEmail;
            this.avatarPath = avatarPath;
        }
    }
}
