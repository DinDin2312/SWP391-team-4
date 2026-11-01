package com.team4.sportscenter.modules.rag.services;

public interface DocumentIngestionService {

    enum IngestResult {
        SKIPPED_UNCHANGED,
        INGESTED,
        FAILED
    }

    IngestResult ingest(String sourceKey, String markdown);
}
