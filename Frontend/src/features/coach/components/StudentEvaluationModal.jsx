import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award, X, Users, CheckCircle2, AlertCircle, Loader2, Star,
  Activity, TrendingUp, Sparkles, Scale, BookOpen, Clock, Trash2,
  Calendar, ChevronRight, MessageSquare, HeartPulse, User
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/coach';

const StudentEvaluationModal = ({ isOpen, onClose, initialClassId = null, onSuccess }) => {
  useLanguage();

  // Selection states
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');

  // Tab: 'form' (Nhập đánh giá mới) | 'history' (Xem lịch sử đánh giá)
  const [activeTab, setActiveTab] = useState('form');
  const [evaluationsHistory, setEvaluationsHistory] = useState([]);

  // Form states
  const [evaluationType, setEvaluationType] = useState('PER_SESSION'); // 'PER_SESSION' | 'WEEKLY' | 'MONTHLY'
  const [attendanceScore, setAttendanceScore] = useState(8);
  const [effortScore, setEffortScore] = useState(8);
  const [techniqueScore, setTechniqueScore] = useState(8);
  const [coachComment, setCoachComment] = useState('');
  const [recommendations, setRecommendations] = useState('');

  // Physical body metrics (optional)
  const [showBodyMetrics, setShowBodyMetrics] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [muscleMassKg, setMuscleMassKg] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  // Loading & notification states
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', message: '' }

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  const resetForm = () => {
    setCoachComment('');
    setRecommendations('');
    setAttendanceScore(8);
    setEffortScore(8);
    setTechniqueScore(8);
    setWeightKg('');
    setHeightCm('');
    setBodyFatPct('');
    setMuscleMassKg('');
    setProgressNotes('');
    setShowBodyMetrics(false);
  };

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await axios.get(`${API_BASE}/classes`, { headers: getHeaders() });
      const fetched = res.data || [];
      setClasses(fetched);

      if (initialClassId) {
        setSelectedClassId(Number(initialClassId));
      } else if (fetched.length > 0) {
        setSelectedClassId(fetched[0].classId);
      }
    } catch (err) {
      console.error('Error fetching coach classes:', err);
      showBanner('error', 'Không thể tải danh sách lớp học của HLV.');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchClassStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      const res = await axios.get(`${API_BASE}/classes/${classId}/students`, { headers: getHeaders() });
      const fetched = res.data || [];
      setClassStudents(fetched);

      // Auto select first student if available
      if (fetched.length > 0) {
        setSelectedStudent(fetched[0]);
      } else {
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error('Error fetching class students:', err);
      showBanner('error', 'Không thể tải danh sách học viên của lớp này.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchStudentEvaluations = async (userId) => {
    try {
      setLoadingHistory(true);
      const res = await axios.get(`${API_BASE}/evaluations`, {
        params: { userId },
        headers: getHeaders()
      });
      setEvaluationsHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching evaluations history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load classes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      setSelectedStudent(null);
      setBanner(null);
      resetForm();
    }
  }, [isOpen, initialClassId]);

  // Load students when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents(selectedClassId);
    } else {
      setClassStudents([]);
      setSelectedStudent(null);
    }
  }, [selectedClassId]);

  // Load evaluations history when selectedStudent changes
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentEvaluations(selectedStudent.userId);
    } else {
      setEvaluationsHistory([]);
    }
  }, [selectedStudent]);

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showBanner('error', 'Vui lòng chọn 1 học viên để đánh giá.');
      return;
    }
    if (!coachComment.trim()) {
      showBanner('error', 'Vui lòng nhập nội dung nhận xét chi tiết.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        userId: selectedStudent.userId,
        classId: selectedClassId ? Number(selectedClassId) : null,
        evaluationType,
        attendanceScore: Number(attendanceScore),
        effortScore: Number(effortScore),
        techniqueScore: Number(techniqueScore),
        coachComment: coachComment.trim(),
        recommendations: recommendations.trim() || null,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        heightCm: heightCm ? parseFloat(heightCm) : null,
        bodyFatPct: bodyFatPct ? parseFloat(bodyFatPct) : null,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : null,
        progressNotes: progressNotes.trim() || null
      };

      const res = await axios.post(`${API_BASE}/evaluations`, payload, { headers: getHeaders() });

      showBanner('success', res.data?.message || 'Đã lưu đánh giá và gửi thông báo thành công!');
      resetForm();

      // Refresh evaluations list
      fetchStudentEvaluations(selectedStudent.userId);
      setActiveTab('history');

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      const msg = err.response?.data?.message || err.response?.data || 'Không thể lưu đánh giá.';
      showBanner('error', typeof msg === 'string' ? msg : 'Lỗi khi lưu đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi đánh giá này không?')) return;
    try {
      await axios.delete(`${API_BASE}/evaluations/${evaluationId}`, { headers: getHeaders() });
      setEvaluationsHistory(prev => prev.filter(e => e.evaluationId !== evaluationId));
      showBanner('success', 'Đã xóa bản ghi đánh giá.');
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      showBanner('error', 'Không thể xóa đánh giá.');
    }
  };

  if (!isOpen) return null;

  // Filter students by search term
  const filteredStudents = classStudents.filter(st =>
    st.fullName?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.email?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    st.phone?.includes(studentSearch)
  );

  const calculateAverage = () => {
    const total = Number(attendanceScore) + Number(effortScore) + Number(techniqueScore);
    return (total / 3).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-5xl overflow-hidden shadow-[var(--shadow)] flex flex-col max-h-[92vh]">

        {/* ================= MODAL HEADER ================= */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-hover)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] tracking-tight">
                  Đánh Giá Tiến Độ & Nhận Xét Học Viên
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                  Coach Portal
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Chọn lớp học, xem danh sách học viên và ghi nhận xét tiến độ tập luyện, điểm kỹ thuật & thể lực
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

        {/* Alert Banner */}
        {banner && (
          <div className={`mx-6 mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-fade-in shrink-0 ${
            banner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{banner.message}</span>
            <button onClick={() => setBanner(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= STEP 1: CLASS SELECTOR BAR ================= */}
        <div className="px-6 py-3.5 bg-[var(--surface-hover)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider shrink-0">
              Chọn Lớp Học:
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              disabled={loadingClasses}
              className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-xs font-semibold text-[var(--text)] focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              {classes.length === 0 ? (
                <option value="">-- Chưa có lớp học nào --</option>
              ) : (
                classes.map(cls => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className} ({cls.enrolledCount} học viên | Phòng: {cls.roomName})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Sĩ số: <strong className="text-[var(--text)]">{classStudents.length} học viên</strong></span>
          </div>
        </div>

        {/* ================= MAIN SPLIT CONTENT: TRAINEES LIST (35%) | EVALUATION PANE (65%) ================= */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]">

          {/* LEFT COLUMN: TRAINEES ROSTER (Col-span 4) */}
          <div className="md:col-span-4 border-r border-[var(--border)] flex flex-col bg-[var(--surface)] overflow-hidden">
            <div className="p-3.5 border-b border-[var(--border)]">
              <div className="relative">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm học viên trong lớp..."
                  className="w-full bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-none">
              {loadingStudents ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Đang tải danh sách học viên...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center">
                  <Users className="w-8 h-8 opacity-40 mb-2" />
                  <span>Không tìm thấy học viên nào trong lớp này.</span>
                </div>
              ) : (
                filteredStudents.map(st => {
                  const isSelected = selectedStudent?.userId === st.userId;
                  const initials = st.fullName
                    ? st.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'HV';

                  return (
                    <div
                      key={st.userId}
                      onClick={() => {
                        setSelectedStudent(st);
                        setActiveTab('form');
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                          : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                            : 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft)]'
                        }`}>
                          {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-[var(--text)]'}`}>
                            {st.fullName}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate">
                            {st.email || st.phone || `ID: #${st.userId}`}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-[var(--text-muted)]'}`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: EVALUATION FORM & HISTORY (Col-span 8) */}
          <div className="md:col-span-8 flex flex-col bg-[var(--surface)] overflow-hidden">
            {!selectedStudent ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
                <User className="w-12 h-12 opacity-30 mb-3 text-amber-400" />
                <h4 className="text-sm font-bold text-[var(--text)]">Chưa chọn học viên</h4>
                <p className="text-xs mt-1 max-w-sm">
                  Hãy bấm chọn 1 học viên từ danh sách bên trái để tiến hành đánh giá tiến độ và ghi lời nhận xét.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">

                {/* Subheader: Selected Student Profile & Tabs */}
                <div className="p-4 bg-[var(--surface-hover)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-extrabold text-xs flex items-center justify-center">
                      {selectedStudent.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[var(--text)] flex items-center gap-2">
                        <span>{selectedStudent.fullName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] font-normal">
                          Mã #{selectedStudent.userId}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {selectedStudent.email} {selectedStudent.phone ? `• ${selectedStudent.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('form')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeTab === 'form'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Đánh Giá Mới</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('history')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeTab === 'history'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Lịch Sử ({evaluationsHistory.length})</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: FORM ĐÁNH GIÁ */}
                {activeTab === 'form' && (
                  <form onSubmit={handleSubmitEvaluation} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-none text-xs">

                    {/* 1. Loại đánh giá & Điểm tổng quan */}
                    <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px]">
                          Kỳ Đánh Giá:
                        </label>
                        <div className="flex items-center gap-2">
                          {[
                            { key: 'PER_SESSION', label: 'Theo Buổi Học' },
                            { key: 'WEEKLY', label: 'Hàng Tuần' },
                            { key: 'MONTHLY', label: 'Hàng Tháng / Định Kỳ' }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setEvaluationType(opt.key)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                evaluationType === opt.key
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 2. Điểm số đánh giá (Thang 1-10) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                        <h5 className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-400" />
                          Chấm Điểm Năng Lực (Thang Điểm 1 - 10)
                        </h5>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-[var(--text-muted)]">Điểm trung bình:</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                            {calculateAverage()} / 10
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Attendance Score */}
                        <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text)] text-[11px]">1. Chuyên cần</span>
                            <span className="text-sm font-extrabold text-blue-400">{attendanceScore}/10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={attendanceScore}
                            onChange={(e) => setAttendanceScore(e.target.value)}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-[var(--text-muted)]">Mức độ tham gia đầy đủ và đúng giờ</p>
                        </div>

                        {/* Effort Score */}
                        <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text)] text-[11px]">2. Thái độ & Nỗ lực</span>
                            <span className="text-sm font-extrabold text-emerald-400">{effortScore}/10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={effortScore}
                            onChange={(e) => setEffortScore(e.target.value)}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-[var(--text-muted)]">Sự tập trung và tinh thần vượt khó</p>
                        </div>

                        {/* Technique Score */}
                        <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text)] text-[11px]">3. Kỹ thuật động tác</span>
                            <span className="text-sm font-extrabold text-purple-400">{techniqueScore}/10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={techniqueScore}
                            onChange={(e) => setTechniqueScore(e.target.value)}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                          <p className="text-[10px] text-[var(--text-muted)]">Độ chuẩn xác về form dáng và biên độ</p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Lời nhận xét chi tiết & Lời khuyên */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                          <span>Nhận Xét Chi Tiết Của HLV <span className="text-rose-500">*</span></span>
                          <span className="text-[10px] text-[var(--text-muted)] font-normal">Hiển thị trong hồ sơ học viên</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={coachComment}
                          onChange={(e) => setCoachComment(e.target.value)}
                          placeholder="VD: Học viên tiếp thu nhanh, thể lực cải thiện tốt qua từng tuần. Kỹ thuật squat đã xuống sâu và lưng thẳng hơn..."
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 leading-relaxed"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                          <span>Lời Khuyên & Kế Hoạch Tuần Tới (Tùy chọn)</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-normal">Định hướng rèn luyện</span>
                        </label>
                        <textarea
                          rows={2}
                          value={recommendations}
                          onChange={(e) => setRecommendations(e.target.value)}
                          placeholder="VD: Tuần tới tăng mức tạ lên 5%, chú ý khởi động kỹ cổ chân và uống đủ 2.5 lít nước mỗi ngày..."
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* 4. Theo dõi chỉ số thể chất (Body Metrics - Collapsible) */}
                    <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowBodyMetrics(!showBodyMetrics)}>
                        <div className="flex items-center gap-2">
                          <HeartPulse className="w-4 h-4 text-rose-400" />
                          <span className="font-bold text-[var(--text)] text-xs">Cập nhật chỉ số cơ thể học viên (Tùy chọn)</span>
                        </div>
                        <span className="text-xs text-amber-400 hover:underline font-semibold">
                          {showBodyMetrics ? 'Thu gọn' : '+ Nhập số đo cơ thể'}
                        </span>
                      </div>

                      {showBodyMetrics && (
                        <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in border-t border-[var(--border)]">
                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)] font-bold">Cân nặng (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="VD: 68.5"
                              value={weightKg}
                              onChange={(e) => setWeightKg(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)] font-bold">Chiều cao (cm)</label>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="VD: 172"
                              value={heightCm}
                              onChange={(e) => setHeightCm(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)] font-bold">Tỷ lệ mỡ (% Body Fat)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="VD: 18.5"
                              value={bodyFatPct}
                              onChange={(e) => setBodyFatPct(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)] font-bold">Lượng cơ (kg Muscle)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="VD: 32.0"
                              value={muscleMassKg}
                              onChange={(e) => setMuscleMassKg(e.target.value)}
                              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Bar */}
                    <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Hệ thống sẽ đồng thời gửi thông báo đến tài khoản học viên.</span>
                      </span>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4" />
                            <span>Xác Nhận Lưu Đánh Giá</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* TAB 2: LỊCH SỬ ĐÁNH GIÁ CỦA HỌC VIÊN */}
                {activeTab === 'history' && (
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-none text-xs">
                    {loadingHistory ? (
                      <div className="py-12 text-center text-[var(--text-muted)]">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                        Đang tải lịch sử đánh giá...
                      </div>
                    ) : evaluationsHistory.length === 0 ? (
                      <div className="py-16 text-center text-[var(--text-muted)] flex flex-col items-center">
                        <Award className="w-10 h-10 opacity-30 mb-2 text-amber-400" />
                        <h5 className="font-bold text-[var(--text)]">Chưa có bản ghi đánh giá nào</h5>
                        <p className="text-xs mt-1">Hãy chuyển sang tab "Đánh Giá Mới" để viết nhận xét đầu tiên cho học viên này.</p>
                      </div>
                    ) : (
                      evaluationsHistory.map(item => (
                        <div
                          key={item.evaluationId}
                          className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] hover:border-slate-600 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--text)]">
                                  {item.evaluationType === 'PER_SESSION' ? 'Đánh Giá Buổi Học' : item.evaluationType === 'WEEKLY' ? 'Đánh Giá Hàng Tuần' : 'Đánh Giá Định Kỳ'}
                                </span>
                                {item.className && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold text-[10px] border border-blue-500/20">
                                    Lớp: {item.className}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {item.averageScore != null && (
                                <div className="text-right">
                                  <span className="text-[10px] text-[var(--text-muted)] block">Điểm TB</span>
                                  <span className="text-sm font-extrabold text-amber-400">{item.averageScore}/10</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleDeleteEvaluation(item.evaluationId)}
                                title="Xóa đánh giá này"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Scores row */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px]">
                            {item.attendanceScore != null && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-blue-400 font-semibold">
                                Chuyên cần: {item.attendanceScore}/10
                              </span>
                            )}
                            {item.effortScore != null && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-emerald-400 font-semibold">
                                Nỗ lực: {item.effortScore}/10
                              </span>
                            )}
                            {item.techniqueScore != null && (
                              <span className="px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-purple-400 font-semibold">
                                Kỹ thuật: {item.techniqueScore}/10
                              </span>
                            )}
                          </div>

                          {/* Comment */}
                          <div className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)]">
                            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase mb-1">Lời nhận xét của HLV:</p>
                            <p className="text-xs text-[var(--text)] italic leading-relaxed">"{item.coachComment}"</p>
                          </div>

                          {/* Recommendations */}
                          {item.recommendations && (
                            <div className="text-xs text-[var(--text)] flex items-start gap-1.5 pt-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span><strong>Lời khuyên:</strong> {item.recommendations}</span>
                            </div>
                          )}

                          {/* Body metrics summary if present */}
                          {(item.weightKg || item.heightCm || item.bodyFatPct) && (
                            <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-3 text-[10px] text-[var(--text-muted)]">
                              <span className="font-semibold text-rose-400">Chỉ số đo:</span>
                              {item.weightKg && <span>Cân nặng: <strong className="text-[var(--text)]">{item.weightKg} kg</strong></span>}
                              {item.heightCm && <span>Chiều cao: <strong className="text-[var(--text)]">{item.heightCm} cm</strong></span>}
                              {item.bodyFatPct && <span>Mỡ cơ thể: <strong className="text-[var(--text)]">{item.bodyFatPct}%</strong></span>}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentEvaluationModal;
