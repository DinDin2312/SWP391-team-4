import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ChevronLeft, ChevronRight, Plus, Activity, MapPin, 
  User, CheckCircle2, XCircle, Clock
} from 'lucide-react';

const MySchedule = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
            <div className="flex items-center gap-1 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
              <span>Personal Schedule</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-500">Training & Court Reservations</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Nexus Sports Calendar</h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Manage your athletic coaching, group fitness classes, and digitized court bookings.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-t border-[#1a2947] pt-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-all">
              <span>All Sessions</span>
              <span className="px-1.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 font-bold text-[10px]">{bookings.length}</span>
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
            <button onClick={() => navigate('/member/book-class')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30">
              <Plus className="w-4 h-4" />
              <span>Book New Session</span>
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
                      ${!cell.isCurrentMonth ? 'opacity-30 border-transparent bg-transparent' : 'bg-[#0e172a]'}
                      ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 bg-[#111d38]' : 'border-[#1a2947] hover:border-slate-600'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold text-xs ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-slate-300'}`}>
                        {cell.date.getDate()}
                      </span>
                      {dayBookings.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1 overflow-y-auto scrollbar-none">
                      {dayBookings.map((b, bIdx) => {
                        const time = new Date(b.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                        return (
                          <div key={bIdx} className="w-full text-left truncate px-1.5 py-1 rounded bg-blue-600/10 text-blue-400 text-[9px] font-semibold">
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
          <div className="bg-[#0b1326] border border-[#1a2947] rounded-xl p-5 shadow-xl flex flex-col sticky top-28">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a2947]">
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Session Details</span>
                <span className="font-bold text-lg text-white">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#0e172a] border border-[#1a2947] text-slate-300 text-xs font-bold">
                {selectedDateBookings.length} Sessions
              </span>
            </div>

            <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto scrollbar-none pr-1">
              {loading ? (
                <div className="text-center py-10 text-slate-500">Loading...</div>
              ) : selectedDateBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-12 h-12 rounded-full bg-[#0e172a] flex items-center justify-center text-slate-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <span className="text-sm text-slate-400 font-medium">No sessions scheduled</span>
                </div>
              ) : (
                selectedDateBookings.map((b, idx) => {
                  const startTime = new Date(b.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const endTime = new Date(b.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                  const isConfirmed = b.status === 'CONFIRMED';
                  
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-[#0e172a] border border-[#1a2947] flex flex-col gap-3 relative overflow-hidden group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{startTime} - {endTime}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider flex items-center gap-1
                          ${isConfirmed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {isConfirmed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {b.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <h4 className="font-bold text-white text-base leading-snug">{b.className}</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-xs text-slate-400 mt-1">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{b.coachName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span className="truncate">{b.roomName}</span>
                        </div>
                      </div>
                      
                      {isConfirmed && (
                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#1a2947]">
                          <button className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-xs font-bold transition-colors">
                            Check-in QR
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-[#111d38] text-slate-300 hover:text-red-400 text-xs font-medium transition-colors">
                            Cancel
                          </button>
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
    </div>
  );
};

export default MySchedule;

