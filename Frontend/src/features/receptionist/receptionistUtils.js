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
