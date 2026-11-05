/**
 * Calculate attendance statistics based on booking status.
 * @param {Array} bookings 
 * @param {Number|null} nowTime Optional current timestamp to treat past unmarked bookings as absent
 * @returns {Object} { presentCount, absentCount, pendingCount, totalBookings, attendanceRate }
 */
export function calculateAttendanceStats(bookings, nowTime = null) {
  if (!Array.isArray(bookings)) return { presentCount: 0, absentCount: 0, pendingCount: 0, totalBookings: 0, attendanceRate: 0 };
  
  const isPast = (b) => {
    if (!nowTime) return false;
    const t = b.endTime ? new Date(b.endTime).getTime() : (b.startTime ? new Date(b.startTime).getTime() : 0);
    return t > 0 && t < nowTime;
  };

  const presentCount = bookings.filter(b => b.attendanceStatus === "PRESENT").length;
  const absentCount = bookings.filter(b => b.attendanceStatus === "ABSENT" || (isPast(b) && b.attendanceStatus !== "PRESENT")).length;
  const pendingCount = bookings.filter(b => b.attendanceStatus !== "PRESENT" && b.attendanceStatus !== "ABSENT" && !isPast(b)).length;
  const totalCompleted = presentCount + absentCount;
  
  const attendanceRate = totalCompleted > 0 ? Math.round((presentCount / totalCompleted) * 100) : 0;
  
  return { presentCount, absentCount, pendingCount, totalBookings: bookings.length, attendanceRate };
}

/**
 * Filter bookings by their attendance status.
 * @param {Array} bookings 
 * @param {String} filterStatus "ALL", "PRESENT", "ABSENT", or "PENDING"
 * @param {Number|null} nowTime Optional current timestamp
 * @returns {Array} Filtered bookings
 */
export function filterBookingsByStatus(bookings, filterStatus, nowTime = null) {
  if (!Array.isArray(bookings)) return [];
  
  const isPast = (b) => {
    if (!nowTime) return false;
    const t = b.endTime ? new Date(b.endTime).getTime() : (b.startTime ? new Date(b.startTime).getTime() : 0);
    return t > 0 && t < nowTime;
  };

  return bookings.filter(b => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "PRESENT") return b.attendanceStatus === "PRESENT";
    if (filterStatus === "ABSENT") return b.attendanceStatus === "ABSENT" || (isPast(b) && b.attendanceStatus !== "PRESENT");
    if (filterStatus === "PENDING") {
      return b.attendanceStatus !== "PRESENT" && b.attendanceStatus !== "ABSENT" && !isPast(b);
    }
    return b.attendanceStatus === filterStatus;
  });
}

/**
 * Sorts bookings so that upcoming classes appear first (soonest to latest),
 * followed by past classes (most recent to oldest).
 * @param {Array} bookingsData 
 * @param {Number} nowTime Current timestamp
 * @returns {Array}
 */
export function sortBookingsByTime(bookingsData, nowTime) {
  if (!Array.isArray(bookingsData)) return [];

  // Lớp sắp diễn ra (Tương lai): Gần nhất xếp trước (Tăng dần)
  const futureClasses = bookingsData
    .filter(b => new Date(b.startTime).getTime() >= nowTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
  // Lớp đã học (Quá khứ): Vừa học xong xếp trước (Giảm dần)
  const pastClasses = bookingsData
    .filter(b => new Date(b.startTime).getTime() < nowTime)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
  return [...futureClasses, ...pastClasses];
}

/**
 * Retrieve saved notification preferences for Member from localStorage.
 * Defaults match Settings.jsx initial state.
 * @returns {Object}
 */
export function getSavedMemberNotificationPreferences() {
  if (typeof localStorage === 'undefined') {
    return {
      workoutReminder: true,
      membershipExpiry: true,
      coachFeedback: true,
      clubPromotions: false
    };
  }
  try {
    const raw = localStorage.getItem('nexus_notification_prefs');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    workoutReminder: true,
    membershipExpiry: true,
    coachFeedback: true,
    clubPromotions: false
  };
}

/**
 * Check if a notification is allowed to be shown based on member preferences.
 * @param {Object} notification
 * @param {Object|null} preferences
 * @returns {boolean}
 */
export function isMemberNotificationAllowed(notification, preferences = null) {
  if (!notification) return false;
  const prefs = preferences || getSavedMemberNotificationPreferences();

  const type = (notification.type || 'SYSTEM').toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

  // 1. Club news & tournament promotions
  if (
    type === 'PROMOTION' ||
    type === 'ANNOUNCEMENT' ||
    text.includes('ưu đãi') ||
    text.includes('khuyến mãi') ||
    text.includes('giải đấu') ||
    text.includes('tournament') ||
    text.includes('sự kiện') ||
    text.includes('sinh nhật') ||
    text.includes('birthday') ||
    text.includes('promotion')
  ) {
    return prefs.clubPromotions === true;
  }

  // 2. Coach feedback & workout evaluations
  if (
    type === 'COACH' ||
    type === 'WORKOUT' ||
    type === 'WORKOUT_FEEDBACK' ||
    text.includes('đánh giá') ||
    text.includes('tiến độ') ||
    text.includes('thể lực') ||
    text.includes('inbody') ||
    text.includes('giáo án') ||
    text.includes('workout plan') ||
    text.includes('feedback') ||
    text.includes('huấn luyện viên') ||
    text.includes('bài tập') ||
    text.includes('workout') ||
    text.includes('hlv') ||
    text.includes('nhận xét')
  ) {
    return prefs.coachFeedback !== false;
  }

  // 3. 30-minute workout reminder & Class schedule
  if (
    type === 'BOOKING' ||
    type === 'SCHEDULE' ||
    text.includes('lớp') ||
    text.includes('class') ||
    text.includes('buổi tập') ||
    text.includes('giờ tập') ||
    text.includes('nhắc nhở lịch') ||
    text.includes('30 phút') ||
    text.includes('schedule') ||
    text.includes('đăng ký') ||
    text.includes('hủy')
  ) {
    return prefs.workoutReminder !== false;
  }

  // 4. Membership package expiry & Billing alerts
  if (
    type === 'MEMBERSHIP' ||
    type === 'PAYMENT' ||
    text.includes('hết hạn') ||
    text.includes('gói tập') ||
    text.includes('membership') ||
    text.includes('expiry') ||
    text.includes('hóa đơn') ||
    text.includes('invoice') ||
    text.includes('thanh toán') ||
    text.includes('gia hạn') ||
    text.includes('renew')
  ) {
    return prefs.membershipExpiry !== false;
  }

  // 5. System alerts, account security, and support tickets: always allowed
  return true;
}

/**
 * Filter notification array based on member preferences.
 * @param {Array} notifications
 * @param {Object|null} preferences
 * @returns {Array}
 */
export function filterMemberNotifications(notifications, preferences = null) {
  if (!Array.isArray(notifications)) return [];
  const prefs = preferences || getSavedMemberNotificationPreferences();
  return notifications.filter(n => isMemberNotificationAllowed(n, prefs));
}

/**
 * Get count of unread notifications matching active member preferences.
 * @param {Array} notifications
 * @param {Object|null} preferences
 * @returns {number}
 */
export function getMemberUnreadCount(notifications, preferences = null) {
  if (!Array.isArray(notifications)) return 0;
  const prefs = preferences || getSavedMemberNotificationPreferences();
  return notifications.filter(n => {
    if (!isMemberNotificationAllowed(n, prefs)) return false;
    return !(n.isRead ?? n.read);
  }).length;
}
