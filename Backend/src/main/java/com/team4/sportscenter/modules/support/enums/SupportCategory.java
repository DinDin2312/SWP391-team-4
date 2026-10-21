package com.team4.sportscenter.modules.support.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SupportCategory {
    CLASS_CANCELLATION,
    REFUND_REQUEST,
    FACILITY_ISSUE,
    SCHEDULE_SUPPORT,
    FEEDBACK_SERVICE,
    COACH_FEEDBACK,
    COMPLAINT,
    GENERAL_INQUIRY;

    @JsonCreator
    public static SupportCategory fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return GENERAL_INQUIRY;
        }
        String normalized = value.trim().toUpperCase();
        for (SupportCategory cat : values()) {
            if (cat.name().equalsIgnoreCase(normalized)) {
                return cat;
            }
        }
        if (normalized.contains("CANCEL") || normalized.contains("REFUND")) {
            return CLASS_CANCELLATION;
        }
        if (normalized.contains("FACILITY")) {
            return FACILITY_ISSUE;
        }
        if (normalized.contains("COMPLAINT")) {
            return COMPLAINT;
        }
        if (normalized.contains("COACH") || normalized.contains("FEEDBACK")) {
            return COACH_FEEDBACK;
        }
        if (normalized.contains("SCHEDULE")) {
            return SCHEDULE_SUPPORT;
        }
        return GENERAL_INQUIRY;
    }
}
