import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search, MapPin, User, CheckCircle2, AlertCircle,
  Repeat, Calendar, ShoppingBag,
  Clock, ArrowRight, ArrowLeft, Loader2, Sparkles, X, ChevronDown, Dumbbell, Sunrise, Sun, Sunset, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ORIGIN } from '../../../config/apiBase.js';

const detectCourseSubject = (course) => {
  if (course.subjectName && course.subjectName.trim()) {
    return course.subjectName.trim();
  }
  const name = (course.className || '').toLowerCase();
  if (name.includes('spin') || name.includes('đạp xe') || name.includes('cycling')) return 'Đạp Xe Spinning';
  if (name.includes('yoga')) return 'Yoga';
  if (name.includes('zumba')) return 'Zumba Dance';
  if (name.includes('gym') || name.includes('thể hình') || name.includes('siết cơ')) return 'Thể Hình / Gym';
  if (name.includes('swim') || name.includes('bơi')) return 'Bơi Lội';
  if (name.includes('box') || name.includes('kickfit')) return 'Boxing & Kickfit';
  if (name.includes('pil') || name.includes('reformer')) return 'Pilates Reformer';
  return 'Other Sports';
};

const formatSchedulePattern = (pattern) => {
  if (!pattern) return t('Custom');
  const isVi = t('Monday') !== 'Monday';
  const dayMap = isVi ? {
    Mon: 'Thứ 2',
    Tue: 'Thứ 3',
    Wed: 'Thứ 4',
    Thu: 'Thứ 5',
    Fri: 'Thứ 6',
    Sat: 'Thứ 7',
    Sun: 'Chủ nhật'
  } : {
    Mon: 'Mon',
    Tue: 'Tue',
    Wed: 'Wed',
    Thu: 'Thu',
    Fri: 'Fri',
    Sat: 'Sat',
    Sun: 'Sun'
  };
  return pattern.split(',').map(d => dayMap[d.trim()] || d.trim()).join(', ');
};


const DAYS_OF_WEEK = [
  { id: 'ALL', label: 'All Days', short: 'Tất cả' },
  { id: 'Mon', label: 'Monday', short: 'Thứ 2' },
  { id: 'Tue', label: 'Tuesday', short: 'Thứ 3' },
  { id: 'Wed', label: 'Wednesday', short: 'Thứ 4' },
  { id: 'Thu', label: 'Thursday', short: 'Thứ 5' },
  { id: 'Fri', label: 'Friday', short: 'Thứ 6' },
  { id: 'Sat', label: 'Saturday', short: 'Thứ 7' },
  { id: 'Sun', label: 'Sunday', short: 'Chủ nhật' }
];

const TIME_SLOTS = [
  { id: 'ALL', label: 'All Times', timeRange: '24h', icon: Clock },
  { id: 'MORNING', label: 'Morning', timeRange: '06:00 - 12:00', icon: Sunrise },
  { id: 'AFTERNOON', label: 'Afternoon', timeRange: '12:00 - 17:30', icon: Sun },
  { id: 'EVENING', label: 'Evening', timeRange: '17:30 - 22:00', icon: Sunset }
];

const checkMatchesDay = (course, dayId) => {
  if (!dayId || dayId === 'ALL') return true;
  const pattern = (course.schedulePattern || '').toLowerCase();
  if (pattern.includes(dayId.toLowerCase())) return true;
  if (course.nextSessionTime) {
    const d = new Date(course.nextSessionTime);
    if (!isNaN(d.getTime())) {
      const dayEn = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
      if (dayEn.startsWith(dayId.toLowerCase().slice(0, 3))) return true;
    }
  }
  if (Array.isArray(course.upcomingDates)) {
    for (const dt of course.upcomingDates) {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) {
        const dayEn = d.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        if (dayEn.startsWith(dayId.toLowerCase().slice(0, 3))) return true;
      }
    }
  }
  return false;
};

const getCourseDays = (course) => {
  const pattern = (course.schedulePattern || '').toLowerCase();
  const dayTokens = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days = [];
  for (const token of dayTokens) {
    if (pattern.includes(token.toLowerCase())) {
      days.push(token);
    }
  }
  if (days.length === 0 && course.nextSessionTime) {
    const d = new Date(course.nextSessionTime);
    if (!isNaN(d.getTime())) {
      const en = d.toLocaleDateString('en-US', { weekday: 'short' });
      const matched = dayTokens.find(t => en.toLowerCase().startsWith(t.toLowerCase()));
      if (matched) days.push(matched);
    }
  }
  return days;
};

