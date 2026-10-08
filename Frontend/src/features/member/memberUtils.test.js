import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAttendanceStats, filterBookingsByStatus, sortBookingsByTime } from './memberUtils.js';

test('calculateAttendanceStats: calculates correctly with mixed attendance', () => {
  const bookings = [
    { attendanceStatus: 'PRESENT' },
    { attendanceStatus: 'PRESENT' },
    { attendanceStatus: 'ABSENT' },
    { attendanceStatus: 'NOT_YET' },
    { attendanceStatus: null }
  ];
  
  const stats = calculateAttendanceStats(bookings);
  
  assert.equal(stats.presentCount, 2);
  assert.equal(stats.absentCount, 1);
  // (2 / 3) * 100 = 66.666... rounded to 67
  assert.equal(stats.attendanceRate, 67);
});

test('calculateAttendanceStats: handles empty data gracefully', () => {
  const statsEmpty = calculateAttendanceStats([]);
  assert.equal(statsEmpty.attendanceRate, 0);

  const statsNull = calculateAttendanceStats(null);
  assert.equal(statsNull.attendanceRate, 0);
});

test('filterBookingsByStatus: filters correctly', () => {
  const bookings = [
    { id: 1, attendanceStatus: 'PRESENT' },
    { id: 2, attendanceStatus: 'ABSENT' },
    { id: 3, attendanceStatus: 'PENDING' },
    { id: 4, attendanceStatus: null }
  ];

  assert.equal(filterBookingsByStatus(bookings, 'ALL').length, 4);
  assert.equal(filterBookingsByStatus(bookings, 'PRESENT').length, 1);
  assert.equal(filterBookingsByStatus(bookings, 'ABSENT').length, 1);
  // PENDING should match anything not PRESENT and not ABSENT
  assert.equal(filterBookingsByStatus(bookings, 'PENDING').length, 2);
});

test('sortBookingsByTime: sorts future classes ascending and past classes descending', () => {
  const now = new Date('2026-10-10T12:00:00Z').getTime();
  
  const bookings = [
    { id: 'past_old', startTime: '2026-10-01T12:00:00Z' },
    { id: 'past_recent', startTime: '2026-10-09T12:00:00Z' },
    { id: 'future_far', startTime: '2026-10-20T12:00:00Z' },
    { id: 'future_soon', startTime: '2026-10-11T12:00:00Z' },
  ];

  const sorted = sortBookingsByTime(bookings, now);
  
  // Expected order:
  // 1. future_soon (Upcoming closest)
  // 2. future_far (Upcoming later)
  // 3. past_recent (Just finished)
  // 4. past_old (Finished long time ago)
  assert.equal(sorted[0].id, 'future_soon');
  assert.equal(sorted[1].id, 'future_far');
  assert.equal(sorted[2].id, 'past_recent');
  assert.equal(sorted[3].id, 'past_old');
});
