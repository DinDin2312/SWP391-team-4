package com.team4.sportscenter.modules.member.services.impl;

import com.team4.sportscenter.modules.member.services.AiChatService;
import com.team4.sportscenter.modules.member.services.MemberService;
import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import com.team4.sportscenter.modules.member.dtos.response.UpcomingBookingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;

@Service
public class AiChatServiceImpl implements AiChatService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Autowired
    private MemberService memberService;

    @Override
    public String chat(String userMessage, String email) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            return "Sorry, the Google Gemini API Key is not configured. Please add the Key to application.properties!";
        }

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return "Xin chào! Mình là NEXUS AI, trợ lý ảo của NEXUS Sports Lab. Bạn cần mình hỗ trợ gì về gói tập, lớp học hay bài tập hôm nay không? 💪";
        }

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

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        RestTemplate restTemplate = new RestTemplate(factory);

        String systemPrompt = "You are NEXUS AI, a cool, friendly, and energetic personal trainer & assistant EXCLUSIVELY for NEXUS Sports Lab.\n" +
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
                "--- PACKAGES ---\n" +
                packagesListString + "\n" +
                "--- AVAILABLE CLASSES (CAN BE BOOKED) ---\n" +
                classesListString + "\n" +
                "--- USER'S ALREADY ENROLLED COURSES ---\n" +
                myEnrolledString + "\n" +
                "--- USER'S COURSES CURRENTLY IN CART ---\n" +
                myPendingCartString + "\n" +
                "--- USER'S CURRENT BOOKED SCHEDULE ---\n" +
                myBookingsString + "\n\n" +
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

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", systemPrompt + userMessage);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        
        requestBody.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", 1200);
        generationConfig.put("temperature", 0.7);
        Map<String, Object> thinkingConfig = new HashMap<>();
        thinkingConfig.put("thinkingBudget", 0);
        generationConfig.put("thinkingConfig", thinkingConfig);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String[] models = {"gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"};
        
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
        
        return "Sorry, the Google AI Server is currently overloaded due to high traffic. Please wait a moment and try again later!";
    }
}