import { locale } from '../../../i18n/languageStore.js';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
﻿import { ConfirmModal } from '../../../components/ui/confirm-modal';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Plus, Activity, MapPin,
  User, CheckCircle2, XCircle, Clock
} from 'lucide-react';

const MySchedule = () => {
  useLanguage();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, classId: null });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/member/calendar-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching calendar bookings:', error);
    } finally {
      setLoading(false);
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

  // Next month leading days to complete grid (up to 35 or 42 cells)
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

  // Filter bookings for the selected date
  const selectedDateBookings = bookings.filter(b => {
    const bDate = new Date(b.startTime);
    return bDate.getDate() === selectedDate.getDate() &&
           bDate.getMonth() === selectedDate.getMonth() &&
           bDate.getFullYear() === selectedDate.getFullYear();
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">{t("Nexus Sports Calendar")}</h1>
            <p className="text-sm text-[var(--text-muted)] max-w-3xl">{t("Manage your athletic coaching, group fitness classes, and digitized court bookings.")}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <span>{t("All Sessions")}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-[10px]">{bookings.length}</span>
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
            <button onClick={() => navigate('/member/book-class')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm hover:bg-[var(--primary)] transition-all shadow-[var(--shadow)]">
              <Plus className="w-4 h-4" />
              <span>{t("Book New Session")}</span>
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

                // Find bookings for this cell
                const dayBookings = bookings.filter(b => {
                  const bDate = new Date(b.startTime);
                  return bDate.getDate() === cell.date.getDate() && bDate.getMonth() === cell.date.getMonth();
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
                      {dayBookings.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-hover)]"></span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto scrollbar-none">
                      {dayBookings.map((b, bIdx) => {
                        const time = new Date(b.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                        return (
                          <div key={bIdx} className="w-full text-left truncate px-1.5 py-1 rounded bg-[var(--primary-soft)] text-[var(--primary)] text-[9px] font-semibold">
                            {time} - {b.className}
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
                <span className="font-bold text-[10px] text-[var(--text-muted)] uppercase tracking-widest">{t("Session Details")}</span>
                <span className="font-bold text-lg text-[var(--text)]">
                  {selectedDate.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-bold">
                {selectedDateBookings.length}{' '}{t("Sessions")}</span>
            </div>

            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="text-center py-10 text-[var(--text-muted)]">{t("Loading...")}</div>
              ) : selectedDateBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--text-muted)]">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-[var(--text-muted)] font-medium">{t("No sessions scheduled")}</span>
                </div>
              ) : (
                selectedDateBookings.map((b, idx) => {
                  const startTime = new Date(b.startTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(b.endTime).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
                  const isConfirmed = b.status === 'CONFIRMED';

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col gap-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider flex items-center gap-1
                          ${isConfirmed ? t('bg-[var(--success-soft)] text-[var(--success-text)]') : t('bg-[var(--surface)] text-[var(--text-muted)]')}`}>
                          {isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {codeLabel(b.status)}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <h4 className="font-bold text-[var(--text)] text-base leading-snug">{b.className}</h4>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">{b.coachName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span className="truncate">{b.roomName}</span>
                        </div>
                      </div>

                      {/* Attendance Status */}
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-xs text-[var(--text-muted)] font-medium">{t("Attendance:")}</span>
                        {b.attendanceStatus === 'PRESENT' ? (
                          <span className="text-xs font-bold text-[var(--success-text)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>{t("Present")}</span>
                        ) : b.attendanceStatus === 'ABSENT' ? (
                          <span className="text-xs font-bold text-[var(--rose)] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--rose)]"></span>{t("Absent")}</span>
                        ) : (
                          <span className="text-xs font-medium text-[var(--text-muted)]">{t("Not yet")}</span>
                        )}
                      </div>

                      {isConfirmed && (
                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[var(--border)]">
                          <button className="flex-1 py-1.5 rounded-lg bg-[var(--primary)] text-[color:var(--on-primary)] hover:bg-[var(--primary)] text-xs font-bold transition-colors">{t("Check-in QR")}</button>
                          <button onClick={() => setCancelModal({ isOpen: true, classId: b.classId })} className="px-3 py-1.5 rounded-lg bg-[var(--surface)] text-[var(--text)] hover:text-[var(--danger-text)] text-xs font-medium transition-colors">{t("Cancel")}</button>
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

export default MySchedule;



