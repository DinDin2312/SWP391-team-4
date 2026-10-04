package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.member.entities.GymClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoachClassRepository extends JpaRepository<GymClass, Integer> {

    @Query("SELECT DISTINCT c FROM GymClass c LEFT JOIN FETCH c.room r WHERE c.coach.email = :email")
    List<GymClass> findClassesByCoachEmail(@Param("email") String email);

    @Query("SELECT DISTINCT b.user FROM Booking b JOIN b.schedule s JOIN s.gymClass c WHERE c.coach.email = :email AND b.status IN ('CONFIRMED', 'PENDING')")
    List<User> findDistinctStudentsByCoachEmail(@Param("email") String email);

    @Query("SELECT DISTINCT b.user FROM Booking b JOIN b.schedule s JOIN s.gymClass c WHERE c.classId = :classId AND c.coach.email = :email AND b.status IN ('CONFIRMED', 'PENDING')")
    List<User> findDistinctStudentsByClassIdAndCoachEmail(@Param("classId") Integer classId, @Param("email") String email);
}
