import test from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage } from '../../i18n/languageStore.js';
import {
  formatCheckInNote,
  formatCheckInAnomaly,
  formatCheckInPackage,
  formatFacilityName,
  parseMemberQrPayload,
  computeQrScanLayout,
  binarizeQrRgba,
} from './receptionistUtils.js';

test('receptionistUtils: formatCheckInNote translates coach override check-in across EN and VI', () => {
  // Test with duplicate "HLV HLV" stutter
  const rawNote = 'Check-in bổ sung: HLV HLV Trần Mai Anh xác nhận có mặt trực tiếp tại lớp Yoga Kundalini Đánh Thức Năng Lượng';

  setLanguage('en');
  assert.equal(
    formatCheckInNote(rawNote),
    'Supplemental check-in: Coach Trần Mai Anh confirmed in-person attendance in Yoga Kundalini Đánh Thức Năng Lượng'
  );

  setLanguage('vi');
  assert.equal(
    formatCheckInNote(rawNote),
    'Check-in bổ sung: HLV Trần Mai Anh xác nhận có mặt trực tiếp tại lớp Yoga Kundalini Đánh Thức Năng Lượng'
  );

  // Test with standard "HLV"
  const singleNote = 'Check-in bổ sung: HLV Nguyễn Văn Tuấn xác nhận có mặt trực tiếp tại lớp Thể Hình';
  setLanguage('en');
  assert.equal(
    formatCheckInNote(singleNote),
    'Supplemental check-in: Coach Nguyễn Văn Tuấn confirmed in-person attendance in Thể Hình'
  );

  // Fallbacks
  assert.equal(formatCheckInNote(null), '');
  assert.equal(formatCheckInNote(''), '');
  assert.equal(formatCheckInNote('   '), '');
  assert.equal(formatCheckInNote('Custom front desk memo'), 'Custom front desk memo');
});

test('receptionistUtils: formatCheckInAnomaly translates anomaly reasons across EN and VI', () => {
  const rawAnomaly = 'Chưa qua cổng lễ tân: HLV HLV Trần Mai Anh xác nhận có mặt trực tiếp tại lớp Yoga Hatha Cân Bằng Thân Tâm';

  setLanguage('en');
  assert.equal(
    formatCheckInAnomaly(rawAnomaly),
    'Bypassed front desk: Coach Trần Mai Anh confirmed in-person attendance in Yoga Hatha Cân Bằng Thân Tâm'
  );

  setLanguage('vi');
  assert.equal(
    formatCheckInAnomaly(rawAnomaly),
    'Chưa qua cổng lễ tân: HLV Trần Mai Anh xác nhận có mặt trực tiếp tại lớp Yoga Hatha Cân Bằng Thân Tâm'
  );

  // Marked absent by coach anomaly
  const absentAnomaly = 'Check-in vào trung tâm học lớp nhưng HLV ghi nhận VẮNG MẶT trong lớp';
  setLanguage('en');
  assert.equal(
    formatCheckInAnomaly(absentAnomaly),
    'Checked in at facility but marked ABSENT by coach in class'
  );

  setLanguage('vi');
  assert.equal(
    formatCheckInAnomaly(absentAnomaly),
    'Check-in vào trung tâm học lớp nhưng HLV ghi nhận VẮNG MẶT trong lớp'
  );

  // Fallbacks
  assert.equal(formatCheckInAnomaly(null), '');
  assert.equal(formatCheckInAnomaly(''), '');
});

