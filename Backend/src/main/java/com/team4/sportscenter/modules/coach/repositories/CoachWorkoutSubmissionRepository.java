package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.CoachWorkoutSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoachWorkoutSubmissionRepository extends JpaRepository<CoachWorkoutSubmission, Integer> {

    List<CoachWorkoutSubmission> findByWorkoutPlanPlanIdAndUserUserIdOrderBySubmittedAtDesc(Integer planId, Integer userId);

    List<CoachWorkoutSubmission> findByCoachUserIdOrderBySubmittedAtDesc(Integer coachId);

    List<CoachWorkoutSubmission> findByCoachUserIdAndStatusOrderBySubmittedAtDesc(Integer coachId, String status);

    long countByCoachUserIdAndStatus(Integer coachId, String status);

    Optional<CoachWorkoutSubmission> findFirstByWorkoutPlanPlanIdAndPlanDetailDetailIdAndUserUserIdOrderBySubmittedAtDesc(
            Integer planId, Integer detailId, Integer userId);

    @Query("SELECT s FROM CoachWorkoutSubmission s " +
           "WHERE s.coach.userId = :coachId " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:studentUserId IS NULL OR s.user.userId = :studentUserId) " +
           "AND (:planId IS NULL OR s.workoutPlan.planId = :planId) " +
           "AND (:classId IS NULL OR (s.workoutPlan.gymClass IS NOT NULL AND s.workoutPlan.gymClass.classId = :classId) OR " +
           "     (s.workoutPlan.gymClass IS NULL AND EXISTS (SELECT 1 FROM Booking b JOIN b.schedule sch WHERE b.user.userId = s.user.userId AND sch.gymClass.classId = :classId AND b.status = 'CONFIRMED'))) " +
           "ORDER BY s.submittedAt DESC")
    List<CoachWorkoutSubmission> findCoachSubmissionsFiltered(
            @Param("coachId") Integer coachId,
            @Param("status") String status,
            @Param("studentUserId") Integer studentUserId,
            @Param("planId") Integer planId,
            @Param("classId") Integer classId);
}
