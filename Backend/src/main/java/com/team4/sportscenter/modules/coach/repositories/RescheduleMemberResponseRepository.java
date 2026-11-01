package com.team4.sportscenter.modules.coach.repositories;

import com.team4.sportscenter.modules.coach.entities.RescheduleMemberResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RescheduleMemberResponseRepository extends JpaRepository<RescheduleMemberResponse, Integer> {

    List<RescheduleMemberResponse> findByRequest_RequestId(Integer requestId);

    Optional<RescheduleMemberResponse> findByRequest_RequestIdAndUser_UserId(Integer requestId, Integer userId);

    Optional<RescheduleMemberResponse> findByRequest_RequestIdAndUser_Email(Integer requestId, String email);

    long countByRequest_RequestIdAndResponseStatus(Integer requestId, String responseStatus);

    List<RescheduleMemberResponse> findByRequest_RequestIdAndResponseStatus(Integer requestId, String responseStatus);

    List<RescheduleMemberResponse> findByUser_EmailOrderByCreatedAtDesc(String email);

    List<RescheduleMemberResponse> findByUser_UserIdAndResponseStatus(Integer userId, String responseStatus);
}
