import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendanceStats,
  filterBookingsByStatus,
  sortBookingsByTime,
  getSavedMemberNotificationPreferences,
  isMemberNotificationAllowed,
  filterMemberNotifications,
  getMemberUnreadCount
} from './memberUtils.js';

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
    { id: 4, attendanceStatus: null },
    { id: 5, attendanceStatus: 'CANCELLED' }
  ];

  assert.equal(filterBookingsByStatus(null, 'ALL').length, 0);
  assert.equal(filterBookingsByStatus(bookings, 'ALL').length, 5);
  assert.equal(filterBookingsByStatus(bookings, 'PRESENT').length, 1);
  assert.equal(filterBookingsByStatus(bookings, 'ABSENT').length, 1);
  // PENDING should match anything not PRESENT and not ABSENT
  assert.equal(filterBookingsByStatus(bookings, 'PENDING').length, 3);
  assert.equal(filterBookingsByStatus(bookings, 'CANCELLED').length, 1);
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

test('calculateAttendanceStats: treats past unmarked bookings as absent when nowTime is provided', () => {
  const now = new Date('2026-10-10T12:00:00Z').getTime();
  const bookings = [
    { attendanceStatus: 'PRESENT', startTime: '2026-10-09T08:00:00Z', endTime: '2026-10-09T09:00:00Z' },
    { attendanceStatus: 'NOT_YET', startTime: '2026-10-09T10:00:00Z', endTime: '2026-10-09T11:00:00Z' },
    { attendanceStatus: 'NOT_YET', startTime: '2026-10-11T10:00:00Z', endTime: '2026-10-11T11:00:00Z' },
    { attendanceStatus: 'ABSENT', startTime: '2026-10-08T10:00:00Z', endTime: '2026-10-08T11:00:00Z' }
  ];

  const stats = calculateAttendanceStats(bookings, now);

  assert.equal(stats.presentCount, 1);
  assert.equal(stats.absentCount, 2);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.attendanceRate, 33);
});

test('filterBookingsByStatus: filters past unmarked as absent when nowTime is provided', () => {
  const now = new Date('2026-10-10T12:00:00Z').getTime();
  const bookings = [
    { id: 1, attendanceStatus: 'PRESENT', endTime: '2026-10-09T11:00:00Z' },
    { id: 2, attendanceStatus: 'NOT_YET', endTime: '2026-10-09T11:00:00Z' },
    { id: 3, attendanceStatus: 'NOT_YET', startTime: '2026-10-12T11:00:00Z' },
    { id: 4, attendanceStatus: 'ABSENT', endTime: '2026-10-09T11:00:00Z' }
  ];

  assert.equal(filterBookingsByStatus(bookings, 'ALL', now).length, 4);
  assert.equal(filterBookingsByStatus(bookings, 'PRESENT', now).length, 1);
  assert.equal(filterBookingsByStatus(bookings, 'ABSENT', now).length, 2);
  assert.equal(filterBookingsByStatus(bookings, 'PENDING', now).length, 1);
});

test('getSavedMemberNotificationPreferences: fallback when localStorage is missing or throws', () => {
  const originalLocalStorage = globalThis.localStorage;
  try {
    delete globalThis.localStorage;
    const prefs = getSavedMemberNotificationPreferences();
    assert.equal(prefs.workoutReminder, true);
    assert.equal(prefs.membershipExpiry, true);
    assert.equal(prefs.coachFeedback, true);
    assert.equal(prefs.clubPromotions, false);

    // Mock throwing localStorage
    globalThis.localStorage = {
      getItem: () => { throw new Error('Storage disabled'); }
    };
    const prefsFromThrow = getSavedMemberNotificationPreferences();
    assert.equal(prefsFromThrow.workoutReminder, true);

    // Mock valid localStorage
    globalThis.localStorage = {
      getItem: (key) => key === 'nexus_notification_prefs' ? JSON.stringify({ workoutReminder: false, clubPromotions: true }) : null
    };
    const customPrefs = getSavedMemberNotificationPreferences();
    assert.equal(customPrefs.workoutReminder, false);
    assert.equal(customPrefs.clubPromotions, true);
  } finally {
    globalThis.localStorage = originalLocalStorage;
  }
});

