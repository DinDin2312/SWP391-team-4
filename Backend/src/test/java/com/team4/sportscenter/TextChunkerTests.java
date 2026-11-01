package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.services.TextChunker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class TextChunkerTests {

    private TextChunker chunker;

    @BeforeEach
    void setUp() {
        chunker = new TextChunker();
    }

    @Test
    void split_emptyInputReturnsEmptyList() {
        assertTrue(chunker.split(null).isEmpty());
        assertTrue(chunker.split("").isEmpty());
        assertTrue(chunker.split("   \n\t  ").isEmpty());
    }

    @Test
    void split_respectsMaxChars() {
        StringBuilder sb = new StringBuilder();
        String sample = "Hội viên NEXUS Sports Lab cần khởi động kỹ các khớp cổ chân gối hông trước khi tập luyện nặng để tránh chấn thương. ";
        while (sb.length() < 5000) {
            sb.append(sample);
        }

        List<String> chunks = chunker.split(sb.toString(), 900, 150);
        assertFalse(chunks.isEmpty());
        for (String chunk : chunks) {
            assertTrue(chunk.length() <= 900, "Chunk length " + chunk.length() + " exceeds maxChars 900");
        }
    }

    @Test
    void split_neverCutsInsideWord() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 200; i++) {
            sb.append("từthứ").append(i).append(" ");
        }

        List<String> chunks = chunker.split(sb.toString(), 200, 40);
        assertFalse(chunks.isEmpty());
        for (String chunk : chunks) {
            assertTrue(chunk.length() <= 200);
            // No word should be split in the middle; words must match pattern từthứ\d+
            String[] tokens = chunk.trim().split("\\s+");
            for (String token : tokens) {
                assertTrue(token.matches("từthứ\\d+"), "Token was cut inside word: " + token);
            }
        }
    }

    @Test
    void split_keepsHeadingContext() {
        String markdown = "# HƯỚNG DẪN XỬ LÝ CHẤN THƯƠNG\n\n" +
                "Phần mở đầu chung về an toàn phòng tập.\n\n" +
                "## Đau khớp gối\n\n" +
                "Khi hội viên than phiền bị đau nhói khớp gối trong hoặc sau khi Squat, huấn luyện viên cần dừng ngay bài tập đó. " +
                "Kiểm tra xem đầu gối có bị sưng đỏ, tràn dịch hay kêu lục cục kèm đau nhói hay không. " +
                "Khuyên học viên chườm đá lạnh trong 15-20 phút đầu và tạm ngưng các bài gánh nặng lên khớp gối.";

        List<String> chunks = chunker.split(markdown, 300, 50);
        assertFalse(chunks.isEmpty());
        boolean foundGoiWithHeading = false;
        for (String chunk : chunks) {
            if (chunk.contains("Squat") || chunk.contains("chườm đá")) {
                assertTrue(chunk.startsWith("## Đau khớp gối") || chunk.contains("## Đau khớp gối"),
                        "Chunk missing heading context: " + chunk);
                foundGoiWithHeading = true;
            }
        }
        assertTrue(foundGoiWithHeading, "Expected at least one chunk for Đau khớp gối section");
    }

    @Test
    void split_overlapRepeatsTail() {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 60; i++) {
            sb.append("câu_số_").append(i).append(". ");
        }

        List<String> chunks = chunker.split(sb.toString(), 200, 50);
        assertTrue(chunks.size() >= 2, "Expected multiple chunks for overlap test");

        // The second chunk should overlap with the end of the first chunk
        String firstChunk = chunks.get(0);
        String secondChunk = chunks.get(1);

        String[] firstWords = firstChunk.trim().split("\\s+");
        String lastWordOfFirst = firstWords[firstWords.length - 1];

        assertTrue(secondChunk.contains(lastWordOfFirst),
                "Second chunk does not contain tail overlap from first chunk (" + lastWordOfFirst + ")");
    }
}
