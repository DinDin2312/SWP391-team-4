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

  // Explicit category types always win over loose keyword matches inside class/package names.
  if (type === 'PROMOTION' || type === 'ANNOUNCEMENT') {
    return prefs.clubPromotions === true;
  }
  if (type === 'COACH' || type === 'WORKOUT' || type === 'WORKOUT_FEEDBACK') {
    return prefs.coachFeedback !== false;
  }
  if (type === 'BOOKING' || type === 'SCHEDULE') {
    return prefs.workoutReminder !== false;
  }
  if (type === 'MEMBERSHIP' || type === 'PAYMENT') {
    return prefs.membershipExpiry !== false;
  }
  if (type === 'SUPPORT' || type === 'SUPPORT_REVOKED' || type === 'URGENT') {
    return true;
  }

  // Fallback keyword classification only for generic SYSTEM notifications
  if (
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

  if (
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

  if (
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

  if (
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

  return true;
}

/**
 * Extract numeric invoice id from notification title or message (e.g. "#715" or "#INV-000715").
 */
export function extractInvoiceIdFromNotification(notification) {
  if (!notification) return null;
  const raw = `${notification.title || ''} ${notification.message || ''}`;
  const match = raw.match(/#(?:INV-)?0*(\d+)/i) || raw.match(/invoice\s+#?0*(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Format bilingual or raw notification title cleanly according to active UI language ("vi" | "en").
 */
export function formatMemberNotificationTitle(title, lang = 'vi') {
  if (!title) return '';
  const clean = String(title).trim();

  const payMatch = clean.match(/^Thanh toán thành công \/ Payment Successful #(\d+)$/i);
  if (payMatch) {
    const code = `#INV-${payMatch[1].padStart(6, '0')}`;
    return lang === 'vi'
      ? `Thanh toán thành công — Hóa đơn ${code}`
      : `Payment Successful — Invoice ${code}`;
  }

  const slashIdx = clean.indexOf(' / ');
  if (slashIdx !== -1) {
    const viPart = clean.slice(0, slashIdx).trim();
    const enPart = clean.slice(slashIdx + 3).trim();
    return lang === 'vi' ? viPart : enPart;
  }

  return clean;
}

/**
 * Parse notification body into structured friendly parts localized cleanly in VI/EN.
 */
export function parseMemberNotificationBody(message, lang = 'vi') {
  if (!message) {
    return { lead: '', details: [], bullets: [], outro: '' };
  }

  let text = String(message).trim();
  const legacyCompleteMatch = text.match(/^Your invoice (\d+) is complete\.$/i);
  if (legacyCompleteMatch) {
    const code = `#INV-${legacyCompleteMatch[1].padStart(6, '0')}`;
    return {
      lead: lang === 'vi'
        ? `Hóa đơn ${code} đã thanh toán thành công. Bấm "Xem hóa đơn" bên dưới để xem chi tiết giao dịch.`
        : `Invoice ${code} has been paid successfully. Click "View Invoices" below to inspect transaction details.`,
      details: [],
      bullets: [],
      outro: ''
    };
  }

  // Normalize brand & mixed Vietnamese/English phrasing consistently
  text = text
    .replace(/Sports Center!/gi, 'NEXUS Sports Lab!')
    .replace(/Sports Center/gi, 'NEXUS Sports Lab')
    .replace(/Hóa đơn #(\d+)\b/gi, (_, num) =>
      lang === 'vi'
        ? `Hóa đơn #INV-${num.padStart(6, '0')}`
        : `Invoice #INV-${num.padStart(6, '0')}`
    );

  if (lang === 'vi') {
    text = text
      .replace(/trong My Schedule/gi, 'trong mục Lịch của tôi')
      .replace(/mục Package Benefits/gi, 'mục Gói hội viên của tôi');
  } else {
    text = text
      .replace(/đã thanh toán thành công\./gi, 'has been paid successfully.')
      .replace(/• Dịch vụ:/gi, '• Services:')
      .replace(/• Số tiền:/gi, '• Amount:')
      .replace(/Cảm ơn bạn đã lựa chọn NEXUS Sports Lab!/gi, 'Thank you for choosing NEXUS Sports Lab!')
      .replace(/Bạn đã thanh toán và đăng ký thành công khóa học:/gi, 'Payment confirmed! Enrolled in course:')
      .replace(/Bạn đã thanh toán và đăng ký thành công (\d+) khóa học:/gi, 'Payment confirmed! Enrolled in $1 courses:')
      .replace(/Vui lòng kiểm tra (?:chi tiết|lịch học) trong (?:mục )?(?:Lịch của tôi|My Schedule)\./gi, 'Check your upcoming sessions in My Schedule.');
  }

  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  const details = [];
  const bullets = [];
  const prose = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed.startsWith('• ')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const label = trimmed.slice(2, colonIdx).trim();
        const value = trimmed.slice(colonIdx + 1).trim();
        details.push({ label, value, items: [] });
        continue;
      }
    }
    if (trimmed.startsWith('- ')) {
      const itemText = trimmed.slice(2).trim();
      if (details.length > 0 && !details[details.length - 1].value) {
        details[details.length - 1].items.push(itemText);
      } else {
        bullets.push(itemText);
      }
      continue;
    }
    prose.push(trimmed);
  }

  const lead = prose[0] || '';
  const outro = prose.length > 1 ? prose.slice(1).join(' ') : '';
  return { lead, details, bullets, outro };
}

/**
 * Friendly payment method label for invoice header display.
 */
export function formatPaymentMethodLabel(method, lang = 'vi') {
  const upper = String(method || '').trim().toUpperCase();
  if (!upper) return lang === 'vi' ? 'Chuyển khoản ngân hàng' : 'Bank Transfer';
  if (upper === 'PAYOS' || upper === 'VIETQR') return lang === 'vi' ? 'PayOS / Chuyển khoản QR' : 'PayOS / Bank QR';
  if (upper === 'VNPAY') return 'VNPay';
  if (upper === 'MOMO') return 'MoMo';
  if (upper === 'CASH') return lang === 'vi' ? 'Tiền mặt tại quầy' : 'Cash at Front Desk';
  return method;
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
