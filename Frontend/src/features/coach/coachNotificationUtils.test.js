import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterNotifications,
  getUnreadCount,
  formatNotificationTime,
  getNotificationMeta,
  getNotificationAction,
  isNotificationAllowedByPreferences,
  getSavedCoachPreferences
} from './coachNotificationUtils.js';

test('isNotificationAllowedByPreferences: respects coach preference toggles', () => {
  assert.equal(isNotificationAllowedByPreferences(null), false);

  const bookingNotif = { type: 'BOOKING', title: 'Học viên mới đăng ký lớp' };
  const attendanceNotif = { type: 'SYSTEM', title: 'Nhắc nhở điểm danh ca học' };
  const assessmentNotif = { type: 'SYSTEM', title: 'Đánh giá tiến độ học viên' };
  const systemNotif = { type: 'SYSTEM', title: 'Cập nhật mật khẩu thành công' };
  const genericNotif = { type: 'OTHER', title: 'General news' };

  // All enabled
  const allOn = {
    scheduleReminders: true,
    attendanceAlerts: true,
    assessmentReminders: true,
    systemNotices: true
  };
  assert.equal(isNotificationAllowedByPreferences(bookingNotif, allOn), true);
  assert.equal(isNotificationAllowedByPreferences(attendanceNotif, allOn), true);
  assert.equal(isNotificationAllowedByPreferences(assessmentNotif, allOn), true);
  assert.equal(isNotificationAllowedByPreferences(systemNotif, allOn), true);
  assert.equal(isNotificationAllowedByPreferences(genericNotif, allOn), true);

  // Turn off schedule reminders -> booking disabled
  assert.equal(isNotificationAllowedByPreferences(bookingNotif, { ...allOn, scheduleReminders: false }), false);

  // Turn off attendance alerts -> attendance disabled
  assert.equal(isNotificationAllowedByPreferences(attendanceNotif, { ...allOn, attendanceAlerts: false }), false);

  // Turn off assessment reminders -> assessment disabled
  assert.equal(isNotificationAllowedByPreferences(assessmentNotif, { ...allOn, assessmentReminders: false }), false);

  // Turn off system notices -> system disabled
  assert.equal(isNotificationAllowedByPreferences(systemNotif, { ...allOn, systemNotices: false }), false);
});

test('getSavedCoachPreferences: returns defaults when storage is empty or mocked', () => {
  const prefs = getSavedCoachPreferences();
  assert.equal(prefs.scheduleReminders, true);
  assert.equal(prefs.attendanceAlerts, true);
  assert.equal(prefs.assessmentReminders, true);
  assert.equal(prefs.systemNotices, true);

  // Mock localStorage present
  globalThis.localStorage = {
    getItem: (key) => JSON.stringify({ scheduleReminders: false, attendanceAlerts: true, assessmentReminders: true, systemNotices: true })
  };
  const parsed = getSavedCoachPreferences();
  assert.equal(parsed.scheduleReminders, false);

  // Mock localStorage throwing error
  globalThis.localStorage = {
    getItem: () => { throw new Error('fail'); }
  };
  const fallback = getSavedCoachPreferences();
  assert.equal(fallback.scheduleReminders, true);

  delete globalThis.localStorage;
});

test('filterNotifications: filters accurately by category and preferences', () => {
  const notifs = [
    { id: 1, type: 'BOOKING', title: 'New trainee', isRead: false },
    { id: 2, type: 'SYSTEM', title: 'Profile updated', isRead: true },
    { id: 3, type: 'CLASS', title: 'Schedule moved', isRead: false },
    { id: 4, type: 'PAYMENT', title: 'Payment info', isRead: false },
    { id: 5, type: 'SYSTEM', title: 'Đánh giá tiến độ học viên', isRead: false }
  ];

  assert.equal(filterNotifications(null, 'ALL').length, 0);
  assert.equal(filterNotifications(notifs, 'ALL').length, 5);

  const bookings = filterNotifications(notifs, 'BOOKING');
  assert.equal(bookings.length, 2);
  assert.equal(bookings[0].id, 1);
  assert.equal(bookings[1].id, 3);

  const scheduleFilter = filterNotifications(notifs, 'SCHEDULE');
  assert.equal(scheduleFilter.length, 2);

  const trainees = filterNotifications(notifs, 'TRAINEES');
  assert.equal(trainees.length, 2);
  assert.equal(trainees[0].id, 1); // "New trainee"
  assert.equal(trainees[1].id, 5); // "Đánh giá tiến độ học viên"

  const system = filterNotifications(notifs, 'SYSTEM');
  assert.equal(system.length, 3);
  assert.equal(system[0].id, 2);
  assert.equal(system[1].id, 4);

  const unknown = filterNotifications(notifs, 'UNKNOWN_FILTER');
  assert.equal(unknown.length, 5);

  // When scheduleReminders is false, bookings are filtered out completely
  const withoutBookings = filterNotifications(notifs, 'ALL', { scheduleReminders: false });
  assert.equal(withoutBookings.length, 3);
  assert.equal(withoutBookings.some(n => n.type === 'BOOKING' || n.type === 'CLASS'), false);
});

