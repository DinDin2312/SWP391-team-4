package com.team4.sportscenter.modules.receptionist.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberCheckInRecordResponse {
    private Long checkInId;
    private Integer userId;
    private String memberName;
    private String memberEmail;
    private String memberPhone;
    private Integer membershipId;
    private String packageName;
    private String packageType;
    private Integer roomId;
    private String facilityName;
    private String note;
    private String status; // "CHECKED_IN" or "CHECKED_OUT"
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String checkedInBy;
    private Integer bookingId;
    private String checkInType; // "GYM_FACILITY", "CLASS_SESSION", "COMBO_ALL"
    private Boolean gymAccessGranted;
    private Boolean classAccessGranted;
    private String accessCode;
    private String attendanceStatus;
    private Boolean hasAnomaly;
    private String anomalyReason;

    public Long getCheckInId() { return checkInId; }
    public void setCheckInId(Long checkInId) { this.checkInId = checkInId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }

    public String getMemberPhone() { return memberPhone; }
    public void setMemberPhone(String memberPhone) { this.memberPhone = memberPhone; }

    public Integer getMembershipId() { return membershipId; }
    public void setMembershipId(Integer membershipId) { this.membershipId = membershipId; }

    public String getPackageName() { return packageName; }
    public void setPackageName(String packageName) { this.packageName = packageName; }

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }

    public Integer getRoomId() { return roomId; }
    public void setRoomId(Integer roomId) { this.roomId = roomId; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public LocalDateTime getCheckOutTime() { return checkOutTime; }
    public void setCheckOutTime(LocalDateTime checkOutTime) { this.checkOutTime = checkOutTime; }

    public String getCheckedInBy() { return checkedInBy; }
    public void setCheckedInBy(String checkedInBy) { this.checkedInBy = checkedInBy; }

    public Integer getBookingId() { return bookingId; }
    public void setBookingId(Integer bookingId) { this.bookingId = bookingId; }

    public String getCheckInType() { return checkInType; }
    public void setCheckInType(String checkInType) { this.checkInType = checkInType; }

    public Boolean getGymAccessGranted() { return gymAccessGranted; }
    public void setGymAccessGranted(Boolean gymAccessGranted) { this.gymAccessGranted = gymAccessGranted; }

    public Boolean getClassAccessGranted() { return classAccessGranted; }
    public void setClassAccessGranted(Boolean classAccessGranted) { this.classAccessGranted = classAccessGranted; }

    public String getAccessCode() { return accessCode; }
    public void setAccessCode(String accessCode) { this.accessCode = accessCode; }

    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; }

    public Boolean getHasAnomaly() { return hasAnomaly; }
    public void setHasAnomaly(Boolean hasAnomaly) { this.hasAnomaly = hasAnomaly; }

    public String getAnomalyReason() { return anomalyReason; }
    public void setAnomalyReason(String anomalyReason) { this.anomalyReason = anomalyReason; }
}
