package com.team4.sportscenter.modules.rag.dtos;

public record RetrievedChunk(
        String documentTitle,
        String category,
        String text,
        double score
) {
}
