package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.ScheduleRescheduleRequest;
import com.team4.sportscenter.modules.member.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleRescheduleRequestRepository extends JpaRepository<ScheduleRescheduleRequest, Integer> {

    List<ScheduleRescheduleRequest> findByCoach_UserIdOrderByCreatedAtDesc(Integer coachId);

    List<ScheduleRescheduleRequest> findByCoach_EmailOrderByCreatedAtDesc(String email);

    List<ScheduleRescheduleRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<ScheduleRescheduleRequest> findAllByOrderByCreatedAtDesc();

    Optional<ScheduleRescheduleRequest> findFirstBySchedule_ScheduleIdAndStatusInOrderByCreatedAtDesc(
            Integer scheduleId, List<String> statuses);

    @Query("SELECT r FROM ScheduleRescheduleRequest r JOIN FETCH r.schedule s WHERE r.schedule.scheduleId IN :scheduleIds AND r.status IN :statuses ORDER BY r.createdAt DESC")
    List<ScheduleRescheduleRequest> findBySchedule_ScheduleIdInAndStatusInOrderByCreatedAtDesc(
            @Param("scheduleIds") List<Integer> scheduleIds,
            @Param("statuses") List<String> statuses);

    @Query("SELECT r FROM ScheduleRescheduleRequest r " +
           "WHERE r.status = 'APPROVED' " +
           "AND r.confirmationDeadline IS NOT NULL " +
           "AND r.confirmationDeadline <= :now")
    List<ScheduleRescheduleRequest> findRequestsPassedDeadline(@Param("now") LocalDateTime now);

    // Kiểm tra xem phòng có bị lớp khác chiếm trong khoảng start -> end không
    @Query("SELECT COUNT(s) FROM Schedule s " +
           "WHERE s.gymClass.room.roomId = :roomId " +
           "AND s.scheduleId != :excludeScheduleId " +
           "AND s.status != 'CANCELLED' " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    long countRoomCollisions(
            @Param("roomId") Integer roomId,
            @Param("excludeScheduleId") Integer excludeScheduleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Kiểm tra xem HLV có bị trùng lịch dạy lớp khác không
    @Query("SELECT COUNT(s) FROM Schedule s " +
           "WHERE (s.gymClass.coach.userId = :coachId OR (s.substituteCoach IS NOT NULL AND s.substituteCoach.userId = :coachId)) " +
           "AND s.scheduleId != :excludeScheduleId " +
           "AND s.status != 'CANCELLED' " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    long countCoachCollisions(
            @Param("coachId") Integer coachId,
            @Param("excludeScheduleId") Integer excludeScheduleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT s FROM Schedule s " +
           "WHERE (s.gymClass.coach.userId = :coachId OR (s.substituteCoach IS NOT NULL AND s.substituteCoach.userId = :coachId)) " +
           "AND s.scheduleId != :excludeScheduleId " +
           "AND s.status != 'CANCELLED' " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Schedule> findCoachCollidingSchedules(
            @Param("coachId") Integer coachId,
            @Param("excludeScheduleId") Integer excludeScheduleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("SELECT s FROM Schedule s " +
           "WHERE s.gymClass.room.roomId = :roomId " +
           "AND s.scheduleId != :excludeScheduleId " +
           "AND s.status != 'CANCELLED' " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Schedule> findRoomCollidingSchedules(
            @Param("roomId") Integer roomId,
            @Param("excludeScheduleId") Integer excludeScheduleId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
