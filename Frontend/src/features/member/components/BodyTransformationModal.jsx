import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  X,
  TrendingUp,
  Award,
  Sparkles,
  Scale,
  Flame,
  Dumbbell,
  Activity,
  Calendar,
  ChevronRight,
  Info,
  Clock,
  User,
  HeartPulse
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore.js';
import {
  calculateFitnessProgressScore,
  getBmiInfo,
  generateTransformationSvgData
} from '../bodyTransformationUtils.js';
import './bodyTransformation.css';

const API_BASE = 'http://localhost:8080/api/v1';

const BodyTransformationModal = ({
  isOpen,
  onClose,
  trainee = null,
  initialAssessments = null,
  coachInfo = null,
  isCoachView = false
}) => {
  useLanguage();

  const [assessments, setAssessments] = useState(initialAssessments || []);
  const [loading, setLoading] = useState(false);
  const [metricType, setMetricType] = useState('ALL'); // 'ALL' | 'FAT_MUSCLE' | 'WEIGHT'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load assessments when opened
  useEffect(() => {
    if (isOpen) {
      if (initialAssessments && initialAssessments.length > 0) {
        setAssessments(initialAssessments);
      } else {
        fetchAssessments();
      }
    }
  }, [isOpen, trainee]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let res;
      if (isCoachView && trainee?.userId) {
        res = await axios.get(`${API_BASE}/coach/assessments/student/${trainee.userId}`, { headers });
      } else {
        res = await axios.get(`${API_BASE}/member/assessments`, { headers });
      }
      setAssessments(res.data || []);
    } catch (err) {
      console.error('Error fetching assessments for transformation chart:', err);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculation results
  const scoreResult = calculateFitnessProgressScore(assessments);
  const svgData = generateTransformationSvgData(assessments, metricType, 680, 240);

  const latest = scoreResult.latestMetrics || {};
  const bmiInfo = getBmiInfo(latest.weight, latest.height);

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'DIAMOND':
        return 'transformation-badge-diamond';
      case 'GOLD':
        return 'transformation-badge-gold';
      case 'SILVER':
        return 'transformation-badge-silver';
      default:
        return 'transformation-badge-bronze';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-4xl transformation-modal-card rounded-3xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text)]">
                  {t('Biểu Đồ Tiến Trình Thể Trạng & Điểm FPS')}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  {t('Body Visualizer')}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                {trainee?.fullName ? (
                  <>
                    {t('Học viên:')} <strong className="text-[var(--text)]">{trainee.fullName}</strong>
                    {trainee?.userId ? ` (#${trainee.userId})` : ''} • {scoreResult.totalAssessments} {t('lần đo InBody')}
                  </>
                ) : (
                  t('Trực quan hóa quá trình tăng cơ, giảm mỡ và đánh giá mức độ cải thiện thể chất.')
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer"
            title={t('Đóng')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODAL BODY ================= */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-24 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>{t('Đang tải dữ liệu thể trạng và biểu đồ InBody...')}</span>
            </div>
          ) : assessments.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface-hover)]/30 border border-dashed border-[var(--border)] flex flex-col items-center gap-3">
              <Activity className="w-12 h-12 text-[var(--text-muted)] opacity-50" />
              <h3 className="text-base font-bold text-[var(--text)]">
                {t('Chưa Có Dữ Liệu Đo InBody')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md">
                {t('Học viên chưa có lượt đánh giá nào kèm chỉ số InBody (Cân nặng, Tỷ lệ mỡ, Khối lượng cơ). HLV hãy thực hiện đánh giá để kích hoạt biểu đồ tiến độ.')}
              </p>
            </div>
          ) : (
            <>
              {/* 1. FPS HERO SCORE BANNER */}
              <div className="fps-hero-banner rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-center gap-5">
                  <div className="relative w-24 h-24 rounded-2xl bg-slate-900/80 border border-sky-500/30 flex flex-col items-center justify-center p-2 shadow-inner shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                      FPS
                    </span>
                    <span className="fps-score-number text-3xl sm:text-4xl font-black">
                      {scoreResult.score}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      / 100 {t('điểm')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getTierBadgeClass(scoreResult.tier)}`}>
                        <Award className="w-3.5 h-3.5" />
                        {t(scoreResult.tierName)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {scoreResult.totalAssessments} {t('mốc đo đạc')}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {t('Chỉ Số Cải Thiện Thể Chất (Fitness Progress Score)')}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      {t(scoreResult.message)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. FOUR TRANSFORMATION DELTA CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Weight Card */}
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                    {t('Cân nặng')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                      {latest.weight != null ? `${latest.weight} kg` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t('So với mốc đầu:')}</span>
                    <strong className={scoreResult.deltaWeight <= 0 ? 'text-blue-500' : 'text-amber-500'}>
                      {scoreResult.deltaWeight <= 0 ? `${scoreResult.deltaWeight} kg` : `+${scoreResult.deltaWeight} kg`}
                    </strong>
                  </div>
                </div>

                {/* Body Fat Card */}
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    {t('Tỷ lệ mỡ (Fat)')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-amber-500">
                      {latest.bodyFatPercentage != null ? `${latest.bodyFatPercentage}%` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t('Biến đổi:')}</span>
                    <strong className={scoreResult.deltaBodyFat <= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                      {scoreResult.deltaBodyFat <= 0 ? `${scoreResult.deltaBodyFat}%` : `+${scoreResult.deltaBodyFat}%`}
                    </strong>
                  </div>
                </div>

                {/* Muscle Mass Card */}
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                    {t('Khối lượng cơ')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-emerald-500">
                      {latest.muscleMass != null ? `${latest.muscleMass} kg` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t('Tăng trưởng:')}</span>
                    <strong className={scoreResult.deltaMuscle >= 0 ? 'text-emerald-500' : 'text-amber-500'}>
                      {scoreResult.deltaMuscle >= 0 ? `+${scoreResult.deltaMuscle} kg` : `${scoreResult.deltaMuscle} kg`}
                    </strong>
                  </div>
                </div>

                {/* BMI Card */}
                <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-purple-500" />
                    {t('Chỉ số BMI')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl sm:text-2xl font-bold text-[var(--text)]">
                      {bmiInfo ? bmiInfo.bmi : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10.5px]">
                    {bmiInfo ? (
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${bmiInfo.color}`}>
                        {bmiInfo.label}
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic">{t('Cần chiều cao')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. MULTI-SERIES SVG LINE CHART */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col gap-4">
                {/* Chart Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-500" />
                      <span>{t('Tiến Trình Biến Đổi Theo Thời Gian')}</span>
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {t('Rê chuột hoặc chạm vào từng điểm trên đường biểu đồ để xem chi tiết mốc đo.')}
                    </span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-[var(--surface-hover)] p-1 rounded-xl border border-[var(--border)] self-start sm:self-auto">
                    <button
                      onClick={() => setMetricType('ALL')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        metricType === 'ALL'
                          ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {t('Tất cả')}
                    </button>
                    <button
                      onClick={() => setMetricType('FAT_MUSCLE')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        metricType === 'FAT_MUSCLE'
                          ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {t('Cơ & Mỡ')}
                    </button>
                    <button
                      onClick={() => setMetricType('WEIGHT')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        metricType === 'WEIGHT'
                          ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm font-bold'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {t('Cân nặng')}
                    </button>
                  </div>
                </div>

                {/* Chart Legends */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
                      <span className="text-[var(--text-muted)] font-medium">
                        {t('Tỷ lệ mỡ (%)')}
                      </span>
                    </div>
                  )}

                  {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                      <span className="text-[var(--text-muted)] font-medium">
                        {t('Khối lượng cơ (kg)')}
                      </span>
                    </div>
                  )}

                  {(metricType === 'ALL' || metricType === 'WEIGHT') && (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
                      <span className="text-[var(--text-muted)] font-medium">
                        {t('Cân nặng (kg)')}
                      </span>
                    </div>
                  )}
                </div>

                {/* SVG Visualizer Rendering */}
                {svgData ? (
                  <div className="relative w-full overflow-x-auto pt-2 pb-1">
                    <svg
                      viewBox={`0 0 ${svgData.width} ${svgData.height}`}
                      className="w-full h-auto min-w-[560px] svg-chart-svg overflow-visible"
                    >
                      <defs>
                        {/* Gradient for Fat */}
                        <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Gradient for Muscle */}
                        <linearGradient id="muscleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Gradient for Weight */}
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {svgData.gridLines.map((gl, gIdx) => (
                        <g key={gIdx}>
                          <line
                            x1={svgData.padding.left}
                            y1={gl.y}
                            x2={svgData.width - svgData.padding.right}
                            y2={gl.y}
                            stroke="var(--border)"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                          />
                          <text
                            x={svgData.padding.left - 8}
                            y={gl.y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="var(--text-muted)"
                            fontFamily="sans-serif"
                          >
                            {gl.value}
                          </text>
                        </g>
                      ))}

                      {/* Area fills */}
                      {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && svgData.paths.fatArea && (
                        <path d={svgData.paths.fatArea} fill="url(#fatGradient)" />
                      )}
                      {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && svgData.paths.muscleArea && (
                        <path d={svgData.paths.muscleArea} fill="url(#muscleGradient)" />
                      )}
                      {(metricType === 'ALL' || metricType === 'WEIGHT') && svgData.paths.weightArea && (
                        <path d={svgData.paths.weightArea} fill="url(#weightGradient)" />
                      )}

                      {/* Line paths */}
                      {(metricType === 'ALL' || metricType === 'WEIGHT') && svgData.paths.weightLine && (
                        <path
                          d={svgData.paths.weightLine}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && svgData.paths.muscleLine && (
                        <path
                          d={svgData.paths.muscleLine}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && svgData.paths.fatLine && (
                        <path
                          d={svgData.paths.fatLine}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* X-axis Tick Labels & Data Points */}
                      {svgData.points.map((pt, pIdx) => {
                        const bottomY = svgData.padding.top + svgData.chartHeight;

                        return (
                          <g key={pIdx}>
                            {/* Date Label on X Axis */}
                            <text
                              x={pt.x}
                              y={bottomY + 20}
                              textAnchor="middle"
                              fontSize="11"
                              fill="var(--text-muted)"
                              fontWeight="600"
                            >
                              {pt.dateLabel}
                            </text>

                            {/* Dot for Fat */}
                            {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && pt.yFat != null && (
                              <circle
                                cx={pt.x}
                                cy={pt.yFat}
                                r="5"
                                fill="#f59e0b"
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="svg-data-point"
                                onMouseEnter={(e) => setHoveredPoint({ x: pt.x, y: pt.yFat, point: pt, type: 'fat' })}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            )}

                            {/* Dot for Muscle */}
                            {(metricType === 'ALL' || metricType === 'FAT_MUSCLE') && pt.yMuscle != null && (
                              <circle
                                cx={pt.x}
                                cy={pt.yMuscle}
                                r="5"
                                fill="#10b981"
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="svg-data-point"
                                onMouseEnter={(e) => setHoveredPoint({ x: pt.x, y: pt.yMuscle, point: pt, type: 'muscle' })}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            )}

                            {/* Dot for Weight */}
                            {(metricType === 'ALL' || metricType === 'WEIGHT') && pt.yWeight != null && (
                              <circle
                                cx={pt.x}
                                cy={pt.yWeight}
                                r="5"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="svg-data-point"
                                onMouseEnter={(e) => setHoveredPoint({ x: pt.x, y: pt.yWeight, point: pt, type: 'weight' })}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Interactive Tooltip Card */}
                    {hoveredPoint && (
                      <div
                        className="chart-tooltip-box absolute z-30 p-3 rounded-xl pointer-events-none text-white text-xs space-y-1.5"
                        style={{
                          left: `${Math.min(svgData.width - 180, Math.max(10, hoveredPoint.x - 70))}px`,
                          top: `${Math.max(10, hoveredPoint.y - 110)}px`
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-white/20 pb-1 font-bold text-[11px] text-sky-300">
                          <span>{hoveredPoint.point.fullDate}</span>
                          <span className="text-[10px] text-slate-300">{hoveredPoint.point.coachName}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          {hoveredPoint.point.fat != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-amber-400 font-semibold">{t('Tỷ lệ mỡ:')}</span>
                              <strong className="text-white">{hoveredPoint.point.fat}%</strong>
                            </div>
                          )}
                          {hoveredPoint.point.muscle != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-emerald-400 font-semibold">{t('Khối lượng cơ:')}</span>
                              <strong className="text-white">{hoveredPoint.point.muscle} kg</strong>
                            </div>
                          )}
                          {hoveredPoint.point.weight != null && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sky-400 font-semibold">{t('Cân nặng:')}</span>
                              <strong className="text-white">{hoveredPoint.point.weight} kg</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* 4. MEASUREMENT LOGS TABLE */}
              <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {t('Nhật Ký Các Đợt Đo InBody Định Kỳ')}
                  </h4>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {assessments.length} {t('bản ghi')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[var(--text)]">
                    <thead className="bg-[var(--surface-hover)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-3.5 py-2.5 rounded-l-lg">{t('Ngày đo')}</th>
                        <th className="px-3.5 py-2.5">{t('Cân nặng')}</th>
                        <th className="px-3.5 py-2.5">{t('Tỷ lệ mỡ')}</th>
                        <th className="px-3.5 py-2.5">{t('Khối lượng cơ')}</th>
                        <th className="px-3.5 py-2.5">{t('Đánh giá HLV')}</th>
                        <th className="px-3.5 py-2.5 rounded-r-lg">{t('Ghi chú')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {assessments.map((a, idx) => {
                        const d = a.createdAt ? new Date(a.createdAt) : null;
                        const dateStr = d ? d.toLocaleDateString(locale()) : '--';

                        return (
                          <tr key={idx} className="hover:bg-[var(--surface-hover)]/60 transition-colors">
                            <td className="px-3.5 py-3 font-semibold">{dateStr}</td>
                            <td className="px-3.5 py-3 font-bold text-[var(--text)]">
                              {a.weight ? `${a.weight} kg` : '--'}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-amber-500">
                              {a.bodyFatPercentage ? `${a.bodyFatPercentage}%` : '--'}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-emerald-500">
                              {a.muscleMass ? `${a.muscleMass} kg` : '--'}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                                {a.performanceRating ? `${a.performanceRating}/5 ⭐` : '--'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-[var(--text-muted)] max-w-xs truncate">
                              {a.feedbackNote || a.recommendation || '--'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-6 py-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between sticky bottom-0 z-20">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('Dữ liệu được cập nhật tự động sau mỗi lần đo của Huấn luyện viên.')}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
          >
            {t('Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BodyTransformationModal;
