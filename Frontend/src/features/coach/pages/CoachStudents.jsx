import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Search, Mail, Phone, BookOpen, ChevronRight, UserCheck, X, Bell, Send, Dumbbell, Target, Trophy, Activity
} from 'lucide-react';
import SendNotificationModal from '../components/SendNotificationModal';

const CoachStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Notification Modal States
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTargetType, setNotifTargetType] = useState('ALL');
  const [notifStudent, setNotifStudent] = useState(null);

  useEffect(() => {
    fetchCoachStudents();
  }, []);

  const fetchCoachStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/v1/coach/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching coach students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBroadcastNotif = () => {
    setNotifTargetType('ALL');
    setNotifStudent(null);
    setIsNotifModalOpen(true);
  };

  const handleOpenIndividualNotif = (student) => {
    setNotifTargetType('INDIVIDUAL');
    setNotifStudent(student);
    setIsNotifModalOpen(true);
  };

  // Filter students by name, email, or phone
  const filteredStudents = students.filter(s =>
    s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  // Compute stats
  const totalTrainees = students.length;
  const totalBookingsCount = students.reduce((sum, s) => sum + (s.totalBookings || 0), 0);

  // Calculate unique class names
  const allClassNames = new Set();
  students.forEach(s => {
    if (s.enrolledClasses) {
      s.enrolledClasses.forEach(c => allClassNames.add(c));
    }
  });

  return (
    <div className="flex flex-col w-full pb-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[var(--primary)] font-semibold text-[11px] uppercase tracking-wider">
            <span>Teaching Management</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--text-muted)]">Trainee Roster</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">Assigned Trainees List</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-3xl">
            Manage and inspect all trainees enrolled in your athletic coaching sessions and classes.
          </p>
        </div>

        {/* Global Notification Button */}
        <button
          onClick={handleOpenBroadcastNotif}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Gửi Thông Báo</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Total Assigned Trainees</span>
            <span className="text-2xl font-bold text-[var(--text)]">{totalTrainees} <span className="text-xs text-[var(--text-muted)] font-normal">trainees</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--success-soft)] text-[var(--success-text)] flex items-center justify-center border border-[var(--success-soft)] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Active Classes Taught</span>
            <span className="text-2xl font-bold text-[var(--text)]">{allClassNames.size} <span className="text-xs text-[var(--text-muted)] font-normal">classes</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-text)] flex items-center justify-center border border-[var(--warning-soft)] shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Total Session Registrations</span>
            <span className="text-2xl font-bold text-[var(--text)]">{totalBookingsCount} <span className="text-xs text-[var(--text-muted)] font-normal">sessions</span></span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col gap-6">

        {/* Search & Filter Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainees by name, email, phone..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Showing <strong className="text-[var(--text)]">{filteredStudents.length}</strong> of {totalTrainees} trainees</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="text-center py-16 text-[var(--text-muted)]">Loading assigned trainees...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-[var(--text-muted)] mb-3" />
            <h4 className="text-base font-bold text-[var(--text)]">No Trainee Records Found</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">No trainees matched your current search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text)]">
              <thead className="bg-[var(--surface)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-xl">Trainee</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Enrolled Classes</th>
                  <th className="px-4 py-3.5 text-center">Booked Sessions</th>
                  <th className="px-4 py-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredStudents.map((st, idx) => {
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR';

                  return (
                    <tr key={idx} className="hover:bg-[var(--surface-hover)] transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[var(--text)] text-sm group-hover:text-[var(--primary)] transition-colors">{st.fullName}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">Trainee ID: #{st.userId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 text-[var(--text)]">
                          {st.email && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {st.email}
                            </span>
                          )}
                          {st.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                              <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              {st.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {st.enrolledClasses && st.enrolledClasses.length > 0 ? (
                            st.enrolledClasses.map((cls, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded-md bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-semibold">
                                {cls}
                              </span>
                            ))
                          ) : (
                            <span className="text-[var(--text-muted)] italic text-[11px]">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] font-bold text-xs">
                          {st.totalBookings || 0} sessions
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate('/coach/workouts')}
                            title="Giao bài tập"
                            className="px-3 py-1.5 rounded-lg bg-[var(--primary-soft)] hover:bg-[var(--primary)] hover:text-[color:var(--on-primary)] text-[var(--primary)] font-semibold text-xs border border-[var(--primary-soft)] flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Dumbbell className="w-3.5 h-3.5" />
                            <span>Giao bài</span>
                          </button>

                          <button
                            onClick={() => handleOpenIndividualNotif(st)}
                            title="Gửi thông báo riêng"
                            className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 hover:text-[var(--text)] font-semibold text-xs border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-blue-400" />
                            <span>Gửi tin</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudent(st)}
                            className="px-3.5 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--text)] font-semibold text-xs border border-[var(--border)] transition-all cursor-pointer"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trainee Detail Modal Popup */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-[var(--shadow)] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-extrabold text-sm flex items-center justify-center">
                  {selectedStudent.fullName ? selectedStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR'}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-[var(--text)]">{selectedStudent.fullName}</h3>
                  <span className="text-xs text-[var(--primary)] font-medium">Official Nexus Center Trainee</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">Contact Information</h5>
                <div className="grid grid-cols-1 gap-2 pt-1 text-[var(--text)]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Email: <strong className="text-[var(--text)]">{selectedStudent.email || 'Not updated'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Phone: <strong className="text-[var(--text)]">{selectedStudent.phone || 'Not updated'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Workout Goal & Fitness Level Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/30 via-[var(--surface)] to-purple-900/20 border border-indigo-500/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <h5 className="font-bold text-indigo-300 text-xs uppercase tracking-wider">Mục tiêu tập luyện & Thể lực</h5>
                  </div>
                  {selectedStudent.fitnessLevel && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-[11px] border border-indigo-500/30 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      {selectedStudent.fitnessLevel}
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">Mục tiêu cá nhân:</span>
                    <p className="text-sm font-semibold text-[var(--text)] mt-0.5 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{selectedStudent.workoutGoal || 'Chưa thiết lập mục tiêu tập luyện'}</span>
                    </p>
                  </div>

                  {selectedStudent.assignedPlans && selectedStudent.assignedPlans.length > 0 && (
                    <div className="pt-2 border-t border-indigo-500/10">
                      <span className="text-[11px] text-[var(--text-muted)] block mb-1">Giáo án HLV đã giao:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudent.assignedPlans.map((planTitle, pIdx) => (
                          <span key={pIdx} className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-medium text-[11px] border border-purple-500/30 flex items-center gap-1">
                            <Dumbbell className="w-3 h-3 text-purple-400" />
                            {planTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">Enrolled Classes Taught By You</h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStudent.enrolledClasses && selectedStudent.enrolledClasses.length > 0 ? (
                    selectedStudent.enrolledClasses.map((cls, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold">
                        {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--text-muted)] italic">No classes found</span>
                  )}
                </div>
              </div>

              {selectedStudent.bio && (
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                  <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">Notes / Bio</h5>
                  <p className="text-[var(--text)] italic">{selectedStudent.bio}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-between items-center">
              <button
                onClick={() => {
                  const current = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenIndividualNotif(current);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi thông báo</span>
              </button>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] hover:text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      <SendNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        initialTargetType={notifTargetType}
        initialStudent={notifStudent}
      />
    </div>
  );
};

export default CoachStudents;



