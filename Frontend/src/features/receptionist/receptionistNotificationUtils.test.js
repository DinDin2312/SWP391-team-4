import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSavedReceptionistPreferences,
  isNotificationAllowedByPreferences,
  filterReceptionistNotifications,
  getReceptionistUnreadCount,
  formatNotificationTime,
  getReceptionistNotificationMeta,
  getReceptionistNotificationAction,
  extractNotificationContextParams,
} from './receptionistNotificationUtils.js';

test('receptionistNotificationUtils: getSavedReceptionistPreferences returns default preferences when storage empty', () => {
  const prefs = getSavedReceptionistPreferences();
  assert.equal(typeof prefs, 'object');
  assert.equal(prefs.expiringMembershipAlert, true);
  assert.equal(prefs.pendingInvoiceAlert, true);
  assert.equal(prefs.checkinSuccessBanner, true);
  assert.equal(prefs.shiftHandoverReminder, true);

  // Test with mock localStorage
  globalThis.localStorage = {
    getItem: (key) => {
      if (key === 'receptionist_notification_preferences') {
        return JSON.stringify({ expiringMembershipAlert: false, pendingInvoiceAlert: true });
      }
      return null;
    }
  };
  const stored = getSavedReceptionistPreferences();
  assert.equal(stored.expiringMembershipAlert, false);

  // Test with invalid JSON throwing error
  globalThis.localStorage.getItem = () => '{bad-json';
  const fallback = getSavedReceptionistPreferences();
  assert.equal(fallback.expiringMembershipAlert, true);

  // Cleanup mock
  delete globalThis.localStorage;
});

test('receptionistNotificationUtils: isNotificationAllowedByPreferences respects toggle settings', () => {
  const checkInNotif = {
    title: 'Cảnh báo check-in',
    message: 'Học viên vào lớp nhưng chưa qua lễ tân điểm danh',
    type: 'CHECKIN',
  };
  const invoiceNotif = {
    title: 'Hóa đơn mới',
    message: 'Học viên thanh toán gói tập qua VNPay',
    type: 'PAYMENT',
  };
  const expiringNotif = {
    title: 'Gói tập sắp hết hạn',
    message: 'Hội viên Trần Bùi Thái gói tập còn 3 ngày nữa hết hạn',
    type: 'MEMBERSHIP',
  };
  const shiftNotif = {
    title: 'Nhắc nhở ca trực',
    message: 'Đến giờ bàn giao ca trực sáng cho ca chiều',
    type: 'SYSTEM',
  };
  const generalNotif = {
    title: 'Thông báo chung',
    message: 'Hôm nay trời mưa to',
    type: 'GENERAL',
  };

  // All enabled
  assert.equal(isNotificationAllowedByPreferences(checkInNotif), true);
  assert.equal(isNotificationAllowedByPreferences(invoiceNotif), true);
  assert.equal(isNotificationAllowedByPreferences(expiringNotif), true);
  assert.equal(isNotificationAllowedByPreferences(shiftNotif), true);
  assert.equal(isNotificationAllowedByPreferences(generalNotif), true);
  assert.equal(isNotificationAllowedByPreferences(null), false);

  // When checkinSuccessBanner is disabled
  const disabledCheckIn = { checkinSuccessBanner: false };
  assert.equal(isNotificationAllowedByPreferences(checkInNotif, disabledCheckIn), false);
  assert.equal(isNotificationAllowedByPreferences(invoiceNotif, disabledCheckIn), true);

  // When pendingInvoiceAlert is disabled
  const disabledInvoice = { pendingInvoiceAlert: false };
  assert.equal(isNotificationAllowedByPreferences(invoiceNotif, disabledInvoice), false);

  // When expiringMembershipAlert is disabled
  const disabledExpiring = { expiringMembershipAlert: false };
  assert.equal(isNotificationAllowedByPreferences(expiringNotif, disabledExpiring), false);

  // When shiftHandoverReminder is disabled
  const disabledShift = { shiftHandoverReminder: false };
  assert.equal(isNotificationAllowedByPreferences(shiftNotif, disabledShift), false);
});

