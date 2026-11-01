package com.team4.sportscenter.modules.rag;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team4.sportscenter.modules.rag.dtos.IndexedChunk;
import com.team4.sportscenter.modules.rag.entities.DocumentChunk;
import com.team4.sportscenter.modules.rag.entities.KnowledgeDocument;
import com.team4.sportscenter.modules.rag.repositories.DocumentChunkRepository;
import com.team4.sportscenter.modules.rag.repositories.KnowledgeDocumentRepository;
import com.team4.sportscenter.modules.rag.services.DocumentIngestionService;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class RagStartupLoader implements ApplicationListener<ApplicationReadyEvent> {

    private static final Logger log = LoggerFactory.getLogger(RagStartupLoader.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final DocumentIngestionService ingestionService;
    private final KnowledgeDocumentRepository docRepo;
    private final DocumentChunkRepository chunkRepo;
    private final VectorIndex vectorIndex;

    public RagStartupLoader(
            DocumentIngestionService ingestionService,
            KnowledgeDocumentRepository docRepo,
            DocumentChunkRepository chunkRepo,
            VectorIndex vectorIndex) {
        this.ingestionService = ingestionService;
        this.docRepo = docRepo;
        this.chunkRepo = chunkRepo;
        this.vectorIndex = vectorIndex;
    }

    @Override
    @Async
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("Starting RAG knowledge base synchronization...");
        try {
            // 1. Ingest seed documents from classpath
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath*:rag/knowledge/*.md");

            for (Resource resource : resources) {
                String filename = resource.getFilename();
                if (filename == null) continue;
                try (InputStream is = resource.getInputStream()) {
                    String markdown = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                    ingestionService.ingest(filename, markdown);
                } catch (Exception e) {
                    log.warn("Could not ingest RAG knowledge file {}: {}", filename, e.getMessage());
                }
            }

            // 2. Load all existing chunks from DB into VectorIndex memory
            reloadVectorIndex();
        } catch (Exception e) {
            log.error("RAG startup loader encountered an unexpected error: {}", e.getMessage(), e);
        }
    }

    public void reloadVectorIndex() {
        try {
            List<KnowledgeDocument> allDocs = docRepo.findAll();
            Map<Integer, KnowledgeDocument> docMap = new HashMap<>();
            for (KnowledgeDocument d : allDocs) {
                docMap.put(d.getDocumentId(), d);
            }

            List<DocumentChunk> allChunks = chunkRepo.findAll();
            List<IndexedChunk> indexedChunks = new ArrayList<>();

            for (DocumentChunk chunk : allChunks) {
                KnowledgeDocument doc = docMap.get(chunk.getDocumentId());
                if (doc == null) continue;

                try {
                    List<Double> doubleList = objectMapper.readValue(
                            chunk.getEmbedding(),
                            new TypeReference<List<Double>>() {}
                    );
                    float[] vector = new float[doubleList.size()];
                    for (int i = 0; i < doubleList.size(); i++) {
                        vector[i] = doubleList.get(i).floatValue();
                    }

                    indexedChunks.add(new IndexedChunk(
                            chunk.getChunkId(),
                            doc.getTitle(),
                            doc.getCategory(),
                            doc.getAudience(),
                            chunk.getContentText(),
                            vector
                    ));
                } catch (Exception e) {
                    log.warn("Failed to parse vector JSON for chunk {}: {}", chunk.getChunkId(), e.getMessage());
                }
            }

            vectorIndex.replaceAll(indexedChunks);
            log.info("RAG Vector Index successfully loaded {} chunks from {} documents.",
                    indexedChunks.size(), docMap.size());
        } catch (Exception e) {
            log.error("Failed to reload RAG Vector Index: {}", e.getMessage(), e);
        }
    }
}
