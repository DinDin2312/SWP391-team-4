package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.manager.dtos.request.ManagerRequests.SubjectBenefitRequest;
import com.team4.sportscenter.modules.member.entities.UserMembership;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

/** Quotas are reserved by confirmed bookings; cancelling releases only the cancelled bookings. */
@Service
@RequiredArgsConstructor
@Transactional
public class PackageBenefitsService {
    private final JdbcTemplate jdbc;
    private final com.team4.sportscenter.modules.manager.services.PackageTypeCatalog packageTypes;

    public void saveDefinition(int packageId, String type, List<SubjectBenefitRequest> benefits) {
        boolean requiresSubjects=Boolean.TRUE.equals(packageTypes.require(type).get("requiresSubjects"));
        // Null preserves old clients' definitions on metadata-only updates.
        if(benefits==null) {
            if(requiresSubjects && packageBenefits(packageId).isEmpty())
                throw new IllegalArgumentException("Select at least one subject for a subject package.");
            return;
        }
        if(benefits.size()>100) throw new IllegalArgumentException("Select at most 100 subjects per package.");
        if(requiresSubjects && benefits.isEmpty())
            throw new IllegalArgumentException("Select at least one subject for a subject package.");
        Map<Integer,List<Integer>> scopes=new HashMap<>();
        for(var existing:packageBenefits(packageId)) scopes.put(((Number)existing.get("subjectId")).intValue(),(List<Integer>)existing.get("roomIds"));
        Set<Integer> ids=new HashSet<>();
        for(var benefit:benefits) {
            if(benefit==null || benefit.subjectId()==null || benefit.sessionLimit()==null
                    || benefit.sessionLimit()<1 || benefit.sessionLimit()>10000 || !ids.add(benefit.subjectId()))
                throw new IllegalArgumentException("Each subject needs a unique selection and 1 to 10,000 sessions.");
            if(jdbc.queryForObject("SELECT COUNT(*) FROM SUBJECTS WHERE subject_id=?",Integer.class,benefit.subjectId())!=1)
                throw new IllegalArgumentException("The selected subject does not exist.");
        }
        for(var benefit:benefits) {
            var rooms=benefit.roomIds()==null?scopes.getOrDefault(benefit.subjectId(),List.of()):benefit.roomIds();
            if(rooms.size()>100 || new HashSet<>(rooms).size()!=rooms.size()) throw new IllegalArgumentException("Select at most 100 unique locations per subject.");
            for(var room:rooms) if(room==null || jdbc.queryForObject("SELECT COUNT(*) FROM ROOMS WHERE room_id=?",Integer.class,room)!=1)
                throw new IllegalArgumentException("The selected location does not exist.");
            scopes.put(benefit.subjectId(),rooms);
        }
        jdbc.update("DELETE FROM PACKAGE_SUBJECT_BENEFITS WHERE package_id=?",packageId);
        for(var benefit:benefits) { jdbc.update("INSERT INTO PACKAGE_SUBJECT_BENEFITS(package_id,subject_id,session_limit) VALUES(?,?,?)",
                packageId,benefit.subjectId(),benefit.sessionLimit());
            for(var room:scopes.get(benefit.subjectId())) jdbc.update("INSERT INTO PACKAGE_BENEFIT_ROOMS(package_id,subject_id,room_id) VALUES(?,?,?)",packageId,benefit.subjectId(),room);
        }
    }

    public List<Map<String,Object>> packageBenefits(int packageId) {
        var rows=jdbc.queryForList("SELECT b.subject_id subjectId,s.subject_name subjectName,b.session_limit sessionLimit FROM PACKAGE_SUBJECT_BENEFITS b JOIN SUBJECTS s ON s.subject_id=b.subject_id WHERE b.package_id=? ORDER BY s.subject_name,b.subject_id",packageId);
        for(var row:rows) addScope(row,jdbc.queryForList("SELECT r.room_id roomId,r.room_name roomName FROM PACKAGE_BENEFIT_ROOMS b JOIN ROOMS r ON r.room_id=b.room_id WHERE b.package_id=? AND b.subject_id=? ORDER BY r.room_id",packageId,row.get("subjectId")));
        return rows;
    }

