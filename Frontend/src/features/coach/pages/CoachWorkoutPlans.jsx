import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dumbbell, Users, Plus, Trash2, Send, CheckCircle2, AlertCircle,
  Clock, Play, ShieldAlert, Sparkles, Filter, RefreshCw, X, ChevronRight, BookOpen, Layers
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/coach';

const CoachWorkoutPlans = () => {
  // Main Data States
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedPlans, setAssignedPlans] = useState([]);

  // UI Loading & Filter States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'history'
  const [notificationBanner, setNotificationBanner] = useState(null); // { type: 'success'|'error', message: '' }
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  // Form State for Assigning Workout Plan
  const [targetType, setTargetType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'CLASS'
  const [selectedStudentUserId, setSelectedStudentUserId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([
    { exerciseId: '', sets: 3, reps: 12, restSeconds: 60 }
  ]);

  // Modal State for Adding New Exercise to Library
  const [isAddExModalOpen, setIsAddExModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscleGroup, setNewExMuscleGroup] = useState('Chest (Ngực)');
  const [newExVideoUrl, setNewExVideoUrl] = useState('');

  // History Filter
  const [historyFilterStudent, setHistoryFilterStudent] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();

      const [exRes, stRes, clRes, plRes] = await Promise.all([
        axios.get(`${API_BASE}/exercises`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/students`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/classes`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/workouts`, { headers }).catch(() => ({ data: [] }))
      ]);

      setExercises(exRes.data || []);
      setStudents(stRes.data || []);
      setClasses(clRes.data || []);
      setAssignedPlans(plRes.data || []);

      // Auto pick first exercise if available
      if (exRes.data && exRes.data.length > 0 && selectedExercises.length === 1 && !selectedExercises[0].exerciseId) {
        setSelectedExercises([{ exerciseId: exRes.data[0].exerciseId, sets: 3, reps: 12, restSeconds: 60 }]);
      }
    } catch (error) {
      console.error('Error loading coach workout data:', error);
      showBanner('error', 'Không thể tải dữ liệu giáo án bài tập.');
    } finally {
      setLoading(false);
    }
  };

  const showBanner = (type, message) => {
    setNotificationBanner({ type, message });
    setTimeout(() => {
      setNotificationBanner(null);
    }, 6000);
  };

  // Add exercise row in form
  const handleAddExerciseRow = () => {
    const defaultExId = exercises.length > 0 ? exercises[0].exerciseId : '';
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: defaultExId, sets: 3, reps: 10, restSeconds: 60 }
    ]);
  };

  // Remove exercise row
  const handleRemoveExerciseRow = (index) => {
    if (selectedExercises.length === 1) {
      showBanner('error', 'Giáo án phải có ít nhất 1 bài tập.');
      return;
    }
    const updated = selectedExercises.filter((_, idx) => idx !== index);
    setSelectedExercises(updated);
  };

  // Update row detail
  const handleUpdateExerciseRow = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedExercises(updated);
  };

  // Submit Workout Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    if (!planTitle.trim()) {
      showBanner('error', 'Vui lòng nhập tiêu đề giáo án bài tập.');
      return;
    }

    if (targetType === 'INDIVIDUAL' && !selectedStudentUserId) {
      showBanner('error', 'Vui lòng chọn 1 học viên để giao bài.');
      return;
    }

    if (targetType === 'CLASS' && !selectedClassId) {
      showBanner('error', 'Vui lòng chọn 1 lớp học để giao bài cho toàn bộ lớp.');
      return;
    }

    // Validate exercises
    for (let i = 0; i < selectedExercises.length; i++) {
      if (!selectedExercises[i].exerciseId) {
        showBanner('error', `Vui lòng chọn bài tập cho dòng số ${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        targetType,
        studentUserId: targetType === 'INDIVIDUAL' ? parseInt(selectedStudentUserId) : null,
        classId: targetType === 'CLASS' ? parseInt(selectedClassId) : null,
        title: planTitle.trim(),
        note: planNote.trim(),
        exerciseDetails: selectedExercises.map(ex => ({
          exerciseId: parseInt(ex.exerciseId),
          sets: parseInt(ex.sets) || 3,
          reps: parseInt(ex.reps) || 10,
          restSeconds: parseInt(ex.restSeconds) || 60
        }))
      };

      const res = await axios.post(`${API_BASE}/workouts/assign`, payload, { headers: getHeaders() });

      showBanner('success', res.data?.message || 'Giao bài tập và gửi thông báo thành công!');

      // Reset form
      setPlanTitle('');
      setPlanNote('');
      setSelectedStudentUserId('');
      setSelectedClassId('');

      // Refresh list
      const plRes = await axios.get(`${API_BASE}/workouts`, { headers: getHeaders() });
      setAssignedPlans(plRes.data || []);
      setActiveTab('history');
    } catch (error) {
      console.error('Error assigning workout:', error);
      const errMsg = error.response?.data?.message || error.response?.data || 'Có lỗi xảy ra khi giao bài tập.';
      showBanner('error', typeof errMsg === 'string' ? errMsg : 'Có lỗi xảy ra khi giao bài tập.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create new Exercise in Library
  const handleCreateNewExercise = async (e) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    try {
      const res = await axios.post(`${API_BASE}/exercises`, {
        exerciseName: newExName.trim(),
        muscleGroup: newExMuscleGroup.trim(),
        videoUrl: newExVideoUrl.trim()
      }, { headers: getHeaders() });

      setExercises([...exercises, res.data]);
      showBanner('success', `Đã thêm bài tập "${res.data.exerciseName}" vào thư viện!`);
      setNewExName('');
      setNewExVideoUrl('');
      setIsAddExModalOpen(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
      showBanner('error', 'Không thể tạo bài tập mới.');
    }
  };

  // Delete plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa giáo án đã giao này không?')) return;

    try {
      await axios.delete(`${API_BASE}/workouts/${planId}`, { headers: getHeaders() });
      setAssignedPlans(assignedPlans.filter(p => p.planId !== planId));
      showBanner('success', 'Đã xóa giáo án thành công.');
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      showBanner('error', 'Không thể xóa giáo án.');
    }
  };

  // Filtered assigned plans
  const filteredPlans = assignedPlans.filter(plan => {
    if (!historyFilterStudent) return true;
    return plan.userId === parseInt(historyFilterStudent);
  });

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-[var(--primary)] font-semibold text-[11px] uppercase tracking-wider">
            <span>Coach Portal</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[var(--text-muted)]">Workout Management</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] tracking-tight flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-[var(--primary)]" />
            Giao Bài Tập Cho Học Viên
          </h1>
          <p className="text-sm text-[var(--text-muted)] max-w-3xl">
            Tạo và giao bài tập tùy chỉnh cho <strong>cá nhân 1 học viên</strong> hoặc <strong>toàn bộ học viên của một lớp</strong>. Hệ thống sẽ tự động gửi thông báo cho học viên ngay sau khi giao bài.
          </p>
        </div>

        {/* Quick Action to Add Exercise */}
        <button
          onClick={() => setIsAddExModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text)] font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[var(--primary)]" />
          <span>Thêm Bài Tập Mới Vao Thư Viện</span>
        </button>
      </div>

      {/* Global Notification Banner */}
      {notificationBanner && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold shadow-md animate-fade-in ${
          notificationBanner.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {notificationBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{notificationBanner.message}</span>
          <button onClick={() => setNotificationBanner(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Tổng Giáo Án Đã Giao</span>
            <span className="text-2xl font-bold text-[var(--text)]">{assignedPlans.length} <span className="text-xs text-[var(--text-muted)] font-normal">bài tập</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Học Viên Quản Lý</span>
            <span className="text-2xl font-bold text-[var(--text)]">{students.length} <span className="text-xs text-[var(--text-muted)] font-normal">học viên</span></span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-4 shadow-[var(--shadow)]">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Thư Viện Bài Tập</span>
            <span className="text-2xl font-bold text-[var(--text)]">{exercises.length} <span className="text-xs text-[var(--text-muted)] font-normal">động tác</span></span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('assign')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'assign'
              ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Giao Bài Tập Mới</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Lịch Sử Giáo Án Đã Giao ({assignedPlans.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: FORM GIAO BÀI TẬP ===================== */}
      {activeTab === 'assign' && (
        <form onSubmit={handleAssignSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow)] space-y-8">
          
          {/* Section 1: Đối tượng giao bài */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-base font-bold text-[var(--text)]">Chọn Phạm Vi Giao Bài</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Cá nhân */}
              <div
                onClick={() => setTargetType('INDIVIDUAL')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  targetType === 'INDIVIDUAL'
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-slate-600'
                }`}
              >
                <div className={`p-3 rounded-xl ${targetType === 'INDIVIDUAL' ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">1. Giao bài cho 1 Cá nhân</span>
                    {targetType === 'INDIVIDUAL' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Chọn chính xác 1 học viên để gửi giáo án huấn luyện riêng biệt.
                  </p>
                </div>
              </div>

              {/* Option 2: Toàn bộ lớp */}
              <div
                onClick={() => setTargetType('CLASS')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  targetType === 'CLASS'
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-slate-600'
                }`}
              >
                <div className={`p-3 rounded-xl ${targetType === 'CLASS' ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">2. Giao bài cho Toàn Lớp</span>
                    {targetType === 'CLASS' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Tự động tạo giáo án & gửi thông báo cho tất cả học viên trong lớp được chọn.
                  </p>
                </div>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="pt-2">
              {targetType === 'INDIVIDUAL' ? (
                <div className="space-y-1.5 max-w-xl">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Chọn Học Viên Nhận Bài Tập <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentUserId}
                    onChange={(e) => setSelectedStudentUserId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">-- Chọn danh sách học viên ({students.length}) --</option>
                    {students.map((st) => (
                      <option key={st.userId} value={st.userId}>
                        {st.fullName} ({st.email || st.phone || `ID: #${st.userId}`})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5 max-w-xl">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Chọn Lớp Học <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">-- Chọn lớp học bạn đang phụ trách ({classes.length}) --</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        Lớp: {cls.className} ({cls.enrolledCount} học viên đã tham gia)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Thông tin giáo án */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="text-base font-bold text-[var(--text)]">Thông Tin & Hướng Dẫn Giáo Án</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Tiêu Đề Giáo Án <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="VD: Giáo án Tăng Cơ Ngực - Tuần 1"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Ghi Chú / Lời Nhắn HLV (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={planNote}
                  onChange={(e) => setPlanNote(e.target.value)}
                  placeholder="VD: Nghỉ đúng thời gian chỉ định, chú ý uống đủ nước..."
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Danh sách bài tập */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="text-base font-bold text-[var(--text)]">Chi Tiết Các Động Tác Tập Luyện</h3>
              </div>

              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="px-3 py-1.5 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center gap-1.5 border border-[var(--primary-soft)] hover:bg-[var(--primary)] hover:text-[color:var(--on-primary)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Động Tác</span>
              </button>
            </div>

            <div className="space-y-3">
              {selectedExercises.map((exRow, idx) => {
                const currentExObj = exercises.find(e => e.exerciseId === parseInt(exRow.exerciseId));

                return (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-slate-600 transition-all flex flex-col md:flex-row md:items-center gap-4">
                    <span className="w-7 h-7 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Exercise Select */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Tên Động Tác</label>
                      <select
                        value={exRow.exerciseId}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'exerciseId', e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                      >
                        <option value="">-- Chọn bài tập từ thư viện --</option>
                        {exercises.map((ex) => (
                          <option key={ex.exerciseId} value={ex.exerciseId}>
                            {ex.exerciseName} [{ex.muscleGroup || 'Chung'}]
                          </option>
                        ))}
                      </select>
                      {currentExObj && currentExObj.videoUrl && (
                        <a href={currentExObj.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                          <Play className="w-3 h-3" /> Xem video hướng dẫn mẫu
                        </a>
                      )}
                    </div>

                    {/* Sets */}
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Số Hiệp (Sets)</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={exRow.sets}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'sets', e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    {/* Reps */}
                    <div className="w-28 space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Số Lần/Hiệp (Reps)</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={exRow.reps}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'reps', e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    {/* Rest Seconds */}
                    <div className="w-28 space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Nghỉ (Giây)</label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        max="600"
                        value={exRow.restSeconds}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'restSeconds', e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    {/* Delete button */}
                    <div className="pt-4 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(idx)}
                        title="Xóa dòng động tác"
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldAlert className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>Nhấn gửi sẽ đồng thời tạo thông báo đẩy tới tài khoản của học viên.</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[color:var(--on-primary)] font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  <span>Đang xử lý & Gửi...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Xác Nhận Gửi Giáo Án & Thông Báo</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ===================== TAB 2: LỊCH SỬ BÀI TẬP ĐÃ GIAO ===================== */}
      {activeTab === 'history' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)] space-y-6">
          
          {/* Header Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-[var(--text-muted)]" />
              <select
                value={historyFilterStudent}
                onChange={(e) => setHistoryFilterStudent(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="">Tất cả học viên ({assignedPlans.length} giáo án)</option>
                {students.map((st) => (
                  <option key={st.userId} value={st.userId}>
                    Học viên: {st.fullName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchInitialData}
              className="px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs flex items-center gap-1.5 border border-[var(--border)]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới danh sách</span>
            </button>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="text-center py-16 text-[var(--text-muted)]">Đang tải danh sách giáo án...</div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell className="w-12 h-12 text-[var(--text-muted)] mb-3" />
              <h4 className="text-base font-bold text-[var(--text)]">Chưa Có Giáo Án Nào Được Giao</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Hãy chuyển sang tab "Giao Bài Tập Mới" để bắt đầu soạn bài cho học viên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlans.map((plan) => (
                <div key={plan.planId} className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] hover:border-slate-600 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-sm text-[var(--text)]">{plan.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold border border-[var(--primary-soft)] shrink-0">
                        {plan.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                        Học viên: <strong className="text-[var(--text)]">{plan.studentName}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        {new Date(plan.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {plan.note && (
                      <p className="text-xs text-[var(--text-muted)] italic bg-[var(--surface-hover)] p-2.5 rounded-xl border border-[var(--border)]">
                        "{plan.note}"
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Số động tác: <strong className="text-[var(--text)]">{plan.details?.length || 0} bài</strong></span>
                      <button
                        onClick={() => setSelectedPlanDetail(plan)}
                        className="text-xs text-[var(--primary)] hover:underline font-bold flex items-center gap-1"
                      >
                        Chi tiết giáo án <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleDeletePlan(plan.planId)}
                        className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] border border-rose-500/20 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL 1: CHI TIẾT GIÁO ÁN ===================== */}
      {selectedPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-xl overflow-hidden shadow-[var(--shadow)] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] font-bold">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-[var(--text)]">{selectedPlanDetail.title}</h3>
                  <span className="text-xs text-[var(--primary)] font-medium">Giao cho: {selectedPlanDetail.studentName}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              {selectedPlanDetail.note && (
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] italic">
                  <strong>Ghi chú HLV:</strong> {selectedPlanDetail.note}
                </div>
              )}

              <div className="space-y-2">
                <h5 className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Danh sách bài tập ({selectedPlanDetail.details?.length || 0})</h5>
                <div className="space-y-2">
                  {selectedPlanDetail.details?.map((d, dIdx) => (
                    <div key={dIdx} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                          #{dIdx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-[var(--text)]">{d.exerciseName}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">Nhóm cơ: {d.muscleGroup || 'Chung'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] font-semibold text-[11px]">
                          {d.sets} Hiệp x {d.reps} Lần
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">Nghỉ {d.restSeconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] font-semibold text-xs border border-[var(--border)]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: THÊM BÀI TẬP VÀO THƯ VIỆN ===================== */}
      {isAddExModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-[var(--shadow)] flex flex-col">
            <form onSubmit={handleCreateNewExercise}>
              <div className="p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text)]">Thêm Động Tác Mới</h3>
                    <p className="text-xs text-[var(--text-muted)]">Thêm vào thư viện để sử dụng lại nhiều lần</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddExModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Tên Bài Tập <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder="VD: Bench Press, Plank, Deadlift..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Nhóm Cơ Tác Động</label>
                  <select
                    value={newExMuscleGroup}
                    onChange={(e) => setNewExMuscleGroup(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Chest (Ngực)">Chest (Ngực)</option>
                    <option value="Back (Lưng/Xô)">Back (Lưng/Xô)</option>
                    <option value="Legs (Đùi/Bắp chân)">Legs (Đùi/Bắp chân)</option>
                    <option value="Shoulders (Vai)">Shoulders (Vai)</option>
                    <option value="Arms (Tay trước/Tay sau)">Arms (Tay trước/Tay sau)</option>
                    <option value="Abs (Bụng/Core)">Abs (Bụng/Core)</option>
                    <option value="Cardio / Toàn thân">Cardio / Toàn thân</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">Link Video Youtube Mẫu (Tùy chọn)</label>
                  <input
                    type="url"
                    value={newExVideoUrl}
                    onChange={(e) => setNewExVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddExModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] font-bold text-xs shadow-md"
                >
                  Lưu Vào Thư Viện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachWorkoutPlans;
