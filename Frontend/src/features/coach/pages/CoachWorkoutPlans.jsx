import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dumbbell, Users, Plus, Trash2, Send, CheckCircle2, AlertCircle,
  Clock, Play, ShieldAlert, Sparkles, Filter, RefreshCw, X, ChevronRight,
  BookOpen, Layers, Calendar, Copy, Target, Check, ChevronDown, Award, TrendingUp
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api/v1/coach';

const DAYS_OF_WEEK = [
  { key: 'MONDAY', name: 'Thứ Hai', short: 'T2' },
  { key: 'TUESDAY', name: 'Thứ Ba', short: 'T3' },
  { key: 'WEDNESDAY', name: 'Thứ Tư', short: 'T4' },
  { key: 'THURSDAY', name: 'Thứ Năm', short: 'T5' },
  { key: 'FRIDAY', name: 'Thứ Sáu', short: 'T6' },
  { key: 'SATURDAY', name: 'Thứ Bảy', short: 'T7' },
  { key: 'SUNDAY', name: 'Chủ Nhật', short: 'CN' }
];

const GOAL_SUGGESTIONS = [
  'Giảm cân & Đốt mỡ thừa',
  'Tăng cơ bắp & Cắt nét (Hypertrophy)',
  'Tăng sức mạnh toàn thân (Strength)',
  'Cải thiện thể lực & Sức bền tim mạch (Endurance)',
  'Phục hồi cơ bắp & Tăng độ linh hoạt'
];

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getFutureDateStr = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const createInitialWeekSchedule = (defaultExerciseId = '') => ({
  days: {
    MONDAY: {
      active: true,
      label: 'Ngực & Tay sau (Chest + Triceps)',
      durationMinutes: 45,
      exercises: [
        { exerciseId: defaultExerciseId, sets: 3, reps: 10, restSeconds: 60, weightKg: '', coachNote: '' }
      ]
    },
    TUESDAY: { active: false, label: 'Nghỉ ngơi phục hồi (Rest Day)', durationMinutes: 0, exercises: [] },
    WEDNESDAY: {
      active: true,
      label: 'Lưng & Tay trước (Back + Biceps)',
      durationMinutes: 45,
      exercises: [
        { exerciseId: defaultExerciseId, sets: 3, reps: 10, restSeconds: 60, weightKg: '', coachNote: '' }
      ]
    },
    THURSDAY: { active: false, label: 'Nghỉ ngơi phục hồi (Rest Day)', durationMinutes: 0, exercises: [] },
    FRIDAY: {
      active: true,
      label: 'Chân, Mông & Bụng (Legs + Core)',
      durationMinutes: 50,
      exercises: [
        { exerciseId: defaultExerciseId, sets: 3, reps: 12, restSeconds: 60, weightKg: '', coachNote: '' }
      ]
    },
    SATURDAY: { active: false, label: 'Nghỉ ngơi phục hồi (Rest Day)', durationMinutes: 0, exercises: [] },
    SUNDAY: { active: false, label: 'Nghỉ ngơi phục hồi (Rest Day)', durationMinutes: 0, exercises: [] }
  }
});

