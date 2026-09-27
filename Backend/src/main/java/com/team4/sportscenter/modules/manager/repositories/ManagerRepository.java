package com.team4.sportscenter.modules.manager.repositories;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ManagerRepository {
    private final JdbcTemplate jdbc;

    public Map<String, Object> dashboard() {
        return jdbc.queryForMap("""
                SELECT
                  (SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Member') totalMembers,
                  (SELECT COUNT(*) FROM USERS u JOIN ROLES r ON r.role_id=u.role_id WHERE r.role_name='Coach' AND u.status='ACTIVE') activeCoaches,
                  (SELECT COUNT(*) FROM CLASSES WHERE status='ACTIVE') activeClasses,
                  (SELECT COUNT(*) FROM USER_MEMBERSHIPS WHERE status='ACTIVE' AND end_date >= CURDATE()) activeMemberships,
                  (SELECT COALESCE(SUM(amount),0) FROM PAYMENTS WHERE status='SUCCESS' AND YEAR(payment_date)=YEAR(CURDATE()) AND MONTH(payment_date)=MONTH(CURDATE())) monthlyRevenue,
                  (SELECT COUNT(*) FROM SCHEDULES WHERE status='SCHEDULED' AND start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)) upcomingSchedules
                """);
    }

    public List<Map<String, Object>> recentActivity() {
        return jdbc.queryForList("""
                SELECT 'PAYMENT' type, CONCAT('Thanh toán #', payment_id) title,
                       CONCAT(FORMAT(amount,0),' VND - ',payment_method) detail, payment_date occurredAt
                FROM PAYMENTS WHERE status='SUCCESS'
                UNION ALL
                SELECT 'MEMBERSHIP', CONCAT('Gói tập của ',u.full_name), p.package_name, um.start_date
                FROM USER_MEMBERSHIPS um JOIN USERS u ON u.user_id=um.user_id JOIN PACKAGES p ON p.package_id=um.package_id
                ORDER BY occurredAt DESC LIMIT 8
                """);
    }

    public List<Map<String, Object>> users(String keyword, String role, String status) {
        String search = "%" + (keyword == null ? "" : keyword.trim()) + "%";
        return jdbc.queryForList("""
                SELECT u.user_id userId,u.full_name fullName,u.email,u.phone,u.status,
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
                       COUNT(DISTINCT CASE WHEN b.status='CONFIRMED' THEN b.user_id END) enrolled
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
                    request.subjectId(), request.coachId(), request.roomId(), request.className(), request.price(), request.maxSlots(), request.status());
        }
        jdbc.update("UPDATE CLASSES SET subject_id=?,coach_id=?,room_id=?,class_name=?,price=?,max_slots=?,status=? WHERE class_id=?",
                request.subjectId(), request.coachId(), request.roomId(), request.className(), request.price(), request.maxSlots(), request.status(), id);
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
                       COUNT(CASE WHEN b.status='CONFIRMED' THEN 1 END) booked,c.max_slots maxSlots
                FROM SCHEDULES sc JOIN CLASSES c ON c.class_id=sc.class_id JOIN USERS u ON u.user_id=c.coach_id
                JOIN ROOMS r ON r.room_id=c.room_id LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                WHERE DATE(sc.start_time) BETWEEN ? AND ?
                GROUP BY sc.schedule_id,sc.class_id,c.class_name,c.coach_id,u.full_name,c.room_id,r.room_name,sc.start_time,sc.end_time,sc.status,c.max_slots
                ORDER BY sc.start_time
                """, from, to);
    }

    public Map<String, Object> classAssignment(Integer classId) {
        return jdbc.queryForMap("SELECT coach_id coachId,room_id roomId FROM CLASSES WHERE class_id=?", classId);
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
                    request.classId(), request.startTime(), request.endTime(), request.status());
        }
        jdbc.update("UPDATE SCHEDULES SET class_id=?,start_time=?,end_time=?,status=? WHERE schedule_id=?",
                request.classId(), request.startTime(), request.endTime(), request.status(), id);
        return id;
    }

    public List<Map<String, Object>> packages() {
        return jdbc.queryForList("""
                SELECT p.package_id packageId,p.package_name packageName,p.package_type packageType,
                       p.duration_days durationDays,p.price,
                       COUNT(um.membership_id) subscribers,
                       COUNT(CASE WHEN um.status='ACTIVE' AND um.end_date>=CURDATE() THEN 1 END) activeSubscribers
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
                SELECT c.class_name label,c.max_slots capacity,COUNT(DISTINCT CASE WHEN b.status='CONFIRMED' THEN b.user_id END) value
                FROM CLASSES c LEFT JOIN SCHEDULES sc ON sc.class_id=c.class_id AND DATE(sc.start_time) BETWEEN ? AND ?
                LEFT JOIN BOOKINGS b ON b.schedule_id=sc.schedule_id
                GROUP BY c.class_id,c.class_name,c.max_slots ORDER BY value DESC LIMIT 10
                """, from, to));
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
            throw new IllegalStateException("Không thể tạo bản ghi mới");
        }
        return keyHolder.getKey().intValue();
    }
}