    public Map<Integer,List<Map<String,Object>>> allPackageBenefits() {
        Map<Integer,List<Map<String,Object>>> result=new HashMap<>();
        for(var row:jdbc.queryForList("SELECT b.package_id packageId,b.subject_id subjectId,s.subject_name subjectName,b.session_limit sessionLimit FROM PACKAGE_SUBJECT_BENEFITS b JOIN SUBJECTS s ON s.subject_id=b.subject_id ORDER BY s.subject_name,b.subject_id")) {
            int id=((Number)row.remove("packageId")).intValue();
            addScope(row,jdbc.queryForList("SELECT r.room_id roomId,r.room_name roomName FROM PACKAGE_BENEFIT_ROOMS b JOIN ROOMS r ON r.room_id=b.room_id WHERE b.package_id=? AND b.subject_id=? ORDER BY r.room_id",id,row.get("subjectId")));
            result.computeIfAbsent(id,key->new ArrayList<>()).add(row);
        }
        return result;
    }

    private void addScope(Map<String,Object> row,List<Map<String,Object>> rooms) {
        row.put("rooms",rooms);row.put("roomIds",rooms.stream().map(r->((Number)r.get("roomId")).intValue()).toList());
    }

    public void validateClassRoom(int classId,int roomId) {
        int invalid=jdbc.queryForObject("SELECT COUNT(*) FROM BOOKINGS b JOIN SCHEDULES s ON s.schedule_id=b.schedule_id JOIN BOOKING_BENEFITS bb ON bb.booking_id=b.booking_id WHERE s.class_id=? AND b.status<>'CANCELLED' AND EXISTS(SELECT 1 FROM MEMBERSHIP_BENEFIT_ROOMS br WHERE br.benefit_id=bb.benefit_id) AND NOT EXISTS(SELECT 1 FROM MEMBERSHIP_BENEFIT_ROOMS br WHERE br.benefit_id=bb.benefit_id AND br.room_id=?)",Integer.class,classId,roomId);
        if(invalid>0) throw new IllegalArgumentException("The new location is outside a registered member's package scope.");
    }

    public void snapshot(UserMembership membership) {
        var pkg=membership.getAPackage();
        membership.setDescriptionSnapshot(pkg.getDescription());
        membership.setTermsSnapshot(pkg.getTerms());
        membership.setPackageNameSnapshot(pkg.getPackageName());
        membership.setPackageTypeSnapshot(pkg.getPackageType());
        membership.setTypeNameSnapshot((String)packageTypes.require(pkg.getPackageType()).get("typeName"));
        membership.setDurationDaysSnapshot(pkg.getDurationDays());
        membership.setPriceSnapshot(pkg.getPrice());
    }

    public void snapshotSubjects(int membershipId,int packageId) {
        jdbc.update("INSERT INTO MEMBERSHIP_SUBJECT_BENEFITS(membership_id,subject_id,subject_name,session_limit) SELECT ?,b.subject_id,s.subject_name,b.session_limit FROM PACKAGE_SUBJECT_BENEFITS b JOIN SUBJECTS s ON s.subject_id=b.subject_id WHERE b.package_id=?",membershipId,packageId);
        jdbc.update("INSERT INTO MEMBERSHIP_BENEFIT_ROOMS(benefit_id,room_id,room_name) SELECT mb.benefit_id,r.room_id,r.room_name FROM MEMBERSHIP_SUBJECT_BENEFITS mb JOIN PACKAGE_BENEFIT_ROOMS pr ON pr.subject_id=mb.subject_id AND pr.package_id=? JOIN ROOMS r ON r.room_id=pr.room_id WHERE mb.membership_id=?",packageId,membershipId);
    }

