import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, User, CheckCircle2, AlertCircle, Info, Fingerprint, ShieldCheck, Repeat } from 'lucide-react';

const BookClass = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/member/available-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
      
      if (res.data.length > 0) {
        const uniqueDates = [...new Set(res.data.map(s => new Date(s.nextSessionTime).toDateString()))].sort((a, b) => new Date(a) - new Date(b));
        setSelectedDate(uniqueDates[0]);
      } else {
        setSelectedDate(new Date().toDateString());
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/v1/member/book-class/${classId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setToast({ visible: true, type: 'success', title: 'Course Enrolled', message: 'All sessions synced to your schedule.' });
      setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 4000);
      fetchCourses();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || error.message || "Failed to enroll. Please try again."; setToast({ visible: true, type: 'error', title: 'Enrollment Failed', message: typeof errorMsg === 'string' ? errorMsg : 'Please try again.' }); setTimeout(() => setToast({ visible: false, type: 'success', title: '', message: '' }), 5000);
    }
  };

  const availableDates = [...new Set(courses.map(s => new Date(s.nextSessionTime).toDateString()))].sort((a, b) => new Date(a) - new Date(b));
  if (availableDates.length === 0) availableDates.push(new Date().toDateString());

  const formatDateLabel = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let prefix = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (d.toDateString() === today.toDateString()) prefix = 'Today';
    if (d.toDateString() === tomorrow.toDateString()) prefix = 'Tomorrow';

    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    return `${prefix} (${shortDate})`;
  };

  const filteredCourses = courses.filter(s => {
    const matchesDate = new Date(s.nextSessionTime).toDateString() === selectedDate;
    const matchesSearch = s.className.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.coachName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full pb-10">
      <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-surface-container-high text-on-surface shadow-2xl border border-surface-container-highest ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex flex-col">
            <span className={`font-bold text-sm ${toast.type === 'error' ? 'text-red-500' : 'text-primary'}`}>{toast.title}</span>
            <span className="text-xs text-on-surface-variant">{toast.message}</span>
          </div>
        </div>

      <section className="flex flex-col justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Book Courses</h1>
          <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
            Explore and enroll in high-performance courses and training packages.
          </p>
        </div>
      </section>

      <section className="bg-surface-container-low border border-surface-container-highest rounded-xl p-5 mb-8 shadow-lg flex flex-col gap-5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input 
            className="w-full pl-12 pr-4 py-3 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" 
            placeholder="Search classes, trainers..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-none border-t border-surface-container-highest pt-4">
          <span className="text-sm font-semibold text-on-surface-variant shrink-0">Start Date:</span>
          {availableDates.map(dateStr => {
            const isActive = selectedDate === dateStr;
            return (
              <button 
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5
                  ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {formatDateLabel(dateStr)}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>}
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 flex flex-col gap-5">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant font-medium">Loading available courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-low rounded-xl border border-surface-container-highest">
              <span className="text-on-surface-variant font-medium">No courses found starting on this date.</span>
            </div>
          ) : (
            filteredCourses.map((course, idx) => {
              const startTime = new Date(course.nextSessionTime);
              const timeStr = startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
              
              const spotsLeft = course.maxSlots - (course.bookedSlots || 0);
              const progressWidth = ((course.maxSlots - spotsLeft) / course.maxSlots) * 100;
              const isBooked = course.isBookedByMe;
              const isFull = spotsLeft <= 0;

              return (
                <div key={idx} className="bg-surface-container-low border border-surface-container-highest hover:border-primary/50 transition-colors rounded-xl p-5 flex flex-col sm:flex-row gap-6 shadow-md group">
                  <div className="flex flex-col shrink-0 sm:w-24 text-left">
                    <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-1">First Session</span>
                    <span className="text-2xl font-extrabold text-on-surface">{timeStr}</span>
                    <span className="text-xs font-semibold text-on-surface-variant mt-1">{course.durationMinutes} min/session</span>
                  </div>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">
                        Full Course: {course.totalSessions} Sessions
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-on-surface leading-snug mb-2">{course.className}</h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant mb-4 font-medium">
                      <div className="flex items-center gap-1.5 text-primary">
                        <User className="w-4 h-4" />
                        <span>Coach {course.coachName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{course.roomName}</span>
                      </div>
                    </div>

                                          <details className="text-xs text-slate-400 mb-4 group cursor-pointer bg-[#0f172a] p-2.5 rounded-lg border border-slate-700/50">
                        <summary className="flex items-center gap-2 list-none outline-none">
                          <Repeat className="w-4 h-4 text-purple-400" />
                          Repeats on: <span className="text-slate-200 font-semibold">{course.schedulePattern || 'Custom'}</span>
                          <span className="text-[10px] text-blue-400 ml-auto group-open:hidden border border-blue-500/30 px-2 py-0.5 rounded-full hover:bg-blue-500/10 transition-colors">View all {course.totalSessions} dates</span>
                        </summary>
                        <div className="mt-3 pl-6 pr-2 max-h-24 overflow-y-auto custom-scrollbar">
                          <ul className="list-disc space-y-1 text-slate-300 marker:text-purple-500/50">
                            {course.upcomingDates?.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        </div>
                      </details>
  
                      <div className="flex flex-col gap-1.5 mt-auto">
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${progressWidth}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                        <span>{course.maxSlots - spotsLeft}/{course.maxSlots} Students Enrolled</span>
                        {spotsLeft <= 3 && spotsLeft > 0 && <span className="text-tertiary">Only {spotsLeft} spots left!</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between shrink-0 sm:w-32 border-t sm:border-t-0 sm:border-l border-surface-container-highest pt-4 sm:pt-0 sm:pl-6">
                    <div className="flex flex-col gap-1 text-right sm:text-left">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Course Fee</span>
                      <span className="text-sm font-bold text-primary">{Number(course.price).toLocaleString()} VND</span>
                    </div>
                    
                    <button 
                      onClick={() => handleBook(course.classId)}
                      disabled={isBooked || isFull}
                      className={`mt-4 sm:mt-auto w-full py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg ${isBooked ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed shadow-none' : isFull ? 'bg-red-500/20 text-red-400 cursor-not-allowed shadow-none' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-primary/20'}`}
                    >
                      {isBooked ? 'Enrolled' : isFull ? 'Full' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-6 shadow-md sticky top-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-surface-container-highest">
              <div className="flex items-center gap-2 text-on-surface">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">Course Policy</h3>
              </div>
              <span className="text-xs font-bold text-tertiary tracking-wider uppercase">Nexus Pro</span>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">Full Package Enrollment</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">Enrolling in a course automatically secures your spot for all scheduled sessions.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">Express Check-in</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">Scan your Nexus Pass QR code at the gate 10 minutes prior for automatic check-in.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-on-surface mb-1">Biometric Gear</span>
                  <span className="text-xs text-on-surface-variant leading-relaxed">Chest heart rate monitors are provided for all performance sessions.</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-5 border-t border-surface-container-highest">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-wider text-center">
                Questions? Contact Nexus Support at Desk 1.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookClass;
