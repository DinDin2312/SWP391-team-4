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
    private static final String SESSION_SQL = "SELECT s.schedule_id scheduleId,s.class_id classId,c.class_name className,u.full_name coachName,r.room_name roomName,s.start_time startTime,s.end_time endTime,s.status," + BOOKED_SQL + " booked,c.max_slots maxSlots FROM SCHEDULES s JOIN CLASSES c ON c.class_id=s.class_id JOIN USERS u ON u.user_id=c.coach_id JOIN ROOMS r ON r.room_id=c.room_id ";

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
        return localTimes(jdbc.queryForMap("SELECT schedule_id scheduleId,class_id classId,start_time startTime,end_time endTime,status FROM SCHEDULES WHERE schedule_id=?", id));
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
                  (SELECT COALESCE(SUM(amount),0) FROM PAYMENTS WHERE status='SUCCESS' AND YEAR(payment_date)=YEAR(CURDATE()) AND MONTH(payment_date)=MONTH(CURDATE())) monthlyRevenue,
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
                FROM PAYMENTS WHERE status='SUCCESS'
                UNION ALL
                SELECT 'MEMBERSHIP', CONCAT('Membership for ',u.full_name), p.package_name, um.start_date
                FROM USER_MEMBERSHIPS um JOIN USERS u ON u.user_id=um.user_id JOIN PACKAGES p ON p.package_id=um.package_id
                ORDER BY occurredAt DESC LIMIT 8
                """);
    }

    public List<Map<String, Object>> users(String keyword, String role, String status) {
        String search = "%" + (keyword == null ? "" : keyword.trim()) + "%";
        return jdbc.queryForList("""
                SELECT u.user_id userId,u.full_name fullName,u.email,u.phone,u.status,u.avatar_path avatarPath,
                       u.force_password_change forcePasswordChange,
                       r.role_id roleId,r.role_name roleName
                FROM USERS u JOIN ROLES r ON r.role_id=u.role_id
                WHERE (u.full_name LIKE ? OR u.email LIKE ? OR COALESCE(u.phone,'') LIKE ?)
                  AND (?='ALL' OR r.role_name=?) AND (?='ALL' OR u.status=?)
                ORDER BY u.user_id DESC
                """, search, search, search, role, role, status, status);
    }

    public List<Map<String, Object>> roles() {
        return jdbc.queryForList("SELECT role_id roleId,role_name roleName FROM ROLES ORDER BY role_id");
    }

    public List<Map<String, Object>> subjects() {
        return jdbc.queryForList("""
                SELECT s.subject_id subjectId,s.subject_name subjectName,s.description,
                       COUNT(c.class_id) classCount
                FROM SUBJECTS s LEFT JOIN CLASSES c ON c.subject_id=s.subject_id
                GROUP BY s.subject_id,s.subject_name,s.description ORDER BY s.subject_name
                """);
    }

    public int saveSubject(Integer id, ManagerRequests.SubjectRequest request) {
        if (id == null) {
            return insert("INSERT INTO SUBJECTS(subject_name,description) VALUES (?,?)", request.subjectName(), request.description());
        }
        jdbc.update("UPDATE SUBJECTS SET subject_name=?,description=? WHERE subject_id=?", request.subjectName(), request.description(), id);
        return id;
    }

    public List<Map<String, Object>> rooms() {
        return jdbc.queryForList("""
                SELECT r.room_id roomId,r.room_name roomName,r.capacity,COUNT(c.class_id) classCount
                FROM ROOMS r LEFT JOIN CLASSES c ON c.room_id=r.room_id
                GROUP BY r.room_id,r.room_name,r.capacity ORDER BY r.room_name
                """);
    }

    public int saveRoom(Integer id, ManagerRequests.RoomRequest request) {
        if (id == null) {
            return insert("INSERT INTO ROOMS(room_name,capacity) VALUES (?,?)", request.roomName(), request.capacity());
        }
        jdbc.update("UPDATE ROOMS SET room_name=?,capacity=? WHERE room_id=?", request.roomName(), request.capacity(), id);
        return id;
    }

    public Integer roomCapacity(Integer roomId) {
        List<Integer> values = jdbc.query("SELECT capacity FROM ROOMS WHERE room_id=?", (rs, row) -> rs.getInt(1), roomId);
        return values.isEmpty() ? null : values.get(0);
    }

    public List<Map<String, Object>> classes() {
        return jdbc.queryForList("""
                SELECT c.class_id classId,c.class_name className,c.subject_id subjectId,s.subject_name subjectName,
                       c.coach_id coachId,u.full_name coachName,c.room_id roomId,r.room_name roomName,
                       c.price,c.max_slots maxSlots,c.status,
                       COALESCE((SELECT MAX(booked) FROM (
                         SELECT sx.class_id,COUNT(*) booked FROM SCHEDULES sx JOIN BOOKINGS bx ON bx.schedule_id=sx.schedule_id
                         WHERE sx.status<>'CANCELLED' AND bx.status IN ('CONFIRMED','PENDING') GROUP BY sx.class_id,sx.schedule_id
                       ) counts WHERE counts.class_id=c.class_id),0) enrolled
                FROM CLASSES c JOIN SUBJECTS s ON s.subject_id=c.subject_id
                JOIN USERS u ON u.user_id=c.coach_id JOIN ROOMS r ON r.room_id=c.room_id
                LEFT JOIN SCHEDULES sc ON sc.class_id=c.class_id LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                GROUP BY c.class_id,c.class_name,c.subject_id,s.subject_name,c.coach_id,u.full_name,c.room_id,r.room_name,c.price,c.max_slots,c.status
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

    public boolean hasAssignmentConflict(Integer classId, Integer coachId, Integer roomId) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM SCHEDULES own_sc
                JOIN SCHEDULES other_sc ON other_sc.schedule_id <> own_sc.schedule_id
                  AND other_sc.status <> 'CANCELLED'
                  AND other_sc.start_time < own_sc.end_time AND other_sc.end_time > own_sc.start_time
                JOIN CLASSES other_c ON other_c.class_id=other_sc.class_id
                WHERE own_sc.class_id=? AND own_sc.status <> 'CANCELLED'
                  AND other_c.class_id <> ? AND (other_c.coach_id=? OR other_c.room_id=?)
                """, Integer.class, classId, classId, coachId, roomId);
        return count != null && count > 0;
    }

    public List<Map<String, Object>> schedules(LocalDate from, LocalDate to) {
        return jdbc.queryForList("""
                SELECT sc.schedule_id scheduleId,sc.class_id classId,c.class_name className,
                       c.coach_id coachId,u.full_name coachName,c.room_id roomId,r.room_name roomName,
                       sc.start_time startTime,sc.end_time endTime,sc.status,
                       COUNT(CASE WHEN b.status IN ('CONFIRMED','PENDING') THEN 1 END) booked,c.max_slots maxSlots
                FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id JOIN USERS u ON u.user_id=c.coach_id
                JOIN ROOMS r ON r.room_id=c.room_id LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                WHERE sc.start_time >= ? AND sc.start_time < ?
                GROUP BY sc.schedule_id,sc.class_id,c.class_name,c.coach_id,u.full_name,c.room_id,r.room_name,sc.start_time,sc.end_time,sc.status,c.max_slots
                ORDER BY sc.start_time
                """, from.atStartOfDay(), to.plusDays(1).atStartOfDay()).stream().map(this::localTimes).toList();
    }

    public Map<String, Object> classAssignment(Integer classId) {
        return jdbc.queryForMap("SELECT coach_id coachId,room_id roomId,status,class_name className FROM CLASSES WHERE class_id=?", classId);
    }

    public boolean hasScheduleConflict(Integer scheduleId, Integer coachId, Integer roomId, LocalDateTime start, LocalDateTime end) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id
                WHERE sc.status <> 'CANCELLED' AND sc.schedule_id <> COALESCE(?, -1)
                  AND (c.coach_id=? OR c.room_id=?) AND sc.start_time < ? AND sc.end_time > ?
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
                       p.duration_days durationDays,p.price,
                       COUNT(um.membership_id) subscribers,
                       COUNT(CASE WHEN um.status='ACTIVE' AND um.start_date<=CURDATE() AND um.end_date>=CURDATE() THEN 1 END) activeSubscribers
                FROM PACKAGES p LEFT JOIN USER_MEMBERSHIPS um ON um.package_id=p.package_id
                GROUP BY p.package_id,p.package_name,p.package_type,p.duration_days,p.price ORDER BY p.package_id DESC
                """);
    }

    public int savePackage(Integer id, ManagerRequests.PackageRequest request) {
        if (id == null) {
            return insert("INSERT INTO PACKAGES(package_name,package_type,duration_days,price) VALUES (?,?,?,?)",
                    request.packageName(), request.packageType(), request.durationDays(), request.price());
        }
        jdbc.update("UPDATE PACKAGES SET package_name=?,package_type=?,duration_days=?,price=? WHERE package_id=?",
                request.packageName(), request.packageType(), request.durationDays(), request.price(), id);
        return id;
    }

    public Map<String, Object> report(LocalDate from, LocalDate to) {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("summary", jdbc.queryForMap("""
                SELECT
                  (SELECT COALESCE(SUM(amount),0) FROM PAYMENTS WHERE status='SUCCESS' AND DATE(payment_date) BETWEEN ? AND ?) revenue,
                  (SELECT COUNT(*) FROM PAYMENTS WHERE status='SUCCESS' AND DATE(payment_date) BETWEEN ? AND ?) successfulPayments,
                  (SELECT COUNT(*) FROM INVOICES WHERE status='PENDING' AND DATE(created_at) BETWEEN ? AND ?) pendingInvoices,
                  (SELECT COUNT(*) FROM BOOKINGS b JOIN SCHEDULES sc ON sc.schedule_id=b.schedule_id
                    WHERE b.status='CONFIRMED' AND DATE(sc.start_time) BETWEEN ? AND ?) confirmedBookings
                """, from, to, from, to, from, to, from, to));
        result.put("revenueByDay", jdbc.queryForList("""
                SELECT DATE(payment_date) label,SUM(amount) value FROM PAYMENTS
                WHERE status='SUCCESS' AND DATE(payment_date) BETWEEN ? AND ?
                GROUP BY DATE(payment_date) ORDER BY DATE(payment_date)
                """, from, to));
        result.put("memberships", jdbc.queryForList("""
                SELECT p.package_name label,COUNT(um.membership_id) value
                FROM PACKAGES p LEFT JOIN USER_MEMBERSHIPS um ON um.package_id=p.package_id AND um.start_date BETWEEN ? AND ?
                GROUP BY p.package_id,p.package_name ORDER BY value DESC
                """, from, to));
        result.put("classOccupancy", jdbc.queryForList("""
                SELECT c.class_id classId,c.class_name label,c.max_slots*COUNT(DISTINCT sc.schedule_id) capacity,
                       COUNT(CASE WHEN b.status='CONFIRMED' THEN 1 END) value
                FROM CLASSES c JOIN SCHEDULES sc ON sc.class_id=c.class_id AND sc.status<>'CANCELLED'
                  AND sc.start_time>=? AND sc.start_time<?
                LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                GROUP BY c.class_id,c.class_name,c.max_slots ORDER BY value DESC LIMIT 10
                """, from.atStartOfDay(), to.plusDays(1).atStartOfDay()));
        return result;
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
}
