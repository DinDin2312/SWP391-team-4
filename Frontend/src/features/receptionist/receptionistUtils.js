import { t } from '../../i18n/useLanguage.js';

/**
 * Normalizes and translates check-in notes across English and Vietnamese.
 * Cleans historical duplicate prefixes (e.g. "HLV HLV" or "Coach Coach").
 */
export function formatCheckInNote(note, translate = t) {
  if (!note || typeof note !== 'string') return '';
  const trimmed = note.trim();
  if (!trimmed) return '';

  const normalized = trimmed
    .replace(/(?:HLV\s+)+/gi, 'HLV ')
    .replace(/(?:Coach\s+)+/gi, 'Coach ');

  return translate(normalized);
}

/**
 * Normalizes and translates anomaly reasons for check-in records.
 */
export function formatCheckInAnomaly(reason, translate = t) {
  if (!reason || typeof reason !== 'string') return '';
  const trimmed = reason.trim();
  if (!trimmed) return '';

  const normalized = trimmed
    .replace(/(?:HLV\s+)+/gi, 'HLV ')
    .replace(/(?:Coach\s+)+/gi, 'Coach ');

  return translate(normalized);
}

/**
 * Formats check-in package name to adapt "Lớp: [Tên]" to "Class: [Name]" in English.
 */
export function formatCheckInPackage(packageName, translate = t) {
  if (!packageName || typeof packageName !== 'string') return '—';
  const trimmed = packageName.trim();
  if (/^Lớp:\s*(.+)$/i.test(trimmed)) {
    const className = trimmed.replace(/^Lớp:\s*/i, '');
    return `${translate('Class:')} ${className}`;
  }
  return translate(trimmed);
}

/**
 * Translates facility/room names into English or Vietnamese.
 */
export function formatFacilityName(facilityName, translate = t) {
  if (!facilityName || typeof facilityName !== 'string') return '—';
  return translate(facilityName.trim());
}

/**
 * Parses member pass / package / session check-in QR payloads emitted by member pages or manual input.
 * Supports:
 * - NEXUS-PASS-<userId>-PKG-<membershipId>
 * - NEXUS-PASS-<userId>-BK-<bookingId>
 * - NEXUS-PASS-NX-0<userId>-VN
 * - NEXUS-PASS-<userId>
 * - NEXUS-<userId>-<email>
 * - JSON { userId, membershipId, bookingId, email }
 * - #<userId>, <userId>, or email
 */
export function parseMemberQrPayload(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const data = JSON.parse(trimmed);
      const userId = Number(data?.userId) > 0 ? Number(data.userId) : null;
      const membershipId = Number(data?.membershipId) > 0 ? Number(data.membershipId) : null;
      const bookingId = Number(data?.bookingId) > 0 ? Number(data.bookingId) : null;
      const email = typeof data?.email === 'string' && data.email.includes('@') ? data.email.trim() : null;
      if (userId || email) return { userId, membershipId, bookingId, email, raw: trimmed };
    } catch {
      return null;
    }
  }

  const pkgPassMatch = /^NEXUS-PASS-(\d+)-PKG-(\d+)$/i.exec(trimmed);
  if (pkgPassMatch) {
    return {
      userId: Number(pkgPassMatch[1]),
      membershipId: Number(pkgPassMatch[2]),
      bookingId: null,
      email: null,
      raw: trimmed,
    };
  }

  const bookingPassMatch = /^NEXUS-PASS-(\d+)-BK-(\d+)$/i.exec(trimmed);
  if (bookingPassMatch) {
    return {
      userId: Number(bookingPassMatch[1]),
      membershipId: null,
      bookingId: Number(bookingPassMatch[2]),
      email: null,
      raw: trimmed,
    };
  }

  const settingsCardMatch = /^NEXUS-PASS-NX-0*(\d+)-VN$/i.exec(trimmed);
  if (settingsCardMatch && Number(settingsCardMatch[1]) > 0) {
    return {
      userId: Number(settingsCardMatch[1]),
      membershipId: null,
      bookingId: null,
      email: null,
      raw: trimmed,
    };
  }

  const passMatch = /^NEXUS-PASS-(\d+)$/i.exec(trimmed);
  if (passMatch) {
    return { userId: Number(passMatch[1]), membershipId: null, bookingId: null, email: null, raw: trimmed };
  }

  const dashEmailMatch = /^NEXUS-(\d+)-([^\s]+@[^\s]+)$/i.exec(trimmed);
  if (dashEmailMatch) {
    return { userId: Number(dashEmailMatch[1]), membershipId: null, bookingId: null, email: dashEmailMatch[2], raw: trimmed };
  }

  const idMatch = /^#?(\d+)$/.exec(trimmed);
  if (idMatch && Number(idMatch[1]) > 0) {
    return { userId: Number(idMatch[1]), membershipId: null, bookingId: null, email: null, raw: trimmed };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { userId: null, membershipId: null, bookingId: null, email: trimmed, raw: trimmed };
  }

  return null;
}
