package com.team4.sportscenter.modules.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SupportPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT;

    @JsonCreator
    public static SupportPriority fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return NORMAL;
        }
        String normalized = value.trim().toUpperCase();
        for (SupportPriority p : values()) {
            if (p.name().equalsIgnoreCase(normalized)) {
                return p;
            }
        }
        if (normalized.contains("URGENT") || normalized.contains("HIGH")) {
            return URGENT;
        }
        if (normalized.contains("LOW")) {
            return LOW;
        }
        return NORMAL;
    }
}
