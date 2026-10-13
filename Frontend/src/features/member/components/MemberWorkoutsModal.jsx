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
  Video
} from 'lucide-react';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';

const API_BASE = 'http://localhost:8080/api/v1/member';

const MemberWorkoutsModal = ({ isOpen, onClose, initialClassId = null }) => {
  useLanguage();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || 'ALL');
  const [workouts, setWorkouts] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  // Load enrolled classes on modal open
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledClasses();
      if (initialClassId) {
        setSelectedClassId(initialClassId);
      }
    } else {
      setSearchTerm('');
      setActiveVideoUrl(null);
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
        if (activeVideoUrl) {
          setActiveVideoUrl(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeVideoUrl, onClose]);

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

      // If no initialClassId was provided and we have classes, default to the first class or keep 'ALL'
      if (!initialClassId && data.length > 0 && selectedClassId === 'ALL') {
        setSelectedClassId(data[0].classId);
      }
    } catch (err) {
      console.error('Error fetching enrolled classes:', err);
    } finally {
      setLoadingClasses(false);
    }
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
      setWorkouts(res.data || []);
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
  const filteredWorkouts = workouts.filter((plan) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchTitle = plan.title?.toLowerCase().includes(term);
    const matchNote = plan.note?.toLowerCase().includes(term);
    const matchCoach = plan.coachName?.toLowerCase().includes(term);
    const matchClass = plan.className?.toLowerCase().includes(term);
    const matchExercise = plan.exercises?.some(
      (ex) =>
        ex.exerciseName?.toLowerCase().includes(term) ||
        ex.muscleGroup?.toLowerCase().includes(term)
    );
    return matchTitle || matchNote || matchCoach || matchClass || matchExercise;
  });

  const totalAllWorkouts = classes.reduce(
    (sum, c) => sum + (parseInt(c.workoutsCount, 10) || 0),
    0
  );

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
                  {t("Bài Tập Huấn Luyện Viên Giao")}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20">
                  <Sparkles className="w-3 h-3" />
                  {t("Cá nhân hóa")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-1">
                {t("Xem và theo dõi giáo án chi tiết theo từng lớp học đã đăng ký, không bị lẫn lộn.")}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all shrink-0"
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
                  {t("Bạn chưa đăng ký lớp học nào. Hãy đăng ký lớp để nhận bài tập từ HLV!")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* Option: Xem tất cả lớp */}
                <button
                  onClick={() => setSelectedClassId('ALL')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
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
                      {/* Class Title & Count badge */}
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
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                            workoutsCount > 0
                              ? 'bg-[var(--success-soft)] text-[var(--success-text)]'
                              : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                          }`}
                        >
                          <Flame className="w-3 h-3" />
                          {workoutsCount} {t("bài")}
                        </span>
                      </div>

                      {/* Coach & Room info */}
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-[var(--primary)] shrink-0" />
                          <span className="truncate">{cls.coachName || t("Chưa phân HLV")}</span>
                        </div>
                        {cls.roomName && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                            <span className="truncate">{cls.roomName}</span>
                          </div>
                        )}
                        {cls.schedulePattern && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                            <span className="truncate">{cls.schedulePattern}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ----------------- CỘT PHẢI: CHI TIẾT GIÁO ÁN BÀI TẬP ----------------- */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {/* Header thông tin lớp đang xem */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
                    {selectedClassId === 'ALL' ? t("Tất Cả Lớp Học") : t("Giáo Án Thuộc Lớp")}
                  </span>
                </div>
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
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách giáo án */}
            {loadingWorkouts ? (
              <div className="py-20 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span>{t("Đang tải danh sách bài tập của lớp...")}</span>
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="p-10 sm:p-14 text-center rounded-2xl bg-[var(--surface-hover)]/30 border border-dashed border-[var(--border)] flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                  <Dumbbell className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-[var(--text)]">
                  {searchTerm
                    ? t("Không tìm thấy bài tập phù hợp")
                    : t("Chưa Có Bài Tập Nào Được Giao")}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md">
                  {searchTerm
                    ? t("Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.")
                    : selectedClassId === 'ALL'
                    ? t("Bạn chưa có bài tập nào được giao từ các lớp học.")
                    : t("Huấn luyện viên chưa giao giáo án cho lớp này. Giáo án sẽ tự động cập nhật ngay khi HLV gửi!")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filteredWorkouts.map((plan, planIdx) => {
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
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      {/* Plan Header */}
                      <div className="p-4 sm:p-5 border-b border-[var(--border)]/70 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)] to-[var(--surface-hover)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
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
                          <div className="flex items-center flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                              {plan.coachName || t("Huấn luyện viên")}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {createdAtFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]">
                            {plan.exercises?.length || 0} {t("động tác")}
                          </span>
                        </div>
                      </div>

                      {/* Coach Note / Lời dặn */}
                      {plan.note && plan.note.trim() && (
                        <div className="mx-4 sm:mx-5 mt-4 p-3.5 rounded-xl bg-[var(--warning-soft)]/40 border border-[var(--warning-soft)] flex items-start gap-2.5 text-xs text-[var(--warning-text)]">
                          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[var(--warning)]" />
                          <div className="flex flex-col">
                            <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--warning-text)]">
                              {t("Lời dặn từ Huấn Luyện Viên:")}
                            </span>
                            <p className="mt-0.5 text-[var(--text)] leading-relaxed">
                              {plan.note}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Exercise Details Table */}
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
                                            {ex.muscleGroup}
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
              {t("Mỗi lớp học có giáo án riêng biệt từ Huấn luyện viên phụ trách để tối ưu hiệu quả rèn luyện.")}
            </span>
            <span className="sm:hidden">{t("Giáo án cá nhân theo từng lớp học.")}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-bold transition-all shrink-0"
          >
            {t("Đóng")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberWorkoutsModal;