test('receptionistUtils: formatCheckInPackage and formatFacilityName handle bilingual labels', () => {
  setLanguage('en');
  assert.equal(formatCheckInPackage('Lớp: Yoga Kundalini Đánh Thức Năng Lượng'), 'Class: Yoga Kundalini Đánh Thức Năng Lượng');
  assert.equal(formatFacilityName('Phòng Yoga Tầng 2'), 'Yoga Studio Floor 2');
  assert.equal(formatFacilityName('Bể Bơi Bốn Mùa'), 'Four-Season Swimming Pool');

  setLanguage('vi');
  assert.equal(formatCheckInPackage('Lớp: Yoga Kundalini Đánh Thức Năng Lượng'), 'Lớp học: Yoga Kundalini Đánh Thức Năng Lượng');
  assert.equal(formatFacilityName('Phòng Yoga Tầng 2'), 'Phòng Yoga Tầng 2');
  assert.equal(formatFacilityName('Bể Bơi Bốn Mùa'), 'Bể Bơi Bốn Mùa');

  assert.equal(formatCheckInPackage('Gói Gym 1 Năm'), 'Gói Gym 1 Năm');
  assert.equal(formatCheckInPackage(null), '—');
  assert.equal(formatCheckInPackage(''), '—');
  assert.equal(formatFacilityName(null), '—');
  assert.equal(formatFacilityName(''), '—');
});

test('receptionistUtils: Lost & Found bilingual i18n translates tabs, badges, actions, and metrics across EN and VI', async () => {
  const { t } = await import('../../i18n/useLanguage.js');

  // English verification
  setLanguage('en');
  assert.equal(t('Quản lý Đồ thất lạc & Bỏ quên'), 'Lost & Found Management');
  assert.equal(t('FRONT DESK ASSET MANAGEMENT'), 'FRONT DESK ASSET MANAGEMENT');
  assert.equal(t('Tiếp nhận món đồ mới'), 'Receive New Item');
  assert.equal(t('Đang lưu kho'), 'In Storage');
  assert.equal(t('Trong két an toàn'), 'In Safe Box');
  assert.equal(t('Đã trao trả khách'), 'Handed Over');
  assert.equal(t('Quá hạn / Sắp hết hạn'), 'Overdue / Expiring Soon');
  assert.equal(t('Thiết bị điện tử'), 'Electronics');
  assert.equal(t('Ví & Giấy tờ'), 'Wallets & IDs');
  assert.equal(t('Trang phục & Giày'), 'Clothing & Shoes');
  assert.equal(t('Đang giữ'), 'Stored');
  assert.equal(t('Két sắt an toàn'), 'Secure Safe Box');
  assert.equal(t('Bàn giao'), 'Hand Over');
  assert.equal(t('Hội viên trung tâm'), 'Center Member');
  assert.equal(t('Khách ngoài / Khách vãng lai'), 'Guest / Walk-in Visitor');
  assert.equal(t('(+{0} expiring)', [3]), '(+3 expiring)');

  // Vietnamese verification
  setLanguage('vi');
  assert.equal(t('Quản lý Đồ thất lạc & Bỏ quên'), 'Quản lý Đồ thất lạc & Bỏ quên');
  assert.equal(t('FRONT DESK ASSET MANAGEMENT'), 'QUẢN LÝ TÀI SẢN BÀN LỄ TÂN');
  assert.equal(t('Tiếp nhận món đồ mới'), 'Tiếp nhận món đồ mới');
  assert.equal(t('Đang lưu kho'), 'Đang lưu kho');
  assert.equal(t('Trong két an toàn'), 'Trong két an toàn');
  assert.equal(t('Đã trao trả khách'), 'Đã trao trả khách');
  assert.equal(t('Quá hạn / Sắp hết hạn'), 'Quá hạn / Sắp hết hạn');
  assert.equal(t('Thiết bị điện tử'), 'Thiết bị điện tử');
  assert.equal(t('Ví & Giấy tờ'), 'Ví & Giấy tờ');
  assert.equal(t('Trang phục & Giày'), 'Trang phục & Giày');
  assert.equal(t('Đang giữ'), 'Đang giữ');
  assert.equal(t('Két sắt an toàn'), 'Két sắt an toàn');
  assert.equal(t('Bàn giao'), 'Bàn giao');
  assert.equal(t('Hội viên trung tâm'), 'Hội viên trung tâm');
  assert.equal(t('Khách ngoài / Khách vãng lai'), 'Khách ngoài / Khách vãng lai');
  assert.equal(t('(+{0} expiring)', [3]), '(+3 sắp hết)');
});

