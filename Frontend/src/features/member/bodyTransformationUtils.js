/**
 * bodyTransformationUtils.js
 * Utility functions for Body Transformation Visualizer, Fitness Progress Score (FPS),
 * SVG Chart generation, Zalo / Email summary text formatting, and Printable A4 PDF Report.
 */

/**
 * Calculates BMI and categorical status.
 */
export const getBmiInfo = (weight, height) => {
  const w = parseFloat(weight);
  const h = parseFloat(height);
  if (!w || !h || w <= 0 || h <= 0) return null;

  const heightInMeters = h / 100;
  const bmiRaw = w / (heightInMeters * heightInMeters);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let statusKey = 'NORMAL';
  let label = 'Bình thường (Chuẩn)';
  let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

  if (bmi < 18.5) {
    statusKey = 'UNDERWEIGHT';
    label = 'Hơi gầy';
    color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  } else if (bmi >= 23 && bmi < 25) {
    statusKey = 'OVERWEIGHT';
    label = 'Thừa cân nhẹ';
    color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  } else if (bmi >= 25) {
    statusKey = 'OBESE';
    label = 'Cần giảm cân';
    color = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  }

  return { bmi, statusKey, label, color };
};

/**
 * Calculates the Fitness Progress Score (0 - 100) based on InBody assessments.
 *
 * Scoring model:
 * Base Score: 50 pts (granted once baseline assessment exists).
 * Fat Drop: up to +20 pts (+4 pts per 1% body fat reduction or maintaining ideal fat).
 * Muscle Gain: up to +20 pts (+5 pts per +0.5kg muscle gain).
 * Consistency: up to +10 pts (measurements spaced across time).
 * Coach Rating Effort Bonus: up to +10 pts (ratings >= 4.0).
 */
