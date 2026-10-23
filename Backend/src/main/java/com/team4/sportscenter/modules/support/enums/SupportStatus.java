package com.team4.sportscenter.modules.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SupportStatus {
    PENDING,
    IN_PROGRESS,
    APPROVED,
    RESOLVED,
    ESCALATED,
    REJECTED;

    @JsonCreator
    public static SupportStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return PENDING;
        }
        String normalized = value.trim().toUpperCase();
        for (SupportStatus st : values()) {
            if (st.name().equalsIgnoreCase(normalized)) {
                return st;
            }
        }
        if (normalized.contains("APPROV") || normalized.contains("RESOLV")) {
            return APPROVED;
        }
        if (normalized.contains("ESCALAT")) {
            return ESCALATED;
        }
        if (normalized.contains("REJECT")) {
            return REJECTED;
        }
        if (normalized.contains("PROGRESS")) {
            return IN_PROGRESS;
        }
        return PENDING;
    }
}
