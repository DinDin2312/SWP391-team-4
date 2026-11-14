import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import { classLevelFromCode, splitCode } from '../../manager/components/classSearch';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Search, MapPin, User, CheckCircle2, AlertCircle,
  Repeat, Calendar, ShoppingBag, Trash2, BookOpen, Users,
  Clock, ArrowRight, ArrowLeft, Loader2, Sparkles, X, Dumbbell, Sunrise, Sun, Sunset, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ORIGIN } from '../../../config/apiBase.js';
import { resourceImageUrl } from '../../../components/resource-images/resourceImages';

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

const getSubjectFallbackImage = (course) => {
  const text = `${course?.subjectName || ''} ${course?.className || ''}`.toLowerCase();
  if (text.includes('bơi') || text.includes('swim')) return '/images/swimming-poster.jpg';
  if (text.includes('box') || text.includes('kick') || text.includes('võ')) return '/images/boxing-poster.jpg';
  if (text.includes('yoga') || text.includes('pilates') || text.includes('zumba') || text.includes('dance')) return '/images/studio-poster.jpg';
  if (text.includes('đạp xe') || text.includes('spin') || text.includes('cycle') || text.includes('hiit') || text.includes('crossfit')) return '/images/crossfit-poster.jpg';
  return '/images/gym-poster.jpg';
};

const getCourseCoverUrl = (course) => {
  return resourceImageUrl(course?.imagePath) || getSubjectFallbackImage(course);
};

const getCourseDescription = (course) => {
  return course?.subjectDescription?.trim() || '';
};

const formatCourseTiming = (course, isVi) => {
  const dateFmtLocale = isVi ? 'vi-VN' : 'en-GB';
  const nextObj = course?.nextSessionTime ? new Date(course.nextSessionTime) : null;
  const hasValidNext = nextObj && !isNaN(nextObj.getTime());
  const durationMin = Number(course?.durationMinutes) > 0 ? Number(course.durationMinutes) : 60;
  const endObj = hasValidNext ? new Date(nextObj.getTime() + durationMin * 60000) : null;
  const startClock = hasValidNext
    ? nextObj.toLocaleTimeString(dateFmtLocale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';
  const endClock = endObj
    ? endObj.toLocaleTimeString(dateFmtLocale, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';

  return {
    timeStr: hasValidNext ? `${startClock} - ${endClock}` : '--:--',
    nextDateStr: hasValidNext
      ? nextObj.toLocaleDateString(dateFmtLocale, { day: '2-digit', month: '2-digit', year: 'numeric' })
      : (isVi ? 'Sắp khai giảng' : 'Upcoming'),
    patternText: formatSchedulePattern(course?.schedulePattern),
  };
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

const COURSES_PER_PAGE = 6;

const sortCoursesStably = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeDiff = new Date(a.nextSessionTime).getTime() - new Date(b.nextSessionTime).getTime();
    if (timeDiff !== 0) return timeDiff;
    return (Number(a.classId) || 0) - (Number(b.classId) || 0);
  });
};

