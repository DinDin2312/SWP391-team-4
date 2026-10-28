import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDate, formatTime } from '../../../utils/displayFormat';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  MapPin, 
  User, 
  Activity, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Dumbbell, 
  RotateCcw, 
  CalendarCheck,
  X 
} from 'lucide-react';
import { useAttendanceHistory } from '../hooks/useAttendanceHistory';

// Extracted UI Component for Badges
const StatusBadge = ({ status }) => {
  if (status === "PRESENT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold uppercase tracking-wider shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        {t("Present")}
      </span>
    );
  }
  if (status === "ABSENT") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold uppercase tracking-wider shadow-xs">
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        {t("Absent")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold uppercase tracking-wider shadow-xs">
      <Clock className="w-3.5 h-3.5 text-amber-500" />
      {t("Pending")}
    </span>
  );
};

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

const AttendanceHistory = () => {
  const lang = useLanguage();
  const navigate = useNavigate();

  const { 
    bookings, 
    loading, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery, 
    stats, 
    filteredBookings, 
    refreshHistory 
  } = useAttendanceHistory();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedBookings = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, validPage, pageSize]);

  const startRecord = filteredBookings.length === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endRecord = Math.min(validPage * pageSize, filteredBookings.length);

  const getAttendanceRateLabel = (rate) => {
    if (rate >= 80) return t("Excellent");
    if (rate >= 50) return t("Good");
    return t("Needs Improvement");
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-80 gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <span className="text-xs font-semibold text-[var(--text-muted)]">{t("Loading attendance records...")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span>{t("Attendance History")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-normal">
            {t("Track your check-in consistency, workout attendance rate, and session history.")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={refreshHistory}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] transition-all cursor-pointer active:scale-95 shadow-xs"
            title={t("Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t("Refresh")}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/member/book-class')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:bg-blue-600 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>{t("Book Class")}</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive Visual Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate Card */}
        <div 
          onClick={() => setFilterStatus("ALL")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
            filterStatus === "ALL" 
              ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/10" 
              : "border-[var(--border)] hover:border-blue-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
              {t("Attendance Rate")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--text)]">{stats.attendanceRate}%</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                stats.attendanceRate >= 80 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : stats.attendanceRate >= 50 
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {getAttendanceRateLabel(stats.attendanceRate)}
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full bg-[var(--surface-hover)] h-2 rounded-full overflow-hidden mt-3 border border-[var(--border)]">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, stats.attendanceRate))}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Present Sessions Card */}
        <div 
          onClick={() => setFilterStatus("PRESENT")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
            filterStatus === "PRESENT" 
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10" 
              : "border-[var(--border)] hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
              {t("Present Sessions")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.presentCount}</span>
              <span className="text-xs text-[var(--text-muted)] font-medium">/ {bookings.length} {t("sessions")}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {t("Check-ins recorded")}
            </p>
          </div>
        </div>
        
        {/* Absent Sessions Card */}
        <div 
          onClick={() => setFilterStatus("ABSENT")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
            filterStatus === "ABSENT" 
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10" 
              : "border-[var(--border)] hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
              {t("Absent Sessions")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats.absentCount}</span>
              <span className="text-xs text-[var(--text-muted)] font-medium">{t("sessions")}</span>
            </div>
            <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {t("Missed sessions")}
            </p>
          </div>
        </div>

        {/* Upcoming / Pending Card */}
        <div 
          onClick={() => setFilterStatus("PENDING")}
          className={`bg-[var(--surface)] border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg flex flex-col justify-between ${
            filterStatus === "PENDING" 
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10" 
              : "border-[var(--border)] hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
              {t("Upcoming / Pending")}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pendingCount || 0}</span>
              <span className="text-xs text-[var(--text-muted)] font-medium">{t("sessions")}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {t("Awaiting check-in")}
            </p>
          </div>
        </div>
      </div>

      {/* Cupertino Segmented Tabs + Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Segmented Filter Pills */}
        <div className="inline-flex p-1 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] self-start overflow-x-auto max-w-full">
          {[
            { id: 'ALL', label: t('All'), count: bookings.length },
            { id: 'PRESENT', label: t('Present'), count: stats.presentCount },
            { id: 'ABSENT', label: t('Absent'), count: stats.absentCount },
            { id: 'PENDING', label: t('Pending'), count: stats.pendingCount || 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[var(--surface)] text-[var(--text)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterStatus === tab.id 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search by course, coach, room or ID...")}
            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-md cursor-pointer transition-colors"
              title={t("Clear")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Sessions Data Table Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[var(--surface-hover)]/20">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--text)]">{t("Session Details")}</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {filteredBookings.length}
            </span>
          </div>
          {(searchQuery || filterStatus !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setFilterStatus('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t("Reset Filters")}</span>
            </button>
          )}
        </div>
        
        {filteredBookings.length === 0 ? (
          /* High-grade Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-4 shadow-xs">
              <CalendarCheck className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-base font-bold text-[var(--text)]">{t("No attendance sessions found")}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
              {t("Try adjusting your search query or status filter.")}
            </p>
            <div className="flex items-center gap-3 mt-5">
              {(searchQuery || filterStatus !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] transition-all cursor-pointer"
                >
                  {t("Reset Filters")}
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/member/book-class')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] text-white hover:bg-blue-600 transition-all cursor-pointer shadow-xs"
              >
                {t("Book Class")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-hover)]/40 border-b border-[var(--border)] text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-4">{t("Date & Time")}</th>
                    <th className="p-4">{t("Course")}</th>
                    <th className="p-4">{t("Coach & Room")}</th>
                    <th className="p-4 text-right">{t("Status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {paginatedBookings.map((booking) => {
                    const start = new Date(booking.startTime);
                    const monthText = lang === 'vi' 
                      ? `Thg ${start.getMonth() + 1}` 
                      : start.toLocaleString('en-US', { month: 'short' });
                    const weekdayText = start.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });

                    return (
                      <tr key={booking.bookingId} className="hover:bg-[var(--surface-hover)]/60 transition-colors">
                        {/* Date & Time */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-[var(--surface-hover)] flex flex-col items-center justify-center border border-[var(--border)] shrink-0 shadow-2xs">
                              <span className="text-[10px] uppercase text-[var(--text-muted)] font-extrabold leading-none">{monthText}</span>
                              <span className="text-base text-[var(--text)] font-black leading-none mt-1">{start.getDate()}</span>
                            </div>
                            <div>
                              <p className="text-[var(--text)] font-bold text-xs sm:text-sm">
                                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                              </p>
                              <p className="text-[var(--text-muted)] text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                                <Calendar className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                <span>{weekdayText}, {formatDate(booking.startTime)}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Course & Booking Tag */}
                        <td className="p-4">
                          <p className="text-[var(--text)] font-bold text-xs sm:text-sm leading-snug">{booking.className}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {t("Booking ID: #")}{booking.bookingId}
                          </span>
                        </td>

                        {/* Coach & Room */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-[var(--text)] text-xs font-semibold flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span>{booking.coachName || '—'}</span>
                            </p>
                            <p className="text-[var(--text-muted)] text-[11px] flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{booking.roomName || '—'}</span>
                            </p>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4 text-right">
                          <StatusBadge status={booking.attendanceStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-hover)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 order-2 sm:order-1 font-medium">
                <span>{t("Showing")}</span>
                <strong className="text-[var(--text)] font-bold">{startRecord}–{endRecord}</strong>
                <span>{t("of")}</span>
                <strong className="text-[var(--text)] font-bold">{filteredBookings.length}</strong>
                <span>{t("sessions")}</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 order-1 sm:order-2 select-none">
                  {/* Previous button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validPage === 1}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none text-xs text-[var(--text)] transition-all flex items-center gap-1 cursor-pointer font-medium shadow-2xs"
                    title={t("Previous")}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t("Previous")}</span>
                  </button>

                  {/* Page numbers (1, 2, 3...) */}
                  <div className="flex items-center gap-1">
                    {getPaginationRange(validPage, totalPages).map((p, idx) => {
                      if (p === '...') {
                        return (
                          <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-[var(--text-muted)] font-medium">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = p === validPage;
                      return (
                        <button
                          key={`page-${p}`}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? "bg-blue-600 text-white shadow-xs shadow-blue-500/30 ring-1 ring-blue-500"
                              : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={validPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:pointer-events-none text-xs text-[var(--text)] transition-all flex items-center gap-1 cursor-pointer font-medium shadow-2xs"
                    title={t("Next")}
                  >
                    <span className="hidden sm:inline">{t("Next")}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;
