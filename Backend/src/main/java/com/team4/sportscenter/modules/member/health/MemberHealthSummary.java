package com.team4.sportscenter.modules.member.health;

import java.util.List;

public record MemberHealthSummary(
    String gender,
    Integer age,
    List<String> conditions,
    String notes,
    boolean clearanceRecommended,
    boolean completed
) {
    public static MemberHealthSummary empty() {
        return new MemberHealthSummary(null, null, List.of(), null, false, false);
    }
}
