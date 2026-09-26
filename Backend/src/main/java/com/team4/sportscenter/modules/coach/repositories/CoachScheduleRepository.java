package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachScheduleRepository extends JpaRepository<Schedule, Integer> {

    @Query("SELECT s FROM Schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach u JOIN FETCH c.room r WHERE u.email = :email ORDER BY s.startTime ASC")
    List<Schedule> findSchedulesByCoachEmail(@Param("email") String email);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user u WHERE b.schedule.scheduleId = :scheduleId AND b.status IN ('CONFIRMED', 'PENDING')")
    List<Booking> findBookingsByScheduleId(@Param("scheduleId") Integer scheduleId);
}
