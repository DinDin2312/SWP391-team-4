import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, MapPin,
  Clock, Users, BookOpen, Phone, Mail, ChevronDown, ChevronUp,
  X, Search, Sparkles, Save, Check, AlertCircle, AlertTriangle, Bell
} from 'lucide-react';
import SendNotificationModal from '../components/SendNotificationModal';

const CoachSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);

  // Modal State for viewing & updating enrolled trainees attendance
  const [activeModalSchedule, setActiveModalSchedule] = useState(null);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [attendanceMap, setAttendanceMap] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Notification Modal States
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTargetType, setNotifTargetType] = useState('CLASS');
  const [notifClassId, setNotifClassId] = useState(null);

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
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching coach schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachSchedules();
  }, []);

  // Helper function to check if attendance is allowed (session date must be EQUAL to today)
  const canTakeAttendance = (startTime) => {
    if (!startTime) return false;
    const sessionDate = new Date(startTime);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  };

  const getAttendanceRestrictionReason = (startTime) => {
    if (!startTime) return null;
    const sessionDate = new Date(startTime);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (sessionDate > today) {
      return `Chưa đến ngày học (${sessionDate.toLocaleDateString('vi-VN')}). Điểm danh chỉ được phép thực hiện vào đúng ngày học.`;
    }
    if (sessionDate < today) {
      return `Buổi học đã trôi qua (${sessionDate.toLocaleDateString('vi-VN')}). Không thể điểm danh hoặc thay đổi điểm danh sau khi ngày học đã trôi qua.`;
    }
    return null;
  };

  const openTraineesModal = (schedule) => {
    setActiveModalSchedule(schedule);
    setSearchModalQuery('');
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    const initialMap = {};
    if (schedule.enrolledStudents) {
      schedule.enrolledStudents.forEach(st => {
        const key = st.bookingId || st.userId;
        initialMap[key] = st.attendanceStatus || 'NOT_YET';
      });
    }
    setAttendanceMap(initialMap);
  };

  const handleStatusChange = (studentKey, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentKey]: status
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
            attendanceStatus: status
          };
        })
      };

      const res = await axios.put(
        `http://localhost:8080/api/v1/coach/schedules/${activeModalSchedule.scheduleId}/attendance`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSaveSuccessMsg('Điểm danh đã được lưu thành công!');

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
      const msg = error.response?.data?.message || error.response?.data || 'Không thể lưu điểm danh';
      setSaveErrorMsg(typeof msg === 'string' ? msg : 'Lỗi khi lưu điểm danh');
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

  // Filter schedules for the selected date
  const selectedDateSchedules = schedules.filter(s => {
    const sDate = new Date(s.startTime);
    return sDate.getDate() === selectedDate.getDate() &&
      sDate.getMonth() === selectedDate.getMonth() &&
      sDate.getFullYear() === selectedDate.getFullYear();
  });

  // Calculate stats
  const totalSchedules = schedules.length;
  const totalEnrolledStudents = schedules.reduce((sum, s) => sum + (s.enrolledCount || 0), 0);

  const toggleExpandSchedule = (scheduleId) => {
    setExpandedScheduleId(prev => prev === scheduleId ? null : scheduleId);
  };

  // Filter trainees in active modal by search term
  const modalTrainees = activeModalSchedule?.enrolledStudents?.filter(st =>
    st.fullName?.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
    st.email?.toLowerCase().includes(searchModalQuery.toLowerCase()) ||
    st.phone?.includes(searchModalQuery)
  ) || [];

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">Coach Schedule & Trainee Enrolment</h1>
            <p className="text-sm text-[var(--text-muted)] max-w-3xl">
              Select a date on the calendar grid to inspect scheduled sessions, then click to view registered trainees and mark attendance for each class.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Total Classes</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-[10px]">{totalSchedules}</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <Users className="w-3.5 h-3.5" />
              <span>Total Trainees Enrolled</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success-text)] font-bold text-[10px]">{totalEnrolledStudents}</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm px-4 text-[var(--text)]">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button onClick={goToToday} className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] hover:border-[var(--border)] font-semibold text-xs transition-all">
              Today
            </button>
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
              <div className="py-1">Mon</div>
              <div className="py-1">Tue</div>
              <div className="py-1">Wed</div>
              <div className="py-1">Thu</div>
              <div className="py-1">Fri</div>
              <div className="py-1 text-[var(--success-text)]">Sat</div>
              <div className="py-1 text-[var(--success-text)]">Sun</div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.date.getDate() === selectedDate.getDate() && cell.date.getMonth() === selectedDate.getMonth();
                const isToday = cell.date.getDate() === new Date().getDate() && cell.date.getMonth() === new Date().getMonth() && cell.date.getFullYear() === new Date().getFullYear();

                // Find schedules for this cell
                const daySchedules = schedules.filter(s => {
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
                        const time = new Date(s.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[var(--shadow)] flex flex-col sticky top-28">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Teaching Agenda</span>
                <span className="font-bold text-lg text-[var(--text)]">
                  {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--primary)] text-xs font-bold">
                {selectedDateSchedules.length} Sessions
              </span>
            </div>

            <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="text-center py-10 text-[var(--text-muted)]">Loading class schedules...</div>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] font-medium">No teaching sessions on this date</span>
                </div>
              ) : (
                selectedDateSchedules.map((s, idx) => {
                  const startTime = new Date(s.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(s.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const isExpanded = expandedScheduleId === s.scheduleId;
                  const canMark = canTakeAttendance(s.startTime);

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3 relative overflow-hidden group hover:border-[var(--primary-soft)] transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold">
                          {s.status}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <h4 className="font-bold text-[var(--text)] text-base leading-snug">{s.className}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">Room: <strong className="text-[var(--text)]">{s.roomName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="font-medium text-[var(--text)]">
                            Enrolled: <strong className="text-[var(--success-text)]">{s.enrolledCount}</strong> / {s.maxSlots} Trainees
                          </span>
                        </div>
                      </div>

                      {/* Main Action Button: View registered trainees modal */}
                      <div className="mt-3 pt-3 border-t border-[var(--border)] flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => openTraineesModal(s)}
                            className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-[var(--text)] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Học viên ({s.enrolledCount})</span>
                          </button>

                          <button
                            onClick={() => handleOpenClassNotification(s.classId)}
                            className="py-2 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 hover:text-[var(--text)] font-semibold text-xs border border-blue-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>Báo tin lớp</span>
                          </button>
                        </div>

                        <button
                          onClick={() => toggleExpandSchedule(s.scheduleId)}
                          className="w-full py-1.5 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] text-[11px] font-medium flex items-center justify-between transition-colors"
                        >
                          <span>Toggle quick roster list below</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>


                      {/* Expandable Quick View */}
                      {isExpanded && (
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
                          {(!s.enrolledStudents || s.enrolledStudents.length === 0) ? (
                            <p className="text-[11px] text-[var(--text-muted)] italic py-2 text-center">No trainees registered for this session yet</p>
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
                                    ? 'bg-[var(--success-soft)] text-[var(--success-text)] border border-[var(--success-soft)]'
                                    : st.attendanceStatus === 'ABSENT'
                                      ? 'bg-[var(--rose-soft)] text-[var(--rose)] border border-[var(--rose-soft)]'
                                      : 'bg-[var(--warning-soft)] text-[var(--warning-text)] border border-[var(--warning-soft)]'
                                  }`}>
                                  {st.attendanceStatus || 'NOT_YET'}
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
                  <span>Class Trainee Roster & Attendance</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] leading-snug">
                  {activeModalSchedule.className}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text)] mt-1">
                  <span className="flex items-center gap-1 text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {new Date(activeModalSchedule.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(activeModalSchedule.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
            {!canTakeAttendance(activeModalSchedule.startTime) && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-[var(--warning-soft)] border border-[var(--warning-soft)] flex items-center gap-3 text-[var(--warning-text)] text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--warning-text)]" />
                <span>
                  {getAttendanceRestrictionReason(activeModalSchedule.startTime)}
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
                  placeholder="Search trainees by name, email, phone..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] text-xs font-bold">
                  Capacity: {activeModalSchedule.enrolledCount} / {activeModalSchedule.maxSlots} Trainees
                </span>
              </div>
            </div>

            {/* Trainees List Body */}
            <div className="p-6 overflow-y-auto scrollbar-none flex flex-col gap-3 flex-1">
              {modalTrainees.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 text-[var(--text-muted)] mb-2" />
                  <p className="text-sm font-semibold text-[var(--text)]">No trainees found</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">No registered trainees or search query doesn't match</p>
                </div>
              ) : (
                modalTrainees.map((st, stIdx) => {
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR';
                  const key = st.bookingId || st.userId;
                  const currentStatus = attendanceMap[key] || 'NOT_YET';
                  const isAllowed = canTakeAttendance(activeModalSchedule.startTime);

                  return (
                    <div
                      key={stIdx}
                      className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-[var(--text)] text-sm">{st.fullName}</h5>
                            <span className="px-2 py-0.5 rounded bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-semibold">
                              {st.bookingStatus || 'CONFIRMED'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                            {st.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-[var(--text-muted)]" />
                                {st.email}
                              </span>
                            )}
                            {st.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                                {st.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Selector Controls */}
                      <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'NOT_YET')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentStatus === 'NOT_YET'
                              ? 'bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] shadow'
                              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                            } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!isAllowed ? 'Chưa đến ngày học' : 'Đặt trạng thái Chưa điểm danh'}
                        >
                          NOT YET
                        </button>
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${currentStatus === 'PRESENT'
                              ? 'bg-[var(--success-hover)] text-[color:var(--on-primary)] border border-[var(--success-soft)] shadow shadow-[var(--shadow)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--success-text)] hover:bg-[var(--success-soft)]'
                            } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!isAllowed ? 'Chưa đến ngày học' : 'Điểm danh Có Mặt'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Present
                        </button>
                        <button
                          type="button"
                          disabled={!isAllowed}
                          onClick={() => handleStatusChange(key, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${currentStatus === 'ABSENT'
                              ? 'bg-[var(--rose)] text-[color:var(--on-primary)] border border-[var(--rose-soft)] shadow shadow-[var(--shadow)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--rose)] hover:bg-[var(--rose-soft)]'
                            } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          title={!isAllowed ? 'Chưa đến ngày học' : 'Điểm danh Vắng Mặt'}
                        >
                          <X className="w-3.5 h-3.5" />
                          Absent
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
                  <span>Gửi thông báo cho lớp này</span>
                </button>
                {saveSuccessMsg && <span className="text-[var(--success-text)] text-xs font-semibold">{saveSuccessMsg}</span>}
                {saveErrorMsg && <span className="text-[var(--danger-text)] text-xs font-semibold">{saveErrorMsg}</span>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveModalSchedule(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  disabled={!canTakeAttendance(activeModalSchedule.startTime) || savingAttendance}
                  onClick={handleSaveAttendance}
                  className={`px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-[var(--shadow)] ${canTakeAttendance(activeModalSchedule.startTime) && !savingAttendance
                      ? 'bg-gradient-to-r from-[var(--success-hover)] to-[var(--success-hover)] hover:from-[var(--success-hover)] hover:to-[var(--success-hover)] text-[color:var(--on-primary)] shadow-[var(--shadow)] cursor-pointer'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]'
                    }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{savingAttendance ? 'Saving...' : 'Save Attendance'}</span>
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
    </div>
  );
};

export default CoachSchedule;