test('receptionistNotificationUtils: filterReceptionistNotifications filters by category and keyword', () => {
  const sampleNotifications = [
    { id: 1, title: 'Yêu cầu hủy lớp', message: 'Học viên gửi yêu cầu hủy lớp Yoga', type: 'SUPPORT' },
    { id: 2, title: 'Check-in bất thường', message: 'Học viên đi thẳng vào phòng Gym', type: 'CHECKIN' },
    { id: 3, title: 'Đồ thất lạc sắp quá hạn', message: 'Bình lắc Whey Protein trong tủ lạnh quá 48h', type: 'LOST_FOUND' },
    { id: 4, title: 'Hóa đơn thanh toán', message: 'Gia hạn gói tập 1 năm thành công', type: 'PAYMENT' },
    { id: 5, title: 'Bảo trì hồ bơi', message: 'Ban quản lý thông báo hệ thống bảo trì', type: 'SYSTEM' },
  ];

  assert.equal(filterReceptionistNotifications(null).length, 0);
  assert.equal(filterReceptionistNotifications([]).length, 0);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'ALL').length, 5);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'SUPPORT').length, 1);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'CHECKIN').length, 1);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'LOST_FOUND').length, 1);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'INVOICE').length, 1);
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'SYSTEM').length, 1);

  // Keyword search
  const searched = filterReceptionistNotifications(sampleNotifications, 'ALL', null, 'Whey');
  assert.equal(searched.length, 1);
  assert.equal(searched[0].id, 3);

  // Unknown category falls back to default branch
  assert.equal(filterReceptionistNotifications(sampleNotifications, 'UNKNOWN_CATEGORY').length, 5);
});

test('receptionistNotificationUtils: getReceptionistUnreadCount counts unread items accurately', () => {
  const list = [
    { id: 1, title: 'Đồ thất lạc', message: 'Có đồ mới', isRead: false },
    { id: 2, title: 'Đồ thất lạc', message: 'Có đồ mới 2', isRead: true },
    { id: 3, title: 'Hóa đơn', message: 'Hóa đơn mới', read: false }, // supports both read and isRead
    { id: 4, title: 'Check-in', message: 'Check-in mới', isRead: false },
  ];

  assert.equal(getReceptionistUnreadCount(list), 3);
  assert.equal(getReceptionistUnreadCount([]), 0);
  assert.equal(getReceptionistUnreadCount(null), 0);

  // When checkinSuccessBanner is disabled
  const countExclCheckin = getReceptionistUnreadCount(list, { checkinSuccessBanner: false });
  assert.equal(countExclCheckin, 2);
});

test('receptionistNotificationUtils: formatNotificationTime formats relative time strings', () => {
  const now = new Date();
  const justNow = new Date(now.getTime() - 10 * 1000).toISOString();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  assert.equal(formatNotificationTime(null), '');
  assert.equal(formatNotificationTime(justNow, 'vi'), 'Vừa xong');
  assert.equal(formatNotificationTime(justNow, 'en'), 'Just now');
  assert.equal(formatNotificationTime(fiveMinAgo, 'vi').includes('phút trước'), true);
  assert.equal(formatNotificationTime(fiveMinAgo, 'en').includes('m ago'), true);
  assert.equal(formatNotificationTime(twoHoursAgo, 'vi').includes('giờ trước'), true);
  assert.equal(formatNotificationTime(twoHoursAgo, 'en').includes('h ago'), true);
  assert.equal(formatNotificationTime(threeDaysAgo, 'vi').includes('ngày trước'), true);
  assert.equal(formatNotificationTime(threeDaysAgo, 'en').includes('d ago'), true);

  // Throws or invalid date triggering catch fallback
  const invalidObj = { toString: () => { throw new Error('err'); } };
  assert.equal(formatNotificationTime(invalidObj), invalidObj);
});

test('receptionistNotificationUtils: extractNotificationContextParams parses codes and member info', () => {
  assert.deepEqual(extractNotificationContextParams(null), {});

  const notif1 = {
    title: 'Hủy lớp',
    message: 'Hội viên Nguyễn Kiều Oanh (#7) vừa gửi yêu cầu',
  };
  const parsed1 = extractNotificationContextParams(notif1);
  assert.equal(parsed1.memberName, 'Nguyễn Kiều Oanh');
  assert.equal(parsed1.memberId, 7);
  assert.equal(parsed1.searchKeyword, 'Nguyễn Kiều Oanh');

  const notif2 = {
    title: 'Đồ thất lạc',
    message: 'Món đồ LF-20261031-009 sắp quá hạn',
  };
  const parsed2 = extractNotificationContextParams(notif2);
  assert.equal(parsed2.itemCode, 'LF-20261031-009');
  assert.equal(parsed2.keyword, 'LF-20261031-009');

  const notif3 = {
    title: 'Hóa đơn',
    message: 'Thanh toán mã INV-20261031-088 thành công',
  };
  const parsed3 = extractNotificationContextParams(notif3);
  assert.equal(parsed3.invoiceCode, 'INV-20261031-088');
});

