import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFitnessProgressScore,
  getBmiInfo,
  generateTransformationSvgData,
  formatZaloSummary,
  generatePrintableReportHtml
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

test('calculateFitnessProgressScore: awards points for fat drop, muscle gain and high ratings (DIAMOND)', () => {
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

test('calculateFitnessProgressScore: handles GOLD tier and rating >= 3.8', () => {
  const assessments = [
    {
      assessmentId: 1,
      weight: 80.0,
      bodyFatPercentage: 24.0,
      muscleMass: 32.0,
      performanceRating: 4,
      attendanceRating: 4,
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      assessmentId: 2,
      weight: 78.0,
      bodyFatPercentage: 21.5,
      muscleMass: 32.8,
      performanceRating: 4,
      attendanceRating: 4,
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];

  const result = calculateFitnessProgressScore(assessments);
  // Base 50
  // Fat drop 2.5% => 2.5 * 4 = 10 pts
  // Muscle gain 0.8kg => (0.8 / 0.5) * 5 = 8 pts
  // Consistency (2 assessments): +5 pts
  // Rating 4.0 (>= 3.8): +7 pts
  // Total: 50 + 10 + 8 + 5 + 7 = 80 pts => GOLD
  assert.equal(result.score, 80);
  assert.equal(result.tier, 'GOLD');
  assert.equal(result.tierName, 'Tiến Bộ Vượt Bậc');
});

test('calculateFitnessProgressScore: handles SILVER tier, rating >= 3.0 and ideal athletic fat range', () => {
  const assessments = [
    {
      assessmentId: 1,
      weight: 65.0,
      bodyFatPercentage: 14.0,
      muscleMass: 30.0,
      performanceRating: 3,
      attendanceRating: 3.5,
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      assessmentId: 2,
      weight: 65.5,
      bodyFatPercentage: 14.5, // fat didn't drop, but is in [10, 20] => +15 pts
      muscleMass: 30.0,
      performanceRating: 3,
      attendanceRating: 3.5, // avg rating = 3.25 (>= 3.0) => +4 pts
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];

  const result = calculateFitnessProgressScore(assessments);
  // Base 50 + athletic fat 15 + 2 assessments 5 + rating 4 = 74 pts (GOLD) or SILVER test:
  // Here 50 + 15 + 5 + 4 = 74 (GOLD)
  assert.equal(result.score, 74);
  assert.equal(result.tier, 'GOLD');

  // Test true SILVER tier (score between 55 and 69)
  const silverAssessments = [
    {
      assessmentId: 10,
      weight: 70.0,
      bodyFatPercentage: 26.0,
      muscleMass: 28.0,
      performanceRating: 3,
      attendanceRating: 3,
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      assessmentId: 11,
      weight: 69.5,
      bodyFatPercentage: 25.5, // 0.5% drop => +2 pts
      muscleMass: 28.1, // 0.1kg => +1 pt
      performanceRating: 3,
      attendanceRating: 3, // avg 3.0 => +4 pts
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];
  const silverResult = calculateFitnessProgressScore(silverAssessments);
  // Base 50 + fat 2 + muscle 1 + 2 assessments 5 + rating 4 = 62 pts => SILVER
  assert.equal(silverResult.score, 62);
  assert.equal(silverResult.tier, 'SILVER');
  assert.equal(silverResult.tierName, 'Kiên Trì Bền Bỉ');
});

test('getBmiInfo: calculates correct BMI and category across all ranges', () => {
  const underweight = getBmiInfo(48, 170); // 48 / (1.7 * 1.7) = 16.6
  assert.equal(underweight.bmi, 16.6);
  assert.equal(underweight.statusKey, 'UNDERWEIGHT');
  assert.equal(underweight.label, 'Hơi gầy');

  const normal = getBmiInfo(65, 170); // 65 / (1.7 * 1.7) = 22.5
  assert.equal(normal.bmi, 22.5);
  assert.equal(normal.statusKey, 'NORMAL');

  const overweight = getBmiInfo(70, 170); // 70 / (1.7 * 1.7) = 24.2
  assert.equal(overweight.bmi, 24.2);
  assert.equal(overweight.statusKey, 'OVERWEIGHT');

  const obese = getBmiInfo(85, 170); // 85 / (1.7 * 1.7) = 29.4
  assert.equal(obese.bmi, 29.4);
  assert.equal(obese.statusKey, 'OBESE');

  assert.equal(getBmiInfo(0, 0), null);
  assert.equal(getBmiInfo(-10, 170), null);
  assert.equal(getBmiInfo(70, -170), null);
  assert.equal(getBmiInfo(null, undefined), null);
});

test('generateTransformationSvgData: handles null, empty, filters and single points', () => {
  assert.equal(generateTransformationSvgData(null), null);
  assert.equal(generateTransformationSvgData([]), null);

  const single = [
    { createdAt: '2026-08-01T10:00:00Z', bodyFatPercentage: 20, muscleMass: 32, weight: 70 }
  ];
  const singleData = generateTransformationSvgData(single, 'FAT_MUSCLE', 600, 240);
  assert.ok(singleData);
  assert.equal(singleData.points.length, 1);
  assert.ok(singleData.paths.fatLine.includes('M'));

  const assessments = [
    { createdAt: '2026-08-01T10:00:00Z', bodyFatPercentage: 24, muscleMass: 30, weight: 75 },
    { createdAt: '2026-09-01T10:00:00Z', bodyFatPercentage: 22, muscleMass: 31, weight: 74 },
    { createdAt: '2026-10-01T10:00:00Z', bodyFatPercentage: 20, muscleMass: 32, weight: 73 }
  ];

  // Test WEIGHT metric filter
  const weightData = generateTransformationSvgData(assessments, 'WEIGHT', 500, 200);
  assert.ok(weightData);
  assert.equal(weightData.points.length, 3);
  assert.ok(weightData.paths.weightLine.includes('L'));
  assert.ok(weightData.gridLines.length >= 4);

  // Test ALL metric filter
  const allData = generateTransformationSvgData(assessments, 'ALL', 600, 240);
  assert.ok(allData);
  assert.equal(allData.paths.fatLine.includes('NaN'), false);
  assert.equal(allData.paths.muscleLine.includes('NaN'), false);
  assert.ok(allData.paths.fatArea.includes('Z'));
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

  // Test fallback formatting with positive deltas and empty note
  const fallbackText = formatZaloSummary(null, { deltaWeight: 1.5, deltaBodyFat: 1.0, deltaMuscle: -0.5 });
  assert.ok(fallbackText.includes('Hội viên'));
  assert.ok(fallbackText.includes('+1.5kg'));
  assert.ok(fallbackText.includes('+1%'));
});

test('generatePrintableReportHtml: generates valid A4 printable HTML document', () => {
  const student = {
    fullName: 'Trần Văn Nam',
    email: 'nam.tran@example.com',
    phone: '0901234567'
  };

  const scoreResult = {
    score: 85,
    tierName: 'Bứt Phá Thần Tốc',
    deltaWeight: -2.5,
    deltaBodyFat: -3.0,
    deltaMuscle: 1.5,
    baselineMetrics: {
      weight: 75,
      height: 172,
      bodyFatPercentage: 24,
      muscleMass: 31
    },
    latestMetrics: {
      weight: 72.5,
      height: 172,
      bodyFatPercentage: 21,
      muscleMass: 32.5,
      feedbackNote: 'Thể lực cải thiện rất rõ rệt.',
      recommendation: 'Tiếp tục duy trì bài tập tạ kết hợp cardio.'
    }
  };

  const coachInfo = { name: 'HLV Tuấn Anh' };

  const html = generatePrintableReportHtml(student, [], scoreResult, coachInfo);
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('NEXUS SPORTS CENTER'));
  assert.ok(html.includes('Trần Văn Nam'));
  assert.ok(html.includes('nam.tran@example.com'));
  assert.ok(html.includes('0901234567'));
  assert.ok(html.includes('HLV Tuấn Anh'));
  assert.ok(html.includes('85'));
  assert.ok(html.includes('Bứt Phá Thần Tốc'));
  assert.ok(html.includes('Thể lực cải thiện rất rõ rệt.'));
  assert.ok(html.includes('Tiếp tục duy trì bài tập tạ kết hợp cardio.'));
  assert.ok(html.includes('BÁO CÁO CHÍNH THỨC'));

  // Test with defaults / fallbacks
  const defaultHtml = generatePrintableReportHtml();
  assert.ok(defaultHtml.includes('Học viên NEXUS'));
  assert.ok(defaultHtml.includes('Ban Huấn Luyện NEXUS'));
});

