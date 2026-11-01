import test from 'node:test';
import assert from 'node:assert/strict';
import { packageBookingOptions } from './packageBookingOptions.js';

test('membership packages never offer course booking options because courses are paid separately', () => {
  const course = {
    subjectId: 2,
    totalSessions: 4,
    nextSessionTime: '2026-10-10T08:00:00',
    lastSessionTime: '2026-10-20T09:00:00'
  };
  const pkg = {
    membershipId: 1,
    packageName: 'Gym Access 1 Month',
    status: 'ACTIVE',
    startDate: '2026-10-01',
    endDate: '2026-10-30'
  };
  assert.deepEqual(packageBookingOptions([pkg], course, '2026-10-09'), []);
});
