package com.team4.sportscenter.modules.receptionist.repositories;

import com.team4.sportscenter.modules.member.entities.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReceptionistUserMembershipRepository extends JpaRepository<UserMembership, Integer> {

    @Query("SELECT um FROM UserMembership um LEFT JOIN FETCH um.aPackage p WHERE um.user.userId = :userId ORDER BY um.startDate DESC, um.endDate DESC")
    List<UserMembership> findByUser_UserId(@Param("userId") Integer userId);
}