package com.team4.sportscenter;

import com.team4.sportscenter.modules.member.health.ExerciseSafetyRules;
import com.team4.sportscenter.modules.member.health.HealthCondition;
import com.team4.sportscenter.modules.member.health.MemberHealthSummary;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ExerciseSafetyRulesTests {

    @Test
    @DisplayName("Squat triggers KNEE and LOWER_BACK")
    void testSquatContraindications() {
        Set<HealthCondition> rules = ExerciseSafetyRules.contraindicationsFor("Squat (Đứng lên ngồi xuống)", "Đùi");
        assertTrue(rules.contains(HealthCondition.KNEE));
        assertTrue(rules.contains(HealthCondition.LOWER_BACK));
        assertEquals(2, rules.size());
    }

    @Test
    @DisplayName("Crunch triggers LOWER_BACK, OSTEOPOROSIS, PREGNANCY")
    void testCrunchContraindications() {
        Set<HealthCondition> rules = ExerciseSafetyRules.contraindicationsFor("Gập bụng (Crunch)", "Bụng");
        assertTrue(rules.contains(HealthCondition.LOWER_BACK));
        assertTrue(rules.contains(HealthCondition.OSTEOPOROSIS));
        assertTrue(rules.contains(HealthCondition.PREGNANCY));
        assertEquals(3, rules.size());
    }

    @Test
    @DisplayName("Pull up triggers SHOULDER")
    void testPullUpContraindications() {
        Set<HealthCondition> rules = ExerciseSafetyRules.contraindicationsFor("Kéo xà đơn (Pull up)", "Lưng");
        assertTrue(rules.contains(HealthCondition.SHOULDER));
        assertEquals(1, rules.size());
    }

    @Test
    @DisplayName("Treadmill Cardio returns empty set")
    void testTreadmillReturnsEmpty() {
        Set<HealthCondition> rules = ExerciseSafetyRules.contraindicationsFor("Chạy bộ máy (Treadmill)", "Cardio");
        assertTrue(rules.isEmpty());
    }

    @Test
    @DisplayName("Null parameters return empty set")
    void testNullReturnsEmpty() {
        assertTrue(ExerciseSafetyRules.contraindicationsFor(null, null).isEmpty());
        assertTrue(ExerciseSafetyRules.contraindicationsFor("Squat", null).contains(HealthCondition.KNEE));
        assertTrue(ExerciseSafetyRules.contraindicationsFor(null, "Đùi").isEmpty());
    }

    @Test
    @DisplayName("contraindicationCodesFor returns sorted enum names")
    void testContraindicationCodesFor() {
        List<String> codes = ExerciseSafetyRules.contraindicationCodesFor("Squat (Đứng lên ngồi xuống)", "Đùi");
        assertTrue(codes.contains("KNEE"));
        assertTrue(codes.contains("LOWER_BACK"));
        assertEquals(2, codes.size());
    }

    @Test
    @DisplayName("conflictsFor returns intersection with student conditions")
    void testConflictsFor() {
        MemberHealthSummary summary = new MemberHealthSummary(
                "FEMALE", 45, List.of("KNEE", "CARDIOVASCULAR"), null, false, true
        );
        List<String> conflicts = ExerciseSafetyRules.conflictsFor(summary, "Squat", "Đùi");
        assertEquals(List.of("KNEE"), conflicts);

        MemberHealthSummary empty = MemberHealthSummary.empty();
        assertTrue(ExerciseSafetyRules.conflictsFor(empty, "Squat", "Đùi").isEmpty());
    }
}
