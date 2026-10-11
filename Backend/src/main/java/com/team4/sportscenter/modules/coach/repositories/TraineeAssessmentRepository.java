package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.TraineeAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TraineeAssessmentRepository extends JpaRepository<TraineeAssessment, Integer> {

    @Query("SELECT a FROM TraineeAssessment a WHERE a.coach.email = :coachEmail ORDER BY a.createdAt DESC")
    List<TraineeAssessment> findByCoachEmailOrderByCreatedAtDesc(@Param("coachEmail") String coachEmail);

    @Query("SELECT a FROM TraineeAssessment a WHERE a.coach.email = :coachEmail AND a.user.userId = :userId ORDER BY a.createdAt DESC")
    List<TraineeAssessment> findByCoachEmailAndUserIdOrderByCreatedAtDesc(@Param("coachEmail") String coachEmail, @Param("userId") Integer userId);

    @Query("SELECT a FROM TraineeAssessment a WHERE a.user.userId = :userId ORDER BY a.createdAt DESC")
    List<TraineeAssessment> findByUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);

    @Query("SELECT a FROM TraineeAssessment a WHERE a.user.email = :userEmail ORDER BY a.createdAt DESC")
    List<TraineeAssessment> findByUserEmailOrderByCreatedAtDesc(@Param("userEmail") String userEmail);
}
