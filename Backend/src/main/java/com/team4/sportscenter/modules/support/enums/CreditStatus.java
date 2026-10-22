package com.team4.sportscenter.modules.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum CreditStatus {
    ACTIVE,
    USED,
    EXHAUSTED,
    EXPIRED,
    CANCELLED;

    @JsonCreator
    public static CreditStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ACTIVE;
        }
        String normalized = value.trim().toUpperCase();
        for (CreditStatus st : values()) {
            if (st.name().equalsIgnoreCase(normalized)) {
                return st;
            }
        }
        if (normalized.contains("CANCEL") || normalized.contains("REVOK")) {
            return CANCELLED;
        }
        if (normalized.contains("EXPIRE")) {
            return EXPIRED;
        }
        if (normalized.contains("USE") || normalized.contains("EXHAUST")) {
            return USED;
        }
        return ACTIVE;
    }
}
