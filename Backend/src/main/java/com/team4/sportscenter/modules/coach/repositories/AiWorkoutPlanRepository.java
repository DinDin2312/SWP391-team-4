package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.AiWorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiWorkoutPlanRepository extends JpaRepository<AiWorkoutPlan, Integer> {

    @Query("SELECT p FROM AiWorkoutPlan p WHERE p.user.userId = :userId ORDER BY p.createdAt DESC")
    List<AiWorkoutPlan> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT p FROM AiWorkoutPlan p JOIN FETCH p.user WHERE p.user.userId IN :userIds ORDER BY p.createdAt DESC")
    List<AiWorkoutPlan> findByUserIdsOrderByCreatedAtDesc(@Param("userIds") List<Integer> userIds);
}
