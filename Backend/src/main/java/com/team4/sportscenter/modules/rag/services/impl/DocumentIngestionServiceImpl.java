package com.team4.sportscenter.modules.rag.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.entities.DocumentChunk;
import com.team4.sportscenter.modules.rag.entities.KnowledgeDocument;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import com.team4.sportscenter.modules.rag.repositories.DocumentChunkRepository;
import com.team4.sportscenter.modules.rag.repositories.KnowledgeDocumentRepository;
import com.team4.sportscenter.modules.rag.services.DocumentIngestionService;
import com.team4.sportscenter.modules.rag.services.TextChunker;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
public class DocumentIngestionServiceImpl implements DocumentIngestionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionServiceImpl.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final KnowledgeDocumentRepository docRepo;
    private final DocumentChunkRepository chunkRepo;
    private final GeminiClient geminiClient;
    private final TextChunker textChunker;
    private final VectorIndex vectorIndex;

    public DocumentIngestionServiceImpl(
            KnowledgeDocumentRepository docRepo,
            DocumentChunkRepository chunkRepo,
            GeminiClient geminiClient,
            TextChunker textChunker,
            VectorIndex vectorIndex) {
        this.docRepo = docRepo;
        this.chunkRepo = chunkRepo;
        this.geminiClient = geminiClient;
        this.textChunker = textChunker;
        this.vectorIndex = vectorIndex;
    }

    @Override
    @Transactional
    public IngestResult ingest(String sourceKey, String markdown) {
        if (markdown == null || markdown.trim().isEmpty()) {
            return IngestResult.FAILED;
        }

        try {
            String hash = calculateSha256(markdown);

            Optional<KnowledgeDocument> existingOpt = docRepo.findBySourceKey(sourceKey);
            if (existingOpt.isPresent() && hash.equalsIgnoreCase(existingOpt.get().getContentHash())) {
                log.info("RAG doc {} hash unchanged ({}), skipping ingestion", sourceKey, hash.substring(0, 8));
                return IngestResult.SKIPPED_UNCHANGED;
            }

            ParsedMarkdown parsed = parseFrontMatter(markdown, sourceKey);
            List<String> chunkTexts = textChunker.split(parsed.cleanBody);

            if (chunkTexts.isEmpty()) {
                KnowledgeDocument doc = existingOpt.orElseGet(() -> KnowledgeDocument.builder().sourceKey(sourceKey).build());
                doc.setTitle(parsed.title);
                doc.setCategory(parsed.category);
                doc.setAudience(parsed.audience);
                doc.setContentHash(hash);
                doc = docRepo.save(doc);

                chunkRepo.deleteByDocumentId(doc.getDocumentId());
                log.info("RAG doc {} had no chunks, saved empty doc metadata", sourceKey);
                return IngestResult.INGESTED;
            }

            if (!geminiClient.isConfigured()) {
                log.warn("Gemini API key not configured, cannot embed chunks for {}", sourceKey);
                return IngestResult.FAILED;
            }

            // Batch embed in chunks of at most 100
            List<float[]> allVectors = new ArrayList<>();
            int batchSize = 100;
            for (int i = 0; i < chunkTexts.size(); i += batchSize) {
                int end = Math.min(i + batchSize, chunkTexts.size());
                List<String> batch = chunkTexts.subList(i, end);
                List<float[]> batchVectors = geminiClient.embed(batch, GeminiClient.EmbedTask.RETRIEVAL_DOCUMENT);
                if (batchVectors == null || batchVectors.size() != batch.size()) {
                    throw new IllegalStateException("Embedding count mismatch for batch in " + sourceKey);
                }
                allVectors.addAll(batchVectors);
            }

            // Save document record
            KnowledgeDocument doc = existingOpt.orElseGet(() -> KnowledgeDocument.builder().sourceKey(sourceKey).build());
            doc.setTitle(parsed.title);
            doc.setCategory(parsed.category);
            doc.setAudience(parsed.audience);
            doc.setContentHash(hash);
            doc = docRepo.save(doc);

            // Delete old chunks
            chunkRepo.deleteByDocumentId(doc.getDocumentId());

            // Save new chunks
            List<DocumentChunk> chunksToSave = new ArrayList<>();
            for (int i = 0; i < chunkTexts.size(); i++) {
                String vectorJson = objectMapper.writeValueAsString(allVectors.get(i));
                chunksToSave.add(DocumentChunk.builder()
                        .documentId(doc.getDocumentId())
                        .chunkIndex(i)
                        .contentText(chunkTexts.get(i))
                        .embedding(vectorJson)
                        .build());
            }
            chunkRepo.saveAll(chunksToSave);

            log.info("Successfully ingested RAG doc: key={}, title={}, chunks={}",
                    sourceKey, parsed.title, chunksToSave.size());
            return IngestResult.INGESTED;
        } catch (Exception e) {
            log.error("Failed to ingest RAG document {}: {}", sourceKey, e.getMessage());
            return IngestResult.FAILED;
        }
    }

    private String calculateSha256(String text) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }

    private static class ParsedMarkdown {
        String title;
        String category;
        Audience audience;
        String cleanBody;
    }

    private ParsedMarkdown parseFrontMatter(String markdown, String defaultTitle) {
        ParsedMarkdown result = new ParsedMarkdown();
        result.title = defaultTitle;
        result.category = "GENERAL";
        result.audience = Audience.ALL;
        result.cleanBody = markdown;

        String trimmed = markdown.trim();
        if (trimmed.startsWith("---")) {
            int closingIdx = trimmed.indexOf("---", 3);
            if (closingIdx != -1) {
                String frontMatter = trimmed.substring(3, closingIdx).trim();
                result.cleanBody = trimmed.substring(closingIdx + 3).trim();

                for (String line : frontMatter.split("\\r?\\n")) {
                    String[] parts = line.split(":", 2);
                    if (parts.length == 2) {
                        String key = parts[0].trim().toLowerCase();
                        String val = parts[1].trim();

                        if ("title".equals(key)) {
                            result.title = val;
                        } else if ("category".equals(key)) {
                            result.category = val.toUpperCase();
                        } else if ("audience".equals(key)) {
                            try {
                                result.audience = Audience.valueOf(val.toUpperCase());
                            } catch (IllegalArgumentException e) {
                                result.audience = Audience.ALL;
                            }
                        }
                    }
                }
            }
        }

        return result;
    }
}
