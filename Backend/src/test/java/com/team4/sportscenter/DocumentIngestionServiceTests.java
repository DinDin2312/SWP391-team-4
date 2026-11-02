package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.entities.KnowledgeDocument;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import com.team4.sportscenter.modules.rag.repositories.DocumentChunkRepository;
import com.team4.sportscenter.modules.rag.repositories.KnowledgeDocumentRepository;
import com.team4.sportscenter.modules.rag.services.DocumentIngestionService;
import com.team4.sportscenter.modules.rag.services.DocumentIngestionService.IngestResult;
import com.team4.sportscenter.modules.rag.services.TextChunker;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import com.team4.sportscenter.modules.rag.services.impl.DocumentIngestionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class DocumentIngestionServiceTests {

    private KnowledgeDocumentRepository docRepo;
    private DocumentChunkRepository chunkRepo;
    private GeminiClient geminiClient;
    private TextChunker chunker;
    private VectorIndex vectorIndex;
    private DocumentIngestionService service;

    @BeforeEach
    void setUp() {
        docRepo = mock(KnowledgeDocumentRepository.class);
        chunkRepo = mock(DocumentChunkRepository.class);
        geminiClient = mock(GeminiClient.class);
        chunker = mock(TextChunker.class);
        vectorIndex = mock(VectorIndex.class);

        service = new DocumentIngestionServiceImpl(docRepo, chunkRepo, geminiClient, chunker, vectorIndex);
    }

    private String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }

    @Test
    void ingest_skipsUnchangedHash() throws Exception {
        String markdown = "---\ntitle: Nội quy\ncategory: RULES\naudience: ALL\n---\nNội dung phòng tập";
        String hash = sha256(markdown);

        KnowledgeDocument existing = KnowledgeDocument.builder()
                .documentId(1)
                .sourceKey("noi-quy.md")
                .title("Nội quy")
                .category("RULES")
                .audience(Audience.ALL)
                .contentHash(hash)
                .build();

        when(docRepo.findBySourceKey("noi-quy.md")).thenReturn(Optional.of(existing));

        IngestResult result = service.ingest("noi-quy.md", markdown);

        assertEquals(IngestResult.SKIPPED_UNCHANGED, result);
        verify(geminiClient, never()).embed(any(), any());
        verify(chunkRepo, never()).deleteByDocumentId(any());
    }

    @Test
    void ingest_embedsAndSavesWhenNewOrChanged() throws Exception {
        String markdown = "---\ntitle: Dinh dưỡng\ncategory: NUTRITION\naudience: ALL\n---\nĂn nhiều protein";

        when(docRepo.findBySourceKey("dinh-duong.md")).thenReturn(Optional.empty());
        when(chunker.split(any())).thenReturn(List.of("Ăn nhiều protein"));
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.embed(any(), eq(GeminiClient.EmbedTask.RETRIEVAL_DOCUMENT)))
                .thenReturn(List.of(new float[]{0.1f, 0.2f}));

        KnowledgeDocument savedDoc = KnowledgeDocument.builder()
                .documentId(10)
                .sourceKey("dinh-duong.md")
                .title("Dinh dưỡng")
                .category("NUTRITION")
                .audience(Audience.ALL)
                .contentHash("abc")
                .build();
        when(docRepo.save(any())).thenReturn(savedDoc);

        IngestResult result = service.ingest("dinh-duong.md", markdown);

        assertEquals(IngestResult.INGESTED, result);
        verify(geminiClient, times(1)).embed(any(), eq(GeminiClient.EmbedTask.RETRIEVAL_DOCUMENT));
        verify(chunkRepo, times(1)).saveAll(any());
    }

    @Test
    void ingest_returnsFailedWhenEmbedThrows() {
        String markdown = "Nội dung tài liệu mới";

        when(docRepo.findBySourceKey("error.md")).thenReturn(Optional.empty());
        when(chunker.split(any())).thenReturn(List.of("Chunk 1"));
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.embed(any(), any())).thenThrow(new RuntimeException("Gemini quota exceeded"));

        IngestResult result = service.ingest("error.md", markdown);

        assertEquals(IngestResult.FAILED, result);
        verify(chunkRepo, never()).deleteByDocumentId(any());
    }
}
