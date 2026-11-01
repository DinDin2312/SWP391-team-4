package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.coach.dtos.CreateRescheduleRequestDto;
import com.team4.sportscenter.modules.coach.dtos.RescheduleRequestResponseDto;
import com.team4.sportscenter.modules.coach.dtos.UpcomingScheduleOptionDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ScheduleRescheduleService {

    // === COACH API ===
    RescheduleRequestResponseDto createCoachRequest(CreateRescheduleRequestDto dto, String coachEmail);

    List<RescheduleRequestResponseDto> getCoachRequests(String coachEmail);

    List<UpcomingScheduleOptionDto> getCoachUpcomingSchedules(String coachEmail);

    Map<String, Object> checkAvailability(Integer scheduleId, LocalDateTime proposedStartTime, LocalDateTime proposedEndTime, Integer proposedRoomId, String coachEmail);

    RescheduleRequestResponseDto cancelCoachRequest(Integer requestId, String coachEmail);

    // === MANAGER API ===
    List<RescheduleRequestResponseDto> getAllRequestsForManager(String status);

    RescheduleRequestResponseDto getRequestDetails(Integer requestId);

    RescheduleRequestResponseDto approveRequest(Integer requestId, Integer customMinAttendees, Integer deadlineHoursBefore, String adminNote, String managerEmail);

    RescheduleRequestResponseDto rejectRequest(Integer requestId, String rejectionReason, String managerEmail);

    RescheduleRequestResponseDto assignSubstituteCoachDirectly(Integer requestId, Integer scheduleId, Integer substituteCoachId, String managerNote, String managerEmail);

    List<Map<String, Object>> getAvailableCoachesForSchedule(Integer scheduleId);

    // === MEMBER API ===
    void respondToReschedule(Integer requestId, String action, String memberEmail);

    List<Map<String, Object>> getMemberRescheduleStatus(String memberEmail);

    // === BACKGROUND TASK ===
    void processExpiredRescheduleDeadlines();

    RescheduleRequestResponseDto simulateDeadlineExpiration(Integer requestId);
}
