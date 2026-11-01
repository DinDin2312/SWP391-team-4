package com.team4.sportscenter.modules.member.health;

public enum HealthCondition {
    CARDIOVASCULAR,
    DIABETES,
    ASTHMA,
    LOWER_BACK,
    KNEE,
    SHOULDER,
    OSTEOPOROSIS,
    PREGNANCY;

    public static boolean isValid(String code) {
        if (code == null) return false;
        try {
            valueOf(code.trim().toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
