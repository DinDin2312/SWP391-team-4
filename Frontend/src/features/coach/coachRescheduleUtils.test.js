import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getReasonLabel,
  getStatusMeta,
  formatDateTime,
  formatScheduleSlot,
  isDeadlineExpired,
  isMakeupSession,
  isSubstituteCoach
} from './coachRescheduleUtils.js';

test('coachRescheduleUtils: maps reason categories to bilingual labels', () => {
  assert.equal(getReasonLabel('UNAVAILABLE_NO_SUB', 'vi'), 'Không có HLV nào rảnh để dạy thay');
  assert.equal(getReasonLabel('UNAVAILABLE_NO_SUB', 'en'), 'No substitute coach available');
  assert.equal(getReasonLabel('SICK_LEAVE', 'vi'), 'Nghỉ ốm / Khám chữa bệnh');
  assert.equal(getReasonLabel('SICK_LEAVE', 'en'), 'Sick leave / Medical');
  assert.equal(getReasonLabel('UNKNOWN_CODE', 'vi'), 'UNKNOWN_CODE');
});

test('coachRescheduleUtils: returns correct status meta and badges', () => {
  const pendingVi = getStatusMeta('PENDING', 'vi');
  assert.equal(pendingVi.label, 'Chờ thẩm định');
  assert.ok(pendingVi.badgeClass.includes('amber'));

  const approvedEn = getStatusMeta('APPROVED', 'en');
  assert.equal(approvedEn.label, 'Approved');
  assert.ok(approvedEn.badgeClass.includes('emerald'));

  const rejectedVi = getStatusMeta('REJECTED', 'vi');
  assert.equal(rejectedVi.label, 'Bị từ chối');
  assert.ok(rejectedVi.badgeClass.includes('rose'));
});

test('coachRescheduleUtils: formats date time strings with fallback', () => {
  assert.equal(formatDateTime(''), '--');
  assert.equal(formatDateTime(null), '--');
  const formatted = formatDateTime('2026-11-05T14:30:00');
  assert.ok(formatted && formatted !== '--');
});

test('coachRescheduleUtils: detects deadline expiration accurately', () => {
  const pastDate = new Date(Date.now() - 3600000).toISOString();
  const futureDate = new Date(Date.now() + 36000000).toISOString();
  assert.equal(isDeadlineExpired(pastDate), true);
  assert.equal(isDeadlineExpired(futureDate), false);
  assert.equal(isDeadlineExpired(null), false);
});

test('coachRescheduleUtils: formats schedule slots with weekday and times', () => {
  assert.equal(formatScheduleSlot('', ''), '--');
  assert.equal(formatScheduleSlot(null, null), '--');
  const slotStr = formatScheduleSlot('2026-11-03T08:00:00', '2026-11-03T09:30:00', 'vi');
  assert.ok(slotStr.includes('08:00'));
  assert.ok(slotStr.includes('09:30'));
  assert.ok(slotStr.includes('03/11/2026'));
});

test('coachRescheduleUtils: identifies make-up session and substitute coach accurately', () => {
  assert.equal(isMakeupSession('MAKEUP_SESSION'), true);
  assert.equal(isMakeupSession('MAKE_UP_SESSION'), true);
  assert.equal(isMakeupSession('makeup_session'), true);
  assert.equal(isMakeupSession('SUBSTITUTE_COACH'), false);
  assert.equal(isMakeupSession(null), false);
  assert.equal(isMakeupSession(undefined), false);

  assert.equal(isSubstituteCoach('SUBSTITUTE_COACH'), true);
  assert.equal(isSubstituteCoach('substitute_coach'), true);
  assert.equal(isSubstituteCoach('MAKEUP_SESSION'), false);
  assert.equal(isSubstituteCoach(null), false);
});
