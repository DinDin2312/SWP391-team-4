// Turns raw audit rows into short sentences a manager can scan.
const ENTITY = { CLASSES: 'CLASS', ROOMS: 'ROOM', SUBJECTS: 'SUBJECT', PACKAGES: 'PACKAGE', USERS: 'USER' };
export const entityKey = value => ENTITY[String(value || '').toUpperCase()] || String(value || '').toUpperCase();

const VERBS = {
  'SCHEDULE/CREATE': 'added a session to', 'SCHEDULE/UPDATE': 'changed a session of', 'SCHEDULE/CANCEL': 'cancelled a session of',
  'SCHEDULE/ENROLL': 'booked class members into a session of',
  'CLASS/CREATE': 'created class', 'CLASS/UPDATE': 'edited class', 'CLASS/DEACTIVATE': 'deactivated class',
  'CLASS/SCHEDULE_COURSE': 'scheduled the course of', 'CLASS/CREATE_SERIES': 'added repeating sessions to',
  'ROOM/CREATE': 'added room', 'ROOM/UPDATE': 'edited room', 'SUBJECT/CREATE': 'added subject', 'SUBJECT/UPDATE': 'edited subject',
  'PACKAGE/CREATE': 'created package', 'PACKAGE/UPDATE': 'edited package', 'PACKAGE/DELETE': 'deleted package',
  'USER/CREATE': 'created account', 'USER/UPDATE': 'edited account', 'USER/DELETE': 'deleted account', 'USER/STATUS_CHANGE': 'changed the status of account',
  'USER/UPDATE_AVATAR': 'changed the photo of',
  'SCHEDULE_POLICY/UPDATE': 'changed the opening hours',
  'INVOICE/CHECKOUT_CANCELLED': 'cancelled a checkout', 'INVOICE/PAYMENT_REVIEW': 'flagged a payment for review',
};
const IMAGE = { UPDATE_IMAGE: 'changed the photo of', REMOVE_IMAGE: 'removed the photo of' };
const SENSITIVE = new Set(['DELETE', 'DEACTIVATE', 'CANCEL', 'STATUS_CHANGE', 'PAYMENT_REVIEW', 'REFUND']);

// "2026-11-06T19:15" -> "06/11 19:15" so older entries read like new ones.
export const tidy = text => String(text ?? '').replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/g, '$3/$2 $4:$5').replace(/ \/ SCHEDULED$/, '').replace(/(\d{2}\/\d{2}) (\d{2}:\d{2}) - \1 /, '$1 $2 - ');

export function describe(entry) {
  const kind = entityKey(entry.entityType), action = String(entry.action || '');
  const verb = VERBS[`${kind}/${action}`] || IMAGE[action] || null;
  const target = entry.targetName || (entry.entityId ? `#${entry.entityId}` : '');
  let detail = tidy(entry.details);
  if (IMAGE[action] || action === 'UPDATE_AVATAR' || detail === entry.targetName) detail = '';
  if (kind === 'SCHEDULE' && entry.sessionTime && !/\d{2}\/\d{2}/.test(detail)) detail = entry.sessionTime;
  if (/^Policy\[/.test(detail)) detail = detail.replace(/^Policy\[|\]$/g, '').replace(/opensAt=|closesAt=|breakMinutes=/g, '');
  return { verb, fallback: verb ? null : `${action.toLowerCase().replace(/_/g, ' ')} ${kind.toLowerCase()}`, target: kind === 'SCHEDULE_POLICY' ? '' : target, detail, sensitive: SENSITIVE.has(action) || /\bprice\b|\brole\b/i.test(entry.details || '') };
}

export function groupByDay(entries) {
  const groups = [];
  for (const entry of entries) {
    const day = String(entry.at || '').slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(entry); else groups.push({ day, items: [entry] });
  }
  return groups;
}
