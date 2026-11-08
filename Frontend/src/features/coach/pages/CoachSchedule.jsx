import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coachService } from '../services/coachService';
import {
  ChevronLeft, ChevronRight, MapPin,
  Clock, Users, BookOpen, Phone, Mail, ChevronDown, ChevronUp,
  X, Search, Sparkles, Save, Check, AlertCircle, Bell, Star, CalendarSync, UserCheck,
  ArrowLeft, Heart, Scale, Eye, HeartPulse, AlertTriangle, RotateCcw, Lock
} from 'lucide-react';
import { healthBadge, HEALTH_CONDITIONS } from '../../member/healthProfileUtils';
import SendNotificationModal from '../components/SendNotificationModal';
import TraineeAssessmentModal from '../components/TraineeAssessmentModal';
import { resolveAvatarUrl } from '../../../utils/avatarUtils';
import CreateRescheduleModal from '../components/CreateRescheduleModal';
import CoachToast from '../components/CoachToast';

const CoachSchedule = () => {
  const currentLang = useLanguage();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);

  // Modal State for viewing & updating enrolled trainees attendance
  const [activeModalSchedule, setActiveModalSchedule] = useState(null);
  const [selectedTraineeForDetail, setSelectedTraineeForDetail] = useState(null);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [overrideMap, setOverrideMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Notification Modal States
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTargetType, setNotifTargetType] = useState('CLASS');
  const [notifClassId, setNotifClassId] = useState(null);

  // Assessment Modal States
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentInitialClassId, setAssessmentInitialClassId] = useState(null);
  const [assessmentInitialScheduleId, setAssessmentInitialScheduleId] = useState(null);
  const [assessmentInitialStudent, setAssessmentInitialStudent] = useState(null);

  // Reschedule Modal States
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleScheduleId, setRescheduleScheduleId] = useState(null);

  // Apple Dynamic Island Coach Toast State
  const [toastState, setToastState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    actionLabel: '',
    onAction: null,
    duration: 5000,
  });

  const showToast = ({ type = 'success', title = '', message = '', actionLabel = '', onAction = null, duration = 5000 }) => {
    setToastState({ isOpen: true, type, title, message, actionLabel, onAction, duration });
  };

  const handleOpenReschedule = (scheduleId) => {
    setRescheduleScheduleId(scheduleId);
    setIsRescheduleModalOpen(true);
  };

  const handleOpenGeneralAssessment = () => {
    setAssessmentInitialClassId(null);
    setAssessmentInitialScheduleId(null);
    setAssessmentInitialStudent(null);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenScheduleAssessment = (schedule) => {
    setAssessmentInitialClassId(schedule.classId);
    setAssessmentInitialScheduleId(schedule.scheduleId);
    setAssessmentInitialStudent(null);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenDirectStudentAssessment = (student, schedule) => {
    setAssessmentInitialClassId(schedule.classId);
    setAssessmentInitialScheduleId(schedule.scheduleId);
    setAssessmentInitialStudent(student);
    setIsAssessmentModalOpen(true);
  };

  const handleOpenClassNotification = (classId) => {
    setNotifTargetType('CLASS');
    setNotifClassId(classId);
    setIsNotifModalOpen(true);
  };


  const fetchCoachSchedules = async () => {
    try {
      setLoading(true);
      const data = await coachService.getSchedules();
      setSchedules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching coach schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachSchedules();
  }, []);

  // Helper function to check if attendance is allowed (today or within 24 hours after session ends)
  const canTakeAttendance = (startTime, endTime) => {
    if (!startTime) return false;
    const sessionDate = new Date(startTime);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If future date: not yet allowed
    if (sessionDate.getTime() > today.getTime()) return false;

    // If session ended > 24 hours ago: expired
    if (endTime) {
      const endLimit = new Date(endTime).getTime() + 24 * 60 * 60 * 1000;
      if (Date.now() > endLimit) return false;
    }
    return true;
  };

  const getAttendanceRestrictionReason = (startTime, endTime) => {
    if (!startTime) return null;
    const sessionDate = new Date(startTime);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate > today) {
      return t("Not session date yet ({0}). Attendance is only allowed during the session or within 24 hours after.", [sessionDate.toLocaleDateString(locale())]);
    }
    if (endTime && Date.now() > new Date(endTime).getTime() + 24 * 60 * 60 * 1000) {
      return t("Session ended over 24 hours ago. Attendance period has expired.");
    }
    return null;
  };

  const openTraineesModal = (schedule) => {
    setActiveModalSchedule(schedule);
    setSelectedTraineeForDetail(null);
    setSearchModalQuery('');
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    setOverrideMap({});

    const initialMap = {};
    if (schedule.enrolledStudents) {
      schedule.enrolledStudents.forEach(st => {
        const key = st.bookingId || st.userId;
        initialMap[key] = st.attendanceStatus || 'NOT_YET';
      });
    }
    setAttendanceMap(initialMap);
  };

  const handleStatusChange = (studentKey, status, isOverride = false) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentKey]: status
    }));
    setOverrideMap(prev => ({
      ...prev,
      [studentKey]: status === 'PRESENT' ? isOverride : false
    }));
  };

  const handleSaveAttendance = async () => {
    if (!activeModalSchedule) return;
    try {
      setSavingAttendance(true);
      setSaveSuccessMsg('');
      setSaveErrorMsg('');

      const payload = {
        attendances: Object.entries(attendanceMap).map(([key, status]) => {
          const numId = Number(key);
          const st = activeModalSchedule.enrolledStudents.find(s => (s.bookingId === numId || s.userId === numId));
          return {
            bookingId: st?.bookingId || (numId ? numId : null),
            userId: st?.userId || null,
            attendanceStatus: status,
            overrideFrontDeskCheckIn: Boolean(overrideMap[key]) || (status === 'PRESENT' && !st?.checkedInAtFrontDesk)
          };
        })
      };

      await coachService.updateAttendance(activeModalSchedule.scheduleId, payload);

      setSaveSuccessMsg(t('Attendance saved successfully!'));
      showToast({
        type: 'success',
        title: t('Attendance Saved'),
        message: t('Class roster attendance has been synced successfully.'),
        duration: 4000,
      });

      // Re-fetch fresh schedule data from backend
      await fetchCoachSchedules();

      // Update local state in active modal as well
      setActiveModalSchedule(prev => {
        if (!prev) return null;
        const updatedStudents = prev.enrolledStudents.map(st => {
          const k = st.bookingId || st.userId;
          if (attendanceMap[k]) {
            const nextCheckedIn = st.checkedInAtFrontDesk || (attendanceMap[k] === 'PRESENT' && Boolean(overrideMap[k]));
            return {
              ...st,
              attendanceStatus: attendanceMap[k],
              checkedInAtFrontDesk: nextCheckedIn,
              frontDeskCheckInType: (!st.checkedInAtFrontDesk && nextCheckedIn) ? 'COACH_OVERRIDE' : st.frontDeskCheckInType
            };
          }
          return st;
        });
        return { ...prev, enrolledStudents: updatedStudents };
      });

      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      const msg = error.response?.data?.message || error.response?.data || t('Failed to save attendance');
      setSaveErrorMsg(typeof msg === 'string' ? t(msg) : t('Failed to save attendance'));
      setTimeout(() => setSaveErrorMsg(''), 5000);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Helper functions for calendar grid
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday(0) to 6, Monday(1) to 0
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);

  const calendarGrid = [];

  // Previous month trailing days
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.push({
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDay + i + 1),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarGrid.push({
      date: new Date(currentYear, currentMonth, i),
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete grid
  const remainingCells = 35 - calendarGrid.length;
  const cellsToAdd = remainingCells < 0 ? 42 - calendarGrid.length : remainingCells;
  for (let i = 1; i <= cellsToAdd; i++) {
    calendarGrid.push({
      date: new Date(currentYear, currentMonth + 1, i),
      isCurrentMonth: false
    });
  }

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  // Filter schedules for the selected date
  const selectedDateSchedules = safeSchedules.filter(s => {
    const sDate = new Date(s.startTime);
    return sDate.getDate() === selectedDate.getDate() &&
      sDate.getMonth() === selectedDate.getMonth() &&
      sDate.getFullYear() === selectedDate.getFullYear();
  });

  // Calculate stats
  const totalSchedules = safeSchedules.length;
  const totalEnrolledStudents = safeSchedules.reduce((sum, s) => sum + (s.enrolledCount || 0), 0);

  const toggleExpandSchedule = (scheduleId) => {
    setExpandedScheduleId(prev => prev === scheduleId ? null : scheduleId);
  };

  // Filter trainees in active modal by search term
  const modalQ = searchModalQuery.trim().toLowerCase();
  const modalTrainees = activeModalSchedule?.enrolledStudents?.filter(st =>
    !modalQ || st.fullName?.toLowerCase().includes(modalQ) ||
    st.email?.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
    st.phone?.includes(searchModalQuery)
  ) || [];

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">{t("Coach Schedule & Trainee Enrolment")}</h1>
            <p className="text-sm text-[var(--text-muted)] max-w-3xl">{t("Select a date on the calendar grid to inspect scheduled sessions, then click to view registered trainees and mark attendance for each class.")}</p>
          </div>

          {/* Quick Action Button: Evaluate Trainees */}
          <button
            onClick={handleOpenGeneralAssessment}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>{t("Đánh Giá Học Viên")}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t("Total Classes")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-[10px]">{totalSchedules}</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <Users className="w-3.5 h-3.5" />
              <span>{t("Total Trainees Enrolled")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success-text)] font-bold text-[10px]">{totalEnrolledStudents}</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm px-4 text-[var(--text)]">
                {currentDate.toLocaleDateString(locale(), { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button onClick={goToToday} className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] hover:border-[var(--border)] font-semibold text-xs transition-all">{t("Today")}</button>
          </div>
        </div>
      </div>

      {/* Main Grid: 70% Calendar | 30% Agenda */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Calendar Column */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow)] flex flex-col min-h-[600px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 pb-3 mb-2 text-center font-bold text-xs text-[var(--text-muted)] tracking-wider uppercase border-b border-[var(--border)]">
              <div className="py-1">{t("Mon")}</div>
              <div className="py-1">{t("Tue")}</div>
              <div className="py-1">{t("Wed")}</div>
              <div className="py-1">{t("Thu")}</div>
              <div className="py-1">{t("Fri")}</div>
              <div className="py-1 text-[var(--success-text)]">{t("Sat")}</div>
              <div className="py-1 text-[var(--success-text)]">{t("Sun")}</div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.date.getDate() === selectedDate.getDate() && cell.date.getMonth() === selectedDate.getMonth();
                const isToday = cell.date.getDate() === new Date().getDate() && cell.date.getMonth() === new Date().getMonth() && cell.date.getFullYear() === new Date().getFullYear();

                // Find schedules for this cell
                const daySchedules = safeSchedules.filter(s => {
                  const sDate = new Date(s.startTime);
                  return sDate.getDate() === cell.date.getDate() && sDate.getMonth() === cell.date.getMonth();
                });

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`
                      relative p-2 rounded-lg flex flex-col min-h-[90px] cursor-pointer transition-all border
                      ${!cell.isCurrentMonth ? 'opacity-30 border-transparent bg-transparent' : 'bg-[var(--surface)]'}
                      ${isSelected ? 'border-[var(--primary-soft)] ring-1 ring-[var(--focus-ring)] bg-[var(--surface)]' : 'border-[var(--border)] hover:border-[var(--border)]'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold text-xs ${isToday ? 'w-6 h-6 rounded-full bg-[var(--primary)] text-[color:var(--on-primary)] flex items-center justify-center' : 'text-[var(--text)]'}`}>
                        {cell.date.getDate()}
                      </span>
                      {daySchedules.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto scrollbar-none">
                      {daySchedules.map((s, sIdx) => {
                        const time = new Date(s.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                        const isSubstituted = s.status === 'SUBSTITUTE_ASSIGNED';
                        const isRescheduled = s.status === 'RESCHEDULED';
                        const isCancelled = s.status === 'CANCELLED' || s.status?.startsWith('CANCELLED');
                        const isPendingReschedule = !!s.hasPendingReschedule;

                        let pillClass = "bg-[var(--primary-soft)] border-[var(--primary-soft)] text-[var(--primary)]";
                        let statusPrefix = "";
                        if (isPendingReschedule) {
                          pillClass = "bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300 font-bold";
                          statusPrefix = `[${t("Pending Move")}] `;
                        } else if (isSubstituted) {
                          pillClass = "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold";
                          statusPrefix = `[${t("Dạy thay")}] `;
                        } else if (isRescheduled) {
                          pillClass = "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold";
                          statusPrefix = `[${t("Dạy bù")}] `;
                        } else if (isCancelled) {
                          pillClass = "bg-rose-500/10 border-rose-500/25 text-rose-500 line-through";
                          statusPrefix = `[${t("Đã hủy")}] `;
                        }

                        return (
                          <div
                            key={sIdx}
                            title={`${s.className} (${codeLabel(s.status)})`}
                            className={`w-full text-left truncate px-1.5 py-1 rounded border text-[9px] font-semibold transition-all ${pillClass}`}
                          >
                            {statusPrefix}{time} - {s.className}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Agenda Column */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[var(--shadow)] flex flex-col sticky top-28 max-h-[calc(100vh-140px)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{t("Teaching Agenda")}</span>
                <span className="font-bold text-lg text-[var(--text)]">
                  {selectedDate.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] text-xs font-bold">
                {selectedDateSchedules.length}{' '}{t("Sessions")}</span>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[460px] 2xl:max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
              {loading ? (
                <div className="text-center py-10 text-[var(--text-muted)]">{t("Loading class schedules...")}</div>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] font-medium">{t("No teaching sessions on this date")}</span>
                </div>
              ) : (
                selectedDateSchedules.map((s, idx) => {
                  const startTime = new Date(s.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(s.endTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                  const isExpanded = expandedScheduleId === s.scheduleId;
                  const isSubstituted = s.status === 'SUBSTITUTE_ASSIGNED';
                  const isRescheduled = s.status === 'RESCHEDULED';
                  const isCancelled = s.status === 'CANCELLED' || s.status?.startsWith('CANCELLED');

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3 relative shrink-0 overflow-hidden group hover:border-[var(--primary-soft)] transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          s.hasPendingReschedule
                            ? 'bg-amber-500/15 border-amber-500/35 text-amber-700 dark:text-amber-300 flex items-center gap-1'
                            : isSubstituted
                            ? (s.isSubstituteForCurrentCoach
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1'
                                : 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center gap-1')
                            : isRescheduled
                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center gap-1'
                            : isCancelled
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            : 'bg-[var(--primary-soft)] border-[var(--primary-soft)] text-[var(--primary)]'
                        }`}>
                          {s.hasPendingReschedule && <Clock className="w-3 h-3" />}
                          {!s.hasPendingReschedule && isSubstituted && <UserCheck className="w-3 h-3" />}
                          {!s.hasPendingReschedule && isRescheduled && <Clock className="w-3 h-3" />}
                          <span>{s.hasPendingReschedule ? t('Pending Reschedule') : (isSubstituted && s.isSubstituteForCurrentCoach ? t('Substitute') : codeLabel(s.status))}</span>
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <h4 className="font-bold text-[var(--text)] text-base leading-snug">{s.className}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">{t("Room:")}{' '}<strong className="text-[var(--text)]">{s.roomName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="font-medium text-[var(--text)]">{t("Enrolled:")}{' '}<strong className="text-[var(--success-text)]">{s.enrolledCount}</strong> / {s.maxSlots}{' '}{t("Trainees")}</span>
                        </div>
                      </div>

                      {/* Informative banner if reschedule request is pending */}
                      {s.hasPendingReschedule && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                          <div>
                            <p className="font-bold text-xs">{t('Reschedule request submitted and pending manager review')}</p>
                            <p className="text-[11px] opacity-85 mt-0.5">
                              {t('Pending reschedule approval')} #{s.pendingRescheduleRequestId}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Informative banners for substituted or rescheduled sessions */}
                      {isSubstituted && (
                        s.isSubstituteForCurrentCoach ? (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                            <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <p className="font-bold text-xs">{t('You are assigned to teach this class')}</p>
                              <p className="text-[11px] opacity-90 mt-0.5">
                                {s.coachName ? `${t('Original Coach:')} ${s.coachName}. ` : ''}
                                {t('You are standing in to teach this session at regular schedule.')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                            <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="font-bold text-xs">{t('Substitute Coach Assigned')}</p>
                              <p className="text-[11px] opacity-90 mt-0.5">
                                {s.substituteCoachName ? `${t('Substitute Coach:')} ${s.substituteCoachName}. ` : ''}
                                {t('Assigned substitute coach is teaching this class. You do not need to attend.')}
                              </p>
                            </div>
                          </div>
                        )
                      )}

                      {isRescheduled && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2">
                          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                          <div>
                            <p className="font-bold text-xs">{t('This is an approved make-up session.')}</p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                              {t('Class taught at rescheduled time based on your approved request.')}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Main Action Button: View registered trainees modal */}
                      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => openTraineesModal(s)}
                            className="py-2 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-white" />
                            <span>{t("Học viên")}{' '}({s.enrolledCount})</span>
                          </button>

                          <button
                            onClick={() => handleOpenScheduleAssessment(s)}
                            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            <span>{t("Đánh giá")}</span>
                          </button>

                          <button
                            onClick={() => handleOpenClassNotification(s.classId)}
                            className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-[11px] border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{t("Báo tin")}</span>
                          </button>
                        </div>

                        {/* Request Reschedule Button if future >12h AND not already rescheduled/substituted/pending */}
                        {!s.hasPendingReschedule && new Date(s.startTime) > new Date(Date.now() + 12 * 3600 * 1000) && !isCancelled && s.status !== 'SUBSTITUTE_ASSIGNED' && s.status !== 'RESCHEDULED' && (
                          <button
                            onClick={() => handleOpenReschedule(s.scheduleId)}
                            className="w-full py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-500/30 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <CalendarSync className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{t("Xin dời ca / Dạy bù")}</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpandSchedule(s.scheduleId)}
                          className="w-full py-1.5 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] text-[11px] font-medium flex items-center justify-between transition-colors"
                        >
                          <span>{t("Toggle quick roster list below")}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>


                      {/* Expandable Quick View */}
                      {isExpanded && (
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {(!s.enrolledStudents || s.enrolledStudents.length === 0) ? (
                            <p className="text-[11px] text-[var(--text-muted)] italic py-2 text-center">{t("No trainees registered for this session yet")}</p>
                          ) : (
                            s.enrolledStudents.map((st, stIdx) => {
                              const stAv = resolveAvatarUrl(st.avatarPath || st.avatarUrl);
                              const stIn = st.fullName ? st.fullName.split(' ').filter(Boolean).slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV';
                              return (
                              <div key={stIdx} className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="relative w-8 h-8 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                                    <span>{stIn}</span>
                                    {stAv && (
                                      <img
                                        src={stAv}
                                        alt={st.fullName}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="font-semibold text-[var(--text)] truncate">{st.fullName}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                    {st.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                                        {st.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${st.attendanceStatus === 'PRESENT'
                                    ? t('bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--success-soft)]')
                                    : st.attendanceStatus === 'ABSENT'
                                      ? t('bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose-soft)]')
                                      : t('bg-[var(--warning-soft)] text-[var(--warning-text)] border border-[var(--warning-soft)]')
                                  }`}>
                                  {t(st.attendanceStatus || 'NOT_YET')}
                                </span>
                              </div>
                            );})
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== ENROLLED TRAINEES & ATTENDANCE MODAL ===================== */}
      {activeModalSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-[var(--shadow)] flex flex-col max-h-[90vh]">

            {/* ================= CONDITION: DETAIL VIEW VS ATTENDANCE LIST ================= */}
            {selectedTraineeForDetail ? (
              <>
                {/* 1. Detail View Header with Back Button */}
                <div className="p-5 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTraineeForDetail(null)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-2 border border-amber-500/25 transition-all cursor-pointer shadow-xs group"
                      title={t("Quay lại danh sách điểm danh lớp")}
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                      <span>{t("Quay lại điểm danh")}</span>
                    </button>
                    <div className="h-5 w-[1px] bg-[var(--border)] hidden sm:block"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t("Chi tiết học viên")}</span>
                      <h3 className="text-base font-extrabold text-[var(--text)] leading-tight truncate">{selectedTraineeForDetail.fullName}</h3>
                    </div>
                  </div>

                </div>

                {/* 2. Detail View Scrollable Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                  {/* Attendance Restriction Alert Banner inside Modal when expired (>24h) or in future */}
                  {!canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime) && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-xs">
                      <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>{getAttendanceRestrictionReason(activeModalSchedule.startTime, activeModalSchedule.endTime) || t("Ca học này hiện đã khóa chức năng điểm danh.")}</span>
                    </div>
                  )}

                  {/* Hero Profile Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[var(--surface-hover)] to-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-[var(--primary-soft)] border-2 border-amber-500/30 text-amber-600 font-black text-xl flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                        <span>{selectedTraineeForDetail.fullName ? selectedTraineeForDetail.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'HV'}</span>
                        {resolveAvatarUrl(selectedTraineeForDetail.avatarPath || selectedTraineeForDetail.avatarUrl) && (
                          <img
                            src={resolveAvatarUrl(selectedTraineeForDetail.avatarPath || selectedTraineeForDetail.avatarUrl)}
                            alt={selectedTraineeForDetail.fullName}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-lg font-black text-[var(--text)] tracking-tight truncate">{selectedTraineeForDetail.fullName}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft)]">
                            #{selectedTraineeForDetail.userId || selectedTraineeForDetail.bookingId}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {t(selectedTraineeForDetail.bookingStatus || 'CONFIRMED')}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)] mt-1">
                          {selectedTraineeForDetail.email && (
                            <span className="flex items-center gap-1.5 truncate max-w-[240px]">
                              <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              {selectedTraineeForDetail.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 shrink-0">
                            <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {selectedTraineeForDetail.phone || t("Chưa có SĐT")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Check-in & Attendance Current Status */}
                    <div className="flex flex-col sm:items-end gap-1.5 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Trạng thái ca học này")}</span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const k = selectedTraineeForDetail.bookingId || selectedTraineeForDetail.userId;
                          const status = attendanceMap[k] || 'NOT_YET';
                          if (status === 'PRESENT') {
                            return (
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>{t("Đã có mặt")}</span>
                              </span>
                            );
                          }
                          if (status === 'ABSENT') {
                            return (
                              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                <X className="w-3.5 h-3.5" />
                                <span>{t("Vắng mặt")}</span>
                              </span>
                            );
                          }
                          return (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                              {t("Chưa điểm danh")}
                            </span>
                          );
                        })()}
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {selectedTraineeForDetail.checkedInAtFrontDesk
                          ? `✓ ${t('Đã check-in quầy lễ tân')}`
                          : `! ${t('Chưa check-in lễ tân')}`}
                      </span>
                    </div>
                  </div>

                  {/* Bento Grid: Health & Metrics (Authentic Data, No Fake Mockup) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Thể chất & Sinh lý */}
                    <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                        <span className="font-bold text-xs text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-amber-500" />
                          <span>{t("Hồ sơ thể chất & Sức khỏe")}</span>
                        </span>
                        {selectedTraineeForDetail.health && (
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border flex items-center gap-1 ${
                            selectedTraineeForDetail.health.clearanceRecommended
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              : selectedTraineeForDetail.health.completed
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]'
                          }`}>
                            {t(healthBadge(selectedTraineeForDetail.health, currentLang).label)}
                          </span>
                        )}
                      </div>

                      {/* Thông tin nhân trắc: Giới tính & Tuổi (Việt hóa chuẩn) */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block font-medium">{t("Giới tính")}</span>
                          <strong className="text-xs font-bold text-[var(--text)] mt-0.5 block">
                            {selectedTraineeForDetail.health?.gender === 'MALE'
                              ? t('Nam')
                              : selectedTraineeForDetail.health?.gender === 'FEMALE'
                              ? t('Nữ')
                              : selectedTraineeForDetail.health?.gender
                              ? t('Khác')
                              : t('Chưa khai báo')}
                          </strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block font-medium">{t("Độ tuổi")}</span>
                          <strong className="text-xs font-bold text-[var(--text)] mt-0.5 block">
                            {selectedTraineeForDetail.health?.age != null
                              ? t('{0} years old', [selectedTraineeForDetail.health.age])
                              : t('Chưa khai báo')}
                          </strong>
                        </div>
                      </div>

                      {/* Cảnh báo PAR-Q nếu cần tư vấn y tế */}
                      {selectedTraineeForDetail.health?.clearanceRecommended && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-[11px] flex items-center gap-2 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{t("Cần tư vấn y tế trước khi tập luyện cường độ cao (PAR-Q).")}</span>
                        </div>
                      )}

                      {/* Số đo InBody thực tế */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-[var(--surface-hover)]/70 border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block">{t("Chiều cao")}</span>
                          <span className="font-extrabold text-xs text-[var(--text)]">
                            {selectedTraineeForDetail.height ? `${selectedTraineeForDetail.height} cm` : '--'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[var(--surface-hover)]/70 border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block">{t("Cân nặng")}</span>
                          <span className="font-extrabold text-xs text-[var(--text)]">
                            {selectedTraineeForDetail.weight ? `${selectedTraineeForDetail.weight} kg` : '--'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-[var(--surface-hover)]/70 border border-[var(--border)]">
                          <span className="text-[10px] text-[var(--text-muted)] block">{t("BMI")}</span>
                          <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400">
                            {selectedTraineeForDetail.height && selectedTraineeForDetail.weight
                              ? (selectedTraineeForDetail.weight / Math.pow(selectedTraineeForDetail.height / 100, 2)).toFixed(1)
                              : '--'}
                          </span>
                        </div>
                      </div>

                      {!selectedTraineeForDetail.height && !selectedTraineeForDetail.weight && (
                        <p className="text-[10px] text-[var(--text-muted)] italic text-center">
                          {t("Học viên chưa cập nhật số đo thể trạng InBody.")}
                        </p>
                      )}
                    </div>

                    {/* Card 2: Tiền sử bệnh lý & Ghi chú HLV */}
                    <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                        <span className="font-bold text-xs text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-indigo-500" />
                          <span>{t("Tiền sử chấn thương & Ghi chú")}</span>
                        </span>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1.5">{t("Bệnh lý & Vùng cần lưu ý")}</span>
                          {selectedTraineeForDetail.health?.conditions && selectedTraineeForDetail.health.conditions.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedTraineeForDetail.health.conditions.map((cCode, cIdx) => {
                                const condObj = HEALTH_CONDITIONS.find(c => c.code === cCode);
                                const condLabel = condObj ? (currentLang === 'en' ? condObj.en : condObj.vi) : cCode;
                                return (
                                  <span
                                    key={cIdx}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-500/25 shadow-xs"
                                  >
                                    {condLabel}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="p-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] text-[11px]">
                              {t("Không có ghi nhận bệnh lý hoặc chấn thương đặc biệt.")}
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block mb-1">{t("Ghi chú đặc biệt từ học viên")}</span>
                          <p className="p-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] text-[11px] italic">
                            {selectedTraineeForDetail.health?.notes || t("Không có ghi chú thêm.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Thông tin ca học này & Điểm danh trực tiếp (Có chặn nếu quá hạn hoặc trong tương lai) */}
                  <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-[var(--text)] uppercase tracking-wider truncate">{activeModalSchedule.className}</h5>
                        <p className="text-xs text-[var(--text-muted)] truncate">
                          {activeModalSchedule.roomName} • {new Date(activeModalSchedule.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(activeModalSchedule.endTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                      </div>
                    </div>

                    {/* Quick Attendance Selector inside Profile with NOT_YET, PRESENT, ABSENT and strict lock check */}
                    <div className="flex items-center gap-1.5 bg-[var(--surface-hover)] p-1.5 rounded-xl border border-[var(--border)] shrink-0 flex-wrap">
                      {(() => {
                        const key = selectedTraineeForDetail.bookingId || selectedTraineeForDetail.userId;
                        const currentStatus = attendanceMap[key] || 'NOT_YET';
                        const isAllowed = canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime);

                        return (
                          <>
                            {/* Nút 1: Chưa điểm danh (Hoàn tác / Reset) */}
                            <button
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => handleStatusChange(key, 'NOT_YET')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isAllowed
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                currentStatus === 'NOT_YET'
                                  ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xs'
                                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]/50'
                              }`}
                              title={!isAllowed ? t("Chức năng điểm danh đã bị khóa") : t("Đặt lại trạng thái Chưa điểm danh")}
                            >
                              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                              {t("Chưa điểm danh")}
                            </button>

                            {/* Nút 2: Có mặt */}
                            <button
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => handleStatusChange(key, 'PRESENT', !selectedTraineeForDetail?.checkedInAtFrontDesk)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isAllowed
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-[var(--text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={!isAllowed ? t("Chức năng điểm danh đã bị khóa") : t("Đánh dấu có mặt")}
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              {currentStatus === 'PRESENT' && (!selectedTraineeForDetail?.checkedInAtFrontDesk || isOverride) ? t('Present (Direct)') : t('Có mặt')}
                            </button>

                            {/* Nút 3: Vắng mặt */}
                            <button
                              type="button"
                              disabled={!isAllowed}
                              onClick={() => handleStatusChange(key, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isAllowed
                                  ? 'opacity-40 cursor-not-allowed'
                                  : 'cursor-pointer'
                              } ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10'
                              }`}
                              title={!isAllowed ? t("Chức năng điểm danh đã bị khóa") : t("Đánh dấu vắng mặt")}
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" />
                              {t("Vắng mặt")}
                            </button>

                            {!isAllowed && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 pl-1">
                                <Lock className="w-3 h-3" />
                                {t("Đã khóa")}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 3. Detail View Footer */}
                <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const st = selectedTraineeForDetail;
                        setSelectedTraineeForDetail(null);
                        handleOpenDirectStudentAssessment(st, activeModalSchedule);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{t("Đánh giá học viên này")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTraineeForDetail(null)}
                      className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] font-semibold text-xs hover:bg-[var(--border)] transition-all cursor-pointer"
                    >
                      {t("Quay lại")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[var(--primary)] text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>{t("Class Trainee Roster & Attendance")}</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] leading-snug">
                  {activeModalSchedule.className}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text)] mt-1">
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {new Date(activeModalSchedule.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(activeModalSchedule.endTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {activeModalSchedule.roomName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalSchedule(null)}
                className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance Restriction Notice */}
            {!canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime) && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning-soft)] flex items-center gap-3 text-[var(--warning-text)] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--warning-text)]" />
                <span>
                  {getAttendanceRestrictionReason(activeModalSchedule.startTime, activeModalSchedule.endTime)}
                </span>
              </div>
            )}

            {/* Modal Subheader Bar */}
            <div className="px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4 mt-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  placeholder={t("Search trainees by name, email, phone...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                  (activeModalSchedule.enrolledCount || 0) > (activeModalSchedule.maxSlots || 0)
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    : (activeModalSchedule.enrolledCount || 0) === (activeModalSchedule.maxSlots || 0)
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-[var(--success-soft)] border-[var(--success-soft)] text-[var(--success-text)]'
                }`}>
                  {(activeModalSchedule.enrolledCount || 0) > (activeModalSchedule.maxSlots || 0) ? t("Overloaded:") : t("Capacity:")}{' '}
                  {activeModalSchedule.enrolledCount} / {activeModalSchedule.maxSlots}{' '}{t("Trainees")}
                </span>
              </div>
            </div>

            {/* Trainees List Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-3 flex-1">
              {modalTrainees.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 text-[var(--text-muted)] mb-2" />
                  <p className="text-sm font-semibold text-[var(--text)]">{t("No trainees found")}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{t("No registered trainees or search query doesn't match")}</p>
                </div>
              ) : (
                modalTrainees.map((st, stIdx) => {
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : t('TR');
                  const key = st.bookingId || st.userId;
                  const currentStatus = attendanceMap[key] || 'NOT_YET';
                  const isAllowed = canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime);
                  const isOverride = Boolean(overrideMap[key]);

                  return (
                    <div
                      key={stIdx}
                      className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => setSelectedTraineeForDetail(st)}
                          className="relative w-11 h-11 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-500/50 transition-all group shadow-xs"
                          title={t("Bấm vào ảnh đại diện để xem chi tiết học viên này")}
                        >
                          <span>{initials}</span>
                          {resolveAvatarUrl(st.avatarPath || st.avatarUrl) && (
                            <img
                              src={resolveAvatarUrl(st.avatarPath || st.avatarUrl)}
                              alt={st.fullName}
                              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-4 h-4 drop-shadow" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-bold text-[var(--text)] text-sm truncate">{st.fullName}</h5>
                            <span className="px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-semibold">
                              {t(st.bookingStatus || 'CONFIRMED')}
                            </span>
                            {st.checkedInAtFrontDesk ? (
                              <span
                                className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                                title={st.frontDeskCheckInTime ? `Check-in: ${st.frontDeskCheckInTime.slice(11, 16)}` : t('Checked-in at front desk')}
                              >
                                <Check className="w-3 h-3 text-emerald-500" />
                                {t('Checked-in at front desk')}
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                                title={t('Student has not checked in at front desk today')}
                              >
                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                {t('Unchecked at front desk')}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                            {st.email && (
                              <span className="flex items-center gap-1 truncate max-w-[220px]">
                                <Mail className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                {st.email}
                              </span>
                            )}
                            {st.phone && (
                              <span className="flex items-center gap-1 shrink-0">
                                <Phone className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                {st.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Unified Attendance & Assessment Controls Bar */}
                      <div className="flex items-center gap-1 bg-[var(--surface-hover)]/40 border border-[var(--border)] rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'NOT_YET')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            currentStatus === 'NOT_YET'
                              ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                          } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!isAllowed ? t('Expired or not session date yet') : t('Set status to unmarked')}
                        >
                          {t('NOT YET')}
                        </button>
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'PRESENT', !st.checkedInAtFrontDesk)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs font-bold'
                              : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10'
                          } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={
                            !isAllowed
                              ? t('Expired or not session date yet')
                              : !st.checkedInAtFrontDesk
                                ? t('Mark present (Classroom direct verification)')
                                : t('Mark present')
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {currentStatus === 'PRESENT' && (!st.checkedInAtFrontDesk || isOverride)
                              ? t('Present (Direct)')
                              : t('Present')}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs font-bold'
                              : 'text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10'
                          } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!isAllowed ? t('Expired or not session date yet') : t('Mark absent')}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{t('Absent')}</span>
                        </button>

                        {/* Divider */}
                        <div className="w-[1px] h-4 bg-[var(--border)] mx-1 shrink-0" />

                        {/* Assessment Trigger inside unified bar */}
                        <button
                          type="button"
                          onClick={() => handleOpenDirectStudentAssessment(st, activeModalSchedule)}
                          title={t('Assess trainee progress')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 transition-all cursor-pointer shrink-0"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                          <span>{t('Assessments')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const classId = activeModalSchedule.classId;
                    setActiveModalSchedule(null);
                    handleOpenClassNotification(classId);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-white" />
                  <span>{t("Send notification to this class")}</span>
                </button>
                {saveSuccessMsg && <span className="text-[var(--success-text)] text-xs font-semibold">{saveSuccessMsg}</span>}
                {saveErrorMsg && <span className="text-[var(--danger-text)] text-xs font-semibold">{saveErrorMsg}</span>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModalSchedule(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
                >{t("Close")}</button>
                <button
                  disabled={!canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime) || savingAttendance}
                  onClick={handleSaveAttendance}
                  className={`px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-[var(--shadow)] ${canTakeAttendance(activeModalSchedule.startTime, activeModalSchedule.endTime) && !savingAttendance
                      ? 'bg-gradient-to-r from-[var(--success-hover)] to-[var(--success-hover)] hover:from-[var(--success-hover)] hover:to-[var(--success-hover)] text-[color:var(--on-primary)] shadow-[var(--shadow)] cursor-pointer'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAttendance ? t('Saving...') : t('Save Attendance')}</span>
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        initialTargetType={notifTargetType}
        initialClassId={notifClassId}
        onSuccess={() => {
          showToast({
            type: 'info',
            title: t('Announcement Sent'),
            message: t('Class notification broadcasted to enrolled trainees successfully.'),
            duration: 4500,
          });
        }}
      />

      {/* Trainee Assessment Modal */}
      <TraineeAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        initialClassId={assessmentInitialClassId}
        initialScheduleId={assessmentInitialScheduleId}
        initialStudent={assessmentInitialStudent}
        onSuccess={() => {
          showToast({
            type: 'success',
            title: t('Trainee Assessment Saved'),
            message: t('Trainee performance assessment recorded successfully.'),
            duration: 4000,
          });
          fetchCoachSchedules();
        }}
      />

      {/* Create Reschedule Modal */}
      <CreateRescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        initialScheduleId={rescheduleScheduleId}
        onSuccess={() => {
          showToast({
            type: 'reschedule',
            title: t('Reschedule Request Submitted'),
            message: t('Your reschedule proposal has been sent to Management for room verification & review.'),
            actionLabel: t('View Requests'),
            onAction: () => navigate('/coach/reschedule'),
            duration: 6500,
          });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('notificationUpdated'));
          }
          fetchCoachSchedules();
        }}
      />

      {/* Apple Dynamic Island Toast Notification */}
      <CoachToast
        isOpen={toastState.isOpen}
        onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        actionLabel={toastState.actionLabel}
        onAction={toastState.onAction}
        duration={toastState.duration}
      />
    </div>
  );
};

export default CoachSchedule;


