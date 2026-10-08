import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import { formatDate } from '../../../utils/displayFormat';
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
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
} from 'lucide-react';

const CustomerDashboard = () => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('all');
  const [cancelModal, setCancelModal] = useState({ isOpen: false, classId: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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

// Fetch membership card and schedule data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

// Call 2 APIs in parallel for speed
        const [membershipRes, bookingsRes, checkInsRes, recentRes, profileRes] = await Promise.all([
          axios.get('http://localhost:8080/api/v1/member/my-membership', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/upcoming-bookings', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/total-checkins', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/member/recent-activities', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/api/v1/user/profile', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setMembership(membershipRes.data);
        setUpcomingBookings(bookingsRes.data);
        setTotalCheckIns(checkInsRes.data);
        if (profileRes.data) {
          setLoyaltyPoints(profileRes.data.loyaltyPoints);
          setMemberTier(profileRes.data.memberTier);
        }
        setRecentActivities(recentRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingMembership(false);
        setLoadingBookings(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchData();
    } else {
      setLoadingMembership(false);
      setLoadingBookings(false);
    }
  }, []);

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
                <div className="flex items-center gap-1 text-xs font-semibold text-[var(--success-text)] mt-1">
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{t("+21% vs last month")}</span>
                </div>
              </div>
              {/* Mini Spark Bar Graph */}
              <div className="flex items-end gap-1 h-10 pb-1">
                <span className="w-1.5 bg-[var(--surface)] rounded-t h-4"></span>
                <span className="w-1.5 bg-[var(--surface)] rounded-t h-6"></span>
                <span className="w-1.5 bg-[var(--success-soft)] rounded-t h-5"></span>
                <span className="w-1.5 bg-[var(--success-hover)] rounded-t h-8"></span>
                <span className="w-1.5 bg-[var(--success-hover)] rounded-t h-10"></span>
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
      if (activeTab === 'group') return name.includes('yoga') || name.includes('gym') || name.includes('cÄ‚â€ Ă‚Â¡');
      if (activeTab === 'courts') return name.includes('court') || name.includes('sĂ„â€Ă‚Â¢n');
      if (activeTab === 'recovery') return name.includes('recovery') || name.includes('hÄ‚Â¡Ă‚Â»Ă¢â‚¬Å“i phÄ‚Â¡Ă‚Â»Ă‚Â¥c');
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
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold transition-colors">
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
                <span className="text-[var(--cyan)] font-semibold flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />{t("Simulate Tap")}</span>
              </div>
            </div>

            {/* Express Actions List */}
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text)] mb-3">{t("Express Actions")}</h3>
              <div className="space-y-2">
                {[
                  { title: t("Book PT Session"), subtitle: t("Consult biomechanics coaches"), icon: User, TrendingUp, onClick: () => alert("System is matching you with an available trainer...") },
                  { title: t("Reserve Smart Court"), subtitle: t("Tennis, Basketball & Padel"), icon: Search, onClick: () => alert("Loading Smart Court layout...") },
                  { title: t("Biometric Telemetry"), subtitle: t("VO2 Max & recovery index"), icon: Activity, onClick: () => alert("Syncing data with your Apple Watch/Garmin...") },
                  { title: t("Locker & Facility Access"), subtitle: t("Manage digital locker keys"), icon: Dumbbell, onClick: () => alert("Connecting NFC to unlock locker #42...") },
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search facility, date...")}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] w-52 transition-colors"
                />
              </div>

              <button className="px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-xs font-semibold text-[var(--text)] flex items-center gap-2 transition-colors">
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
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-[var(--text-muted)] font-medium">{t("No recent activities found. Start booking classes to see your logs!")}</td>
                    </tr>
                  ) : (
                    recentActivities.slice((currentPage - 1) * 3, currentPage * 3).map((log) => {
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
            <span>{t("Showing")}{' '}{recentActivities.slice((currentPage - 1) * 3, currentPage * 3).length}{' '}{t("of")}{' '}{recentActivities.length}{' '}{t("recorded sessions")}</span>
            <div className="flex items-center gap-1.5">
              <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === 1 ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                ><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.ceil(recentActivities.length / 3) || 1 }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold transition-colors ${currentPage === idx + 1 ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-[var(--shadow)]' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recentActivities.length / 3) || 1))}
                  disabled={currentPage === (Math.ceil(recentActivities.length / 3) || 1)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${currentPage === (Math.ceil(recentActivities.length / 3) || 1) ? 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)]'}`}
                ><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      
      <ConfirmModal 
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, classId: null })}
        onConfirm={() => {
          axios.post('http://localhost:8080/api/v1/member/cancel-class/' + cancelModal.classId, {}, {
            headers: { Authorization: "Bearer " + localStorage.getItem('token') }
          }).then(() => {
            window.location.reload();
          }).catch(err => alert(err.response?.data || 'Failed to cancel class'));
        }}
        title={t("Cancel Class Registration")}
        message={t("Are you sure you want to cancel this class? All future sessions of this class will be dropped from your schedule. This action cannot be undone.")}
        confirmText={t("Yes, Cancel Class")}
      />
    </div>
  );
};

export default CustomerDashboard;





