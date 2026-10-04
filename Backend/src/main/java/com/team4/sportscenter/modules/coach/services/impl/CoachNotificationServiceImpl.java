package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.auth.entities.User;
import com.team4.sportscenter.modules.auth.repositories.UserRepository;
import com.team4.sportscenter.modules.coach.dtos.request.SendCoachNotificationRequest;
import com.team4.sportscenter.modules.coach.dtos.response.CoachClassResponse;
import com.team4.sportscenter.modules.coach.repositories.CoachClassRepository;
import com.team4.sportscenter.modules.coach.services.CoachNotificationService;
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
public class CoachNotificationServiceImpl implements CoachNotificationService {

    private final CoachClassRepository coachClassRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @Override
    public List<CoachClassResponse> getCoachClasses(String coachEmail) {
        List<GymClass> classes = coachClassRepository.findClassesByCoachEmail(coachEmail);

        return classes.stream().map(c -> {
            List<User> students = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(c.getClassId(), coachEmail);
            return CoachClassResponse.builder()
                    .classId(c.getClassId())
                    .className(c.getClassName())
                    .roomName(c.getRoom() != null ? c.getRoom().getRoomName() : "N/A")
                    .maxSlots(c.getMaxSlots())
                    .enrolledCount(students.size())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> sendNotification(SendCoachNotificationRequest request, String coachEmail) {
        if (request == null) {
            throw new RuntimeException("Dữ liệu yêu cầu gửi thông báo không hợp lệ.");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Tiêu đề thông báo không được để trống.");
        }
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            throw new RuntimeException("Nội dung thông báo không được để trống.");
        }
        if (request.getTargetType() == null || request.getTargetType().trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn đối tượng nhận thông báo.");
        }

        String targetType = request.getTargetType().trim().toUpperCase();
        List<User> recipients = new ArrayList<>();

        if ("ALL".equals(targetType)) {
            recipients = coachClassRepository.findDistinctStudentsByCoachEmail(coachEmail);
            if (recipients.isEmpty()) {
                throw new RuntimeException("Bạn chưa có học viên nào đăng ký các lớp học do bạn huấn luyện.");
            }
        } else if ("CLASS".equals(targetType)) {
            if (request.getClassId() == null) {
                throw new RuntimeException("Vui lòng chọn lớp học cần gửi thông báo.");
            }
            GymClass gymClass = coachClassRepository.findById(request.getClassId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lớp học với ID: " + request.getClassId()));

            if (gymClass.getCoach() == null || !gymClass.getCoach().getEmail().equalsIgnoreCase(coachEmail)) {
                throw new RuntimeException("Bạn không có quyền gửi thông báo cho lớp học này.");
            }

            recipients = coachClassRepository.findDistinctStudentsByClassIdAndCoachEmail(request.getClassId(), coachEmail);
            if (recipients.isEmpty()) {
                throw new RuntimeException("Lớp học này hiện chưa có học viên nào đăng ký.");
            }
        } else if ("INDIVIDUAL".equals(targetType)) {
            if (request.getRecipientUserId() == null) {
                throw new RuntimeException("Vui lòng chọn học viên nhận thông báo.");
            }
            User recipient = userRepository.findById(request.getRecipientUserId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy học viên với ID: " + request.getRecipientUserId()));

            recipients.add(recipient);
        } else {
            throw new RuntimeException("Hình thức gửi không hợp lệ. (Chấp nhận: ALL, CLASS, INDIVIDUAL)");
        }

        String notifType = (request.getType() != null && !request.getType().trim().isEmpty()) 
                ? request.getType().trim().toUpperCase() 
                : "COACH";

        User coach = userRepository.findByEmail(coachEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin HLV."));
        String finalTitle = "[Từ HLV " + coach.getFullName() + "] " + request.getTitle().trim();

        LocalDateTime now = LocalDateTime.now();
        List<Notification> notificationsToSave = recipients.stream().map(student -> Notification.builder()
                .user(student)
                .title(finalTitle)
                .message(request.getMessage().trim())
                .type(notifType)
                .isRead(false)
                .createdAt(now)
                .build()).collect(Collectors.toList());

        notificationRepository.saveAll(notificationsToSave);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Gửi thông báo thành công!");
        response.put("sentCount", notificationsToSave.size());
        return response;
    }
}
