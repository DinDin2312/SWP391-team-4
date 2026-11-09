package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    @Query("SELECT s FROM Schedule s " +
           "JOIN FETCH s.gymClass c " +
           "JOIN FETCH c.coach u " +
           "JOIN FETCH c.room r " +
           "WHERE s.startTime >= :currentTime AND s.status IN ('SCHEDULED','SUBSTITUTE_ASSIGNED','RESCHEDULED') AND c.status='ACTIVE' " +
           "ORDER BY s.startTime ASC")
    List<Schedule> findAvailableSchedules(@Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT s FROM Schedule s " +
           "JOIN FETCH s.gymClass c " +
           "JOIN FETCH c.coach u " +
           "JOIN FETCH c.room r " +
           "WHERE c.classId = :classId AND s.startTime >= :currentTime AND s.status IN ('SCHEDULED','SUBSTITUTE_ASSIGNED','RESCHEDULED') AND c.status='ACTIVE' " +
           "ORDER BY s.startTime ASC")
    List<Schedule> findAvailableSchedulesByClassId(@Param("classId") Integer classId, @Param("currentTime") LocalDateTime currentTime);

    long countByGymClass_ClassId(Integer classId);

    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.gymClass c LEFT JOIN FETCH c.coach u LEFT JOIN FETCH c.room r LEFT JOIN FETCH s.substituteCoach sc WHERE s.startTime > :afterTime AND s.status != 'CANCELLED' AND (u.userId = :coachId OR sc.userId = :coachId) ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedulesByCoachId(@Param("coachId") Integer coachId, @Param("afterTime") LocalDateTime afterTime);
}
