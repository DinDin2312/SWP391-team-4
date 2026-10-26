package com.team4.sportscenter.modules.receptionist.repositories;

import com.team4.sportscenter.modules.member.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReceptionistScheduleRepository extends JpaRepository<Schedule, Integer> {

    @Query("SELECT s FROM Schedule s " +
            "JOIN FETCH s.gymClass c " +
            "LEFT JOIN FETCH c.coach coach " +
            "LEFT JOIN FETCH c.room r " +
            "WHERE s.startTime >= :dayStart AND s.startTime <= :dayEnd " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findSchedulesBetweenDates(
            @Param("dayStart") LocalDateTime dayStart,
            @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT s FROM Schedule s " +
            "JOIN FETCH s.gymClass c " +
            "LEFT JOIN FETCH c.coach coach " +
            "LEFT JOIN FETCH c.room r " +
            "WHERE LOWER(c.className) = LOWER(:className) " +
            "AND s.startTime >= :afterTime " +
            "AND s.status = 'SCHEDULED' " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedulesByClassName(
            @Param("className") String className,
            @Param("afterTime") LocalDateTime afterTime);

    @Query("SELECT s FROM Schedule s " +
            "JOIN FETCH s.gymClass c " +
            "LEFT JOIN FETCH c.coach coach " +
            "LEFT JOIN FETCH c.room r " +
            "WHERE (LOWER(c.className) LIKE LOWER(CONCAT(:baseName, '%')) OR LOWER(c.className) = LOWER(:className)) " +
            "AND c.status = 'ACTIVE' " +
            "AND c.classId <> :excludeClassId " +
            "AND s.startTime >= :afterTime " +
            "AND s.status = 'SCHEDULED' " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedulesByBaseName(
            @Param("baseName") String baseName,
            @Param("className") String className,
            @Param("excludeClassId") Integer excludeClassId,
            @Param("afterTime") LocalDateTime afterTime);

    @Query("SELECT s FROM Schedule s " +
            "JOIN FETCH s.gymClass c " +
            "LEFT JOIN FETCH c.coach coach " +
            "LEFT JOIN FETCH c.room r " +
            "WHERE c.subjectId = :subjectId " +
            "AND c.status = 'ACTIVE' " +
            "AND c.classId <> :excludeClassId " +
            "AND s.startTime >= :afterTime " +
            "AND s.status = 'SCHEDULED' " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedulesBySubjectId(
            @Param("subjectId") Integer subjectId,
            @Param("excludeClassId") Integer excludeClassId,
            @Param("afterTime") LocalDateTime afterTime);

    @Query("SELECT s FROM Schedule s " +
            "JOIN FETCH s.gymClass c " +
            "LEFT JOIN FETCH c.coach coach " +
            "LEFT JOIN FETCH c.room r " +
            "WHERE c.classId = :classId " +
            "AND s.status = 'SCHEDULED' " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findAllSchedulesByClassId(@Param("classId") Integer classId);
}
