package com.team4.sportscenter.modules.coach.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitWorkoutRequest {

    private Integer detailId;

    @NotBlank(message = "Vui lòng nhập đường dẫn video thực hành.")
    private String videoUrl;

    private String studentNote;
}