test('isMemberNotificationAllowed: validates permissions correctly for all categories', () => {
  assert.equal(isMemberNotificationAllowed(null), false);
  assert.equal(isMemberNotificationAllowed(undefined), false);

  const allEnabled = {
    workoutReminder: true,
    membershipExpiry: true,
    coachFeedback: true,
    clubPromotions: true
  };
  const allDisabled = {
    workoutReminder: false,
    membershipExpiry: false,
    coachFeedback: false,
    clubPromotions: false
  };

  // 1. Promotions
  const promo1 = { type: 'PROMOTION', title: 'Giảm giá 50%', message: 'Đăng ký ngay' };
  const promo2 = { type: 'ANNOUNCEMENT', title: 'Giải đấu bơi lội', message: 'Sắp diễn ra' };
  const promo3 = { type: 'SYSTEM', title: 'Ưu đãi sinh nhật', message: 'Chúc mừng' };
  assert.equal(isMemberNotificationAllowed(promo1, allEnabled), true);
  assert.equal(isMemberNotificationAllowed(promo1, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(promo2, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(promo3, allDisabled), false);

  // 2. Coach Feedback
  const coach1 = { type: 'COACH', title: 'Nhận xét HLV', message: 'Tốt' };
  const coach2 = { type: 'WORKOUT', title: 'Giáo án mới', message: 'InBody cập nhật' };
  const coach3 = { type: 'SYSTEM', title: 'Đánh giá thể lực', message: 'Từ HLV' };
  const coach4 = { type: 'WORKOUT_FEEDBACK', title: '[Nhận xét bài tập] HLV', message: '5 ⭐' };
  assert.equal(isMemberNotificationAllowed(coach1, allEnabled), true);
  assert.equal(isMemberNotificationAllowed(coach1, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(coach2, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(coach3, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(coach4, allEnabled), true);
  assert.equal(isMemberNotificationAllowed(coach4, allDisabled), false);

  // 3. Workout Reminder
  const schedule1 = { type: 'BOOKING', title: 'Lịch tập', message: 'Đã đặt' };
  const schedule2 = { type: 'SCHEDULE', title: 'Nhắc nhở 30 phút trước giờ tập', message: 'Chuẩn bị' };
  const schedule3 = { type: 'SYSTEM', title: 'Lớp học yoga', message: 'Đăng ký thành công' };
  assert.equal(isMemberNotificationAllowed(schedule1, allEnabled), true);
  assert.equal(isMemberNotificationAllowed(schedule1, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(schedule2, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(schedule3, allDisabled), false);

  // 4. Membership Expiry & Billing
  const bill1 = { type: 'MEMBERSHIP', title: 'Gói tập sắp hết hạn', message: 'Gia hạn ngay' };
  const bill2 = { type: 'PAYMENT', title: 'Hóa đơn thanh toán', message: 'Invoice #123' };
  assert.equal(isMemberNotificationAllowed(bill1, allEnabled), true);
  assert.equal(isMemberNotificationAllowed(bill1, allDisabled), false);
  assert.equal(isMemberNotificationAllowed(bill2, allDisabled), false);

  // 5. System Security & Default
  const sys1 = { type: 'SYSTEM', title: 'Đổi mật khẩu', message: 'Thành công' };
  const sys2 = { type: 'SUPPORT', title: 'Hỗ trợ kỹ thuật', message: 'Đã giải quyết' };
  assert.equal(isMemberNotificationAllowed(sys1, allDisabled), true);
  assert.equal(isMemberNotificationAllowed(sys2, allDisabled), true);

  // Fallback without passing preferences
  assert.equal(isMemberNotificationAllowed(sys1), true);
});

test('filterMemberNotifications and getMemberUnreadCount: filters array and counts unread accurately', () => {
  assert.deepEqual(filterMemberNotifications(null), []);
  assert.equal(getMemberUnreadCount(null), 0);

  const notifs = [
    { id: 1, type: 'BOOKING', title: 'Lớp Gym', isRead: false },
    { id: 2, type: 'BOOKING', title: 'Lớp Yoga', isRead: true },
    { id: 3, type: 'PROMOTION', title: 'Khuyến mãi hè', read: false },
    { id: 4, type: 'SYSTEM', title: 'Bảo mật tài khoản', read: false }
  ];

  // Default: workoutReminder: true, clubPromotions: false
  const filtered = filterMemberNotifications(notifs);
  assert.equal(filtered.length, 3); // 1, 2, 4 (3 filtered out)

  const unreadCount = getMemberUnreadCount(notifs);
  assert.equal(unreadCount, 2); // id 1 (unread) and id 4 (unread)

  // With workoutReminder disabled
  const unreadWithWorkoutDisabled = getMemberUnreadCount(notifs, {
    workoutReminder: false,
    membershipExpiry: true,
    coachFeedback: true,
    clubPromotions: false
  });
  assert.equal(unreadWithWorkoutDisabled, 1); // only id 4
});
