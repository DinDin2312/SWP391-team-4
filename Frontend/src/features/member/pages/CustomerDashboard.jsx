import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import CancelClassPolicyModal from '../components/CancelClassPolicyModal';
import MemberAssessmentsModal from '../components/MemberAssessmentsModal';
import SelfAssessmentModal from '../components/SelfAssessmentModal';
import { formatDate } from '../../../utils/displayFormat';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { memberService } from '../services/memberService';
import {
  Dumbbell,
  QrCode,
  ShieldCheck,
  Calendar,
  Activity,
  Flame,
  Search,
  Download,
  ChevronRight, ChevronLeft,
  Radio,
  Clock,
  MapPin,
  User, TrendingUp,
  X, Scale, Sparkles, Star, Award, MessageSquare, PlusCircle,
} from 'lucide-react';

const CustomerDashboard = () => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, classId: null });
  const [qrModal, setQrModal] = useState({ isOpen: false, session: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selfModalOpen, setSelfModalOpen] = useState(false);

// Status for Membership Card
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

// Status for Upcoming Schedule
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [memberTier, setMemberTier] = useState('MEMBER');
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [membershipData, bookingsData, checkInsData, recentData, profileData, assessmentsData] = await Promise.all([
        memberService.getMyMembership(),
        memberService.getUpcomingBookings(),
        memberService.getTotalCheckIns(),
        memberService.getRecentActivities(),
        memberService.getUserProfile(),
        memberService.getAssessments().catch(() => [])
      ]);

      setMembership(membershipData || null);
      setUpcomingBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTotalCheckIns(typeof checkInsData === 'number' ? checkInsData : Number(checkInsData) || 0);
      if (profileData) {
        setLoyaltyPoints(profileData.loyaltyPoints || 0);
        setMemberTier(profileData.memberTier || 'MEMBER');
      }
      setRecentActivities(Array.isArray(recentData) ? recentData : []);
      const aList = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData?.data || []);
      setLatestAssessment(aList.length > 0 ? aList[0] : null);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoadingMembership(false);
      setLoadingBookings(false);
      setLoadingAssessment(false);
    }
  }, []);

// Fetch membership card and schedule data
  React.useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchDashboardData();
    } else {
      setLoadingMembership(false);
      setLoadingBookings(false);
    }
  }, [fetchDashboardData]);

