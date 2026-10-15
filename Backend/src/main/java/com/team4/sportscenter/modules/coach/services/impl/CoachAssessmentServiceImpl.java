package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.CreateTraineeAssessmentRequest;
import com.team4.sportscenter.modules.coach.dtos.response.EnrolledStudentResponse;
import com.team4.sportscenter.modules.coach.dtos.response.TraineeAssessmentResponse;
import com.team4.sportscenter.modules.coach.entities.CoachWorkoutPlan;
import com.team4.sportscenter.modules.coach.entities.TraineeAssessment;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachScheduleRepository;
import com.team4.sportscenter.modules.coach.repositories.CoachWorkoutPlanRepository;
import com.team4.sportscenter.modules.coach.repositories.TraineeAssessmentRepository;
import com.team4.sportscenter.modules.coach.services.CoachAssessmentService;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.notification.entities.Notification;
import com.team4.sportscenter.modules.notification.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachAssessmentServiceImpl implements CoachAssessmentService {

    private final TraineeAssessmentRepository traineeAssessmentRepository;
    private final UserRepository userRepository;
    private final CoachClassRepository coachClassRepository;
    private final CoachScheduleRepository coachScheduleRepository;
    private final CoachWorkoutPlanRepository coachWorkoutPlanRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public TraineeAssessmentResponse createAssessment(CreateTraineeAssessmentRequest request, String coachEmail) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu đánh giá không hợp lệ.");
        }
        if (request.getStudentUserId() == null) {
            throw new RuntimeException("Vui lòng chọn học viên cần đánh giá.");
        }
        if (request.getFeedbackNote() == null || request.getFeedbackNote().trim().isEmpty()) {
            throw new RuntimeException("Nhận xét của HLV không được để trống.");
        }

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin HLV: " + coachEmail));

        User student = userRepository.findById(request.getStudentUserId())
                .orElseThrow(
                        () -> new RuntimeException("Không tìm thấy học viên với ID: " + request.getStudentUserId()));

        Schedule schedule = null;
        if (request.getScheduleId() != null) {
            schedule = coachScheduleRepository.findById(request.getScheduleId()).orElse(null);
        }
        if (schedule == null && request.getClassId() != null) {
            List<Schedule> enrolledSchedules = bookingRepository
                    .findEnrolledSchedulesByEmailAndClassId(student.getEmail(), request.getClassId());
            if (!enrolledSchedules.isEmpty()) {
                schedule = enrolledSchedules.get(0);
            }
        }

        Booking booking = null;
        if (request.getBookingId() != null) {
            booking = bookingRepository.findById(request.getBookingId()).orElse(null);
        }
        if (booking == null && schedule != null) {
            final Integer schedId = schedule.getScheduleId();
            booking = bookingRepository.findAllBookingsByEmail(student.getEmail()).stream()
                    .filter(b -> b.getSchedule() != null && b.getSchedule().getScheduleId().equals(schedId))
                    .findFirst().orElse(null);
        }

        CoachWorkoutPlan workoutPlan = null;
        if (request.getPlanId() != null) {
            workoutPlan = coachWorkoutPlanRepository.findById(request.getPlanId()).orElse(null);
        }

        String title = request.getAssessmentTitle();
        if (title == null || title.trim().isEmpty()) {
            title = "Đánh giá tiến độ buổi tập";
        }

        TraineeAssessment assessment = TraineeAssessment.builder()
                .coach(coach)
                .user(student)
                .schedule(schedule)
                .booking(booking)
                .workoutPlan(workoutPlan)
                .assessmentTitle(title.trim())
                .weight(request.getWeight())
                .height(request.getHeight())
                .bodyFatPercentage(request.getBodyFatPercentage())
                .muscleMass(request.getMuscleMass())
                .performanceRating(request.getPerformanceRating())
                .attendanceRating(request.getAttendanceRating())
                .feedbackNote(request.getFeedbackNote().trim())
                .recommendation(request.getRecommendation() != null ? request.getRecommendation().trim() : null)
                .createdAt(LocalDateTime.now())
                .build();

        TraineeAssessment saved = traineeAssessmentRepository.save(assessment);

        // Gửi thông báo tự động đến học viên
        try {
            Notification notification = Notification.builder()
                    .user(student)
                    .title("[HLV " + coach.getFullName() + "] Nhận xét & Đánh giá tiến độ mới")
                    .message("HLV " + coach.getFullName() + " vừa đưa ra nhận xét tiến độ tập luyện mới cho bạn: \""
                            + saved.getAssessmentTitle() + "\". Hãy vào hồ sơ để kiểm tra chi tiết!")
                    .type("COACH")
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            notificationRepository.save(notification);
        } catch (Exception ex) {
            // Không làm gián đoạn việc lưu đánh giá nếu tạo thông báo gặp lỗi
        }

        return mapToResponse(saved);
    }

    @Override
    public List<TraineeAssessmentResponse> getCoachAssessments(String coachEmail, Integer studentUserId) {
        List<TraineeAssessment> list;
        if (studentUserId != null) {
            list = traineeAssessmentRepository.findByCoachEmailAndUserIdOrderByCreatedAtDesc(coachEmail, studentUserId);
        } else {
            list = traineeAssessmentRepository.findByCoachEmailOrderByCreatedAtDesc(coachEmail);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<TraineeAssessmentResponse> getStudentAssessmentHistory(Integer studentUserId, String coachEmail) {
        List<TraineeAssessment> list = traineeAssessmentRepository
                .findByCoachEmailAndUserIdOrderByCreatedAtDesc(coachEmail, studentUserId);
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<EnrolledStudentResponse> getStudentsByClassId(Integer classId, String coachEmail) {
        List<User> students = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(classId, coachEmail);
        return students.stream().map(st -> EnrolledStudentResponse.builder()
                .userId(st.getUserId())
                .fullName(st.getFullName())
                .email(st.getEmail())
                .phone(st.getPhone())
                .bookingStatus("CONFIRMED")
                .attendanceStatus("NOT_YET")
                .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAssessment(Integer assessmentId, String coachEmail) {
        TraineeAssessment assessment = traineeAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá với ID: " + assessmentId));

        if (!assessment.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này.");
        }

        traineeAssessmentRepository.delete(assessment);
    }

    public static TraineeAssessmentResponse mapAssessmentToResponse(TraineeAssessment a) {
        Integer classId = null;
        String className = null;

        if (a.getSchedule() != null && a.getSchedule().getGymClass() != null) {
            classId = a.getSchedule().getGymClass().getClassId();
            className = a.getSchedule().getGymClass().getClassName();
        } else if (a.getBooking() != null && a.getBooking().getSchedule() != null
                && a.getBooking().getSchedule().getGymClass() != null) {
            classId = a.getBooking().getSchedule().getGymClass().getClassId();
            className = a.getBooking().getSchedule().getGymClass().getClassName();
        } else if (a.getWorkoutPlan() != null && a.getWorkoutPlan().getGymClass() != null) {
            classId = a.getWorkoutPlan().getGymClass().getClassId();
            className = a.getWorkoutPlan().getGymClass().getClassName();
        }

        return TraineeAssessmentResponse.builder()
                .assessmentId(a.getAssessmentId())
                .coachId(a.getCoach() != null ? a.getCoach().getUserId() : null)
                .coachName(a.getCoach() != null ? a.getCoach().getFullName() : null)
                .coachEmail(a.getCoach() != null ? a.getCoach().getEmail() : null)
                .userId(a.getUser() != null ? a.getUser().getUserId() : null)
                .fullName(a.getUser() != null ? a.getUser().getFullName() : null)
                .email(a.getUser() != null ? a.getUser().getEmail() : null)
                .phone(a.getUser() != null ? a.getUser().getPhone() : null)
                .classId(classId)
                .className(className)
                .scheduleId(a.getSchedule() != null ? a.getSchedule().getScheduleId() : null)
                .bookingId(a.getBooking() != null ? a.getBooking().getBookingId() : null)
                .planId(a.getWorkoutPlan() != null ? a.getWorkoutPlan().getPlanId() : null)
                .planTitle(a.getWorkoutPlan() != null ? a.getWorkoutPlan().getTitle() : null)
                .assessmentTitle(a.getAssessmentTitle())
                .weight(a.getWeight())
                .height(a.getHeight())
                .bodyFatPercentage(a.getBodyFatPercentage())
                .muscleMass(a.getMuscleMass())
                .performanceRating(a.getPerformanceRating())
                .attendanceRating(a.getAttendanceRating())
                .feedbackNote(a.getFeedbackNote())
                .recommendation(a.getRecommendation())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private TraineeAssessmentResponse mapToResponse(TraineeAssessment a) {
        return mapAssessmentToResponse(a);
    }
}
