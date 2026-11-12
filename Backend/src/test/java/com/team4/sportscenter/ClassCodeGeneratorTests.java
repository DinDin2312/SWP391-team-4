package com.team4.sportscenter;

import com.team4.sportscenter.modules.manager.services.ClassCodeGenerator;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ClassCodeGeneratorTests {

    @Test
    void subjectCodePrefixAndNextClassCodeGenerateExpectedBands() {
        assertEquals("YOGA", ClassCodeGenerator.subjectCodePrefix("Yoga Căn Bản"));
        assertEquals("GYM", ClassCodeGenerator.subjectCodePrefix("Thể Hình (Gym)"));
        assertEquals("SPIN", ClassCodeGenerator.subjectCodePrefix("Đạp Xe (Spinning)"));
        assertEquals("VOVINAM", ClassCodeGenerator.subjectCodePrefix("Vovinam Cổ Truyền"));
        assertEquals("CLS", ClassCodeGenerator.subjectCodePrefix(""));

        List<String> existing = List.of(
                "[YOGA-101] Yoga Sáng",
                "[YOGA-102] Yoga Chiều",
                "[YOGA-201] Yoga Nâng Cao"
        );
        assertEquals("YOGA-103", ClassCodeGenerator.nextClassCode(existing, "Yoga Căn Bản", 1));
        assertEquals("YOGA-202", ClassCodeGenerator.nextClassCode(existing, "Yoga Căn Bản", 2));
        assertEquals("YOGA-301", ClassCodeGenerator.nextClassCode(existing, "Yoga Căn Bản", 3));
    }

    @Test
    void resolveClassNameHandlesConcurrencyAndRejectsManualDuplicates() {
        List<Map<String, Object>> rows = List.of(
                Map.of("classId", 1, "className", "[YOGA-101] Lớp 1"),
                Map.of("classId", 2, "className", "[YOGA-104] Lớp 4")
        );

        // Concurrent autoCode creation skips existing YOGA-104 and assigns YOGA-105
        assertEquals("[YOGA-105] Yoga Mới", ClassCodeGenerator.resolveClassName(
                "[YOGA-104] Yoga Mới", "Yoga Căn Bản", 1, true, null, rows
        ));

        // Blank code with autoCode=true fills next available code
        assertEquals("[YOGA-201] Yoga Nâng Cao", ClassCodeGenerator.resolveClassName(
                "Yoga Nâng Cao", "Yoga Căn Bản", 2, true, null, rows
        ));

        // Plain className with autoCode=false stays untouched (legacy / QA test compatibility)
        assertEquals("QA class", ClassCodeGenerator.resolveClassName(
                "QA class", "QA Subject", null, false, null, rows
        ));

        // Manual duplicate code on different class throws error
        assertThrows(IllegalArgumentException.class, () -> ClassCodeGenerator.resolveClassName(
                "[YOGA-104] Trùng mã", "Yoga Căn Bản", 1, false, null, rows
        ));

        // Editing own class with its own code is allowed
        assertEquals("[YOGA-104] Lớp 4 Đã Sửa", ClassCodeGenerator.resolveClassName(
                "[YOGA-104] Lớp 4 Đã Sửa", "Yoga Căn Bản", 1, false, 2, rows
        ));
    }
}
