package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachWorkoutPlanRepository extends JpaRepository<CoachWorkoutPlan, Integer> {

    @Query("SELECT DISTINCT p FROM CoachWorkoutPlan p LEFT JOIN FETCH p.planDetails d LEFT JOIN FETCH d.exercise WHERE p.coach.email = :coachEmail ORDER BY p.createdAt DESC")
    List<CoachWorkoutPlan> findByCoachEmailOrderByCreatedAtDesc(@Param("coachEmail") String coachEmail);

    @Query("SELECT DISTINCT p FROM CoachWorkoutPlan p LEFT JOIN FETCH p.planDetails d LEFT JOIN FETCH d.exercise WHERE p.coach.email = :coachEmail AND p.user.userId = :userId ORDER BY p.createdAt DESC")
    List<CoachWorkoutPlan> findByCoachEmailAndUserIdOrderByCreatedAtDesc(@Param("coachEmail") String coachEmail, @Param("userId") Integer userId);
}
