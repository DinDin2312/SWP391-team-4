import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isoDate, localDateTime, initialForm, apiError, reportCsv } from './managerUtils.js';

test('month boundary uses local day, never previous UTC day', () => {
  assert.equal(isoDate(new Date(2026, 8, 1)), '2026-09-01');
  assert.equal(isoDate(new Date(2026, 9, 0)), '2026-09-30');
});
test('local SQL datetime retains the selected hour and converts explicit timezone strings', () => {
  assert.equal(localDateTime(''), '');
  assert.equal(localDateTime('2026-10-01T09:30:00'), '2026-10-01T09:30');
  assert.equal(localDateTime('2026-10-01 09:30:00'), '2026-10-01T09:30');
  assert.match(localDateTime('2026-10-01T09:30:00Z'), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
});
test('create forms submit defaults without requiring a select change', () => {
  assert.equal(initialForm('user').status, 'ACTIVE');
  assert.equal(initialForm('class').status, 'ACTIVE');
  assert.equal(initialForm('schedule').status, 'SCHEDULED');
  assert.equal(initialForm('package').packageType, 'GYM_ACCESS');
  assert.equal(initialForm('user', { status: 'INACTIVE' }).status, 'INACTIVE');
});
test('apiError formats field validation maps, server messages and fallback text', () => {
  assert.equal(
    apiError({ response: { data: { errors: { fullName: 'Required', customField: 'Invalid' } } } }),
    'Full name: Required; customField: Invalid'
  );
  assert.equal(apiError({ response: { data: { message: 'Duplicate email' } } }), 'Duplicate email');
  assert.equal(apiError({}), 'Unable to save changes.');
});
test('CSV preserves Unicode text and neutralizes spreadsheet formulas', () => {
  const csv = reportCsv({
    summary: { revenue: 500000 },
    revenueByDay: [{ label: '2026-10-01', value: 250000 }],
    classOccupancy: [{ label: '=1+1,"Yoga"', value: 2, capacity: 10 }],
    memberships: [{ label: '@SUM(A1:A3)', value: 7 }],
  });
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=1+1,""Yoga"""'));
  assert.ok(csv.includes('"500000"'));
  assert.ok(csv.includes('"\'@SUM(A1:A3)","7"'));
});

test('report export identifies the date basis of member growth and booking statuses', () => {
  const csv = reportCsv({
    memberGrowth: { newMembers: 2, unknownCreationDates: 4 },
    bookingStatuses: [{ status: 'PENDING', value: 7 }],
  });
  assert.ok(csv.includes('"New member accounts (account creation date)","2"'));
  assert.ok(csv.includes('"Members with unknown creation date (excluded)","4"'));
  assert.ok(csv.includes('"Booking status (booking creation date)","Count"'));
  assert.ok(csv.includes('"PENDING","7"'));
});
