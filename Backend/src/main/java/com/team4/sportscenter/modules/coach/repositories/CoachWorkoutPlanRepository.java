package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachWorkoutPlanRepository extends JpaRepository<CoachWorkoutPlan, Integer> {

    List<CoachWorkoutPlan> findByCoachEmailOrderByCreatedAtDesc(String coachEmail);

    List<CoachWorkoutPlan> findByUserUserIdOrderByCreatedAtDesc(Integer userId);

    @Query("SELECT DISTINCT b.user.userId FROM Booking b WHERE b.schedule.gymClass.classId = :classId AND b.status = 'CONFIRMED'")
    List<Integer> findEnrolledStudentIdsByClassId(@Param("classId") Integer classId);
}
