package com.team4.sportscenter.modules.coach.services.impl;

import com.team4.sportscenter.modules.coach.dtos.response.*;
import com.team4.sportscenter.modules.coach.services.*;
import com.team4.sportscenter.modules.rag.dtos.AiChatResponse;
import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import com.team4.sportscenter.modules.rag.gemini.Turn;
import com.team4.sportscenter.modules.rag.services.PromptAssembler;
import com.team4.sportscenter.modules.rag.services.RetrievalService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class CoachAiChatServiceImpl implements CoachAiChatService {

    private static final Logger log = LoggerFactory.getLogger(CoachAiChatServiceImpl.class);

    @Autowired
    private CoachWorkoutService coachWorkoutService;

    @Autowired
    private CoachScheduleService coachScheduleService;

    @Autowired
    private CoachNotificationService coachNotificationService;

    @Autowired
    private CoachAssessmentService coachAssessmentService;

    @Autowired
    private GeminiClient geminiClient;
    @Autowired
    private RetrievalService retrievalService;

    @Override
    public String chat(String userMessage, String coachEmail) {
        return chat(userMessage, Collections.emptyList(), coachEmail);
    }

    @Override
    public AiChatResponse chatDetailed(String userMessage, List<Turn> history, String coachEmail) {
        if (!geminiClient.isConfigured()) {
            return new AiChatResponse("Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!", Collections.emptyList());
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new AiChatResponse("Xin chào Coach! Mình là NEXUS COACH AI - trợ lý chuyên môn của bạn. Bạn muốn mình hỗ trợ soạn giáo án, giao bài tập cho học viên/lớp, hay phân tích thể trạng học viên nào hôm nay? 🏋️‍♂️", Collections.emptyList());
        }

        CoachPromptContext ctx = buildCoachPromptContext(userMessage, coachEmail);

        long geminiStart = System.currentTimeMillis();
        List<Turn> sanitizedHistory = sanitizeHistory(history);
        Optional<String> answer = geminiClient.generate(sanitizedHistory, ctx.systemPrompt() + userMessage, 3000);
        long geminiMs = System.currentTimeMillis() - geminiStart;

        log.info("CoachAiChat timing: geminiMs={}, success={}", geminiMs, answer.isPresent());

        List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
        for (int i = 0; i < ctx.knowledgeChunks().size(); i++) {
            RetrievedChunk c = ctx.knowledgeChunks().get(i);
            citations.add(new AiChatResponse.SourceCitation(i + 1, c.documentTitle(), c.category()));
        }

        String finalText = answer.orElse("Xin lỗi Coach, hệ thống AI hiện đang bận do lượng truy cập cao. Vui lòng thử lại sau giây lát! 💪");
        return new AiChatResponse(finalText, citations);
    }

    @Override
    public SseEmitter chatStream(String userMessage, List<Turn> history, String coachEmail) {
        SseEmitter emitter = new SseEmitter(120_000L);
        if (!geminiClient.isConfigured()) {
            try {
                emitter.send(SseEmitter.event().name("delta").data(Map.of("text", "Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!")));
                emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                emitter.complete();
            } catch (Exception ignored) {}
            return emitter;
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            try {
                emitter.send(SseEmitter.event().name("delta").data(Map.of("text", "Xin chào Coach! Mình là NEXUS COACH AI - trợ lý chuyên môn của bạn. Bạn muốn mình hỗ trợ soạn giáo án, giao bài tập cho học viên/lớp, hay phân tích thể trạng học viên nào hôm nay? 🏋️‍♂️")));
                emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                emitter.complete();
            } catch (Exception ignored) {}
            return emitter;
        }

        CompletableFuture.runAsync(() -> {
            try {
                // Flush headers early so the UI switches to a live progress state immediately.
                emitter.send(SseEmitter.event().name("status").data(Map.of("stage", "searching")));

                CoachPromptContext ctx = buildCoachPromptContext(userMessage, coachEmail);
                List<Turn> sanitizedHistory = sanitizeHistory(history);
                List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
                for (int i = 0; i < ctx.knowledgeChunks().size(); i++) {
                    RetrievedChunk c = ctx.knowledgeChunks().get(i);
                    citations.add(new AiChatResponse.SourceCitation(i + 1, c.documentTitle(), c.category()));
                }

                emitter.send(SseEmitter.event().name("status").data(Map.of("stage", "generating")));

                Optional<String> fullText = geminiClient.stream(
                        sanitizedHistory,
                        ctx.systemPrompt() + userMessage,
                        3000,
                        delta -> {
                            try {
                                emitter.send(SseEmitter.event().name("delta").data(Map.of("text", delta)));
                            } catch (Exception e) {
                                log.warn("Failed to send SSE delta to coach: {}", e.getMessage());
                            }
                        }
                );

                if (fullText.isPresent()) {
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", citations, "fullText", fullText.get())));
                    emitter.complete();
                } else {
                    emitter.send(SseEmitter.event().name("delta").data(Map.of("text", "Xin lỗi Coach, hệ thống AI hiện đang bận do lượng truy cập cao. Vui lòng thử lại sau giây lát! 💪")));
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                    emitter.complete();
                }
            } catch (Exception e) {
                log.error("Error during Coach AI chat streaming: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    private record CoachPromptContext(String systemPrompt, List<RetrievedChunk> knowledgeChunks) {}

    private CoachPromptContext buildCoachPromptContext(String userMessage, String coachEmail) {
        long contextStart = System.currentTimeMillis();

        // 1.1 Thư viện bài tập trong hệ thống (chỉ nạp đầy đủ khi Coach đề cập đến bài tập/giáo án)
        boolean needsExerciseList = userMessage != null && userMessage.matches("(?i).*(giáo án|bài tập|giao bài|plan|workout|tập|exercise|buổi tập).*");
        String exercisesListString;
        if (needsExerciseList) {
            List<ExerciseResponse> exercises = coachWorkoutService.getAllExercises();
            exercisesListString = exercises.stream()
                .map(e -> {
                    String avoid = (e.getContraindications() != null && !e.getContraindications().isEmpty())
                        ? " {avoid: " + String.join(",", e.getContraindications()) + "}"
                        : "";
                    return "[" + e.getExerciseId() + "] " + e.getExerciseName() + " (" + e.getMuscleGroup() + ")" + avoid;
                })
                .collect(Collectors.joining(", "));
        } else {
            exercisesListString = "(Hơn 20 bài tập compound & isolate có sẵn trong hệ thống. Chỉ tải chi tiết khi Coach yêu cầu soạn bài tập/giáo án).";
        }

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
                    .append(com.team4.sportscenter.modules.member.health.HealthPromptBuilder.studentLine(s.getHealth()))
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

        List<RetrievedChunk> knowledgeChunks = retrievalService.retrieve(userMessage, Audience.COACH);
        String knowledgeBlock = PromptAssembler.knowledgeBlock(knowledgeChunks);

        long contextMs = System.currentTimeMillis() - contextStart;
        log.info("CoachAiChat context timing: {}ms", contextMs);

        String systemPrompt = "You are NEXUS COACH AI, an elite Master Strength & Conditioning Specialist, Exercise Physiologist, and Senior Training Assistant exclusively for Coaches at NEXUS Sports Lab.\n" +
                knowledgeBlock +
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
                "RULE 4 - Medical Safety & Contraindications (BẮT BUỘC TUÂN THỦ):\n" +
                "Never place an exercise whose {avoid: ...} tags intersect the student's conditions; if the coach insists, warn explicitly and suggest safe alternatives.\n\n" +
                "CRITICAL FORMAT RULES:\n" +
                "- NEVER put the [ACTION:...] inside markdown code blocks (no ```).\n" +
                "- Put the [ACTION:...] at the VERY END of your response as a single compact line.\n" +
                "- Always provide a clear, concise, supportive explanation in your conversational text before the action tag.\n\n" +
                "Coach's message: ";

        return new CoachPromptContext(systemPrompt, knowledgeChunks);
    }

    private List<Turn> sanitizeHistory(List<Turn> raw) {
        if (raw == null || raw.isEmpty()) return Collections.emptyList();
        List<Turn> valid = new ArrayList<>();
        for (Turn turn : raw) {
            if (turn == null || turn.text() == null || turn.text().trim().isEmpty()) continue;
            String role = "user".equalsIgnoreCase(turn.role()) ? "user" : "model";
            String text = turn.text().trim();
            if (text.length() > 500) {
                text = text.substring(0, 500);
            }
            valid.add(new Turn(role, text));
        }
        if (valid.size() > 6) {
            valid = valid.subList(valid.size() - 6, valid.size());
        }
        return valid;
    }
}
