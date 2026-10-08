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

        // Fetch Data for RAG
        List<PackageResponse> packages = memberService.getAllPackages();
        String packagesListString = packages.stream()
            .map(p -> "ID: " + p.getPackageId() + " | Name: " + p.getPackageName() + " (" + p.getDurationDays() + " days, Price: " + p.getPrice() + " VND)")
            .collect(Collectors.joining("\n"));

        List<AvailableClassResponse> classes = memberService.getAvailableClasses();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String classesListString = classes.stream()
            .map(c -> "Class ID: " + c.getClassId() + " | Class: " + c.getClassName() + 
                      " | Coach: " + c.getCoachName() + " | Next Session: " + (c.getNextSessionTime() != null ? (c.getNextSessionTime().format(timeFormatter) + " to " + c.getNextSessionTime().plusMinutes(c.getDurationMinutes()).format(timeFormatter)) : "N/A") + 
                      " | Available Slots: " + (c.getMaxSlots() - c.getBookedSlots()))
            .collect(Collectors.joining("\n"));

        List<UpcomingBookingResponse> myBookings = memberService.getMyUpcomingBookings(email);
        String myBookingsString = myBookings.isEmpty() ? "No upcoming bookings." : myBookings.stream()
            .map(b -> "- " + b.getClassName() + " from " + b.getStartTime().format(timeFormatter) + " to " + b.getEndTime().format(timeFormatter))
            .collect(Collectors.joining("\n"));

        RestTemplate restTemplate = new RestTemplate();

        String systemPrompt = "You are NEXUS AI, a cool, friendly, and energetic personal trainer & assistant at NEXUS Sports Lab. " +
                "Your tone must be highly natural, engaging, and conversational (like a human gym buddy). Do NOT sound like a robotic customer service bot. " +
                "Use modern phrasing, short sentences, and sprinkle a few emojis naturally. Always answer in the language the user speaks.\n\n" +
                "When you auto-add a package or book a class, casually mention it like 'Xong rồi nha, mình vừa ném vào giỏ hàng cho bạn rồi á!' instead of formal robotic instructions.\n\n" +
                "CRITICAL KNOWLEDGE BASE:\n" +
                "--- PACKAGES ---\n" +
                packagesListString + "\n" +
                "--- AVAILABLE CLASSES ---\n" +
                classesListString + "\n" +
                "--- USER'S CURRENT BOOKED SCHEDULE ---\n" +
                myBookingsString + "\n\n" +
                "SYSTEM NAVIGATION & AUTOMATION RULES (VERY IMPORTANT):\n" +
                "You have the ability to trigger actions in the user's UI by appending specific hidden commands at the VERY END of your response.\n" +
                "1. To navigate the user to their Settings/Change Email: Append [ACTION:NAVIGATE:/member/settings]\n" +
                "2. To navigate the user to their Schedule: Append [ACTION:NAVIGATE:/member/schedule]\n" +
                "3. To navigate the user to the Class Booking page: Append [ACTION:NAVIGATE:/member/book-class]\n" +
                "4. To navigate the user to the Packages page: Append [ACTION:NAVIGATE:/member/package-store]\n" +
                "5. To navigate the user to their Cart / Checkout: Append [ACTION:NAVIGATE:/member/cart]\n" +
                "6. To Auto-Add a Package to the Cart: If the user explicitly asks to buy or select a package, append [ACTION:ADD_CART:package_id] (replace package_id with the actual ID). Also tell them you added it to their cart.\n" +
                "7. To Auto-Book a Class: If the user explicitly asks to book a specific class, carefully check if the class's time block (Start to End) OVERLAPS with any time blocks in their CURRENT BOOKED SCHEDULE. If there is ANY overlap, you MUST refuse, apologize, and explain exactly which class it overlaps with. If it doesn't overlap, append [ACTION:BOOK_CLASS:class_id].\n" +
                "Never expose these raw commands in your conversational text. Just append the exact bracket format at the very end of your message.\n\n" +
                "User's message: ";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", systemPrompt + userMessage);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        
        requestBody.put("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String[] models = {"gemini-3.5-flash-lite", "gemini-3.8-flash-lite", "gemini-flash-latest"};
        
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