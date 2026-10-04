import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, Mail, Phone, BookOpen, ChevronRight, UserCheck, X, Bell, Send
} from 'lucide-react';
import SendNotificationModal from '../components/SendNotificationModal';

const CoachStudents = () => {
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
          <div className="flex items-center gap-1 text-blue-400 font-semibold text-[11px] uppercase tracking-wider">
            <span>Teaching Management</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-500">Trainee Roster</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Assigned Trainees List</h1>
          <p className="text-sm text-slate-400 max-w-3xl">
            Manage and inspect all trainees enrolled in your athletic coaching sessions and classes.
          </p>
        </div>

        {/* Global Notification Button */}
        <button
          onClick={handleOpenBroadcastNotif}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>Gửi Thông Báo</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Assigned Trainees</span>
            <span className="text-2xl font-bold text-white">{totalTrainees} <span className="text-xs text-slate-400 font-normal">trainees</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Active Classes Taught</span>
            <span className="text-2xl font-bold text-white">{allClassNames.size} <span className="text-xs text-slate-400 font-normal">classes</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0b1326] border border-[#1a2947] flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Session Registrations</span>
            <span className="text-2xl font-bold text-white">{totalBookingsCount} <span className="text-xs text-slate-400 font-normal">sessions</span></span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-[#0b1326] border border-[#1a2947] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
        
        {/* Search & Filter Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a2947]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainees by name, email, phone..."
              className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Showing <strong className="text-white">{filteredStudents.length}</strong> of {totalTrainees} trainees</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading assigned trainees...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="text-base font-bold text-white">No Trainee Records Found</h4>
            <p className="text-xs text-slate-400 mt-1">No trainees matched your current search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e172a] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#1a2947]">
                <tr>
                  <th className="px-4 py-3.5 rounded-l-xl">Trainee</th>
                  <th className="px-4 py-3.5">Contact Details</th>
                  <th className="px-4 py-3.5">Enrolled Classes</th>
                  <th className="px-4 py-3.5 text-center">Booked Sessions</th>
                  <th className="px-4 py-3.5 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2947]/50">
                {filteredStudents.map((st, idx) => {
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR';

                  return (
                    <tr key={idx} className="hover:bg-[#0e172a]/70 transition-colors group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">{st.fullName}</span>
                            <span className="text-[10px] text-slate-500">Trainee ID: #{st.userId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1 text-slate-300">
                          {st.email && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              {st.email}
                            </span>
                          )}
                          {st.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              {st.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {st.enrolledClasses && st.enrolledClasses.length > 0 ? (
                            st.enrolledClasses.map((cls, cIdx) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded-md bg-blue-600/15 border border-blue-500/20 text-blue-300 text-[10px] font-semibold">
                                {cls}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                          {st.totalBookings || 0} sessions
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenIndividualNotif(st)}
                            title="Gửi thông báo riêng"
                            className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-300 hover:text-white font-semibold text-xs border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5 text-blue-400" />
                            <span>Gửi tin</span>
                          </button>

                          <button 
                            onClick={() => setSelectedStudent(st)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#111d38] hover:bg-[#162548] text-slate-300 hover:text-white font-semibold text-xs border border-slate-700/50 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#091124] border border-[#1b2b4f] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-gradient-to-r from-[#0b1326] via-[#111d38] to-[#0e172a] border-b border-[#1b2b4f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 font-extrabold text-sm flex items-center justify-center">
                  {selectedStudent.fullName ? selectedStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR'}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-white">{selectedStudent.fullName}</h3>
                  <span className="text-xs text-blue-400 font-medium">Official Nexus Center Trainee</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-8 h-8 rounded-lg bg-[#111d38] text-slate-400 hover:text-white hover:bg-[#1a2947] flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0e172a] border border-[#1b2b4f] space-y-2">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Contact Information</h5>
                <div className="grid grid-cols-1 gap-2 pt-1 text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>Email: <strong className="text-white">{selectedStudent.email || 'Not updated'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>Phone: <strong className="text-white">{selectedStudent.phone || 'Not updated'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0e172a] border border-[#1b2b4f] space-y-2">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Enrolled Classes Taught By You</h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStudent.enrolledClasses && selectedStudent.enrolledClasses.length > 0 ? (
                    selectedStudent.enrolledClasses.map((cls, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold">
                        {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">No classes found</span>
                  )}
                </div>
              </div>

              {selectedStudent.bio && (
                <div className="p-4 rounded-xl bg-[#0e172a] border border-[#1b2b4f] space-y-1">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">Notes / Bio</h5>
                  <p className="text-slate-300 italic">{selectedStudent.bio}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#0b1326] border-t border-[#1b2b4f] flex justify-between items-center">
              <button
                onClick={() => {
                  const current = selectedStudent;
                  setSelectedStudent(null);
                  handleOpenIndividualNotif(current);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Gửi thông báo</span>
              </button>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-[#111d38] hover:bg-[#1a2947] text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
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
      />
    </div>
  );
};

export default CoachStudents;



