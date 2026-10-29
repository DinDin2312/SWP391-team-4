import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import PackageDetailDialog from '../../../components/resource-images/PackageDetailDialog';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { formatDate } from '../../../utils/displayFormat';
import {
  CreditCard,
  Shield,
  Activity,
  Calendar,
  Snowflake,
  Dumbbell,
  Clock,
  Receipt,
  Sparkles,
  QrCode,
  ArrowRight,
  Plus,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  Bot,
  Flame,
  Award,
  Filter,
  X,
  ShieldCheck,
  CalendarDays,
  Zap,
} from 'lucide-react';

const loadOwnedDetail = (id) =>
  axios.get(`http://localhost:8080/api/v1/member/my-packages/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  });

const getPackageIcon = (type) => {
  const norm = (type || '').toLowerCase();
  if (norm.includes('ai')) return <Bot className="w-5 h-5" />;
  if (norm.includes('combo')) return <Sparkles className="w-5 h-5" />;
  if (norm.includes('class') || norm.includes('yoga') || norm.includes('zumba')) return <Activity className="w-5 h-5" />;
  if (norm.includes('amenity') || norm.includes('pool') || norm.includes('sauna')) return <Snowflake className="w-5 h-5" />;
  if (norm.includes('membership') || norm.includes('gym')) return <Dumbbell className="w-5 h-5" />;
  return <Shield className="w-5 h-5" />;
};

const getPackageBadgeColor = (type) => {
  const norm = (type || '').toLowerCase();
  if (norm.includes('ai')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
  if (norm.includes('combo')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  if (norm.includes('class')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  if (norm.includes('amenity')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
  return 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/20';
};

const Memberships = () => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [detailId, setDetailId] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  useEffect(() => {
    fetchMyPackages();
  }, []);

  const fetchMyPackages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/member/my-packages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPackages(response.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load your packages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Safe calculation of days left
  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  const activePackages = useMemo(() => {
    return packages.filter((p) => p.status === 'ACTIVE');
  }, [packages]);

  const pastPackages = useMemo(() => {
    return packages.filter((p) => p.status !== 'ACTIVE');
  }, [packages]);

  const expiringPackages = useMemo(() => {
    return activePackages.filter((p) => {
      const days = calculateDaysLeft(p.endDate);
      return days <= 14;
    });
  }, [activePackages]);

  // Compute latest valid until date for pass
  const latestActiveExpiry = useMemo(() => {
    if (activePackages.length === 0) return null;
    const dates = activePackages
      .map((p) => (p.endDate ? new Date(p.endDate).getTime() : 0))
      .filter((d) => d > 0);
    if (dates.length === 0) return null;
    return new Date(Math.max(...dates));
  }, [activePackages]);

  // Filtered list based on tab & search
  const filteredPackages = useMemo(() => {
    let list = packages;
    if (activeFilter === 'ACTIVE') {
      list = activePackages;
    } else if (activeFilter === 'EXPIRING') {
      list = expiringPackages;
    } else if (activeFilter === 'EXPIRED') {
      list = pastPackages;
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const name = (p.packageName || '').toLowerCase();
        const type = (p.packageTypeName || p.packageType || '').toLowerCase();
        return name.includes(q) || type.includes(q);
      });
    }

    return list;
  }, [packages, activeFilter, searchQuery, activePackages, expiringPackages, pastPackages]);

  const memberId = userInfo?.userId || 'MEMBER';
  const memberName = userInfo?.fullName || 'Active Member';
  const memberEmail = userInfo?.email || '';

  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=NEXUS-PASS-${encodeURIComponent(memberId)}`;

  return (
    <div className="flex flex-col w-full pb-32 space-y-8">
      {/* Package Detail Modal */}
      {detailId && (
        <PackageDetailDialog
          id={detailId}
          load={loadOwnedDetail}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* QR Turnstile Access Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/[0.06] dark:border-white/10 text-center space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {t("Member Pass QR Code")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQrModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] text-slate-500 flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
              <img
                src={qrDataUrl}
                alt="Member Pass QR"
                className="w-48 h-48 rounded-xl object-contain"
              />
              <span className="font-mono text-xs font-bold text-slate-700 tracking-wider mt-3">
                NEXUS-#{memberId}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {memberName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Scan at center turnstile gate to enter")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
            >
              {t("Close")}
            </button>
          </div>
        </div>
      )}

      {/* Top Header: Title & Quick CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t("My Packages")}
            </h1>
            {activePackages.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {activePackages.length} {t("Active")}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("Manage your active memberships, class passes, and facility privileges.")}
          </p>
        </div>

        {/* Action buttons: Billing History & Explore Packages */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/member/billing')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-900/65 backdrop-blur-md border border-black/[0.06] dark:border-white/10 hover:border-black/[0.12] text-slate-700 dark:text-slate-300 shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>{t("Billing History")}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/member/package-store')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t("Explore Package Store")}</span>
          </button>
        </div>
      </div>

      {/* Digital Member Pass Card (Apple Ceramic Pass in Light Mode / Obsidian Pass in Dark Mode) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-50/90 to-blue-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white p-6 sm:p-8 border border-black/[0.08] dark:border-white/10 shadow-[0_10px_35px_-5px_rgba(0,113,227,0.06)] dark:shadow-2xl transition-colors">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute -top-24 -left-20 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/15 blur-[90px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Pass Info */}
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-white/10 flex items-center justify-center border border-blue-500/20 dark:border-white/15">
                <CreditCard className="w-3.5 h-3.5 text-[#0071E3] dark:text-blue-400" />
              </div>
              <span className="text-[11px] font-bold tracking-widest text-slate-500 dark:text-slate-300 uppercase">
                {t("Digital Membership Pass")}
              </span>
              <span className="text-slate-300 dark:text-white/20">•</span>
              <span className="text-[11px] font-mono text-[#0071E3] dark:text-blue-400 font-semibold">
                ID: #{memberId}
              </span>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                {t("Member Name")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 text-slate-900 dark:text-white">
                {memberName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activePackages.length > 0
                  ? activePackages.map((p) => p.packageName).join(' • ')
                  : t("No Active Packages")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-black/[0.06] dark:border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-semibold">
                  {t("Valid Until")}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {latestActiveExpiry ? formatDate(latestActiveExpiry) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 block font-semibold">
                  {t("Turnstile Gate Access")}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{activePackages.length > 0 ? t("Active") : t("Inactive")}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Pass QR Widget */}
          <div className="flex flex-col items-center sm:items-end justify-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setQrModalOpen(true)}
              className="p-3 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 rounded-2xl border border-black/[0.08] dark:border-white/15 shadow-sm dark:shadow-none backdrop-blur-md flex flex-col items-center gap-2 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="p-2 bg-white rounded-xl border border-black/[0.04] shadow-xs">
                <img
                  src={qrDataUrl}
                  alt="QR Pass"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-[#0071E3] dark:group-hover:text-white">
                <QrCode className="w-3.5 h-3.5 text-[#0071E3] dark:text-blue-400" />
                <span>{t("Tap to view Check-in QR")}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#0071E3]" />
          <span className="text-xs font-semibold">{t("Loading your packages...")}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col justify-center items-center py-20 text-rose-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-xs font-semibold">{t(error)}</span>
          <button
            type="button"
            onClick={fetchMyPackages}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            {t("Retry")}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar: Search & Segmented Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Cupertino Segmented Tabs */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.05] self-start">
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t("All Packages")}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-bold">
                  {packages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'ACTIVE'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{t("Active")}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  {activePackages.length}
                </span>
              </button>

              {expiringPackages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('EXPIRING')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'EXPIRING'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{t("Expiring Soon")}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                    {expiringPackages.length}
                  </span>
                </button>
              )}

              {pastPackages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter('EXPIRED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeFilter === 'EXPIRED'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{t("Past Packages")}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] font-bold">
                    {pastPackages.length}
                  </span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("Search my packages...")}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Active / Filtered Packages List */}
          {filteredPackages.length === 0 ? (
            <div className="w-full rounded-3xl p-12 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center text-slate-400">
                <Shield className="w-7 h-7 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {searchQuery || activeFilter !== 'ALL'
                  ? t("No packages found")
                  : t("No Active Packages")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                {searchQuery || activeFilter !== 'ALL'
                  ? t("Try adjusting your search query or filter.")
                  : t("You don't have any active packages right now. Explore our membership tiers and class packages.")}
              </p>
              {searchQuery || activeFilter !== 'ALL' ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  {t("Clear filters")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/member/package-store')}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t("Explore Package Store")}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPackages.map((pkg) => {
                const daysLeft = calculateDaysLeft(pkg.endDate);
                const isActive = pkg.status === 'ACTIVE';
                const isExpiringSoon = isActive && daysLeft <= 14;
                const duration = pkg.durationDays || 30;
                const progressPercent = isActive
                  ? Math.min(100, Math.max(0, (daysLeft / duration) * 100))
                  : 0;

                const badgeColor = getPackageBadgeColor(pkg.packageType);

                return (
                  <div
                    key={pkg.membershipId}
                    className="rounded-3xl p-6 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-sm hover:shadow-md hover:border-black/[0.12] dark:hover:border-white/20 transition-all flex flex-col justify-between space-y-5 group relative overflow-hidden"
                  >
                    {/* Top Row: Icon, Titles, Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-current/15 ${badgeColor}`}
                        >
                          {getPackageIcon(pkg.packageType)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 block truncate">
                            {pkg.packageTypeName
                              ? t(pkg.packageTypeName)
                              : codeLabel(pkg.packageType)}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                            {pkg.packageName}
                          </h3>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 border ${
                          !isActive
                            ? 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            : isExpiringSoon
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {!isActive
                          ? t("Expired")
                          : isExpiringSoon
                          ? t("Expiring Soon")
                          : t("Active")}
                      </span>
                    </div>

                    {/* Metadata Dates Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.03] dark:border-white/[0.04]">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{t("Start Date")}</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatDate(pkg.startDate)}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.03] dark:border-white/[0.04]">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mb-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{t("End Date")}</span>
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {formatDate(pkg.endDate)}
                        </span>
                      </div>
                    </div>

                    {/* Time Remaining Bar */}
                    {isActive ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {t("Time Remaining")}
                          </span>
                          <span
                            className={`font-bold text-xs ${
                              isExpiringSoon
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-[#0071E3] dark:text-[#0A84FF]'
                            }`}
                          >
                            {daysLeft} {daysLeft === 1 ? t("Day Left") : t("Days Left")}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.1] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExpiringSoon
                                ? 'bg-amber-500'
                                : 'bg-[#0071E3] dark:bg-[#0A84FF]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium py-1">
                        {t("Expired on")} {formatDate(pkg.endDate)}
                      </div>
                    )}

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailId(pkg.membershipId)}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{t("Package details")}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        {isExpiringSoon && (
                          <button
                            type="button"
                            onClick={() => navigate('/member/package-store')}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-all cursor-pointer"
                          >
                            {t("Renew Package")}
                          </button>
                        )}

                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => navigate('/member/book-class')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                          >
                            <span>{t("Book Class")}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/member/package-store')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 active:scale-95 transition-all cursor-pointer"
                          >
                            <span>{t("Renew this package")}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Memberships;
