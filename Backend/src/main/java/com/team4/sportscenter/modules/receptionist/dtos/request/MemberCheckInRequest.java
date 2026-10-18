package com.team4.sportscenter.modules.receptionist.dtos.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberCheckInRequest {
    private Integer userId;
    private Integer membershipId;
    private Integer roomId;
    private String facilityName;
    private String note;
    private String receptionistEmail;
    private Integer bookingId;
    private String checkInType; // "GYM_FACILITY" or "CLASS_SESSION"
    private Boolean activateEarly;

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getMembershipId() { return membershipId; }
    public void setMembershipId(Integer membershipId) { this.membershipId = membershipId; }

    public Integer getBookingId() { return bookingId; }
    public void setBookingId(Integer bookingId) { this.bookingId = bookingId; }

    public String getCheckInType() { return checkInType; }
    public void setCheckInType(String checkInType) { this.checkInType = checkInType; }

    public Boolean getActivateEarly() { return activateEarly; }
    public void setActivateEarly(Boolean activateEarly) { this.activateEarly = activateEarly; }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getReceptionistEmail() { return receptionistEmail; }
    public void setReceptionistEmail(String receptionistEmail) { this.receptionistEmail = receptionistEmail; }
}
