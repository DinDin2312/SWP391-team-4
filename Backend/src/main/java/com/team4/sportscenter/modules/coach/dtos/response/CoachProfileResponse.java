package com.team4.sportscenter.modules.coach.dtos.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoachProfileResponse {
    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private String bio;
    private String avatarPath;
    private Integer currentSubjectId;
    private String currentSubjectName;
    private String currentSubjectDescription;
    private List<SubjectOptionResponse> availableSubjects;
    private int activeClassesCount;
    private List<String> activeClassNames;
    private boolean canChangeSubject;
    private String warningMessage;
}
