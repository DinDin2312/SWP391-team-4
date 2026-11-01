package com.team4.sportscenter.modules.member.health;

import java.util.*;
import java.util.stream.Collectors;

public class ExerciseSafetyRules {

    private static final Map<HealthCondition, List<String>> KEYWORDS = new EnumMap<>(HealthCondition.class);

    static {
        KEYWORDS.put(HealthCondition.KNEE, List.of("squat", "lunge", "jump", "nhảy", "burpee", "leg extension"));
        KEYWORDS.put(HealthCondition.LOWER_BACK, List.of("deadlift", "squat", "good morning", "bent-over", "crunch", "gập bụng", "sit-up"));
        KEYWORDS.put(HealthCondition.SHOULDER, List.of("pull up", "pull-up", "kéo xà", "overhead", "shoulder press", "dip", "upright row"));
        KEYWORDS.put(HealthCondition.CARDIOVASCULAR, List.of("burpee", "hiit", "sprint", "deadlift", "jump", "nhảy"));
        KEYWORDS.put(HealthCondition.OSTEOPOROSIS, List.of("crunch", "gập bụng", "sit-up", "jump", "nhảy", "deadlift"));
        KEYWORDS.put(HealthCondition.PREGNANCY, List.of("crunch", "gập bụng", "sit-up", "jump", "nhảy", "burpee", "deadlift"));
        KEYWORDS.put(HealthCondition.ASTHMA, List.of("hiit", "sprint", "burpee"));
    }

    private ExerciseSafetyRules() {}

    public static Set<HealthCondition> contraindicationsFor(String exerciseName, String muscleGroup) {
        if (exerciseName == null && muscleGroup == null) {
            return Collections.emptySet();
        }
        String combined = ((exerciseName != null ? exerciseName : "") + " " + (muscleGroup != null ? muscleGroup : ""))
                .toLowerCase(Locale.ROOT);

        Set<HealthCondition> result = new LinkedHashSet<>();
        for (Map.Entry<HealthCondition, List<String>> entry : KEYWORDS.entrySet()) {
            for (String kw : entry.getValue()) {
                if (combined.contains(kw)) {
                    result.add(entry.getKey());
                    break;
                }
            }
        }
        return result;
    }

    public static List<String> contraindicationCodesFor(String exerciseName, String muscleGroup) {
        return contraindicationsFor(exerciseName, muscleGroup).stream()
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    public static List<String> conflictsFor(MemberHealthSummary summary, String exerciseName, String muscleGroup) {
        if (summary == null || summary.conditions() == null || summary.conditions().isEmpty()) {
            return Collections.emptyList();
        }
        List<String> codes = contraindicationCodesFor(exerciseName, muscleGroup);
        return codes.stream()
                .filter(summary.conditions()::contains)
                .collect(Collectors.toList());
    }
}
