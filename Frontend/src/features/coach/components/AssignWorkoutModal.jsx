import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dumbbell, X, Users, School, User, CheckCircle2, AlertCircle, Loader2, Plus, Trash2, Layers, BookOpen, Clock, Repeat, Minus
} from 'lucide-react';

const AssignWorkoutModal = ({
  isOpen,
  onClose,
  initialTargetType = 'ALL',
  initialStudent = null,
  initialClassId = null,
  onSuccess
}) => {
  const [targetType, setTargetType] = useState(initialTargetType);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudent ? (typeof initialStudent === 'object' ? initialStudent.userId : initialStudent) : '');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);

  // List of selected exercises in the workout plan
  const [selectedExercises, setSelectedExercises] = useState([]);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTargetType(initialTargetType);
      const studentId = initialStudent ? (typeof initialStudent === 'object' ? initialStudent.userId : initialStudent) : '';
      const classId = initialClassId || '';

      setSelectedClassId(classId);
      setSelectedStudentId(studentId);
      setTitle('');
      setNote('');
      setErrorMsg('');
      setSuccessMsg('');
      fetchModalData(classId, studentId);
    }
  }, [isOpen, initialTargetType, initialStudent, initialClassId]);

  const fetchModalData = async (currentClassId, currentStudentId) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [classRes, studentRes, exerciseRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/coach/classes', { headers }),
        axios.get('http://localhost:8080/api/v1/coach/students', { headers }),
        axios.get('http://localhost:8080/api/v1/coach/exercises', { headers })
      ]);

      const fetchedClasses = classRes.data || [];
      const fetchedStudents = studentRes.data || [];
      const fetchedExercises = exerciseRes.data || [];

      setClasses(fetchedClasses);
      setStudents(fetchedStudents);
      setAvailableExercises(fetchedExercises);

      if (fetchedClasses.length > 0 && !currentClassId) {
        setSelectedClassId(fetchedClasses[0].classId);
      }
      if (fetchedStudents.length > 0 && !currentStudentId) {
        setSelectedStudentId(fetchedStudents[0].userId);
      }

      // Default with first 2 exercises if available
      if (fetchedExercises.length > 0) {
        setSelectedExercises([
          { exerciseId: fetchedExercises[0].exerciseId, sets: 4, reps: 12, restSeconds: 60 },
          ...(fetchedExercises.length > 1 ? [{ exerciseId: fetchedExercises[1].exerciseId, sets: 3, reps: 15, restSeconds: 45 }] : [])
        ]);
      } else {
        setSelectedExercises([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu cho modal giao bài tập:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleAddExerciseRow = () => {
    if (availableExercises.length === 0) return;
    const defaultEx = availableExercises[0];
    setSelectedExercises(prev => [
      ...prev,
      { exerciseId: defaultEx.exerciseId, sets: 3, reps: 10, restSeconds: 60 }
    ]);
  };

  const handleRemoveExerciseRow = (index) => {
    setSelectedExercises(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setSelectedExercises(prev => {
      const updated = [...prev];
      let parsedVal = value;
      if (field === 'exerciseId') {
        parsedVal = Number(value);
      } else {
        if (value === '') {
          parsedVal = '';
        } else {
          // Keep digits only
          const cleanStr = value.replace(/[^0-9]/g, '');
          parsedVal = cleanStr === '' ? '' : Number(cleanStr);
        }
      }
      updated[index] = { ...updated[index], [field]: parsedVal };
      return updated;
    });
  };

  const handleIncrement = (index, field, step = 1, max = 999) => {
    setSelectedExercises(prev => {
      const updated = [...prev];
      const currentVal = Number(updated[index][field]) || 0;
      updated[index] = { ...updated[index], [field]: Math.min(max, currentVal + step) };
      return updated;
    });
  };

  const handleDecrement = (index, field, step = 1, min = 0) => {
    setSelectedExercises(prev => {
      const updated = [...prev];
      const currentVal = Number(updated[index][field]) || 0;
      updated[index] = { ...updated[index], [field]: Math.max(min, currentVal - step) };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên/tiêu đề lộ trình bài tập.');
      return;
    }
    if (selectedExercises.length === 0) {
      setErrorMsg('Vui lòng thêm ít nhất 1 bài tập trong lộ trình.');
      return;
    }
    if (targetType === 'CLASS' && !selectedClassId) {
      setErrorMsg('Vui lòng chọn lớp học.');
      return;
    }
    if (targetType === 'INDIVIDUAL' && !selectedStudentId) {
      setErrorMsg('Vui lòng chọn học viên.');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const payload = {
        targetType,
        classId: targetType === 'CLASS' ? Number(selectedClassId) : null,
        recipientUserId: targetType === 'INDIVIDUAL' ? Number(selectedStudentId) : null,
        title: title.trim(),
        note: note.trim(),
        exercises: selectedExercises.map(ex => ({
          exerciseId: Number(ex.exerciseId),
          sets: Number(ex.sets) > 0 ? Number(ex.sets) : 3,
          reps: Number(ex.reps) > 0 ? Number(ex.reps) : 10,
          restSeconds: Number(ex.restSeconds) >= 0 ? Number(ex.restSeconds) : 60
        }))
      };

      const response = await axios.post(
        'http://localhost:8080/api/v1/coach/workouts/assign',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(response.data?.message || 'Giao bài tập thành công!');

      setTimeout(() => {
        setTitle('');
        setNote('');
        setSuccessMsg('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi giao bài tập:', err);
      const serverErr = err.response?.data?.message || err.response?.data || 'Không thể giao bài tập. Vui lòng thử lại sau.';
      setErrorMsg(typeof serverErr === 'string' ? serverErr : 'Đã có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRecipientSummary = () => {
    if (targetType === 'ALL') {
      return `Giao bài tập chung cho toàn bộ ${students.length} học viên của bạn.`;
    }
    if (targetType === 'CLASS') {
      const cls = classes.find(c => String(c.classId) === String(selectedClassId));
      return cls ? `Giao bài tập tới ${cls.enrolledCount} học viên đăng ký lớp "${cls.className}".` : 'Giao cho lớp được chọn.';
    }
    if (targetType === 'INDIVIDUAL') {
      const st = students.find(s => String(s.userId) === String(selectedStudentId));
      return st ? `Giao bài tập riêng cho học viên ${st.fullName} (${st.email || 'No email'}).` : 'Giao cho 1 học viên cụ thể.';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#091124] border border-[#1b2b4f] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto">

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b1326] via-[#111d38] to-[#0e172a] border-b border-[#1b2b4f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">Giao Bài Tập Cho Học Viên</h3>
              <p className="text-[11px] text-slate-400 truncate">Tạo lộ trình & phân công bài tập luyện rèn cho học viên</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#111d38] text-slate-400 hover:text-white hover:bg-[#1a2947] flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Recipient Scope Selection */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
              1. Phạm vi giao bài tập
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'ALL'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-[#0e172a] border-[#1a2947] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span className="text-center text-[10px] sm:text-[11px] truncate w-full">Tất cả học viên</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('CLASS')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'CLASS'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-[#0e172a] border-[#1a2947] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-center text-[10px] sm:text-[11px] truncate w-full">Theo lớp học</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('INDIVIDUAL')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'INDIVIDUAL'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10'
                  : 'bg-[#0e172a] border-[#1a2947] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-center text-[10px] sm:text-[11px] truncate w-full">Học viên cá nhân</span>
              </button>
            </div>
          </div>

          {/* Conditional Input: Select Class */}
          {targetType === 'CLASS' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-slate-400 font-semibold">Chọn lớp học:</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {classes.length === 0 ? (
                  <option value="">-- Chưa có lớp học nào --</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className} ({cls.enrolledCount} học viên | Phòng: {cls.roomName})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Conditional Input: Select Individual Student */}
          {targetType === 'INDIVIDUAL' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-slate-400 font-semibold">Chọn học viên nhận bài tập:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {students.length === 0 ? (
                  <option value="">-- Chưa có học viên nào --</option>
                ) : (
                  students.map((st) => (
                    <option key={st.userId} value={st.userId}>
                      {st.fullName} - {st.email || st.phone || `ID #${st.userId}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* 2. Workout Plan Title & Note */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                2. Tên lộ trình bài tập <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Lộ trình Tăng cơ Ngực & Đùi Tuần 1 / Bài tập Thể lực Buổi sáng..."
                className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Ghi chú / Dặn dò của Huấn luyện viên
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập dặn dò về nhịp thở, tư thế hoặc lịch tập trong tuần..."
                className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* 3. List of Exercises */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                3. Danh sách các bài tập ({selectedExercises.length})
              </label>
              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm bài tập</span>
              </button>
            </div>

            {selectedExercises.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0e172a] border border-dashed border-[#1a2947] text-center text-slate-500 text-xs">
                Chưa có bài tập nào trong lộ trình. Nhấp nút "Thêm bài tập" ở trên.
              </div>
            ) : (
              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                {selectedExercises.map((exItem, index) => {
                  const selectedExObj = availableExercises.find(e => Number(e.exerciseId) === Number(exItem.exerciseId));

                  return (
                    <div key={index} className="p-3.5 rounded-xl bg-[#0e172a] border border-[#1b2b4f] flex flex-col gap-3 transition-all hover:border-emerald-500/30">

                      {/* Exercise Selection Dropdown Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <select
                            value={exItem.exerciseId}
                            onChange={(e) => handleExerciseChange(index, 'exerciseId', e.target.value)}
                            className="w-full bg-[#091124] border border-[#1a2947] rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 truncate"
                          >
                            {availableExercises.map((ex) => (
                              <option key={ex.exerciseId} value={ex.exerciseId}>
                                💪 {ex.exerciseName} ({ex.muscleGroup || 'Tổng hợp'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseRow(index)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                          title="Xóa bài tập này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {selectedExObj?.videoUrl && (
                        <div className="text-[10px] text-blue-400 truncate">
                          🔗 Video mẫu: {selectedExObj.videoUrl}
                        </div>
                      )}

                      {/* Custom Stepper Controls (Sets, Reps, RestSeconds) */}
                      <div className="grid grid-cols-3 gap-2 bg-[#091124] p-2 rounded-xl border border-[#1a2947]">

                        {/* 1. SETS Stepper */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                            <Repeat className="w-3 h-3 text-emerald-400" /> Sets
                          </span>
                          <div className="flex items-center bg-[#0e172a] border border-[#1b2b4f] rounded-lg overflow-hidden w-full max-w-[110px]">
                            <button
                              type="button"
                              onClick={() => handleDecrement(index, 'sets', 1, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={exItem.sets}
                              onChange={(e) => handleExerciseChange(index, 'sets', e.target.value)}
                              className="w-full text-center text-xs font-bold text-emerald-400 bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleIncrement(index, 'sets', 1, 99)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* 2. REPS Stepper */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-blue-400" /> Reps
                          </span>
                          <div className="flex items-center bg-[#0e172a] border border-[#1b2b4f] rounded-lg overflow-hidden w-full max-w-[110px]">
                            <button
                              type="button"
                              onClick={() => handleDecrement(index, 'reps', 1, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={exItem.reps}
                              onChange={(e) => handleExerciseChange(index, 'reps', e.target.value)}
                              className="w-full text-center text-xs font-bold text-blue-400 bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleIncrement(index, 'reps', 1, 999)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* 3. REST SECONDS Stepper */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" /> nghỉ (s)
                          </span>
                          <div className="flex items-center bg-[#0e172a] border border-[#1b2b4f] rounded-lg overflow-hidden w-full max-w-[110px]">
                            <button
                              type="button"
                              onClick={() => handleDecrement(index, 'restSeconds', 15, 0)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={exItem.restSeconds}
                              onChange={(e) => handleExerciseChange(index, 'restSeconds', e.target.value)}
                              className="w-full text-center text-xs font-bold text-amber-400 bg-transparent focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleIncrement(index, 'restSeconds', 15, 600)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#111d38] transition-all cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary Preview Banner */}
          <div className="p-3 rounded-xl bg-[#0e172a] border border-[#1b2b4f] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 truncate">
              <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{getRecipientSummary()}</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-[#1b2b4f] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#111d38] hover:bg-[#1a2947] text-slate-300 hover:text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang giao bài...</span>
                </>
              ) : (
                <>
                  <Dumbbell className="w-4 h-4" />
                  <span>Giao bài tập</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AssignWorkoutModal;
