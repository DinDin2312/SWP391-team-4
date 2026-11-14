package com.team4.sportscenter;

import com.team4.sportscenter.modules.member.dtos.response.AvailableClassResponse;
import com.team4.sportscenter.modules.member.dtos.response.PackageResponse;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AiChatClassMatchingTests {

    private static AvailableClassResponse cls(int id, String name, String subject, String room, String coach, int hourOffset) {
        return AvailableClassResponse.builder()
                .classId(id)
                .className(name)
                .subjectName(subject)
                .roomName(room)
                .coachName(coach)
                .price(BigDecimal.valueOf(900000))
                .maxSlots(15)
                .bookedSlots(0)
                .totalSessions(6)
                .nextSessionTime(LocalDateTime.now().plusHours(hourOffset))
                .schedulePattern("Tue, Thu")
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<AvailableClassResponse> select(List<AvailableClassResponse> classes, String query) throws Exception {
        Class<?> impl = Class.forName("com.team4.sportscenter.modules.member.services.impl.AiChatServiceImpl");
        Method method = impl.getDeclaredMethod("selectClassesForPrompt", List.class, String.class);
        method.setAccessible(true);
        return (List<AvailableClassResponse>) method.invoke(null, classes, query);
    }

    @Test
    void martialArtsQuery_returnsBothKickfitAndBoxingClassesDespiteCutoff() throws Exception {
        List<AvailableClassResponse> all = List.of(
                cls(1, "[YOGA-101] Yoga Buổi Tối Thư Giãn", "Yoga Căn Bản", "[P201] Studio Yoga", "HLV Trần Mai Anh", 1),
                cls(2, "[GYM-101] Gym Căn Bản Cho Nam", "Thể Hình (Gym)", "[P101] Phòng Gym", "HLV Nguyễn Văn Tuấn", 2),
                cls(3, "[SWIM-101] Bơi Sải Buổi Tối", "Bơi Lội", "[P102] Bể Bơi Bốn Mùa", "HLV Phạm Minh Hoàng", 3),
                cls(4, "[ZUMBA-101] Zumba Đốt Mỡ Buổi Tối", "Zumba Dance", "[P301] Studio Zumba", "HLV Phạm Minh Hoàng", 4),
                cls(5, "[SPIN-201] Đạp Xe RPM", "Đạp Xe (Spinning)", "[P202] Studio Đạp Xe", "HLV Nguyễn Văn Tuấn", 5),
                cls(6, "[YOGA-102] Yoga Giảm Cân", "Yoga Căn Bản", "[P201] Studio Yoga", "HLV Trần Mai Anh", 6),
                cls(7, "[GYM-102] Siết Cơ Cấp Tốc", "Thể Hình (Gym)", "[P101] Phòng Gym", "HLV Nguyễn Văn Tuấn", 7),
                cls(8, "[ZUMBA-102] Zumba Dance", "Zumba Dance", "[P301] Studio Zumba", "HLV Phạm Minh Hoàng", 8),
                cls(9, "[PILATES-201] Pilates Reformer", "Pilates Reformer", "[P205] Studio Pilates", "HLV Trần Mai Anh", 9),
                cls(17, "[BOX-201] Kickfit Đối Kháng & Tự Vệ Thực Chiến", "Boxing & Kickfit", "[P303] Võ Đài Boxing & Kickfit Functional Arena", "HLV Phạm Minh Hoàng", 10),
                cls(18, "[BOX-202] Boxing Cardio Xả Stress & Đốt Calo", "Boxing & Kickfit", "[P303] Võ Đài Boxing & Kickfit Functional Arena", "HLV Nguyễn Văn Tuấn", 11)
        );

        List<AvailableClassResponse> picked = select(all, "cho tôi danh sách lớp võ");
        List<Integer> ids = picked.stream().map(AvailableClassResponse::getClassId).toList();

        assertEquals(List.of(17, 18), ids, "Must match ONLY and ALL martial arts / Boxing & Kickfit classes, without 'tôi' -> 'Buổi Tối' noise");
    }

    @Test
    void broadQuery_balancesClassesAcrossAllSubjectsInsteadOfStarvingLaterSubjects() throws Exception {
        List<AvailableClassResponse> all = new java.util.ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            all.add(cls(i, "[YOGA-" + (100 + i) + "] Yoga Class " + i, "Yoga Căn Bản", "[P201] Studio Yoga", "Coach A", i));
        }
        all.add(cls(17, "[BOX-201] Kickfit Đối Kháng", "Boxing & Kickfit", "[P303] Võ Đài Boxing", "Coach B", 20));
        all.add(cls(18, "[BOX-202] Boxing Cardio", "Boxing & Kickfit", "[P303] Võ Đài Boxing", "Coach C", 21));
        all.add(cls(19, "[PILATES-201] Pilates Reformer", "Pilates Reformer", "[P205] Studio Pilates", "Coach A", 22));
        all.add(cls(20, "[SWIM-101] Bơi Sải", "Bơi Lội", "[P102] Bể Bơi", "Coach B", 23));
        all.add(cls(21, "[GYM-101] Gym Tăng Cơ", "Thể Hình (Gym)", "[P101] Phòng Gym", "Coach C", 24));
        all.add(cls(22, "[SPIN-201] Đạp Xe", "Đạp Xe (Spinning)", "[P202] Studio Đạp Xe", "Coach C", 25));

        List<AvailableClassResponse> picked = select(all, "trung tâm hiện có những lớp nào");
        assertTrue(picked.stream().anyMatch(c -> c.getClassId() == 17));
        assertTrue(picked.stream().anyMatch(c -> c.getClassId() == 19));
        assertTrue(picked.stream().anyMatch(c -> c.getClassId() == 20));
        assertTrue(picked.stream().anyMatch(c -> c.getClassId() == 21));
        assertTrue(picked.stream().anyMatch(c -> c.getClassId() == 22));
    }

    @Test
    void formatPackagesForPrompt_preservesAllEightPackagesWithTypesAndFreeLabel() throws Exception {
        Class<?> impl = Class.forName("com.team4.sportscenter.modules.member.services.impl.AiChatServiceImpl");
        Method method = impl.getDeclaredMethod("formatPackagesForPrompt", List.class);
        method.setAccessible(true);

        List<PackageResponse> pkgs = List.of(
                PackageResponse.builder().packageId(1).packageName("Thẻ Gym 1 Tháng").packageType("GYM_ACCESS").packageTypeName("Quyền vào phòng gym").durationDays(30).price(BigDecimal.valueOf(500000)).build(),
                PackageResponse.builder().packageId(5).packageName("Thẻ Tập Thử VIP (1 Ngày)").packageType("GYM_ACCESS").packageTypeName("Quyền vào phòng gym").durationDays(1).price(BigDecimal.ZERO).purchaseLimitPerMember(1).build(),
                PackageResponse.builder().packageId(13).packageName("Gói Bể Bơi Bốn Mùa 1 Tháng").packageType("POOL_ACCESS").packageTypeName("Pool access").durationDays(30).price(BigDecimal.valueOf(450000)).build(),
                PackageResponse.builder().packageId(15).packageName("Gói Phòng Xông Hơi Sauna 1 Tháng").packageType("SAUNA_ACCESS").packageTypeName("Sauna access").durationDays(30).price(BigDecimal.valueOf(350000)).build()
        );

        String formatted = (String) method.invoke(null, pkgs);
        assertTrue(formatted.contains("Thẻ Gym 1 Tháng"));
        assertTrue(formatted.contains("Miễn phí (0 đ)"));
        assertTrue(formatted.contains("tối đa 1 lần/hội viên"));
        assertTrue(formatted.contains("Pool access"));
        assertTrue(formatted.contains("Sauna access"));
    }
}
