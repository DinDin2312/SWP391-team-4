import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import CancelClassPolicyModal from '../components/CancelClassPolicyModal';
import MemberAssessmentsModal from '../components/MemberAssessmentsModal';
import SelfAssessmentModal from '../components/SelfAssessmentModal';
import BodyTransformationModal from '../components/BodyTransformationModal';
import { formatDate } from '../../../utils/displayFormat';
import React, { useState, useContext } from 'react';
import MemberTierAvatar from '../../../components/MemberTierAvatar';
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
  CreditCard,
} from 'lucide-react';

const CustomerDashboard = () => {
  const getPaginationRange = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const handleScheduleTabChange = (key) => {
    setActiveTab(key);
    setSchedulePage(1);
  };

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
  const [transformationModalOpen, setTransformationModalOpen] = useState(false);

// Status for Membership Card
  const [membership, setMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);

// Status for Upcoming Schedule
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [schedulePage, setSchedulePage] = useState(1);
  const SCHEDULE_PAGE_SIZE = 5;
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

  const getStatusBadgeClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (['CANCELLED', 'CANCELED', 'FAILED', 'REJECTED', 'ABSENT', 'INACTIVE', 'EXPIRED'].includes(s)) {
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
    if (['PENDING', 'WAITING', 'PROCESSING', 'NOT_YET'].includes(s)) {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (['CONFIRMED', 'ATTENDED', 'COMPLETED', 'ACTIVE', 'PAID', 'SUCCESS', 'PRESENT', 'SCHEDULED'].includes(s)) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  const filteredActivities = recentActivities.filter((log) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const dateStr = log.startTime
      ? new Date(log.startTime).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).toLowerCase()
      : '';
    const localizedStatus = codeLabel(log.status).toLowerCase();
    return (
      (log.className && log.className.toLowerCase().includes(q)) ||
      (log.coachName && log.coachName.toLowerCase().includes(q)) ||
      (log.status && log.status.toLowerCase().includes(q)) ||
      localizedStatus.includes(q) ||
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex items-center gap-4">
          <MemberTierAvatar
            avatarUrl={userInfo?.avatarUrl}
            fullName={userInfo?.fullName || 'Member'}
            memberTier={memberTier}
            size="lg"
            onClick={() => navigate('/member/settings')}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t("Welcome back,")}{' '}<span>{userInfo?.fullName || t("Member")}</span>
              </h1>
              {memberTier === 'PLATINUM' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 text-white shadow-xs">
                  {t("PRO VIP")}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {t("Track your progress, active packages, and workout performance.")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/member/memberships')}
            className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 text-[#0071E3] dark:text-[#0A84FF] text-xs font-bold transition-all cursor-pointer"
          >
            {t("View Tier Perks")}
          </button>
        </div>
      </div>

        {/* ================= ROW 1: 4 STAT CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Package */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Active Package")}</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              {loadingMembership ? (
                <h3 className="text-lg font-bold text-slate-400 leading-snug animate-pulse">{t("Loading...")}</h3>
              ) : membership ? (
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight">{membership.packageName}</h3>
              ) : (
                <h3 className="text-lg font-bold text-rose-500 leading-snug tracking-tight">{t("No Active Package")}</h3>
              )}
            </div>
            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t(membership ? membership.remainingDays : 0)} <span className="text-xs font-medium text-slate-400">{t("days left")}</span>
                </span>
                <span className={`text-xs font-bold ${membership && membership.remainingDays > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {membership ? codeLabel(membership.status) : t('N/A')}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0071E3] rounded-full transition-all duration-500" style={{ width: membership ? '100%' : '0%' }}></div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]"></span>
                <span>{t("Valid till:")}{' '}{t(membership?.endDate ? formatDate(membership.endDate) : t('Unknown'))}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Classes Attended */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Classes Attended")}</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("Monthly Cycle")}</h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {totalCheckIns} <span className="text-xs font-medium text-slate-400">{t("Sessions")}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold mt-1">
                  {totalCheckIns > 0 ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" /> +{totalCheckIns * 5}% {t("vs last month", { defaultValue: "vs last month" })}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400 font-medium">
                      {t("No data this month", { defaultValue: "No data this month" })}
                    </span>
                  )}
                </div>
              </div>
              {/* Mini Spark Bar Graph */}
              <div className="flex items-end gap-1 h-10 pb-1">
                <span className={`w-1.5 rounded-t h-4 ${totalCheckIns > 0 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`}></span>
                <span className={`w-1.5 rounded-t h-6 ${totalCheckIns > 0 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-slate-200 dark:bg-slate-800'}`}></span>
                <span className={`w-1.5 rounded-t h-5 ${totalCheckIns > 0 ? 'bg-emerald-400/40' : 'bg-slate-200 dark:bg-slate-800'}`}></span>
                <span className={`w-1.5 rounded-t h-8 ${totalCheckIns > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></span>
                <span className={`w-1.5 rounded-t h-10 ${totalCheckIns > 0 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></span>
              </div>
            </div>
          </div>

          {/* Card 3: Upcoming Bookings (Dynamic) */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Bookings")}</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center">
                  <Calendar className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("Upcoming Classes")}</h3>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {upcomingBookings.length} <span className="text-xs font-medium text-slate-400">{t("Reserved")}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                <Search className="w-3 h-3 text-[#0071E3] dark:text-[#0A84FF]" />
                <span className="truncate">{t("Check schedule below")}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Nexus Rewards */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t("Loyalty Program")}</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4 stroke-[1.75]" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{t("Nexus Rewards")}</h3>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {loyaltyPoints} <span className="text-xs font-medium text-slate-400">{t("Pts")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                  <span>{t(memberTier === 'PLATINUM' ? t('15% Off all purchases') : memberTier === 'GOLD' ? t('10% Off all purchases') : memberTier === 'SILVER' ? t('5% Off all purchases') : t('Reach 500 Pts for 5% Off'))}</span>
                </div>
              </div>
              <MemberTierAvatar
                avatarUrl={userInfo?.avatarUrl}
                fullName={userInfo?.fullName || 'Member'}
                memberTier={memberTier}
                size="sm"
                onClick={() => navigate('/member/settings')}
              />
            </div>
          </div>
        </div>

        {/* ================= ROW 1.5: INBODY & BODY METRICS (CHỈ SỐ THỂ TRẠNG) ================= */}
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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
                    onClick={() => setTransformationModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t("Biểu đồ thể trạng (FPS)")}</span>
                  </button>
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
        {(() => {
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          const next7DaysEnd = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

          let todayCount = 0;
          let weekCount = 0;
          let monthCount = 0;

          upcomingBookings.forEach((item) => {
            if (!item.startTime) return;
            const d = new Date(item.startTime);
            if (d >= startOfToday && d <= endOfToday) todayCount++;
            if (d >= startOfToday && d <= next7DaysEnd) weekCount++;
            if (d >= startOfToday && d <= endOfMonth) monthCount++;
          });

          const filteredUpcomingBookings = upcomingBookings.filter((item) => {
            if (activeTab === 'all') return true;
            if (!item.startTime) return false;
            const d = new Date(item.startTime);
            if (activeTab === 'today') return d >= startOfToday && d <= endOfToday;
            if (activeTab === 'week') return d >= startOfToday && d <= next7DaysEnd;
            if (activeTab === 'month') return d >= startOfToday && d <= endOfMonth;
            return true;
          });

          const totalSchedulePages = Math.max(1, Math.ceil(filteredUpcomingBookings.length / SCHEDULE_PAGE_SIZE));
          const validSchedulePage = Math.min(Math.max(1, schedulePage), totalSchedulePages);
          const paginatedUpcomingBookings = filteredUpcomingBookings.slice(
            (validSchedulePage - 1) * SCHEDULE_PAGE_SIZE,
            validSchedulePage * SCHEDULE_PAGE_SIZE
          );

          const expressActions = [
            {
              title: "Book Class & PT",
              subtitle: "Group classes, courts & 1-on-1 personal training",
              icon: Calendar,
              iconBg: "bg-blue-500/10",
              iconColor: "text-[#0071E3] dark:text-[#0A84FF]",
              onClick: () => navigate('/member/book-class')
            },
            {
              title: "Package Store",
              subtitle: "Memberships, class packages & access passes",
              icon: CreditCard,
              iconBg: "bg-indigo-500/10",
              iconColor: "text-[#5856D6] dark:text-[#5E5CE6]",
              onClick: () => navigate('/member/package-store')
            },
            {
              title: "InBody & Body Metrics",
              subtitle: "Track weight, body fat & trainer evaluations",
              icon: Activity,
              iconBg: "bg-amber-500/10",
              iconColor: "text-amber-600 dark:text-amber-400",
              onClick: () => setAssessmentModalOpen(true)
            },
            {
              title: "Attendance Log",
              subtitle: "Verified check-in history & attendance rate",
              icon: Clock,
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-600 dark:text-emerald-400",
              onClick: () => navigate('/member/attendance')
            }
          ];

          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Schedule (Left 2 Columns) */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                <div>
                  {/* Header & Filter Tabs */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {t("Upcoming Schedule")}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border border-blue-500/20 text-xs font-semibold">
                        {upcomingBookings.length} {t("Active")}
                      </span>
                    </div>

                    <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.04] dark:border-white/5 text-xs font-medium self-start sm:self-auto overflow-x-auto max-w-full">
                      {[
                        { key: 'all', label: t('All'), count: upcomingBookings.length },
                        { key: 'today', label: t('Today'), count: todayCount },
                        { key: 'week', label: t('Next 7 Days'), count: weekCount },
                        { key: 'month', label: t('This Month'), count: monthCount },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => handleScheduleTabChange(tab.key)}
                          className={`px-3 py-1.5 rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeTab === tab.key
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            activeTab === tab.key
                              ? 'bg-blue-500/15 text-[#0071E3] dark:text-[#0A84FF]'
                              : 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of training sessions (5 per page) */}
                  <div className="space-y-3">
                    {loadingBookings ? (
                      <div className="text-slate-400 text-sm py-12 text-center animate-pulse">
                        {t("Loading upcoming classes...")}
                      </div>
                    ) : filteredUpcomingBookings.length === 0 ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                        <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {activeTab === 'today'
                            ? t("No classes scheduled for today.")
                            : activeTab === 'week'
                            ? t("No classes scheduled in the next 7 days.")
                            : activeTab === 'month'
                            ? t("No classes scheduled this month.")
                            : t("No upcoming classes scheduled.")}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/member/book-class')}
                          className="mt-2 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          {t("Book a Class")}
                        </button>
                      </div>
                    ) : (
                      paginatedUpcomingBookings.map((item) => {
                        const dateObj = new Date(item.startTime);
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const badge = isToday
                          ? t("TODAY")
                          : dateObj.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).toUpperCase();
                        const time = dateObj.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", hour12: false });

                        return (
                          <div
                            key={item.bookingId}
                            className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            <div className="flex items-start sm:items-center gap-4">
                              {/* Date & Time Squircle */}
                              <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/[0.06] dark:border-white/[0.1] text-center min-w-[72px] shadow-xs shrink-0">
                                <span className="text-[10px] font-bold text-[#0071E3] dark:text-[#0A84FF] tracking-wider block">{badge}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{time}</span>
                              </div>

                              {/* Session Details */}
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{item.className}</h4>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(item.status)}`}>
                                    {codeLabel(item.status)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 stroke-[1.5]" />
                                    <span>{item.coachName}</span>
                                  </div>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 stroke-[1.5]" />
                                    <span>{item.roomName}</span>
                                  </div>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
                                    <span>{item.durationMinutes} {t("min")}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
                              <button
                                type="button"
                                onClick={() => setQrModal({ isOpen: true, session: item })}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>{t("Check-in")}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelModal({ isOpen: true, classId: item.classId })}
                                className="px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                              >
                                {t("Cancel")}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Numbered Pagination & Full Calendar Link */}
                <div className="pt-4 mt-6 border-t border-black/[0.06] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>
                      {t("Showing")}{' '}
                      <strong className="text-slate-900 dark:text-white font-semibold">
                        {filteredUpcomingBookings.length === 0 ? 0 : (validSchedulePage - 1) * SCHEDULE_PAGE_SIZE + 1} - {Math.min(validSchedulePage * SCHEDULE_PAGE_SIZE, filteredUpcomingBookings.length)}
                      </strong>{' '}
                      {t("of")}{' '}
                      <strong className="text-slate-900 dark:text-white font-semibold">{filteredUpcomingBookings.length}</strong>{' '}
                      {t("upcoming sessions")}
                    </span>
                  </div>

                  {/* Numbered Pager */}
                  {totalSchedulePages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSchedulePage(p => Math.max(1, p - 1))}
                        disabled={validSchedulePage === 1}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        aria-label={t("Previous")}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {getPaginationRange(validSchedulePage, totalSchedulePages).map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs">
                              ...
                            </span>
                          );
                        }
                        const isActive = p === validSchedulePage;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setSchedulePage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#0071E3] text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setSchedulePage(p => Math.min(totalSchedulePages, p + 1))}
                        disabled={validSchedulePage === totalSchedulePages}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        aria-label={t("Next")}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Link to Full Schedule */}
                  <div>
                    <a
                      href="/member/schedule"
                      onClick={(e) => { e.preventDefault(); navigate('/member/schedule'); }}
                      className="text-[#0071E3] dark:text-[#0A84FF] hover:underline font-semibold flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <span>{t("View Full Schedule")}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Pass & Express Actions */}
              <div className="space-y-6">
                {/* Digital Member Pass Card */}
                <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">{t("Digital Member Pass")}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {membership ? codeLabel(membership.status) : t("ACTIVE")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span>{t("Member ID")}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tracking-widest">#NX-{dynamicMemberId}</span>
                  </div>

                  {/* QR Code section */}
                  <div className="p-4 rounded-2xl bg-white shadow-xs ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center my-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=NEXUS-${dynamicMemberId}-${userInfo?.email}`}
                      alt="Nexus Pass QR"
                      className="w-full max-w-[120px] rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <span className="truncate pr-2">{t("Hold near turnstile optical scanner")}</span>
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
                      className="text-[#0071E3] dark:text-[#0A84FF] font-semibold flex items-center gap-1 shrink-0 cursor-pointer hover:underline active:scale-95 transition-all"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>{t("Simulate Tap")}</span>
                    </button>
                  </div>
                </div>

                {/* Express Actions List */}
                <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{t("Express Actions")}</h3>
                    <span className="text-[11px] font-medium text-slate-400">4 {t("shortcuts")}</span>
                  </div>
                  <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {expressActions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={action.onClick}
                          className="w-full py-3 px-2 flex items-center justify-between text-left group hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl active:scale-[0.99] transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${action.iconBg}`}>
                              <Icon className={`w-4 h-4 ${action.iconColor} stroke-[1.75]`} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">
                                {t(action.title)}
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {t(action.subtitle)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ================= ROW 3: RECENT ACTIVITY TABLE ================= */}
        {(() => {
          const totalActivityPages = Math.max(1, Math.ceil(filteredActivities.length / 3));
          const validActivityPage = Math.min(Math.max(1, currentPage), totalActivityPages);
          const paginatedActivities = filteredActivities.slice(
            (validActivityPage - 1) * 3,
            validActivityPage * 3
          );

          return (
            <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t("Recent Activity & Check-in Log")}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("Verified check-ins and session completion records")}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t("Search facility, date...")}
                      className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50 w-52 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={filteredActivities.length === 0}
                    className="px-3.5 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer active:scale-95"
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
                    <tr className="border-b border-black/[0.06] dark:border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-semibold">{t("Date & Time")}</th>
                      <th className="pb-3 font-semibold">{t("Activity / Facility")}</th>
                      <th className="pb-3 font-semibold">{t("Trainer / Zone")}</th>
                      <th className="pb-3 font-semibold">{t("Duration")}</th>
                      <th className="pb-3 font-semibold">{t("Status")}</th>
                      <th className="pb-3 font-semibold text-right">{t("Calories burned")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">{t("No recent activities found. Start booking classes to see your logs!")}</td>
                      </tr>
                    ) : (
                      paginatedActivities.map((log) => {
                        const dateObj = new Date(log.startTime);
                        const isYesterday = new Date(new Date().setDate(new Date().getDate()-1)).toDateString() === dateObj.toDateString();
                        const dateStr = isYesterday ? t('Yesterday') : dateObj.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
                        const timeStr = dateObj.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });

                        return (
                          <tr key={log.bookingId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                            <td className="py-4 font-semibold text-slate-900 dark:text-white">{dateStr}, {timeStr}</td>
                            <td className="py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center">
                                  <Activity className="w-3.5 h-3.5 stroke-[1.75]" />
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{log.className}</span>
                              </div>
                            </td>
                            <td className="py-4 text-slate-600 dark:text-slate-300">{log.coachName}</td>
                            <td className="py-4 text-slate-600 dark:text-slate-300">{log.durationMinutes}{' '}{t("m")}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeClass(log.status)}`}>
                                {codeLabel(log.status)}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="font-bold text-slate-900 dark:text-white">{log.calories}{' '}{t("kcal")}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{t("Avg HR")}{' '}{log.avgHr}{' '}{t("bpm")}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              <div className="pt-4 mt-2 border-t border-black/[0.06] dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {t("Showing")}{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {filteredActivities.length === 0 ? 0 : (validActivityPage - 1) * 3 + 1} - {Math.min(validActivityPage * 3, filteredActivities.length)}
                  </strong>{' '}
                  {t("of")}{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">{filteredActivities.length}</strong>{' '}
                  {t("recorded sessions")}
                </span>

                {totalActivityPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={validActivityPage === 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      aria-label={t("Previous")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {getPaginationRange(validActivityPage, totalActivityPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`act-dots-${idx}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs">
                            ...
                          </span>
                        );
                      }
                      const isActive = p === validActivityPage;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#0071E3] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalActivityPages))}
                      disabled={validActivityPage === totalActivityPages}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                      aria-label={t("Next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        
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

      {/* Modal Biểu đồ biến đổi thể trạng & Điểm FPS */}
      <BodyTransformationModal
        isOpen={transformationModalOpen}
        onClose={() => setTransformationModalOpen(false)}
        trainee={userInfo}
        isCoachView={false}
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
              <div className="flex justify-between items-center">
                <span>{t("Status:")}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(qrModal.session.status)}`}>
                  {codeLabel(qrModal.session.status)}
                </span>
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





