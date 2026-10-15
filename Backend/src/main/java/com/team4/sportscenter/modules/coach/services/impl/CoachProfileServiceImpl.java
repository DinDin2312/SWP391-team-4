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

        boolean canChangeSubject = activeClasses.isEmpty();
        String warningMessage = null;
        if (!canChangeSubject && currentSubject != null) {
            warningMessage = "Bạn hiện đang phụ trách " + activeClasses.size() + " lớp học thuộc môn \""
                    + currentSubject.getSubjectName() + "\". Bạn chỉ có thể đổi môn khi các lớp này hoàn tất hoặc được chuyển giao.";
        }

        List<SubjectOptionResponse> availableSubjects = getAllSubjects();

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
            Subject targetSubject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Bộ môn được chọn không tồn tại trên hệ thống (ID: " + request.getSubjectId() + ")"));

            Subject currentSubject = (coach.getSpecialties() != null && !coach.getSpecialties().isEmpty())
                    ? coach.getSpecialties().get(0)
                    : null;

            // Nếu huấn luyện viên chọn bộ môn khác với bộ môn hiện tại
            if (currentSubject != null && !currentSubject.getSubjectId().equals(targetSubject.getSubjectId())) {
                List<GymClass> activeClasses = coachClassRepository.findActiveClassesByCoachAndSubject(
                        coach.getUserId(),
                        currentSubject.getSubjectId()
                );

                if (!activeClasses.isEmpty()) {
                    String classList = activeClasses.stream()
                            .map(GymClass::getClassName)
                            .collect(Collectors.joining(", "));
                    throw new IllegalStateException("Không thể đổi bộ môn! Bạn vẫn còn " + activeClasses.size()
                            + " lớp học đang hoạt động hoặc có lịch dạy liên quan đến bộ môn \""
                            + currentSubject.getSubjectName() + "\": [" + classList
                            + "]. Vui lòng hoàn thành hoặc bàn giao các lớp học này trước khi đổi môn.");
                }

                // Đủ điều kiện đổi môn -> Cập nhật sang môn mới
                coach.getSpecialties().clear();
                coach.getSpecialties().add(targetSubject);
                log.info("HLV {} đã đổi bộ môn từ {} sang {}", coachEmail, currentSubject.getSubjectName(), targetSubject.getSubjectName());
            } else if (currentSubject == null) {
                // Chưa có môn nào -> Gán môn mới
                if (coach.getSpecialties() == null) {
                    coach.setSpecialties(new ArrayList<>());
                }
                coach.getSpecialties().add(targetSubject);
                log.info("HLV {} đã đăng ký bộ môn giảng dạy: {}", coachEmail, targetSubject.getSubjectName());
            }
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