const CoachWorkoutPlans = () => {
  useLanguage();

  // Main Data States
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedPlans, setAssignedPlans] = useState([]);

  // UI Loading & Filter States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('trainingPlan'); // 'trainingPlan' | 'assign' | 'history'
  const [notificationBanner, setNotificationBanner] = useState(null); // { type: 'success'|'error', message: '' }
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);
  const [detailActiveWeek, setDetailActiveWeek] = useState(1);

  // ==================== FORM 1: GIAO BÀI TẬP ĐƠN (SINGLE) ====================
  const [targetType, setTargetType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'CLASS'
  const [selectedStudentUserId, setSelectedStudentUserId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [planTitle, setPlanTitle] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([
    { exerciseId: '', sets: 3, reps: 12, restSeconds: 60 }
  ]);

  // ==================== FORM 2: TẠO KẾ HOẠCH TẬP LUYỆN (TRAINING_PLAN) ====================
  const [tpTargetType, setTpTargetType] = useState('INDIVIDUAL'); // 'INDIVIDUAL' | 'CLASS'
  const [tpStudentUserId, setTpStudentUserId] = useState('');
  const [tpClassId, setTpClassId] = useState('');
  const [tpTitle, setTpTitle] = useState('');
  const [tpGoal, setTpGoal] = useState('');
  const [tpTotalWeeks, setTpTotalWeeks] = useState(4);
  const [tpStartDate, setTpStartDate] = useState(getTodayStr());
  const [tpEndDate, setTpEndDate] = useState(getFutureDateStr(28));
  const [tpNote, setTpNote] = useState('');
  const [tpCurrentWeek, setTpCurrentWeek] = useState(1);
  const [tpWeeks, setTpWeeks] = useState({});

  // Modal State for Adding New Exercise to Library
  const [isAddExModalOpen, setIsAddExModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscleGroup, setNewExMuscleGroup] = useState('Chest (Ngực)');
  const [newExVideoUrl, setNewExVideoUrl] = useState('');

  // History Filter
  const [historyFilterStudent, setHistoryFilterStudent] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState('ALL'); // 'ALL' | 'TRAINING_PLAN' | 'SINGLE'

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

      const exList = exRes.data || [];
      setExercises(exList);
      setStudents(stRes.data || []);
      setClasses(clRes.data || []);
      setAssignedPlans(plRes.data || []);

      const defaultExId = exList.length > 0 ? exList[0].exerciseId : '';

      // Initialize single workout form
      if (exList.length > 0 && selectedExercises.length === 1 && !selectedExercises[0].exerciseId) {
        setSelectedExercises([{ exerciseId: defaultExId, sets: 3, reps: 12, restSeconds: 60 }]);
      }

      // Initialize training plan weeks (1..4)
      const initialWeeks = {};
      for (let w = 1; w <= 4; w++) {
        initialWeeks[w] = createInitialWeekSchedule(defaultExId);
      }
      setTpWeeks(initialWeeks);
    } catch (error) {
      console.error('Error loading coach workout data:', error);
      showBanner('error', t('Không thể tải dữ liệu giáo án bài tập.'));
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

  // ==================== SINGLE WORKOUT ACTIONS ====================
  const handleAddExerciseRow = () => {
    const defaultExId = exercises.length > 0 ? exercises[0].exerciseId : '';
    setSelectedExercises([
      ...selectedExercises,
      { exerciseId: defaultExId, sets: 3, reps: 10, restSeconds: 60 }
    ]);
  };

  const handleRemoveExerciseRow = (index) => {
    if (selectedExercises.length === 1) {
      showBanner('error', t('Giáo án phải có ít nhất 1 bài tập.'));
      return;
    }
    const updated = selectedExercises.filter((_, idx) => idx !== index);
    setSelectedExercises(updated);
  };

  const handleUpdateExerciseRow = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedExercises(updated);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();

    if (!planTitle.trim()) {
      showBanner('error', t('Vui lòng nhập tiêu đề giáo án bài tập.'));
      return;
    }

    if (targetType === 'INDIVIDUAL' && !selectedStudentUserId) {
      showBanner('error', t('Vui lòng chọn 1 học viên để giao bài.'));
      return;
    }

    if (targetType === 'CLASS' && !selectedClassId) {
      showBanner('error', t('Vui lòng chọn 1 lớp học để giao bài cho toàn bộ lớp.'));
      return;
    }

    for (let i = 0; i < selectedExercises.length; i++) {
      if (!selectedExercises[i].exerciseId) {
        showBanner('error', t('Vui lòng chọn bài tập cho dòng số {0}.', [i + 1]));
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        targetType,
        studentUserId: targetType === 'INDIVIDUAL' ? parseInt(selectedStudentUserId) : null,
        classId: targetType === 'CLASS' ? parseInt(selectedClassId) : null,
        planType: 'SINGLE',
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

      showBanner('success', res.data?.message ? t(res.data.message) : t('Giao bài tập và gửi thông báo thành công!'));

      setPlanTitle('');
      setPlanNote('');
      setSelectedStudentUserId('');
      setSelectedClassId('');

      const plRes = await axios.get(`${API_BASE}/workouts`, { headers: getHeaders() });
      setAssignedPlans(plRes.data || []);
      setActiveTab('history');
    } catch (error) {
      console.error('Error assigning workout:', error);
      const errMsg = error.response?.data?.message || error.response?.data || t('Có lỗi xảy ra khi giao bài tập.');
      showBanner('error', typeof errMsg === 'string' ? t(errMsg) : t('Có lỗi xảy ra khi giao bài tập.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== TRAINING PLAN (MULTI-WEEK) ACTIONS ====================
  const handleTotalWeeksChange = (newTotal) => {
    const total = Math.max(1, Math.min(12, parseInt(newTotal) || 1));
    setTpTotalWeeks(total);

    // Calculate new end date
    const d = new Date(tpStartDate || new Date());
    d.setDate(d.getDate() + total * 7);
    setTpEndDate(d.toISOString().split('T')[0]);

    // Update tpWeeks ensuring keys 1..total
    setTpWeeks(prev => {
      const updated = { ...prev };
      const defaultExId = exercises.length > 0 ? exercises[0].exerciseId : '';
      for (let w = 1; w <= total; w++) {
        if (!updated[w]) {
          // Clone from week 1 if available
          updated[w] = updated[1] ? JSON.parse(JSON.stringify(updated[1])) : createInitialWeekSchedule(defaultExId);
        }
      }
      return updated;
    });

    if (tpCurrentWeek > total) {
      setTpCurrentWeek(total);
    }
  };

  const handleStartDateChange = (dateStr) => {
    setTpStartDate(dateStr);
    if (dateStr) {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + tpTotalWeeks * 7);
      setTpEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleCopyWeek1ToAll = () => {
    if (!tpWeeks[1]) return;
    const week1Copy = JSON.stringify(tpWeeks[1]);
    const updated = { ...tpWeeks };
    for (let w = 2; w <= tpTotalWeeks; w++) {
      updated[w] = JSON.parse(week1Copy);
    }
    setTpWeeks(updated);
    showBanner('success', t('Đã sao chép toàn bộ lịch tập của Tuần 1 sang tất cả các tuần còn lại!'));
  };

  const handleToggleDay = (weekNum, dayKey) => {
    setTpWeeks(prev => {
      const weekData = prev[weekNum] || createInitialWeekSchedule(exercises[0]?.exerciseId || '');
      const dayData = weekData.days[dayKey];
      const newActive = !dayData.active;
      const updatedDay = {
        ...dayData,
        active: newActive,
        exercises: newActive && (!dayData.exercises || dayData.exercises.length === 0)
          ? [{ exerciseId: exercises[0]?.exerciseId || '', sets: 3, reps: 10, restSeconds: 60, weightKg: '', coachNote: '' }]
          : dayData.exercises
      };

      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: updatedDay
          }
        }
      };
    });
  };

  const handleDayLabelChange = (weekNum, dayKey, label) => {
    setTpWeeks(prev => {
      const weekData = prev[weekNum];
      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: {
              ...weekData.days[dayKey],
              label
            }
          }
        }
      };
    });
  };

  const handleDayDurationChange = (weekNum, dayKey, durationMinutes) => {
    setTpWeeks(prev => {
      const weekData = prev[weekNum];
      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: {
              ...weekData.days[dayKey],
              durationMinutes: parseInt(durationMinutes) || 0
            }
          }
        }
      };
    });
  };

  const handleAddExerciseToDay = (weekNum, dayKey) => {
    const defaultExId = exercises.length > 0 ? exercises[0].exerciseId : '';
    setTpWeeks(prev => {
      const weekData = prev[weekNum];
      const dayData = weekData.days[dayKey];
      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: {
              ...dayData,
              exercises: [
                ...dayData.exercises,
                { exerciseId: defaultExId, sets: 3, reps: 10, restSeconds: 60, weightKg: '', coachNote: '' }
              ]
            }
          }
        }
      };
    });
  };

  const handleRemoveExerciseFromDay = (weekNum, dayKey, exIndex) => {
    setTpWeeks(prev => {
      const weekData = prev[weekNum];
      const dayData = weekData.days[dayKey];
      if (dayData.exercises.length <= 1) {
        showBanner('error', t('Buổi tập cần có ít nhất 1 bài tập. Nếu muốn nghỉ ngày này, hãy bỏ chọn ngày tập.'));
        return prev;
      }
      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: {
              ...dayData,
              exercises: dayData.exercises.filter((_, idx) => idx !== exIndex)
            }
          }
        }
      };
    });
  };

  const handleExerciseFieldChange = (weekNum, dayKey, exIndex, field, value) => {
    setTpWeeks(prev => {
      const weekData = prev[weekNum];
      const dayData = weekData.days[dayKey];
      const updatedExercises = [...dayData.exercises];
      updatedExercises[exIndex] = {
        ...updatedExercises[exIndex],
        [field]: value
      };
      return {
        ...prev,
        [weekNum]: {
          ...weekData,
          days: {
            ...weekData.days,
            [dayKey]: {
              ...dayData,
              exercises: updatedExercises
            }
          }
        }
      };
    });
  };

  const handleTrainingPlanSubmit = async (e) => {
    e.preventDefault();

    if (!tpTitle.trim()) {
      showBanner('error', t('Vui lòng nhập tiêu đề kế hoạch tập luyện.'));
      return;
    }

    if (tpTargetType === 'INDIVIDUAL' && !tpStudentUserId) {
      showBanner('error', t('Vui lòng chọn 1 học viên để áp dụng kế hoạch.'));
      return;
    }

    if (tpTargetType === 'CLASS' && !tpClassId) {
      showBanner('error', t('Vui lòng chọn 1 lớp học để áp dụng kế hoạch cho cả lớp.'));
      return;
    }

    // Validate each active day's exercises
    for (let w = 1; w <= tpTotalWeeks; w++) {
      const weekData = tpWeeks[w] || createInitialWeekSchedule();
      for (const day of DAYS_OF_WEEK) {
        const dayData = weekData.days[day.key];
        if (dayData && dayData.active && dayData.exercises) {
          for (let i = 0; i < dayData.exercises.length; i++) {
            if (!dayData.exercises[i].exerciseId) {
              showBanner('error', t('Tuần {0} - {1}: Vui lòng chọn bài tập cho dòng số {2} hoặc xóa dòng đó.', [w, t(day.name), i + 1]));
              return;
            }
          }
        }
      }
    }

    // Collect all exercises from all weeks
    const flattenedDetails = [];
    for (let w = 1; w <= tpTotalWeeks; w++) {
      const weekData = tpWeeks[w] || createInitialWeekSchedule();
      for (const day of DAYS_OF_WEEK) {
        const dayData = weekData.days[day.key];
        if (dayData && dayData.active && dayData.exercises && dayData.exercises.length > 0) {
          dayData.exercises.forEach((ex, idx) => {
            if (ex.exerciseId) {
              flattenedDetails.push({
                exerciseId: parseInt(ex.exerciseId),
                weekNumber: w,
                dayOfWeek: day.key,
                dayLabel: dayData.label || day.name,
                sets: parseInt(ex.sets) || 3,
                reps: parseInt(ex.reps) || 10,
                restSeconds: parseInt(ex.restSeconds) || 60,
                durationMinutes: parseInt(dayData.durationMinutes) || 45,
                weightKg: ex.weightKg !== '' && ex.weightKg !== null ? parseFloat(ex.weightKg) : null,
                coachNote: ex.coachNote ? ex.coachNote.trim() : null,
                sortOrder: idx
              });
            }
          });
        }
      }
    }

    if (flattenedDetails.length === 0) {
      showBanner('error', t('Kế hoạch phải có ít nhất 1 bài tập. Vui lòng bật ít nhất 1 ngày tập và chọn bài tập.'));
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        targetType: tpTargetType,
        studentUserId: tpTargetType === 'INDIVIDUAL' ? parseInt(tpStudentUserId) : null,
        classId: tpTargetType === 'CLASS' ? parseInt(tpClassId) : null,
        planType: 'TRAINING_PLAN',
        title: tpTitle.trim(),
        goal: tpGoal.trim() || null,
        startDate: tpStartDate || null,
        endDate: tpEndDate || null,
        totalWeeks: tpTotalWeeks,
        note: tpNote.trim() || null,
        exerciseDetails: flattenedDetails
      };

      const res = await axios.post(`${API_BASE}/workouts/assign`, payload, { headers: getHeaders() });

      showBanner('success', res.data?.message ? t(res.data.message) : t('Tạo kế hoạch tập luyện thành công!'));

      // Reset form
      setTpTitle('');
      setTpGoal('');
      setTpNote('');
      setTpStudentUserId('');
      setTpClassId('');

      // Refresh plans
      const plRes = await axios.get(`${API_BASE}/workouts`, { headers: getHeaders() });
      setAssignedPlans(plRes.data || []);
      setActiveTab('history');
      setHistoryFilterType('TRAINING_PLAN');
    } catch (error) {
      console.error('Error creating training plan:', error);
      const errMsg = error.response?.data?.message || error.response?.data || t('Có lỗi xảy ra khi tạo kế hoạch.');
      showBanner('error', typeof errMsg === 'string' ? t(errMsg) : t('Có lỗi xảy ra khi tạo kế hoạch.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== LIBRARY & DELETION ====================
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
      showBanner('success', t('Đã thêm bài tập "{0}" vào thư viện!', [res.data.exerciseName]));
      setNewExName('');
      setNewExVideoUrl('');
      setIsAddExModalOpen(false);
    } catch (error) {
      console.error('Error creating exercise:', error);
      showBanner('error', t('Không thể tạo bài tập mới.'));
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm(t('Bạn có chắc chắn muốn xóa giáo án / kế hoạch này không?'))) return;

    try {
      await axios.delete(`${API_BASE}/workouts/${planId}`, { headers: getHeaders() });
      setAssignedPlans(assignedPlans.filter(p => p.planId !== planId));
      if (selectedPlanDetail && selectedPlanDetail.planId === planId) {
        setSelectedPlanDetail(null);
      }
      showBanner('success', t('Đã xóa thành công.'));
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      showBanner('error', t('Không thể xóa.'));
    }
  };

  // Filtered assigned plans
  const filteredPlans = assignedPlans.filter(plan => {
    if (historyFilterStudent && plan.userId !== parseInt(historyFilterStudent)) {
      return false;
    }
    if (historyFilterType === 'TRAINING_PLAN' && plan.planType !== 'TRAINING_PLAN') {
      return false;
    }
    if (historyFilterType === 'SINGLE' && plan.planType === 'TRAINING_PLAN') {
      return false;
    }
    return true;
  });

  const trainingPlanCount = assignedPlans.filter(p => p.planType === 'TRAINING_PLAN').length;
  const singlePlanCount = assignedPlans.filter(p => p.planType !== 'TRAINING_PLAN').length;

  const currentWeekData = tpWeeks[tpCurrentWeek] || createInitialWeekSchedule(exercises[0]?.exerciseId || '');
  const activeDaysInCurrentWeek = Object.values(currentWeekData.days).filter(d => d.active).length;

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft)]">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[var(--text)] tracking-tight">
                {t("Quản Lý Giáo Án & Kế Hoạch Tập Luyện")}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {t("Thiết kế kế hoạch theo tuần/mốc hoặc giao bài tập nhanh cho cá nhân & cả lớp")}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Exercise to Library Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddExModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-[var(--primary)]" />
            <span>{t("Thêm Động Tác Vào Thư Viện")}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
            notificationBanner.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {notificationBanner.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notificationBanner.message}</span>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{t("Kế Hoạch Dài Hạn")}</span>
            <span className="text-xl font-bold text-[var(--text)]">{trainingPlanCount} <span className="text-xs text-[var(--text-muted)] font-normal">{t("lộ trình")}</span></span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{t("Bài Giao Nhanh")}</span>
            <span className="text-xl font-bold text-[var(--text)]">{singlePlanCount} <span className="text-xs text-[var(--text-muted)] font-normal">{t("buổi")}</span></span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{t("Học Viên Đang Dạy")}</span>
            <span className="text-xl font-bold text-[var(--text)]">{students.length} <span className="text-xs text-[var(--text-muted)] font-normal">{t("người")}</span></span>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[var(--text-muted)] font-medium">{t("Thư Viện Động Tác")}</span>
            <span className="text-xl font-bold text-[var(--text)]">{exercises.length} <span className="text-xs text-[var(--text-muted)] font-normal">{t("bài tập")}</span></span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('trainingPlan')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'trainingPlan'
              ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t("⭐ Tạo Kế Hoạch Theo Tuần / Mốc")}</span>
        </button>

        <button
          onClick={() => setActiveTab('assign')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'assign'
              ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-md shadow-amber-500/20'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{t("Giao Bài Tập Nhanh (1 Buổi)")}</span>
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
          <span>{t("Danh Sách Kế Hoạch & Bài Tập")} ({assignedPlans.length})</span>
        </button>
      </div>

      {/* ===================== TAB 1: TẠO KẾ HOẠCH TẬP LUYỆN (TRAINING_PLAN) ===================== */}
      {activeTab === 'trainingPlan' && (
        <form onSubmit={handleTrainingPlanSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow)] space-y-8 animate-fade-in">
          
          {/* Section 1: Phạm vi kế hoạch */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-base font-bold text-[var(--text)]">{t("Chọn Đối Tượng Áp Dụng Kế Hoạch")}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setTpTargetType('INDIVIDUAL')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  tpTargetType === 'INDIVIDUAL'
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-slate-600'
                }`}
              >
                <div className={`p-3 rounded-xl ${tpTargetType === 'INDIVIDUAL' ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">{t("1. Kế hoạch Cá Nhân (1 Học viên)")}</span>
                    {tpTargetType === 'INDIVIDUAL' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("Lập lộ trình huấn luyện riêng biệt tối ưu theo thể trạng của 1 học viên.")}
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTpTargetType('CLASS')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  tpTargetType === 'CLASS'
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)]/20 shadow-md'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-slate-600'
                }`}
              >
                <div className={`p-3 rounded-xl ${tpTargetType === 'CLASS' ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">{t("2. Kế hoạch Cho Cả Lớp")}</span>
                    {tpTargetType === 'CLASS' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("Áp dụng đồng bộ cho tất cả học viên trong lớp bạn phụ trách.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="pt-2">
              {tpTargetType === 'INDIVIDUAL' ? (
                <div className="space-y-1.5 max-w-xl">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("Chọn Học Viên")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tpStudentUserId}
                    onChange={(e) => setTpStudentUserId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">{t("-- Chọn học viên từ danh sách ({0} học viên) --", [students.length])}</option>
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
                    {t("Chọn Lớp Học")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tpClassId}
                    onChange={(e) => setTpClassId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">{t("-- Chọn lớp học bạn đang dạy ({0} lớp) --", [classes.length])}</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className} ({t("{0} học viên tham gia", [cls.enrolledCount || 0])})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Thông tin & Mục tiêu kế hoạch */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="text-base font-bold text-[var(--text)]">{t("Thông Tin & Mục Tiêu Kế Hoạch")}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t("Tiêu Đề Kế Hoạch")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tpTitle}
                  onChange={(e) => setTpTitle(e.target.value)}
                  placeholder={t("VD: Lộ trình Giảm Mỡ - Tăng Cơ Nạc 4 Tuần...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>{t("Mục Tiêu Tập Luyện")}</span>
                </label>
                <input
                  type="text"
                  value={tpGoal}
                  onChange={(e) => setTpGoal(e.target.value)}
                  placeholder={t("VD: Giảm 3kg mỡ, tăng 1.5kg cơ, cải thiện mức tạ squat...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--text-muted)]">{t("Gợi ý nhanh:")}</span>
                  {GOAL_SUGGESTIONS.map((g, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTpGoal(t(g))}
                      className="px-2 py-0.5 rounded-lg bg-[var(--surface-hover)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] text-[10px] text-[var(--text-muted)] border border-[var(--border)] transition-all"
                    >
                      {t(g)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Số mốc tuần */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t("Số Mốc Tuần Của Kế Hoạch")}
                </label>
                <select
                  value={tpTotalWeeks}
                  onChange={(e) => handleTotalWeeksChange(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-bold"
                >
                  {[1, 2, 3, 4, 6, 8, 10, 12].map(w => (
                    <option key={w} value={w}>
                      {t("{0} Tuần", [w])} {w === 4 ? `(${t("Phổ biến nhất")})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Ngày Bắt Đầu")}</label>
                  <input
                    type="date"
                    value={tpStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Ngày Kết Thúc")}</label>
                  <input
                    type="date"
                    value={tpEndDate}
                    onChange={(e) => setTpEndDate(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Ghi Chú Chung & Dặn Dò Dinh Dưỡng")}</label>
                <textarea
                  rows="2"
                  value={tpNote}
                  onChange={(e) => setTpNote(e.target.value)}
                  placeholder={t("VD: Uống đủ 2L nước mỗi ngày, ngủ đủ 7-8 tiếng, khởi động kỹ 10 phút trước khi tập...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 3: Trình dựng lịch theo Mốc/Tuần & Ngày (Milestone Builder) */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">3</span>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)]">{t("Xây Dựng Chi Tiết Từng Mốc Tuần")}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t("Chọn tuần để soạn thảo bài tập theo từng thứ trong tuần.")}</p>
                </div>
              </div>

              {/* Nút sao chép Tuần 1 sang tất cả tuần khác */}
              {tpTotalWeeks > 1 && (
                <button
                  type="button"
                  onClick={handleCopyWeek1ToAll}
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] text-xs text-[var(--text)] font-semibold border border-[var(--border)] flex items-center gap-2 transition-all"
                  title={t("Sao chép cấu trúc buổi tập của Tuần 1 sang tất cả các tuần khác")}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t("Sao Chép Tuần 1 ➔ Tất Cả Tuần")}</span>
                </button>
              )}
            </div>

            {/* Week Milestone Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {Array.from({ length: tpTotalWeeks }, (_, i) => i + 1).map((weekNum) => {
                const isSelected = tpCurrentWeek === weekNum;
                const weekObj = tpWeeks[weekNum];
                const activeDaysCount = weekObj ? Object.values(weekObj.days).filter(d => d.active).length : 0;

                return (
                  <button
                    key={weekNum}
                    type="button"
                    onClick={() => setTpCurrentWeek(weekNum)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-[var(--primary)] text-[color:var(--on-primary)] border-[var(--primary)] shadow-md'
                        : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    <span>{t("Mốc Tuần {0}", [weekNum])}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                    }`}>
                      {t("{0} buổi", [activeDaysCount])}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Days of the Current Week */}
            <div className="bg-[var(--surface-hover)]/40 border border-[var(--border)] p-4 sm:p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[var(--primary)]" />
                  <span className="font-extrabold text-sm text-[var(--text)]">
                    {t("Lịch tập Tuần {0} ({1} buổi tập được chọn)", [tpCurrentWeek, activeDaysInCurrentWeek])}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {t("Bấm vào các thứ bên dưới để Bật/Tắt ngày tập")}
                </span>
              </div>

              {/* Day Selector Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const dayData = currentWeekData.days[day.key] || { active: false };
                  const isActive = dayData.active;
                  const exCount = dayData.exercises ? dayData.exercises.length : 0;

                  return (
                    <div
                      key={day.key}
                      onClick={() => handleToggleDay(tpCurrentWeek, day.key)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 ${
                        isActive
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)]/30 text-[var(--text)] shadow-sm'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-slate-500 opacity-60'
                      }`}
                    >
                      <span className="font-extrabold text-xs">{t(day.name)}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                      }`}>
                        {isActive ? t("{0} bài tập", [exCount]) : t("Nghỉ")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Detailed Exercises for each Active Day */}
              <div className="space-y-6 pt-2">
                {DAYS_OF_WEEK.filter(day => currentWeekData.days[day.key]?.active).map((day) => {
                  const dayData = currentWeekData.days[day.key];

                  return (
                    <div key={day.key} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                      {/* Day Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] font-extrabold text-xs border border-[var(--primary-soft)]">
                            {t(day.name)}
                          </span>
                          <input
                            type="text"
                            value={dayData.label || ''}
                            onChange={(e) => handleDayLabelChange(tpCurrentWeek, day.key, e.target.value)}
                            placeholder={t("Tên nhóm cơ / buổi tập (VD: Ngực & Tay sau)")}
                            className="bg-transparent border-b border-[var(--border)] focus:border-[var(--primary)] px-2 py-1 text-xs font-bold text-[var(--text)] focus:outline-none min-w-[200px]"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                            <span>{t("Thời lượng:")}</span>
                            <input
                              type="number"
                              min="10"
                              max="180"
                              step="5"
                              value={dayData.durationMinutes || 45}
                              onChange={(e) => handleDayDurationChange(tpCurrentWeek, day.key, e.target.value)}
                              className="w-14 bg-[var(--surface-hover)] border border-[var(--border)] rounded-lg px-2 py-1 text-center font-bold text-[var(--text)] text-xs"
                            />
                            <span>{t("phút")}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleDay(tpCurrentWeek, day.key)}
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            {t("Chuyển thành ngày nghỉ")}
                          </button>
                        </div>
                      </div>

                      {/* Exercises in this Day */}
                      <div className="space-y-3">
                        {dayData.exercises.map((ex, exIdx) => {
                          const exInfo = exercises.find(item => item.exerciseId === parseInt(ex.exerciseId));

                          return (
                            <div key={exIdx} className="bg-[var(--surface-hover)]/60 border border-[var(--border)] rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
                              <span className="w-6 h-6 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                                #{exIdx + 1}
                              </span>

                              {/* Exercise Select */}
                              <div className="flex-1 w-full space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Động tác")}</label>
                                <select
                                  value={ex.exerciseId}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'exerciseId', e.target.value)}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                                >
                                  <option value="">{t("-- Chọn bài tập --")}</option>
                                  {exercises.map((eItem) => (
                                    <option key={eItem.exerciseId} value={eItem.exerciseId}>
                                      {eItem.exerciseName} [{t(eItem.muscleGroup || 'Chung')}]
                                    </option>
                                  ))}
                                </select>
                                {exInfo && exInfo.videoUrl && (
                                  <a href={exInfo.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                                    <Play className="w-3 h-3" /> {t("Video mẫu")}
                                  </a>
                                )}
                              </div>

                              {/* Sets */}
                              <div className="w-20 space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Sets")}</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={ex.sets}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'sets', e.target.value)}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                                />
                              </div>

                              {/* Reps */}
                              <div className="w-24 space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Reps")}</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="200"
                                  value={ex.reps}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'reps', e.target.value)}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                                />
                              </div>

                              {/* Weight (kg) */}
                              <div className="w-24 space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Mức tạ (kg)")}</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  placeholder="0"
                                  value={ex.weightKg}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'weightKg', e.target.value)}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                                />
                              </div>

                              {/* Rest (s) */}
                              <div className="w-24 space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Nghỉ (s)")}</label>
                                <input
                                  type="number"
                                  step="5"
                                  min="0"
                                  max="600"
                                  value={ex.restSeconds}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'restSeconds', e.target.value)}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-2 py-2 text-xs text-[var(--text)] text-center font-bold focus:outline-none focus:border-[var(--primary)]"
                                />
                              </div>

                              {/* Note for exercise */}
                              <div className="flex-1 w-full space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Ghi chú động tác")}</label>
                                <input
                                  type="text"
                                  value={ex.coachNote || ''}
                                  onChange={(e) => handleExerciseFieldChange(tpCurrentWeek, day.key, exIdx, 'coachNote', e.target.value)}
                                  placeholder={t("VD: Giữ lưng thẳng, siết ngực...")}
                                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                                />
                              </div>

                              {/* Delete Exercise */}
                              <div className="pt-4 md:pt-0">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExerciseFromDay(tpCurrentWeek, day.key, exIdx)}
                                  title={t("Xóa động tác")}
                                  className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Exercise to Day Button */}
                        <button
                          type="button"
                          onClick={() => handleAddExerciseToDay(tpCurrentWeek, day.key)}
                          className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/20 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t("+ Thêm bài tập cho {0}", [t(day.name)])}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {activeDaysInCurrentWeek === 0 && (
                  <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                    {t("Tuần này chưa có buổi tập nào. Hãy bấm vào các thứ ở trên để bật ngày tập.")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <ShieldAlert className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span>{t("Học viên sẽ nhận được thông báo lộ trình kế hoạch tập luyện qua ứng dụng.")}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[color:var(--on-primary)] font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  <span>{t("Đang khởi tạo kế hoạch...")}</span>
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>{t("Xác Nhận Tạo Kế Hoạch Tập Luyện")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ===================== TAB 2: FORM GIAO BÀI TẬP NHANH (SINGLE) ===================== */}
      {activeTab === 'assign' && (
        <form onSubmit={handleAssignSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow)] space-y-8 animate-fade-in">
          
          {/* Section 1: Đối tượng giao bài */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="text-base font-bold text-[var(--text)]">{t("Chọn Phạm Vi Giao Bài")}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <span className="font-bold text-sm text-[var(--text)]">{t("1. Giao bài cho 1 Cá nhân")}</span>
                    {targetType === 'INDIVIDUAL' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("Chọn chính xác 1 học viên để gửi giáo án huấn luyện riêng biệt.")}
                  </p>
                </div>
              </div>

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
                    <span className="font-bold text-sm text-[var(--text)]">{t("2. Giao bài cho Toàn Lớp")}</span>
                    {targetType === 'CLASS' && <Sparkles className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("Tự động tạo giáo án & gửi thông báo cho tất cả học viên trong lớp được chọn.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="pt-2">
              {targetType === 'INDIVIDUAL' ? (
                <div className="space-y-1.5 max-w-xl">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {t("Chọn Học Viên Nhận Bài Tập")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentUserId}
                    onChange={(e) => setSelectedStudentUserId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">{t("-- Chọn học viên từ danh sách ({0}) --", [students.length])}</option>
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
                    {t("Chọn Lớp Học")} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-all font-medium"
                  >
                    <option value="">{t("-- Chọn lớp học bạn phụ trách ({0}) --", [classes.length])}</option>
                    {classes.map((cls) => (
                      <option key={cls.classId} value={cls.classId}>
                        {cls.className} ({t("{0} học viên tham gia", [cls.enrolledCount || 0])})
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
              <h3 className="text-base font-bold text-[var(--text)]">{t("Thông Tin & Hướng Dẫn Buổi Tập")}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t("Tiêu Đề Giáo Án")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder={t("VD: Giáo án ngày 1 - Ngực & Tay sau, Bài tập về nhà...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Ghi Chú Hướng Dẫn Thêm")}</label>
                <input
                  type="text"
                  value={planNote}
                  onChange={(e) => setPlanNote(e.target.value)}
                  placeholder={t("VD: Khởi động 10 phút trước khi bắt đầu, uống nhiều nước...")}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Danh sách bài tập */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">3</span>
                <h3 className="text-base font-bold text-[var(--text)]">{t("Danh Sách Bài Tập Cần Thực Hiện")}</h3>
              </div>

              <button
                type="button"
                onClick={handleAddExerciseRow}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[color:var(--on-primary)] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("Thêm Động Tác")}</span>
              </button>
            </div>

            <div className="space-y-3">
              {selectedExercises.map((exRow, idx) => {
                const currentExObj = exercises.find(e => e.exerciseId === parseInt(exRow.exerciseId));

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col md:flex-row items-start md:items-center gap-3 transition-all"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-muted)] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Exercise Select */}
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Tên Động Tác")}</label>
                      <select
                        value={exRow.exerciseId}
                        onChange={(e) => handleUpdateExerciseRow(idx, 'exerciseId', e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-semibold"
                      >
                        <option value="">{t("-- Chọn bài tập từ thư viện --")}</option>
                        {exercises.map((ex) => (
                          <option key={ex.exerciseId} value={ex.exerciseId}>
                            {ex.exerciseName} [{t(ex.muscleGroup || 'Chung')}]
                          </option>
                        ))}
                      </select>
                      {currentExObj && currentExObj.videoUrl && (
                        <a href={currentExObj.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-0.5">
                          <Play className="w-3 h-3" /> {t("Xem video hướng dẫn mẫu")}
                        </a>
                      )}
                    </div>

                    {/* Sets */}
                    <div className="w-24 space-y-1">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Số Hiệp (Sets)")}</label>
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
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Số Lần/Hiệp (Reps)")}</label>
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
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{t("Nghỉ (Giây)")}</label>
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
                        title={t("Xóa dòng động tác")}
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
              <span>{t("Nhấn gửi sẽ đồng thời tạo thông báo đẩy tới tài khoản của học viên.")}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-[color:var(--on-primary)] font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                  <span>{t("Đang xử lý & Gửi...")}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t("Xác Nhận Gửi Giáo Án & Thông Báo")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ===================== TAB 3: DANH SÁCH & LỊCH SỬ ===================== */}
      {activeTab === 'history' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)] space-y-6 animate-fade-in">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-xs font-bold text-[var(--text-muted)]">{t("Lọc:")}</span>
              </div>

              {/* Filter Type */}
              <select
                value={historyFilterType}
                onChange={(e) => setHistoryFilterType(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-medium"
              >
                <option value="ALL">{t("Tất cả ({0})", [assignedPlans.length])}</option>
                <option value="TRAINING_PLAN">⭐ {t("Kế hoạch tập luyện theo mốc ({0})", [trainingPlanCount])}</option>
                <option value="SINGLE">⚡ {t("Bài tập giao 1 lần ({0})", [singlePlanCount])}</option>
              </select>

              {/* Filter Student */}
              <select
                value={historyFilterStudent}
                onChange={(e) => setHistoryFilterStudent(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)] font-medium"
              >
                <option value="">{t("Tất cả học viên")}</option>
                {students.map((st) => (
                  <option key={st.userId} value={st.userId}>
                    {st.fullName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchInitialData}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] text-xs flex items-center gap-1.5 border border-[var(--border)] self-start md:self-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t("Tải lại danh sách")}</span>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-16 text-[var(--text-muted)]">{t("Đang tải danh sách...")}</div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Dumbbell className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-40" />
              <h4 className="text-base font-bold text-[var(--text)]">{t("Chưa có kế hoạch hoặc bài tập nào phù hợp")}</h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">{t("Hãy chọn tab 'Tạo Kế Hoạch Theo Tuần / Mốc' để tạo lộ trình cho học viên.")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlans.map((plan) => {
                const isTrainingPlan = plan.planType === 'TRAINING_PLAN';

                return (
                  <div
                    key={plan.planId}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                      isTrainingPlan
                        ? 'bg-[var(--surface)] border-purple-500/30 hover:border-purple-500 shadow-sm'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isTrainingPlan ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {t("Kế hoạch {0} tuần", [plan.totalWeeks || 1])}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 flex items-center gap-1">
                              <Send className="w-3 h-3" />
                              {t("Bài tập 1 lần")}
                            </span>
                          )}

                          {plan.className && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                              {plan.className}
                            </span>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)] text-[10px] font-bold border border-[var(--border)] shrink-0">
                          {codeLabel(plan.status || 'ACTIVE')}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text)]">{plan.title}</h4>
                        {plan.goal && (
                          <div className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium mt-1">
                            <Target className="w-3.5 h-3.5 shrink-0" />
                            <span>{t("Mục tiêu:")} {plan.goal}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>{t("Học viên:")}</span> <strong className="text-[var(--text)]">{plan.studentName}</strong>
                        </span>

                        {isTrainingPlan && plan.startDate && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                            <Clock className="w-3 h-3 text-[var(--primary)]" />
                            <span>{plan.startDate} ➔ {plan.endDate || t("Chưa xác định")}</span>
                          </span>
                        )}

                        {!isTrainingPlan && plan.createdAt && (
                          <span className="flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {new Date(plan.createdAt).toLocaleString(locale())}
                          </span>
                        )}
                      </div>

                      {plan.note && (
                        <p className="text-xs text-[var(--text-muted)] italic bg-[var(--surface-hover)] p-2.5 rounded-xl border border-[var(--border)]">
                          "{plan.note}"
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">
                          {isTrainingPlan
                            ? `${t("{0} mốc tuần", [plan.weeks?.length || plan.totalWeeks || 1])} • ${t("{0} bài tập", [plan.details?.length || 0])}`
                            : `${t("Số bài tập:")} ${plan.details?.length || 0}`}
                        </span>

                        <button
                          onClick={() => {
                            setSelectedPlanDetail(plan);
                            setDetailActiveWeek(1);
                          }}
                          className="text-xs text-[var(--primary)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isTrainingPlan ? t("Xem chi tiết theo mốc") : t("Chi tiết bài tập")}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleDeletePlan(plan.planId)}
                          className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-[11px] border border-rose-500/20 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> {t("Xóa")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL 1: CHI TIẾT GIÁO ÁN & XEM TỪNG MỐC ===================== */}
      {selectedPlanDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-md animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-[var(--shadow)] flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center border border-[var(--primary-soft)] font-bold">
                  {selectedPlanDetail.planType === 'TRAINING_PLAN' ? (
                    <Calendar className="w-5 h-5" />
                  ) : (
                    <Dumbbell className="w-5 h-5" />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text)]">{selectedPlanDetail.title}</h3>
                    {selectedPlanDetail.planType === 'TRAINING_PLAN' ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                        {t("Kế hoạch {0} tuần", [selectedPlanDetail.totalWeeks || 1])}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                        {t("Bài tập 1 lần")}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--primary)] font-medium">
                    {t("Giao cho:")} {selectedPlanDetail.studentName} {selectedPlanDetail.className ? `(${selectedPlanDetail.className})` : ''}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Goal & Dates (If Training Plan) */}
              {selectedPlanDetail.planType === 'TRAINING_PLAN' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)]">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">{t("Mục Tiêu")}</span>
                    <span className="text-xs font-bold text-[var(--primary)]">{selectedPlanDetail.goal || t("Chưa thiết lập")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">{t("Thời Hạn Lộ Trình")}</span>
                    <span className="text-xs font-semibold text-[var(--text)]">
                      {selectedPlanDetail.startDate} ➔ {selectedPlanDetail.endDate || t("Chưa xác định")}
                    </span>
                  </div>
                </div>
              )}

              {selectedPlanDetail.note && (
                <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] italic">
                  <strong>{t("Ghi chú của Coach:")}</strong> {selectedPlanDetail.note}
                </div>
              )}

              {/* View breakdown based on planType */}
              {selectedPlanDetail.planType === 'TRAINING_PLAN' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <h5 className="font-bold text-[var(--text)] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[var(--primary)]" />
                      <span>{t("Xem Chi Tiết Theo Mốc Tuần:")}</span>
                    </h5>
                  </div>

                  {/* Week Milestone Tabs */}
                  {selectedPlanDetail.weeks && selectedPlanDetail.weeks.length > 0 ? (
                    <>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {selectedPlanDetail.weeks.map((wk) => (
                          <button
                            key={wk.weekNumber}
                            onClick={() => setDetailActiveWeek(wk.weekNumber)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              detailActiveWeek === wk.weekNumber
                                ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-sm'
                                : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
                            }`}
                          >
                            <span>{t("Tuần {0}", [wk.weekNumber])}</span>
                            <span className="ml-1.5 text-[10px] opacity-75">({t("{0} buổi", [wk.days?.length || 0])})</span>
                          </button>
                        ))}
                      </div>

                      {/* Days in selected week */}
                      {selectedPlanDetail.weeks.find(w => w.weekNumber === detailActiveWeek)?.days?.map((dGroup, dIdx) => (
                        <div key={dIdx} className="bg-[var(--surface-hover)]/60 border border-[var(--border)] rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] font-extrabold text-[11px]">
                                {t(DAYS_OF_WEEK.find(d => d.key === dGroup.dayOfWeek)?.name || dGroup.dayOfWeek)}
                              </span>
                              <span className="font-bold text-xs text-[var(--text)]">{dGroup.dayLabel}</span>
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">{t("{0} bài tập", [dGroup.exercises?.length || 0])}</span>
                          </div>

                          <div className="space-y-2">
                            {dGroup.exercises?.map((ex, exIdx) => (
                              <div key={exIdx} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <span className="w-5 h-5 rounded-md bg-[var(--surface-hover)] text-[var(--text-muted)] font-bold text-[10px] flex items-center justify-center">
                                    #{exIdx + 1}
                                  </span>
                                  <div>
                                    <p className="font-bold text-xs text-[var(--text)]">{ex.exerciseName}</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">
                                      {t("Cơ tác động:")} {t(ex.muscleGroup || 'Chung')}
                                      {ex.coachNote ? ` • ${t("Ghi chú:")} ${ex.coachNote}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 text-right self-end sm:self-auto">
                                  {ex.weightKg !== null && ex.weightKg !== undefined && (
                                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[11px]">
                                      {ex.weightKg} kg
                                    </span>
                                  )}
                                  <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] font-semibold text-[11px]">
                                    {ex.sets} {t("Set")} x {ex.reps} {t("Rep")}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">{t("Nghỉ")} {ex.restSeconds}s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Fallback to detail list if weeks grouping not present
                    <div className="space-y-2">
                      {selectedPlanDetail.details?.map((d, dIdx) => (
                        <div key={dIdx} className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-[var(--text)]">{d.exerciseName} {d.weekNumber ? `(${t("Tuần {0}", [d.weekNumber])})` : ''}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{d.dayLabel || d.dayOfWeek}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-xs">{d.sets} {t("Set")} x {d.reps} {t("Rep")}</span>
                            <span className="text-[10px] text-[var(--text-muted)] block">{t("Nghỉ")} {d.restSeconds}s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Single Workout Exercise List
                <div className="space-y-2">
                  <h5 className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                    {t("Danh Sách Bài Tập ({0})", [selectedPlanDetail.details?.length || 0])}
                  </h5>
                  <div className="space-y-2">
                    {selectedPlanDetail.details?.map((d, dIdx) => (
                      <div key={dIdx} className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                            #{dIdx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-[var(--text)]">{d.exerciseName}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{t("Cơ tác động:")} {t(d.muscleGroup || 'Chung')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] font-semibold text-[11px]">
                            {d.sets} {t("Set")} x {d.reps} {t("Rep")}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">{t("Nghỉ")} {d.restSeconds}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => setSelectedPlanDetail(null)}
                className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] font-semibold text-xs border border-[var(--border)] cursor-pointer"
              >
                {t("Đóng")}
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
                    <h3 className="text-base font-bold text-[var(--text)]">{t("Thêm Động Tác Mới")}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{t("Thêm vào thư viện để sử dụng lại nhiều lần")}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddExModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{t("Tên Bài Tập")} <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder={t("VD: Bench Press, Plank, Deadlift...")}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{t("Nhóm Cơ Tác Động")}</label>
                  <select
                    value={newExMuscleGroup}
                    onChange={(e) => setNewExMuscleGroup(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Chest (Ngực)">{t("Chest (Ngực)")}</option>
                    <option value="Back (Lưng/Xô)">{t("Back (Lưng/Xô)")}</option>
                    <option value="Legs (Đùi/Bắp chân)">{t("Legs (Đùi/Bắp chân)")}</option>
                    <option value="Shoulders (Vai)">{t("Shoulders (Vai)")}</option>
                    <option value="Arms (Tay trước/Tay sau)">{t("Arms (Tay trước/Tay sau)")}</option>
                    <option value="Abs (Bụng/Core)">{t("Abs (Bụng/Core)")}</option>
                    <option value="Cardio / Toàn thân">{t("Cardio / Toàn thân")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">{t("Link Video Youtube Mẫu (Tùy chọn)")}</label>
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
                  className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] font-semibold text-xs cursor-pointer"
                >
                  {t("Hủy")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] font-bold text-xs shadow-md cursor-pointer"
                >
                  {t("Lưu Vào Thư Viện")}
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
