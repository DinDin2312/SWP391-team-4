import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Search, Mail, Phone, BookOpen, ChevronRight, UserCheck, X, Bell, Send, Dumbbell, Target, Trophy, Activity, TrendingUp, HeartPulse, AlertTriangle
} from 'lucide-react';
import SendNotificationModal from '../components/SendNotificationModal';
import BodyTransformationModal from '../../member/components/BodyTransformationModal';
import { healthBadge, HEALTH_CONDITIONS } from '../../member/healthProfileUtils';

const CoachStudents = () => {
  const navigate = useNavigate();
  const currentLang = useLanguage();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Notification Modal States
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTargetType, setNotifTargetType] = useState('ALL');
  const [notifStudent, setNotifStudent] = useState(null);

  // Body Transformation Visualizer Modal States
  const [isTransformationModalOpen, setIsTransformationModalOpen] = useState(false);
  const [selectedTraineeForChart, setSelectedTraineeForChart] = useState(null);

  useEffect(() => {
    fetchCoachStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedStudent(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

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
  const q = searchQuery.trim().toLowerCase();
  const filteredStudents = students.filter(s =>
    !q || s.fullName?.toLowerCase().includes(q) ||
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
            <span>{t("Teaching Management")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--text-muted)]">{t("Trainee Roster")}</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight">{t("Assigned Trainees List")}</h1>
          <p className="text-sm text-[var(--text-muted)] max-w-3xl">{t("Manage and inspect all trainees enrolled in your athletic coaching sessions and classes.")}</p>
        </div>

        {/* Global Notification Button */}
        <button
          onClick={handleOpenBroadcastNotif}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Bell className="w-4 h-4 animate-bounce" />
          <span>{t("Gửi Thông Báo")}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Total Assigned Trainees")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{totalTrainees} <span className="text-xs text-[var(--text-muted)] font-normal">{t("trainees")}</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--success-soft)] text-[var(--success-text)] flex items-center justify-center border border-[var(--success-soft)] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Active Classes Taught")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{allClassNames.size} <span className="text-xs text-[var(--text-muted)] font-normal">{t("classes")}</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--warning-soft)] text-[var(--warning-text)] flex items-center justify-center border border-[var(--warning-soft)] shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">{t("Total Session Registrations")}</span>
            <span className="text-2xl font-bold text-[var(--text)]">{totalBookingsCount} <span className="text-xs text-[var(--text-muted)] font-normal">{t("sessions")}</span></span>
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
              placeholder={t("Search trainees by name, email, phone...")}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{t("Showing")}<strong className="text-[var(--text)]">{filteredStudents.length}</strong>{t("of")}{' '}{totalTrainees}{' '}{t("trainees")}</span>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="text-center py-16 text-[var(--text-muted)]">{t("Loading assigned trainees...")}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-[var(--text-muted)] mb-3" />
            <h4 className="text-base font-bold text-[var(--text)]">{t("No Trainee Records Found")}</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">{t("No trainees matched your current search criteria")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-xs text-[var(--text)]">
              <thead className="bg-[var(--surface-hover)]/70 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[11px] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">{t("Trainee")}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">{t("Contact Details")}</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">{t("Enrolled Classes")}</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">{t("Booked Sessions")}</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredStudents.map((st, idx) => {
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : t('TR');
                  const hBadge = healthBadge(st.health, currentLang);

                  return (
                    <tr key={st.userId || idx} className="hover:bg-[var(--surface-hover)]/40 transition-colors group">
                      {/* 1. Trainee & Health Profile */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div
                            onClick={() => setSelectedStudent(st)}
                            className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            title={t("Chi tiết")}
                          >
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span
                              onClick={() => setSelectedStudent(st)}
                              className="font-bold text-[var(--text)] text-sm group-hover:text-[var(--primary)] transition-colors truncate cursor-pointer"
                              title={st.fullName}
                            >
                              {st.fullName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-[var(--text-muted)] font-mono whitespace-nowrap">#{st.userId}</span>
                              <span className="text-[10px] text-[var(--text-muted)] opacity-40">•</span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                                  hBadge.variant === 'danger'
                                    ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                    : hBadge.variant === 'warning'
                                    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                                    : hBadge.variant === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                    : 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30'
                                }`}
                                title={hBadge.tooltip}
                              >
                                <HeartPulse className="w-2.5 h-2.5 shrink-0" />
                                <span>{t(hBadge.label)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Details */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5 min-w-[170px] text-[var(--text)]">
                          <span className="flex items-center gap-1.5 text-xs">
                            <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            <span className="truncate max-w-[180px]">{st.email || t('Not updated')}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            <span>{st.phone || t('No phone')}</span>
                          </span>
                        </div>
                      </td>

                      {/* 3. Enrolled Classes */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 min-w-[180px] max-w-[240px]">
                          {st.enrolledClasses && st.enrolledClasses.length > 0 ? (
                            <>
                              {st.enrolledClasses.slice(0, 2).map((cls, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-[11px] font-semibold truncate max-w-full"
                                  title={cls}
                                >
                                  <BookOpen className="w-3 h-3 shrink-0 opacity-70" />
                                  <span className="truncate">{cls}</span>
                                </span>
                              ))}
                              {st.enrolledClasses.length > 2 && (
                                <span
                                  className="text-[10px] text-[var(--text-muted)] font-medium pl-1"
                                  title={st.enrolledClasses.slice(2).join(', ')}
                                >
                                  +{st.enrolledClasses.length - 2} {t('lớp khác')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[var(--text-muted)] italic text-[11px]">{t("Unassigned")}</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Booked Sessions */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60 font-bold text-xs shadow-xs">
                          <Activity className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>{st.totalBookings || 0} {t("sessions")}</span>
                        </span>
                      </td>

                      {/* 5. Action Buttons */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTraineeForChart(st);
                              setIsTransformationModalOpen(true);
                            }}
                            title={t("Xem biểu đồ tiến trình thể trạng & FPS")}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 group-hover:text-white" />
                            <span>{t("Tiến độ")}</span>
                          </button>

                          <button
                            onClick={() => navigate('/coach/workouts')}
                            title={t("Giao bài tập")}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-blue-800 dark:text-blue-300 font-bold text-xs border border-blue-300 dark:border-blue-700/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                          >
                            <Dumbbell className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 group-hover:text-white" />
                            <span>{t("Giao bài")}</span>
                          </button>

                          <button
                            onClick={() => handleOpenIndividualNotif(st)}
                            title={t("Gửi thông báo riêng")}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white text-purple-800 dark:text-purple-300 font-bold text-xs border border-purple-300 dark:border-purple-700/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                          >
                            <Send className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 group-hover:text-white" />
                            <span>{t("Gửi tin")}</span>
                          </button>

                          <button
                            onClick={() => setSelectedStudent(st)}
                            title={t("Xem hồ sơ chi tiết")}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[var(--primary)] hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                          >
                            <span>{t("Chi tiết")}</span>
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
        <div
          onClick={() => setSelectedStudent(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col my-auto"
          >
            <div className="shrink-0 p-5 sm:p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-extrabold text-sm flex items-center justify-center shrink-0">
                  {selectedStudent.fullName ? selectedStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : t('TR')}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-lg font-bold text-[var(--text)] truncate">{selectedStudent.fullName}</h3>
                  <span className="text-xs text-[var(--primary)] font-medium">{t("Official Nexus Center Trainee")}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                aria-label={t("Đóng")}
                className="w-9 h-9 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">{t("Contact Information")}</h5>
                <div className="grid grid-cols-1 gap-2 pt-1 text-[var(--text)]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>{t("Email:")}<strong className="text-[var(--text)]">{t(selectedStudent.email || 'Not updated')}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>{t("Phone:")}<strong className="text-[var(--text)]">{t(selectedStudent.phone || 'Not updated')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Workout Goal & Fitness Level Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-[var(--surface)] to-purple-50/50 dark:from-indigo-950/40 dark:via-[var(--surface)] dark:to-purple-950/20 border border-indigo-200/80 dark:border-indigo-500/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h5 className="font-bold text-indigo-700 dark:text-indigo-300 text-xs uppercase tracking-wider">{t("Mục tiêu tập luyện & Thể lực")}</h5>
                  </div>
                  {selectedStudent.fitnessLevel && (
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      {codeLabel(selectedStudent.fitnessLevel) || selectedStudent.fitnessLevel}
                    </span>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block">{t("Mục tiêu cá nhân:")}</span>
                    <p className="text-sm font-semibold text-[var(--text)] mt-0.5 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>{selectedStudent.workoutGoal || t("Chưa thiết lập mục tiêu tập luyện")}</span>
                    </p>
                  </div>

                  {selectedStudent.assignedPlans && selectedStudent.assignedPlans.length > 0 && (
                    <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-500/10">
                      <span className="text-[11px] text-[var(--text-muted)] block mb-1">{t("Giáo án HLV đã giao:")}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudent.assignedPlans.map((planTitle, pIdx) => (
                          <span key={pIdx} className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium text-[11px] border border-purple-200 dark:border-purple-500/30 flex items-center gap-1 shadow-xs">
                            <Dumbbell className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            {planTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

                            {/* Health Profile & Medical Alert Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50/80 via-[var(--surface)] to-blue-50/50 dark:from-teal-950/40 dark:via-[var(--surface)] dark:to-blue-950/20 border border-teal-200/80 dark:border-teal-500/30 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-teal-200/80 dark:border-teal-500/20 pb-2">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <h5 className="font-bold text-teal-700 dark:text-teal-300 text-xs uppercase tracking-wider">{t("Health & Physiology Profile")}</h5>
                  </div>
                  {selectedStudent.health && (
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border flex items-center gap-1 ${
                      selectedStudent.health.clearanceRecommended
                        ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        : selectedStudent.health.completed
                        ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30'
                        : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/30'
                    }`}>
                      {t(healthBadge(selectedStudent.health, currentLang).label)}
                    </span>
                  )}
                </div>

                {selectedStudent.health?.clearanceRecommended && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{t("Warning: Red-flag PAR-Q — Medical consultation advised before vigorous training.")}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[var(--text-muted)] block">{t("Gender:")}</span>
                    <strong className="text-[var(--text)]">
                      {selectedStudent.health?.gender === 'MALE' ? t('Male') : selectedStudent.health?.gender === 'FEMALE' ? t('Female') : selectedStudent.health?.gender ? t('Other') : t('Not declared')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">{t("Age:")}</span>
                    <strong className="text-[var(--text)]">
                      {selectedStudent.health?.age != null ? t('{0} years old', [selectedStudent.health.age]) : t('Not declared')}
                    </strong>
                  </div>
                </div>

                {selectedStudent.health?.conditions && selectedStudent.health.conditions.length > 0 && (
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] block mb-1.5 font-medium">{t("Pre-existing conditions / Injuries:")}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.health.conditions.map((cCode, cIdx) => {
                        const condObj = HEALTH_CONDITIONS.find(c => c.code === cCode);
                        const condLabel = condObj ? (currentLang === 'en' ? condObj.en : condObj.vi) : cCode;
                        return (
                          <span
                            key={cIdx}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-500/30 shadow-xs"
                          >
                            {condLabel}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedStudent.health?.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-[var(--text)] italic">
                    "{selectedStudent.health.notes}"
                  </div>
                )}
              </div>

<div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">{t("Enrolled Classes Taught By You")}</h5>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedStudent.enrolledClasses && selectedStudent.enrolledClasses.length > 0 ? (
                    selectedStudent.enrolledClasses.map((cls, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold">
                        {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--text-muted)] italic">{t("No classes found")}</span>
                  )}
                </div>
              </div>

              {selectedStudent.bio && (
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
                  <h5 className="font-bold text-[var(--text)] text-xs uppercase tracking-wider text-[var(--text-muted)]">{t("Notes / Bio")}</h5>
                  <p className="text-[var(--text)] italic">{selectedStudent.bio}</p>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 bg-[var(--surface)] border-t border-[var(--border)] flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = selectedStudent;
                    setSelectedStudent(null);
                    setSelectedTraineeForChart(current);
                    setIsTransformationModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{t("Biểu đồ thể trạng (FPS)")}</span>
                </button>

                <button
                  onClick={() => {
                    const current = selectedStudent;
                    setSelectedStudent(null);
                    handleOpenIndividualNotif(current);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{t("Gửi thông báo")}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] border border-[var(--border)] font-semibold text-xs transition-all cursor-pointer"
              >{t("Đóng")}</button>
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

      {/* Body Transformation Visualizer Modal */}
      <BodyTransformationModal
        isOpen={isTransformationModalOpen}
        onClose={() => setIsTransformationModalOpen(false)}
        trainee={selectedTraineeForChart}
        isCoachView={true}
      />
    </div>
  );
};

export default CoachStudents;



