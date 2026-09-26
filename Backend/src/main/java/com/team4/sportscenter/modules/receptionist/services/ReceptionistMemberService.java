package com.team4.sportscenter.modules.receptionist.services;

import com.team4.sportscenter.modules.receptionist.dtos.response.MemberDetailResponse;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberMembershipDetail;
import com.team4.sportscenter.modules.receptionist.dtos.response.MemberSummaryResponse;

import java.util.List;

public interface ReceptionistMemberService {
    List<MemberSummaryResponse> searchMembers(String keyword, String status, String membershipFilter);
    MemberDetailResponse getMemberDetail(Integer userId);
    List<MemberMembershipDetail> getMemberMemberships(Integer userId);
}
