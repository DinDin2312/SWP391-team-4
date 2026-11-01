package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.dtos.IndexedChunk;
import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class VectorIndexTests {

    private VectorIndex index;

    @BeforeEach
    void setUp() {
        index = new VectorIndex();
    }

    @Test
    void topK_returnsHighestScoresDescendingAndFiltersByAudience() {
        IndexedChunk chunkMember = new IndexedChunk(
                1L, "Gói tập", "POLICY", Audience.MEMBER, "Dành cho hội viên", new float[]{1.0f, 0.0f}
        );
        IndexedChunk chunkCoach = new IndexedChunk(
                2L, "Giáo án", "TRAINING", Audience.COACH, "Dành cho HLV", new float[]{0.9f, 0.1f}
        );
        IndexedChunk chunkAll = new IndexedChunk(
                3L, "Nội quy", "RULES", Audience.ALL, "Nội quy chung", new float[]{0.5f, 0.5f}
        );
        IndexedChunk chunkIrrelevant = new IndexedChunk(
                4L, "Khác", "OTHER", Audience.ALL, "Không liên quan", new float[]{0.0f, 1.0f}
        );

        index.replaceAll(List.of(chunkMember, chunkCoach, chunkAll, chunkIrrelevant));

        float[] query = new float[]{1.0f, 0.0f};

        // Query as MEMBER: should see chunkMember and chunkAll, NOT chunkCoach
        List<RetrievedChunk> memberResults = index.topK(query, 5, 0.50, Audience.MEMBER);
        assertEquals(2, memberResults.size());
        assertEquals("Gói tập", memberResults.get(0).documentTitle());
        assertEquals("Nội quy", memberResults.get(1).documentTitle());
        assertTrue(memberResults.get(0).score() >= memberResults.get(1).score());

        // Query as COACH: should see chunkCoach and chunkAll, NOT chunkMember
        List<RetrievedChunk> coachResults = index.topK(query, 5, 0.50, Audience.COACH);
        assertEquals(2, coachResults.size());
        assertEquals("Giáo án", coachResults.get(0).documentTitle());
        assertEquals("Nội quy", coachResults.get(1).documentTitle());

        // Query with high minScore (e.g. 0.95): should drop chunkAll (score ~ 0.97 vs 0.8)
        List<RetrievedChunk> strictResults = index.topK(query, 5, 0.95, Audience.MEMBER);
        assertEquals(1, strictResults.size());
        assertEquals("Gói tập", strictResults.get(0).documentTitle());

        // Respects limit k = 1
        List<RetrievedChunk> top1Results = index.topK(query, 1, 0.50, Audience.MEMBER);
        assertEquals(1, top1Results.size());
        assertEquals("Gói tập", top1Results.get(0).documentTitle());
    }
}
