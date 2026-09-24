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
           "WHERE s.startTime >= :currentTime " +
           "ORDER BY s.startTime ASC")
    List<Schedule> findAvailableSchedules(@Param("currentTime") LocalDateTime currentTime);
}
