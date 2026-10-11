package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.StudentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentProgressRepository extends JpaRepository<StudentProgress, Integer> {
    List<StudentProgress> findByUserUserIdOrderByRecordedDateDesc(Integer userId);
    List<StudentProgress> findByCoachUserIdOrderByRecordedDateDesc(Integer coachId);
}
