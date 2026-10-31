package com.team4.sportscenter.modules.member.health;

public class HealthPromptBuilder {

    private HealthPromptBuilder() {}

    public static String sanitizeNotes(String notes) {
        if (notes == null) {
            return "";
        }
        String cleaned = notes.replace("[", "").replace("]", "")
                .replaceAll("\\r?\\n", " ")
                .trim();
        if (cleaned.length() > 300) {
            cleaned = cleaned.substring(0, 300);
        }
        return cleaned;
    }

    public static String studentLine(MemberHealthSummary s) {
        if (s == null || !s.completed()) {
            return " | Sức khỏe: chưa khai báo";
        }
        StringBuilder sb = new StringBuilder(" | Sức khỏe: ");
        sb.append(s.gender()).append(", ").append(s.age()).append("t");
        if (s.conditions() != null && !s.conditions().isEmpty()) {
            sb.append(", ").append(String.join(", ", s.conditions()));
        }
        if (s.clearanceRecommended()) {
            sb.append(", ⚠PAR-Q");
        }
        return sb.toString();
    }

    public static String memberBlock(MemberHealthSummary s) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== MEMBER HEALTH & PHYSIOLOGY CONTEXT ===\n");
        if (s == null || !s.completed()) {
            sb.append("- Status: Incomplete / Missing\n\n");
            sb.append("=== AI MEDICAL SAFETY GUARDRAILS ===\n");
            sb.append("- Health profile is missing. Before giving any detailed workout plan, briefly ask for age, gender and injuries, and suggest completing it in Settings > Health [ACTION:NAVIGATE:/member/settings]. Until then give only low-intensity general advice.\n");
            return sb.toString();
        }

        sb.append("- Gender: ").append(s.gender()).append("\n");
        sb.append("- Age: ").append(s.age()).append("\n");
        sb.append("- Medical conditions: ")
                .append(s.conditions() != null && !s.conditions().isEmpty() ? String.join(", ", s.conditions()) : "None declared")
                .append("\n");
        String sanitizedNotes = sanitizeNotes(s.notes());
        sb.append("- Pre-existing injuries / Member notes: ")
                .append(sanitizedNotes.isEmpty() ? "None" : sanitizedNotes)
                .append("\n");
        sb.append("- PAR-Q status: ")
                .append(s.clearanceRecommended() ? "FLAGGED (clearance recommended)" : "CLEARED")
                .append("\n\n");

        sb.append("=== AI MEDICAL SAFETY GUARDRAILS ===\n");
        if (s.clearanceRecommended()) {
            sb.append("- PAR-Q flagged: advise consulting a doctor before vigorous training; keep intensity low-to-moderate; never prescribe maximal lifts or HIIT.\n");
        }
        if (s.age() != null && s.age() >= 60) {
            sb.append("- Older adult (age >= 60): prioritise balance, mobility and fall prevention; avoid abrupt postural changes.\n");
        }

        if (s.conditions() != null) {
            for (String code : s.conditions()) {
                switch (code) {
                    case "KNEE":
                        sb.append("- Knee/Ligament: Avoid high-impact jumps, deep squats, lunges, leg extensions; substitute with cycling, swimming, supported leg presses.\n");
                        break;
                    case "LOWER_BACK":
                        sb.append("- Lower Back/Spine: Avoid heavy deadlifts, weighted squats, bent-over rows, full sit-ups/crunches; substitute with neutral spine core work, chest-supported rows, swimming.\n");
                        break;
                    case "SHOULDER":
                        sb.append("- Shoulder Joint: Avoid overhead presses, pull ups, dips, behind-the-neck movements; substitute with lateral raises, supported rows, neutral-grip presses.\n");
                        break;
                    case "CARDIOVASCULAR":
                        sb.append("- Cardiovascular: Avoid HIIT, sprint intervals, burpees, heavy deadlifts; maintain low-to-moderate steady cardio; absolutely no breath-holding/Valsalva.\n");
                        break;
                    case "OSTEOPOROSIS":
                        sb.append("- Osteoporosis: Avoid spinal flexion (crunches, sit-ups), explosive jumping, heavy spinal loading; substitute with weight-bearing low-impact exercises, balance drills.\n");
                        break;
                    case "PREGNANCY":
                        sb.append("- Pregnancy: Avoid prone/supine positions, intense abdominal crunches/planks, jumping, burpees, heavy lifting, overheating; substitute with prenatal yoga, walking, gentle swimming.\n");
                        break;
                    case "ASTHMA":
                        sb.append("- Asthma: Avoid prolonged HIIT, sprint intervals, burpees, cold-dry air exertion; keep warm-up gradual; suggest having inhaler accessible.\n");
                        break;
                    case "DIABETES":
                        sb.append("- Diabetes: Monitor blood sugar; remind to check blood sugar and carry fast carbs; maintain steady hydration; avoid exercising during peak insulin activity.\n");
                        break;
                    default:
                        break;
                }
            }
        }

        return sb.toString();
    }
}
