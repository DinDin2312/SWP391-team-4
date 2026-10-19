import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dumbbell,
  BookOpen,
  User,
  Clock,
  MapPin,
  Calendar,
  X,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  Layers,
  Video,
  Target,
  Send,
  Award,
  Play
} from 'lucide-react';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';

const API_BASE = 'http://localhost:8080/api/v1/member';

const DAYS_OF_WEEK_MAP = {
  MONDAY: 'Thứ Hai',
  TUESDAY: 'Thứ Ba',
  WEDNESDAY: 'Thứ Tư',
  THURSDAY: 'Thứ Năm',
  FRIDAY: 'Thứ Sáu',
  SATURDAY: 'Thứ Bảy',
  SUNDAY: 'Chủ Nhật'
};

const MemberWorkoutsModal = ({ isOpen, onClose, initialClassId = null }) => {
  useLanguage();
  const [classes, setClasses] = useState([]);

  const getDayOfWeekLabel = (dayKey) => {
    const map = {
      MONDAY: t('Thứ Hai'),
      TUESDAY: t('Thứ Ba'),
      WEDNESDAY: t('Thứ Tư'),
      THURSDAY: t('Thứ Năm'),
      FRIDAY: t('Thứ Sáu'),
      SATURDAY: t('Thứ Bảy'),
      SUNDAY: t('Chủ Nhật')
    };
    return map[dayKey] || dayKey;
  };
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || 'ALL');
  const [workouts, setWorkouts] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState('ALL'); // 'ALL' | 'TRAINING_PLAN' | 'SINGLE'
  const [planActiveWeeks, setPlanActiveWeeks] = useState({}); // { [planId]: weekNumber }

  // Load enrolled classes on modal open
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledClasses();
      if (initialClassId) {
        setSelectedClassId(initialClassId);
      }
    } else {
      setSearchTerm('');
      setWorkoutTypeFilter('ALL');
    }
  }, [isOpen, initialClassId]);

  // Fetch workouts whenever selectedClassId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchWorkouts(selectedClassId);
    }
  }, [isOpen, selectedClassId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchEnrolledClasses = async () => {
    try {
      setLoadingClasses(true);
      const res = await axios.get(`${API_BASE}/enrolled-classes`, {
        headers: getAuthHeaders()
      });
      const data = res.data || [];
      setClasses(data);

      if (initialClassId && initialClassId !== 'ALL') {
        const classExists = data.some((c) => c.classId === initialClassId);
        if (classExists) {
          setSelectedClassId(initialClassId);
        } else {
          setSelectedClassId('ALL');
        }
      } else {
        setSelectedClassId('ALL');
      }
    } catch (err) {
      console.error('Error fetching enrolled classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const isPlanTrainingPlan = (p) => {
    if (!p) return false;
    // Rõ ràng SINGLE thì 100% không phải kế hoạch theo mốc
    if (p.planType === 'SINGLE') return false;
    // Rõ ràng TRAINING_PLAN thì 100% là kế hoạch theo mốc
    if (p.planType === 'TRAINING_PLAN') return true;
    // Fallback cho bản ghi cũ nếu thiếu planType: chỉ tính là mốc khi có nhiều hơn 1 tuần
    return Boolean(
      (p.totalWeeks && p.totalWeeks > 1) ||
      (Array.isArray(p.weeks) && p.weeks.length > 1)
    );
  };

  const fetchWorkouts = async (classId) => {
    try {
      setLoadingWorkouts(true);
      let res;
      if (classId === 'ALL') {
        res = await axios.get(`${API_BASE}/my-workouts`, {
          headers: getAuthHeaders()
        });
      } else {
        res = await axios.get(`${API_BASE}/classes/${classId}/workouts`, {
          headers: getAuthHeaders()
        });
      }
      const data = res.data || [];
      setWorkouts(data);

      // Initialize active week = 1 for any training plans
      const initialWeeks = {};
      data.forEach((p) => {
        if (isPlanTrainingPlan(p)) {
          initialWeeks[p.planId] = 1;
        }
      });
      setPlanActiveWeeks(initialWeeks);
    } catch (err) {
      console.error('Error fetching workouts for class:', err);
      setWorkouts([]);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.classId === selectedClassId);

  // Filter workouts by search term
  const searchedWorkouts = workouts.filter((plan) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchTitle = plan.title?.toLowerCase().includes(term);
    const matchGoal = plan.goal?.toLowerCase().includes(term);
    const matchNote = plan.note?.toLowerCase().includes(term);
    const matchCoach = plan.coachName?.toLowerCase().includes(term);
    const matchClass = plan.className?.toLowerCase().includes(term);
    const matchExercise = plan.exercises?.some(
      (ex) =>
        ex.exerciseName?.toLowerCase().includes(term) ||
        ex.muscleGroup?.toLowerCase().includes(term)
    );
    return matchTitle || matchGoal || matchNote || matchCoach || matchClass || matchExercise;
  });

  // Split into training plans and single workouts
  const trainingPlans = searchedWorkouts.filter(isPlanTrainingPlan);
  const singleWorkouts = searchedWorkouts.filter((p) => !isPlanTrainingPlan(p));

  // Filtered based on active tab
  const displayedWorkouts =
    workoutTypeFilter === 'TRAINING_PLAN'
      ? trainingPlans
      : workoutTypeFilter === 'SINGLE'
      ? singleWorkouts
      : searchedWorkouts;

  const totalAllWorkouts = classes.reduce(
    (sum, c) => sum + (parseInt(c.workoutsCount, 10) || 0),
    0
  );

  const handleSelectWeek = (planId, weekNum) => {
    setPlanActiveWeeks((prev) => ({
      ...prev,
      [planId]: weekNum
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===================== MODAL HEADER ===================== */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)]/90 sticky top-0 z-20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-sm shrink-0">
              <Dumbbell className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                  {t("Bài Tập & Lộ Trình Huấn Luyện")}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                  <Sparkles className="w-3 h-3" />
                  {t("Phân loại thông minh")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-1">
                {t("Tách biệt rõ ràng giữa kế hoạch tập luyện theo mốc tuần và các bài tập được giao 1 lần.")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all shrink-0 cursor-pointer"
            title={t("Đóng")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================== MODAL CONTENT ===================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden min-h-0">
          
          {/* ----------------- CỘT TRÁI: DANH SÁCH LỚP HỌC ----------------- */}
          <div className="lg:col-span-4 border-r border-[var(--border)] bg-[var(--surface-hover)]/40 p-4 sm:p-5 flex flex-col gap-3 overflow-y-auto max-h-[35vh] lg:max-h-none">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  {t("Lớp Học Đã Đăng Ký")}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                {classes.length} {t("lớp")}
              </span>
            </div>

            {loadingClasses ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t("Đang tải danh sách lớp học...")}
              </div>
            ) : classes.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">
                  {t("Bạn chưa có lớp học nào đã hoàn tất thanh toán. Chỉ những lớp đã thanh toán mới hiển thị bài tập từ HLV!")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* Option: Xem tất cả lớp */}
                <button
                  onClick={() => setSelectedClassId('ALL')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    selectedClassId === 'ALL'
                      ? 'bg-[var(--surface)] border-[var(--primary)] ring-2 ring-[var(--focus-ring)] shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedClassId === 'ALL'
                          ? 'bg-[var(--primary)] text-[color:var(--on-primary)]'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--text)] truncate">
                        {t("Tất Cả Lớp Học")}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] truncate">
                        {t("Xem toàn bộ giáo án đã nhận")}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
                    {totalAllWorkouts}
                  </span>
                </button>

                {/* Danh sách từng lớp */}
                {classes.map((cls) => {
                  const isSelected = selectedClassId === cls.classId;
                  const workoutsCount = parseInt(cls.workoutsCount, 10) || 0;

                  return (
                    <div
                      key={cls.classId}
                      onClick={() => setSelectedClassId(cls.classId)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                        isSelected
                          ? 'bg-[var(--surface)] border-[var(--primary)] ring-2 ring-[var(--focus-ring)] shadow-sm'
                          : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-hover)]/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs font-bold text-[var(--text)] leading-snug line-clamp-1">
                            {cls.className}
                          </h4>
                          {cls.subjectName && (
                            <span className="text-[10px] text-[var(--primary)] font-semibold">
                              {cls.subjectName}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            workoutsCount > 0
                              ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                              : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                          }`}
                        >
                          {workoutsCount} {t("bài")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
                        {cls.coachName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[var(--primary)]" />
                            {cls.coachName}
                          </span>
                        )}
                        {cls.roomName && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {cls.roomName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ----------------- CỘT PHẢI: CHI TIẾT GIÁO ÁN & KẾ HOẠCH BÀI TẬP ----------------- */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {/* Header thông tin lớp & Tìm kiếm */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                  {selectedClassId === 'ALL' ? t("Tất Cả Lớp Học") : t("Giáo Án Thuộc Lớp")}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                  {selectedClassId === 'ALL'
                    ? t("Tổng hợp bài tập các lớp bạn đã đăng ký")
                    : currentClass
                    ? currentClass.className
                    : t("Chi tiết bài tập")}
                </h3>
                {currentClass && currentClass.coachName && selectedClassId !== 'ALL' && (
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {t("Huấn luyện viên phụ trách:")} <strong className="text-[var(--text)]">{currentClass.coachName}</strong>
                  </span>
                )}
              </div>

              {/* Ô tìm kiếm bài tập */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("Tìm theo tên bài tập, nhóm cơ...")}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ================= TABS PHÂN TÁCH LOẠI BÀI TẬP (TRÁNH LẪN LỘN) ================= */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[var(--surface-hover)]/60 border border-[var(--border)] rounded-2xl">
              <button
                type="button"
                onClick={() => setWorkoutTypeFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  workoutTypeFilter === 'ALL'
                    ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {t("Tất Cả ({0})", [searchedWorkouts.length])}
              </button>

              <button
                type="button"
                onClick={() => setWorkoutTypeFilter('TRAINING_PLAN')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  workoutTypeFilter === 'TRAINING_PLAN'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>⭐ {t("Kế Hoạch Theo Mốc")}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  workoutTypeFilter === 'TRAINING_PLAN' ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                }`}>
                  {trainingPlans.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkoutTypeFilter('SINGLE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  workoutTypeFilter === 'SINGLE'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>⚡ {t("Bài Giao 1 Lần")}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  workoutTypeFilter === 'SINGLE' ? 'bg-black/20 text-black' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                }`}>
                  {singleWorkouts.length}
                </span>
              </button>
            </div>

            {/* Danh sách giáo án / kế hoạch */}
            {loadingWorkouts ? (
              <div className="py-20 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span>{t("Đang tải danh sách bài tập của lớp...")}</span>
              </div>
            ) : displayedWorkouts.length === 0 ? (
              <div className="p-10 sm:p-14 text-center rounded-2xl bg-[var(--surface-hover)]/30 border border-dashed border-[var(--border)] flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                  {workoutTypeFilter === 'TRAINING_PLAN' ? (
                    <Calendar className="w-7 h-7 text-purple-400" />
                  ) : (
                    <Dumbbell className="w-7 h-7 text-[var(--text-muted)]" />
                  )}
                </div>
                <h4 className="text-base font-bold text-[var(--text)]">
                  {searchTerm
                    ? t("Không tìm thấy bài tập phù hợp")
                    : workoutTypeFilter === 'TRAINING_PLAN'
                    ? t("Chưa Có Kế Hoạch Tập Luyện Nào Theo Mốc")
                    : workoutTypeFilter === 'SINGLE'
                    ? t("Chưa Có Bài Tập Nào Được Giao 1 Lần")
                    : t("Chưa Có Bài Tập Nào Được Giao")}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md">
                  {searchTerm
                    ? t("Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.")
                    : workoutTypeFilter === 'TRAINING_PLAN'
                    ? t("Huấn luyện viên chưa tạo lộ trình dài hạn theo mốc tuần cho bạn.")
                    : t("Giáo án sẽ tự động cập nhật ngay khi HLV gửi bài tập mới!")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {displayedWorkouts.map((plan, planIdx) => {
                  const isTrainingPlan = isPlanTrainingPlan(plan);
                  const activeWeek = planActiveWeeks[plan.planId] || 1;
                  const currentWeekGroup = plan.weeks?.find((w) => w.weekNumber === activeWeek);

                  const createdAtFormatted = plan.createdAt
                    ? new Date(plan.createdAt).toLocaleString(undefined, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : t("Gần đây");

                  return (
                    <div
                      key={plan.planId || planIdx}
                      className={`rounded-2xl border bg-[var(--surface)] shadow-sm hover:shadow-md transition-all overflow-hidden ${
                        isTrainingPlan
                          ? 'border-purple-500/40 ring-1 ring-purple-500/20'
                          : 'border-[var(--border)]'
                      }`}
                    >
                      {/* ================= PLAN HEADER ================= */}
                      <div className="p-4 sm:p-5 border-b border-[var(--border)]/70 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface-hover)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            {isTrainingPlan ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {t("Lộ trình {0} tuần", [plan.totalWeeks || 1])}
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                {t("Bài tập 1 lần")}
                              </span>
                            )}

                            <h4 className="text-base font-bold text-[var(--text)]">
                              {plan.title}
                            </h4>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                              {codeLabel(plan.status || 'ACTIVE')}
                            </span>

                            {plan.className && selectedClassId === 'ALL' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                                {plan.className}
                              </span>
                            )}
                          </div>

                          {/* Training Goal if available */}
                          {plan.goal && (
                            <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold">
                              <Target className="w-3.5 h-3.5 shrink-0" />
                              <span>{t("Mục tiêu:")} {plan.goal}</span>
                            </div>
                          )}

                          <div className="flex items-center flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                              {plan.coachName || t("Huấn luyện viên")}
                            </span>
                            <span>•</span>
                            {isTrainingPlan && plan.startDate ? (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <span>{plan.startDate} ➔ {plan.endDate || t("Chưa xác định")}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {createdAtFormatted}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)]">
                            {isTrainingPlan
                              ? `${plan.weeks?.length || plan.totalWeeks || 1} ${t("mốc tuần")} • ${plan.exercises?.length || 0} ${t("bài")}`
                              : `${plan.exercises?.length || 0} ${t("động tác")}`}
                          </span>
                        </div>
                      </div>

                      {/* Coach Note / Lời dặn */}
                      {plan.note && plan.note.trim() && (
                        <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-start gap-2.5 text-xs text-[var(--text-muted)] italic">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--primary)]" />
                          <div className="flex flex-col not-italic">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text)]">
                              {t("Lời dặn từ Huấn Luyện Viên:")}
                            </span>
                            <p className="mt-0.5 text-[var(--text-muted)] leading-relaxed italic">
                              "{plan.note}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ================= NỘI DUNG 1: KẾ HOẠCH THEO MỐC (TRAINING_PLAN) ================= */}
                      {isTrainingPlan ? (
                        <div className="p-4 sm:p-5 space-y-4">
                          {/* Week Milestone Selector */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-purple-400" />
                              <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                                {t("Chọn mốc tuần để xem bài tập:")}
                              </span>
                            </div>

                            {plan.weeks && plan.weeks.length > 0 && (
                              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                {plan.weeks.map((wk) => {
                                  const isSelected = activeWeek === wk.weekNumber;
                                  return (
                                    <button
                                      key={wk.weekNumber}
                                      type="button"
                                      onClick={() => handleSelectWeek(plan.planId, wk.weekNumber)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        isSelected
                                          ? 'bg-purple-600 text-white shadow-sm'
                                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)]'
                                      }`}
                                    >
                                      <span>{t("Tuần {0}", [wk.weekNumber])}</span>
                                      <span className="ml-1 text-[10px] opacity-80">
                                        ({wk.days?.length || 0} {t("buổi")})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Current Week Workout Days */}
                          {currentWeekGroup && currentWeekGroup.days && currentWeekGroup.days.length > 0 ? (
                            <div className="space-y-4">
                              {currentWeekGroup.days.map((dayGroup, dIdx) => (
                                <div
                                  key={dIdx}
                                  className="bg-[var(--surface-hover)]/40 border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-3"
                                >
                                  {/* Day Banner */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                                    <div className="flex items-center gap-2.5">
                                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-400 font-extrabold text-xs border border-purple-500/30">
                                        {getDayOfWeekLabel(dayGroup.dayOfWeek)}
                                      </span>
                                      <h5 className="font-extrabold text-sm text-[var(--text)]">
                                        {dayGroup.dayLabel || t("Buổi tập")}
                                      </h5>
                                    </div>
                                    <span className="text-[11px] text-[var(--text-muted)]">
                                      {dayGroup.exercises?.length || 0} {t("động tác")}
                                    </span>
                                  </div>

                                  {/* Table of Exercises for this Day */}
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">
                                          <th className="pb-2.5 pl-1 w-10">#</th>
                                          <th className="pb-2.5">{t("Động Tác / Bài Tập")}</th>
                                          <th className="pb-2.5 text-center">{t("Sets x Reps")}</th>
                                          <th className="pb-2.5 text-center">{t("Mức Tạ (kg)")}</th>
                                          <th className="pb-2.5 text-center">{t("Nghỉ Giữa Hiệp")}</th>
                                          <th className="pb-2.5 text-right pr-1">{t("Video")}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[var(--border)]/50">
                                        {dayGroup.exercises.map((ex, exIdx) => (
                                          <tr key={ex.detailId || exIdx} className="hover:bg-[var(--surface)]/80 transition-colors">
                                            <td className="py-3 pl-1 font-bold text-[var(--text-muted)] text-[11px]">
                                              {exIdx + 1}
                                            </td>
                                            <td className="py-3">
                                              <div className="flex flex-col">
                                                <span className="font-bold text-[var(--text)] text-xs sm:text-sm">
                                                  {ex.exerciseName}
                                                </span>
                                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5">
                                                  {ex.muscleGroup && (
                                                    <span className="text-[var(--primary)] font-semibold flex items-center gap-1">
                                                      <Flame className="w-2.5 h-2.5" />
                                                      {t(ex.muscleGroup)}
                                                    </span>
                                                  )}
                                                  {ex.coachNote && (
                                                    <span>• {t("Ghi chú:")} <em className="text-[var(--text)]">{ex.coachNote}</em></span>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                            <td className="py-3 text-center">
                                              <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--surface)] font-bold text-[var(--text)] border border-[var(--border)]">
                                                {ex.sets || 3} {t("Set")} x {ex.reps || 10} {t("Rep")}
                                              </span>
                                            </td>
                                            <td className="py-3 text-center">
                                              {ex.weightKg !== null && ex.weightKg !== undefined ? (
                                                <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-extrabold text-[11px] border border-amber-500/20">
                                                  {ex.weightKg} kg
                                                </span>
                                              ) : (
                                                <span className="text-[var(--text-muted)] font-semibold">-</span>
                                              )}
                                            </td>
                                            <td className="py-3 text-center">
                                              <span className="inline-block px-2 py-1 rounded-lg text-[var(--text-muted)] font-medium">
                                                {ex.restSeconds || 60}s
                                              </span>
                                            </td>
                                            <td className="py-3 text-right pr-1">
                                              {ex.videoUrl ? (
                                                <a
                                                  href={ex.videoUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[color:var(--on-primary)] font-semibold text-[11px] transition-all"
                                                  title={t("Xem video kỹ thuật")}
                                                >
                                                  <Video className="w-3.5 h-3.5" />
                                                  <span className="hidden sm:inline">{t("Video")}</span>
                                                  <ExternalLink className="w-3 h-3" />
                                                </a>
                                              ) : (
                                                <span className="text-[10px] text-[var(--text-muted)]">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                              {t("Tuần này không có buổi tập nào.")}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ================= NỘI DUNG 2: BÀI TẬP GIAO 1 LẦN (SINGLE) ================= */
                        <div className="p-4 sm:p-5">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">
                                  <th className="pb-2.5 pl-1 w-10">#</th>
                                  <th className="pb-2.5">{t("Động Tác / Bài Tập")}</th>
                                  <th className="pb-2.5 text-center">{t("Số Hiệp")}</th>
                                  <th className="pb-2.5 text-center">{t("Số Lần (Reps)")}</th>
                                  <th className="pb-2.5 text-center">{t("Nghỉ Giữa Hiệp")}</th>
                                  <th className="pb-2.5 text-right pr-1">{t("Hướng Dẫn")}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]/50">
                                {plan.exercises && plan.exercises.length > 0 ? (
                                  plan.exercises.map((ex, exIdx) => (
                                    <tr
                                      key={ex.detailId || exIdx}
                                      className="hover:bg-[var(--surface-hover)]/50 transition-colors"
                                    >
                                      <td className="py-3 pl-1 font-bold text-[var(--text-muted)] text-[11px]">
                                        {exIdx + 1}
                                      </td>
                                      <td className="py-3">
                                        <div className="flex flex-col">
                                          <span className="font-bold text-[var(--text)] text-xs sm:text-sm">
                                            {ex.exerciseName}
                                          </span>
                                          {ex.muscleGroup && (
                                            <span className="text-[10px] text-[var(--primary)] font-semibold flex items-center gap-1 mt-0.5">
                                              <Flame className="w-2.5 h-2.5" />
                                              {t(ex.muscleGroup)}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] font-bold text-[var(--text)]">
                                          {ex.sets || 3} {t("hiệp")}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className="inline-block px-2.5 py-1 rounded-lg bg-[var(--surface-hover)] font-bold text-[var(--text)]">
                                          {ex.reps || 10} {t("lần")}
                                        </span>
                                      </td>
                                      <td className="py-3 text-center">
                                        <span className="inline-block px-2 py-1 rounded-lg text-[var(--text-muted)] font-medium">
                                          {ex.restSeconds || 60}s
                                        </span>
                                      </td>
                                      <td className="py-3 text-right pr-1">
                                        {ex.videoUrl ? (
                                          <a
                                            href={ex.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-[color:var(--on-primary)] font-semibold text-[11px] transition-all"
                                            title={t("Xem video kỹ thuật")}
                                          >
                                            <Video className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">{t("Video")}</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        ) : (
                                          <span className="text-[10px] text-[var(--text-muted)]">
                                            -
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={6}
                                      className="py-4 text-center text-[var(--text-muted)] text-xs"
                                    >
                                      {t("Giáo án chưa có động tác cụ thể.")}
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===================== MODAL FOOTER ===================== */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span className="hidden sm:inline">
              {t("Kế hoạch tập luyện theo mốc giúp bạn theo dõi lộ trình dài hạn, trong khi bài tập 1 lần là nhiệm vụ hàng ngày.")}
            </span>
            <span className="sm:hidden">{t("Lộ trình & bài tập từ HLV.")}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            {t("Đóng")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberWorkoutsModal;
