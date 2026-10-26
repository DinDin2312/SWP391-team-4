import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import {
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  LogOut,
  Calendar,
  Sparkles,
  Check,
  Dumbbell,
  Phone,
  Mail,
  User,
  ShieldCheck,
} from 'lucide-react';
import receptionistService from '../services/receptionistService';
import { AuthContext } from '../../../context/AuthContext';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CoachCheckInTab = () => {
  useLanguage();
  const { userInfo } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Note modal state for check-in
  const [confirmModalItem, setConfirmModalItem] = useState(null);
  const [checkInNote, setCheckInNote] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchCoachSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await receptionistService.getCoachSchedules({
        date: selectedDate,
        keyword,
        status: statusFilter,
      });
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSchedules(list);
    } catch (err) {
      console.error('Error fetching coach schedules:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, keyword, statusFilter]);

  useEffect(() => {
    fetchCoachSchedules();
  }, [fetchCoachSchedules]);

  // Statistics
  const stats = useMemo(() => {
    const total = schedules.length;
    const checkedIn = schedules.filter((s) => s.checkInStatus === 'CHECKED_IN').length;
    const completed = schedules.filter((s) => s.checkInStatus === 'COMPLETED').length;
    const pending = schedules.filter((s) => s.checkInStatus === 'PENDING').length;
    return { total, checkedIn, completed, pending };
  }, [schedules]);

  const handleOpenCheckIn = (item) => {
    setConfirmModalItem(item);
    setCheckInNote('');
    setFeedbackMsg(null);
  };

  const handleConfirmCheckIn = async () => {
    if (!confirmModalItem) return;
    try {
      setActionLoadingId(confirmModalItem.scheduleId);
      await receptionistService.checkInCoach({
        coachId: confirmModalItem.coachId,
        scheduleId: confirmModalItem.scheduleId,
        note: checkInNote.trim() || undefined,
        receptionistEmail: userInfo?.email || 'receptionist@sport.com',
      });
      setFeedbackMsg({ type: 'success', text: t('Check-in Huấn luyện viên thành công!') });
      setTimeout(() => {
        setConfirmModalItem(null);
        setFeedbackMsg(null);
        fetchCoachSchedules();
      }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || t('Có lỗi xảy ra khi Check-in HLV!');
      setFeedbackMsg({ type: 'error', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (checkInId) => {
    if (!checkInId) return;
    try {
      setActionLoadingId(checkInId);
      await receptionistService.checkOutCoach(checkInId);
      fetchCoachSchedules();
    } catch (err) {
      console.error('Error checking out coach:', err);
      alert(err.response?.data || t('Lỗi khi Check-out HLV!'));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--text-muted)]">{t('Tổng ca dạy trong ngày')}</span>
            <span className="text-2xl font-black text-[var(--text)] mt-1">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Checked-In */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--text-muted)]">{t('HLV Đã Có Mặt')}</span>
            <span className="text-2xl font-black text-emerald-500 mt-1">{stats.checkedIn}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--text-muted)]">{t('Chờ Check-in (Chưa đến)')}</span>
            <span className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--text-muted)]">{t('Đã Hoàn Thành Ca')}</span>
            <span className="text-2xl font-black text-[var(--text-muted)] mt-1">{stats.completed}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Bar: Date, Search, Status Filter */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)]">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-[var(--text)] text-xs cursor-pointer"
            />
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('Tìm HLV, SĐT, tên lớp...')}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold">
            {[
              { key: 'ALL', label: t('Tất cả') },
              { key: 'PENDING', label: t('Chưa đến') },
              { key: 'CHECKED_IN', label: t('Đã có mặt') },
              { key: 'COMPLETED', label: t('Đã xong') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[var(--primary)] text-[color:var(--on-primary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchCoachSchedules}
            disabled={loading}
            className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] transition-all cursor-pointer"
            title={t('Làm mới')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Coach Schedule List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>{t('Đang tải danh sách ca dạy của Huấn luyện viên...')}</span>
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--text)]">{t('Không có ca dạy nào phù hợp')}</h4>
          <p className="text-xs text-[var(--text-muted)] max-w-md">
            {t('Không tìm thấy ca dạy nào của Huấn luyện viên trong ngày hoặc theo bộ lọc hiện tại.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((item) => {
            const startTimeStr = item.startTime ? item.startTime.substring(11, 16) : '--:--';
            const endTimeStr = item.endTime ? item.endTime.substring(11, 16) : '--:--';
            const checkInTimeStr = item.checkInTime ? item.checkInTime.substring(11, 16) : null;
            const checkOutTimeStr = item.checkOutTime ? item.checkOutTime.substring(11, 16) : null;

            const isPending = item.checkInStatus === 'PENDING';
            const isCheckedIn = item.checkInStatus === 'CHECKED_IN';
            const isCompleted = item.checkInStatus === 'COMPLETED';

            const initials = item.coachName
              ? item.coachName
                  .split(' ')
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(-2)
                  .join('')
                  .toUpperCase()
              : 'HL';

            return (
              <div
                key={item.scheduleId}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-[var(--surface)] shadow-sm hover:shadow-md ${
                  isCheckedIn
                    ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                    : isCompleted
                    ? 'border-[var(--border)] opacity-80'
                    : 'border-amber-500/30'
                }`}
              >
                {/* Header: Class & Room */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      <span>{item.className}</span>
                    </span>

                    {/* Status Badge */}
                    {isPending && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{t('Chưa đến')}</span>
                      </span>
                    )}
                    {isCheckedIn && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{t('Đã có mặt')}</span>
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('Đã kết thúc ca')}</span>
                      </span>
                    )}
                  </div>

                  {/* Coach Info Box */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-[var(--text)] truncate">{item.coachName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] mt-0.5">
                        {item.coachPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {item.coachPhone}
                          </span>
                        )}
                        {item.coachEmail && (
                          <span className="flex items-center gap-1 truncate max-w-[150px]">
                            <Mail className="w-3 h-3" />
                            {item.coachEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Details */}
                <div className="p-3 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      {t('Khung giờ dạy:')}
                    </span>
                    <strong className="text-[var(--text)] font-semibold">
                      {startTimeStr} - {endTimeStr}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {t('Phòng học:')}
                    </span>
                    <strong className="text-[var(--text)] font-semibold truncate max-w-[160px]">
                      {item.roomName}
                    </strong>
                  </div>

                  {/* Checkin Log details if present */}
                  {checkInTimeStr && (
                    <div className="pt-1.5 mt-1 border-t border-[var(--border)] flex flex-col gap-0.5 text-[11px]">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>{t('Check-in:')} {checkInTimeStr}</span>
                        {item.checkedInBy && (
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">
                            {item.checkedInBy}
                          </span>
                        )}
                      </div>
                      {checkOutTimeStr && (
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {t('Check-out lúc:')} {checkOutTimeStr}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[10px] italic text-[var(--text-muted)] mt-0.5">
                          "{item.note}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-1">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleOpenCheckIn(item)}
                      disabled={actionLoadingId === item.scheduleId}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{t('Xác nhận HLV Có Mặt')}</span>
                    </button>
                  )}

                  {isCheckedIn && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center border border-emerald-500/20">
                        {t('Đang trong ca dạy')}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCheckOut(item.checkInId)}
                        disabled={actionLoadingId === item.checkInId}
                        className="px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all border border-[var(--border)] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title={t('Hoàn thành ca dạy & Check-out')}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('Check-out')}</span>
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="w-full py-2 rounded-xl bg-[var(--surface-hover)] text-[var(--text-muted)] text-xs font-semibold text-center border border-[var(--border)]">
                      {t('Ca dạy đã hoàn thành')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Check-in */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="text-base font-bold text-[var(--text)]">{t('Xác nhận Check-in Huấn luyện viên')}</h3>
                <p className="text-xs text-[var(--text-muted)]">{t('Ghi nhận giờ có mặt của HLV trước ca dạy')}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t('Huấn luyện viên:')}</span>
                <strong className="text-[var(--text)] font-semibold">{confirmModalItem.coachName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t('Lớp học:')}</span>
                <strong className="text-[var(--text)] font-semibold">{confirmModalItem.className}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t('Khung giờ:')}</span>
                <strong className="text-[var(--text)] font-semibold">
                  {confirmModalItem.startTime?.substring(11, 16)} - {confirmModalItem.endTime?.substring(11, 16)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t('Phòng tập:')}</span>
                <strong className="text-[var(--text)] font-semibold">{confirmModalItem.roomName}</strong>
              </div>
            </div>

            {/* Note Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--text)]">
                {t('Ghi chú của Lễ tân (Tùy chọn):')}
              </label>
              <input
                type="text"
                value={checkInNote}
                onChange={(e) => setCheckInNote(e.target.value)}
                placeholder={t('Ví dụ: Đã bàn giao chìa khóa phòng, mic trợ giảng...')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Feedback alert */}
            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}
              >
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalItem(null)}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--border)] text-[var(--text)] text-xs font-semibold transition-all cursor-pointer"
              >
                {t('Hủy')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckIn}
                disabled={actionLoadingId !== null}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {actionLoadingId !== null ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{t('Xác nhận Có Mặt')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachCheckInTab;
