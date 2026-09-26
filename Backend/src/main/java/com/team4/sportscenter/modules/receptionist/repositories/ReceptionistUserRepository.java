package com.team4.sportscenter.modules.receptionist.repositories;

import com.team4.sportscenter.modules.auth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceptionistUserRepository extends JpaRepository<User, Integer> {

    // Tìm kiếm thành viên (role_id = 4) theo tên, số điện thoại, email hoặc mã ID
    @Query("SELECT u FROM User u WHERE u.role.roleId = 4 " +
           "AND (:keyword IS NULL OR :keyword = '' OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "u.phone LIKE CONCAT('%', :keyword, '%') OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "CAST(u.userId AS string) = :keyword) " +
           "AND (:status IS NULL OR :status = '' OR u.status = :status) " +
           "ORDER BY u.userId DESC")
    List<User> searchMembers(@Param("keyword") String keyword, @Param("status") String status);

    @Query("SELECT u FROM User u WHERE u.role.roleId = 4 ORDER BY u.userId DESC")
    List<User> findAllMembers();
}