import test from 'node:test';
import assert from 'node:assert/strict';
import { describe, groupByDay, tidy } from './auditUtils.js';

test('audit rows read as short sentences', () => {
  const row = describe({ action: 'UPDATE', entityType: 'SCHEDULE', targetName: 'Yoga A', details: '2026-11-06T19:00 → 2026-11-07T19:00' });
  assert.equal(row.verb, 'changed a session of'); assert.equal(row.target, 'Yoga A'); assert.equal(row.detail, '06/11 19:00 → 07/11 19:00'); assert.equal(row.sensitive, false);
  assert.equal(describe({ action: 'DELETE', entityType: 'PACKAGES', entityId: 4 }).target, '#4');
  assert.equal(describe({ action: 'DELETE', entityType: 'PACKAGES' }).sensitive, true);
  assert.equal(describe({ action: 'UPDATE_IMAGE', entityType: 'ROOM', targetName: 'P1', details: 'x.png' }).detail, '');
  assert.ok(describe({ action: 'ODD', entityType: 'THING' }).fallback.includes('odd'));
  assert.equal(tidy(null), '');
});

test('entries group by calendar day in order', () => {
  const groups = groupByDay([{ at: '2026-11-06T10:00' }, { at: '2026-11-06T09:00' }, { at: '2026-11-05T22:00' }]);
  assert.deepEqual(groups.map(g => [g.day, g.items.length]), [['2026-11-06', 2], ['2026-11-05', 1]]);
});
