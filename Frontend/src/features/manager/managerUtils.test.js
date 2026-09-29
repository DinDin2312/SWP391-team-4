import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDate, localDateTime, initialForm, reportCsv } from './managerUtils.js';

test('month boundary uses local day, never previous UTC day', () => {
  assert.equal(isoDate(new Date(2026, 8, 1)), '2026-09-01');
  assert.equal(isoDate(new Date(2026, 9, 0)), '2026-09-30');
});
test('local SQL datetime retains the selected hour', () => {
  assert.equal(localDateTime('2026-10-01T09:30:00'), '2026-10-01T09:30');
  assert.equal(localDateTime('2026-10-01 09:30:00'), '2026-10-01T09:30');
});
test('create forms submit defaults without requiring a select change', () => {
  assert.equal(initialForm('user').status, 'ACTIVE');
  assert.equal(initialForm('class').status, 'ACTIVE');
  assert.equal(initialForm('schedule').status, 'SCHEDULED');
  assert.equal(initialForm('package').packageType, 'GYM_ACCESS');
  assert.equal(initialForm('user', { status: 'INACTIVE' }).status, 'INACTIVE');
});
test('CSV preserves Unicode text and neutralizes spreadsheet formulas', () => {
  const csv = reportCsv({ summary: { revenue: 500000 }, classOccupancy: [{ label: '=1+1,"Yoga"', value: 2, capacity: 10 }] });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=1+1,""Yoga"""'));
  assert.ok(csv.includes('"500000"'));
});
