import { t } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore';

const MAX_SLICES = 6; // named slices; the rest fold into one "Other" slice
const count = value => new Intl.NumberFormat(locale()).format(Number(value || 0));

// Percentages to one decimal that always add up to exactly 100 (largest remainder).
export function exactShares(values) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0)) return values.map(() => 0);
  const raw = values.map(value => value / total * 1000);
  const floors = raw.map(Math.floor);
  let left = 1000 - floors.reduce((sum, value) => sum + value, 0);
  raw.map((value, index) => ({ index, rest: value - floors[index] }))
    .sort((a, b) => b.rest - a.rest)
    .forEach(({ index }) => { if (left > 0) { floors[index] += 1; left -= 1; } });
  return floors.map(value => value / 10);
}

// Course revenue: one item per subject, its classes as the expandable rows.
export const subjectItems = subjects => (subjects || []).map(item => ({
  key: `s-${item.subjectId ?? 'none'}`, label: item.subject || t('No subject'), revenue: Number(item.revenue),
  registrations: Number(item.registrations || 0),
  rows: (item.classes || []).map(row => ({ key: `c-${row.classId}`, label: row.label, meta: row.coach, revenue: Number(row.revenue), registrations: Number(row.registrations || 0) })),
}));

// Package revenue: one item per package, nothing to expand.
export const packageItems = packages => (packages || []).map(item => ({
  key: `p-${item.packageId}`, label: item.label, revenue: Number(item.revenue), registrations: Number(item.registrations || 0), rows: [],
}));

export function buildSlices(items, otherLabel = 'Other subjects') {
  const sorted = [...items].filter(item => Number(item.revenue) > 0).sort((a, b) => b.revenue - a.revenue);
  const named = sorted.length > MAX_SLICES ? sorted.slice(0, MAX_SLICES - 1) : sorted;
  const rest = sorted.slice(named.length);
  const slices = named.map((item, index) => ({ ...item, slot: index + 1 }));
  if (rest.length) {
    slices.push({
      key: 'other', label: t(otherLabel), revenue: rest.reduce((sum, item) => sum + item.revenue, 0),
      registrations: rest.reduce((sum, item) => sum + item.registrations, 0), slot: 'other',
      rows: rest.map(item => ({ key: item.key, label: item.label, meta: t('{0} registrations', [count(item.registrations)]), revenue: item.revenue, registrations: item.registrations })),
    });
  }
  const shares = exactShares(slices.map(slice => slice.revenue));
  return slices.map((slice, index) => ({ ...slice, share: shares[index] }));
}
