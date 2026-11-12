package com.team4.sportscenter.modules.manager.services;

import java.text.Normalizer;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generates and reconciles subject-based class codes (e.g. [YOGA-104], [YOGA-203])
 * inside CLASSES.class_name under concurrency locks.
 */
public final class ClassCodeGenerator {
    private static final Pattern CODE_PREFIX_PATTERN = Pattern.compile("^\\s*\\[([^\\]]+)\\]\\s*(.*)$");
    private static final List<Map.Entry<String, String>> SUBJECT_PREFIXES = List.of(
            Map.entry("gym", "GYM"),
            Map.entry("the hinh", "GYM"),
            Map.entry("yoga", "YOGA"),
            Map.entry("zumba", "ZUMBA"),
            Map.entry("boi", "SWIM"),
            Map.entry("swim", "SWIM"),
            Map.entry("dap xe", "SPIN"),
            Map.entry("spin", "SPIN"),
            Map.entry("cycling", "SPIN"),
            Map.entry("box", "BOX"),
            Map.entry("kickfit", "BOX"),
            Map.entry("pilates", "PILATES"),
            Map.entry("dance", "DANCE"),
            Map.entry("aerobic", "DANCE")
    );

    private ClassCodeGenerator() {
    }

    public record SplitClassName(String code, String title) {
    }

    public static SplitClassName splitCode(String className) {
        String raw = className == null ? "" : className;
        Matcher matcher = CODE_PREFIX_PATTERN.matcher(raw);
        if (matcher.matches()) {
            return new SplitClassName(matcher.group(1).trim(), matcher.group(2).trim());
        }
        return new SplitClassName("", raw.trim());
    }

    public static String fold(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replace('\u0111', 'd')
                .replace('\u0110', 'd')
                .replaceAll("\\p{M}+", "");
        return normalized.toLowerCase(Locale.ROOT);
    }

    public static String subjectCodePrefix(String subjectName) {
        String cleaned = fold(subjectName).replaceAll("[^a-z0-9\\s]", " ").trim();
        if (cleaned.isEmpty()) return "CLS";
        for (var entry : SUBJECT_PREFIXES) {
            if (cleaned.contains(entry.getKey())) return entry.getValue();
        }
        for (String token : cleaned.split("\\s+")) {
            if (token.length() >= 2) {
                return token.substring(0, Math.min(8, token.length())).toUpperCase(Locale.ROOT);
            }
        }
        String joined = cleaned.replaceAll("\\s+", "");
        return (joined.isEmpty() ? "CLS" : joined.substring(0, Math.min(8, joined.length()))).toUpperCase(Locale.ROOT);
    }

    public static String nextClassCode(List<String> existingClassNames, String subjectName, Integer levelBand) {
        String prefix = subjectCodePrefix(subjectName);
        int band = (levelBand != null && levelBand >= 1 && levelBand <= 3) ? levelBand : 1;
        int bandStart = band * 100;
        int bandEnd = bandStart + 99;
        Set<Integer> used = new HashSet<>();
        int maxInBand = bandStart;
        Pattern pattern = Pattern.compile("^" + Pattern.quote(prefix) + "-(\\d+)$", Pattern.CASE_INSENSITIVE);

        for (String existing : existingClassNames) {
            String code = splitCode(existing).code();
            Matcher m = pattern.matcher(code);
            if (!m.matches()) continue;
            try {
                int num = Integer.parseInt(m.group(1));
                used.add(num);
                if (num >= bandStart && num <= bandEnd && num > maxInBand) {
                    maxInBand = num;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        int candidate = maxInBand + 1;
        while (used.contains(candidate)) {
            candidate += 1;
        }
        return prefix + "-" + candidate;
    }

    public static String resolveClassName(
            String rawClassName,
            String subjectName,
            Integer levelBand,
            boolean autoCode,
            Integer currentClassId,
            List<Map<String, Object>> existingRows) {
        SplitClassName parsed = splitCode(rawClassName);
        String code = parsed.code().replace("[", "").replace("]", "").toUpperCase(Locale.ROOT);
        String title = parsed.title();

        Set<String> otherCodes = new HashSet<>();
        List<String> allClassNames = new java.util.ArrayList<>(existingRows.size());
        for (Map<String, Object> row : existingRows) {
            Object nameObj = row.get("className");
            if (nameObj == null) continue;
            String nameStr = String.valueOf(nameObj);
            allClassNames.add(nameStr);
            Object rowIdObj = row.get("classId");
            Integer rowId = rowIdObj instanceof Number n ? n.intValue() : null;
            if (currentClassId != null && currentClassId.equals(rowId)) continue;
            String existingCode = splitCode(nameStr).code().toUpperCase(Locale.ROOT);
            if (!existingCode.isEmpty()) {
                otherCodes.add(existingCode);
            }
        }

        if (autoCode) {
            if (code.isEmpty() || otherCodes.contains(code)) {
                code = nextClassCode(allClassNames, subjectName, levelBand);
            }
        } else if (!code.isEmpty() && otherCodes.contains(code)) {
            throw new IllegalArgumentException("Another class already uses code " + code + ".");
        }

        if (code.isEmpty()) {
            return title;
        }
        String formatted = title.isEmpty() ? "[" + code + "]" : "[" + code + "] " + title;
        if (formatted.length() > 255) {
            throw new IllegalArgumentException("Class name with code must be at most 255 characters");
        }
        return formatted;
    }
}
