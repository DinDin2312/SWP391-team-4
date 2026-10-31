import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, MapPin,
  Clock, Users, BookOpen, Phone, Mail, ChevronDown, ChevronUp,
  X, Search, Sparkles, Save, Check, AlertCircle, Bell, Star
} from 'lucide-react';
import SendNotificationModal from '../components/SendNotificationModal';
import TraineeAssessmentModal from '../components/TraineeAssessmentModal';

const CoachSchedule = () => {
  useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);

  // Modal State for viewing & updating enrolled trainees attendance
  const [activeModalSchedule, setActiveModalSchedule] = useState(null);
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/coach/schedules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(Array.isArray(response.data) ? response.data : []);
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

      const token = localStorage.getItem('token');
      const payload = {
        attendances: Object.entries(attendanceMap).map(([key, status]) => {
          const numId = Number(key);
          const st = activeModalSchedule.enrolledStudents.find(s => (s.bookingId === numId || s.userId === numId));
          return {
            bookingId: st?.bookingId || (numId ? numId : null),
            userId: st?.userId || null,
            attendanceStatus: status,
            overrideFrontDeskCheckIn: Boolean(overrideMap[key])
          };
        })
      };

      await axios.put(
        `http://localhost:8080/api/v1/coach/schedules/${activeModalSchedule.scheduleId}/attendance`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveSuccessMsg(t('Attendance saved successfully!'));

      // Re-fetch fresh schedule data from backend
      await fetchCoachSchedules();

      // Update local state in active modal as well
      setActiveModalSchedule(prev => {
        if (!prev) return null;
        const updatedStudents = prev.enrolledStudents.map(st => {
          const k = st.bookingId || st.userId;
          if (attendanceMap[k]) {
            return { ...st, attendanceStatus: attendanceMap[k] };
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
                        return (
                          <div key={sIdx} className="w-full text-left truncate px-1.5 py-1 rounded bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[9px] font-semibold">
                            {time} - {s.className}
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

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3 relative shrink-0 overflow-hidden group hover:border-[var(--primary-soft)] transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold">
                          {codeLabel(s.status)}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <h4 className="font-bold text-[var(--text)] text-base leading-snug">{s.className}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">{t("Room:")}<strong className="text-[var(--text)]">{s.roomName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="font-medium text-[var(--text)]">{t("Enrolled:")}<strong className="text-[var(--success-text)]">{s.enrolledCount}</strong> / {s.maxSlots}{' '}{t("Trainees")}</span>
                        </div>
                      </div>

                      {/* Main Action Button: View registered trainees modal */}
                      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => openTraineesModal(s)}
                            className="py-2 px-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text)] font-semibold text-[11px] flex items-center justify-center gap-1 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{t("Học viên")}{' '}({s.enrolledCount})</span>
                          </button>

                          <button
                            onClick={() => handleOpenScheduleAssessment(s)}
                            className="py-2 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-white font-semibold text-[11px] border border-amber-500/30 flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{t("Đánh giá")}</span>
                          </button>

                          <button
                            onClick={() => handleOpenClassNotification(s.classId)}
                            className="py-2 px-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 hover:text-[var(--text)] font-semibold text-[11px] border border-blue-500/30 flex items-center justify-center gap-1 transition-all cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{t("Báo tin")}</span>
                          </button>
                        </div>

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
                            s.enrolledStudents.map((st, stIdx) => (
                              <div key={stIdx} className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-[var(--text)]">{st.fullName}</span>
                                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                    {st.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                                        {st.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${st.attendanceStatus === 'PRESENT'
                                    ? t('bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--success-soft)]')
                                    : st.attendanceStatus === 'ABSENT'
                                      ? t('bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose-soft)]')
                                      : t('bg-[var(--warning-soft)] text-[var(--warning-text)] border border-[var(--warning-soft)]')
                                  }`}>
                                  {t(st.attendanceStatus || 'NOT_YET')}
                                </span>
                              </div>
                            ))
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
                <span className="px-3 py-1.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] text-xs font-bold">{t("Capacity:")}{' '}{activeModalSchedule.enrolledCount} / {activeModalSchedule.maxSlots}{' '}{t("Trainees")}</span>
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
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
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
                  className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold text-xs border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-[var(--primary)]" />
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
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        initialTargetType={notifTargetType}
        initialClassId={notifClassId}
      />

      {/* Trainee Assessment Modal */}
      <TraineeAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        initialClassId={assessmentInitialClassId}
        initialScheduleId={assessmentInitialScheduleId}
        initialStudent={assessmentInitialStudent}
        onSuccess={() => {
          fetchCoachSchedules();
        }}
      />
    </div>
  );
};

export default CoachSchedule;


