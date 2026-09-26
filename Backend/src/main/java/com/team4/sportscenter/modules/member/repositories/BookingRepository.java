package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Modifying;
import java.time.LocalDateTime;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach u JOIN FETCH c.room r WHERE b.user.email = :email AND b.status = 'CONFIRMED' AND s.startTime >= :currentTime ORDER BY s.startTime ASC")
    List<Booking> findUpcomingBookingsByEmail(@Param("email") String email, @Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT b FROM Booking b WHERE b.user.email = :email AND b.status = 'ATTENDED'")
    List<Booking> findAttendedBookingsByEmail(@Param("email") String email);

    @Query("SELECT b FROM Booking b JOIN FETCH b.schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach u JOIN FETCH c.room r WHERE b.user.email = :email AND s.startTime < :currentTime ORDER BY s.startTime DESC")
    List<Booking> findPastBookingsByEmail(@Param("email") String email, @Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT b FROM Booking b JOIN FETCH b.schedule s JOIN FETCH s.gymClass c JOIN FETCH c.coach u JOIN FETCH c.room r WHERE b.user.email = :email ORDER BY s.startTime ASC")
    List<Booking> findAllBookingsByEmail(@Param("email") String email);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.schedule.scheduleId = :scheduleId AND b.status IN ('CONFIRMED', 'PENDING')")
    Integer countBookedSlots(@Param("scheduleId") Integer scheduleId);

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user.email = :email AND b.schedule.scheduleId = :scheduleId AND b.status != 'CANCELLED'")
    boolean existsByEmailAndScheduleId(@Param("email") String email, @Param("scheduleId") Integer scheduleId);
    
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user.email = :email AND b.schedule.gymClass.classId = :classId AND b.status != 'CANCELLED'")
    boolean existsByEmailAndClassId(@Param("email") String email, @Param("classId") Integer classId);
    @Modifying
    @Query("UPDATE Booking b SET b.status = 'CANCELLED' WHERE b.status = 'PENDING' AND b.bookingTime < :cutoff")
    int cancelExpiredPendingBookings(@Param("cutoff") LocalDateTime cutoff);
}
