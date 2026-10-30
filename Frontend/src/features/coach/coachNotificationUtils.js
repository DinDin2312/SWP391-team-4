/**
 * Coach Notification Utilities
 * Pure helper functions for filtering, counting, formatting,
 * and enforcing Coach Notification Preferences.
 */

export function getSavedCoachPreferences() {
  if (typeof localStorage === 'undefined') {
    return {
      scheduleReminders: true,
      attendanceAlerts: true,
      assessmentReminders: true,
      systemNotices: true
    };
  }
  try {
    const raw = localStorage.getItem('coach_notification_preferences');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    scheduleReminders: true,
    attendanceAlerts: true,
    assessmentReminders: true,
    systemNotices: true
  };
}

export function isNotificationAllowedByPreferences(notification, preferences = null) {
  if (!notification) return false;
  const prefs = preferences || {
    scheduleReminders: true,
    attendanceAlerts: true,
    assessmentReminders: true,
    systemNotices: true
  };

  const type = (notification.type || '').toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

  // 1. Attendance & Check-in Alerts
  if (
    text.includes('điểm danh') ||
    text.includes('attendance') ||
    text.includes('check-in') ||
    text.includes('lễ tân') ||
    text.includes('front desk')
  ) {
    return prefs.attendanceAlerts !== false;
  }

  // 2. Student Assessment Reminders
  if (
    text.includes('đánh giá') ||
    text.includes('assessment') ||
    text.includes('tiến độ')
  ) {
    return prefs.assessmentReminders !== false;
  }

  // 3. Class Schedule & Trainee Enrolment Reminders
  if (
    type === 'BOOKING' ||
    type === 'CLASS' ||
    text.includes('lớp') ||
    text.includes('class') ||
    text.includes('đăng ký') ||
    text.includes('hủy') ||
    text.includes('trainee') ||
    text.includes('học viên') ||
    text.includes('schedule')
  ) {
    return prefs.scheduleReminders !== false;
  }

  // 4. System & Security Notices
  if (
    type === 'SYSTEM' ||
    type === 'PAYMENT' ||
    text.includes('mật khẩu') ||
    text.includes('password') ||
    text.includes('email') ||
    text.includes('hồ sơ') ||
    text.includes('profile') ||
    text.includes('chuyên môn') ||
    text.includes('bảo mật')
  ) {
    return prefs.systemNotices !== false;
  }

  return true;
}

export function filterNotifications(notifications, filter = 'ALL', preferences = null) {
  if (!Array.isArray(notifications)) return [];

  // Filter out notifications disabled by the coach in settings
  const allowed = notifications.filter(n => isNotificationAllowedByPreferences(n, preferences));

  if (filter === 'ALL') return allowed;

  if (filter === 'BOOKING') {
    return allowed.filter(n => n.type === 'BOOKING' || n.type === 'CLASS');
  }

  if (filter === 'SYSTEM') {
    return allowed.filter(n => n.type === 'SYSTEM' || n.type === 'PAYMENT' || !n.type);
  }

  return allowed;
}

export function getUnreadCount(notifications, preferences = null) {
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter(n => {
    if (!isNotificationAllowedByPreferences(n, preferences)) return false;
    // If either isRead or read is explicitly true, consider it read. Otherwise unread.
    if (n.isRead === true || n.read === true) return false;
    return true;
  }).length;
}

export function formatNotificationTime(dateString, locale = 'vi') {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) {
    return locale === 'vi' ? 'Vừa xong' : 'Just now';
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return locale === 'vi' ? `${diffMin} phút trước` : `${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return locale === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
  }

  // Older than 24 hours: formatted DD/MM/YYYY HH:mm
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function getNotificationMeta(type) {
  switch (type) {
    case 'BOOKING':
    case 'CLASS':
      return {
        badgeColor: 'blue',
        label: 'Class & Schedule',
        iconType: 'calendar'
      };
    case 'PAYMENT':
      return {
        badgeColor: 'emerald',
        label: 'Payment',
        iconType: 'receipt'
      };
    case 'SYSTEM':
    default:
      return {
        badgeColor: 'slate',
        label: 'System',
        iconType: 'shield'
      };
  }
}
