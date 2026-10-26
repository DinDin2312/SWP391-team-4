import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Award,
  Star,
  User,
  Clock,
  MapPin,
  Calendar,
  X,
  Search,
  Sparkles,
  Layers,
  Heart,
  Scale,
  Ruler,
  Activity,
  MessageSquare,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  Info
} from 'lucide-react';
import { t, codeLabel, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore.js';

const API_BASE = 'http://localhost:8080/api/v1/member';

const MemberAssessmentsModal = ({ isOpen, onClose, initialClassId = null }) => {
  useLanguage();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || 'ALL');
  const [assessments, setAssessments] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load enrolled classes on modal open
  useEffect(() => {
    if (isOpen) {
      fetchEnrolledClasses();
      if (initialClassId) {
        setSelectedClassId(initialClassId);
      }
    } else {
      setSearchTerm('');
    }
  }, [isOpen, initialClassId]);

  // Fetch assessments whenever selectedClassId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAssessments(selectedClassId);
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
          setSelectedClassId(data.length > 0 ? data[0].classId : 'ALL');
        }
      } else if (!initialClassId && data.length > 0 && selectedClassId === 'ALL') {
        setSelectedClassId(data[0].classId);
      }
    } catch (err) {
      console.error('Error fetching enrolled classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchAssessments = async (classId) => {
    try {
      setLoadingAssessments(true);
      let res;
      if (classId === 'ALL') {
        res = await axios.get(`${API_BASE}/assessments`, {
          headers: getAuthHeaders()
        });
      } else {
        res = await axios.get(`${API_BASE}/classes/${classId}/assessments`, {
          headers: getAuthHeaders()
        });
      }
      setAssessments(res.data || []);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  };

  if (!isOpen) return null;

  const currentClass = classes.find((c) => c.classId === selectedClassId);

  // Filter assessments by search term
  const filteredAssessments = assessments.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchTitle = item.assessmentTitle?.toLowerCase().includes(term);
    const matchNote = item.feedbackNote?.toLowerCase().includes(term);
    const matchRec = item.recommendation?.toLowerCase().includes(term);
    const matchCoach = item.coachName?.toLowerCase().includes(term);
    const matchClass = item.className?.toLowerCase().includes(term);
    return matchTitle || matchNote || matchRec || matchCoach || matchClass;
  });

  const totalAllAssessments = classes.reduce(
    (sum, c) => sum + (parseInt(c.assessmentsCount, 10) || 0),
    0
  );

  // Helper for Rating Labels
  const getPerformanceLabel = (val) => {
    switch (val) {
      case 5: return { label: t('Xuất sắc'), color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      case 4: return { label: t('Tốt'), color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      case 3: return { label: t('Khá'), color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      case 2: return { label: t('Cần cải thiện'), color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' };
      default: return { label: t('Cần nỗ lực thêm'), color: 'text-red-500 bg-red-500/10 border-red-500/20' };
    }
  };

  const getAttendanceLabel = (val) => {
    switch (val) {
      case 5: return { label: t('Chuyên cần 100%'), color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      case 4: return { label: t('Đầy đủ'), color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' };
      case 3: return { label: t('Tương đối đều'), color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      default: return { label: t('Vắng một số buổi'), color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    }
  };

  // Helper for BMI calculation
  const getBmiStatus = (weight, height) => {
    if (!weight || !height || height <= 0) return null;
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    let statusText = t('Bình thường (Chuẩn)');
    let statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

    if (bmi < 18.5) {
      statusText = t('Hơi gầy');
      statusColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    } else if (bmi >= 23 && bmi < 25) {
      statusText = t('Thừa cân nhẹ');
      statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else if (bmi >= 25) {
      statusText = t('Cần giảm cân');
      statusColor = 'text-red-500 bg-red-500/10 border-red-500/20';
    }

    return { bmi, statusText, statusColor };
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
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text)]">
                  {t('Đánh Giá Từ Huấn Luyện Viên')}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  {t('Tiến độ tập luyện')}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-1">
                {t('Xem nhận xét chi tiết, chỉ số thể chất và lời khuyên định hướng từ HLV theo từng lớp học.')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all shrink-0"
            title={t('Đóng')}
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
                <Layers className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  {t('Lớp Học Đã Đăng Ký')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                {classes.length} {t('lớp')}
              </span>
            </div>

            {loadingClasses ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t('Đang tải danh sách lớp học...')}
              </div>
            ) : classes.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] flex flex-col items-center gap-2">
                <BookOpen className="w-8 h-8 text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)]">
                  {t('Bạn chưa có lớp học nào đã hoàn tất đăng ký.')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {/* Option: Xem tất cả lớp */}
                <button
                  onClick={() => setSelectedClassId('ALL')}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    selectedClassId === 'ALL'
                      ? 'bg-[var(--surface)] border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedClassId === 'ALL'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-[var(--text)] truncate">
                        {t('Tất Cả Lớp Học')}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] truncate">
                        {t('Tổng hợp toàn bộ đánh giá từ HLV')}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    {totalAllAssessments}
                  </span>
                </button>

                {/* Danh sách từng lớp */}
                {classes.map((cls) => {
                  const isSelected = selectedClassId === cls.classId;
                  const assessmentsCount = parseInt(cls.assessmentsCount, 10) || 0;

                  return (
                    <div
                      key={cls.classId}
                      onClick={() => setSelectedClassId(cls.classId)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 relative ${
                        isSelected
                          ? 'bg-[var(--surface)] border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                          : 'bg-[var(--surface)] border-[var(--border)] hover:border-amber-500/50 hover:bg-[var(--surface-hover)]/80'
                      }`}
                    >
                      {/* Class Title & Count badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col min-w-0">
                          <h4 className="text-xs font-bold text-[var(--text)] leading-snug line-clamp-1">
                            {cls.className}
                          </h4>
                          {cls.subjectName && (
                            <span className="text-[10px] text-amber-500 font-semibold">
                              {cls.subjectName}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                            assessmentsCount > 0
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          {assessmentsCount} {t('đánh giá')}
                        </span>
                      </div>

                      {/* Coach & Room info */}
                      <div className="grid grid-cols-1 gap-1 text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]/60">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{cls.coachName || t('Chưa phân HLV')}</span>
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

          {/* ----------------- CỘT PHẢI: CHI TIẾT ĐÁNH GIÁ ----------------- */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {/* Header thông tin lớp đang xem */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                    {selectedClassId === 'ALL' ? t('Tất Cả Lớp Học') : t('Đánh Giá Thuộc Lớp')}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] truncate">
                  {selectedClassId === 'ALL'
                    ? t('Tổng hợp đánh giá từ các Huấn luyện viên')
                    : currentClass
                    ? currentClass.className
                    : t('Chi tiết đánh giá')}
                </h3>
                {currentClass && currentClass.coachName && selectedClassId !== 'ALL' && (
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    {t('Huấn luyện viên phụ trách:')} <strong className="text-[var(--text)]">{currentClass.coachName}</strong>
                  </span>
                )}
              </div>

              {/* Ô tìm kiếm đánh giá */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('Tìm theo tiêu đề, nhận xét, lời khuyên...')}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-all"
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

            {/* Danh sách các đánh giá */}
            {loadingAssessments ? (
              <div className="py-20 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span>{t('Đang tải danh sách đánh giá từ Huấn luyện viên...')}</span>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="p-10 sm:p-14 text-center rounded-2xl bg-[var(--surface-hover)]/30 border border-dashed border-[var(--border)] flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                  <Award className="w-7 h-7 text-amber-500/70" />
                </div>
                <h4 className="text-base font-bold text-[var(--text)]">
                  {searchTerm
                    ? t('Không tìm thấy đánh giá phù hợp với từ khóa')
                    : t('Chưa Có Đánh Giá Nào')}
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md">
                  {searchTerm
                    ? t('Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.')
                    : t('Huấn luyện viên phụ trách sẽ gửi nhận xét, chỉ số thể lực và lời khuyên sau các buổi tập luyện của bạn!')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredAssessments.map((item) => {
                  const createdDate = item.createdAt ? new Date(item.createdAt) : null;
                  const dateStr = createdDate
                    ? createdDate.toLocaleDateString(locale(), {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : '';
                  const timeStr = createdDate
                    ? createdDate.toLocaleTimeString(locale(), {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : '';

                  const isSelf = item.assessmentTitle?.includes('tự') || 
                                 item.assessmentTitle?.includes('Self') || 
                                 item.coachId === item.userId;

                  const perfInfo = getPerformanceLabel(item.performanceRating);
                  const attInfo = getAttendanceLabel(item.attendanceRating);
                  const bmiInfo = getBmiStatus(item.weight, item.height);

                  const hasMetrics = item.weight || item.height || item.bodyFatPercentage || item.muscleMass;

                  return (
                    <div
                      key={item.assessmentId}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
                    >
                      {/* Assessment Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 pb-3 border-b border-[var(--border)]">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              {isSelf ? <Scale className="w-3 h-3" /> : <Award className="w-3 h-3" />}
                              {isSelf ? t('Hội viên tự ghi nhận') : (item.className || t('Đánh giá buổi tập'))}
                            </span>
                            {!isSelf && item.planTitle && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                                {t('Giáo án:')} {item.planTitle}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">
                            {item.assessmentTitle || (isSelf ? t('Tự ghi nhận thể trạng cá nhân') : t('Đánh giá tiến độ buổi tập'))}
                          </h4>
                        </div>

                        {/* Date badge */}
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] shrink-0 bg-[var(--surface-hover)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{timeStr} • {dateStr}</span>
                        </div>
                      </div>

                      {/* Coach info bar */}
                      <div className="flex items-center justify-between text-xs py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs">
                            {isSelf ? <Scale className="w-3.5 h-3.5 text-amber-500" /> : (item.coachName ? item.coachName.charAt(0).toUpperCase() : 'H')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[var(--text)] font-semibold">
                              {isSelf ? t('Chính bạn (Tự đo)') : (item.coachName || t('Huấn luyện viên'))}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {isSelf ? t('Ghi nhận InBody cá nhân') : (item.coachEmail || '')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ratings Section - only if evaluated by Coach */}
                      {!isSelf && (item.performanceRating || item.attendanceRating) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {item.performanceRating && (
                            <div className="p-3 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                                  {t('Thể lực & Kỹ thuật')}
                                </span>
                                {perfInfo && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${perfInfo.color}`}>
                                    {perfInfo.label}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 pt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= item.performanceRating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-[var(--border)]'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs font-bold text-[var(--text)] ml-1.5">
                                  {item.performanceRating}/5
                                </span>
                              </div>
                            </div>
                          )}

                          {item.attendanceRating && (
                            <div className="p-3 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  {t('Chuyên cần & Thái độ')}
                                </span>
                                {attInfo && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${attInfo.color}`}>
                                    {attInfo.label}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 pt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= item.attendanceRating
                                        ? 'text-emerald-400 fill-emerald-400'
                                        : 'text-[var(--border)]'
                                    }`}
                                  />
                                ))}
                                <span className="text-xs font-bold text-[var(--text)] ml-1.5">
                                  {item.attendanceRating}/5
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body Metrics Grid (if present) */}
                      {hasMetrics && (
                        <div className="p-3 sm:p-4 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-amber-500" />
                              {t('Chỉ Số Thể Hình & Đo Lường')}
                            </span>
                            {bmiInfo && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bmiInfo.statusColor}`}>
                                BMI: {bmiInfo.bmi} • {bmiInfo.statusText}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {item.weight && (
                              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">{t('Cân nặng')}</span>
                                <span className="text-sm font-bold text-[var(--text)] mt-0.5">{item.weight} kg</span>
                              </div>
                            )}
                            {item.height && (
                              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">{t('Chiều cao')}</span>
                                <span className="text-sm font-bold text-[var(--text)] mt-0.5">{item.height} cm</span>
                              </div>
                            )}
                            {item.bodyFatPercentage && (
                              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">{t('Tỷ lệ mỡ (Fat)')}</span>
                                <span className="text-sm font-bold text-amber-500 mt-0.5">{item.bodyFatPercentage}%</span>
                              </div>
                            )}
                            {item.muscleMass && (
                              <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex flex-col">
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">{t('Khối lượng cơ')}</span>
                                <span className="text-sm font-bold text-emerald-500 mt-0.5">{item.muscleMass} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Feedback Note */}
                      {item.feedbackNote && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                            {isSelf ? t('Ghi chú & Mục tiêu cá nhân') : t('Nhận xét chi tiết từ Huấn luyện viên')}
                          </span>
                          <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap pl-1 italic">
                            "{item.feedbackNote}"
                          </p>
                        </div>
                      )}

                      {/* Coach Recommendation */}
                      {!isSelf && item.recommendation && (
                        <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                            {t('Lời khuyên & Định hướng tập luyện tiếp theo')}
                          </span>
                          <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap pl-1">
                            {item.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberAssessmentsModal;
