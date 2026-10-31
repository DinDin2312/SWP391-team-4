import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFitnessProgressScore,
  getBmiInfo,
  generateTransformationSvgData,
  formatZaloSummary
} from './bodyTransformationUtils.js';

test('calculateFitnessProgressScore: handles empty or invalid inputs', () => {
  const resultNull = calculateFitnessProgressScore(null);
  assert.equal(resultNull.score, 0);
  assert.equal(resultNull.tier, 'NONE');

  const resultEmpty = calculateFitnessProgressScore([]);
  assert.equal(resultEmpty.score, 0);
  assert.equal(resultEmpty.tier, 'NONE');
});

test('calculateFitnessProgressScore: handles single assessment (baseline)', () => {
  const single = [
    {
      assessmentId: 1,
      weight: 75.0,
      height: 175.0,
      bodyFatPercentage: 24.0,
      muscleMass: 31.0,
      performanceRating: 4,
      attendanceRating: 5,
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];

  const result = calculateFitnessProgressScore(single);
  assert.equal(result.score, 50);
  assert.equal(result.tier, 'BRONZE');
  assert.equal(result.totalAssessments, 1);
  assert.equal(result.deltaWeight, 0);
  assert.equal(result.deltaBodyFat, 0);
  assert.equal(result.deltaMuscle, 0);
});

test('calculateFitnessProgressScore: awards points for fat drop, muscle gain and high ratings', () => {
  const assessments = [
    {
      assessmentId: 1,
      weight: 78.0,
      height: 175.0,
      bodyFatPercentage: 25.0,
      muscleMass: 30.0,
      performanceRating: 4,
      attendanceRating: 4,
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      assessmentId: 2,
      weight: 76.0,
      height: 175.0,
      bodyFatPercentage: 22.5,
      muscleMass: 31.0,
      performanceRating: 5,
      attendanceRating: 5,
      createdAt: '2026-09-01T10:00:00Z'
    },
    {
      assessmentId: 3,
      weight: 74.5,
      height: 175.0,
      bodyFatPercentage: 20.0,
      muscleMass: 32.0,
      performanceRating: 5,
      attendanceRating: 5,
      createdAt: '2026-10-01T10:00:00Z'
    }
  ];

  const result = calculateFitnessProgressScore(assessments);

  // Base: 50
  // Fat drop: 25.0 - 20.0 = 5.0% drop => 5 * 4 = 20 pts (max 20)
  // Muscle gain: 32.0 - 30.0 = +2.0kg => (2.0 / 0.5) * 5 = 20 pts (max 20)
  // Consistency (3 assessments): +10 pts
  // Effort bonus (avg rating >= 4.5): +10 pts
  // Expected: 50 + 20 + 20 + 10 + 10 = 100 (DIAMOND)
  assert.equal(result.score, 100);
  assert.equal(result.tier, 'DIAMOND');
  assert.equal(result.deltaWeight, -3.5);
  assert.equal(result.deltaBodyFat, -5.0);
  assert.equal(result.deltaMuscle, 2.0);
});

test('getBmiInfo: calculates correct BMI and category', () => {
  const normal = getBmiInfo(65, 170); // 65 / (1.7 * 1.7) = 22.5
  assert.equal(normal.bmi, 22.5);
  assert.equal(normal.statusKey, 'NORMAL');

  const overweight = getBmiInfo(70, 170); // 70 / (1.7 * 1.7) = 24.2
  assert.equal(overweight.bmi, 24.2);
  assert.equal(overweight.statusKey, 'OVERWEIGHT');

  const obese = getBmiInfo(85, 170); // 85 / (1.7 * 1.7) = 29.4
  assert.equal(obese.bmi, 29.4);
  assert.equal(obese.statusKey, 'OBESE');

  const invalid = getBmiInfo(0, 0);
  assert.equal(invalid, null);
});

test('generateTransformationSvgData: produces coordinates and valid paths without NaN', () => {
  const assessments = [
    { createdAt: '2026-08-01T10:00:00Z', bodyFatPercentage: 24, muscleMass: 30, weight: 75 },
    { createdAt: '2026-09-01T10:00:00Z', bodyFatPercentage: 22, muscleMass: 31, weight: 74 },
    { createdAt: '2026-10-01T10:00:00Z', bodyFatPercentage: 20, muscleMass: 32, weight: 73 }
  ];

  const svgData = generateTransformationSvgData(assessments, 'ALL', 600, 240);
  assert.ok(svgData);
  assert.equal(svgData.points.length, 3);
  assert.ok(svgData.paths.fatLine.includes('M'));
  assert.ok(svgData.paths.muscleLine.includes('M'));
  assert.ok(svgData.paths.weightLine.includes('M'));
  assert.equal(svgData.paths.fatLine.includes('NaN'), false);
  assert.equal(svgData.paths.muscleLine.includes('NaN'), false);
});

test('formatZaloSummary: formats message string with trainee and score details', () => {
  const student = { fullName: 'Nguyen Van A', userId: 101 };
  const scoreResult = {
    score: 88,
    tier: 'DIAMOND',
    tierName: 'Bứt Phá Thần Tốc',
    deltaWeight: -3.5,
    deltaBodyFat: -4.0,
    deltaMuscle: 1.8,
    latestMetrics: { weight: 70, bodyFatPercentage: 18, muscleMass: 32 }
  };

  const text = formatZaloSummary(student, scoreResult, 'Tap luyen rat cham chi');
  assert.ok(text.includes('Nguyen Van A'));
  assert.ok(text.includes('88/100'));
  assert.ok(text.includes('Bứt Phá Thần Tốc'));
  assert.ok(text.includes('-4%') || text.includes('-4.0%') || text.includes('-4'));
  assert.ok(text.includes('Tap luyen rat cham chi'));
});