test('getUnreadCount: counts unread items excluding blocked categories', () => {
  assert.equal(getUnreadCount(null), 0);
  assert.equal(getUnreadCount([]), 0);

  const notifs = [
    { id: 1, type: 'BOOKING', title: 'New trainee', isRead: false },
    { id: 2, type: 'BOOKING', title: 'Class cancelled', isRead: false },
    { id: 3, type: 'SYSTEM', title: 'Profile updated', isRead: true },
    { id: 4, type: 'SYSTEM', title: 'Security notice', isRead: false }
  ];

  // All enabled: id 1, 2, 4 are unread -> 3
  assert.equal(getUnreadCount(notifs), 3);

  // If coach turned off scheduleReminders: only id 4 is unread -> 1
  assert.equal(getUnreadCount(notifs, { scheduleReminders: false }), 1);
});

test('formatNotificationTime: formats relative times correctly', () => {
  assert.equal(formatNotificationTime(null), '');
  assert.equal(formatNotificationTime('invalid-date'), '');

  const now = new Date();
  
  // Just now
  const justNow = new Date(now.getTime() - 15 * 1000).toISOString();
  assert.equal(formatNotificationTime(justNow, 'en'), 'Just now');
  assert.equal(formatNotificationTime(justNow, 'vi'), 'Vừa xong');

  // Minutes ago
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  assert.equal(formatNotificationTime(fiveMinAgo, 'en'), '5m ago');
  assert.equal(formatNotificationTime(fiveMinAgo, 'vi'), '5 phút trước');

  // Hours ago
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
  assert.equal(formatNotificationTime(twoHoursAgo, 'en'), '2h ago');
  assert.equal(formatNotificationTime(twoHoursAgo, 'vi'), '2 giờ trước');

  // Days ago (older than 24h)
  const pastDate = new Date('2026-05-15T08:30:00Z').toISOString();
  const formatted = formatNotificationTime(pastDate, 'en');
  assert.ok(formatted.includes('15/05/2026') || formatted.includes('2026'));
});

test('getNotificationMeta: returns appropriate style descriptors', () => {
  const bookingMeta = getNotificationMeta('BOOKING');
  assert.equal(bookingMeta.badgeColor, 'blue');
  assert.equal(bookingMeta.label, 'Class & Schedule');

  const paymentMeta = getNotificationMeta('PAYMENT');
  assert.equal(paymentMeta.badgeColor, 'emerald');
  assert.equal(paymentMeta.label, 'Payment');

  const workoutMeta = getNotificationMeta('WORKOUT');
  assert.equal(workoutMeta.badgeColor, 'amber');
  assert.equal(workoutMeta.label, 'Workout & Training');
  assert.equal(workoutMeta.iconType, 'workout');

  const systemMeta = getNotificationMeta('SYSTEM');
  assert.equal(systemMeta.badgeColor, 'slate');
  assert.equal(systemMeta.label, 'System');

  const defaultMeta = getNotificationMeta(null);
  assert.equal(defaultMeta.badgeColor, 'slate');
});

test('getNotificationAction: returns contextual routes and action labels', () => {
  assert.equal(getNotificationAction(null), null);

  // Trainee & Attendance
  const traineeAction = getNotificationAction({ title: 'Học viên Mai Tiến Dũng đăng ký lớp' });
  assert.equal(traineeAction.path, '/coach/students');
  assert.equal(traineeAction.iconType, 'trainee');

  // Workout & Assessment
  const workoutAction = getNotificationAction({ title: 'Kế hoạch bài tập mới cho học viên' });
  assert.equal(workoutAction.path, '/coach/workouts');
  assert.equal(workoutAction.iconType, 'workout');

  // Class & Schedule
  const classAction = getNotificationAction({ type: 'BOOKING', title: 'Lịch dạy lớp Yoga sáng' });
  assert.equal(classAction.path, '/coach/schedule');
  assert.equal(classAction.iconType, 'schedule');

  // System & Settings fallback
  const sysAction = getNotificationAction({ type: 'SYSTEM', title: 'Đổi mật khẩu thành công' });
  assert.equal(sysAction.path, '/coach/settings');
  assert.equal(sysAction.iconType, 'settings');
});
