package com.team4.sportscenter;

import com.team4.sportscenter.modules.member.entities.UserMembership;
import com.team4.sportscenter.modules.receptionist.services.impl.ReceptionistMemberServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReceptionistCheckInMembershipSelectionTests {

    @Test
    void movesRequestedMembershipToFrontWithoutDroppingOthers() {
        UserMembership gym = UserMembership.builder().membershipId(10).build();
        UserMembership pool = UserMembership.builder().membershipId(20).build();
        UserMembership sauna = UserMembership.builder().membershipId(30).build();

        List<UserMembership> result = ReceptionistMemberServiceImpl.prioritizeRequestedMembership(
                List.of(gym, pool, sauna), 20);

        assertEquals(List.of(20, 10, 30), result.stream().map(UserMembership::getMembershipId).toList());
    }

    @Test
    void preservesOrderWhenRequestedMembershipIsNullOrAbsent() {
        UserMembership gym = UserMembership.builder().membershipId(10).build();
        UserMembership pool = UserMembership.builder().membershipId(20).build();

        List<UserMembership> nullReq = ReceptionistMemberServiceImpl.prioritizeRequestedMembership(
                List.of(gym, pool), null);
        List<UserMembership> missingReq = ReceptionistMemberServiceImpl.prioritizeRequestedMembership(
                List.of(gym, pool), 99);

        assertEquals(List.of(10, 20), nullReq.stream().map(UserMembership::getMembershipId).toList());
        assertEquals(List.of(10, 20), missingReq.stream().map(UserMembership::getMembershipId).toList());
    }
}
