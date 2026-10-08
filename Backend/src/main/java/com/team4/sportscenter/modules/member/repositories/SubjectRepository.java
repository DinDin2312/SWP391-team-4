package com.team4.sportscenter.modules.member.repositories;

import com.team4.sportscenter.modules.member.entities.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Integer> {
}
