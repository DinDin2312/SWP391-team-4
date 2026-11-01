package com.team4.sportscenter.modules.rag.dtos;

import java.util.List;

public record AiChatResponse(
        String text,
        List<SourceCitation> sources
) {
    public record SourceCitation(
            int index,
            String title,
            String category
    ) {
    }
}
