package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.CreateEvaluationRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentEvaluationResponse;
import com.team4.sportscenter.modules.coach.dtos.response.CoachStudentItemResponse;
import com.team4.sportscenter.modules.coach.entities.CoachStudentEvaluation;
import com.team4.sportscenter.modules.coach.entities.StudentProgress;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachStudentEvaluationRepository;
import com.team4.sportscenter.modules.coach.repositories.StudentProgressRepository;
import com.team4.sportscenter.modules.coach.services.CoachEvaluationService;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachEvaluationServiceImpl implements CoachEvaluationService {

    private final CoachStudentEvaluationRepository coachStudentEvaluationRepository;
    private final StudentProgressRepository studentProgressRepository;
    private final CoachClassRepository coachClassRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<CoachStudentItemResponse> getStudentsByClassId(Integer classId, String coachEmail) {
        List<User> students = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(classId, coachEmail);
        return students.stream().map(u -> CoachStudentItemResponse.builder()
                .userId(u.getUserId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .avatarPath(u.getAvatarPath())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> createEvaluation(CreateEvaluationRequest request, String coachEmail) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu đánh giá không hợp lệ.");
        }
        if (request.getUserId() == null) {
            throw new RuntimeException("Vui lòng chọn học viên cần đánh giá.");
        }
        if (request.getCoachComment() == null || request.getCoachComment().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập lời nhận xét của HLV.");
        }

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin HLV."));

        User student = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học viên với ID: " + request.getUserId()));

        GymClass gymClass = null;
        if (request.getClassId() != null) {
            gymClass = coachClassRepository.findById(request.getClassId()).orElse(null);
        }

        CoachStudentEvaluation evaluation = CoachStudentEvaluation.builder()
                .coach(coach)
                .user(student)
                .gymClass(gymClass)
                .evaluationType(request.getEvaluationType() != null && !request.getEvaluationType().trim().isEmpty() 
                        ? request.getEvaluationType().trim() : "MONTHLY")
                .attendanceScore(request.getAttendanceScore())
                .effortScore(request.getEffortScore())
                .techniqueScore(request.getTechniqueScore())
                .coachComment(request.getCoachComment().trim())
                .recommendations(request.getRecommendations() != null ? request.getRecommendations().trim() : null)
                .createdAt(LocalDateTime.now())
                .build();

        coachStudentEvaluationRepository.save(evaluation);

        // Lưu thông số thể chất nếu Coach có nhập
        boolean hasMetrics = request.getWeightKg() != null || request.getHeightCm() != null 
                || request.getBodyFatPct() != null || request.getMuscleMassKg() != null;
        if (hasMetrics) {
            StudentProgress progress = StudentProgress.builder()
                    .user(student)
                    .coach(coach)
                    .weightKg(request.getWeightKg())
                    .heightCm(request.getHeightCm())
                    .bodyFatPct(request.getBodyFatPct())
                    .muscleMassKg(request.getMuscleMassKg())
                    .notes(request.getProgressNotes() != null ? request.getProgressNotes().trim() : null)
                    .recordedDate(LocalDate.now())
                    .createdAt(LocalDateTime.now())
                    .build();
            studentProgressRepository.save(progress);
        }

        // Gửi thông báo đến học viên
        try {
            Notification notification = Notification.builder()
                    .user(student)
                    .title("[Đánh giá tiến độ từ HLV " + coach.getFullName() + "]")
                    .message("HLV " + coach.getFullName() + " vừa gửi đánh giá tiến độ rèn luyện mới cho bạn: \"" 
                            + (request.getCoachComment().length() > 80 ? request.getCoachComment().substring(0, 80) + "..." : request.getCoachComment()) + "\"")
                    .type("COACH")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            // Không làm gián đoạn việc lưu đánh giá nếu thông báo có sự cố
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Đánh giá và ghi nhận xét cho học viên thành công!");
        result.put("evaluationId", evaluation.getEvaluationId());
        return result;
    }

    @Override
    public List<CoachStudentEvaluationResponse> getEvaluations(String coachEmail, Integer userId, Integer classId) {
        List<CoachStudentEvaluation> list;
        if (userId != null && classId != null) {
            list = coachStudentEvaluationRepository.findByCoachEmailAndUserUserIdAndGymClassClassIdOrderByCreatedAtDesc(coachEmail, userId, classId);
        } else if (userId != null) {
            list = coachStudentEvaluationRepository.findByCoachEmailAndUserUserIdOrderByCreatedAtDesc(coachEmail, userId);
        } else if (classId != null) {
            list = coachStudentEvaluationRepository.findByCoachEmailAndGymClassClassIdOrderByCreatedAtDesc(coachEmail, classId);
        } else {
            list = coachStudentEvaluationRepository.findByCoachEmailOrderByCreatedAtDesc(coachEmail);
        }

        return list.stream().map(e -> {
            Double avg = null;
            int count = 0;
            double sum = 0.0;
            if (e.getAttendanceScore() != null) { sum += e.getAttendanceScore(); count++; }
            if (e.getEffortScore() != null) { sum += e.getEffortScore(); count++; }
            if (e.getTechniqueScore() != null) { sum += e.getTechniqueScore(); count++; }
            if (count > 0) {
                avg = Math.round((sum / count) * 10.0) / 10.0;
            }

            // Lấy chỉ số thể chất mới nhất của học viên này
            List<StudentProgress> progressList = studentProgressRepository.findByUserUserIdOrderByRecordedDateDesc(e.getUser().getUserId());
            StudentProgress latestProgress = (progressList != null && !progressList.isEmpty()) ? progressList.get(0) : null;

            return CoachStudentEvaluationResponse.builder()
                    .evaluationId(e.getEvaluationId())
                    .coachId(e.getCoach().getUserId())
                    .coachName(e.getCoach().getFullName())
                    .userId(e.getUser().getUserId())
                    .studentName(e.getUser().getFullName())
                    .studentEmail(e.getUser().getEmail())
                    .studentPhone(e.getUser().getPhone())
                    .classId(e.getGymClass() != null ? e.getGymClass().getClassId() : null)
                    .className(e.getGymClass() != null ? e.getGymClass().getClassName() : null)
                    .evaluationType(e.getEvaluationType())
                    .attendanceScore(e.getAttendanceScore())
                    .effortScore(e.getEffortScore())
                    .techniqueScore(e.getTechniqueScore())
                    .averageScore(avg)
                    .coachComment(e.getCoachComment())
                    .recommendations(e.getRecommendations())
                    .createdAt(e.getCreatedAt())
                    .weightKg(latestProgress != null ? latestProgress.getWeightKg() : null)
                    .heightCm(latestProgress != null ? latestProgress.getHeightCm() : null)
                    .bodyFatPct(latestProgress != null ? latestProgress.getBodyFatPct() : null)
                    .muscleMassKg(latestProgress != null ? latestProgress.getMuscleMassKg() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteEvaluation(Integer evaluationId, String coachEmail) {
        CoachStudentEvaluation evaluation = coachStudentEvaluationRepository.findById(evaluationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi đánh giá với ID: " + evaluationId));

        if (!evaluation.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa bản ghi đánh giá này.");
        }

        coachStudentEvaluationRepository.delete(evaluation);
    }
}
