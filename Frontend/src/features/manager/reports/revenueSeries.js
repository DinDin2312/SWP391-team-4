import { isoDate } from '../managerUtils.js';

export const COLUMN_DAY_LIMIT = 62;
const MAX_FILLED_DAYS = 400;

// SQL DATE may arrive as "yyyy-mm-dd", a datetime string, or an epoch number depending on the serializer.
// A timestamp with a zone (e.g. "2026-10-03T17:00:00.000Z" for local midnight 04/10 in UTC+7) is converted to the local day.
export function dayKey(label) {
  if (typeof label === 'number') return isoDate(new Date(label));
  const text = String(label || '');
  if (/T.*(Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) return isoDate(date);
  }
  return text.slice(0, 10);
}

// Every calendar day in the applied range, so gaps read as real zero-revenue days on a true time axis.
export function fillDays(rows, from, to) {
  const totals = new Map();
  rows.forEach(row => { const key = dayKey(row.label); totals.set(key, (totals.get(key) || 0) + Number(row.value || 0)); });
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T00:00:00`) : null;
  const span = start && end ? Math.round((end - start) / 86400000) + 1 : 0;
  if (!span || span < 1 || span > MAX_FILLED_DAYS) return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
  return Array.from({ length: span }, (_, index) => {
    const day = new Date(start); day.setDate(start.getDate() + index);
    const date = isoDate(day);
    return { date, value: totals.get(date) || 0 };
  });
}

// Long ranges are summed into Monday-start weeks: ~13 clean columns read better than 90 spiky days.
export function bucketDays(days) {
  if (days.length <= COLUMN_DAY_LIMIT) return { unit: 'day', buckets: days.map(day => ({ ...day, end: day.date })) };
  const buckets = [];
  days.forEach(day => {
    const weekday = (new Date(`${day.date}T00:00:00`).getDay() + 6) % 7;
    const last = buckets[buckets.length - 1];
    if (!last || weekday === 0) buckets.push({ date: day.date, end: day.date, value: day.value });
    else { last.end = day.date; last.value += day.value; }
  });
  return { unit: 'week', buckets };
}

// The previous period has the same number of days. Sum it into the same bucket sizes as the current series,
// so point i of the comparison line always lines up with point i of this period.
export function alignPrevious(buckets, previousDays) {
  if (!previousDays?.length || !buckets.length) return null;
  let cursor = 0;
  return buckets.map(bucket => {
    const size = Math.round((new Date(`${bucket.end}T00:00:00`) - new Date(`${bucket.date}T00:00:00`)) / 86400000) + 1;
    const slice = previousDays.slice(cursor, cursor + size);
    cursor += size;
    if (!slice.length) return null;
    return { date: slice[0].date, end: slice[slice.length - 1].date, value: slice.reduce((sum, day) => sum + day.value, 0) };
  });
}