const BookClass = () => {
  const language = useLanguage();
  const isVi = language === 'vi';
  const tr = (vi, en) => (isVi ? vi : en);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const classIdParam = searchParams.get('classId');
  const [highlightedClassId, setHighlightedClassId] = useState(null);
  const lastHandledDeepLinkRef = useRef('');
  const highlightTimerRef = useRef(null);
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
  const [currentPage, setCurrentPage] = useState(1);

  const toggleDay = (dayId) => {
    setCurrentPage(1);
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
    setCurrentPage(1);
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
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);

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

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Deep-link effect: when arriving via ?classId=139 from NEXUS AI Chat table
  useEffect(() => {
    if (!classIdParam || courses.length === 0) return;
    const deepLinkKey = `${location.key || 'init'}:${classIdParam}`;
    if (lastHandledDeepLinkRef.current === deepLinkKey) return;

    const targetCourse = courses.find(c => String(c.classId) === String(classIdParam));
    if (targetCourse) {
      lastHandledDeepLinkRef.current = deepLinkKey;
      const subject = detectCourseSubject(targetCourse);
      const targetSubject = subject || 'ALL';
      setSelectedSubject(targetSubject);
      // Reset filters so the course card is not hidden
      setSearchTerm('');
      setSelectedDate('ALL');
      setSelectedDays([]);
      setSelectedTimeSlots([]);
      setDayMatchMode('ANY');
      const subjectCourses = sortCoursesStably(
        courses.filter(s => targetSubject === 'ALL' || detectCourseSubject(s) === targetSubject)
      );
      const targetIdx = subjectCourses.findIndex(c => String(c.classId) === String(classIdParam));
      setCurrentPage(targetIdx >= 0 ? Math.floor(targetIdx / COURSES_PER_PAGE) + 1 : 1);
      setHighlightedClassId(Number(classIdParam));

      // Scroll smoothly to target card
      setTimeout(() => {
        const el = document.getElementById(`course-card-${classIdParam}`) || document.getElementById(`ai-class-${classIdParam}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);

      // Remove highlight after 7 seconds
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedClassId(null);
      }, 7000);
    }
  }, [classIdParam, location.key, courses]);

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

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_ORIGIN}/api/v1/payment/cart/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartCount(0);
      setCartTotal(0);
      void fetchCart();
      void fetchCourses(false);
      window.dispatchEvent(new Event('cartUpdated'));

      setToast({ visible: true, type: 'success', title: t('Success'), message: t('Cart cleared successfully') });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 2800);
    } catch {
      setToast({ visible: true, type: 'error', title: t('Error'), message: t('Failed to clear cart') });
      setTimeout(() => setToast({ visible: false, type: 'error', title: '', message: '' }), 3000);
    }
  };

  const handleBook = async (classId) => {
    if (booking !== null) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightedClassId(null);
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
      const desc = getCourseDescription(c);
      const price = Number(c.price || 0);
      const uploadedImg = Boolean(resourceImageUrl(c.imagePath));

      if (!map[subj]) {
        map[subj] = {
          name: subj,
          description: desc,
          count: 0,
          courses: [],
          coaches: new Set(),
          rooms: new Set(),
          minPrice: price,
          coverUrl: getCourseCoverUrl(c),
          hasCustomCover: uploadedImg,
        };
      }
      map[subj].count += 1;
      map[subj].courses.push(c);
      if (!map[subj].description && desc) map[subj].description = desc;
      if (!map[subj].hasCustomCover && uploadedImg) {
        map[subj].coverUrl = getCourseCoverUrl(c);
        map[subj].hasCustomCover = true;
      }
      if (c.coachName) map[subj].coaches.add(c.coachName);
      if (c.roomName) map[subj].rooms.add(c.roomName);
      if (price > 0 && (map[subj].minPrice === 0 || price < map[subj].minPrice)) {
        map[subj].minPrice = price;
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
        (subj.description && subj.description.toLowerCase().includes(term)) ||
        Array.from(subj.coaches).some(coach => coach.toLowerCase().includes(term)) ||
        Array.from(subj.rooms).some(room => room.toLowerCase().includes(term)) ||
        subj.courses.some(c => (c.className || '').toLowerCase().includes(term));
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
                            (s.className && s.className.toLowerCase().includes(term)) ||
                            (s.coachName && s.coachName.toLowerCase().includes(term)) ||
                            subj.toLowerCase().includes(term) ||
                            (s.subjectDescription && s.subjectDescription.toLowerCase().includes(term)) ||
                            (s.roomName && s.roomName.toLowerCase().includes(term));
      return matchesSubject && matchesDay && matchesTime && matchesDate && matchesSearch;
    }));
  }, [courses, selectedSubject, selectedDays, dayMatchMode, selectedTimeSlots, selectedDate, searchTerm]);

  const totalCoursePages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const safeCoursePage = Math.min(currentPage, totalCoursePages);
  const paginatedCourses = useMemo(() => {
    const start = (safeCoursePage - 1) * COURSES_PER_PAGE;
    return filteredCourses.slice(start, start + COURSES_PER_PAGE);
  }, [filteredCourses, safeCoursePage]);

  const handleCoursePageChange = (nextPage) => {
    const clamped = Math.max(1, Math.min(totalCoursePages, nextPage));
    setCurrentPage(clamped);
    const gridEl = document.getElementById('member-course-grid-top');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
    setCurrentPage(1);
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
            <span>{cartCount} {tr('khóa học trong giỏ', 'courses in cart')}</span>
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{tr('Không tìm thấy bộ môn phù hợp', 'No matching sports found')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {tr('Thử xóa từ khóa tìm kiếm để xem toàn bộ các bộ môn.', 'Try clearing your search keyword to view all sports disciplines.')}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjectSummaries.map((subj) => (
                <div
                  key={subj.name}
                  onClick={() => { setSelectedSubject(subj.name); resetFilters(); }}
                  className="bg-[var(--surface)] dark:bg-[#0a1122] border border-slate-300 dark:border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer group"
                >
                  <div>
                    {/* Subject Cover Image */}
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={subj.coverUrl}
                        alt={subj.name}
                        loading="lazy"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.fallback) {
                            e.currentTarget.dataset.fallback = '1';
                            e.currentTarget.src = getSubjectFallbackImage({ subjectName: subj.name });
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 dark:from-[#0a1122] via-black/40 to-black/15" />
                      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-bold text-blue-300">
                          {t("Sport Discipline")}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-[11px] font-bold text-white">
                          {subj.count} {t("classes")}
                        </span>
                      </div>
                    </div>

                    {/* Subject Body */}
                    <div className="p-6 pb-4 space-y-3">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[var(--primary)] transition-colors">
                        {t(subj.name)}
                      </h3>

                      {subj.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {subj.description}
                        </p>
                      )}

                      <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                        {subj.rooms.size > 0 && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span className="truncate">{Array.from(subj.rooms).join(' · ')}</span>
                          </div>
                        )}
                        {subj.coaches.size > 0 && (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                            <span className="truncate">
                              {t("Coach")}: <strong className="text-slate-900 dark:text-white font-semibold">{Array.from(subj.coaches).join(', ')}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Subject Footer */}
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800/90 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                        {t("Tuition from")}
                      </div>
                      <div className="text-base font-black text-slate-900 dark:text-white">
                        {formatMoney(subj.minPrice)}
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] group-hover:translate-x-0.5 transition-all">
                      <span>{t("View classes")}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
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
        <div id="member-course-grid-top" className="space-y-6">
          {/* Refined Navigation Header + Quick Subject Switcher */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] dark:bg-[#0a1122] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setSelectedSubject(null); resetFilters(); }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-100 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t("Back to all sports")}</span>
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--primary)] font-mono">
                    {t("Selected Sport")}
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {selectedSubject === 'ALL' ? t("All Active Classes") : t(selectedSubject)}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span className="font-bold text-[var(--primary)] font-mono text-sm">{filteredCourses.length}</span>
                <span>{t("classes matching")}</span>
              </div>
            </div>

            {/* Quick Subject Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => { setSelectedSubject('ALL'); setSelectedDate('ALL'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSubject === 'ALL'
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {tr(`Tất cả (${courses.length})`, `All (${courses.length})`)}
              </button>
              {subjectSummaries.map((subj) => (
                <button
                  key={subj.name}
                  type="button"
                  onClick={() => { setSelectedSubject(subj.name); setSelectedDate('ALL'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedSubject === subj.name
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {t(subj.name)} ({subj.count})
                </button>
              ))}
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
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder={t("Search by class name, coach, or room...")}
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-md bg-[var(--bg)] border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
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
                      onClick={() => { setDayMatchMode('ANY'); setCurrentPage(1); }}
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
                      onClick={() => { setDayMatchMode('EXACT'); setCurrentPage(1); }}
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
                      onClick={() => { setSelectedDays([]); setCurrentPage(1); }}
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
                    onClick={() => { setSelectedTimeSlots([]); setCurrentPage(1); }}
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
                    onClick={() => { setSelectedDate('ALL'); setCurrentPage(1); }}
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
                  onClick={() => { setSelectedDate('ALL'); setCurrentPage(1); }}
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
                      onClick={() => { setSelectedDate(dateStr); setCurrentPage(1); }}
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

          {/* Courses Grid */}
          <div>
            {filteredCourses.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[var(--surface)] dark:bg-[#0a1122] border border-slate-300 dark:border-slate-800 space-y-3">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("No courses found")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t("No courses match your filter criteria (Day of week, Time slot, or Start date). Try clearing some filters.")}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 text-xs font-bold cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t("Clear filters")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setSelectedSubject(null); resetFilters(); }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                  >
                    {t("Back to all sports")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedCourses.map((course, idx) => {
                  const rawBooked = Number(course.bookedSlots) || 0;
                  const maxSlots = Number(course.maxSlots) || 0;
                  const displayBooked = Math.min(maxSlots || rawBooked, rawBooked);
                  const spotsLeft = Math.max(0, maxSlots - displayBooked);
                  const isBooked = course.isBookedByMe;
                  const isPending = !!course.isPendingPayment;
                  const isFull = maxSlots > 0 && spotsLeft <= 0;
                  const isThisBooking = Number(booking) === Number(course.classId);
                  const isAnyHighlighted = highlightedClassId !== null;
                  const isHighlighted = Number(highlightedClassId) === Number(course.classId);
                  const courseSubj = detectCourseSubject(course);
                  const { code: classCode, name: classDisplayName } = splitCode(course.className);
                  const levelBand = classLevelFromCode(classCode);
                  const levelLabel = levelBand === '1' ? t('Basic') : levelBand === '2' ? t('Advanced') : levelBand === '3' ? t('Intensive') : '';
                  const timing = formatCourseTiming(course, isVi);
                  const courseDescription = getCourseDescription(course);

                  return (
                    <div
                      key={course.classId || idx}
                      id={`course-card-${course.classId}`}
                      className={`bg-[var(--surface)] dark:bg-[#0a1122] rounded-3xl overflow-hidden flex flex-col transition-all duration-500 group ${
                        isHighlighted
                          ? 'relative z-20 scale-[1.03] -translate-y-1.5 border-2 border-blue-600 dark:border-cyan-300 ring-4 ring-blue-500/50 dark:ring-cyan-400/70 shadow-[0_0_45px_rgba(37,99,235,0.45)] dark:shadow-[0_0_55px_rgba(34,211,238,0.65),0_0_20px_rgba(59,130,246,0.5)]'
                          : isAnyHighlighted
                          ? 'border border-slate-300 dark:border-slate-800 opacity-40 saturate-50 scale-[0.98]'
                          : 'border border-slate-300 dark:border-slate-800 hover:border-blue-500/40 shadow-xs hover:shadow-xl hover:shadow-blue-500/10'
                      }`}
                    >
                      {isHighlighted && (
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider shadow-md shrink-0">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>{tr('NEXUS AI — Lớp học đang chọn', 'NEXUS AI — Selected Course')}</span>
                          </span>
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        </div>
                      )}

                      {/* Cover & Badges */}
                      <div className="relative h-48 overflow-hidden shrink-0">
                        <img
                          src={getCourseCoverUrl(course)}
                          alt={classDisplayName || course.className}
                          loading="lazy"
                          onError={(e) => {
                            if (!e.currentTarget.dataset.fallback) {
                              e.currentTarget.dataset.fallback = '1';
                              e.currentTarget.src = getSubjectFallbackImage(course);
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 dark:from-[#0a1122] via-black/45 to-black/20" />

                        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-[11px] font-bold text-blue-300 truncate max-w-[50%]">
                            {course.subjectName || t(courseSubj) || t("General")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {classCode && (
                              <span className="px-2.5 py-1 rounded-full bg-blue-600/85 backdrop-blur-md text-[11px] font-mono font-bold text-white">
                                {classCode}
                              </span>
                            )}
                            {levelLabel && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-[11px] font-bold text-amber-300">
                                {levelLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${
                              isFull
                                ? 'bg-rose-500/20 border-rose-400/30 text-rose-300'
                                : spotsLeft <= 3
                                ? 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                                : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
                            }`}
                          >
                            {isFull
                              ? t("Full")
                              : tr(`Còn ${spotsLeft}/${maxSlots} chỗ trống`, `${spotsLeft}/${maxSlots} spots left`)}
                          </span>

                          {isHighlighted && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-200/60 text-[11px] font-bold shadow-lg shadow-amber-500/40 animate-bounce">
                              <Sparkles className="w-3 h-3" />
                              <span>{tr('AI Đề xuất', 'AI Recommended')}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Course Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                            {classDisplayName || course.className}
                          </h3>

                          {courseDescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                              {courseDescription}
                            </p>
                          )}

                          {/* Coach & Room */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                              <span>
                                {t("Coach")} <strong className="text-slate-900 dark:text-white">{course.coachName}</strong>
                              </span>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                              <span>{course.roomName}</span>
                            </span>
                          </div>

                          {/* 4-cell Course Spec Grid */}
                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                                <Clock className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                {tr('Thời lượng khóa', 'Course Length')}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {course.totalSessions || 0} {t("sessions")}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {course.durationMinutes || 60} {tr('phút/buổi', 'min/session')}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                                <Repeat className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                {tr('Lịch cố định', 'Weekly Pattern')}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={timing.patternText}>
                                {timing.patternText}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {tr('Khung giờ:', 'Time:')} {timing.timeStr}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                                <Calendar className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                {tr('Ngày khai giảng', 'Start Date')}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {timing.nextDateStr}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {tr('Đang mở đăng ký', 'Open for enrollment')}
                              </div>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90">
                              <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 mb-0.5">
                                <Users className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                                {tr('Sĩ số lớp', 'Class Capacity')}
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {displayBooked}/{maxSlots} {tr('học viên', 'enrolled')}
                              </div>
                              <div className={`text-[11px] font-semibold mt-0.5 ${isFull ? 'text-rose-500 dark:text-rose-400' : spotsLeft <= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {isFull ? t("Full") : tr(`Còn ${spotsLeft} chỗ trống`, `${spotsLeft} spots left`)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer: Tuition & Actions */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/90 space-y-3">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                              {tr('Học phí trọn khóa', 'Full Course Tuition')}
                            </div>
                            <div className="text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
                              {formatMoney(course.price)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCourseDetail(course)}
                              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                              <span>{tr('Chi tiết lộ trình', 'Course Details')}</span>
                            </button>

                            {isBooked ? (
                              <div className="py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span className="truncate">{t("Enrolled")}</span>
                              </div>
                            ) : isPending ? (
                              <div className="py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5">
                                <Clock className="w-4 h-4 shrink-0" />
                                <span className="truncate">{t("Pending Checkout")}</span>
                              </div>
                            ) : isFull ? (
                              <button
                                type="button"
                                disabled
                                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-not-allowed"
                              >
                                {t("Full")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleBook(course.classId)}
                                disabled={isThisBooking}
                                className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                  isHighlighted
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white ring-2 ring-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.7)] animate-pulse'
                                    : 'bg-[var(--primary)] hover:opacity-90 text-white shadow-sm'
                                }`}
                              >
                                {isThisBooking ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                    <span className="truncate">{t("Enrolling...")}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="truncate">{t("Enroll Now")}</span>
                                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>

                {totalCoursePages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] dark:bg-[#0a1122] border border-slate-300 dark:border-slate-800 shadow-xs">
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {tr(
                        `Hiển thị ${(safeCoursePage - 1) * COURSES_PER_PAGE + 1}–${Math.min(safeCoursePage * COURSES_PER_PAGE, filteredCourses.length)} trong tổng số ${filteredCourses.length} lớp học`,
                        `Showing ${(safeCoursePage - 1) * COURSES_PER_PAGE + 1}–${Math.min(safeCoursePage * COURSES_PER_PAGE, filteredCourses.length)} of ${filteredCourses.length} classes`
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => handleCoursePageChange(safeCoursePage - 1)}
                        disabled={safeCoursePage <= 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{tr('Trước', 'Prev')}</span>
                      </button>
                      {Array.from({ length: totalCoursePages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handleCoursePageChange(pageNum)}
                          className={`min-w-[34px] h-[34px] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            safeCoursePage === pageNum
                              ? 'bg-[var(--primary)] text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleCoursePageChange(safeCoursePage + 1)}
                        disabled={safeCoursePage >= totalCoursePages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <span>{tr('Sau', 'Next')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shrink-0 shadow-md shadow-blue-500/30">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 z-20 min-w-[22px] h-[22px] px-1 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                    {cartCount}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-slate-900 dark:text-white font-bold">{t("Active Cart Allocation:")}</span>
                    <span className="text-[11px] text-amber-500 font-extrabold uppercase">{cartCount}{' '}{t("items selected")}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[12px] text-slate-500 dark:text-slate-400">{t("Subtotal:")}</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{formatMoney(cartTotal)}</span>
                    <span className="text-[12px] text-blue-600 dark:text-blue-400 font-bold">{t("VND")}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline ml-1">{t("(15% Member Rebate Calculated)")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={clearCart}
                  className="hidden md:flex items-center gap-1.5 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/25 hover:border-rose-500/40 text-[13px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                  title={t("Clear")}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("Clear")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/member/cart')}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer"
                >
                  <span>{t("Proceed to Checkout")}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Detail & Complete Session Roadmap Modal */}
      <AnimatePresence>
        {selectedCourseDetail && (() => {
          const course = courses.find(c => c.classId === selectedCourseDetail.classId) || selectedCourseDetail;
          const { code: classCode, name: classDisplayName } = splitCode(course.className);
          const levelBand = classLevelFromCode(classCode);
          const levelLabel = levelBand === '1' ? t('Basic') : levelBand === '2' ? t('Advanced') : levelBand === '3' ? t('Intensive') : '';
          const subjectLabel = course.subjectName || t(detectCourseSubject(course)) || t("General");
          const rawBooked = Number(course.bookedSlots) || 0;
          const maxSlots = Number(course.maxSlots) || 0;
          const displayBooked = Math.min(maxSlots || rawBooked, rawBooked);
          const spotsLeft = Math.max(0, maxSlots - displayBooked);
          const isBooked = course.isBookedByMe;
          const isPending = !!course.isPendingPayment;
          const isFull = maxSlots > 0 && spotsLeft <= 0;
          const isThisBooking = Number(booking) === Number(course.classId);
          const timing = formatCourseTiming(course, isVi);
          const courseDescription = getCourseDescription(course);
          const upcoming = Array.isArray(course.upcomingDates) ? course.upcomingDates : [];

          return (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
              onClick={() => setSelectedCourseDetail(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--surface)] dark:bg-[#0a1122] border border-slate-300 dark:border-slate-700 shadow-2xl rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative"
              >
                {/* Banner Header */}
                <div className="relative h-52 sm:h-60 shrink-0 overflow-hidden">
                  <img
                    src={getCourseCoverUrl(course)}
                    alt={classDisplayName || course.className}
                    onError={(e) => {
                      if (!e.currentTarget.dataset.fallback) {
                        e.currentTarget.dataset.fallback = '1';
                        e.currentTarget.src = getSubjectFallbackImage(course);
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-black/30" />

                  <button
                    type="button"
                    onClick={() => setSelectedCourseDetail(null)}
                    aria-label={t("Close")}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-rose-500/30 text-slate-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-5 left-6 right-6 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-white/10 text-xs font-bold text-blue-300">
                        {subjectLabel}
                      </span>
                      {classCode && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-xs font-mono font-bold text-white">
                          {classCode}
                        </span>
                      )}
                      {levelLabel && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300">
                          {levelLabel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {classDisplayName || course.className}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>{t("Coach")} <strong className="text-white">{course.coachName}</strong></span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{course.roomName}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body */}
                <div className="overflow-y-auto p-6 space-y-6 flex-1">
                  {courseDescription && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                        {tr('Mô tả môn học', 'Subject Description')}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {courseDescription}
                      </p>
                    </div>
                  )}

                  {/* 4 Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">{tr('Số buổi & Thời lượng', 'Sessions & Duration')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{course.totalSessions || 0} {t("sessions")}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{course.durationMinutes || 60} {tr('phút/buổi', 'min/session')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">{tr('Lịch học hàng tuần', 'Weekly Schedule')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{timing.patternText}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{timing.timeStr}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">{tr('Ngày khai giảng', 'Start Date')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{timing.nextDateStr}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{tr('Đang mở đăng ký', 'Open for enrollment')}</div>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">{tr('Tình trạng chỗ', 'Availability')}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{displayBooked}/{maxSlots} {tr('đã đăng ký', 'enrolled')}</div>
                      <div className={`text-xs font-semibold ${isFull ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isFull ? t("Full") : tr(`Còn ${spotsLeft} chỗ trống`, `${spotsLeft} spots left`)}
                      </div>
                    </div>
                  </div>

                  {/* Complete Session Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{tr('Lộ trình chi tiết các buổi học', 'Complete Session Roadmap')}</span>
                      </h4>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {upcoming.length}/{course.totalSessions || upcoming.length} {tr('buổi sắp tới', 'upcoming sessions')}
                      </span>
                    </div>

                    {upcoming.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {upcoming.map((dateText, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-0.5"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] font-mono">
                              {t("Session")} #{i + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                              {dateText}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        {tr('Lịch chi tiết từng buổi sẽ được cập nhật khi mở lớp.', 'Detailed session dates will appear upon class scheduling.')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080e1d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {tr('Học phí trọn khóa', 'Full Course Tuition')} ({course.totalSessions || upcoming.length} {t("sessions")})
                    </div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {formatMoney(course.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseDetail(null)}
                      className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {t("Close")}
                    </button>

                    {isBooked ? (
                      <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t("Enrolled")}</span>
                      </div>
                    ) : isPending ? (
                      <div className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{t("Pending Checkout")}</span>
                      </div>
                    ) : isFull ? (
                      <button
                        type="button"
                        disabled
                        className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold cursor-not-allowed"
                      >
                        {t("Full")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBook(course.classId)}
                        disabled={isThisBooking}
                        className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                      >
                        {isThisBooking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t("Enrolling...")}</span>
                          </>
                        ) : (
                          <>
                            <span>{t("Enroll Now")}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default BookClass;
