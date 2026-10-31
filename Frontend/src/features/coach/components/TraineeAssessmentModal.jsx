import { t, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Star, Award, Activity, Heart, Scale, CheckCircle2,
  AlertCircle, Loader2, X, Search, User, Users,
  MessageSquare, Sparkles, Plus, Trash2, Clock, History, RefreshCw, Send, TrendingUp
} from 'lucide-react';
import BodyTransformationModal from '../../member/components/BodyTransformationModal';

const API_BASE = 'http://localhost:8080/api/v1/coach';

const TraineeAssessmentModal = ({
  isOpen,
  onClose,
  initialClassId = null,
  initialScheduleId = null,
  initialStudent = null,
  onSuccess
}) => {
  useLanguage();

  // Class & Student Selection States
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(initialStudent || null);
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // Assessment Form States
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'history'
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [performanceRating, setPerformanceRating] = useState(5);
  const [attendanceRating, setAttendanceRating] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [recommendation, setRecommendation] = useState('');

  // History State
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isTransformationModalOpen, setIsTransformationModalOpen] = useState(false);

  // Status & UI States
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  // Reset form inputs
  const resetForm = () => {
    setAssessmentTitle('');
    setWeight('');
    setHeight('');
    setBodyFatPercentage('');
    setMuscleMass('');
    setPerformanceRating(5);
    setAttendanceRating(5);
    setFeedbackNote('');
    setRecommendation('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchClasses();
    }
  }, [isOpen]);

  // Fetch coach classes
  const fetchClasses = async () => {
    try {
      setLoadingData(true);
      const res = await axios.get(`${API_BASE}/classes`, { headers: getHeaders() });
      const fetchedClasses = res.data || [];
      setClasses(fetchedClasses);

      let targetClassId = initialClassId;
      if (!targetClassId && fetchedClasses.length > 0) {
        targetClassId = fetchedClasses[0].classId;
      }

      if (targetClassId) {
        setSelectedClassId(targetClassId);
        fetchStudentsForClass(targetClassId);
      }
    } catch (err) {
      console.error('Error fetching classes for assessment:', err);
      setErrorMsg(t('Không thể tải danh sách lớp học của HLV.'));
    } finally {
      setLoadingData(false);
    }
  };

  // Fetch students enrolled in selected class
  const fetchStudentsForClass = async (classId) => {
    if (!classId) return;
    try {
      setLoadingData(true);
      const res = await axios.get(`${API_BASE}/classes/${classId}/students`, { headers: getHeaders() });
      const fetchedStudents = res.data || [];
      setStudents(fetchedStudents);

      // Auto pick student if provided or default to first
      let targetSt = null;
      if (initialStudent) {
        targetSt = fetchedStudents.find(s => s.userId === (initialStudent.userId || initialStudent));
      }
      if (!targetSt && fetchedStudents.length > 0) {
        targetSt = fetchedStudents[0];
      }

      setSelectedStudent(targetSt);
      if (targetSt) {
        fetchStudentHistory(targetSt.userId);
      } else {
        setAssessmentHistory([]);
      }
    } catch (err) {
      console.error('Error fetching class students:', err);
      setErrorMsg(t('Không thể tải danh sách học viên của lớp.'));
    } finally {
      setLoadingData(false);
    }
  };

  // Handle class selection change
  const handleClassChange = (e) => {
    const newClassId = e.target.value;
    setSelectedClassId(newClassId);
    resetForm();
    if (newClassId) {
      fetchStudentsForClass(newClassId);
    } else {
      setStudents([]);
      setSelectedStudent(null);
      setAssessmentHistory([]);
    }
  };

  // Handle student selection change
  const handleSelectStudent = (st) => {
    setSelectedStudent(st);
    setErrorMsg('');
    setSuccessMsg('');
    if (st) {
      fetchStudentHistory(st.userId);
    }
  };

  // Fetch history for selected student
  const fetchStudentHistory = async (studentUserId) => {
    if (!studentUserId) return;
    try {
      setLoadingHistory(true);
      const res = await axios.get(`${API_BASE}/assessments/student/${studentUserId}`, { headers: getHeaders() });
      setAssessmentHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching assessment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Submit assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedStudent) {
      setErrorMsg(t('Vui lòng chọn 1 học viên để thực hiện đánh giá.'));
      return;
    }

    if (!feedbackNote.trim()) {
      setErrorMsg(t('Vui lòng nhập nhận xét chi tiết của HLV về học viên.'));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        studentUserId: selectedStudent.userId,
        classId: selectedClassId ? Number(selectedClassId) : null,
        scheduleId: initialScheduleId ? Number(initialScheduleId) : null,
        assessmentTitle: assessmentTitle.trim() || `${t('Đánh giá buổi học')} (${new Date().toLocaleDateString(locale())})`,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
        muscleMass: muscleMass ? parseFloat(muscleMass) : null,
        performanceRating: Number(performanceRating) || 5,
        attendanceRating: Number(attendanceRating) || 5,
        feedbackNote: feedbackNote.trim(),
        recommendation: recommendation.trim() || null
      };

      const res = await axios.post(`${API_BASE}/assessments`, payload, { headers: getHeaders() });

      setSuccessMsg(t('Đánh giá tiến độ đã được lưu và gửi thông báo tới học viên thành công!'));
      
      // Refresh history & switch tab to show result
      await fetchStudentHistory(selectedStudent.userId);
      resetForm();
      setActiveTab('history');

      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error('Error creating assessment:', err);
      const msg = err.response?.data?.message || err.response?.data || t('Có lỗi xảy ra khi lưu đánh giá.');
      setErrorMsg(typeof msg === 'string' ? t(msg) : t('Lỗi khi lưu đánh giá.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete assessment from history
  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm(t('Bạn có chắc chắn muốn xóa bản ghi đánh giá này?'))) return;
    try {
      await axios.delete(`${API_BASE}/assessments/${assessmentId}`, { headers: getHeaders() });
      setAssessmentHistory(prev => prev.filter(a => a.assessmentId !== assessmentId));
    } catch (err) {
      console.error('Error deleting assessment:', err);
      alert(t('Không thể xóa đánh giá.'));
    }
  };

  if (!isOpen) return null;

  // Filter students by search query
  const q = searchStudentQuery.trim().toLowerCase();
  const filteredStudents = students.filter(st =>
    !q || st.fullName?.toLowerCase().includes(q) ||
    st.email?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
    st.phone?.includes(searchStudentQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-hover)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">
                  {t("Đánh Giá Tiến Độ & Ghi Nhận Xét Học Viên")}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold border border-[var(--primary-soft)]">
                  {t("Coach Portal")}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {t("Theo dõi chỉ số thể chất, chấm điểm thể lực và gửi phản hồi định kỳ cho học viên")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2.5 text-xs animate-shake shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2.5 text-xs animate-fade-in shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Main Grid: 35% Trainee Selector (Left) | 65% Assessment Form/History (Right) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

          {/* LEFT COLUMN: Class & Student Selection (4 cols) */}
          <div className="md:col-span-4 p-5 flex flex-col gap-4 overflow-hidden bg-[var(--surface)]">
            
            {/* 1. Class Selection Dropdown */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t("1. Chọn Lớp Học Đang Dạy")}</span>
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={handleClassChange}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold transition-all cursor-pointer"
              >
                {classes.length === 0 ? (
                  <option value="">{t("-- Chưa có lớp học nào --")}</option>
                ) : (
                  classes.map(cls => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className} ({cls.enrolledCount} {t("học viên")})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 2. Search Trainees In Class */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchStudentQuery}
                onChange={e => setSearchStudentQuery(e.target.value)}
                placeholder={t("Tìm học viên trong lớp...")}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-8 pr-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>

            {/* 3. Trainees List Scrollable */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[220px]">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider pb-1">
                <span>{t("Danh sách học viên")} ({filteredStudents.length})</span>
                {selectedStudent && (
                  <span className="text-[var(--primary)]">{t("Đang chọn #")}{selectedStudent.userId}</span>
                )}
              </div>

              {loadingData ? (
                <div className="py-10 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                  <span>{t("Đang tải danh sách...")}</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                  <User className="w-8 h-8 opacity-40" />
                  <span>{t("Lớp này chưa có học viên đăng ký")}</span>
                </div>
              ) : (
                filteredStudents.map(st => {
                  const isSelected = selectedStudent?.userId === st.userId;
                  const initials = st.fullName ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'TR';

                  return (
                    <div
                      key={st.userId}
                      onClick={() => handleSelectStudent(st)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--text)] shadow-md shadow-amber-500/10'
                          : 'bg-[var(--surface)] border-[var(--border)] hover:border-slate-500 text-[var(--text)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[var(--primary)] text-[color:var(--on-primary)] border-[var(--primary)]'
                            : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}>
                          {initials}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-bold text-xs truncate leading-snug">{st.fullName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate">{st.email || st.phone || `ID: #${st.userId}`}</span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 animate-pulse"></span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Trainee Profile Summary Card */}
            {selectedStudent && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/30 to-[var(--surface-hover)] border border-indigo-500/30 text-xs shrink-0 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{t("Học viên mục tiêu")}</span>
                  <span className="font-extrabold text-sm text-[var(--text)]">{selectedStudent.fullName}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{selectedStudent.email}</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Assessment Form & History Tabs (8 cols) */}
          <div className="md:col-span-8 p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(92vh-80px)]">

            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'form'
                      ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t("Ghi Đánh Giá Mới")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>{t("Lịch Sử Đánh Giá")} ({assessmentHistory.length})</span>
                </button>
              </div>

              {selectedStudent && (
                <button
                  type="button"
                  onClick={() => fetchStudentHistory(selectedStudent.userId)}
                  title={t("Làm mới lịch sử")}
                  className="p-2 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* ================= TAB 1: FORM ĐÁNH GIÁ MỚI ================= */}
            {activeTab === 'form' && (
              <form onSubmit={handleSubmitAssessment} className="space-y-5 text-xs">

                {/* Tiêu đề đánh giá */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>{t("Tiêu Đề Buổi Đánh Giá")}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">{t("Tùy chọn, mặc định theo ngày")}</span>
                  </label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={e => setAssessmentTitle(e.target.value)}
                    placeholder={t("VD: Đánh giá thể lực tuần 1 / Kiểm tra kỹ thuật Squat...")}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                  />
                </div>

                {/* Rating Stars Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  {/* Performance Rating */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t("Đánh giá Thể lực & Kỹ thuật")}</span>
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setPerformanceRating(star)}
                          className="p-1 text-slate-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= performanceRating
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-extrabold text-amber-400 ml-2 text-sm">{performanceRating} / 5</span>
                    </div>
                  </div>

                  {/* Attendance & Attitude Rating */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t("Chuyên cần & Tinh thần")}</span>
                    </label>
                    <div className="flex items-center gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setAttendanceRating(star)}
                          className="p-1 text-slate-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= attendanceRating
                                ? 'text-emerald-400 fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="font-extrabold text-emerald-400 ml-2 text-sm">{attendanceRating} / 5</span>
                    </div>
                  </div>
                </div>

                {/* Body Metrics Grid (Optional) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      <span>{t("Chỉ Số Cơ Thể Học Viên")}</span>
                    </label>
                    <span className="text-[10px] text-[var(--text-muted)] italic">{t("Nhập nếu có số liệu đo lường")}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-muted)] font-semibold">{t("Cân nặng (kg)")}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="300"
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder="VD: 68.5"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-muted)] font-semibold">{t("Chiều cao (cm)")}</label>
                      <input
                        type="number"
                        step="0.5"
                        min="50"
                        max="250"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        placeholder="VD: 172"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-muted)] font-semibold">{t("Tỷ lệ Mỡ (%)")}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="3"
                        max="60"
                        value={bodyFatPercentage}
                        onChange={e => setBodyFatPercentage(e.target.value)}
                        placeholder="VD: 18.5"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-[var(--text-muted)] font-semibold">{t("Khối lượng Cơ (kg)")}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="10"
                        max="120"
                        value={muscleMass}
                        onChange={e => setMuscleMass(e.target.value)}
                        placeholder="VD: 32.0"
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Nhận xét của HLV (Bắt buộc) */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>{t("Nhận Xét Chi Tiết Của Huấn Luyện Viên")}</span>
                      <span className="text-rose-500">*</span>
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={feedbackNote}
                    onChange={e => setFeedbackNote(e.target.value)}
                    placeholder={t("Nhận xét về kỹ thuật động tác, tư thế, độ bền thể lực, mức độ hoàn thành bài tập và những điểm học viên đã cải thiện tốt...")}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] resize-none leading-relaxed"
                  />
                </div>

                {/* Dặn dò & Lời khuyên HLV */}
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t("Lời Khuyên & Dặn Dò Dinh Dưỡng / Bài Tập Thêm")}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={recommendation}
                    onChange={e => setRecommendation(e.target.value)}
                    placeholder={t("VD: Chú ý giãn cơ sau buổi tập, bổ sung 2L nước mỗi ngày, tăng nhẹ mức tạ ở set cuối...")}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] resize-none leading-relaxed"
                  />
                </div>

                {/* Submit Action Bar */}
                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{t("Lưu sẽ tự động gửi thông báo hệ thống đến học viên.")}</span>
                  </span>

                  <button
                    type="submit"
                    disabled={submitting || !selectedStudent}
                    className="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[color:var(--on-primary)] font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{t("Đang lưu đánh giá...")}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t("Lưu Đánh Giá Tiến Độ")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 2: LỊCH SỬ ĐÁNH GIÁ CỦA HỌC VIÊN ================= */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {loadingHistory ? (
                  <div className="py-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                    <span>{t("Đang tải lịch sử đánh giá...")}</span>
                  </div>
                ) : assessmentHistory.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
                    <History className="w-10 h-10 opacity-30 text-[var(--primary)]" />
                    <p className="font-bold text-sm text-[var(--text)]">{t("No Evaluations Found Yet")}</p>
                    <p className="max-w-sm">{t('Switch to "New Assessment" tab to start submitting feedback and rating progress for this trainee.')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Quick Access to Body Transformation Visualizer */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent border border-emerald-500/25">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-[var(--text)]">{t("Biểu Đồ Tiến Trình Thể Trạng (FPS)")}</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">{t("Xem trực quan biến đổi cơ mỡ, cân nặng và chỉ số cải thiện thể chất.")}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTransformationModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{t("Xem Biểu Đồ")}</span>
                      </button>
                    </div>

                    {assessmentHistory.map(item => (
                      <div
                        key={item.assessmentId}
                        className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-slate-500 transition-all flex flex-col gap-3 shadow-sm"
                      >
                        {/* Header của thẻ đánh giá */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-1">
                            <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                              <span>{item.assessmentTitle || t('Đánh giá tiến độ')}</span>
                            </h4>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--primary)]" />
                                {new Date(item.createdAt).toLocaleString(locale())}
                              </span>
                              {item.className && (
                                <span className="px-2 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-semibold">
                                  {t("Lớp:")} {item.className}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Stars badge */}
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{item.performanceRating || 5}/5</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteAssessment(item.assessmentId)}
                              title={t("Xóa đánh giá này")}
                              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Body Metrics Summary Pills */}
                        {(item.weight || item.height || item.bodyFatPercentage || item.muscleMass) && (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-[var(--border)]">
                            {item.weight && (
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-semibold">
                                {t("Cân nặng:")} <strong>{item.weight} kg</strong>
                              </span>
                            )}
                            {item.height && (
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-semibold">
                                {t("Chiều cao:")} <strong>{item.height} cm</strong>
                              </span>
                            )}
                            {item.bodyFatPercentage && (
                              <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-semibold">
                                {t("Body Fat:")} <strong>{item.bodyFatPercentage}%</strong>
                              </span>
                            )}
                            {item.muscleMass && (
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                                {t("Khối lượng cơ:")} <strong>{item.muscleMass} kg</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Feedback Note Content */}
                        <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-xs space-y-1">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                            {t("Nhận xét của Huấn Luyện Viên:")}
                          </span>
                          <p className="text-[var(--text)] italic leading-relaxed">
                            "{item.feedbackNote}"
                          </p>
                        </div>

                        {/* Recommendation if any */}
                        {item.recommendation && (
                          <div className="text-[11px] text-[var(--text-muted)] flex items-start gap-1.5 pt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span><strong>{t("Dặn dò:")}</strong> {item.recommendation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Body Transformation Modal */}
      <BodyTransformationModal
        isOpen={isTransformationModalOpen}
        onClose={() => setIsTransformationModalOpen(false)}
        trainee={selectedStudent}
        initialAssessments={assessmentHistory}
        isCoachView={true}
      />
    </div>
  );
};

export default TraineeAssessmentModal;
