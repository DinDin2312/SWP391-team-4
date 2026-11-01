package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.gemini.GeminiResponseParser;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class GeminiResponseParserTests {

    private final GeminiResponseParser parser = new GeminiResponseParser();

    @Test
    void text_returnsFirstPartText() {
        Map<String, Object> body = Map.of(
                "candidates", List.of(
                        Map.of(
                                "content", Map.of(
                                        "parts", List.of(
                                                Map.of("text", "Xin chào! Mình là NEXUS AI.")
                                        )
                                )
                        )
                )
        );

        Optional<String> text = parser.text(body);
        assertTrue(text.isPresent());
        assertEquals("Xin chào! Mình là NEXUS AI.", text.get());
    }

    @Test
    void text_emptyWhenNoCandidates() {
        Map<String, Object> body = Map.of("candidates", Collections.emptyList());
        Optional<String> text = parser.text(body);
        assertTrue(text.isEmpty());

        assertTrue(parser.text(null).isEmpty());
        assertTrue(parser.text(Collections.emptyMap()).isEmpty());
    }

    @Test
    void text_emptyWhenBlockedPromptFeedback() {
        Map<String, Object> body = Map.of(
                "promptFeedback", Map.of("blockReason", "SAFETY")
        );
        Optional<String> text = parser.text(body);
        assertTrue(text.isEmpty());
    }

    @Test
    void embeddings_parsesValuesInOrder() {
        // Mock response from batchEmbedContents: { "embeddings": [ { "values": [0.1, 0.2, 0.3] }, { "values": [0.4, 0.5, 0.6] } ] }
        Map<String, Object> body = Map.of(
                "embeddings", List.of(
                        Map.of("values", List.of(0.1, 0.2, 0.3)),
                        Map.of("values", List.of(0.4, 0.5, 0.6))
                )
        );

        List<float[]> result = parser.embeddings(body);
        assertNotNull(result);
        assertEquals(2, result.size());

        assertArrayEquals(new float[]{0.1f, 0.2f, 0.3f}, result.get(0), 0.0001f);
        assertArrayEquals(new float[]{0.4f, 0.5f, 0.6f}, result.get(1), 0.0001f);
    }
}
