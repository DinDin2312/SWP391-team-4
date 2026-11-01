/**
 * Packages (GYM_ACCESS, AI_ACCESS, COMBO, PREMIUM) never include subject session quotas
 * and cannot be used to enroll in Coach-led courses (CLASSES).
 */
export function packageBookingOptions() {
  return [];
}
