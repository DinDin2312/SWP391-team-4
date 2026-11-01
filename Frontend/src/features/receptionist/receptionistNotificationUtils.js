/**
 * Receptionist Notification Utilities
 * Pure helper functions for filtering, counting, formatting,
 * and enforcing Front Desk Notification Preferences.
 */

export function getSavedReceptionistPreferences() {
  if (typeof localStorage === 'undefined') {
    return {
      expiringMembershipAlert: true,
      pendingInvoiceAlert: true,
      checkinSuccessBanner: true,
      shiftHandoverReminder: true,
    };
  }
  try {
    const raw = localStorage.getItem('receptionist_notification_preferences');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    expiringMembershipAlert: true,
    pendingInvoiceAlert: true,
    checkinSuccessBanner: true,
    shiftHandoverReminder: true,
  };
}

export function isNotificationAllowedByPreferences(notification, preferences = null) {
  if (!notification) return false;
  const prefs = preferences || getSavedReceptionistPreferences();

  const type = (notification.type || '').toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

  // 1. Invoices, Payments & Financial alerts
  if (
    type === 'PAYMENT' ||
    type === 'INVOICE' ||
    text.includes('hóa đơn') ||
    text.includes('invoice') ||
    text.includes('thanh toán')
  ) {
    return prefs.pendingInvoiceAlert !== false;
  }

  // 2. Check-in & Facility Attendance Alerts
  if (
    type === 'CHECKIN' ||
    text.includes('check-in') ||
    text.includes('điểm danh') ||
    text.includes('chưa qua') ||
    text.includes('lễ tân') ||
    text.includes('turnstile')
  ) {
    return prefs.checkinSuccessBanner !== false;
  }

  // 3. Expiring Membership & Packages
  if (
    type === 'MEMBERSHIP' ||
    text.includes('hết hạn') ||
    text.includes('expiring') ||
    text.includes('hạn gói') ||
    text.includes('sắp hết hạn')
  ) {
    return prefs.expiringMembershipAlert !== false;
  }

  // 4. Shift Handover & Staff Reminders
  if (
    text.includes('ca trực') ||
    text.includes('bàn giao ca') ||
    text.includes('shift')
  ) {
    return prefs.shiftHandoverReminder !== false;
  }

  return true;
}

export function filterReceptionistNotifications(
  notifications,
  filterId = 'ALL',
  preferences = null,
  searchQuery = ''
) {
  if (!Array.isArray(notifications)) return [];

  // Filter out notifications muted by front desk settings
  const allowed = notifications.filter((n) => isNotificationAllowedByPreferences(n, preferences));

  const query = (searchQuery || '').trim().toLowerCase();
  const matchesSearch = (n) => {
    if (!query) return true;
    const title = (n.title || '').toLowerCase();
    const message = (n.message || '').toLowerCase();
    return title.includes(query) || message.includes(query);
  };

  if (filterId === 'ALL') {
    return allowed.filter(matchesSearch);
  }

  return allowed.filter((n) => {
    if (!matchesSearch(n)) return false;

    const type = (n.type || '').toUpperCase();
    const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();

    switch (filterId) {
      case 'SUPPORT':
        return (
          type === 'SUPPORT' ||
          text.includes('hỗ trợ') ||
          text.includes('support') ||
          text.includes('hủy') ||
          text.includes('cancel') ||
          text.includes('refund') ||
          text.includes('hoàn tiền')
        );
      case 'CHECKIN':
        return (
          type === 'CHECKIN' ||
          text.includes('check-in') ||
          text.includes('điểm danh') ||
          text.includes('vào lớp') ||
          text.includes('attendance') ||
          text.includes('anomaly') ||
          text.includes('bất thường') ||
          text.includes('chưa qua')
        );
      case 'LOST_FOUND':
        return (
          type === 'LOST_FOUND' ||
          type === 'LOST_AND_FOUND' ||
          text.includes('thất lạc') ||
          text.includes('bỏ quên') ||
          text.includes('lost') ||
          text.includes('found') ||
          text.includes('két sắt') ||
          text.includes('lưu kho')
        );
      case 'INVOICE':
        return (
          type === 'PAYMENT' ||
          type === 'INVOICE' ||
          text.includes('hóa đơn') ||
          text.includes('invoice') ||
          text.includes('thanh toán') ||
          text.includes('payment') ||
          text.includes('gia hạn') ||
          text.includes('renew')
        );
      case 'SYSTEM':
        return (
          type === 'SYSTEM' ||
          text.includes('hệ thống') ||
          text.includes('bảo trì') ||
          text.includes('quản lý') ||
          text.includes('thông báo')
        );
      default:
        return true;
    }
  });
}

