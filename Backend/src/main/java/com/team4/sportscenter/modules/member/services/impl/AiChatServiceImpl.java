package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.services.AiChatService;
import com.team4.sportscenter.modules.member.services.MemberService;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import com.team4.sportscenter.modules.member.entities.Booking;
import com.team4.sportscenter.modules.member.entities.Schedule;
import com.team4.sportscenter.modules.member.repositories.BookingRepository;
import com.team4.sportscenter.modules.member.repositories.ScheduleRepository;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
public class AiChatServiceImpl implements AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatServiceImpl.class);

    @Autowired
    private MemberService memberService;
    @Autowired
    private com.team4.sportscenter.modules.member.health.MemberHealthService memberHealthService;
    @Autowired
    private com.team4.sportscenter.modules.auth.repositories.UserRepository userRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private ScheduleRepository scheduleRepository;
    @Autowired
    private GeminiClient geminiClient;
    @Autowired
    private RetrievalService retrievalService;

    @Override
    public String chat(String userMessage, String email) {
        return chat(userMessage, Collections.emptyList(), email);
    }

    @Override
    public AiChatResponse chatDetailed(String userMessage, List<Turn> history, String email) {
        if (!geminiClient.isConfigured()) {
            return new AiChatResponse("Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!", Collections.emptyList());
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return new AiChatResponse("Xin chào! Mình là NEXUS AI, trợ lý ảo của NEXUS Sports Lab. Bạn cần mình hỗ trợ gì về gói tập, lớp học hay bài tập hôm nay không? 💪", Collections.emptyList());
        }

        long contextStart = System.currentTimeMillis();
        List<RetrievedChunk> knowledgeChunks = retrievalService.retrieve(userMessage, Audience.MEMBER);
        String systemPrompt = buildSystemPrompt(userMessage, email, knowledgeChunks);
        long contextMs = System.currentTimeMillis() - contextStart;

        long geminiStart = System.currentTimeMillis();
        List<Turn> sanitizedHistory = sanitizeHistory(history);
        Optional<String> answer = geminiClient.generate(sanitizedHistory, systemPrompt + userMessage, 1200);
        long geminiMs = System.currentTimeMillis() - geminiStart;

        log.info("MemberAiChat timing: contextMs={}, geminiMs={}, success={}", contextMs, geminiMs, answer.isPresent());

        List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
        for (int i = 0; i < knowledgeChunks.size(); i++) {
            RetrievedChunk c = knowledgeChunks.get(i);
            citations.add(new AiChatResponse.SourceCitation(i + 1, c.documentTitle(), c.category()));
        }

        String finalText = answer.orElse("Sorry, the Google AI Server is currently overloaded due to high traffic. Please wait a moment and try again later!");
        return new AiChatResponse(finalText, citations);
    }

    @Override
    public SseEmitter chatStream(String userMessage, List<Turn> history, String email) {
        SseEmitter emitter = new SseEmitter(60000L);

        CompletableFuture.runAsync(() -> {
            try {
                if (!geminiClient.isConfigured()) {
                    emitter.send(SseEmitter.event().name("delta").data("Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!"));
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                    emitter.complete();
                    return;
                }

                if (userMessage == null || userMessage.trim().isEmpty()) {
                    emitter.send(SseEmitter.event().name("delta").data("Xin chào! Mình là NEXUS AI, trợ lý ảo của NEXUS Sports Lab. Bạn cần mình hỗ trợ gì về gói tập, lớp học hay bài tập hôm nay không? 💪"));
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                    emitter.complete();
                    return;
                }

                List<RetrievedChunk> knowledgeChunks = retrievalService.retrieve(userMessage, Audience.MEMBER);
                String systemPrompt = buildSystemPrompt(userMessage, email, knowledgeChunks);

                List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
                for (int i = 0; i < knowledgeChunks.size(); i++) {
                    RetrievedChunk c = knowledgeChunks.get(i);
                    citations.add(new AiChatResponse.SourceCitation(i + 1, c.documentTitle(), c.category()));
                }

                List<Turn> sanitizedHistory = sanitizeHistory(history);
                Optional<String> fullText = geminiClient.stream(sanitizedHistory, systemPrompt + userMessage, 1200, delta -> {
                    try {
                        emitter.send(SseEmitter.event().name("delta").data(delta));
                    } catch (Exception e) {
                        log.warn("Failed to send SSE delta: {}", e.getMessage());
                    }
                });

                if (fullText.isPresent()) {
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", citations, "fullText", fullText.get())));
                    emitter.complete();
                } else {
                    emitter.send(SseEmitter.event().name("delta").data("Sorry, the Google AI Server is currently overloaded due to high traffic. Please wait a moment and try again later!"));
                    emitter.send(SseEmitter.event().name("done").data(Map.of("sources", Collections.emptyList())));
                    emitter.complete();
                }
            } catch (Exception e) {
                log.error("Error during Member AI chat streaming: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    private String buildSystemPrompt(String userMessage, String email, List<RetrievedChunk> knowledgeChunks) {
        // Fetch Packages
        List<PackageResponse> packages = memberService.getAllPackages();
        String packagesListString = packages.stream()
            .map(p -> "[" + p.getPackageId() + "] " + p.getPackageName() + " (" + p.getDurationDays() + " ngày, " + p.getPrice() + " VND)")
            .collect(Collectors.joining("\n"));

        List<AvailableClassResponse> classes = memberService.getAvailableClasses();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        List<Booking> myExistingBookings = (email != null && !email.trim().isEmpty())
            ? bookingRepository.findAllBookingsByEmail(email).stream()
                    .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                    .filter(b -> b.getSchedule() != null && !"CANCELLED".equalsIgnoreCase(b.getSchedule().getStatus()))
                    .toList()
            : Collections.emptyList();

        List<AvailableClassResponse> openClasses = classes.stream()
            .filter(c -> !Boolean.TRUE.equals(c.getIsBookedByMe()) && !Boolean.TRUE.equals(c.getIsPendingPayment()) && (c.getMaxSlots() - c.getBookedSlots() > 0))
            .toList();

        // Slimming live data: limit to top 15 classes matching question keywords
        if (openClasses.size() > 15) {
            String q = (userMessage != null) ? userMessage.toLowerCase() : "";
            openClasses = openClasses.stream()
                .sorted((c1, c2) -> Integer.compare(scoreClassMatch(c2, q), scoreClassMatch(c1, q)))
                .limit(15)
                .toList();
        }

        String classesListString = openClasses.isEmpty() ? "No classes currently available for booking." : openClasses.stream()
            .map(c -> {
                Optional<String> conflictOpt = findConflictNote(c.getClassId(), myExistingBookings);
                String base = "[" + c.getClassId() + "] " + c.getClassName() + " | HLV: " + c.getCoachName() + " | Lịch: " + (c.getNextSessionTime() != null ? c.getNextSessionTime().format(timeFormatter) : "N/A") + " | Còn: " + (c.getMaxSlots() - c.getBookedSlots()) + " chỗ | Giá: " + (c.getPrice() != null ? String.format("%,d đ", c.getPrice().longValue()) : "0 đ");
                if (conflictOpt.isPresent()) {
                    return base + " | ⚠️ BỊ TRÙNG LỊCH: " + conflictOpt.get() + " (CẤM CHÈN ACTION:BOOK_CLASS CHO LỚP NÀY)";
                }
                return base;
            })
            .collect(Collectors.joining("\n"));

        List<AvailableClassResponse> myEnrolledClasses = classes.stream()
            .filter(c -> Boolean.TRUE.equals(c.getIsBookedByMe()))
            .toList();
        String myEnrolledString = myEnrolledClasses.isEmpty() ? "None" : myEnrolledClasses.stream()
            .map(c -> "- [" + c.getClassId() + "] " + c.getClassName() + " (ALREADY ENROLLED)")
            .collect(Collectors.joining("\n"));

        List<AvailableClassResponse> myPendingCartClasses = classes.stream()
            .filter(c -> Boolean.TRUE.equals(c.getIsPendingPayment()))
            .toList();
        String myPendingCartString = myPendingCartClasses.isEmpty() ? "None" : myPendingCartClasses.stream()
            .map(c -> "- [" + c.getClassId() + "] " + c.getClassName() + " (ALREADY IN CART)")
            .collect(Collectors.joining("\n"));

        List<UpcomingBookingResponse> myBookings = memberService.getMyUpcomingBookings(email);
        String myBookingsString = myBookings.isEmpty() ? "No upcoming bookings." : myBookings.stream()
            .map(b -> "- " + b.getClassName() + " from " + b.getStartTime().format(timeFormatter) + " to " + b.getEndTime().format(timeFormatter))
            .collect(Collectors.joining("\n"));

        com.team4.sportscenter.modules.member.health.MemberHealthSummary healthSummary = com.team4.sportscenter.modules.member.health.MemberHealthSummary.empty();
        if (email != null && !email.trim().isEmpty()) {
            java.util.Optional<com.team4.sportscenter.modules.auth.entities.User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                healthSummary = memberHealthService.summaryFor(userOpt.get());
            }
        }
        String healthBlock = com.team4.sportscenter.modules.member.health.HealthPromptBuilder.memberBlock(healthSummary);
        String knowledgeBlock = PromptAssembler.knowledgeBlock(knowledgeChunks);

        return "You are NEXUS AI, a cool, friendly, and energetic personal trainer & assistant EXCLUSIVELY for NEXUS Sports Lab.\n" +
                knowledgeBlock +
                "Your tone must be natural, engaging, and conversational (like a human gym buddy). Do NOT sound like a robotic customer service bot.\n" +
                "Keep responses concise, lively, and directly to the point (2 to 4 sentences unless the user explicitly asks for a detailed plan/routine).\n" +
                "Use short, modern phrasing, and sprinkle a few emojis naturally. Always answer in the exact same language the user speaks (e.g. Vietnamese or English).\n\n" +
                "=== STRICT SCOPE & TOKEN-SAVING POLICY (ANTI-ABUSE GUARDRAIL) ===\n" +
                "1. ALLOWED TOPICS ONLY:\n" +
                "   - NEXUS Sports Lab services: membership packages, class bookings, schedules, coaches, gym facilities, cart/checkout, account settings.\n" +
                "   - Fitness, sports training, workout routines, exercise technique, sets/reps, muscle groups, sports recovery, and athletic nutrition / healthy meal advice for gym members.\n" +
                "2. STRICTLY FORBIDDEN / OUT-OF-SCOPE TOPICS:\n" +
                "   - General academic or homework questions (e.g., solving math/physics/chemistry problems, writing general essays, writing code/programming).\n" +
                "   - Casual non-gym small talk or personal chit-chat (e.g., 'hôm nay trời đẹp ghê', 'bạn đã ăn cơm chưa', weather, dating, gaming, celebrities, news, politics, philosophy).\n" +
                "   - Any questions completely unrelated to fitness, gym, sports, or NEXUS Sports Lab.\n" +
                "3. MANDATORY REFUSAL RULE (VERY IMPORTANT TO SAVE TOKENS):\n" +
                "   - If the user's message is OUT-OF-SCOPE or asks anything outside the allowed domains:\n" +
                "     * NEVER answer, solve, chat about, or elaborate on the out-of-scope request.\n" +
                "     * Immediately provide a VERY BRIEF, polite refusal (maximum 1 to 2 short sentences, under 35 words) to save tokens and prevent resource abuse.\n" +
                "     * State clearly that as the dedicated assistant for NEXUS Sports Lab, you only support queries related to gym, workouts, sports nutrition, and center services.\n" +
                "     * Briefly invite them to ask about workouts, classes, or packages instead.\n" +
                "     * NEVER append UI Action tags ([ACTION:...]) when declining.\n" +
                "   - Example Vietnamese refusal: 'Xin lỗi bạn nha, mình là trợ lý riêng của NEXUS Sports Lab nên chỉ hỗ trợ các câu hỏi về tập luyện, dinh dưỡng, lớp học và gói tập của trung tâm thôi nè! Bạn cần mình tư vấn bài tập hay lớp học nào không? 💪'\n" +
                "   - Example English refusal: 'Sorry! As the dedicated NEXUS Sports Lab assistant, I only help with workouts, nutrition, classes, packages, and gym services. Let me know if you need help with your fitness journey! 💪'\n\n" +
                "When you auto-add a package or book a class, casually mention that you are sending the booking request to their cart (e.g. 'Để mình gửi yêu cầu thêm ... vào giỏ hàng cho bạn nhé! Chờ hệ thống kiểm tra slot và lịch một xíu nha 💃') instead of guaranteeing it is already 100% completed or booked.\n\n" +
                "CRITICAL KNOWLEDGE BASE:\n" +
                "IMPORTANT BUSINESS RULE: Membership PACKAGES only grant free Gym access (GYM_ACCESS), AI Assistant access (AI_ACCESS), Combo Gym + AI (COMBO), or VIP (PREMIUM). Packages NEVER include or pay for Coach-led sport courses (Yoga, Swimming, Zumba, Spinning, etc.). Coach-led courses (AVAILABLE CLASSES) are enrolled and paid for separately per course!\n" +
                "--- PACKAGES (ONLY GYM & AI ACCESS) ---\n" +
                packagesListString + "\n" +
                "--- AVAILABLE CLASSES (COACH-LED COURSES - CAN BE BOOKED SEPARATELY) ---\n" +
                classesListString + "\n" +
                "--- USER'S ALREADY ENROLLED COURSES ---\n" +
                myEnrolledString + "\n" +
                "--- USER'S COURSES CURRENTLY IN CART ---\n" +
                myPendingCartString + "\n" +
                "--- USER'S CURRENT BOOKED SCHEDULE ---\n" +
                myBookingsString + "\n\n" +
                healthBlock + "\n" +
                "SYSTEM NAVIGATION & AUTOMATION RULES (VERY IMPORTANT):\n" +
                "You have the ability to trigger actions in the user's UI by appending specific hidden commands at the VERY END of your response.\n" +
                "1. To navigate the user to their Settings/Change Email: Append [ACTION:NAVIGATE:/member/settings]\n" +
                "2. To navigate the user to their Schedule: Append [ACTION:NAVIGATE:/member/schedule]\n" +
                "3. To navigate the user to the Class Booking page: Append [ACTION:NAVIGATE:/member/book-class]\n" +
                "4. To navigate the user to the Packages page: Append [ACTION:NAVIGATE:/member/package-store]\n" +
                "5. To navigate the user to their Cart / Checkout: Append [ACTION:NAVIGATE:/member/cart]\n" +
                "6. To navigate the user to Help & Support (for class cancellation, credit voucher wallet, class transfer, support tickets): Append [ACTION:NAVIGATE:/member/support]\n" +
                "7. To Auto-Add / Select a Package: If the user asks to buy, choose, or select a package, append ONLY [ACTION:ADD_CART:package_id] (replace package_id with the actual numeric ID). Do NOT append [ACTION:NAVIGATE:/member/cart] because the UI will automatically light up the Shopping Cart icon when the item is added.\n" +
                "8. To Auto-Book / Select a Class: When the user asks to book, choose, or register for ANY class (e.g. 'đặt giúp tôi 1 lớp bơi bất kỳ', 'đặt lớp gym', or naming a specific course):\n" +
                "   - CRITICAL RESTRICTION: You MUST ONLY choose a class from the '--- AVAILABLE CLASSES (CAN BE BOOKED) ---' list above. You must never invent or book any ID not listed there!\n" +
                "   - STRICT FORBIDDEN RULE 1: NEVER choose, recommend for booking, or append [ACTION:BOOK_CLASS:...] for ANY class under '--- USER'S ALREADY ENROLLED COURSES ---' or '--- USER'S COURSES CURRENTLY IN CART ---'. If the user asks for a class they already enrolled in or already in cart, tell them clearly: 'Bạn đã đăng ký khoá học này rồi nha!' or 'Khoá này đã có trong giỏ hàng rồi nè!' and NEVER append an ACTION tag.\n" +
                "   - STRICT FORBIDDEN RULE 2 (SCHEDULE CONFLICT): If a class has '⚠️ BỊ TRÙNG LỊCH:', you MUST NEVER append [ACTION:BOOK_CLASS:...]. Proactively and politely explain the conflict to the user (e.g., 'Lớp này bị trùng giờ với [tên lớp] của bạn rồi nè! Bạn có muốn mình tìm lớp khác hoặc khung giờ khác không? 💪').\n" +
                "   - If NO class in 'AVAILABLE CLASSES (CAN BE BOOKED)' matches their requested sport or time (or all matches are conflicted/enrolled): You MUST inform them politely that no available open slots/classes for that sport can be booked right now. DO NOT pick an already-enrolled or conflicted class!\n" +
                "   - If valid and has NO conflict, state the exact class name and time from the list, casually mention sending the request to cart, and append ONLY [ACTION:BOOK_CLASS:class_id] using the exact numeric ID from brackets [ID]. Do NOT append [ACTION:NAVIGATE:/member/schedule] because the UI will automatically light up the Shopping Cart icon.\n" +
                "9. Class Cancellation, Voucher Credit & Class Transfer Guidance:\n" +
                "   - When the user asks about canceling an enrolled class, getting a refund voucher/credit, or transferring/changing to another class (e.g. 'hủy lớp nhận voucher', 'chuyển sang lớp khác', 'làm sao để hủy lớp', 'hủy lớp'):\n" +
                "     * Warmly and clearly guide them to the 'Hỗ Trợ & Bảo Lưu' desk (/member/support).\n" +
                "     * Explain that if their class is eligible, they can click 'Hủy lớp trực tiếp & Nhận Credit 100%' to get a 100% NEXUS CREDIT PASS voucher immediately into their wallet to book any other class or package.\n" +
                "     * If they want to change class times or subjects, explain they can create a ticket with category 'Yêu cầu chuyển ca học / lớp học' (CLASS_TRANSFER) for Reception to review and transfer.\n" +
                "     * Always append [ACTION:NAVIGATE:/member/support] at the end of your response so the app opens the Help & Support page for them right away.\n" +
                "10. Coach Feedback, Complaints & Reporting Guidance:\n" +
                "   - When the user asks about giving feedback, reporting, or filing a complaint about an instructor/coach (e.g. 'tôi muốn gửi báo cáo về giảng viên', 'phản hồi về huấn luyện viên', 'khiếu nại HLV', 'góp ý giảng viên'):\n" +
                "     * Guide them to submit a confidential ticket directly at the 'Hỗ Trợ & Bảo Lưu' desk (/member/support) by clicking 'Tạo yêu cầu mới' and selecting category 'Phản hồi & Đánh giá Huấn luyện viên' (COACH_FEEDBACK) or 'Khiếu nại dịch vụ' (COMPLAINT).\n" +
                "     * Mention they can select the specific coach/class and aspect (attitude, teaching method, punctuality, form correction guidance) so Center Management can promptly review and resolve.\n" +
                "     * Note they can also speak directly with Reception at the 1st floor lobby if urgent.\n" +
                "     * Always append [ACTION:NAVIGATE:/member/support] at the end of your response to navigate them directly there!\n" +
                "Never expose these raw commands in your conversational text. Just append the exact bracket format at the very end of your message.\n\n" +
                "User's message: ";
    }

    private Optional<String> findConflictNote(Integer classId, List<Booking> myExistingBookings) {
        if (classId == null || myExistingBookings == null || myExistingBookings.isEmpty()) {
            return Optional.empty();
        }
        try {
            List<Schedule> classSchedules = scheduleRepository.findAvailableSchedulesByClassId(classId, LocalDateTime.now());
            if (classSchedules == null || classSchedules.isEmpty()) {
                return Optional.empty();
            }
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm dd/MM");
            for (Schedule newSched : classSchedules) {
                if (newSched.getStartTime() == null || newSched.getEndTime() == null) continue;
                for (Booking myB : myExistingBookings) {
                    Schedule mySched = myB.getSchedule();
                    if (mySched == null || mySched.getStartTime() == null || mySched.getEndTime() == null) continue;
                    // Overlap check: StartA < EndB && StartB < EndA
                    if (newSched.getStartTime().isBefore(mySched.getEndTime()) && mySched.getStartTime().isBefore(newSched.getEndTime())) {
                        String conflictClass = (mySched.getGymClass() != null && mySched.getGymClass().getClassName() != null)
                                ? mySched.getGymClass().getClassName()
                                : "lớp đã đăng ký";
                        return Optional.of("TRÙNG GIỜ với '" + conflictClass + "' lúc " + newSched.getStartTime().format(fmt));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check schedule conflict for classId {}: {}", classId, e.getMessage());
        }
        return Optional.empty();
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

    private int scoreClassMatch(AvailableClassResponse c, String q) {
        if (q == null || q.isBlank()) return 0;
        int score = 0;
        String name = (c.getClassName() != null) ? c.getClassName().toLowerCase() : "";
        String coach = (c.getCoachName() != null) ? c.getCoachName().toLowerCase() : "";
        for (String word : q.split("\\s+")) {
            if (word.length() < 2) continue;
            if (name.contains(word)) score += 3;
            if (coach.contains(word)) score += 2;
        }
        return score;
    }
}
