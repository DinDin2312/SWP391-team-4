package com.team4.sportscenter.modules.rag.services;

import com.team4.sportscenter.modules.rag.dtos.IndexedChunk;
import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Component
public class VectorIndex {

    private volatile List<IndexedChunk> chunks = Collections.emptyList();

    public void replaceAll(List<IndexedChunk> newChunks) {
        this.chunks = (newChunks != null) ? List.copyOf(newChunks) : Collections.emptyList();
    }

    public int size() {
        return chunks.size();
    }

    public List<RetrievedChunk> topK(float[] query, int k, double minScore, Audience audience) {
        if (query == null || k <= 0) {
            return Collections.emptyList();
        }

        List<IndexedChunk> currentChunks = this.chunks;
        List<RetrievedChunk> candidates = new ArrayList<>();

        for (IndexedChunk chunk : currentChunks) {
            if (chunk == null || chunk.vector() == null) continue;

            // Audience filter: ALL is visible to everyone; otherwise must match requested audience
            if (audience != null && audience != Audience.ALL) {
                if (chunk.audience() != Audience.ALL && chunk.audience() != audience) {
                    continue;
                }
            }

            try {
                double score = VectorMath.cosine(query, chunk.vector());
                if (score >= minScore) {
                    candidates.add(new RetrievedChunk(
                            chunk.documentTitle(),
                            chunk.category(),
                            chunk.text(),
                            score
                    ));
                }
            } catch (IllegalArgumentException e) {
                // Vector dimension mismatch, skip chunk
            }
        }

        candidates.sort(Comparator.comparingDouble(RetrievedChunk::score).reversed());

        if (candidates.size() > k) {
            return candidates.subList(0, k);
        }
        return candidates;
    }
}