test('receptionistUtils: parseMemberQrPayload handles all supported QR formats and rejects invalid values', () => {
  assert.deepEqual(parseMemberQrPayload('NEXUS-PASS-9906-PKG-42'), {
    userId: 9906,
    membershipId: 42,
    bookingId: null,
    email: null,
    raw: 'NEXUS-PASS-9906-PKG-42',
  });
  assert.deepEqual(parseMemberQrPayload('NEXUS-PASS-9906-BK-315'), {
    userId: 9906,
    membershipId: null,
    bookingId: 315,
    email: null,
    raw: 'NEXUS-PASS-9906-BK-315',
  });
  assert.deepEqual(parseMemberQrPayload('NEXUS-PASS-NX-019-VN'), {
    userId: 19,
    membershipId: null,
    bookingId: null,
    email: null,
    raw: 'NEXUS-PASS-NX-019-VN',
  });
  assert.deepEqual(parseMemberQrPayload('  nexus-pass-9906  '), {
    userId: 9906,
    membershipId: null,
    bookingId: null,
    email: null,
    raw: 'nexus-pass-9906',
  });
  assert.deepEqual(parseMemberQrPayload('NEXUS-9906-bich31699@gmail.com'), {
    userId: 9906,
    membershipId: null,
    bookingId: null,
    email: 'bich31699@gmail.com',
    raw: 'NEXUS-9906-bich31699@gmail.com',
  });
  assert.deepEqual(parseMemberQrPayload('{"userId":19,"membershipId":7,"bookingId":88,"email":"dung@gmail.com"}'), {
    userId: 19,
    membershipId: 7,
    bookingId: 88,
    email: 'dung@gmail.com',
    raw: '{"userId":19,"membershipId":7,"bookingId":88,"email":"dung@gmail.com"}',
  });
  assert.deepEqual(parseMemberQrPayload('#9906'), {
    userId: 9906,
    membershipId: null,
    bookingId: null,
    email: null,
    raw: '#9906',
  });
  assert.deepEqual(parseMemberQrPayload('thai@gmail.com'), {
    userId: null,
    membershipId: null,
    bookingId: null,
    email: 'thai@gmail.com',
    raw: 'thai@gmail.com',
  });

  // Invalid / unrelated payloads
  assert.equal(parseMemberQrPayload(null), null);
  assert.equal(parseMemberQrPayload('   '), null);
  assert.equal(parseMemberQrPayload('NEXUS-PASS-MEMBER'), null);
  assert.equal(parseMemberQrPayload('NXS-12-14'), null);
  assert.equal(parseMemberQrPayload('{broken json}'), null);
  assert.equal(parseMemberQrPayload('{"foo":1}'), null);
  assert.equal(parseMemberQrPayload('0'), null);
});

test('receptionistUtils: computeQrScanLayout and binarizeQrRgba handle tight crops and contrast stretching', () => {
  const smallCrop = computeQrScanLayout(160, 160);
  assert.equal(smallCrop.upscaled, true);
  assert.equal(smallCrop.drawWidth, 480);
  assert.equal(smallCrop.drawHeight, 480);
  assert.ok(smallCrop.padding >= 28);
  assert.equal(smallCrop.canvasWidth, smallCrop.drawWidth + smallCrop.padding * 2);

  const largeImg = computeQrScanLayout(2048, 1024, 1024);
  assert.equal(largeImg.upscaled, false);
  assert.equal(largeImg.drawWidth, 1024);
  assert.equal(largeImg.drawHeight, 512);

  // Low-contrast washed-out pixels: dark gray (90) vs light gray (200) -> binarized to 0 vs 255
  const washedOut = new Uint8ClampedArray([
    90, 90, 90, 255,
    200, 200, 200, 255,
  ]);
  const crisp = binarizeQrRgba(washedOut);
  assert.deepEqual([...crisp], [0, 0, 0, 255, 255, 255, 255, 255]);
  assert.equal(binarizeQrRgba(new Uint8ClampedArray(0)).length, 0);
});
