package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.services.AiChatService;
import com.team4.sportscenter.modules.member.services.MemberService;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

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

        // Fetch Data for RAG
        List<PackageResponse> packages = memberService.getAllPackages();
        String packagesListString = packages.stream()
            .map(p -> "[" + p.getPackageId() + "] " + p.getPackageName() + " (" + p.getDurationDays() + " ngày, " + p.getPrice() + " VND)")
            .collect(Collectors.joining("\n"));

        List<AvailableClassResponse> classes = memberService.getAvailableClasses();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        
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
            .map(c -> "[" + c.getClassId() + "] " + c.getClassName() + " | HLV: " + c.getCoachName() + " | Lịch: " + (c.getNextSessionTime() != null ? c.getNextSessionTime().format(timeFormatter) : "N/A") + " | Còn: " + (c.getMaxSlots() - c.getBookedSlots()) + " chỗ | Giá: " + (c.getPrice() != null ? String.format("%,d đ", c.getPrice().longValue()) : "0 đ"))
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

        List<RetrievedChunk> knowledgeChunks = retrievalService.retrieve(userMessage, Audience.MEMBER);
        String knowledgeBlock = PromptAssembler.knowledgeBlock(knowledgeChunks);

        long contextMs = System.currentTimeMillis() - contextStart;

        String systemPrompt = "You are NEXUS AI, a cool, friendly, and energetic personal trainer & assistant EXCLUSIVELY for NEXUS Sports Lab.\n" +
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
                "When you auto-add a package or book a class, casually mention it like 'Xong rồi nha, mình vừa ném vào giỏ hàng cho bạn rồi á!' instead of formal robotic instructions.\n\n" +
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
                "6. To Auto-Add / Select a Package: If the user asks to buy, choose, or select a package, append ONLY [ACTION:ADD_CART:package_id] (replace package_id with the actual numeric ID). Do NOT append [ACTION:NAVIGATE:/member/cart] because the UI will automatically light up the Shopping Cart icon when the item is added.\n" +
                "7. To Auto-Book / Select a Class: When the user asks to book, choose, or register for ANY class (e.g. 'đặt giúp tôi 1 lớp bơi bất kỳ', 'đặt lớp gym', or naming a specific course):\n" +
                "   - CRITICAL RESTRICTION: You MUST ONLY choose a class from the '--- AVAILABLE CLASSES (CAN BE BOOKED) ---' list above. You must never invent or book any ID not listed there!\n" +
                "   - STRICT FORBIDDEN RULE: NEVER choose, recommend for booking, or append [ACTION:BOOK_CLASS:...] for ANY class under '--- USER'S ALREADY ENROLLED COURSES ---' or '--- USER'S COURSES CURRENTLY IN CART ---'. If the user asks for a class they already enrolled in or already in cart, tell them clearly: 'Bạn đã đăng ký khoá học này rồi nha!' or 'Khoá này đã có trong giỏ hàng rồi nè!' and NEVER append an ACTION tag.\n" +
                "   - If NO class in 'AVAILABLE CLASSES (CAN BE BOOKED)' matches their requested sport or time (e.g. they ask for swimming but all swimming classes are already enrolled or none are open): You MUST inform them politely that no available open slots/classes for that sport can be booked right now. DO NOT pick an already-enrolled class!\n" +
                "   - Check if the class's time block overlaps with their '--- USER'S CURRENT BOOKED SCHEDULE ---'. If it overlaps, apologize and mention the schedule conflict.\n" +
                "   - If valid, state the exact class name and time from the list, and append ONLY [ACTION:BOOK_CLASS:class_id] using the exact numeric ID from brackets [ID]. Do NOT append [ACTION:NAVIGATE:/member/schedule] because the UI will automatically light up the Shopping Cart icon.\n" +
                "Never expose these raw commands in your conversational text. Just append the exact bracket format at the very end of your message.\n\n" +
                "User's message: ";

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
                String knowledgeBlock = PromptAssembler.knowledgeBlock(knowledgeChunks);

                List<PackageResponse> packages = memberService.getAllPackages();
                String packagesListString = packages.stream()
                        .map(p -> "[" + p.getPackageId() + "] " + p.getPackageName() + " (" + p.getDurationDays() + " ngày, " + p.getPrice() + " VND)")
                        .collect(Collectors.joining("\n"));

                List<AvailableClassResponse> classes = memberService.getAvailableClasses();
                DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

                List<AvailableClassResponse> openClasses = classes.stream()
                        .filter(c -> !Boolean.TRUE.equals(c.getIsBookedByMe()) && !Boolean.TRUE.equals(c.getIsPendingPayment()) && (c.getMaxSlots() - c.getBookedSlots() > 0))
                        .toList();

                if (openClasses.size() > 15) {
                    String q = userMessage.toLowerCase();
                    openClasses = openClasses.stream()
                            .sorted((c1, c2) -> Integer.compare(scoreClassMatch(c2, q), scoreClassMatch(c1, q)))
                            .limit(15)
                            .toList();
                }

                String classesListString = openClasses.isEmpty() ? "No classes currently available for booking." : openClasses.stream()
                        .map(c -> "[" + c.getClassId() + "] " + c.getClassName() + " | HLV: " + c.getCoachName() + " | Lịch: " + (c.getNextSessionTime() != null ? c.getNextSessionTime().format(timeFormatter) : "N/A") + " | Còn: " + (c.getMaxSlots() - c.getBookedSlots()) + " chỗ | Giá: " + (c.getPrice() != null ? String.format("%,d đ", c.getPrice().longValue()) : "0 đ"))
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

                String systemPrompt = "You are NEXUS AI, a cool, friendly, and energetic personal trainer & assistant EXCLUSIVELY for NEXUS Sports Lab.\n" +
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
                        "When you auto-add a package or book a class, casually mention it like 'Xong rồi nha, mình vừa ném vào giỏ hàng cho bạn rồi á!' instead of formal robotic instructions.\n\n" +
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
                        healthBlock + "\n\n" +
                        "=== STRICT CRITICAL FORMATTING & ACTION RULES ===\n" +
                        "1. Respond in natural, clean, readable markdown formatting.\n" +
                        "2. NEVER use markdown link syntax like [text](url). ONLY plain text or the action tags below.\n" +
                        "3. To navigate the user to the Class Booking page: Append [ACTION:NAVIGATE:/member/book-class]\n" +
                        "4. To navigate the user to the Packages page: Append [ACTION:NAVIGATE:/member/package-store]\n" +
                        "5. To navigate the user to their Cart / Checkout: Append [ACTION:NAVIGATE:/member/cart]\n" +
                        "6. To Auto-Add / Select a Package: If the user asks to buy, choose, or select a package, append ONLY [ACTION:ADD_CART:package_id] (replace package_id with the actual numeric ID). Do NOT append [ACTION:NAVIGATE:/member/cart] because the UI will automatically light up the Shopping Cart icon when the item is added.\n" +
                        "7. To Auto-Book / Select a Class: When the user asks to book, choose, or register for ANY class (e.g. 'đặt giúp tôi 1 lớp bơi bất kỳ', 'đặt lớp gym', or naming a specific course):\n" +
                        "   - CRITICAL RESTRICTION: You MUST ONLY choose a class from the '--- AVAILABLE CLASSES (CAN BE BOOKED) ---' list above. You must never invent or book any ID not listed there!\n" +
                        "   - STRICT FORBIDDEN RULE: NEVER choose, recommend for booking, or append [ACTION:BOOK_CLASS:...] for ANY class under '--- USER'S ALREADY ENROLLED COURSES ---' or '--- USER'S COURSES CURRENTLY IN CART ---'. If the user asks for a class they already enrolled in or already in cart, tell them clearly: 'Bạn đã đăng ký khoá học này rồi nha!' or 'Khoá này đã có trong giỏ hàng rồi nè!' and NEVER append an ACTION tag.\n" +
                        "   - If NO class in 'AVAILABLE CLASSES (CAN BE BOOKED)' matches their requested sport or time (e.g. they ask for swimming but all swimming classes are already enrolled or none are open): You MUST inform them politely that no available open slots/classes for that sport can be booked right now. DO NOT pick an already-enrolled class!\n" +
                        "   - Check if the class's time block overlaps with their '--- USER'S CURRENT BOOKED SCHEDULE ---'. If it overlaps, apologize and mention the schedule conflict.\n" +
                        "   - If valid, state the exact class name and time from the list, and append ONLY [ACTION:BOOK_CLASS:class_id] using the exact numeric ID from brackets [ID]. Do NOT append [ACTION:NAVIGATE:/member/schedule] because the UI will automatically light up the Shopping Cart icon.\n" +
                        "Never expose these raw commands in your conversational text. Just append the exact bracket format at the very end of your message.\n\n" +
                        "User's message: ";

                List<Turn> sanitizedHistory = sanitizeHistory(history);
                List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
                for (int i = 0; i < knowledgeChunks.size(); i++) {
                    RetrievedChunk c = knowledgeChunks.get(i);
                    citations.add(new AiChatResponse.SourceCitation(i + 1, c.documentTitle(), c.category()));
                }

                Optional<String> fullText = geminiClient.stream(
                        sanitizedHistory,
                        systemPrompt + userMessage,
                        1200,
                        delta -> {
                            try {
                                emitter.send(SseEmitter.event().name("delta").data(delta));
                            } catch (Exception e) {
                                log.warn("Failed to send SSE delta: {}", e.getMessage());
                            }
                        }
                );

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
