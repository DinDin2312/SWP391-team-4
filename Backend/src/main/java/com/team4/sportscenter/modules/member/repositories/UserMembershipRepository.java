package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserMembershipRepository extends JpaRepository<UserMembership, Integer> {
    
    @Query("SELECT um FROM UserMembership um WHERE um.user.email = :email AND um.status = 'ACTIVE'")
    Optional<UserMembership> findActiveMembershipByEmail(@Param("email") String email);
}
