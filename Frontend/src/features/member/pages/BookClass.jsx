import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, MapPin, User, CheckCircle2, AlertCircle,
  Repeat, Calendar, ShoppingCart, ShoppingBag, Trash2,
  Clock, ArrowRight, Loader2, Sparkles, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BookClass = () => {
  useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);
  const [expandedSchedules, setExpandedSchedules] = useState(new Set());

  useEffect(() => {
    fetchCourses(true);
    fetchCart();

    const onCartUpdated = () => {
      void fetchCourses(false);
      void fetchCart();
    };
    window.addEventListener('cartUpdated', onCartUpdated);

    const handleAiCartHighlight = () => {
      setIsCartHighlighted(true);
      setTimeout(() => setIsCartHighlighted(false), 2400);
    };
    window.addEventListener('aiCartHighlight', handleAiCartHighlight);

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated);
      window.removeEventListener('aiCartHighlight', handleAiCartHighlight);
    };
  }, []);

  const sortCoursesStably = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const timeDiff = new Date(a.nextSessionTime).getTime() - new Date(b.nextSessionTime).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (Number(a.classId) || 0) - (Number(b.classId) || 0);
    });
  };

  const fetchCourses = async (isInitialLoad = false) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/member/available-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stableList = sortCoursesStably(res.data);
      setCourses(stableList);

      if (stableList.length > 0) {
        const uniqueDates = [...new Set(stableList.map(s => new Date(s.nextSessionTime).toDateString()))].sort((a, b) => new Date(a) - new Date(b));
        setSelectedDate(prev => {
          if (isInitialLoad || !prev) return uniqueDates[0];
          return uniqueDates.includes(prev) ? prev : uniqueDates[0];
        });
      } else {
        setSelectedDate(new Date().toDateString());
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:8080/api/v1/payment/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.items) {
        setCartCount(res.data.items.length);
        setCartTotal(res.data.totalPrice || 0);
      } else {
        setCartCount(0);
        setCartTotal(0);
      }
    } catch (e) {
      console.error('Error fetching cart:', e);
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/v1/payment/cart/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(0);
      setCartTotal(0);
      void fetchCourses(false);
      window.dispatchEvent(new Event('cartUpdated'));
      setToast({ visible: true, type: 'success', title: t('Success'), message: t('Cart cleared successfully') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
    } catch (e) {
      console.error('Error clearing cart:', e);
    }
  };

  const handleBook = async (classId) => {
    if (booking !== null) return;
    setBooking(classId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/v1/member/book-class/${classId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update: UI phản hồi ngay lập tức
      setCourses(prev => prev.map(c => c.classId === classId ? {
        ...c,
        isPendingPayment: true,
        bookedSlots: Math.min(c.maxSlots, (c.bookedSlots || 0) + 1)
      } : c));

      setToast({ visible: true, type: 'success', title: t('Course Enrolled'), message: t('Course added to cart. Complete payment to confirm your place.') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
      window.dispatchEvent(new Event('cartUpdated'));
      void fetchCart();
      void fetchCourses(false);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Failed to enroll. Please try again.";
      setToast({ visible: true, type: 'error', title: t('Enrollment Failed'), message: typeof errorMsg === 'string' ? errorMsg : 'Please try again.' });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 6000);
    } finally {
      setBooking(null);
    }
  };

  const toggleSchedule = (classId) => {
    setExpandedSchedules(prev => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const formatToastMessage = (msg) => {
    if (!msg || typeof msg !== 'string') return '';
    // Format ISO timestamps like 2026-11-16T07:00 into readable "07:00 (16/11/2026)"
    return t(msg).replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/, (_, y, m, d, hh, mm) => {
      return `${hh}:${mm} (${d}/${m}/${y})`;
    });
  };

  const availableDates = [...new Set(
    courses
      .filter(s => Boolean(s.nextSessionTime) && !isNaN(new Date(s.nextSessionTime).getTime()))
      .map(s => new Date(s.nextSessionTime).toDateString())
  )].sort((a, b) => new Date(a) - new Date(b));

  const parseDateDetails = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { weekday: '--', dayNum: '--', monthStr: '--' };
    }
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const weekday = isToday ? t('Today') : isTomorrow ? t('Tomorrow') : d.toLocaleDateString(locale(), { weekday: 'short' });
    const dayNum = d.getDate();
    const monthStr = d.toLocaleDateString(locale(), { month: 'short' });
    return { weekday, dayNum, monthStr };
  };

  const filteredCourses = sortCoursesStably(courses.filter(s => {
    const matchesDate = !selectedDate || selectedDate === 'ALL' || (Boolean(s.nextSessionTime) && new Date(s.nextSessionTime).toDateString() === selectedDate);
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
                          s.className.toLowerCase().includes(term) ||
                          s.coachName.toLowerCase().includes(term) ||
                          (s.roomName && s.roomName.toLowerCase().includes(term));
    return matchesDate && matchesSearch;
  }));

  return (
    <div className={`flex flex-col w-full max-w-6xl mx-auto space-y-6 ${cartCount > 0 ? 'pb-36' : 'pb-12'} transition-all duration-300`}>
      {/* Toast Notification - Apple Dynamic Island Spring Banner */}
      <AnimatePresence>
        {toast.visible && (
          <div
            className="fixed top-6 z-50 pointer-events-none flex justify-center px-4 transition-[left] duration-200 ease-out"
            style={{
              left: 'var(--role-sidebar-width, 0px)',
              right: 0,
            }}
          >
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.92 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className={`pointer-events-auto w-full max-w-lg p-4 sm:p-4.5 rounded-3xl backdrop-blur-3xl border shadow-2xl flex items-start gap-3.5 transition-all ${
                toast.type === 'error'
                  ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(244,63,94,0.18)]'
                  : 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(16,185,129,0.18)]'
              }`}
            >
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                toast.type === 'error'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                  toast.type === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {toast.title || (toast.type === 'error' ? t('Notification') : t('Success'))}
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                  {formatToastMessage(toast.message)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast({ ...toast, visible: false })}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header - Apple Cupertino Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-blue-400 text-[11px] font-semibold tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("Class Schedule & Courses")}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium">{t("Member Enrollment")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("Book Courses")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {t("Explore upcoming courses, select your start date, and reserve your spot.")}
          </p>
        </div>

        {/* Quick Cart Status Pill in Header */}
        {cartCount > 0 && (
          <button
            type="button"
            onClick={() => navigate('/member/cart')}
            className="self-start sm:self-center px-4 py-2 rounded-full bg-[#0071E3]/10 hover:bg-[#0071E3]/15 text-[#0071E3] dark:text-blue-400 border border-blue-500/20 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{cartCount} {t("courses in cart")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Controls Container: Search Bar & Apple Date Strip (Sticky Filter Dock) */}
      <div className="sticky top-2 sm:top-4 z-20 p-3.5 sm:p-4.5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-3.5 transition-all">
        {/* Search Field */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("Search by class name, coach, or room...")}
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/20 transition-all cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Date Strip - Apple Calendar Style */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>{t("Select Start Date:")}</span>
            </span>
            {selectedDate !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedDate('ALL')}
                className="text-[#0071E3] hover:underline font-semibold cursor-pointer"
              >
                {t("Show all dates")}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
            {/* "All" Date Pill */}
            <button
              type="button"
              onClick={() => setSelectedDate('ALL')}
              className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl min-w-[70px] transition-all cursor-pointer ${
                selectedDate === 'ALL'
                  ? 'bg-[#0071E3] text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                {t("ALL")}
              </span>
              <span className="text-base font-black tracking-tight my-0.5">
                ∞
              </span>
              <span className={`text-[10px] font-medium ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400'}`}>
                {t("Dates")}
              </span>
            </button>

            {/* Individual Date Cards */}
            {availableDates.map((dateStr) => {
              const isActive = selectedDate === dateStr;
              const { weekday, dayNum, monthStr } = parseDateDetails(dateStr);

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl min-w-[72px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0071E3] text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]'
                  }`}
                >
                  <span className={`text-[11px] font-semibold tracking-tight ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                    {weekday}
                  </span>
                  <span className="text-lg font-black tracking-tight leading-none my-0.5">
                    {dayNum}
                  </span>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {monthStr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Courses List - Apple Pass Card Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#0071E3]" />
            <span className="text-xs text-slate-400 font-semibold">{t("Loading available courses...")}</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/[0.08] shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("No courses found")}</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {t("No courses match your filter or start date. Try selecting another date or clearing your search term.")}
            </p>
          </div>
        ) : (
          filteredCourses.map((course, idx) => {
            const startTime = new Date(course.nextSessionTime);
            const timeStr = startTime.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });

            const spotsLeft = course.maxSlots - (course.bookedSlots || 0);
            const progressWidth = Math.min(100, Math.max(0, ((course.maxSlots - spotsLeft) / course.maxSlots) * 100));
            const isBooked = course.isBookedByMe;
            const isPending = !!course.isPendingPayment;
            const isFull = spotsLeft <= 0;
            const isThisBooking = Number(booking) === Number(course.classId);
            const isScheduleExpanded = expandedSchedules.has(course.classId);

            return (
              <div
                key={course.classId || idx}
                id={`ai-class-${course.classId}`}
                className="rounded-3xl p-6 bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] hover:border-[#0071E3]/40 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left/Main Information */}
                <div className="flex-1 space-y-3.5">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200/80 dark:border-blue-500/25">
                      {t("Full Course:")} {course.totalSessions} {t("sessions")}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t("Starts:")} {timeStr} ({course.durationMinutes} {t("min")})</span>
                    </span>
                  </div>

                  {/* Class Title */}
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {course.className}
                  </h3>

                  {/* Key Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span>{t("Coach")} <strong className="text-slate-900 dark:text-white font-semibold">{course.coachName}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{course.roomName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-purple-500" />
                      <span>{t("Repeats:")} <strong className="text-slate-900 dark:text-white font-semibold">{t(course.schedulePattern || 'Custom')}</strong></span>
                    </div>
                  </div>

                  {/* Schedule Details Drawer with Explicit Session Count & Numbering */}
                  {course.upcomingDates && course.upcomingDates.length > 0 && (
                    <div className="rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => toggleSchedule(course.classId)}
                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#0071E3]" />
                          <span>
                            {isScheduleExpanded ? t("Hide course schedule") : t("View all scheduled sessions")}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#0071E3] px-2.5 py-0.5 rounded-full bg-blue-500/10">
                            {course.upcomingDates.length} {t("sessions")}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isScheduleExpanded ? 'rotate-180 text-[#0071E3]' : ''}`} />
                        </div>
                      </button>

                      {isScheduleExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-medium">{t("Complete session timeline:")}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t("All")} {course.upcomingDates.length}/{course.totalSessions} {t("sessions loaded")}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {course.upcomingDates.map((d, i) => (
                              <div
                                key={i}
                                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/[0.06] shadow-2xs flex flex-col gap-0.5"
                              >
                                <span className="text-[10px] font-bold tracking-wider text-[#0071E3] uppercase">
                                  {t("Session")} #{i + 1}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                  {d}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Enrollment Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {course.maxSlots - spotsLeft}/{course.maxSlots} {t("Students Enrolled")}
                      </span>
                      {spotsLeft <= 3 && spotsLeft > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {t("Only")} {spotsLeft} {t("spots left!")}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : 'bg-[#0071E3]'}`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right / Price & Action Section */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/[0.06] lg:pl-6 shrink-0 min-w-[200px]">
                  <div className="text-left lg:text-right">
                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block">
                      {t("Course Fee")}
                    </span>
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                      {formatMoney(course.price)}
                    </span>
                  </div>

                  <div className="w-auto lg:w-full">
                    {isBooked ? (
                      <button
                        type="button"
                        disabled
                        className="w-full px-5 py-2.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-not-allowed shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{t('Enrolled')}</span>
                      </button>
                    ) : isPending ? (
                      <div className="flex flex-col gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => navigate('/member/cart')}
                          className="w-full px-5 py-2.5 rounded-full font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <ShoppingCart className="w-4 h-4 shrink-0" />
                          <span className="whitespace-nowrap">{t('In Cart - Pay Now')}</span>
                        </button>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center">
                          {t('Seat reserved upon payment')}
                        </span>
                      </div>
                    ) : isFull ? (
                      <button
                        type="button"
                        disabled
                        className="w-full px-5 py-2.5 rounded-full font-bold text-xs bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border border-slate-200/80 dark:border-white/10 flex items-center justify-center gap-1.5 cursor-not-allowed shadow-xs"
                      >
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{t('Full')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBook(course.classId)}
                        disabled={isThisBooking}
                        className={`w-full px-6 py-2.5 rounded-full font-bold text-xs bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                          isThisBooking ? 'opacity-85 cursor-wait pointer-events-none' : 'cursor-pointer'
                        }`}
                      >
                        {isThisBooking ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span className="whitespace-nowrap">{t('Enrolling...')}</span>
                          </>
                        ) : (
                          <>
                            <span className="whitespace-nowrap">{t('Enroll Now')}</span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Cart & Checkout Bar - Cupertino Floating Island */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed bottom-6 z-40 flex justify-center px-4 pointer-events-none transition-[left] duration-200 ease-out"
            style={{
              left: 'var(--role-sidebar-width, 0px)',
              right: 0,
            }}
          >
            <div className={`pointer-events-auto w-full max-w-4xl p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200/90 dark:border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl transition-all duration-300 ${
              isCartHighlighted
                ? 'ring-4 ring-blue-500/30 border-[#0071E3]'
                : ''
            }`}>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                    {cartCount}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>{t("Selected Courses:")} </span>
                    <strong className="text-slate-900 dark:text-white font-semibold">{cartCount} {t("items selected")}</strong>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400 font-medium">{t("Subtotal:")}</span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {formatMoney(cartTotal)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("Clear")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/member/cart')}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-xs sm:text-sm transition-all shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{t("Proceed to Checkout")}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookClass;
