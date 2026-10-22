package com.team4.sportscenter.modules.support.services;

import com.team4.sportscenter.modules.support.dtos.request.CreateSupportRequest;
import com.team4.sportscenter.modules.support.dtos.request.RespondSupportRequest;
import com.team4.sportscenter.modules.support.dtos.response.CancelClassPreviewResponse;
import com.team4.sportscenter.modules.support.dtos.response.SupportRequestResponse;
import com.team4.sportscenter.modules.support.dtos.response.UserCreditResponse;
import com.team4.sportscenter.modules.support.enums.SupportCategory;
import com.team4.sportscenter.modules.support.enums.SupportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface SupportRequestService {

    CancelClassPreviewResponse getCancelClassPreview(Integer classId, String memberEmail);

    Map<String, Object> cancelClassDirectly(Integer classId, String memberEmail);

    SupportRequestResponse createSupportRequest(CreateSupportRequest request, String memberEmail);

    List<SupportRequestResponse> getMemberSupportRequests(String memberEmail);

    Page<SupportRequestResponse> searchRequestsForStaff(SupportStatus status, SupportCategory category, String keyword, Pageable pageable);

    Map<String, Object> getStaffSupportStats();

    SupportRequestResponse respondToRequest(Integer requestId, RespondSupportRequest dto, String staffEmail);

    SupportRequestResponse revokeRequest(Integer requestId, String reason, String staffEmail);

    List<UserCreditResponse> getMemberCredits(String memberEmail);

    SupportRequestResponse createOnBehalfOfMember(Integer memberUserId, CreateSupportRequest request, String staffEmail);
}
