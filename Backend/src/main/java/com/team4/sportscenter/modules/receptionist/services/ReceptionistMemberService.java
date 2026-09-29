package com.team4.sportscenter.modules.receptionist.services;

import com.team4.sportscenter.modules.receptionist.dtos.request.MemberRegisterRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.RenewBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest;
import com.team4.sportscenter.modules.receptionist.dtos.response.*;

import java.util.List;

public interface ReceptionistMemberService {
    List<MemberSummaryResponse> searchMembers(String keyword, String status, String membershipFilter);
    MemberDetailResponse getMemberDetail(Integer userId);
    List<MemberMembershipDetail> getMemberMemberships(Integer userId);
    void registerMember(MemberRegisterRequest request);
    ClassRenewalSuggestionResponse suggestNextClassRenewal(Integer userId, Integer bookingId);
    void confirmClassRenewal(RenewBookingRequest request);
    List<PackageResponse> getAllActivePackages();
    void subscribePackageForMember(SubscribePackageRequest request);
}
