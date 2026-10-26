package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.response.*;
import com.team4.sportscenter.modules.coach.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CoachAiChatServiceImpl implements CoachAiChatService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Autowired
    private CoachWorkoutService coachWorkoutService;

    @Autowired
    private CoachScheduleService coachScheduleService;

    @Autowired
    private CoachNotificationService coachNotificationService;

    @Autowired
    private CoachAssessmentService coachAssessmentService;

    @Override
    public String chat(String userMessage, String coachEmail) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            return "Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!";
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "Xin chào Coach! Mình là NEXUS COACH AI - trợ lý chuyên môn của bạn. Bạn muốn mình hỗ trợ soạn giáo án, giao bài tập cho học viên/lớp, hay phân tích thể trạng học viên nào hôm nay? 🏋️‍♂️";
        }

        // ==================== 1. FETCH DATA FOR RAG ====================
        
        // 1.1 Thư viện bài tập trong hệ thống
        List<ExerciseResponse> exercises = coachWorkoutService.getAllExercises();
        String exercisesListString = exercises.stream()
            .map(e -> "[" + e.getExerciseId() + "] " + e.getExerciseName() + " (" + e.getMuscleGroup() + ")")
            .collect(Collectors.joining(", "));

        // 1.2 Danh sách lớp học Coach đang phụ trách
        List<CoachClassResponse> classes = coachNotificationService.getCoachClasses(coachEmail);
        String classesListString = classes.isEmpty() ? "Không có lớp học nào." : classes.stream()
            .map(c -> "[" + c.getClassId() + "] " + c.getClassName() + " (" + c.getRoomName() + ", Sĩ số: " + (c.getEnrolledCount() != null ? c.getEnrolledCount() : 0) + "/" + c.getMaxSlots() + ")")
            .collect(Collectors.joining("\n"));

        // 1.3 Lịch sử đánh giá / nhận xét của Coach cho học viên
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<TraineeAssessmentResponse> assessments = Collections.emptyList();
        try {
            assessments = coachAssessmentService.getCoachAssessments(coachEmail, null);
        } catch (Exception ex) {
            // Ignore if error fetching assessments
        }

        // Gom nhóm nhận xét theo userId để dễ tra cứu
        Map<Integer, List<TraineeAssessmentResponse>> assessmentsByStudent = assessments.stream()
            .filter(a -> a.getUserId() != null)
            .collect(Collectors.groupingBy(TraineeAssessmentResponse::getUserId));

        // 1.4 Danh sách học viên của Coach kèm theo nhận xét & chỉ số thể trạng
        List<CoachStudentResponse> students = coachScheduleService.getCoachStudents(coachEmail);
        StringBuilder studentsInfoBuilder = new StringBuilder();
        if (students.isEmpty()) {
            studentsInfoBuilder.append("Hiện chưa có học viên nào được phân công.");
        } else {
            for (CoachStudentResponse s : students) {
                studentsInfoBuilder.append("• Student ID: ").append(s.getUserId())
                    .append(" | Tên: ").append(s.getFullName())
                    .append(" | Email: ").append(s.getEmail() != null ? s.getEmail() : "N/A")
                    .append(" | Lớp đang theo học: ").append(s.getEnrolledClasses() != null && !s.getEnrolledClasses().isEmpty() ? String.join(", ", s.getEnrolledClasses()) : "Chưa có")
                    .append(" | Mục tiêu: ").append(s.getWorkoutGoal() != null ? s.getWorkoutGoal() : "Chưa xác định")
                    .append(" | Thể lực: ").append(s.getFitnessLevel() != null ? s.getFitnessLevel() : "Trung bình")
                    .append("\n");

                // Tra cứu nhận xét gần nhất của Coach dành cho học viên này
                List<TraineeAssessmentResponse> studentAssessments = assessmentsByStudent.get(s.getUserId());
                if (studentAssessments != null && !studentAssessments.isEmpty()) {
                    studentsInfoBuilder.append("   [LỊCH SỬ NHẬN XÉT & THỂ TRẠNG GẦN NHẤT CỦA HỌC VIÊN NÀY]:\n");
                    // Lấy 1 nhận xét mới nhất để tối ưu token & phản hồi cực nhanh
                    int limit = Math.min(studentAssessments.size(), 1);
                    for (int i = 0; i < limit; i++) {
                        TraineeAssessmentResponse a = studentAssessments.get(i);
                        studentsInfoBuilder.append("   - Ngày: ").append(a.getCreatedAt() != null ? a.getCreatedAt().format(dtf) : "N/A")
                            .append(" | Cân nặng: ").append(a.getWeight() != null ? a.getWeight() + "kg" : "N/A")
                            .append(" | Chiều cao: ").append(a.getHeight() != null ? a.getHeight() + "cm" : "N/A")
                            .append(" | Mỡ (BodyFat): ").append(a.getBodyFatPercentage() != null ? a.getBodyFatPercentage() + "%" : "N/A")
                            .append(" | Cơ (Muscle): ").append(a.getMuscleMass() != null ? a.getMuscleMass() + "kg" : "N/A")
                            .append(" | Đánh giá phong độ: ").append(a.getPerformanceRating() != null ? a.getPerformanceRating() + "/5" : "N/A")
                            .append("\n")
                            .append("     + Ghi chú nhận xét của Coach: \"").append(a.getFeedbackNote() != null ? a.getFeedbackNote() : "").append("\"\n")
                            .append("     + Lời khuyên của Coach: \"").append(a.getRecommendation() != null ? a.getRecommendation() : "").append("\"\n");
                    }
                } else {
                    studentsInfoBuilder.append("   [Chưa có bản nhận xét nào trước đây]\n");
                }
            }
        }

        // ==================== 2. PROMPT ENGINEERING ====================
        String systemPrompt = "You are NEXUS COACH AI, an elite Master Strength & Conditioning Specialist, Exercise Physiologist, and Senior Training Assistant exclusively for Coaches at NEXUS Sports Lab.\n" +
                "Your tone is professional, collegial, energetic, and scientifically sound. Always respond in the exact same language the coach uses (Vietnamese or English).\n\n" +
                "=== CORE MISSION ===\n" +
                "Assist the coach in designing highly effective, personalized, and safe workout routines or multi-week training plans for their trainees or classes.\n\n" +
                "=== CRITICAL RULE: UTILIZE PAST ASSESSMENTS & COACH FEEDBACK (RẤT QUAN TRỌNG) ===\n" +
                "In the knowledge base below, each student includes past coach assessments, physical metrics (weight, body fat, muscle), and crucially the Coach's previous feedback notes and recommendations.\n" +
                "When suggesting or generating workouts for a specific student:\n" +
                "1. You MUST check their latest assessment notes (e.g., pain/tightness, weak core, wrist/shoulder strain, knee discomfort, low stamina, overtraining signs, or specific recommendations).\n" +
                "2. Explicitly incorporate these points into your advice and choice of exercises (e.g. choose dumbbell over barbell if wrist strain, include core stabilization if back pain, adjust reps/rest accordingly).\n" +
                "3. In your response, briefly mention to the coach why you tailored this session based on their past assessment (e.g. 'Dựa trên nhận xét của Coach về việc học viên còn đau mỏi lưng dưới, mình đã ưu tiên các bài tập ngực/tay sau nằm trên ghế và cô lập, tránh các bài gánh nặng cột sống...').\n\n" +
                "=== KNOWLEDGE BASE ===\n" +
                "--- 1. SYSTEM EXERCISES (KHO BÀI TẬP HIỆN CÓ TRONG HỆ THỐNG - BẮT BUỘC DÙNG ID NÀY) ---\n" +
                exercisesListString + "\n\n" +
                "--- 2. COACH'S ASSIGNED CLASSES (LỚP HỌC COACH PHỤ TRÁCH) ---\n" +
                classesListString + "\n\n" +
                "--- 3. COACH'S TRAINEES & LATEST ASSESSMENTS (HỌC VIÊN & LỊCH SỬ NHẬN XÉT) ---\n" +
                studentsInfoBuilder.toString() + "\n\n" +
                "=== AGENTIC AUTOMATION RULES (AUTO-FILL FORMS) ===\n" +
                "You have the unique power to automatically populate the Coach's workout assignment form by appending an action tag at the VERY END of your reply.\n\n" +
                "RULE 1 - Single Workout (Giao bài tập đơn 1 buổi):\n" +
                "If the coach asks to assign/create a single workout session, append:\n" +
                "[ACTION:PREFILL_SINGLE_WORKOUT:{\"targetType\":\"INDIVIDUAL\",\"classId\":<classId_or_null>,\"studentUserId\":<studentUserId_or_null>,\"title\":\"<Tiêu đề buổi tập>\",\"note\":\"<Ghi chú buổi tập>\",\"exercises\":[{\"exerciseId\":<id>,\"sets\":<number>,\"reps\":<number>,\"restSeconds\":<number>}]}]\n" +
                "- Note: If the student belongs to a specific class from the list, set classId to that class's numeric ID so the UI can auto-select the class dropdown. If targeting a whole class, set targetType to \"CLASS\", studentUserId to null, and classId to the class ID.\n" +
                "- ONLY use numeric exerciseIds that exist in the System Exercises list above!\n\n" +
                "RULE 2 - Multi-Week Training Plan (Kế hoạch tập luyện theo chu kỳ nhiều tuần):\n" +
                "If the coach asks to create a multi-week plan (e.g. 4 tuần giảm cân, 6 tuần tăng cơ), append:\n" +
                "[ACTION:PREFILL_TRAINING_PLAN:{\"targetType\":\"INDIVIDUAL\",\"classId\":<classId_or_null>,\"studentUserId\":<studentUserId_or_null>,\"title\":\"<Tiêu đề kế hoạch>\",\"goal\":\"<Mục tiêu>\",\"totalWeeks\":<number>,\"note\":\"<Ghi chú>\",\"schedule\":{\"MONDAY\":{\"active\":true,\"label\":\"<Tên buổi tập>\",\"durationMinutes\":<minutes>,\"exercises\":[{\"exerciseId\":<id>,\"sets\":<number>,\"reps\":<number>,\"restSeconds\":<number>,\"coachNote\":\"<Lưu ý bài>\"}]},\"WEDNESDAY\":{...},\"FRIDAY\":{...}}}]\n" +
                "- The days of week keys must be standard English: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY.\n\n" +
                "RULE 3 - Navigation:\n" +
                "To navigate the coach: Append [ACTION:NAVIGATE:/coach/workouts] or [ACTION:NAVIGATE:/coach/students] or [ACTION:NAVIGATE:/coach/schedule]\n\n" +
                "CRITICAL FORMAT RULES:\n" +
                "- NEVER put the [ACTION:...] inside markdown code blocks (no ```).\n" +
                "- Put the [ACTION:...] at the VERY END of your response as a single compact line.\n" +
                "- Always provide a clear, concise, supportive explanation in your conversational text before the action tag.\n\n" +
                "Coach's message: ";

        // ==================== 3. CALL GEMINI API ====================
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2500);
        factory.setReadTimeout(5000);
        RestTemplate restTemplate = new RestTemplate(factory);

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", systemPrompt + userMessage);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));

        requestBody.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", 500);
        generationConfig.put("temperature", 0.7);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String[] models = {"gemini-3-flash-preview", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"};

        for (String model : models) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && responseBody.containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                    if (!candidates.isEmpty()) {
                        Map<String, Object> firstCandidate = candidates.get(0);
                        Map<String, Object> contentMap = (Map<String, Object>) firstCandidate.get("content");
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                        if (!parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore and try next model
            }
        }

        return "Xin lỗi Coach, hệ thống AI hiện đang bận do lượng truy cập cao. Vui lòng thử lại sau giây lát! 💪";
    }
}
