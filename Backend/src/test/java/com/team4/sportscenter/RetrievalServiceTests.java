package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import com.team4.sportscenter.modules.rag.services.RetrievalService;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class RetrievalServiceTests {

    private GeminiClient geminiClient;
    private VectorIndex vectorIndex;
    private RetrievalService retrievalService;

    @BeforeEach
    void setUp() {
        geminiClient = mock(GeminiClient.class);
        vectorIndex = mock(VectorIndex.class);
        retrievalService = new RetrievalService(geminiClient, vectorIndex);
        ReflectionTestUtils.setField(retrievalService, "ragEnabled", true);
        ReflectionTestUtils.setField(retrievalService, "topK", 3);
        ReflectionTestUtils.setField(retrievalService, "minScore", 0.60);
    }

    @Test
    void retrieve_returnsEmpty_whenRagDisabled() {
        ReflectionTestUtils.setField(retrievalService, "ragEnabled", false);
        List<RetrievedChunk> res = retrievalService.retrieve("Làm sao để squat?", Audience.MEMBER);
        assertTrue(res.isEmpty());
        verifyNoInteractions(geminiClient);
    }

    @Test
    void retrieve_returnsEmpty_whenQueryBlank() {
        assertTrue(retrievalService.retrieve("", Audience.MEMBER).isEmpty());
        assertTrue(retrievalService.retrieve("   ", Audience.MEMBER).isEmpty());
        assertTrue(retrievalService.retrieve(null, Audience.MEMBER).isEmpty());
        verifyNoInteractions(geminiClient);
    }

    @Test
    void retrieve_returnsEmpty_whenGeminiNotConfiguredOrVectorIndexEmpty() {
        when(geminiClient.isConfigured()).thenReturn(false);
        when(vectorIndex.size()).thenReturn(10);
        assertTrue(retrievalService.retrieve("bài tập vai", Audience.COACH).isEmpty());

        when(geminiClient.isConfigured()).thenReturn(true);
        when(vectorIndex.size()).thenReturn(0);
        assertTrue(retrievalService.retrieve("bài tập vai", Audience.COACH).isEmpty());
    }

    @Test
    void retrieve_returnsTopK_whenConfigured() {
        when(geminiClient.isConfigured()).thenReturn(true);
        when(vectorIndex.size()).thenReturn(5);

        float[] mockVector = new float[]{0.1f, 0.2f, 0.3f};
        when(geminiClient.embed(any(), eq(GeminiClient.EmbedTask.RETRIEVAL_QUERY)))
                .thenReturn(List.of(mockVector));

        RetrievedChunk chunk = new RetrievedChunk("Nội quy", "POLICY", "Check-in tại quầy", 0.88);
        when(vectorIndex.topK(eq(mockVector), eq(3), eq(0.60), eq(Audience.ALL)))
                .thenReturn(List.of(chunk));

        List<RetrievedChunk> res = retrievalService.retrieve("Giờ mở cửa là mấy giờ?", Audience.ALL);
        assertEquals(1, res.size());
        assertEquals("Nội quy", res.get(0).documentTitle());
        assertEquals(0.88, res.get(0).score());
    }

    @Test
    void retrieve_returnsEmpty_whenEmbedThrowsException() {
        when(geminiClient.isConfigured()).thenReturn(true);
        when(vectorIndex.size()).thenReturn(5);
        when(geminiClient.embed(any(), any())).thenThrow(new RuntimeException("Gemini quota error"));

        List<RetrievedChunk> res = retrievalService.retrieve("Câu hỏi bất kỳ", Audience.MEMBER);
        assertTrue(res.isEmpty());
    }
}
