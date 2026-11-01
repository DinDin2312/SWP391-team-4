package com.team4.sportscenter.modules.auth.repositories;

import com.team4.sportscenter.modules.auth.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE LOWER(u.role.roleName) = LOWER(:roleName)")
    List<User> findByRoleNameIgnoreCase(@Param("roleName") String roleName);
}
