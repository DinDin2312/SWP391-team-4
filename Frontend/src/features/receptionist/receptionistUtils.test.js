import test from 'node:test';
import assert from 'node:assert/strict';
import { setLanguage } from '../../i18n/languageStore.js';
import {
  formatCheckInNote,
  formatCheckInAnomaly,
  formatCheckInPackage,
  formatFacilityName,
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