test('receptionistNotificationUtils: getReceptionistNotificationAction maps to target feature, label, and params', () => {
  const supportNotif = {
    title: 'Yêu cầu hủy lớp',
    message: 'Hội viên Nguyễn Kiều Oanh (#7) vừa gửi yêu cầu hoàn tiền',
    type: 'SUPPORT'
  };
  const checkinNotif = {
    title: 'Cảnh báo check-in',
    message: 'Hội viên Bùi Tấn Trường (#12) chưa qua lễ tân',
    type: 'CHECKIN'
  };
  const lostNotif = {
    title: 'Đồ thất lạc',
    message: 'Món đồ LF-20261031-009 quá hạn lưu kho',
    type: 'LOST_FOUND'
  };
  const invoiceNotif = {
    title: 'Hóa đơn mới',
    message: 'Mã hóa đơn: INV-20261031-088',
    type: 'PAYMENT'
  };
  const membershipNotif = {
    title: 'Gói tập sắp hết hạn',
    message: 'Hội viên Trần Bùi Thái (#6) gói tập còn 3 ngày nữa hết hạn',
    type: 'MEMBERSHIP'
  };
  const memberRegNotif = {
    title: 'Hội viên mới đăng ký',
    message: 'Hội viên Micheal Tran (#13010) vừa hoàn tất đăng ký online',
    type: 'MEMBER'
  };
  const generalNotif = { title: 'Chào mừng', message: 'Ngày mới tốt lành', type: 'SYSTEM' };

  assert.deepEqual(getReceptionistNotificationAction(supportNotif), {
    featureId: 'support-desk',
    label: 'Xử lý yêu cầu',
    params: {
      searchKeyword: 'Nguyễn Kiều Oanh',
      memberId: 7,
    },
  });
  assert.deepEqual(getReceptionistNotificationAction(checkinNotif), {
    featureId: 'member-checkin',
    label: 'Xem điểm danh',
    params: {
      historyKeyword: 'Bùi Tấn Trường',
      historyStatusFilter: 'ANOMALY',
      memberId: 12,
    },
  });
  assert.deepEqual(getReceptionistNotificationAction(lostNotif), {
    featureId: 'lost-and-found',
    label: 'Kiểm tra kho',
    params: {
      keyword: 'LF-20261031-009',
    },
  });
  assert.deepEqual(getReceptionistNotificationAction(invoiceNotif), {
    featureId: 'manage-invoices',
    label: 'Xem hóa đơn',
    params: {
      searchKeyword: 'INV-20261031-088',
    },
  });
  assert.deepEqual(getReceptionistNotificationAction(membershipNotif), {
    featureId: 'manage-memberships',
    label: 'Gia hạn gói tập',
    params: {
      keyword: 'Trần Bùi Thái',
      memberId: 6,
    },
  });
  assert.deepEqual(getReceptionistNotificationAction(memberRegNotif), {
    featureId: 'search-members',
    label: 'Xem hội viên',
    params: {
      searchKeyword: 'Micheal Tran',
      memberId: 13010,
    },
  });
  assert.equal(getReceptionistNotificationAction(generalNotif), null);
  assert.equal(getReceptionistNotificationAction(null), null);
});

test('receptionistNotificationUtils: getReceptionistNotificationMeta returns styling descriptors', () => {
  const supportNotif = { title: 'Yêu cầu hỗ trợ', message: 'Cần hoàn tiền', type: 'SUPPORT' };
  const checkinNotif = { title: 'Check-in bất thường', message: 'Vắng mặt', type: 'CHECKIN' };
  const lostNotif = { title: 'Đồ bỏ quên', message: 'Két sắt', type: 'LOST_FOUND' };
  const invoiceNotif = { title: 'Hóa đơn', message: 'Thanh toán', type: 'PAYMENT' };
  const defaultNotif = { title: 'Thông báo', message: 'Bảo trì', type: 'SYSTEM' };

  const meta1 = getReceptionistNotificationMeta(supportNotif);
  assert.equal(meta1.categoryKey, 'SUPPORT');
  assert.equal(typeof meta1.icon, 'string');

  const meta2 = getReceptionistNotificationMeta(checkinNotif);
  assert.equal(meta2.categoryKey, 'CHECKIN');

  const meta3 = getReceptionistNotificationMeta(lostNotif);
  assert.equal(meta3.categoryKey, 'LOST_FOUND');

  const meta4 = getReceptionistNotificationMeta(invoiceNotif);
  assert.equal(meta4.categoryKey, 'INVOICE');

  const meta5 = getReceptionistNotificationMeta(defaultNotif);
  assert.equal(meta5.categoryKey, 'SYSTEM');

  assert.equal(getReceptionistNotificationMeta(null).categoryKey, 'SYSTEM');
});
