package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachWorkoutPlanResponse;
import com.team4.sportscenter.modules.coach.dtos.response.ExerciseResponse;
import com.team4.sportscenter.modules.coach.entities.CoachPlanDetail;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.Exercise;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.ExerciseRepository;
import com.team4.sportscenter.modules.coach.services.CoachWorkoutService;
import com.team4.sportscenter.modules.member.entities.GymClass;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachWorkoutServiceImpl implements CoachWorkoutService {

    private final ExerciseRepository exerciseRepository;
    private final CoachWorkoutPlanRepository workoutPlanRepository;
    private final CoachClassRepository coachClassRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<ExerciseResponse> getAllExercises() {
        return exerciseRepository.findAll().stream().map(ex -> ExerciseResponse.builder()
                .exerciseId(ex.getExerciseId())
                .exerciseName(ex.getExerciseName())
                .muscleGroup(ex.getMuscleGroup())
                .videoUrl(ex.getVideoUrl())
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> assignWorkout(AssignWorkoutRequest request, String coachEmail) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu yêu cầu giao bài tập không hợp lệ.");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Tiêu đề lộ trình bài tập không được để trống.");
        }
        if (request.getExercises() == null || request.getExercises().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 bài tập trong lộ trình.");
        }
        if (request.getTargetType() == null || request.getTargetType().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn đối tượng nhận bài tập.");
        }

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin HLV."));

        String targetType = request.getTargetType().trim().toUpperCase();
        List<User> recipients = new ArrayList<>();

        if ("ALL".equals(targetType)) {
            recipients = coachClassRepository.findDistinctStudentsByCoachEmail(coachEmail);
            if (recipients.isEmpty()) {
                throw new RuntimeException("Bạn chưa có học viên nào đăng ký các lớp do bạn huấn luyện.");
            }
        } else if ("CLASS".equals(targetType)) {
            if (request.getClassId() == null) {
                throw new RuntimeException("Vui lòng chọn lớp học cần giao bài tập.");
            }
            GymClass gymClass = coachClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với ID: " + request.getClassId()));

            if (gymClass.getCoach() == null || !gymClass.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
                throw new RuntimeException("Bạn không có quyền giao bài tập cho lớp học này.");
            }

            recipients = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(request.getClassId(), coachEmail);
            if (recipients.isEmpty()) {
                throw new RuntimeException("Lớp học này hiện chưa có học viên nào đăng ký.");
            }
        } else if ("INDIVIDUAL".equals(targetType)) {
            if (request.getRecipientUserId() == null) {
                throw new RuntimeException("Vui lòng chọn học viên nhận bài tập.");
            }
            User student = userRepository.findById(request.getRecipientUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy học viên với ID: " + request.getRecipientUserId()));
            recipients.add(student);
        } else {
            throw new RuntimeException("Phương thức giao không hợp lệ (Chấp nhận: ALL, CLASS, INDIVIDUAL).");
        }

        LocalDateTime now = LocalDateTime.now();
        List<CoachWorkoutPlan> savedPlans = new ArrayList<>();
        List<Notification> notificationsToSave = new ArrayList<>();

        for (User student : recipients) {
            CoachWorkoutPlan plan = CoachWorkoutPlan.builder()
                    .coach(coach)
                    .user(student)
                    .title(request.getTitle().trim())
                    .note(request.getNote() != null ? request.getNote().trim() : "")
                    .status("ACTIVE")
                    .createdAt(now)
                    .planDetails(new ArrayList<>())
                    .build();

            for (AssignWorkoutRequest.ExerciseItemRequest item : request.getExercises()) {
                Exercise exercise = exerciseRepository.findById(item.getExerciseId())
                        .orElseThrow(() -> new RuntimeException("Bài tập ID " + item.getExerciseId() + " không tồn tại trong hệ thống."));

                CoachPlanDetail detail = CoachPlanDetail.builder()
                        .workoutPlan(plan)
                        .exercise(exercise)
                        .sets(item.getSets() != null && item.getSets() > 0 ? item.getSets() : 3)
                        .reps(item.getReps() != null && item.getReps() > 0 ? item.getReps() : 10)
                        .restSeconds(item.getRestSeconds() != null && item.getRestSeconds() >= 0 ? item.getRestSeconds() : 60)
                        .build();

                plan.getPlanDetails().add(detail);
            }

            savedPlans.add(workoutPlanRepository.save(plan));

            // Tự động tạo thông báo gửi tới học viên khi nhận bài tập mới
            String notifTitle = "[Bài tập mới] HLV " + coach.getFullName() + " vừa giao bài tập cho bạn";
            String notifMsg = "HLV đã giao lộ trình: \"" + request.getTitle().trim() + "\" gồm " + request.getExercises().size() + " bài tập. Hãy kiểm tra lộ trình luyện tập của bạn!";

            notificationsToSave.add(Notification.builder()
                    .user(student)
                    .title(notifTitle)
                    .message(notifMsg)
                    .type("ASSIGNMENT")
                    .isRead(false)
                    .createdAt(now)
                    .build());
        }

        notificationRepository.saveAll(notificationsToSave);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Giao bài tập thành công!");
        result.put("assignedStudentsCount", recipients.size());
        result.put("plansCreatedCount", savedPlans.size());
        return result;
    }

    @Override
    public List<CoachWorkoutPlanResponse> getCoachAssignedWorkouts(String coachEmail) {
        List<CoachWorkoutPlan> plans = workoutPlanRepository.findByCoachEmailOrderByCreatedAtDesc(coachEmail);
        return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private CoachWorkoutPlanResponse mapToResponse(CoachWorkoutPlan plan) {
        List<CoachWorkoutPlanResponse.ExerciseDetailDto> details = plan.getPlanDetails().stream()
                .map(d -> CoachWorkoutPlanResponse.ExerciseDetailDto.builder()
                        .detailId(d.getDetailId())
                        .exerciseId(d.getExercise() != null ? d.getExercise().getExerciseId() : null)
                        .exerciseName(d.getExercise() != null ? d.getExercise().getExerciseName() : "N/A")
                        .muscleGroup(d.getExercise() != null ? d.getExercise().getMuscleGroup() : "N/A")
                        .videoUrl(d.getExercise() != null ? d.getExercise().getVideoUrl() : null)
                        .sets(d.getSets())
                        .reps(d.getReps())
                        .restSeconds(d.getRestSeconds())
                        .build())
                .collect(Collectors.toList());

        return CoachWorkoutPlanResponse.builder()
                .planId(plan.getPlanId())
                .coachId(plan.getCoach() != null ? plan.getCoach().getUserId() : null)
                .coachName(plan.getCoach() != null ? plan.getCoach().getFullName() : "N/A")
                .userId(plan.getUser() != null ? plan.getUser().getUserId() : null)
                .studentName(plan.getUser() != null ? plan.getUser().getFullName() : "N/A")
                .title(plan.getTitle())
                .note(plan.getNote())
                .status(plan.getStatus())
                .createdAt(plan.getCreatedAt())
                .details(details)
                .build();
    }
}
