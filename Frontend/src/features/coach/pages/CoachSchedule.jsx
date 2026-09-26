import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, ChevronRight, MapPin, 
  User, CheckCircle2, Clock, Users, BookOpen, AlertCircle, Phone, Mail, ChevronDown, ChevronUp
} from 'lucide-react';

const CoachSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedScheduleId, setExpandedScheduleId] = useState(null);

  useEffect(() => {
    fetchCoachSchedules();
  }, []);

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

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
              <span>Teaching Portal</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500">Class Calendar & Trainee Roster</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Coach Teaching Schedule</h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Track your assigned classes, inspect student enrolment counts, and manage session attendance.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-t border-[#1a2947] pt-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Total Classes</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[10px]">{totalSchedules}</span>
            </button>
            <button className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <Users className="w-3.5 h-3.5" />
              <span>Total Enrolled Trainees</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-[10px]">{totalEnrolledStudents}</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center bg-[#0b1326] border border-[#1a2947] rounded-lg p-1">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#1a2947] transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold text-sm px-4 text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-[#1a2947] transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button onClick={goToToday} className="px-4 py-2 rounded-lg bg-[#0b1326] border border-[#1a2947] text-slate-300 hover:text-white hover:border-slate-500 font-semibold text-xs transition-all">
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: 70% Calendar | 30% Agenda */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Calendar Column */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          <div className="bg-[#0b1326] border border-[#1a2947] rounded-xl p-4 shadow-xl flex flex-col min-h-[600px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 pb-3 mb-2 text-center font-bold text-xs text-slate-400 tracking-wider uppercase border-b border-[#1a2947]/50">
              <div className="py-1">Mon</div>
              <div className="py-1">Tue</div>
              <div className="py-1">Wed</div>
              <div className="py-1">Thu</div>
              <div className="py-1">Fri</div>
              <div className="py-1 text-emerald-400">Sat</div>
              <div className="py-1 text-emerald-400">Sun</div>
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
                      ${!cell.isCurrentMonth ? 'opacity-30 border-transparent bg-transparent' : 'bg-[#0e172a]'}
                      ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 bg-[#111d38]' : 'border-[#1a2947] hover:border-slate-600'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold text-xs ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-slate-300'}`}>
                        {cell.date.getDate()}
                      </span>
                      {daySchedules.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto scrollbar-none">
                      {daySchedules.map((s, sIdx) => {
                        const time = new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                        return (
                          <div key={sIdx} className="w-full text-left truncate px-1.5 py-1 rounded bg-blue-600/15 border border-blue-500/20 text-blue-300 text-[9px] font-semibold">
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
          <div className="bg-[#0b1326] border border-[#1a2947] rounded-xl p-5 shadow-xl flex flex-col sticky top-28">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a2947]">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Teaching Agenda</span>
                <span className="font-bold text-lg text-white">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#0e172a] border border-[#1a2947] text-slate-300 text-xs font-bold">
                {selectedDateSchedules.length} Sessions
              </span>
            </div>

            <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading schedules...</div>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#0e172a] flex items-center justify-center text-slate-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">No teaching sessions on this date</span>
                </div>
              ) : (
                selectedDateSchedules.map((s, idx) => {
                  const startTime = new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const isExpanded = expandedScheduleId === s.scheduleId;

                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[#0e172a] border border-[#1a2947] flex flex-col gap-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold">
                          {s.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <h4 className="font-bold text-white text-base leading-snug">{s.className}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-xs text-slate-400 mt-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{s.roomName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-medium text-slate-300">
                            Enrolled Trainees: <strong className="text-emerald-400">{s.enrolledCount}</strong> / {s.maxSlots}
                          </span>
                        </div>
                      </div>

                      {/* Expandable Trainee Roster */}
                      <div className="mt-2 pt-3 border-t border-[#1a2947]">
                        <button 
                          onClick={() => toggleExpandSchedule(s.scheduleId)}
                          className="w-full py-1.5 px-3 rounded-lg bg-[#111d38] hover:bg-[#162548] text-slate-300 text-xs font-semibold flex items-center justify-between transition-colors"
                        >
                          <span>Trainee Roster ({s.enrolledStudents ? s.enrolledStudents.length : 0})</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
                            {(!s.enrolledStudents || s.enrolledStudents.length === 0) ? (
                              <p className="text-[11px] text-slate-500 italic py-2 text-center">No students registered yet</p>
                            ) : (
                              s.enrolledStudents.map((st, stIdx) => (
                                <div key={stIdx} className="p-2.5 rounded-lg bg-[#060b17] border border-[#15203b] flex items-center justify-between text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-white">{st.fullName}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      {st.email && (
                                        <span className="flex items-center gap-1">
                                          <Mail className="w-3 h-3 text-slate-500" />
                                          {st.email}
                                        </span>
                                      )}
                                      {st.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="w-3 h-3 text-slate-500" />
                                          {st.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    st.attendanceStatus === 'PRESENT' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {st.attendanceStatus}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachSchedule;
