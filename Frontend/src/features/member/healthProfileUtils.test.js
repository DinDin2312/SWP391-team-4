import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HEALTH_CONDITIONS,
  PARQ_QUESTIONS,
  calcAge,
  visibleConditions,
  exerciseConflicts,
  healthBadge,
  formatContraindications,
  formatContraTag,
} from './healthProfileUtils.js';

test('healthProfileUtils: constants are properly defined', () => {
  assert.equal(HEALTH_CONDITIONS.length, 8);
  assert.equal(PARQ_QUESTIONS.length, 7);
  assert.equal(PARQ_QUESTIONS[0].index, 0);
  assert.equal(PARQ_QUESTIONS[6].index, 6);
});

test('healthProfileUtils: calcAge computes age and handles edge cases', () => {
  assert.equal(calcAge('2000-11-02', '2026-11-01'), 25);
  assert.equal(calcAge('2000-11-01', '2026-11-01'), 26);
  assert.equal(calcAge('2030-01-01', '2026-11-01'), null);
  assert.equal(calcAge(null), null);
  assert.equal(calcAge(''), null);
  assert.equal(calcAge('invalid-date'), null);
});

test('healthProfileUtils: visibleConditions filters pregnancy for male', () => {
  const maleConditions = visibleConditions('MALE');
  assert.equal(maleConditions.some(c => c.code === 'PREGNANCY'), false);
  assert.equal(maleConditions.length, 7);

  const femaleConditions = visibleConditions('FEMALE');
  assert.equal(femaleConditions.some(c => c.code === 'PREGNANCY'), true);
  assert.equal(femaleConditions.length, 8);

  const otherConditions = visibleConditions('OTHER');
  assert.equal(otherConditions.length, 8);
});

test('healthProfileUtils: exerciseConflicts finds intersecting condition codes', () => {
  const conflicts = exerciseConflicts(['KNEE', 'ASTHMA'], ['KNEE', 'LOWER_BACK']);
  assert.deepEqual(conflicts, ['KNEE']);

  assert.deepEqual(exerciseConflicts(null, ['KNEE']), []);
  assert.deepEqual(exerciseConflicts(['KNEE'], null), []);
  assert.deepEqual(exerciseConflicts([], ['KNEE']), []);
});

test('healthProfileUtils: healthBadge computes badge label, variant and tooltip', () => {
  const emptyBadge = healthBadge(null);
  assert.equal(emptyBadge.label, 'Chưa khai báo');
  assert.equal(emptyBadge.variant, 'neutral');

  const incompleteBadge = healthBadge({ completed: false });
  assert.equal(incompleteBadge.label, 'Chưa khai báo');
  assert.equal(incompleteBadge.variant, 'neutral');

  const flaggedBadge = healthBadge({
    completed: true,
    gender: 'FEMALE',
    age: 52,
    clearanceRecommended: true,
    conditions: ['KNEE'],
    notes: 'Đau gối',
  });
  assert.equal(flaggedBadge.label, 'Nữ • 52t');
  assert.equal(flaggedBadge.variant, 'danger');
  assert.ok(flaggedBadge.tooltip.includes('PAR-Q'));
  assert.ok(flaggedBadge.tooltip.includes('KNEE'));

  const mildBadge = healthBadge({
    completed: true,
    gender: 'MALE',
    age: 30,
    clearanceRecommended: false,
    conditions: ['ASTHMA'],
  });
  assert.equal(mildBadge.label, 'Nam • 30t');
  assert.equal(mildBadge.variant, 'warning');

  const healthyBadge = healthBadge({
    completed: true,
    gender: 'MALE',
    age: 28,
    clearanceRecommended: false,
    conditions: [],
  });
  assert.equal(healthyBadge.label, 'Nam • 28t');
  assert.equal(healthyBadge.variant, 'success');

  // English localization tests
  const enEmpty = healthBadge(null, 'en');
  assert.equal(enEmpty.label, 'Not declared');

  const enFlagged = healthBadge({
    completed: true,
    gender: 'FEMALE',
    age: 52,
    clearanceRecommended: true,
    conditions: ['KNEE'],
  }, 'en');
  assert.equal(enFlagged.label, 'Female • 52y');
  assert.ok(enFlagged.tooltip.includes('Medical clearance'));
});


test('healthProfileUtils: formatContraindications and formatContraTag translate correctly', () => {
  const codes = ['LOWER_BACK', 'KNEE'];
  assert.equal(formatContraindications(codes, 'vi'), 'Cột sống / Thoát vị đĩa đệm, Khớp gối / Dây chằng');
  assert.equal(formatContraindications(codes, 'en'), 'Spine / Herniated disc, Knee / Ligament');
  assert.equal(formatContraindications([], 'vi'), '');
  assert.equal(formatContraindications(null, 'vi'), '');

  assert.equal(formatContraTag(codes, 'vi'), ' [Tránh: Cột sống / Thoát vị đĩa đệm, Khớp gối / Dây chằng]');
  assert.equal(formatContraTag(codes, 'en'), ' [Avoid: Spine / Herniated disc, Knee / Ligament]');
  assert.equal(formatContraTag([], 'vi'), '');
  assert.equal(formatContraTag(null, 'vi'), '');
});