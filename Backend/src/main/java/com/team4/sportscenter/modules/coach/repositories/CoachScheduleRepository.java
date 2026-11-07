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

    @Query("SELECT DISTINCT s FROM Schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach u JOIN FETCH c.room r LEFT JOIN FETCH s.substituteCoach sc WHERE u.email = :email OR (sc IS NOT NULL AND sc.email = :email) ORDER BY s.startTime ASC")
    List<Schedule> findSchedulesByCoachEmail(@Param("email") String email);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user u WHERE b.schedule.scheduleId = :scheduleId AND b.status = 'CONFIRMED'")
    List<Booking> findBookingsByScheduleId(@Param("scheduleId") Integer scheduleId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.user u JOIN FETCH b.schedule s WHERE b.schedule.scheduleId IN :scheduleIds AND b.status = 'CONFIRMED'")
    List<Booking> findBookingsByScheduleIds(@Param("scheduleIds") List<Integer> scheduleIds);

    @Query("SELECT DISTINCT b FROM Booking b JOIN FETCH b.user u JOIN FETCH b.schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach ch LEFT JOIN s.substituteCoach sc WHERE (ch.email = :email OR (sc IS NOT NULL AND sc.email = :email)) AND b.status = 'CONFIRMED'")
    List<Booking> findBookingsByCoachEmail(@Param("email") String email);
}
