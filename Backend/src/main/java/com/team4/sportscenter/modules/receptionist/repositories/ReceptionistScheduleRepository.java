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
            "WHERE LOWER(c.className) = LOWER(:className) " +
            "AND s.startTime >= :afterTime " +
            "AND s.status = 'ACTIVE' " +
            "ORDER BY s.startTime ASC")
    List<Schedule> findUpcomingSchedulesByClassName(
            @Param("className") String className,
            @Param("afterTime") LocalDateTime afterTime);
}