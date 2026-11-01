package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.services.PromptAssembler;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PromptAssemblerTests {

    @Test
    void knowledgeBlock_emptyWhenNoChunks() {
        assertEquals("", PromptAssembler.knowledgeBlock(null));
        assertEquals("", PromptAssembler.knowledgeBlock(Collections.emptyList()));
    }

    @Test
    void knowledgeBlock_numbersChunksAndIncludesTitles() {
        List<RetrievedChunk> chunks = List.of(
                new RetrievedChunk("Chính sách hoàn tiền", "POLICY", "Hội viên được bảo lưu lượt tập khi hủy trước 2 tiếng.", 0.89),
                new RetrievedChunk("Chấn thương vai", "INJURY", "Tránh ép vai góc 90 độ khi đẩy ngực.", 0.82)
        );

        String block = PromptAssembler.knowledgeBlock(chunks);
        assertNotNull(block);
        assertTrue(block.contains("[1] (Chính sách hoàn tiền - POLICY)"));
        assertTrue(block.contains("Hội viên được bảo lưu lượt tập khi hủy trước 2 tiếng."));
        assertTrue(block.contains("[2] (Chấn thương vai - INJURY)"));
        assertTrue(block.contains("Tránh ép vai góc 90 độ khi đẩy ngực."));
        assertTrue(block.contains("Only cite [n]") || block.contains("[1], [2]") || block.contains("citations"));
    }
}
