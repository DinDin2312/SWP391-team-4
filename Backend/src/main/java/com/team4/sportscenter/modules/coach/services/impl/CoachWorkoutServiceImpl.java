package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.AssignWorkoutPlanRequest;
import com.team4.sportscenter.modules.coach.dtos.request.CreateExerciseRequest;
import com.team4.sportscenter.modules.coach.dtos.request.WorkoutPlanDetailRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachWorkoutPlanResponse;
import com.team4.sportscenter.modules.coach.dtos.response.ExerciseResponse;
import com.team4.sportscenter.modules.coach.dtos.response.WorkoutPlanDetailResponse;
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
    private final CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    private final CoachClassRepository coachClassRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<ExerciseResponse> getAllExercises() {
        return exerciseRepository.findAllByOrderByExerciseNameAsc().stream()
                .map(this::mapToExerciseResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExerciseResponse createExercise(CreateExerciseRequest request) {
        if (request.getExerciseName() == null || request.getExerciseName().trim().isEmpty()) {
            throw new RuntimeException("Tên bài tập không được để trống.");
        }

        Exercise exercise = Exercise.builder()
                .exerciseName(request.getExerciseName().trim())
                .muscleGroup(request.getMuscleGroup() != null ? request.getMuscleGroup().trim() : "Chung")
                .videoUrl(request.getVideoUrl() != null ? request.getVideoUrl().trim() : "")
                .build();

        Exercise saved = exerciseRepository.save(exercise);
        return mapToExerciseResponse(saved);
    }

    @Override
    @Transactional
    public Map<String, Object> assignWorkoutPlan(AssignWorkoutPlanRequest request, String coachEmail) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu phân công bài tập không hợp lệ.");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập tiêu đề giáo án bài tập.");
        }
        if (request.getTargetType() == null || request.getTargetType().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn hình thức giao bài (Cá nhân hoặc Lớp học).");
        }
        if (request.getExerciseDetails() == null || request.getExerciseDetails().isEmpty()) {
            throw new RuntimeException("Giáo án phải chứa ít nhất 1 bài tập.");
        }

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin HLV."));

        String targetType = request.getTargetType().trim().toUpperCase();
        List<User> targetStudents = new ArrayList<>();
        String classInfo = "";

        GymClass assignedGymClass = null;

        if ("INDIVIDUAL".equals(targetType)) {
            if (request.getStudentUserId() == null) {
                throw new RuntimeException("Vui lòng chọn học viên cần giao bài.");
            }
            User student = userRepository.findById(request.getStudentUserId())
                    .orElseThrow(
                            () -> new RuntimeException("Không tìm thấy học viên ID: " + request.getStudentUserId()));
            targetStudents.add(student);
            if (request.getClassId() != null) {
                GymClass gymClass = coachClassRepository.findById(request.getClassId()).orElse(null);
                if (gymClass != null && gymClass.getCoach() != null && gymClass.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
                    assignedGymClass = gymClass;
                    classInfo = " (Lớp " + gymClass.getClassName() + ")";
                }
            }
        } else if ("CLASS".equals(targetType)) {
            if (request.getClassId() == null) {
                throw new RuntimeException("Vui lòng chọn lớp học cần giao bài.");
            }
            GymClass gymClass = coachClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học ID: " + request.getClassId()));

            if (gymClass.getCoach() == null || !gymClass.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
                throw new RuntimeException("Bạn không có quyền giao bài tập cho lớp học này.");
            }

            assignedGymClass = gymClass;
            targetStudents = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(request.getClassId(),
                    coachEmail);
            if (targetStudents.isEmpty()) {
                throw new RuntimeException("Lớp học này hiện chưa có học viên nào tham gia.");
            }
            classInfo = " (Lớp " + gymClass.getClassName() + ")";
        } else {
            throw new RuntimeException("Hình thức giao bài không hợp lệ. (Chấp nhận: INDIVIDUAL, CLASS)");
        }

        // Validate exercises exist
        Map<Integer, Exercise> exerciseMap = new HashMap<>();
        for (WorkoutPlanDetailRequest dReq : request.getExerciseDetails()) {
            if (dReq.getExerciseId() == null) {
                throw new RuntimeException("ID bài tập không được để trống.");
            }
            if (!exerciseMap.containsKey(dReq.getExerciseId())) {
                Exercise ex = exerciseRepository.findById(dReq.getExerciseId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy bài tập ID: " + dReq.getExerciseId()));
                exerciseMap.put(dReq.getExerciseId(), ex);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        List<CoachWorkoutPlan> savedPlans = new ArrayList<>();
        List<Notification> notificationsToSave = new ArrayList<>();

        boolean isTrainingPlan = "TRAINING_PLAN".equalsIgnoreCase(request.getPlanType());
        String planType = isTrainingPlan ? "TRAINING_PLAN" : "SINGLE";
        Integer totalWeeks = request.getTotalWeeks() != null && request.getTotalWeeks() > 0 ? request.getTotalWeeks() : 1;

        String notifTitle = isTrainingPlan
                ? "[Kế hoạch tập luyện mới từ HLV " + coach.getFullName() + "] " + request.getTitle().trim()
                : "[Bài tập mới từ HLV " + coach.getFullName() + "] " + request.getTitle().trim();

        String notifMessage = isTrainingPlan
                ? "HLV " + coach.getFullName() + " vừa giao cho bạn kế hoạch tập luyện: \""
                        + request.getTitle().trim() + "\" (" + totalWeeks + " tuần)" + classInfo
                        + (request.getGoal() != null && !request.getGoal().trim().isEmpty() ? ". Mục tiêu: " + request.getGoal().trim() : "")
                        + (request.getNote() != null && !request.getNote().trim().isEmpty() ? ". Ghi chú: " + request.getNote().trim() : "")
                : "HLV " + coach.getFullName() + " vừa giao cho bạn giáo án tập luyện mới: \""
                        + request.getTitle().trim() + "\"" + classInfo
                        + (request.getNote() != null && !request.getNote().trim().isEmpty() ? ". Ghi chú: " + request.getNote().trim() : "");

        for (User student : targetStudents) {
            CoachWorkoutPlan plan = CoachWorkoutPlan.builder()
                    .coach(coach)
                    .user(student)
                    .gymClass(assignedGymClass)
                    .planType(planType)
                    .title(request.getTitle().trim())
                    .goal(request.getGoal() != null ? request.getGoal().trim() : null)
                    .startDate(request.getStartDate())
                    .endDate(request.getEndDate())
                    .totalWeeks(totalWeeks)
                    .note(request.getNote() != null ? request.getNote().trim() : "")
                    .status("ACTIVE")
                    .createdAt(now)
                    .build();

            List<CoachPlanDetail> details = new ArrayList<>();
            int defaultOrder = 0;
            for (WorkoutPlanDetailRequest dReq : request.getExerciseDetails()) {
                Exercise ex = exerciseMap.get(dReq.getExerciseId());
                CoachPlanDetail detail = CoachPlanDetail.builder()
                        .workoutPlan(plan)
                        .exercise(ex)
                        .weekNumber(dReq.getWeekNumber() != null && dReq.getWeekNumber() > 0 ? dReq.getWeekNumber() : 1)
                        .dayOfWeek(dReq.getDayOfWeek())
                        .dayLabel(dReq.getDayLabel())
                        .sets(dReq.getSets() != null && dReq.getSets() > 0 ? dReq.getSets() : 3)
                        .reps(dReq.getReps() != null && dReq.getReps() > 0 ? dReq.getReps() : 10)
                        .restSeconds(dReq.getRestSeconds() != null && dReq.getRestSeconds() >= 0 ? dReq.getRestSeconds() : 60)
                        .durationMinutes(dReq.getDurationMinutes())
                        .weightKg(dReq.getWeightKg())
                        .coachNote(dReq.getCoachNote())
                        .sortOrder(dReq.getSortOrder() != null ? dReq.getSortOrder() : defaultOrder++)
                        .build();
                details.add(detail);
            }
            plan.setPlanDetails(details);
            CoachWorkoutPlan savedPlan = coachWorkoutPlanRepository.save(plan);
            savedPlans.add(savedPlan);

            // Build notification for student
            Notification notification = Notification.builder()
                    .user(student)
                    .title(notifTitle)
                    .message(notifMessage)
                    .type("WORKOUT")
                    .isRead(false)
                    .createdAt(now)
                    .build();
            notificationsToSave.add(notification);
        }

        notificationRepository.saveAll(notificationsToSave);

        Map<String, Object> response = new HashMap<>();
        response.put("message", isTrainingPlan ? "Tạo kế hoạch tập luyện và gửi thông báo thành công!" : "Giao bài tập và gửi thông báo thành công!");
        response.put("assignedStudentsCount", targetStudents.size());
        response.put("plansCreated", savedPlans.size());
        return response;
    }

    @Override
    public List<CoachWorkoutPlanResponse> getCoachWorkoutPlans(String coachEmail, Integer studentUserId) {
        return getCoachWorkoutPlans(coachEmail, studentUserId, null);
    }

    @Override
    public List<CoachWorkoutPlanResponse> getCoachWorkoutPlans(String coachEmail, Integer studentUserId, String planType) {
        List<CoachWorkoutPlan> plans;
        if (studentUserId != null) {
            plans = coachWorkoutPlanRepository.findByCoachEmailAndUserIdAndPlanTypeOrderByCreatedAtDesc(coachEmail, studentUserId, planType);
        } else {
            plans = coachWorkoutPlanRepository.findByCoachEmailAndPlanTypeOrderByCreatedAtDesc(coachEmail, planType);
        }

        return plans.stream().map(this::mapToCoachWorkoutPlanResponse).collect(Collectors.toList());
    }

    @Override
    public CoachWorkoutPlanResponse getWorkoutPlanById(Integer planId, String coachEmail) {
        CoachWorkoutPlan plan = coachWorkoutPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giáo án ID: " + planId));

        if (!plan.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new RuntimeException("Bạn không có quyền xem giáo án này.");
        }

        return mapToCoachWorkoutPlanResponse(plan);
    }

    @Override
    @Transactional
    public void deleteWorkoutPlan(Integer planId, String coachEmail) {
        CoachWorkoutPlan plan = coachWorkoutPlanRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giáo án ID: " + planId));

        if (!plan.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa giáo án này.");
        }

        coachWorkoutPlanRepository.delete(plan);
    }

    private ExerciseResponse mapToExerciseResponse(Exercise exercise) {
        return ExerciseResponse.builder()
                .exerciseId(exercise.getExerciseId())
                .exerciseName(exercise.getExerciseName())
                .muscleGroup(exercise.getMuscleGroup())
                .videoUrl(exercise.getVideoUrl())
                .build();
    }

    private WorkoutPlanDetailResponse mapToWorkoutPlanDetailResponse(CoachPlanDetail d) {
        return WorkoutPlanDetailResponse.builder()
                .detailId(d.getDetailId())
                .exerciseId(d.getExercise() != null ? d.getExercise().getExerciseId() : null)
                .exerciseName(d.getExercise() != null ? d.getExercise().getExerciseName() : "Bài tập")
                .muscleGroup(d.getExercise() != null ? d.getExercise().getMuscleGroup() : "")
                .videoUrl(d.getExercise() != null ? d.getExercise().getVideoUrl() : null)
                .weekNumber(d.getWeekNumber() != null ? d.getWeekNumber() : 1)
                .dayOfWeek(d.getDayOfWeek())
                .dayLabel(d.getDayLabel())
                .sets(d.getSets())
                .reps(d.getReps())
                .restSeconds(d.getRestSeconds())
                .durationMinutes(d.getDurationMinutes())
                .weightKg(d.getWeightKg())
                .coachNote(d.getCoachNote())
                .sortOrder(d.getSortOrder() != null ? d.getSortOrder() : 0)
                .build();
    }

    private CoachWorkoutPlanResponse mapToCoachWorkoutPlanResponse(CoachWorkoutPlan plan) {
        List<WorkoutPlanDetailResponse> detailResponses = plan.getPlanDetails() != null
                ? plan.getPlanDetails().stream()
                        .map(this::mapToWorkoutPlanDetailResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        // Nhóm theo mốc tuần (weeks) và ngày (days) nếu là TRAINING_PLAN
        List<CoachWorkoutPlanResponse.PlanWeekGroup> weeks = new ArrayList<>();
        boolean isTrainingPlan = "TRAINING_PLAN".equalsIgnoreCase(plan.getPlanType());
        if (isTrainingPlan && plan.getPlanDetails() != null && !plan.getPlanDetails().isEmpty()) {
            Map<Integer, List<CoachPlanDetail>> byWeek = plan.getPlanDetails().stream()
                    .collect(Collectors.groupingBy(d -> d.getWeekNumber() != null ? d.getWeekNumber() : 1, TreeMap::new, Collectors.toList()));

            for (Map.Entry<Integer, List<CoachPlanDetail>> entry : byWeek.entrySet()) {
                Integer weekNum = entry.getKey();
                List<CoachPlanDetail> weekDetails = entry.getValue();

                Map<String, List<CoachPlanDetail>> byDay = weekDetails.stream()
                        .collect(Collectors.groupingBy(d -> d.getDayOfWeek() != null ? d.getDayOfWeek() : "OTHER", LinkedHashMap::new, Collectors.toList()));

                List<CoachWorkoutPlanResponse.PlanDayGroup> days = new ArrayList<>();
                for (Map.Entry<String, List<CoachPlanDetail>> dayEntry : byDay.entrySet()) {
                    List<CoachPlanDetail> dayDetails = dayEntry.getValue();
                    dayDetails.sort(Comparator.comparingInt(d -> d.getSortOrder() != null ? d.getSortOrder() : 0));

                    String label = dayDetails.stream()
                            .map(CoachPlanDetail::getDayLabel)
                            .filter(l -> l != null && !l.trim().isEmpty())
                            .findFirst()
                            .orElse(dayEntry.getKey());

                    List<WorkoutPlanDetailResponse> exercises = dayDetails.stream()
                            .map(this::mapToWorkoutPlanDetailResponse)
                            .collect(Collectors.toList());

                    days.add(CoachWorkoutPlanResponse.PlanDayGroup.builder()
                            .dayOfWeek(dayEntry.getKey())
                            .dayLabel(label)
                            .exercises(exercises)
                            .build());
                }

                weeks.add(CoachWorkoutPlanResponse.PlanWeekGroup.builder()
                        .weekNumber(weekNum)
                        .weekTitle("Tuần " + weekNum)
                        .days(days)
                        .build());
            }
        }

        return CoachWorkoutPlanResponse.builder()
                .planId(plan.getPlanId())
                .coachId(plan.getCoach() != null ? plan.getCoach().getUserId() : null)
                .coachName(plan.getCoach() != null ? plan.getCoach().getFullName() : "HLV")
                .userId(plan.getUser() != null ? plan.getUser().getUserId() : null)
                .studentName(plan.getUser() != null ? plan.getUser().getFullName() : "Học viên")
                .studentEmail(plan.getUser() != null ? plan.getUser().getEmail() : "")
                .title(plan.getTitle())
                .note(plan.getNote())
                .status(plan.getStatus())
                .classId(plan.getGymClass() != null ? plan.getGymClass().getClassId() : null)
                .className(plan.getGymClass() != null ? plan.getGymClass().getClassName() : null)
                .planType(plan.getPlanType() != null ? plan.getPlanType() : "SINGLE")
                .goal(plan.getGoal())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .totalWeeks(plan.getTotalWeeks() != null ? plan.getTotalWeeks() : 1)
                .createdAt(plan.getCreatedAt())
                .details(detailResponses)
                .weeks(weeks)
                .build();
    }
}