    public List<Map<String,Object>> membershipBenefits(int membershipId) {
        var rows=jdbc.queryForList("""
          SELECT mb.subject_id subjectId,mb.subject_name subjectName,mb.session_limit sessionLimit,
           mb.session_limit - (SELECT COUNT(*) FROM BOOKING_BENEFITS bb JOIN BOOKINGS b ON b.booking_id=bb.booking_id
             WHERE bb.benefit_id=mb.benefit_id AND (b.status<>'CANCELLED' OR b.attendance_status='PRESENT')) remainingSessions
          FROM MEMBERSHIP_SUBJECT_BENEFITS mb WHERE mb.membership_id=? ORDER BY mb.subject_name,mb.subject_id
          """,membershipId);
        for(var row:rows) addScope(row,jdbc.queryForList("SELECT br.room_id roomId,br.room_name roomName FROM MEMBERSHIP_BENEFIT_ROOMS br JOIN MEMBERSHIP_SUBJECT_BENEFITS mb ON mb.benefit_id=br.benefit_id WHERE mb.membership_id=? AND mb.subject_id=? ORDER BY br.room_id",membershipId,row.get("subjectId")));
        return rows;
    }

    public int reserve(String email,int membershipId,int subjectId,List<LocalDateTime> dates) {
        return reserve(email,membershipId,subjectId,null,dates);
    }

    public int reserve(String email,int membershipId,int subjectId,Integer roomId,List<LocalDateTime> dates) {
        // Callers hold the shared operations lock throughout booking/confirmation.
        var rows=jdbc.queryForList("""
          SELECT mb.benefit_id benefitId,mb.session_limit quota,m.start_date startDate,m.end_date endDate
          FROM MEMBERSHIP_SUBJECT_BENEFITS mb JOIN USER_MEMBERSHIPS m ON m.membership_id=mb.membership_id
          JOIN USERS u ON u.user_id=m.user_id WHERE m.membership_id=? AND u.email=? AND m.status='ACTIVE'
          AND m.start_date<=CURDATE() AND m.end_date>=CURDATE() AND mb.subject_id=? FOR UPDATE
          """,membershipId,email,subjectId);
        if(rows.isEmpty()) throw new IllegalArgumentException("This package is inactive or does not include this subject.");
        var row=rows.get(0);
        var from=((java.sql.Date)row.get("startDate")).toLocalDate();
        var to=((java.sql.Date)row.get("endDate")).toLocalDate();
        if(dates.isEmpty() || dates.stream().anyMatch(d->d.toLocalDate().isBefore(from)||d.toLocalDate().isAfter(to)))
            throw new IllegalArgumentException("Every course session must fall within the package validity dates.");
        int benefitId=((Number)row.get("benefitId")).intValue();
        if(jdbc.queryForObject("SELECT COUNT(*) FROM MEMBERSHIP_BENEFIT_ROOMS WHERE benefit_id=?",Integer.class,benefitId)>0 && (roomId==null || jdbc.queryForObject("SELECT COUNT(*) FROM MEMBERSHIP_BENEFIT_ROOMS WHERE benefit_id=? AND room_id=?",Integer.class,benefitId,roomId)==0))
            throw new IllegalArgumentException("This package does not cover the class location.");
        int used=jdbc.queryForObject("SELECT COUNT(*) FROM BOOKING_BENEFITS bb JOIN BOOKINGS b ON b.booking_id=bb.booking_id WHERE bb.benefit_id=? AND (b.status<>'CANCELLED' OR b.attendance_status='PRESENT')",Integer.class,benefitId);
        if(used+dates.size()>((Number)row.get("quota")).intValue())
            throw new IllegalArgumentException("Not enough remaining sessions for the whole course.");
        return benefitId;
    }

    public void allocate(int bookingId,int benefitId) {
        jdbc.update("INSERT INTO BOOKING_BENEFITS(booking_id,benefit_id) VALUES(?,?)",bookingId,benefitId);
    }

    public void validateSessionDates(int scheduleId,LocalDateTime start,LocalDateTime end) {
        int invalid=jdbc.queryForObject("""
          SELECT COUNT(*) FROM BOOKINGS b JOIN BOOKING_BENEFITS bb ON bb.booking_id=b.booking_id
          JOIN MEMBERSHIP_SUBJECT_BENEFITS mb ON mb.benefit_id=bb.benefit_id
          JOIN USER_MEMBERSHIPS m ON m.membership_id=mb.membership_id
          WHERE b.schedule_id=? AND b.status<>'CANCELLED' AND (m.start_date>? OR m.end_date<?)
          """,Integer.class,scheduleId,start.toLocalDate(),end.minusNanos(1).toLocalDate());
        if(invalid>0) throw new IllegalArgumentException("The new session time falls outside a registered member's package validity.");
    }
}
