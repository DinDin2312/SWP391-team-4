package com.team4.sportscenter.modules.receptionist.services;

import com.team4.sportscenter.modules.receptionist.dtos.request.CoachCheckInRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.MemberCheckInRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.MemberRegisterRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.RenewBookingRequest;
import com.team4.sportscenter.modules.receptionist.dtos.request.SubscribePackageRequest;
import com.team4.sportscenter.modules.receptionist.dtos.response.*;

import java.time.LocalDate;
import java.util.List;

public interface ReceptionistMemberService {
    List<MemberSummaryResponse> searchMembers(String keyword, String status, String membershipFilter);
    MemberDetailResponse getMemberDetail(Integer userId);
    List<MemberMembershipDetail> getMemberMemberships(Integer userId);
    void registerMember(MemberRegisterRequest request);
    ClassRenewalSuggestionResponse suggestNextClassRenewal(Integer userId, Integer bookingId);
    ReceiptResponse confirmClassRenewal(RenewBookingRequest request);
    List<PackageResponse> getAllActivePackages();
    ReceiptResponse subscribePackageForMember(SubscribePackageRequest request);

    List<FacilityRoomResponse> getFacilityRooms();
    MemberCheckInRecordResponse checkInMember(MemberCheckInRequest request);
    MemberCheckInRecordResponse checkOutMember(Long checkInId);
    List<MemberCheckInRecordResponse> getCheckInHistory(LocalDate date, String keyword, String statusFilter);

    List<CoachScheduleCheckInResponse> getTodayCoachSchedules(LocalDate date, String keyword, String statusFilter);
    CoachScheduleCheckInResponse checkInCoach(CoachCheckInRequest request);
    CoachScheduleCheckInResponse checkOutCoach(Long checkInId);

    void cancelBookingForMember(com.team4.sportscenter.modules.receptionist.dtos.request.CancelClassBookingRequest request);
    int cancelCourseForMember(com.team4.sportscenter.modules.receptionist.dtos.request.CancelClassBookingRequest request);
    ReceiptResponse enrollMemberToClass(com.team4.sportscenter.modules.receptionist.dtos.request.EnrollClassRequest request);
    List<com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse> getAvailableClassesForMember(Integer userId);

    ReceiptResponse getInvoiceReceipt(Integer invoiceId);
    List<ReceiptResponse> getMemberInvoices(Integer userId);
    List<ReceiptResponse> getAllInvoices();
}