// Get full name from login session
  const fullName = userInfo?.fullName || 'Active Member';

  const getMemberId = (email) => {
    if (!email) return '88204';
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash).toString().substring(0, 5);
  };
  const dynamicMemberId = getMemberId(userInfo?.email);

  const filteredActivities = recentActivities.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const dateStr = log.startTime
      ? new Date(log.startTime).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).toLowerCase()
      : '';
    return (
      (log.className && log.className.toLowerCase().includes(q)) ||
      (log.coachName && log.coachName.toLowerCase().includes(q)) ||
      (log.status && log.status.toLowerCase().includes(q)) ||
      dateStr.includes(q)
    );
  });

  const handleExportCsv = () => {
    if (!filteredActivities.length) return;
    const headers = ['Date & Time', 'Activity / Facility', 'Trainer / Zone', 'Duration (min)', 'Status', 'Calories (kcal)', 'Avg HR (bpm)'];
    const rows = filteredActivities.map((log) => {
      const dt = log.startTime ? new Date(log.startTime).toLocaleString(locale()) : '';
      return [
        `"${dt.replace(/"/g, '""')}"`,
        `"${(log.className || '').replace(/"/g, '""')}"`,
        `"${(log.coachName || '').replace(/"/g, '""')}"`,
        log.durationMinutes ?? '',
        `"${(log.status || '').replace(/"/g, '""')}"`,
        log.calories ?? '',
        log.avgHr ?? ''
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nexus-activity-log-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getBmiData = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    const hMeters = Number(height) / 100;
    const bmi = (Number(weight) / (hMeters * hMeters)).toFixed(1);
    let status = t('Normal Weight');
    let badgeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

    if (bmi < 18.5) {
      status = t('Underweight');
      badgeColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    } else if (bmi >= 23 && bmi < 25) {
      status = t('Overweight');
      badgeColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (bmi >= 25) {
      status = t('Needs Fat Loss');
      badgeColor = 'text-red-500 bg-red-500/10 border-red-500/20';
    }
    return { bmi, status, badgeColor };
  };
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-[var(--text)]">{t("Member Dashboard")}</h1>


        {/* ================= ROW 1: 4 STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Package */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Active Package")}</span>
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              {loadingMembership ? (
                <h3 className="text-lg font-bold text-[var(--text-muted)] leading-snug animate-pulse">{t("Loading...")}</h3>
              ) : membership ? (
                <h3 className="text-lg font-bold text-[var(--text)] leading-snug">{membership.packageName}</h3>
              ) : (
                <h3 className="text-lg font-bold text-[var(--danger-text)] leading-snug">{t("No Active Package")}</h3>
              )}
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-[var(--text)]">
                  {t(membership ? membership.remainingDays : 0)} <span className="text-xs font-medium text-[var(--text-muted)]">{t("days left")}</span>
                </span>
                <span className={`text-xs font-bold ${membership && membership.remainingDays > 0 ? 'text-[var(--success-text)]' : 'text-[var(--danger-text)]'}`}>
                  {membership ? codeLabel(membership.status) : t('N/A')}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: membership ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--text-muted)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
                <span>{t("Valid till:")}{' '}{t(membership?.endDate ? formatDate(membership.endDate) : t('Unknown'))}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Classes Attended */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Classes Attended")}</span>
                <div className="w-7 h-7 rounded-lg bg-[var(--success-soft)] text-[var(--success-text)] flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">{t("Monthly Cycle")}</h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-[var(--text)]">
                  {totalCheckIns} <span className="text-xs font-medium text-[var(--text-muted)]">{t("Sessions")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold mt-1">
                  {totalCheckIns > 0 ? (
                    <span className="flex items-center gap-1 text-[var(--success-text)]">
                      <TrendingUp className="w-3.5 h-3.5" /> +{totalCheckIns * 5}% {t("vs last month", { defaultValue: "vs last month" })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[var(--text-muted)] font-medium">
                      {t("No data this month", { defaultValue: "No data this month" })}
                    </span>
                  )}
                </div>
              </div>
              {/* Mini Spark Bar Graph */}
              <div className="flex items-end gap-1 h-10 pb-1">
                <span className={`w-1.5 rounded-t h-4 ${totalCheckIns > 0 ? 'bg-[var(--border)]' : 'bg-[var(--border)]/50'}`}></span>
                <span className={`w-1.5 rounded-t h-6 ${totalCheckIns > 0 ? 'bg-[var(--border)]' : 'bg-[var(--border)]/50'}`}></span>
                <span className={`w-1.5 rounded-t h-5 ${totalCheckIns > 0 ? 'bg-[var(--success-soft)]' : 'bg-[var(--border)]/50'}`}></span>
                <span className={`w-1.5 rounded-t h-8 ${totalCheckIns > 0 ? 'bg-[var(--success-hover)]' : 'bg-[var(--border)]/50'}`}></span>
                <span className={`w-1.5 rounded-t h-10 ${totalCheckIns > 0 ? 'bg-[var(--success-hover)]' : 'bg-[var(--border)]/50'}`}></span>
              </div>
            </div>
          </div>

          {/* Card 3: Upcoming Bookings (Dynamic) */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Bookings")}</span>
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-[var(--text)]">{t("Upcoming Classes")}</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-[var(--text)]">
                {upcomingBookings.length} <span className="text-xs font-medium text-[var(--text-muted)]">{t("Reserved")}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-muted)]">
                <Search className="w-3 h-3 text-[var(--primary)]" />
                <span className="truncate">{t("Check schedule below")}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Nexus Rewards */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Loyalty Program")}</span>
                  <div className="w-7 h-7 rounded-lg bg-[var(--warning-soft)] text-[var(--warning-text)] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-[var(--text)]">{t("Nexus Rewards")}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-[var(--text)]">
                    {loyaltyPoints} <span className="text-xs font-medium text-[var(--text-muted)]">{t("Pts")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--warning-text)] mt-1 font-semibold">
                    <span>{t(memberTier === 'PLATINUM' ? t('15% Off all purchases') : memberTier === 'GOLD' ? t('10% Off all purchases') : memberTier === 'SILVER' ? t('5% Off all purchases') : t('Reach 500 Pts for 5% Off'))}</span>
                  </div>
                </div>
                {/* Circular Indicator */}
                <div className="w-11 h-11 rounded-full border-2 border-amber-500/30 flex items-center justify-center font-bold text-[10px] text-[var(--warning-text)] shadow-lg shadow-amber-500/10">
                  {t(memberTier === 'PLATINUM' ? t('PLAT') : memberTier === 'MEMBER' ? t('NEW') : memberTier)}
                </div>
              </div>
            </div>
          </div>

        {/* ================= ROW 1.5: INBODY & BODY METRICS (CHỈ SỐ THỂ TRẠNG) ================= */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          {loadingAssessment ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)] animate-pulse">
              {t("Loading body metrics...")}
            </div>
          ) : latestAssessment ? (
            <div className="flex flex-col gap-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">
                        {t("Latest InBody & Body Composition")}
                      </h2>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Sparkles className="w-3 h-3" />
                        {t("Latest Update")}
                      </span>
                    </div>
                    {(() => {
                      const isSelf = latestAssessment.assessmentTitle?.includes("tự") || 
                                     latestAssessment.assessmentTitle?.includes("Self") || 
                                     latestAssessment.coachId === latestAssessment.userId;
                      return (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 flex flex-wrap items-center gap-x-2">
                          <span>{t("Measured on:")} <strong className="text-[var(--text)]">{new Date(latestAssessment.createdAt).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></span>
                          <span>•</span>
                          {isSelf ? (
                            <span>{t("Recorded by:")} <strong className="text-amber-500">{t("Self-Recorded")}</strong></span>
                          ) : (
                            <span>{t("Coach:")} <strong className="text-[var(--text)]">{latestAssessment.coachName || t('Coach')}</strong></span>
                          )}
                          {!isSelf && latestAssessment.className && (
                            <>
                              <span>•</span>
                              <span>{t("Class:")} <strong className="text-[var(--text)]">{latestAssessment.className}</strong></span>
                            </>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelfModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{t("Update Metrics")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssessmentModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] hover:border-amber-500/40 hover:text-amber-500 text-xs font-semibold text-[var(--text)] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("View All Assessments")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* Weight */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t("Weight")}</span>
                    <Scale className="w-3.5 h-3.5 text-[var(--primary)]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[var(--text)]">{latestAssessment.weight || '--'}</span>
                    <span className="text-xs font-medium text-[var(--text-muted)]">kg</span>
                  </div>
                </div>

                {/* Height */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t("Height")}</span>
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[var(--text)]">{latestAssessment.height || '--'}</span>
                    <span className="text-xs font-medium text-[var(--text-muted)]">cm</span>
                  </div>
                </div>

                {/* Body Fat */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t("Body Fat (Fat %)")}</span>
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-500">{latestAssessment.bodyFatPercentage ?? '--'}</span>
                    <span className="text-xs font-medium text-[var(--text-muted)]">%</span>
                  </div>
                </div>

                {/* Muscle Mass */}
                <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                    <span>{t("Muscle Mass")}</span>
                    <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-500">{latestAssessment.muscleMass ?? '--'}</span>
                    <span className="text-xs font-medium text-[var(--text-muted)]">kg</span>
                  </div>
                </div>

                {/* BMI */}
                {(() => {
                  const bmiData = getBmiData(latestAssessment.weight, latestAssessment.height);
                  return (
                    <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col justify-between col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)]">
                        <span>{t("BMI Index")}</span>
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      </div>
                      <div className="mt-2 flex items-baseline justify-between gap-1">
                        <span className="text-2xl font-black text-[var(--text)]">{bmiData ? bmiData.bmi : '--'}</span>
                        {bmiData && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${bmiData.badgeColor}`}>
                            {bmiData.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Assessment Note & Feedback Box */}
              {(() => {
                const isSelf = latestAssessment.assessmentTitle?.includes("tự") || 
                               latestAssessment.assessmentTitle?.includes("Self") || 
                               latestAssessment.coachId === latestAssessment.userId;

                if (!latestAssessment.feedbackNote && !latestAssessment.recommendation) return null;

                return (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                        {isSelf ? t("Personal Notes & Targets") : t("Coach Feedback & Recommendations")}
                      </span>
                      {!isSelf && latestAssessment.performanceRating && (
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= latestAssessment.performanceRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-[var(--border)]'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {latestAssessment.feedbackNote && (
                      <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed italic pl-1 border-l-2 border-amber-500/40">
                        "{latestAssessment.feedbackNote}"
                      </p>
                    )}
                    {!isSelf && latestAssessment.recommendation && (
                      <div className="text-xs text-[var(--text-muted)] flex items-start gap-1.5 pt-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong className="text-[var(--text)] font-semibold">{t("Next Session Goal:")}</strong> {latestAssessment.recommendation}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Empty State for Member with no measurements yet */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text)]">{t("Track Body Metrics & InBody")}</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xl">
                    {upcomingBookings.length > 0 ? (
                      t("You have scheduled classes. The assigned coach will measure your InBody and update your assessment after your workout!")
                    ) : (
                      t("No body metrics recorded yet. Join a class or contact your trainer for InBody measurements and a custom workout plan!")
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setSelfModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-95 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{t("Self-Log InBody")}</span>
                </button>
                {upcomingBookings.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate('/member/schedule')}
                    className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t("View Class Schedule")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/member/book-class')}
                    className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--border)] text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t("Book Class for Measurement")}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= ROW 2: SCHEDULE (2/3) + PASS & ACTIONS (1/3) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Schedule (Left 2 Columns) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between">
            <div>
              {/* Header & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-[var(--text)]">{t("Upcoming Schedule")}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold">{upcomingBookings.length}{' '}{t("Active")}</span>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold">
                  {[
                    { key: 'all', label: `All (${upcomingBookings.length})` },
                    { key: 'group', label: t('Group Classes') },
                    { key: 'courts', label: t('Smart Courts') },
                    { key: 'recovery', label: t('Recovery') },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeTab === tab.key
                          ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-[var(--shadow)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      {t(tab.label)}
                    </button>
                  ))}
                </div>
              </div>

                {/* List of training sessions */}
              <div className="space-y-3">
                {loadingBookings ? (
    <div className="text-[var(--text-muted)] text-sm py-4 text-center animate-pulse">{t("Loading upcoming classes...")}</div>
  ) : upcomingBookings.length === 0 ? (
    <div className="text-[var(--text-muted)] text-sm py-4 text-center">{t("No upcoming classes scheduled.")}</div>
  ) : (
    upcomingBookings.filter(item => {
      if (activeTab === 'all') return true;
      const name = item.className.toLowerCase();
      if (activeTab === 'group') return name.includes('yoga') || name.includes('gym') || name.includes('hiit') || name.includes('cơ') || name.includes('fitness');
      if (activeTab === 'courts') return name.includes('court') || name.includes('sân') || name.includes('tennis') || name.includes('badminton') || name.includes('cầu lông') || name.includes('bóng');
      if (activeTab === 'recovery') return name.includes('recovery') || name.includes('hồi phục') || name.includes('stretching') || name.includes('pilates') || name.includes('spa');
      return true;
    }).map((item) => {
      const dateObj = new Date(item.startTime);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const badge = isToday ? t("TODAY") : dateObj.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase();
      const time = dateObj.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", hour12: false });

      return (
        <div
          key={item.bookingId}
          className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[var(--border)] transition-colors"
        >
          <div className="flex items-start sm:items-center gap-4">
                    {/* Date & Time Box */}
            <div className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-center min-w-[70px]">
              <span className="text-[10px] font-bold text-[var(--primary)] tracking-wider block">{badge}</span>
              <span className="text-base font-extrabold text-[var(--text)] leading-tight">{time}</span>
            </div>

                    {/* Session Details */}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[var(--text)]">{item.className}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--success-soft)]">{t("&bull;")}{' '}{codeLabel(item.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{item.coachName}</span>
                </div>
                <span>{t("&bull;")}</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{item.roomName}</span>
                </div>
                <span>{t("&bull;")}</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{item.durationMinutes}{' '}{t("min")}</span>
                </div>
              </div>
            </div>
          </div>

                    {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button onClick={() => setQrModal({ isOpen: true, session: item })} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold transition-colors">
              <QrCode className="w-3.5 h-3.5" />{t("Check-in")}</button>
            <button onClick={() => setCancelModal({ isOpen: true, classId: item.classId })} className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-red-500/10 text-[var(--text-muted)] hover:text-[var(--danger-text)] text-xs font-semibold transition-colors">{t("Cancel")}</button>
          </div>
        </div>
      );
    })
  )}
              </div>
            </div>

            {/* Footer - Telemetry Sync */}
            <div className="pt-4 mt-6 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>{t("Telemetry synchronization: Connected to Nexus Core")}</span>
              <a href="/member/schedule" onClick={(e) => { e.preventDefault(); navigate('/member/schedule'); }} className="text-[var(--primary)] hover:text-[var(--primary)] font-semibold flex items-center gap-1">{t("View Full Calendar")}<ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

            {/* Right Column: Pass & Express Actions */}
          <div className="space-y-6">
            {/* NEXUS PASS Card */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[var(--primary)] flex items-center justify-center text-[color:var(--on-primary)]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm text-[var(--text)] uppercase tracking-wider">{t("NEXUS PASS")}</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--cyan)] bg-[var(--cyan-soft)] border border-[var(--cyan-soft)] px-2 py-0.5 rounded">{t("NFC READY")}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-2">
                <span>{t("MEMBER ID")}</span>
                <span className="font-mono font-bold text-[var(--text)] tracking-widest">{t("#NX-")}{dynamicMemberId}</span>
              </div>

                {/* Simulated Modern Barcode */}
                {/* QR Code section */}
              <div className="p-4 rounded-xl bg-[var(--surface)] flex items-center justify-center my-4 shadow-[var(--shadow)]">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=NEXUS-${dynamicMemberId}-${userInfo?.email}`}
                  alt="Nexus Pass QR"
                  className="w-full max-w-[120px] rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                <span>{t("Hold near turnstile optical scanner")}</span>
                <button
                  type="button"
                  onClick={() => setQrModal({
                    isOpen: true,
                    session: {
                      className: t("NEXUS Turnstile Access"),
                      coachName: fullName,
                      roomName: t("Main Gate"),
                      status: membership ? membership.status : 'ACTIVE',
                      bookingId: dynamicMemberId,
                      startTime: new Date().toISOString()
                    }
                  })}
                  className="text-[var(--cyan)] font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />{t("Simulate Tap")}</button>
              </div>
            </div>

            {/* Express Actions List */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text)] mb-3">{t("Express Actions")}</h3>
              <div className="space-y-2">
                {[
                  { title: t("Book PT Session"), subtitle: t("Consult biomechanics coaches"), icon: User, onClick: () => navigate('/member/book-class') },
                  { title: t("Reserve Smart Court"), subtitle: t("Tennis, Basketball & Padel"), icon: Search, onClick: () => navigate('/member/book-class') },
                  { title: t("Biometric Telemetry"), subtitle: t("Chỉ số thể hình & đánh giá InBody"), icon: Scale, onClick: () => setAssessmentModalOpen(true) },
                  { title: t("Locker & Facility Access"), subtitle: t("Manage digital locker keys"), icon: Dumbbell, onClick: () => navigate('/member/memberships') },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={action.onClick}
                      className="w-full p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary-soft)] hover:bg-[var(--surface-hover)] flex items-center justify-between text-left group transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-[var(--text)] transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text)]">{t(action.title)}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{t(action.subtitle)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= ROW 3: RECENT ACTIVITY TABLE ================= */}
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text)]">{t("Recent Activity & Check-in Log")}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{t("Verified turnstile entries and biometric session outputs")}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("Search facility, date...")}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] w-52 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={filteredActivities.length === 0}
                className="px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Export CSV")}</span>
              </button>
            </div>
          </div>

          {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">{t("Date & Time")}</th>
                    <th className="pb-3 font-semibold">{t("Activity / Facility")}</th>
                    <th className="pb-3 font-semibold">{t("Trainer / Zone")}</th>
                    <th className="pb-3 font-semibold">{t("Duration")}</th>
                    <th className="pb-3 font-semibold">{t("Status")}</th>
                    <th className="pb-3 font-semibold text-right">{t("Telemetry Metrics")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-[var(--text-muted)] font-medium">{t("No recent activities found. Start booking classes to see your logs!")}</td>
                    </tr>
                  ) : (
                    filteredActivities.slice((currentPage - 1) * 3, currentPage * 3).map((log) => {
                      const dateObj = new Date(log.startTime);
                      const isYesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === dateObj.toDateString();
                      const dateStr = isYesterday ? t('Yesterday') : dateObj.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
                      const timeStr = dateObj.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });

                      return (
                        <tr key={log.bookingId} className="hover:bg-[var(--surface-hover)] transition-colors">
                          <td className="py-4 font-semibold text-[var(--text)]">{dateStr}, {timeStr}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-medium text-[var(--text)]">{log.className}</span>
                            </div>
                          </td>
                          <td className="py-4 text-[var(--text)]">{log.coachName}</td>
                          <td className="py-4 text-[var(--text)]">{log.durationMinutes}{' '}{t("m")}</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--success-soft)]">
                              {codeLabel(log.status)}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="font-bold text-[var(--text)]">{log.calories}{' '}{t("kcal")}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{t("Avg HR")}{' '}{log.avgHr}{' '}{t("bpm")}</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
          </div>

          {/* Table Pagination */}
          <div className="pt-4 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>{t("Showing")}{' '}{filteredActivities.slice((currentPage - 1) * 3, currentPage * 3).length}{' '}{t("of")}{' '}{filteredActivities.length}{' '}{t("recorded sessions")}</span>
            <div className="flex items-center gap-1.5">
              <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === 1 ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                ><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.ceil(filteredActivities.length / 3) || 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-colors ${currentPage === idx + 1 ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-[var(--shadow)]' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredActivities.length / 3) || 1))}
                  disabled={currentPage === (Math.ceil(filteredActivities.length / 3) || 1)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === (Math.ceil(filteredActivities.length / 3) || 1) ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                ><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      
      {/* Modal tự cập nhật chỉ số InBody cá nhân */}
      <SelfAssessmentModal
        isOpen={selfModalOpen}
        onClose={() => setSelfModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      {/* Modal chi tiết đánh giá InBody */}
      <MemberAssessmentsModal
        isOpen={assessmentModalOpen}
        onClose={() => setAssessmentModalOpen(false)}
        initialClassId="ALL"
      />

      <CancelClassPolicyModal
        isOpen={cancelModal.isOpen}
        classId={cancelModal.classId}
        onClose={() => setCancelModal({ isOpen: false, classId: null })}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      {qrModal.isOpen && qrModal.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setQrModal({ isOpen: false, session: null })}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setQrModal({ isOpen: false, session: null })} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text)]">
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--text)]">{t("Session Check-in Pass")}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">{qrModal.session.className}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[var(--border)] flex flex-col items-center gap-2">
              <QrCode className="w-36 h-36 text-slate-900" />
              <span className="font-mono text-xs font-bold text-slate-700 tracking-widest">
                NXS-{qrModal.session.bookingId || qrModal.session.classId || dynamicMemberId}
              </span>
            </div>
            <div className="w-full text-xs text-[var(--text-muted)] bg-[var(--bg)] rounded-xl p-3 border border-[var(--border)] flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>{t("Coach:")}</span>
                <span className="font-semibold text-[var(--text)]">{qrModal.session.coachName}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Location:")}</span>
                <span className="font-semibold text-[var(--text)]">{qrModal.session.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("Status:")}</span>
                <span className="font-semibold text-[var(--success-text)]">{codeLabel(qrModal.session.status)}</span>
              </div>
            </div>
            <button onClick={() => setQrModal({ isOpen: false, session: null })} className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] font-bold text-xs">
              {t("Done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;





