package com.team4.sportscenter;

import com.team4.sportscenter.modules.rag.dtos.IndexedChunk;
import com.team4.sportscenter.modules.rag.dtos.RetrievedChunk;
import com.team4.sportscenter.modules.rag.entities.Audience;
import com.team4.sportscenter.modules.rag.gemini.GeminiClient;
import com.team4.sportscenter.modules.rag.gemini.GeminiResponseParser;
import com.team4.sportscenter.modules.rag.services.PromptAssembler;
import com.team4.sportscenter.modules.rag.services.TextChunker;
import com.team4.sportscenter.modules.rag.services.VectorIndex;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class RagCliRunner {

    @Test
    void runInteractiveKnowledgeTest() throws Exception {
        System.out.println("================================================================================");
        System.out.println("🚀 NEXUS SPORTS LAB - RAG & AI ANSWERING CAPABILITY TEST SUITE");
        System.out.println("================================================================================");

        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            apiKey = System.getProperty("gemini.api.key");
        }

        boolean hasKey = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("YOUR_GEMINI_API_KEY_HERE");

        if (hasKey) {
            System.out.println("🔑 Gemini API Key: [DETECTED] - Real-time AI Generation & Embedding ENABLED");
        } else {
            System.out.println("⚠️ Gemini API Key: [NOT FOUND]");
            System.out.println("ℹ️ Chế độ mô phỏng RAG: Hiển thị chunking, keyword matching và prompt context.");
            System.out.println("👉 Để sinh câu trả lời trực tiếp từ Gemini, hãy chạy kèm -Dgemini.api.key=YOUR_KEY");
        }
        System.out.println("--------------------------------------------------------------------------------\n");

        // 1. Load 7 markdown knowledge files
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath*:rag/knowledge/*.md");
        System.out.println("📚 [Bước 1] Đang quét và phân tích kho tri thức (Knowledge Base): " + resources.length + " tài liệu:");

        TextChunker chunker = new TextChunker();
        VectorIndex vectorIndex = new VectorIndex();
        GeminiClient geminiClient = new GeminiClient(new GeminiResponseParser());
        if (hasKey) {
            ReflectionTestUtils.setField(geminiClient, "apiKey", apiKey.trim());
            ReflectionTestUtils.setField(geminiClient, "chatModel", "gemini-3.5-flash-lite");
            ReflectionTestUtils.setField(geminiClient, "fallbackModel", "gemini-3.1-flash-lite");
            ReflectionTestUtils.setField(geminiClient, "embeddingModel", "gemini-embedding-001");
            ReflectionTestUtils.setField(geminiClient, "embeddingDimensions", 768);
            ReflectionTestUtils.setField(geminiClient, "connectTimeoutMs", 5000);
            ReflectionTestUtils.setField(geminiClient, "readTimeoutMs", 15000);
            geminiClient.init();
        }

        List<IndexedChunk> allChunks = new ArrayList<>();
        long chunkIdSeq = 1L;

        for (Resource res : resources) {
            String filename = res.getFilename();
            String content;
            try (InputStream is = res.getInputStream()) {
                content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }

            Map<String, String> meta = parseHeader(content);
            String title = meta.getOrDefault("title", filename);
            String category = meta.getOrDefault("category", "GENERAL");
            Audience audience = Audience.valueOf(meta.getOrDefault("audience", "ALL").toUpperCase());

            List<String> chunkTexts = chunker.split(content, 450, 60);
            System.out.printf("  📄 %-35s | Mục: %-15s | Đối tượng: %-7s | Chunks: %d%n",
                    filename, category, audience, chunkTexts.size());

            for (String ct : chunkTexts) {
                allChunks.add(new IndexedChunk(
                        chunkIdSeq++,
                        title,
                        category,
                        audience,
                        ct,
                        new float[768]
                ));
            }
        }
        System.out.println("\n✅ Tổng số chunks đã tạo trong Vector Index: " + allChunks.size());

        // Compute embeddings if key available
        if (hasKey) {
            System.out.print("⚡ Đang tạo Vector Embeddings (text-embedding-004) cho toàn bộ chunks... ");
            long startEmbed = System.currentTimeMillis();
            List<String> texts = allChunks.stream().map(IndexedChunk::text).toList();
            for (int i = 0; i < texts.size(); i += 20) {
                int end = Math.min(i + 20, texts.size());
                List<float[]> embs = geminiClient.embed(texts.subList(i, end), GeminiClient.EmbedTask.RETRIEVAL_DOCUMENT);
                for (int j = 0; j < embs.size(); j++) {
                    System.arraycopy(embs.get(j), 0, allChunks.get(i + j).vector(), 0, 768);
                }
            }
            long embedTime = System.currentTimeMillis() - startEmbed;
            System.out.printf("Xong trong %d ms!%n%n", embedTime);
        }

        vectorIndex.replaceAll(allChunks);

        // 2. Test Questions
        String[] testQuestions = {
                "Trung tâm có những phòng tập nào, bể bơi ở tầng mấy và giờ mở cửa thế nào?",
                "Nếu HLV bận việc đột xuất thì quy định dời lịch dạy bù của trung tâm như thế nào? Học viên có bị mất lượt không?",
                "Tôi bị đau khớp gối thì có nên tập Squat không và cần lưu ý gì?",
                "Tôi đã đăng ký lớp học nhưng bận đột xuất, tôi phải hủy trước bao lâu để được hoàn lượt tập?"
        };

        System.out.println("================================================================================");
        System.out.println("🧪 [Bước 2] BẮT ĐẦU KIỂM THỬ TRẢ LỜI 4 CÂU HỎI NGHIỆP VỤ THỰC TẾ");
        System.out.println("================================================================================\n");

        for (int i = 0; i < testQuestions.length; i++) {
            String question = testQuestions[i];
            System.out.printf("❓ [CÂU HỎI %d]: \"%s\"%n", i + 1, question);
            System.out.println("--------------------------------------------------------------------------------");

            List<RetrievedChunk> topChunks = Collections.emptyList();
            if (hasKey) {
                List<float[]> qEmb = geminiClient.embed(List.of(question), GeminiClient.EmbedTask.RETRIEVAL_QUERY);
                if (qEmb != null && !qEmb.isEmpty()) {
                    topChunks = vectorIndex.topK(qEmb.get(0), 3, 0.40, Audience.MEMBER);
                }
            }
            if (topChunks.isEmpty()) {
                topChunks = findKeywordChunks(allChunks, question, 3);
            }

            System.out.println("📌 [RAG RETRIEVAL - TÀI LIỆU TRÍCH XUẤT]:");
            for (int k = 0; k < topChunks.size(); k++) {
                RetrievedChunk rc = topChunks.get(k);
                System.out.printf("   [%d] %s (%s) - Điểm phù hợp: %.2f%n",
                        k + 1, rc.documentTitle(), rc.category(), rc.score());
                String preview = rc.text().replaceAll("\\s+", " ").trim();
                if (preview.length() > 140) preview = preview.substring(0, 140) + "...";
                System.out.println("       Trích đoạn: \"" + preview + "\"");
            }

            String knowledgeBlock = PromptAssembler.knowledgeBlock(topChunks);
            String systemPrompt = "You are NEXUS AI, personal assistant for NEXUS Sports Lab.\n" +
                    knowledgeBlock +
                    "Keep responses concise (2 to 4 sentences), friendly and helpful. Always answer in Vietnamese.\n";

            if (hasKey) {
                System.out.println("\n🤖 [CÂU TRẢ LỜI CỦA AI (GEMINI + RAG)]:\n");
                Optional<String> answer = geminiClient.generate(systemPrompt + "\nUser Question: " + question, 400);
                if (answer.isPresent()) {
                    System.out.println(answer.get());
                } else {
                    System.out.println("⚠️ Không nhận được phản hồi từ Gemini API.");
                }
            } else {
                System.out.println("\n💡 [MÔ PHỎNG NỘI DUNG PROMPT RAG ĐƯỢC GHÉP VÀO CONTEXT]:");
                System.out.println("   -> Context đã tự động nạp " + topChunks.size() + " trích đoạn chính xác từ tài liệu trên.");
            }
            System.out.println("\n" + "=".repeat(80) + "\n");
        }
    }

    private Map<String, String> parseHeader(String md) {
        Map<String, String> map = new HashMap<>();
        if (!md.startsWith("---")) return map;
        int end = md.indexOf("---", 3);
        if (end < 0) return map;
        String front = md.substring(3, end);
        for (String line : front.split("\n")) {
            int colon = line.indexOf(':');
            if (colon > 0) {
                map.put(line.substring(0, colon).trim(), line.substring(colon + 1).trim());
            }
        }
        return map;
    }

    private List<RetrievedChunk> findKeywordChunks(List<IndexedChunk> all, String q, int limit) {
        String[] words = q.toLowerCase().split("[\\s,?.!]+");
        List<Scored> scored = new ArrayList<>();
        for (IndexedChunk c : all) {
            String text = (c.documentTitle() + " " + c.text()).toLowerCase();
            int count = 0;
            for (String w : words) {
                if (w.length() >= 3 && text.contains(w)) count++;
            }
            if (count > 0) {
                double score = Math.min(0.95, 0.50 + count * 0.1);
                scored.add(new Scored(c, score));
            }
        }
        scored.sort((a, b) -> Double.compare(b.score, a.score));
        List<RetrievedChunk> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, scored.size()); i++) {
            Scored s = scored.get(i);
            result.add(new RetrievedChunk(
                    s.chunk.documentTitle(),
                    s.chunk.category(),
                    s.chunk.text(),
                    s.score
            ));
        }
        return result;
    }

    private record Scored(IndexedChunk chunk, double score) {}
}
