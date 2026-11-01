package com.team4.sportscenter.modules.member.services;

import com.team4.sportscenter.modules.rag.dtos.AiChatResponse;
import com.team4.sportscenter.modules.rag.gemini.Turn;
import java.util.Collections;
import java.util.List;

public interface AiChatService {
    default String chat(String userMessage, String email) {
        return chat(userMessage, Collections.emptyList(), email);
    }

    default String chat(String userMessage, List<Turn> history, String email) {
        return chatDetailed(userMessage, history, email).text();
    }

    AiChatResponse chatDetailed(String userMessage, List<Turn> history, String email);

    org.springframework.web.servlet.mvc.method.annotation.SseEmitter chatStream(String userMessage, List<Turn> history, String email);
}
