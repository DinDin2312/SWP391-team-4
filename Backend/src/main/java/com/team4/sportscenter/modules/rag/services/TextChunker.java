package com.team4.sportscenter.modules.rag.services;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class TextChunker {

    public static final int DEFAULT_MAX_CHARS = 900;
    public static final int DEFAULT_OVERLAP_CHARS = 150;

    public List<String> split(String markdown) {
        return split(markdown, DEFAULT_MAX_CHARS, DEFAULT_OVERLAP_CHARS);
    }

    public List<String> split(String markdown, int maxChars, int overlapChars) {
        if (markdown == null || markdown.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<Section> sections = parseSections(markdown);
        List<String> allChunks = new ArrayList<>();

        for (Section section : sections) {
            String headingPrefix = (section.heading != null && !section.heading.trim().isEmpty())
                    ? section.heading.trim() + "\n\n"
                    : "";

            int effectiveMax = maxChars - headingPrefix.length();
            if (effectiveMax < 100) {
                // If heading is exceptionally long, drop headingPrefix to guarantee maxChars
                headingPrefix = "";
                effectiveMax = maxChars;
            }

            String body = section.body.toString().trim();
            if (body.isEmpty()) {
                if (!headingPrefix.isEmpty() && headingPrefix.trim().length() <= maxChars) {
                    allChunks.add(headingPrefix.trim());
                }
                continue;
            }

            int n = body.length();
            int start = 0;

            while (start < n) {
                int end = Math.min(start + effectiveMax, n);

                if (end < n) {
                    int lastSpace = -1;
                    for (int i = end; i > start; i--) {
                        if (Character.isWhitespace(body.charAt(i))) {
                            lastSpace = i;
                            break;
                        }
                    }
                    if (lastSpace > start) {
                        end = lastSpace;
                    }
                }

                String chunkBody = body.substring(start, end).trim();
                if (!chunkBody.isEmpty()) {
                    String fullChunk = headingPrefix.isEmpty() ? chunkBody : headingPrefix + chunkBody;
                    if (fullChunk.length() <= maxChars) {
                        allChunks.add(fullChunk);
                    } else {
                        allChunks.add(chunkBody);
                    }
                }

                if (end >= n) {
                    break;
                }

                // Advance with overlap
                int nextStart = end - overlapChars;
                if (nextStart <= start) {
                    nextStart = end;
                } else {
                    while (nextStart < end && !Character.isWhitespace(body.charAt(nextStart))) {
                        nextStart++;
                    }
                    while (nextStart < end && Character.isWhitespace(body.charAt(nextStart))) {
                        nextStart++;
                    }
                    if (nextStart >= end) {
                        nextStart = end;
                    }
                }
                start = nextStart;
            }
        }

        return allChunks;
    }

    private static class Section {
        String heading;
        StringBuilder body = new StringBuilder();

        Section(String heading) {
            this.heading = heading;
        }
    }

    private List<Section> parseSections(String markdown) {
        List<Section> sections = new ArrayList<>();
        String[] lines = markdown.split("\\r?\\n");

        Section current = new Section(null);

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("^#{1,6}\\s+.*$")) {
                if (current.heading != null || current.body.length() > 0) {
                    sections.add(current);
                }
                current = new Section(trimmed);
            } else {
                current.body.append(line).append("\n");
            }
        }

        if (current.heading != null || current.body.length() > 0) {
            sections.add(current);
        }

        return sections;
    }
}