export function getReceptionistUnreadCount(notifications, preferences = null) {
  if (!Array.isArray(notifications)) return 0;
  return notifications.filter(
    (n) => isNotificationAllowedByPreferences(n, preferences) && !n.isRead && !n.read
  ).length;
}

export function formatNotificationTime(dateString, locale = 'vi') {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    const isVi = locale === 'vi';

    if (diffMinutes < 1) {
      return isVi ? 'Vừa xong' : 'Just now';
    }
    if (diffMinutes < 60) {
      return isVi ? `${diffMinutes} phút trước` : `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return isVi ? `${diffHours} giờ trước` : `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return isVi ? `${diffDays} ngày trước` : `${diffDays}d ago`;
    }
    return date.toLocaleDateString(isVi ? 'vi-VN' : 'en-US');
  } catch {
    return dateString;
  }
}

export function extractNotificationContextParams(notification) {
  if (!notification) return {};
  const fullText = `${notification.title || ''} ${notification.message || ''}`;

  const params = {};

  // 1. Extract Lost & Found Item Code: LF-YYYYMMDD-XXX
  const lfMatch = fullText.match(/LF-\d{8}-\d{3}/i);
  if (lfMatch) {
    params.itemCode = lfMatch[0].toUpperCase();
    params.keyword = lfMatch[0].toUpperCase();
  }

  // 2. Extract Invoice Code: INV-XXXXXXXX
  const invMatch = fullText.match(/INV-[\w-]+/i);
  if (invMatch) {
    params.invoiceCode = invMatch[0].toUpperCase();
    params.searchKeyword = invMatch[0].toUpperCase();
  }

  // 3. Extract Member Name: "Hội viên [Tên]" or "Member [Name]"
  const memberText = notification.message || notification.title || '';
  const memberMatch = memberText.match(/(?:hội viên|member)\s+([^#(,.\n]+)/i);
  if (memberMatch && memberMatch[1]) {
    const name = memberMatch[1].trim();
    params.memberName = name;
    if (!params.searchKeyword) params.searchKeyword = name;
    if (!params.historyKeyword) params.historyKeyword = name;
  }

  // 4. Extract Member ID: #(\d+)
  const idMatch = fullText.match(/#(\d+)/);
  if (idMatch && idMatch[1]) {
    params.memberId = Number(idMatch[1]);
  }

  return params;
}

export function getReceptionistNotificationAction(notification) {
  if (!notification) return null;
  const type = (notification.type || '').toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();
  const contextParams = extractNotificationContextParams(notification);

  // Support / cancellation request -> Support Desk
  if (
    type === 'SUPPORT' ||
    text.includes('hỗ trợ') ||
    text.includes('support') ||
    text.includes('hủy') ||
    text.includes('cancel') ||
    text.includes('refund') ||
    text.includes('hoàn tiền')
  ) {
    return {
      featureId: 'support-desk',
      label: 'Xử lý yêu cầu',
      params: {
        searchKeyword: contextParams.searchKeyword || contextParams.memberName || '',
        memberId: contextParams.memberId || null,
      },
    };
  }

  // Check-in / anomaly -> Member Check-in
  if (
    type === 'CHECKIN' ||
    text.includes('check-in') ||
    text.includes('điểm danh') ||
    text.includes('vào lớp') ||
    text.includes('anomaly') ||
    text.includes('bất thường') ||
    text.includes('chưa qua')
  ) {
    return {
      featureId: 'member-checkin',
      label: 'Xem điểm danh',
      params: {
        historyKeyword: contextParams.historyKeyword || contextParams.memberName || '',
        historyStatusFilter: 'ANOMALY',
        memberId: contextParams.memberId || null,
      },
    };
  }

  // Lost & Found -> Lost & Found
  if (
    type === 'LOST_FOUND' ||
    type === 'LOST_AND_FOUND' ||
    text.includes('thất lạc') ||
    text.includes('bỏ quên') ||
    text.includes('lost') ||
    text.includes('found') ||
    text.includes('lưu kho')
  ) {
    return {
      featureId: 'lost-and-found',
      label: 'Kiểm tra kho',
      params: {
        keyword: contextParams.itemCode || contextParams.keyword || '',
      },
    };
  }

  // Invoice / renewal -> Manage Invoices
  if (
    type === 'PAYMENT' ||
    type === 'INVOICE' ||
    text.includes('hóa đơn') ||
    text.includes('invoice') ||
    text.includes('thanh toán') ||
    text.includes('payment')
  ) {
    return {
      featureId: 'manage-invoices',
      label: 'Xem hóa đơn',
      params: {
        searchKeyword: contextParams.invoiceCode || contextParams.searchKeyword || contextParams.memberName || '',
      },
    };
  }

  // Membership Expiring / Renewal -> Manage Memberships
  if (
    type === 'MEMBERSHIP' ||
    text.includes('hết hạn') ||
    text.includes('expir') ||
    text.includes('gia hạn')
  ) {
    return {
      featureId: 'manage-memberships',
      label: 'Gia hạn gói tập',
      params: {
        keyword: contextParams.memberName || contextParams.searchKeyword || '',
        memberId: contextParams.memberId || null,
      },
    };
  }

  // Member Registration / Profile -> Search Members
  if (
    type === 'MEMBER' ||
    text.includes('hội viên mới') ||
    text.includes('đăng ký mới') ||
    text.includes('new member') ||
    text.includes('cấp thẻ')
  ) {
    return {
      featureId: 'search-members',
      label: 'Xem hội viên',
      params: {
        searchKeyword: contextParams.memberName || contextParams.searchKeyword || '',
        memberId: contextParams.memberId || null,
      },
    };
  }

  return null;
}

export function getReceptionistNotificationMeta(notification) {
  if (!notification) {
    return {
      categoryKey: 'SYSTEM',
      icon: 'ShieldCheck',
      badgeBg: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      categoryLabel: 'Hệ thống',
    };
  }

  const type = (notification.type || '').toUpperCase();
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();

  if (
    type === 'SUPPORT' ||
    text.includes('hỗ trợ') ||
    text.includes('support') ||
    text.includes('hủy') ||
    text.includes('cancel') ||
    text.includes('refund')
  ) {
    return {
      categoryKey: 'SUPPORT',
      icon: 'LifeBuoy',
      badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      categoryLabel: 'Hỗ trợ & Hủy gói',
    };
  }

  if (
    type === 'CHECKIN' ||
    text.includes('check-in') ||
    text.includes('điểm danh') ||
    text.includes('vào lớp') ||
    text.includes('anomaly') ||
    text.includes('bất thường')
  ) {
    return {
      categoryKey: 'CHECKIN',
      icon: 'UserCheck',
      badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      categoryLabel: 'Điểm danh Check-in',
    };
  }

  if (
    type === 'LOST_FOUND' ||
    type === 'LOST_AND_FOUND' ||
    text.includes('thất lạc') ||
    text.includes('bỏ quên') ||
    text.includes('két sắt')
  ) {
    return {
      categoryKey: 'LOST_FOUND',
      icon: 'PackageSearch',
      badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      categoryLabel: 'Đồ thất lạc',
    };
  }

  if (
    type === 'PAYMENT' ||
    type === 'INVOICE' ||
    text.includes('hóa đơn') ||
    text.includes('invoice') ||
    text.includes('thanh toán')
  ) {
    return {
      categoryKey: 'INVOICE',
      icon: 'Receipt',
      badgeBg: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      categoryLabel: 'Hóa đơn & Thu phí',
    };
  }

  return {
    categoryKey: 'SYSTEM',
    icon: 'ShieldCheck',
    badgeBg: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    categoryLabel: 'Hệ thống',
  };
}
