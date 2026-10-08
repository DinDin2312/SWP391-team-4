import { locale } from '../i18n/languageStore.js';
// Format presentation only. API dates and datetime-local values keep their original contracts.
export const formatMoney = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(Number(value || 0));

function asDate(value) {
  if (!value) return null;
  // SQL LocalDateTime has no timezone: parse it as wall-clock time, never append Z.
  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T') + (/^\d{4}-\d{2}-\d{2}$/.test(value) ? 'T00:00:00' : ''));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = asDate(value);
  return date ? new Intl.DateTimeFormat(locale(), {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(date) : '—';
}

export function formatTime(value) {
  const date = asDate(value);
  return date ? new Intl.DateTimeFormat(locale(), {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date) : '—';
}

export const formatDateTime = (value) => asDate(value) ? `${formatDate(value)} · ${formatTime(value)}` : '—';
