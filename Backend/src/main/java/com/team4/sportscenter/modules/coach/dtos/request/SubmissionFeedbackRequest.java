package com.team4.sportscenter.modules.coach.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionFeedbackRequest {

    @NotBlank(message = "Vui lòng nhập nhận xét cho học viên.")
    private String coachFeedback;

    private String status; // "APPROVED", "REVIEWED", "REVISION_REQUESTED"

    private Integer rating; // 1 - 5 sao
}

