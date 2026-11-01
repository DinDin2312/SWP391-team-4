package com.team4.sportscenter.modules.rag.dtos;

import com.team4.sportscenter.modules.rag.entities.Audience;

public record IndexedChunk(
        long chunkId,
        String documentTitle,
        String category,
        Audience audience,
        String text,
        float[] vector
) {
}
