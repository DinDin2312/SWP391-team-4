package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.UserMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserMembershipRepository extends JpaRepository<UserMembership, Integer> {
    
    @Query("SELECT um FROM UserMembership um JOIN FETCH um.aPackage WHERE um.user.email = :email AND um.status = 'ACTIVE'")
    java.util.List<UserMembership> findActiveMembershipByEmail(@Param("email") String email);

    @Query("SELECT um FROM UserMembership um JOIN FETCH um.aPackage WHERE um.user.email = :email AND (um.status = 'ACTIVE' OR um.status = 'EXPIRED')")
    java.util.List<UserMembership> findMyPackagesByEmail(@Param("email") String email);

    @Query("SELECT um FROM UserMembership um JOIN FETCH um.aPackage WHERE um.user.email = :email AND um.status = :status")
    java.util.List<UserMembership> findByEmailAndStatus(@Param("email") String email, @Param("status") String status);

    @Query("SELECT um FROM UserMembership um JOIN FETCH um.aPackage JOIN FETCH um.user WHERE um.status = 'ACTIVE' AND um.endDate = :targetDate")
    java.util.List<UserMembership> findMembershipsExpiringOn(@Param("targetDate") java.time.LocalDate targetDate);
}
