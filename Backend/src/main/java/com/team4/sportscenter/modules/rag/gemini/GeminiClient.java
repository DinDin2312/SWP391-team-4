package com.team4.sportscenter.modules.rag.gemini;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Stream;

@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    public enum EmbedTask {
        RETRIEVAL_DOCUMENT,
        RETRIEVAL_QUERY
    }

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.chat.model:gemini-1.5-flash}")
    private String chatModel;

    @Value("${gemini.chat.fallback-model:gemini-1.5-flash-8b}")
    private String fallbackModel;

    @Value("${gemini.embedding.model:text-embedding-004}")
    private String embeddingModel;

    @Value("${gemini.embedding.dimensions:768}")
    private int embeddingDimensions;

    @Value("${gemini.http.connect-timeout-ms:3000}")
    private int connectTimeoutMs;

    @Value("${gemini.http.read-timeout-ms:8000}")
    private int readTimeoutMs;

    private final GeminiResponseParser responseParser;
    private RestTemplate restTemplate;

    public GeminiClient(GeminiResponseParser responseParser) {
        this.responseParser = responseParser;
    }

    @PostConstruct
    public void init() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeoutMs);
        factory.setReadTimeout(readTimeoutMs);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("YOUR_GEMINI_API_KEY_HERE");
    }

    public Optional<String> generate(String prompt, int maxOutputTokens) {
        return generate(Collections.emptyList(), prompt, maxOutputTokens);
    }

    public Optional<String> generate(List<Turn> history, String prompt, int maxOutputTokens) {
        if (!isConfigured()) {
            log.warn("Gemini API key is not configured");
            return Optional.empty();
        }

        // Build contents payload
        List<Map<String, Object>> contents = new ArrayList<>();
        if (history != null) {
            for (Turn turn : history) {
                if (turn == null || turn.text() == null || turn.text().trim().isEmpty()) continue;
                String role = "user".equalsIgnoreCase(turn.role()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", turn.text()))
                ));
            }
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", prompt))
        ));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        generationConfig.put("temperature", 0.7);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // Try primary model first, fallback to secondary if 5xx / 429 / timeout
        List<String> modelsToTry = new ArrayList<>();
        if (chatModel != null && !chatModel.trim().isEmpty()) {
            modelsToTry.add(chatModel.trim());
        }
        if (fallbackModel != null && !fallbackModel.trim().isEmpty() && !fallbackModel.equalsIgnoreCase(chatModel)) {
            modelsToTry.add(fallbackModel.trim());
        }

        for (String model : modelsToTry) {
            long startMs = System.currentTimeMillis();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
                long elapsed = System.currentTimeMillis() - startMs;
                log.info("Gemini generate success: model={}, status={}, elapsedMs={}", model, response.getStatusCode(), elapsed);

                Optional<String> parsedText = responseParser.text(response.getBody());
                if (parsedText.isPresent()) {
                    return parsedText;
                }
            } catch (HttpStatusCodeException ex) {
                long elapsed = System.currentTimeMillis() - startMs;
                log.warn("Gemini generate HTTP error: model={}, status={}, elapsedMs={}", model, ex.getStatusCode(), elapsed);
                // If 400 (Bad Request), don't retry fallback
                if (ex.getStatusCode().value() == 400) {
                    break;
                }
            } catch (Exception ex) {
                long elapsed = System.currentTimeMillis() - startMs;
                log.warn("Gemini generate call failed: model={}, ex={}, elapsedMs={}", model, ex.getClass().getSimpleName(), elapsed);
            }
        }

        return Optional.empty();
    }

    public Optional<String> stream(List<Turn> history, String prompt, int maxOutputTokens, Consumer<String> onDelta) {
        if (!isConfigured()) {
            log.warn("Gemini API key is not configured");
            return Optional.empty();
        }

        List<Map<String, Object>> contents = new ArrayList<>();
        if (history != null) {
            for (Turn turn : history) {
                if (turn == null || turn.text() == null || turn.text().trim().isEmpty()) continue;
                String role = "user".equalsIgnoreCase(turn.role()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", turn.text()))
                ));
            }
        }
        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", prompt))
        ));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", maxOutputTokens);
        generationConfig.put("temperature", 0.7);
        requestBody.put("generationConfig", generationConfig);

        String jsonPayload;
        try {
            jsonPayload = new ObjectMapper().writeValueAsString(requestBody);
        } catch (Exception e) {
            log.error("Failed to serialize Gemini stream request payload: {}", e.getMessage());
            return Optional.empty();
        }

        List<String> modelsToTry = new ArrayList<>();
        if (chatModel != null && !chatModel.trim().isEmpty()) {
            modelsToTry.add(chatModel.trim());
        }
        if (fallbackModel != null && !fallbackModel.trim().isEmpty() && !fallbackModel.equalsIgnoreCase(chatModel)) {
            modelsToTry.add(fallbackModel.trim());
        }

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(connectTimeoutMs))
                .build();

        ObjectMapper mapper = new ObjectMapper();

        for (String model : modelsToTry) {
            long startMs = System.currentTimeMillis();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey;

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofMillis(readTimeoutMs * 2))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<Stream<String>> response = client.send(request, HttpResponse.BodyHandlers.ofLines());
                long elapsed = System.currentTimeMillis() - startMs;

                if (response.statusCode() == 200) {
                    log.info("Gemini stream success: model={}, status={}, elapsedMs={}", model, response.statusCode(), elapsed);
                    StringBuilder fullText = new StringBuilder();
                    try (Stream<String> lines = response.body()) {
                        lines.forEach(line -> {
                            if (line.startsWith("data: ")) {
                                String dataStr = line.substring(6).trim();
                                if (!dataStr.isEmpty()) {
                                    try {
                                        Map<String, Object> bodyMap = mapper.readValue(dataStr, new TypeReference<Map<String, Object>>() {});
                                        responseParser.text(bodyMap).ifPresent(delta -> {
                                            onDelta.accept(delta);
                                            fullText.append(delta);
                                        });
                                    } catch (Exception ignored) {}
                                }
                            }
                        });
                    }
                    if (fullText.length() > 0) {
                        return Optional.of(fullText.toString());
                    }
                } else {
                    log.warn("Gemini stream HTTP error: model={}, status={}, elapsedMs={}", model, response.statusCode(), elapsed);
                    if (response.statusCode() == 400) {
                        break;
                    }
                }
            } catch (Exception ex) {
                long elapsed = System.currentTimeMillis() - startMs;
                log.warn("Gemini stream call failed: model={}, ex={}, elapsedMs={}", model, ex.getClass().getSimpleName(), elapsed);
            }
        }

        return Optional.empty();
    }

    public List<float[]> embed(List<String> texts, EmbedTask task) {
        if (!isConfigured() || texts == null || texts.isEmpty()) {
            return Collections.emptyList();
        }

        String targetModel = embeddingModel != null && !embeddingModel.trim().isEmpty() ? embeddingModel.trim() : "text-embedding-004";
        String fullModelPath = "models/" + targetModel;

        List<Map<String, Object>> requests = new ArrayList<>(texts.size());
        for (String text : texts) {
            Map<String, Object> req = new HashMap<>();
            req.put("model", fullModelPath);
            req.put("content", Map.of("parts", List.of(Map.of("text", text != null ? text : ""))));
            req.put("taskType", task.name());
            if (embeddingDimensions > 0) {
                req.put("outputDimensionality", embeddingDimensions);
            }
            requests.add(req);
        }

        Map<String, Object> requestBody = Map.of("requests", requests);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + targetModel + ":batchEmbedContents?key=" + apiKey;
        long startMs = System.currentTimeMillis();
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            long elapsed = System.currentTimeMillis() - startMs;
            log.info("Gemini batch embed success: count={}, elapsedMs={}", texts.size(), elapsed);
            return responseParser.embeddings(response.getBody());
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - startMs;
            log.warn("Gemini embed call failed: count={}, ex={}, elapsedMs={}", texts.size(), ex.getClass().getSimpleName(), elapsed);
            return Collections.emptyList();
        }
    }
}
