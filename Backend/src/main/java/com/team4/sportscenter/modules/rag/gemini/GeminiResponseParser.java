package com.team4.sportscenter.modules.rag.gemini;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class GeminiResponseParser {

    /**
     * Extracts generated text from Gemini generateContent response body.
     */
    @SuppressWarnings("unchecked")
    public Optional<String> text(Map<String, Object> body) {
        if (body == null || !body.containsKey("candidates")) {
            return Optional.empty();
        }

        Object candidatesObj = body.get("candidates");
        if (!(candidatesObj instanceof List<?> candidates) || candidates.isEmpty()) {
            return Optional.empty();
        }

        Object firstCand = candidates.get(0);
        if (!(firstCand instanceof Map<?, ?> candMap)) {
            return Optional.empty();
        }

        Object contentObj = candMap.get("content");
        if (!(contentObj instanceof Map<?, ?> contentMap)) {
            return Optional.empty();
        }

        Object partsObj = contentMap.get("parts");
        if (!(partsObj instanceof List<?> parts) || parts.isEmpty()) {
            return Optional.empty();
        }

        Object firstPart = parts.get(0);
        if (!(firstPart instanceof Map<?, ?> partMap)) {
            return Optional.empty();
        }

        Object textObj = partMap.get("text");
        if (textObj instanceof String text && !text.trim().isEmpty()) {
            return Optional.of(text);
        }

        return Optional.empty();
    }

    /**
     * Extracts embedding float arrays from Gemini batchEmbedContents response body.
     */
    @SuppressWarnings("unchecked")
    public List<float[]> embeddings(Map<String, Object> body) {
        if (body == null || !body.containsKey("embeddings")) {
            return Collections.emptyList();
        }

        Object embListObj = body.get("embeddings");
        if (!(embListObj instanceof List<?> embList)) {
            return Collections.emptyList();
        }

        List<float[]> results = new ArrayList<>(embList.size());
        for (Object item : embList) {
            if (!(item instanceof Map<?, ?> embMap)) {
                continue;
            }
            Object valuesObj = embMap.get("values");
            if (!(valuesObj instanceof List<?> vals)) {
                continue;
            }
            float[] vector = new float[vals.size()];
            for (int i = 0; i < vals.size(); i++) {
                Object v = vals.get(i);
                if (v instanceof Number num) {
                    vector[i] = num.floatValue();
                }
            }
            results.add(vector);
        }

        return results;
    }
}
