package com.team4.sportscenter.modules.coach.services;

import com.team4.sportscenter.modules.rag.dtos.AiChatResponse;
import com.team4.sportscenter.modules.rag.gemini.Turn;
import java.util.Collections;
import java.util.List;

public interface CoachAiChatService {
    default String chat(String userMessage, String coachEmail) {
        return chat(userMessage, Collections.emptyList(), coachEmail);
    }

    default String chat(String userMessage, List<Turn> history, String coachEmail) {
        return chatDetailed(userMessage, history, coachEmail).text();
    }

    AiChatResponse chatDetailed(String userMessage, List<Turn> history, String coachEmail);

    org.springframework.web.servlet.mvc.method.annotation.SseEmitter chatStream(String userMessage, List<Turn> history, String coachEmail);
}
