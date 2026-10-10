package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.CalendarBookingResponse;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import java.util.List;

public interface MemberService {
    MemberMembershipResponse getMyActiveMembership(String email);
    List<UpcomingBookingResponse> getMyUpcomingBookings(String email);
    long getTotalCheckIns(String email);
    List<com.team4.sportscenter.modules.member.dtos.response.RecentActivityResponse> getRecentActivities(String email);

    List<CalendarBookingResponse> getAllCalendarBookings(String email);
    List<AvailableClassResponse> getAvailableClasses();
    void bookClass(String email, Integer classId);
    void bookClassUsingPackage(String email,Integer classId,Integer membershipId);
    void cancelClass(String email, Integer classId);
    void addPackageToCart(String email, Integer packageId);
    List<com.team4.sportscenter.modules.member.dtos.response.PackageResponse> getAllPackages();
    List<com.team4.sportscenter.modules.member.dtos.response.MemberPackageResponse> getMyPackages(String email);
}
