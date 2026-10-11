package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.CoachReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachReviewRepository extends JpaRepository<CoachReview, Integer> {
    List<CoachReview> findByCoachUserIdOrderByCreatedAtDesc(Integer coachId);
    List<CoachReview> findByUserUserIdOrderByCreatedAtDesc(Integer userId);
}
