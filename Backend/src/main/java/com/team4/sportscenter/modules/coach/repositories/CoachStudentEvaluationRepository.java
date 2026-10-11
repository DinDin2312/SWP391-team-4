package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.CoachStudentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachStudentEvaluationRepository extends JpaRepository<CoachStudentEvaluation, Integer> {
    List<CoachStudentEvaluation> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
    List<CoachStudentEvaluation> findByCoachUserIdOrderByCreatedAtDesc(Integer coachId);
    List<CoachStudentEvaluation> findByCoachUserIdAndUserUserIdOrderByCreatedAtDesc(Integer coachId, Integer userId);

    List<CoachStudentEvaluation> findByCoachEmailOrderByCreatedAtDesc(String coachEmail);
    List<CoachStudentEvaluation> findByCoachEmailAndUserUserIdOrderByCreatedAtDesc(String coachEmail, Integer userId);
    List<CoachStudentEvaluation> findByCoachEmailAndGymClassClassIdOrderByCreatedAtDesc(String coachEmail, Integer classId);
    List<CoachStudentEvaluation> findByCoachEmailAndUserUserIdAndGymClassClassIdOrderByCreatedAtDesc(String coachEmail, Integer userId, Integer classId);
}
