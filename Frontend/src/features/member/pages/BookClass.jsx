import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, User, CheckCircle2, AlertCircle, Info, Fingerprint, ShieldCheck, Repeat, Calendar, ShoppingCart, ShoppingBag, Trash2, Clock, ArrowRight, Loader2 } from 'lucide-react';
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
    if(booking!==null)return;
    setBooking(classId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/v1/member/book-class/${classId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Optimistic update: UI phản hồi ngay lập tức không cần đợi network
      setCourses(prev => prev.map(c => c.classId === classId ? {
        ...c,
        isPendingPayment: true,
        bookedSlots: Math.min(c.maxSlots, (c.bookedSlots || 0) + 1)
      } : c));

      setToast({ visible: true, type: 'success', title: t('Course Enrolled'), message: t('Course added to cart. Complete payment to confirm your place.') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
      window.dispatchEvent(new Event('cartUpdated')); // Cập nhật badge giỏ hàng ngay lập tức
      void fetchCart();
      void fetchCourses(false); // Đồng bộ ngầm
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Failed to enroll. Please try again."; setToast({ visible: true, type: 'error', title: t('Enrollment Failed'), message: typeof errorMsg === 'string' ? errorMsg : 'Please try again.' }); setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 5000);
    } finally {setBooking(null);}
  };

  const availableDates = [...new Set(courses.map(s => new Date(s.nextSessionTime).toDateString()))].sort((a, b) => new Date(a) - new Date(b));
  if (availableDates.length === 0) availableDates.push(new Date().toDateString());

  const formatDateLabel = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let prefix = d.toLocaleDateString(locale(), { weekday: 'long' });
    if (d.toDateString() === today.toDateString()) prefix = 'Today';
    if (d.toDateString() === tomorrow.toDateString()) prefix = 'Tomorrow';

    const shortDate = d.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${prefix} (${shortDate})`;
  };

  const filteredCourses = sortCoursesStably(courses.filter(s => {
    const matchesDate = new Date(s.nextSessionTime).toDateString() === selectedDate;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
                          s.className.toLowerCase().includes(term) ||
                          s.coachName.toLowerCase().includes(term);
    return matchesDate && matchesSearch;
  }));

  return (
    <div className={`flex flex-col w-full ${cartCount > 0 ? 'pb-36' : 'pb-10'} transition-all duration-300`}>
      <div className={`fixed bottom-6 left-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-surface-container-high text-on-surface shadow-[var(--shadow)] border border-surface-container-highest ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-[var(--danger-soft)] text-[var(--danger-text)]' : 'bg-primary/20 text-primary'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${toast.type === 'error' ? 'text-[var(--danger-text)]' : 'text-primary'}`}>{toast.title}</span>
            <span className="text-xs text-on-surface-variant">{t(toast.message)}</span>
          </div>
        </div>

      <section className="flex flex-col justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">{t("Book Courses")}</h1>
          <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">{t("Explore and enroll in high-performance courses and training packages.")}</p>
        </div>
      </section>

      <section className="bg-surface-container-low border border-surface-container-highest rounded-xl p-5 mb-8 shadow-[var(--shadow)] flex flex-col gap-5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
            placeholder={t("Search classes, trainers...")}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none pt-5 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-medium text-[var(--text-muted)] shrink-0 mr-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />{t("Start Date")}</span>
            {availableDates.map(dateStr => {
              const isActive = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2
                    ${isActive
                      ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft)] shadow-[var(--shadow)] scale-105'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]'}`}
                >
                  {formatDateLabel(dateStr)}
                  {isActive && <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                  </span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 flex flex-col gap-5">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant font-medium">{t("Loading available courses...")}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl border border-surface-container-highest">
              <span className="text-on-surface-variant font-medium">{t("No courses found starting on this date.")}</span>
            </div>
          ) : (
            filteredCourses.map((course, idx) => {
              const startTime = new Date(course.nextSessionTime);
              const timeStr = startTime.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });

              const spotsLeft = course.maxSlots - (course.bookedSlots || 0);
              const progressWidth = ((course.maxSlots - spotsLeft) / course.maxSlots) * 100;
              const isBooked = course.isBookedByMe;
              const isPending = !!course.isPendingPayment;
              const isFull = spotsLeft <= 0;
              const isThisBooking = Number(booking) === Number(course.classId);

              return (
                <div
                  key={course.classId || idx}
                  id={`ai-class-${course.classId}`}
                  className="relative transition-all duration-300 rounded-xl p-5 flex flex-col sm:flex-row gap-6 group overflow-hidden bg-surface-container-low border border-surface-container-highest hover:border-primary/50 shadow-[var(--shadow)]"
                >
                  <div className="relative z-10 flex flex-col shrink-0 sm:w-24 text-left">
                    <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-1">{t("First Session")}</span>
                    <span className="text-2xl font-extrabold text-on-surface">{timeStr}</span>
                    <span className="text-xs font-semibold text-on-surface-variant mt-1">{course.durationMinutes}{' '}{t("min/session")}</span>
                  </div>

                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-[11px] font-bold text-[var(--success-text)] uppercase tracking-wider bg-[var(--success-soft)] px-2 py-0.5 rounded">{t("Full Course:")}{' '}{course.totalSessions}{' '}{t("sessions")}</span>
                    </div>

                    <h3 className="text-xl font-bold text-on-surface leading-snug mb-2">{course.className}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant mb-4 font-medium">
                      <div className="flex items-center gap-1.5 text-primary">
                        <User className="w-4 h-4" />
                        <span>{t("Coach")}{' '}{course.coachName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{course.roomName}</span>
                      </div>
                    </div>

                    <details className="text-xs text-[var(--text-muted)] mb-4 group cursor-pointer bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                      <summary className="flex items-center gap-2 list-none outline-none">
                        <Repeat className="w-4 h-4 text-[var(--violet)]" />{t("Repeats on:")}<span className="text-[var(--text)] font-semibold">{t(course.schedulePattern || 'Custom')}</span>
                        <span className="text-[10px] text-[var(--primary)] ml-auto group-open:hidden border border-[var(--primary-soft)] px-2 py-0.5 rounded-full hover:bg-[var(--primary-soft)] transition-colors">{t("View all")}{' '}{course.totalSessions}{' '}{t("dates")}</span>
                      </summary>
                      <div className="mt-3 pl-6 pr-2 max-h-24 overflow-y-auto custom-scrollbar">
                        <ul className="list-disc space-y-1 text-[var(--text)] marker:text-[var(--violet)]">
                          {course.upcomingDates?.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      </div>
                    </details>

                    <div className="flex flex-col gap-1.5 mt-auto">
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${progressWidth}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        <span>{course.maxSlots - spotsLeft}/{course.maxSlots}{' '}{t("Students Enrolled")}</span>
                        {spotsLeft <= 3 && spotsLeft > 0 && <span className="text-tertiary">{t("Only")}{' '}{spotsLeft}{' '}{t("spots left!")}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-col justify-between shrink-0 sm:w-56 border-t sm:border-t-0 sm:border-l border-surface-container-highest pt-4 sm:pt-0 sm:pl-6">
                    <div className="flex flex-col gap-0.5 text-right sm:text-right">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("Course Fee")}</span>
                      <span className="text-xl font-black text-primary tracking-tight">{formatMoney(course.price)}</span>
                    </div>

                    {isBooked ? (
                      <button
                        disabled
                        className="mt-4 sm:mt-auto w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{t('Enrolled')}</span>
                      </button>
                    ) : isPending ? (
                      <div className="mt-4 sm:mt-auto flex flex-col gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => navigate('/member/cart')}
                          className="group relative w-full py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-orange-500/35 active:scale-[0.98] cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                          <span className="whitespace-nowrap">{t('In Cart - Pay Now')}</span>
                        </button>
                        <div className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium text-center">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span className="leading-tight">{t('Seat reserved upon payment')}</span>
                        </div>
                      </div>
                    ) : isFull ? (
                      <button
                        disabled
                        className="mt-4 sm:mt-auto w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{t('Full')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBook(course.classId)}
                        disabled={isThisBooking}
                        className={`group mt-4 sm:mt-auto w-full py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-[0.98] ${
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
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0" />
                          </>
                        )}

                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-6 shadow-[var(--shadow)] sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-highest">
              <div className="flex items-center gap-2 text-on-surface">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">{t("Course Policy")}</h3>
              </div>
              <span className="text-xs font-bold text-tertiary tracking-wider uppercase">{t("Nexus Pro")}</span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--success-text)] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">{t("Full Package Enrollment")}</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">{t("Enrolling in a course automatically secures your spot for all scheduled sessions.")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">{t("Express Check-in")}</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">{t("Scan your Nexus Pass QR code at the gate 10 minutes prior for automatic check-in.")}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-[var(--violet)] shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">{t("Biometric Gear")}</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">{t("Chest heart rate monitors are provided for all performance sessions.")}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-surface-container-highest">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider text-center">{t("Questions? Contact Nexus Support at Desk 1.")}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Sticky Bottom Cart & Checkout Bar with Smooth Slide-Up Motion */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-4 z-40 pointer-events-none transition-[left] duration-200 ease-out flex justify-center px-4 sm:px-6"
            style={{
              left: 'var(--role-sidebar-width, 0px)',
              right: 0,
            }}
          >
            <div className={`pointer-events-auto w-full max-w-5xl p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl backdrop-saturate-150 border flex flex-col sm:flex-row items-center justify-between gap-4 transition-[border-color,box-shadow] duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
              isCartHighlighted
                ? 'border-cyan-400 ring-2 ring-cyan-400/70 shadow-[0_0_28px_rgba(59,130,246,0.75)]'
                : 'border-white/30 dark:border-white/10'
            }`}>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] px-1 rounded-full bg-[var(--success-hover)] text-white text-[11px] font-black flex items-center justify-center border-2 border-[var(--surface-hover)] shadow-md">
                    {cartCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-on-surface font-semibold">{t("Active Cart Allocation:")}</span>
                    <span className="text-[11px] text-tertiary font-bold uppercase">{cartCount}{' '}{t("items selected")}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[12px] text-on-surface-variant">{t("Subtotal:")}</span>
                    <span className="text-xl font-bold text-on-surface">{formatMoney(cartTotal)}</span>
                    <span className="text-[12px] text-primary font-bold">{t("VND")}</span>
                    <span className="text-[11px] text-on-surface-variant hidden md:inline ml-1">{t("(VAT & service fee included)")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={clearCart}
                  className="hidden md:flex items-center gap-1.5 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/25 hover:border-rose-500/40 text-[13px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title={t("Clear")}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("Clear")}</span>
                </button>
                <button
                  onClick={() => navigate('/member/cart')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary-container hover:bg-inverse-primary text-on-primary-container hover:text-surface text-[14px] font-bold transition-all shadow-[var(--shadow)] shadow-primary-container/20 active:scale-95"
                >
                  <span>{t("Proceed to Checkout")}</span>
                  <ArrowRight className="w-5 h-5" />
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
