package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.UpdateCoachProfileRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachProfileResponse;
import com.team4.sportscenter.modules.coach.dtos.response.SubjectOptionResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.services.CoachProfileService;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.member.entities.Subject;
import com.team4.sportscenter.modules.member.repositories.SubjectRepository;
import com.team4.sportscenter.modules.notification.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CoachProfileServiceImpl implements CoachProfileService {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final CoachClassRepository coachClassRepository;
    private final NotificationService notificationService;

    public CoachProfileServiceImpl(
            UserRepository userRepository,
            SubjectRepository subjectRepository,
            CoachClassRepository coachClassRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.coachClassRepository = coachClassRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public CoachProfileResponse getCoachProfile(String coachEmail) {
        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin huấn luyện viên: " + coachEmail));

        Subject currentSubject = (coach.getSpecialties() != null && !coach.getSpecialties().isEmpty())
                ? coach.getSpecialties().get(0)
                : null;

        List<GymClass> activeClasses = Collections.emptyList();
        if (currentSubject != null) {
            activeClasses = coachClassRepository.findActiveClassesByCoachAndSubject(
                    coach.getUserId(),
                    currentSubject.getSubjectId()
            );
        }

        List<String> activeClassNames = activeClasses.stream()
                .map(GymClass::getClassName)
                .collect(Collectors.toList());

        boolean canChangeSubject = false;
        String warningMessage = "Bộ môn giảng dạy do quản lý trung tâm phân công. Vui lòng liên hệ quản lý để thay đổi.";
        List<SubjectOptionResponse> availableSubjects = coach.getSpecialties()==null?List.of():coach.getSpecialties().stream()
            .map(subject->SubjectOptionResponse.builder().subjectId(subject.getSubjectId()).subjectName(subject.getSubjectName()).build()).toList();

        return CoachProfileResponse.builder()
                .userId(coach.getUserId())
                .fullName(coach.getFullName())
                .email(coach.getEmail())
                .phone(coach.getPhone())
                .bio(coach.getBio())
                .avatarPath(coach.getAvatarPath())
                .currentSubjectId(currentSubject != null ? currentSubject.getSubjectId() : null)
                .currentSubjectName(currentSubject != null ? currentSubject.getSubjectName() : null)
                .currentSubjectDescription(currentSubject != null ? currentSubject.getDescription() : null)
                .availableSubjects(availableSubjects)
                .activeClassesCount(activeClasses.size())
                .activeClassNames(activeClassNames)
                .canChangeSubject(canChangeSubject)
                .warningMessage(warningMessage)
                .build();
    }

    @Override
    @Transactional
    public void updateCoachProfile(String coachEmail, UpdateCoachProfileRequest request) {
        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin huấn luyện viên: " + coachEmail));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            coach.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            coach.setPhone(request.getPhone().trim());
        }
        if (request.getBio() != null) {
            coach.setBio(request.getBio().trim());
        }

        if (request.getSubjectId() != null) {
            if(coach.getSpecialties()==null || coach.getSpecialties().stream().noneMatch(subject->subject.getSubjectId().equals(request.getSubjectId())))
                throw new IllegalArgumentException("Bộ môn giảng dạy do quản lý trung tâm phân công. Vui lòng liên hệ quản lý để thay đổi.");
        }

        userRepository.save(coach);

        try {
            notificationService.createNotification(
                    coachEmail,
                    "Cập nhật hồ sơ huấn luyện viên",
                    "Hồ sơ và thông tin chuyên môn của bạn đã được cập nhật thành công.",
                    "SYSTEM"
            );
        } catch (Exception e) {
            log.warn("Không thể gửi thông báo cập nhật hồ sơ cho {}: {}", coachEmail, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectOptionResponse> getAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(s -> SubjectOptionResponse.builder()
                        .subjectId(s.getSubjectId())
                        .subjectName(s.getSubjectName())
                        .description(s.getDescription())
                        .build())
                .collect(Collectors.toList());
    }
}
