import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVnInput, formatVnInput, maskVnInput, vnDateKey, addDaysKey } from './vnTime.js';

test('typed Vietnamese dates and times turn into ISO values', () => {
  assert.equal(parseVnInput('06/12/2026', 'date'), '2026-12-06');
  assert.equal(parseVnInput('31/02/2026', 'date'), null);
  assert.equal(parseVnInput('06/12/2026 19:15', 'datetime-local'), '2026-12-06T19:15');
  assert.equal(parseVnInput('7:05', 'time'), '07:05');
  assert.equal(parseVnInput('', 'date'), '');
  assert.equal(formatVnInput('2026-12-06', 'date'), '06/12/2026');
  assert.equal(formatVnInput('2026-12-06T19:15:00', 'datetime-local'), '06/12/2026 19:15');
  assert.equal(maskVnInput('06122026', 'date'), '06/12/2026');
  assert.equal(maskVnInput('061220261915', 'datetime-local'), '06/12/2026 19:15');
});

test('today is the Vietnam calendar day, not the UTC one', () => {
  assert.equal(vnDateKey(new Date('2026-11-05T18:30:00Z')), '2026-11-06');
  assert.equal(addDaysKey('2026-12-31', 1), '2027-01-01');
});
