package com.team4.sportscenter.modules.rag.services;

import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class RetrievalService {

    private static final Logger log = LoggerFactory.getLogger(RetrievalService.class);

    private final GeminiClient geminiClient;
    private final VectorIndex vectorIndex;

    @Value("${rag.enabled:true}")
    private boolean ragEnabled;

    @Value("${rag.top-k:3}")
    private int topK;

    @Value("${rag.min-score:0.60}")
    private double minScore;

    public RetrievalService(GeminiClient geminiClient, VectorIndex vectorIndex) {
        this.geminiClient = geminiClient;
        this.vectorIndex = vectorIndex;
    }

    public List<RetrievedChunk> retrieve(String question, Audience audience) {
        if (!ragEnabled) {
            return Collections.emptyList();
        }
        if (question == null || question.trim().isEmpty()) {
            return Collections.emptyList();
        }
        if (!geminiClient.isConfigured() || vectorIndex.size() == 0) {
            return Collections.emptyList();
        }

        try {
            long start = System.currentTimeMillis();
            List<float[]> embeddings = geminiClient.embed(
                    List.of(question.trim()),
                    GeminiClient.EmbedTask.RETRIEVAL_QUERY
            );
            long embedMs = System.currentTimeMillis() - start;

            if (embeddings == null || embeddings.isEmpty()) {
                log.warn("Gemini embedding returned empty vector for query");
                return Collections.emptyList();
            }

            float[] queryVector = embeddings.get(0);
            List<RetrievedChunk> topChunks = vectorIndex.topK(queryVector, topK, minScore, audience);
            log.info("RAG Retrieval: embedMs={}, retrievedChunks={}, audience={}",
                    embedMs, topChunks.size(), audience);
            return topChunks;
        } catch (Exception e) {
            log.warn("Failed to retrieve RAG knowledge chunks: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
