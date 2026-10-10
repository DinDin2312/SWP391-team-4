package com.team4.sportscenter.modules.receptionist.repositories;

import com.team4.sportscenter.modules.member.entities.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceptionistBookingRepository extends JpaRepository<Booking, Integer> {
    @Query(value="SELECT role_id FROM ROLES WHERE role_name='Center Manager' FOR UPDATE",nativeQuery=true)
    List<Integer> lockOperations();

    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.schedule s " +
           "LEFT JOIN FETCH s.gymClass c " +
           "LEFT JOIN FETCH c.coach coach " +
           "LEFT JOIN FETCH c.room r " +
           "WHERE b.user.userId = :userId " +
           "ORDER BY s.startTime DESC")
    List<Booking> findByUserIdWithDetails(@Param("userId") Integer userId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.userId = :userId")
    Long countByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.schedule.scheduleId = :scheduleId AND b.status IN ('CONFIRMED', 'PENDING')")
    Integer countBookedSlots(@Param("scheduleId") Integer scheduleId);

    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.user.userId = :userId AND b.schedule.scheduleId = :scheduleId AND b.status != 'CANCELLED'")
    boolean existsByUserIdAndScheduleId(@Param("userId") Integer userId, @Param("scheduleId") Integer scheduleId);
}