const checkCourseMatchesDays = (course, days, mode) => {
  if (!days || days.length === 0) return true;
  if (mode === 'EXACT') {
    const courseDays = getCourseDays(course);
    if (courseDays.length === 0) {
      return days.some(d => checkMatchesDay(course, d));
    }
    return courseDays.every(d => days.includes(d));
  }
  return days.some(d => checkMatchesDay(course, d));
};

const checkMatchesTimeSlot = (course, slotId) => {
  if (!slotId || slotId === 'ALL') return true;
  if (!course.nextSessionTime) return false;
  const d = new Date(course.nextSessionTime);
  if (!isNaN(d.getTime())) {
    const hour = d.getHours() + d.getMinutes() / 60;
    if (slotId === 'MORNING') return hour >= 5 && hour < 12;
    if (slotId === 'AFTERNOON') return hour >= 12 && hour < 17.5;
    if (slotId === 'EVENING') return hour >= 17.5;
  }
  return true;
};

const BookClass = () => {
  useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const [highlightedClassId, setHighlightedClassId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // selectedSubject: null = Catalog View (Cấp 1: Thẻ bộ môn), string = Drill-down View (Cấp 2: Danh sách lớp)
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [dayMatchMode, setDayMatchMode] = useState('ANY'); // 'ANY' | 'EXACT'

  const toggleDay = (dayId) => {
    if (dayId === 'ALL') {
      setSelectedDays([]);
      return;
    }
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      }
      return [...prev, dayId];
    });
  };

  const toggleTimeSlot = (slotId) => {
    if (slotId === 'ALL') {
      setSelectedTimeSlots([]);
      return;
    }
    setSelectedTimeSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(s => s !== slotId);
      }
      return [...prev, slotId];
    });
  };
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

  // Deep-link effect: when arriving via ?classId=139 from NEXUS AI Chat table
  useEffect(() => {
    if (!classIdParam || courses.length === 0) return;
    const targetCourse = courses.find(c => String(c.classId) === String(classIdParam));
    if (targetCourse) {
      const subject = detectCourseSubject(targetCourse);
      setSelectedSubject(subject || 'ALL');
      // Reset filters so the course card is not hidden
      setSearchTerm('');
      setSelectedDate('ALL');
      setSelectedDays([]);
      setSelectedTimeSlots([]);
      setHighlightedClassId(Number(classIdParam));

      // Scroll smoothly to target card
      setTimeout(() => {
        const el = document.getElementById(`course-card-${classIdParam}`) || document.getElementById(`ai-class-${classIdParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      // Remove highlight after 4.5 seconds
      const timer = setTimeout(() => {
        setHighlightedClassId(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [classIdParam, courses]);

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
      const res = await axios.get(`${API_ORIGIN}/api/v1/member/available-classes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const stableList = sortCoursesStably(res.data);
      setCourses(stableList);

      if (stableList.length > 0) {
        const uniqueDates = [...new Set(stableList.map(s => new Date(s.nextSessionTime).toDateString()))].sort((a, b) => new Date(a) - new Date(b));
        setSelectedDate(prev => {
          if (isInitialLoad || !prev) return 'ALL';
          return uniqueDates.includes(prev) ? prev : 'ALL';
        });
      } else {
        setSelectedDate('ALL');
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
      const res = await axios.get(`${API_ORIGIN}/api/v1/payment/cart`, {
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

  const handleBook = async (classId) => {
    if (booking !== null) return;
    setBooking(classId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_ORIGIN}/api/v1/member/book-class/${classId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
    const conflictMatch = msg.match(/Schedule conflict! The session at (.*?) overlaps with your existing course: '(.*?)'\.?/i);
    if (conflictMatch) {
      let rawTime = conflictMatch[1];
      const courseName = conflictMatch[2];
      rawTime = rawTime.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/, (_, y, m, d, hh, mm) => {
        return `${hh}:${mm} (${d}/${m}/${y})`;
      });
      return t("Schedule conflict! The session at {0} overlaps with your existing course: '{1}'.", [rawTime, courseName]);
    }
    return t(msg).replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?/, (_, y, m, d, hh, mm) => {
      return `${hh}:${mm} (${d}/${m}/${y})`;
    });
  };

  // Extract Summary of Subject Disciplines
  const subjectSummaries = useMemo(() => {
    const map = {};
    courses.forEach(c => {
      const subj = detectCourseSubject(c);
      if (!map[subj]) {
        map[subj] = {
          name: subj,
          count: 0,
          courses: [],
          coaches: new Set(),
          rooms: new Set(),
          minPrice: Number(c.price || 0)
        };
      }
      map[subj].count += 1;
      map[subj].courses.push(c);
      if (c.coachName) map[subj].coaches.add(c.coachName);
      if (c.roomName) map[subj].rooms.add(c.roomName);
      if (c.price && Number(c.price) < map[subj].minPrice) {
        map[subj].minPrice = Number(c.price);
      }
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  // Filter subjects in Overview mode if search keyword exists
  const filteredSubjectSummaries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return subjectSummaries;
    return subjectSummaries.filter(subj => {
      return subj.name.toLowerCase().includes(term) ||
        Array.from(subj.coaches).some(coach => coach.toLowerCase().includes(term)) ||
        Array.from(subj.rooms).some(room => room.toLowerCase().includes(term)) ||
        subj.courses.some(c => c.className.toLowerCase().includes(term));
    });
  }, [subjectSummaries, searchTerm]);

  // Available dates for drill-down view
  const availableDates = useMemo(() => {
    const relevantCourses = courses.filter(c => {
      const matchesSubject = selectedSubject === 'ALL' || !selectedSubject || detectCourseSubject(c) === selectedSubject;
      const matchesDay = checkCourseMatchesDays(c, selectedDays, dayMatchMode);
      const matchesTime = selectedTimeSlots.length === 0 || selectedTimeSlots.some(s => checkMatchesTimeSlot(c, s));
      return matchesSubject && matchesDay && matchesTime;
    });

    return [...new Set(
      relevantCourses
        .filter(s => Boolean(s.nextSessionTime) && !isNaN(new Date(s.nextSessionTime).getTime()))
        .map(s => new Date(s.nextSessionTime).toDateString())
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [courses, selectedSubject, selectedDays, dayMatchMode, selectedTimeSlots]);

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

  // Filtered courses in Drill-down mode
  const filteredCourses = useMemo(() => {
    return sortCoursesStably(courses.filter(s => {
      const subj = detectCourseSubject(s);
      const matchesSubject = selectedSubject === 'ALL' || subj === selectedSubject;
      const matchesDay = checkCourseMatchesDays(s, selectedDays, dayMatchMode);
      const matchesTime = selectedTimeSlots.length === 0 || selectedTimeSlots.some(slot => checkMatchesTimeSlot(s, slot));
      const matchesDate = !selectedDate || selectedDate === 'ALL' || (Boolean(s.nextSessionTime) && new Date(s.nextSessionTime).toDateString() === selectedDate);
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = !term ||
                            s.className.toLowerCase().includes(term) ||
                            s.coachName.toLowerCase().includes(term) ||
                            subj.toLowerCase().includes(term) ||
                            (s.roomName && s.roomName.toLowerCase().includes(term));
      return matchesSubject && matchesDay && matchesTime && matchesDate && matchesSearch;
    }));
  }, [courses, selectedSubject, selectedDays, dayMatchMode, selectedTimeSlots, selectedDate, searchTerm]);

  const isFiltered = Boolean(
    searchTerm.trim() ||
    selectedDays.length > 0 ||
    selectedTimeSlots.length > 0 ||
    (selectedDate && selectedDate !== 'ALL')
  );

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDays([]);
    setSelectedTimeSlots([]);
    setSelectedDate('ALL');
    setDayMatchMode('ANY');
  };

  return (
    <div className={`flex flex-col w-full max-w-6xl mx-auto space-y-6 ${cartCount > 0 ? 'pb-36' : 'pb-12'} transition-all duration-300`}>
      {/* Toast Notification */}
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
              className={`pointer-events-auto w-full max-w-lg p-4 rounded-md backdrop-blur-3xl border shadow-2xl flex items-start gap-3.5 transition-all ${
                toast.type === 'error'
                  ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-900 dark:text-white'
                  : 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-900 dark:text-white'
              }`}
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
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
                className="w-7 h-7 rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-blue-500/10 text-[var(--primary)] text-[11px] font-semibold border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("Class Schedule & Courses")}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Member Enrollment")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t("Book Courses")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {t("Choose a sport discipline to explore schedules and enroll in available classes.")}
          </p>
        </div>

        {/* Quick Cart Pill */}
        {cartCount > 0 && (
          <button
            type="button"
            onClick={() => navigate('/member/cart')}
            className="self-start sm:self-center px-4 py-2 rounded-md bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{cartCount} {t("courses in cart")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODE 1: MASTER VIEW - SUBJECT CATALOG (selectedSubject === null) */}
      {/* ======================================================== */}
      {selectedSubject === null ? (
        <div className="space-y-6">
          {/* Controls Bar for Subject Catalog */}
          <div className="p-4 rounded-md bg-[var(--surface)] border border-slate-300 dark:border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("Search by sport (Yoga, Gym, Cycling, Swim...), coach or room...")}
                className="w-full pl-10 pr-9 py-2 rounded-md bg-[var(--bg)] border border-slate-300 dark:border-white/15 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action: View All Classes Directly */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subjectSummaries.length} {t("Active Sports")} · {courses.length} {t("classes available")}
              </span>
              <button
                type="button"
                onClick={() => { setSelectedSubject('ALL'); resetFilters(); }}
                className="px-3.5 py-2 rounded-md text-xs font-bold bg-[var(--primary)] text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <span>{t("View all classes")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subject Cards Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <span className="text-xs text-slate-400 font-semibold">{t("Loading available courses...")}</span>
            </div>
          ) : filteredSubjectSummaries.length === 0 ? (
            <div className="p-12 text-center rounded-md bg-[var(--surface)] border border-slate-300 dark:border-white/15 space-y-3">
              <Dumbbell className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("No matching sports found")}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {t("Try clearing your search keyword to view all sports disciplines.")}
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer"
              >
                {t("Clear filters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubjectSummaries.map((subj) => (
                <div
                  key={subj.name}
                  onClick={() => { setSelectedSubject(subj.name); resetFilters(); }}
                  className="rounded-md bg-[var(--surface)] border border-slate-300 dark:border-white/15 p-5 flex flex-col justify-between hover:border-slate-800 dark:hover:border-white/40 transition-all shadow-xs hover:shadow-sm cursor-pointer group"
                >
                  <div>
                    {/* Tag & Count */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                        {t("Sport Discipline")}
                      </span>
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                        {subj.count} {t("classes")}
                      </span>
                    </div>

                    {/* Subject Name */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-[var(--primary)] transition-colors">
                      {t(subj.name)}
                    </h3>

                    {/* Room & Location */}
                    {subj.rooms.size > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{Array.from(subj.rooms).join(' · ')}</span>
                      </div>
                    )}

                    {/* Coach */}
                    {subj.coaches.size > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{t("Coach")}: {Array.from(subj.coaches).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t("Tuition from")}: <strong className="font-mono text-slate-900 dark:text-white">{formatMoney(subj.minPrice)}</strong>
                    </span>
                    <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>{t("View classes")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ======================================================== */
        /* MODE 2: DETAIL VIEW - CLASSES OF SELECTED SUBJECT        */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Refined Navigation Header - Clean Slate/Surface (No harsh black) */}
          <div className="p-4 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-300 dark:border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setSelectedSubject(null); resetFilters(); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-700 dark:text-slate-100 transition-colors cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t("Back to all sports")}</span>
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--primary)] font-mono">
                  {t("Selected Sport")}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {selectedSubject === 'ALL' ? t("All Active Classes") : t(selectedSubject)}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span className="font-bold text-[var(--primary)] font-mono text-sm">{filteredCourses.length}</span>
              <span>{t("classes matching")}</span>
            </div>
          </div>

          {/* Bento Schedule Filter Dock */}
          <div className="p-4 sm:p-5 rounded-md bg-[var(--surface)] border border-slate-300 dark:border-white/15 shadow-xs space-y-4">
            {/* Row 1: Search Field + Reset Filters Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Search by class name, coach, or room...")}
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-md bg-[var(--bg)] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15 transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t("Reset Filters")}</span>
                </button>
              )}
            </div>

            {/* Row 2: Day of Week Pills (Thứ trong tuần - Multi-select) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs px-0.5">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span>{t("Filter by Day of Week:")}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({t("select one or more days")})</span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Mode Toggle Switch (Segmented Control) */}
                  <div className="flex items-center bg-slate-200/80 dark:bg-white/10 p-0.5 rounded-md text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setDayMatchMode('ANY')}
                      className={`px-2 py-0.5 rounded-sm transition-all cursor-pointer ${
                        dayMatchMode === 'ANY'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {t("Any Selected Day")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayMatchMode('EXACT')}
                      className={`px-2 py-0.5 rounded-sm transition-all cursor-pointer ${
                        dayMatchMode === 'EXACT'
                          ? 'bg-[var(--primary)] text-white shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                      title={t("Only show classes whose sessions fall strictly within selected days")}
                    >
                      {t("Only These Days")}
                    </button>
                  </div>

                  {selectedDays.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDays([])}
                      className="text-[var(--primary)] hover:underline font-semibold cursor-pointer text-xs shrink-0"
                    >
                      {t("Show all days")}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = day.id === 'ALL' ? selectedDays.length === 0 : selectedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-xs border border-[var(--primary)]'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span className="tracking-tight">{t(day.label)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Time Slot Pills (Khung giờ trong ngày - Multi-select) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold px-0.5">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t("Filter by Time Slot:")}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({t("select one or more slots")})</span>
                </span>
                {selectedTimeSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTimeSlots([])}
                    className="text-[var(--primary)] hover:underline font-semibold cursor-pointer text-xs"
                  >
                    {t("Show all times")}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isActive = slot.id === 'ALL' ? selectedTimeSlots.length === 0 : selectedTimeSlots.includes(slot.id);
                  const Icon = slot.icon;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleTimeSlot(slot.id)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-[var(--primary)] text-white shadow-xs border border-[var(--primary)]'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="font-bold truncate">{t(slot.label)}</span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                        {slot.timeRange}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Start Date Strip (Ngày khai giảng) */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold px-0.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t("Select Start Date:")}</span>
                </span>
                {selectedDate !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate('ALL')}
                    className="text-[var(--primary)] hover:underline font-semibold cursor-pointer text-xs"
                  >
                    {t("Show all dates")}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {/* All Dates Pill */}
                <button
                  type="button"
                  onClick={() => setSelectedDate('ALL')}
                  className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-md min-w-[65px] transition-all cursor-pointer ${
                    selectedDate === 'ALL'
                      ? 'bg-[var(--primary)] text-white font-bold shadow-xs border border-[var(--primary)]'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                    {t("ALL")}
                  </span>
                  <span className={`text-sm font-black my-0.5 ${selectedDate === 'ALL' ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    ∞
                  </span>
                  <span className={`text-[10px] font-medium ${selectedDate === 'ALL' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                    {t("Dates")}
                  </span>
                </button>

                {/* Individual Dates */}
                {availableDates.map((dateStr) => {
                  const isActive = selectedDate === dateStr;
                  const { weekday, dayNum, monthStr } = parseDateDetails(dateStr);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex flex-col items-center justify-center px-3.5 py-2 rounded-md min-w-[68px] transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[var(--primary)] text-white font-bold shadow-xs border border-[var(--primary)]'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                        {weekday}
                      </span>
                      <span className={`text-base font-black leading-none my-0.5 ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                        {dayNum}
                      </span>
                      <span className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                        {monthStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Courses List */}
          <div className="space-y-4">
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center rounded-md bg-[var(--surface)] border border-slate-300 dark:border-white/15 space-y-3">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("No courses found")}</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t("No courses match your filter criteria (Day of week, Time slot, or Start date). Try clearing some filters.")}
                </p>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t("Clear all filters")}</span>
                  </button>
                )}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setSelectedDate('ALL'); setSearchTerm(''); }}
                    className="px-3 py-1.5 rounded-md bg-[var(--primary)] text-white hover:opacity-90 text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    {t("Clear filters")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubject(null)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-white/15 text-xs font-semibold cursor-pointer"
                  >
                    {t("Back to all sports")}
                  </button>
                </div>
              </div>
            ) : (
              filteredCourses.map((course, idx) => {
                const startTime = new Date(course.nextSessionTime);
                const timeStr = startTime.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });

                const rawBooked = Number(course.bookedSlots) || 0;
                const spotsLeft = Math.max(0, course.maxSlots - rawBooked);
                const displayBooked = Math.min(course.maxSlots, rawBooked);
                const isBooked = course.isBookedByMe;
                const isPending = !!course.isPendingPayment;
                const isFull = spotsLeft <= 0;
                const isThisBooking = Number(booking) === Number(course.classId);
                const isScheduleExpanded = expandedSchedules.has(course.classId);
                const courseSubj = detectCourseSubject(course);

                return (
                  <div
                    key={course.classId || idx}
                    id={`course-card-${course.classId}`}
                    className={`rounded-md p-5 bg-[var(--surface)] border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      highlightedClassId === course.classId
                        ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 shadow-lg shadow-blue-500/25 animate-pulse'
                        : 'border-slate-300 dark:border-white/15 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Left/Main Information */}
                    <div className="flex-1 space-y-3">
                      {/* Top Badges (Squared, Clean, No Emojis) */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Subject Badge */}
                        <span className="px-2.5 py-0.5 rounded-sm text-[11px] font-bold font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/15">
                          {t("Subject:")} {t(courseSubj)}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-sm text-xs font-bold bg-blue-500/10 text-[var(--primary)] border border-blue-500/20">
                          {t("Full Course:")} {course.totalSessions} {t("sessions")}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t("Starts:")} {timeStr} ({course.durationMinutes} {t("min")})</span>
                        </span>
                      </div>

                      {/* Class Title */}
                      <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {course.className}
                      </h3>

                      {/* Key Metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>{t("Coach")} <strong className="text-slate-900 dark:text-white font-semibold">{course.coachName}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{course.roomName}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5 text-purple-500" />
                          <span>{t("Repeats:")} <strong className="text-slate-900 dark:text-white font-semibold">{formatSchedulePattern(course.schedulePattern)}</strong></span>
                        </div>
                      </div>

                      {/* Schedule Details Drawer */}
                      {course.upcomingDates && course.upcomingDates.length > 0 && (
                        <div className="rounded-md bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] overflow-hidden transition-all">
                          <button
                            type="button"
                            onClick={() => toggleSchedule(course.classId)}
                            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer select-none"
                          >
                            <span className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                              <span>
                                {isScheduleExpanded ? t("Hide course schedule") : t("View all scheduled sessions")}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[var(--primary)] px-2 py-0.5 rounded-sm bg-blue-500/10 border border-blue-500/20 font-mono">
                                {course.upcomingDates.length} {t("sessions")}
                              </span>
                              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isScheduleExpanded ? 'rotate-180 text-[var(--primary)]' : ''}`} />
                            </div>
                          </button>

                          {isScheduleExpanded && (
                            <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-white/[0.06] space-y-2.5">
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
                                    className="px-3 py-2 rounded-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/[0.06] shadow-2xs flex flex-col gap-0.5"
                                  >
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--primary)] uppercase font-mono">
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
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">
                            {displayBooked}/{course.maxSlots} {t("Students Enrolled")}
                          </span>
                          {spotsLeft <= 3 && spotsLeft > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              {t("Only {0} spots remaining!", [spotsLeft])}
                            </span>
                          )}
                          {isFull && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              {t("Class is fully booked")}
                            </span>
                          )}
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isFull ? 'bg-rose-500' : spotsLeft <= 3 ? 'bg-amber-500' : 'bg-[var(--primary)]'
                            }`}
                            style={{ width: `${Math.min(100, (displayBooked / (course.maxSlots || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Pricing & Action Button */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-white/10 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          {t("Tuition Fee")}
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                          {formatMoney(course.price)}
                        </span>
                      </div>

                      <div className="w-full sm:w-auto">
                        {isBooked ? (
                          <div className="px-4 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t("Enrolled")}</span>
                          </div>
                        ) : isPending ? (
                          <div className="px-4 py-2 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            <span>{t("Pending Checkout")}</span>
                          </div>
                        ) : isFull ? (
                          <button
                            disabled
                            className="w-full px-4 py-2 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-400 text-xs font-semibold cursor-not-allowed border border-slate-200 dark:border-white/[0.08]"
                          >
                            {t("Full")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBook(course.classId)}
                            disabled={isThisBooking}
                            className="w-full px-5 py-2.5 rounded-md bg-[var(--primary)] hover:opacity-90 text-white font-bold text-xs shadow-xs transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isThisBooking ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{t("Enrolling...")}</span>
                              </>
                            ) : (
                              <>
                                <span>{t("Enroll Now")}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
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
        </div>
      )}
    </div>
  );
};

export default BookClass;
