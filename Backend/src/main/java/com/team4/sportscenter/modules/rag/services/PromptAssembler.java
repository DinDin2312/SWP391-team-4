package com.team4.sportscenter.modules.rag.services;

import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;

import java.util.List;

public class PromptAssembler {

    private PromptAssembler() {
        // Utility class
    }

    public static String knowledgeBlock(List<RetrievedChunk> chunks) {
        if (chunks == null || chunks.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("=== KNOWLEDGE BASE (NEXUS KNOWLEDGE RETRIEVAL) ===\n");
        for (int i = 0; i < chunks.size(); i++) {
            RetrievedChunk chunk = chunks.get(i);
            sb.append("[").append(i + 1).append("] (")
                    .append(chunk.documentTitle()).append(" - ").append(chunk.category())
                    .append(") ").append(chunk.text()).append("\n\n");
        }
        sb.append("Rules for answering using knowledge base:\n")
                .append("1. Only cite [n] citations ([1], [2], etc.) that appear directly in the knowledge base above.\n")
                .append("2. If the above knowledge does not cover the question, answer politely based on general fitness principles without inventing false center rules or citations.\n\n");

        return sb.toString();
    }
}
