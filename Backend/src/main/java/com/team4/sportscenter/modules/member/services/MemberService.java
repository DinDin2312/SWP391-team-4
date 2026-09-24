package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.member.dtos.response.MemberMembershipResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import java.util.List;

public interface MemberService {
    MemberMembershipResponse getMyActiveMembership(String email);
    List<UpcomingBookingResponse> getMyUpcomingBookings(String email);
    long getTotalCheckIns(String email);
    List<com.team4.sportscenter.modules.member.dtos.response.RecentActivityResponse> getRecentActivities(String email);
}