export const calculateFitnessProgressScore = (assessments) => {
  if (!Array.isArray(assessments) || assessments.length === 0) {
    return {
      score: 0,
      tier: 'NONE',
      tierName: 'Chưa có dữ liệu',
      badgeColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      totalAssessments: 0,
      deltaWeight: 0,
      deltaBodyFat: 0,
      deltaMuscle: 0,
      message: 'Chưa có mốc đo InBody nào được ghi nhận.',
      baselineMetrics: null,
      latestMetrics: null
    };
  }

  // Sort chronological (oldest to newest)
  const sorted = [...assessments].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];

  const totalAssessments = sorted.length;

  const baseWeight = baseline.weight != null ? parseFloat(baseline.weight) : null;
  const baseFat = baseline.bodyFatPercentage != null ? parseFloat(baseline.bodyFatPercentage) : null;
  const baseMuscle = baseline.muscleMass != null ? parseFloat(baseline.muscleMass) : null;

  const latestWeight = latest.weight != null ? parseFloat(latest.weight) : null;
  const latestFat = latest.bodyFatPercentage != null ? parseFloat(latest.bodyFatPercentage) : null;
  const latestMuscle = latest.muscleMass != null ? parseFloat(latest.muscleMass) : null;

  const deltaWeight = (baseWeight != null && latestWeight != null)
    ? Math.round((latestWeight - baseWeight) * 10) / 10
    : 0;

  const deltaBodyFat = (baseFat != null && latestFat != null)
    ? Math.round((latestFat - baseFat) * 10) / 10
    : 0;

  const deltaMuscle = (baseMuscle != null && latestMuscle != null)
    ? Math.round((latestMuscle - baseMuscle) * 10) / 10
    : 0;

  if (totalAssessments === 1) {
    return {
      score: 50,
      tier: 'BRONZE',
      tierName: 'Khởi Động Nền Tảng',
      badgeColor: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
      totalAssessments: 1,
      deltaWeight: 0,
      deltaBodyFat: 0,
      deltaMuscle: 0,
      message: 'Bạn đã hoàn tất cột mốc đo đầu tiên! Hãy duy trì tập luyện để xem sự bứt phá sau lần đo tiếp theo.',
      baselineMetrics: baseline,
      latestMetrics: latest
    };
  }

  let score = 50; // Base score for having an established baseline

  // 1. Fat reduction calculation (up to +20 pts)
  if (baseFat != null && latestFat != null) {
    if (deltaBodyFat < 0) {
      const fatDrop = Math.abs(deltaBodyFat);
      const fatPts = Math.min(20, Math.round(fatDrop * 4));
      score += fatPts;
    } else if (latestFat >= 10 && latestFat <= 20) {
      // In ideal athletic range
      score += 15;
    }
  }

  // 2. Muscle increase calculation (up to +20 pts)
  if (baseMuscle != null && latestMuscle != null) {
    if (deltaMuscle > 0) {
      const muscleGain = deltaMuscle;
      const musclePts = Math.min(20, Math.round((muscleGain / 0.5) * 5));
      score += musclePts;
    }
  }

  // 3. Consistency score (up to +10 pts)
  if (totalAssessments >= 3) {
    score += 10;
  } else if (totalAssessments >= 2) {
    score += 5;
  }

  // 4. Coach Rating & Effort bonus (up to +10 pts)
  const ratedAssessments = sorted.filter(a => a.performanceRating || a.attendanceRating);
  if (ratedAssessments.length > 0) {
    const avgRating = ratedAssessments.reduce((acc, curr) => {
      const perf = curr.performanceRating || 5;
      const att = curr.attendanceRating || 5;
      return acc + (perf + att) / 2;
    }, 0) / ratedAssessments.length;

    if (avgRating >= 4.5) {
      score += 10;
    } else if (avgRating >= 3.8) {
      score += 7;
    } else if (avgRating >= 3.0) {
      score += 4;
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine Tier and Badge
  let tier = 'BRONZE';
  let tierName = 'Khởi Động Nền Tảng';
  let badgeColor = 'text-amber-600 bg-amber-600/10 border-amber-600/30';
  let message = 'Bạn đang giữ nhịp độ ổn định. Hãy kiên trì theo giáo án của HLV để tạo bước nhảy vọt!';

  if (score >= 85) {
    tier = 'DIAMOND';
    tierName = 'Bứt Phá Thần Tốc';
    badgeColor = 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';
    message = 'Xuất sắc! Cơ thể bạn đang chuyển biến ngoạn mục với tỷ lệ giảm mỡ và tăng cơ cực kỳ ấn tượng!';
  } else if (score >= 70) {
    tier = 'GOLD';
    tierName = 'Tiến Bộ Vượt Bậc';
    badgeColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    message = 'Tiến độ rất tốt! Bạn đã có sự cải thiện rõ rệt về thể chất và chỉ số cơ mỡ.';
  } else if (score >= 55) {
    tier = 'SILVER';
    tierName = 'Kiên Trì Bền Bỉ';
    badgeColor = 'text-slate-300 bg-slate-400/15 border-slate-400/30';
    message = 'Duy trì rất đều đặn! Tiếp tục siết chặt dinh dưỡng và tăng cường bài tập để nâng cao thể lực.';
  }

  return {
    score,
    tier,
    tierName,
    badgeColor,
    totalAssessments,
    deltaWeight,
    deltaBodyFat,
    deltaMuscle,
    message,
    baselineMetrics: baseline,
    latestMetrics: latest
  };
};

/**
 * Generates coordinate scales, points, and SVG paths for multi-series line chart.
 */
export const generateTransformationSvgData = (
  assessments,
  metricType = 'ALL',
  width = 600,
  height = 240
) => {
  if (!Array.isArray(assessments) || assessments.length === 0) {
    return null;
  }

  const sorted = [...assessments].sort((a, b) => {
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  const padding = { top: 30, right: 30, bottom: 40, left: 45 };
  const chartWidth = Math.max(100, width - padding.left - padding.right);
  const chartHeight = Math.max(80, height - padding.top - padding.bottom);

  // Extract all numeric values across metrics to find suitable min & max bounds
  const fatVals = sorted.map(a => parseFloat(a.bodyFatPercentage)).filter(v => !isNaN(v) && v > 0);
  const muscleVals = sorted.map(a => parseFloat(a.muscleMass)).filter(v => !isNaN(v) && v > 0);
  const weightVals = sorted.map(a => parseFloat(a.weight)).filter(v => !isNaN(v) && v > 0);

  let allVals = [];
  if (metricType === 'FAT_MUSCLE') {
    allVals = [...fatVals, ...muscleVals];
  } else if (metricType === 'WEIGHT') {
    allVals = [...weightVals];
  } else {
    allVals = [...fatVals, ...muscleVals, ...weightVals];
  }

  if (allVals.length === 0) allVals = [20, 50, 80];

  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const minVal = Math.max(0, Math.floor(rawMin - 5));
  const maxVal = Math.ceil(rawMax + 5);
  const valRange = Math.max(1, maxVal - minVal);

  const n = sorted.length;
  const xStep = n > 1 ? chartWidth / (n - 1) : chartWidth / 2;

  const points = sorted.map((item, idx) => {
    const x = n > 1 ? padding.left + idx * xStep : padding.left + chartWidth / 2;

    const fat = parseFloat(item.bodyFatPercentage);
    const muscle = parseFloat(item.muscleMass);
    const weight = parseFloat(item.weight);

    const calcY = (val) => {
      if (isNaN(val) || val == null) return null;
      const normalized = (val - minVal) / valRange;
      return padding.top + chartHeight - normalized * chartHeight;
    };

    const d = new Date(item.createdAt || Date.now());
    const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
    const fullDate = d.toLocaleDateString('vi-VN');

    return {
      index: idx,
      assessmentId: item.assessmentId,
      dateLabel,
      fullDate,
      coachName: item.coachName || 'Huấn luyện viên',
      x,
      yFat: calcY(fat),
      yMuscle: calcY(muscle),
      yWeight: calcY(weight),
      fat: !isNaN(fat) ? fat : null,
      muscle: !isNaN(muscle) ? muscle : null,
      weight: !isNaN(weight) ? weight : null,
      feedbackNote: item.feedbackNote,
      recommendation: item.recommendation
    };
  });

  const buildPath = (key) => {
    const valid = points.filter(p => p[key] != null);
    if (valid.length === 0) return '';
    if (valid.length === 1) return `M ${valid[0].x} ${valid[0][key]}`;
    return valid.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p[key].toFixed(1)}`).join(' ');
  };

  const buildAreaPath = (linePath, key) => {
    const valid = points.filter(p => p[key] != null);
    if (!linePath || valid.length < 2) return '';
    const bottomY = padding.top + chartHeight;
    const firstX = valid[0].x.toFixed(1);
    const lastX = valid[valid.length - 1].x.toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const fatLine = buildPath('yFat');
  const muscleLine = buildPath('yMuscle');
  const weightLine = buildPath('yWeight');

  // Generate 4-5 horizontal Y grid lines
  const gridLines = [];
  const gridSteps = 4;
  for (let i = 0; i <= gridSteps; i++) {
    const value = Math.round(minVal + (valRange * i) / gridSteps);
    const y = padding.top + chartHeight - (i / gridSteps) * chartHeight;
    gridLines.push({ y, value });
  }

  return {
    width,
    height,
    padding,
    chartWidth,
    chartHeight,
    points,
    gridLines,
    paths: {
      fatLine,
      fatArea: buildAreaPath(fatLine, 'yFat'),
      muscleLine,
      muscleArea: buildAreaPath(muscleLine, 'yMuscle'),
      weightLine,
      weightArea: buildAreaPath(weightLine, 'yWeight')
    }
  };
};

/**
 * Formats a clean, high-converting summary message to copy-paste directly into Zalo or Email.
 */
export const formatZaloSummary = (student, scoreResult, coachNote = '') => {
  const name = student?.fullName || 'Hội viên';
  const score = scoreResult?.score || 0;
  const tier = scoreResult?.tierName || 'Khởi Động';
  const deltaW = scoreResult?.deltaWeight || 0;
  const deltaF = scoreResult?.deltaBodyFat || 0;
  const deltaM = scoreResult?.deltaMuscle || 0;
  const latest = scoreResult?.latestMetrics || {};

  const wStr = deltaW > 0 ? `+${deltaW}kg` : `${deltaW}kg`;
  const fStr = deltaF > 0 ? `+${deltaF}%` : `${deltaF}%`;
  const mStr = deltaM > 0 ? `+${deltaM}kg` : `${deltaM}kg`;

  return [
    `🏋️ BÁO CÁO TIẾN ĐỘ THỂ TRẠNG - NEXUS SPORTS CENTER 🏋️`,
    `----------------------------------------`,
    `👤 Học viên: ${name}`,
    `⭐ Điểm Cải Thiện Thể Chất (FPS): ${score}/100 [Hạng ${tier}]`,
    `📊 Biến đổi cơ thể từ mốc đầu tiên:`,
    `   • Cân nặng: ${wStr} (Hiện tại: ${latest.weight || '--'} kg)`,
    `   • Tỷ lệ mỡ (Fat): ${fStr} (Hiện tại: ${latest.bodyFatPercentage || '--'}%)`,
    `   • Khối lượng cơ: ${mStr} (Hiện tại: ${latest.muscleMass || '--'} kg)`,
    coachNote ? `💬 Lời khuyên HLV: ${coachNote}` : '',
    `----------------------------------------`,
    `🔥 Hãy tiếp tục duy trì tinh thần tập luyện bứt phá cùng NEXUS!`
  ].filter(Boolean).join('\n');
};

/**
 * Generates an A4 standard, high-resolution printable HTML report card.
 */
export const generatePrintableReportHtml = (
  student,
  assessments = [],
  scoreResult = {},
  coachInfo = {}
) => {
  const name = student?.fullName || 'Học viên NEXUS';
  const email = student?.email || 'N/A';
  const phone = student?.phone || 'N/A';
  const coachName = coachInfo?.name || 'Ban Huấn Luyện NEXUS';
  const reportDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const score = scoreResult?.score || 50;
  const tierName = scoreResult?.tierName || 'Khởi Động Nền Tảng';
  const base = scoreResult?.baselineMetrics || {};
  const latest = scoreResult?.latestMetrics || {};

  const deltaW = scoreResult?.deltaWeight || 0;
  const deltaF = scoreResult?.deltaBodyFat || 0;
  const deltaM = scoreResult?.deltaMuscle || 0;

  const wDeltaStr = deltaW <= 0 ? `${deltaW} kg` : `+${deltaW} kg`;
  const fDeltaStr = deltaF <= 0 ? `${deltaF}%` : `+${deltaF}%`;
  const mDeltaStr = deltaM >= 0 ? `+${deltaM} kg` : `${deltaM} kg`;

  const coachFeedback = latest.feedbackNote || 'Học viên chăm chỉ, giữ vững phong độ tập luyện và dinh dưỡng.';
  const recommendation = latest.recommendation || 'Bổ sung đủ nước, ngủ đủ 7-8 tiếng và duy trì lịch tập 3-4 buổi/tuần.';

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Nexus_Fitness_Report_${name.replace(/\s+/g, '_')}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }
          .header-banner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .report-tag {
            background: #0f172a;
            color: #ffffff;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .trainee-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 16px;
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 12px;
          }
          .field-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
          }
          .field-val {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .fps-banner {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            border-radius: 10px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
          }
          .fps-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #94a3b8;
          }
          .fps-score {
            font-size: 38px;
            font-weight: 900;
            color: #38bdf8;
            line-height: 1;
            margin: 4px 0;
          }
          .fps-badge {
            background: rgba(56, 189, 248, 0.2);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.4);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
          }
          .comparison-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 10.5px;
            text-transform: uppercase;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
          }
          .comparison-table td {
            padding: 9px 12px;
            font-size: 12px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }
          .bold {
            font-weight: 700;
          }
          .positive {
            color: #059669;
            font-weight: 700;
          }
          .neutral {
            color: #0284c7;
            font-weight: 700;
          }
          .notes-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 22px;
          }
          .note-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            background: #fafafa;
          }
          .note-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #475569;
            margin-bottom: 6px;
          }
          .note-content {
            font-size: 11.5px;
            color: #334155;
            line-height: 1.5;
            font-style: italic;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
          }
          .sig-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #0f172a;
          }
          .sig-subtitle {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 2px;
            margin-bottom: 40px;
          }
          .sig-name {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
          }
          .footer-text {
            text-align: center;
            font-size: 9.5px;
            color: #94a3b8;
            margin-top: 20px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <!-- Header Banner -->
          <div class="header-banner">
            <div>
              <div class="brand-title">NEXUS SPORTS CENTER</div>
              <div class="brand-subtitle">BODY TRANSFORMATION & FITNESS PROGRESS REPORT</div>
            </div>
            <div class="report-tag">BÁO CÁO CHÍNH THỨC</div>
          </div>

          <!-- Trainee & Date Info -->
          <div class="trainee-card">
            <div>
              <div class="field-label">Học Viên</div>
              <div class="field-val">${name}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Email: ${email} • SĐT: ${phone}</div>
            </div>
            <div style="text-align: right;">
              <div class="field-label">Ngày Lập Báo Cáo</div>
              <div class="field-val">${reportDate}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">HLV: ${coachName}</div>
            </div>
          </div>

          <!-- FPS Score Card -->
          <div class="fps-banner">
            <div>
              <div class="fps-title">Chỉ Số Cải Thiện Thể Chất (FPS)</div>
              <div class="fps-score">${score} <span style="font-size: 18px; color: #94a3b8;">/ 100</span></div>
              <div style="font-size: 11px; color: #cbd5e1;">Được tính toán dựa trên mức giảm mỡ, tăng cơ nạc và tính đều đặn qua các tháng.</div>
            </div>
            <div style="text-align: right;">
              <div class="fps-badge">${tierName}</div>
            </div>
          </div>

          <!-- InBody Metrics Comparison Table -->
          <div class="section-title">📊 Bảng Đối Chiếu Chỉ Số Thể Hình (InBody Before & After)</div>
          <table class="comparison-table">
            <thead>
              <tr>
                <th>Chỉ Số Đo Đạc</th>
                <th>Mốc Khởi Đầu</th>
                <th>Mốc Hiện Tại</th>
                <th>Mức Biến Đổi (Δ)</th>
                <th>Đánh Giá Đạt Chuẩn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="bold">Cân nặng (Weight)</td>
                <td>${base.weight != null ? base.weight + ' kg' : '--'}</td>
                <td class="bold">${latest.weight != null ? latest.weight + ' kg' : '--'}</td>
                <td class="neutral">${wDeltaStr}</td>
                <td>Mức độ kiểm soát trọng lượng</td>
              </tr>
              <tr>
                <td class="bold">Tỷ lệ mỡ (Body Fat)</td>
                <td>${base.bodyFatPercentage != null ? base.bodyFatPercentage + '%' : '--'}</td>
                <td class="bold" style="color: #f59e0b;">${latest.bodyFatPercentage != null ? latest.bodyFatPercentage + '%' : '--'}</td>
                <td class="positive">${fDeltaStr}</td>
                <td>Siết cơ & giảm mỡ dưới da</td>
              </tr>
              <tr>
                <td class="bold">Khối lượng cơ (Muscle Mass)</td>
                <td>${base.muscleMass != null ? base.muscleMass + ' kg' : '--'}</td>
                <td class="bold" style="color: #10b981;">${latest.muscleMass != null ? latest.muscleMass + ' kg' : '--'}</td>
                <td class="positive">${mDeltaStr}</td>
                <td>Phát triển sợi cơ nạc</td>
              </tr>
              <tr>
                <td class="bold">Chiều cao (Height)</td>
                <td>${base.height != null ? base.height + ' cm' : '--'}</td>
                <td>${latest.height != null ? latest.height + ' cm' : '--'}</td>
                <td>--</td>
                <td>Khung hình tiêu chuẩn</td>
              </tr>
            </tbody>
          </table>

          <!-- Coach Feedback & Recommendation -->
          <div class="notes-grid">
            <div class="note-box">
              <div class="note-title">💬 Nhận Xét Chi Tiết Của HLV</div>
              <div class="note-content">"${coachFeedback}"</div>
            </div>
            <div class="note-box">
              <div class="note-title">💡 Lời Khuyên & Định Hướng Tiếp Theo</div>
              <div class="note-content">"${recommendation}"</div>
            </div>
          </div>

          <!-- Signatures -->
          <div class="signatures">
            <div>
              <div class="sig-title">HỌC VIÊN XÁC NHẬN</div>
              <div class="sig-subtitle">(Ký và ghi rõ họ tên)</div>
              <div class="sig-name">${name}</div>
            </div>
            <div>
              <div class="sig-title">HUẤN LUYỆN VIÊN PHỤ TRÁCH</div>
              <div class="sig-subtitle">(Ký và xác nhận chỉ số)</div>
              <div class="sig-name">${coachName}</div>
            </div>
          </div>

          <div class="footer-text">
            Bản báo cáo tiến độ thể trạng được phát hành tự động từ Hệ thống Quản trị Thể thao NEXUS Sports Center.
          </div>
        </div>
      </body>
    </html>
  `;
};
