import React, { useState, useEffect } from 'react';
import { 
  X, ArrowRightLeft, Calendar, Clock, MapPin, User, AlertTriangle, 
  CheckCircle2, AlertCircle, Loader2, ArrowRight, Check, ShieldCheck 
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney, formatDateTime } from '../../../utils/displayFormat';
import memberService from '../services/memberService';

const TransferClassModal = ({ isOpen, classId, onClose, onSuccess }) => {
  useLanguage();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen && classId) {
      loadPreview(classId);
    } else {
      setPreview(null);
      setError('');
      setSelectedTargetId(null);
      setSubmitting(false);
      setSuccessResult(null);
    }
  }, [isOpen, classId]);

  const loadPreview = async (id) => {
    try {
      setLoading(true);
      setError('');
      setSelectedTargetId(null);
      setSuccessResult(null);
      const res = await memberService.getTransferClassPreview(id);
      setPreview(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to load class transfer preview.'));
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!classId || !selectedTargetId || submitting) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await memberService.transferClassDirectly(classId, selectedTargetId);
      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to transfer class.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedTargetClass = preview?.equivalentClasses?.find(c => c.classId === selectedTargetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden text-on-surface">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-container/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                {t('Chuyển lớp học')}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {t('Đổi sang lớp học tương đương đồng giá và chưa khai giảng')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">{t('Đang kiểm tra lớp học & lịch đối chiếu...')}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">{t(error)}</div>
            </div>
          )}

          {/* Success State */}
          {!loading && successResult && (
            <div className="flex flex-col items-center text-center py-8 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-on-surface">
                {t('Chuyển lớp học thành công!')}
              </h4>
              <p className="text-sm text-on-surface-variant max-w-md">
                {t('Bạn đã chuyển thành công từ lớp')}{' '}
                <strong className="text-on-surface">{successResult.fromClassName}</strong>{' '}
                {t('sang lớp')}{' '}
                <strong className="text-primary">{successResult.toClassName}</strong>.
              </p>

              <div className="w-full max-w-md p-4 rounded-xl bg-surface-container border border-border text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('Lớp học mới:')}</span>
                  <span className="font-semibold text-on-surface">{successResult.toClassName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">{t('Tổng số buổi:')}</span>
                  <span className="font-semibold text-on-surface">{successResult.totalSessions} {t('buổi')}</span>
                </div>
                {successResult.requestId && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">{t('Mã phiếu đối soát:')}</span>
                    <span className="font-semibold text-primary">#{successResult.requestId}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-on-surface-variant">{t('Học phí điều chỉnh:')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">0 ₫ ({t('Đồng giá')})</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 shadow-md transition-all"
                >
                  {t('Xem lịch tập mới')}
                </button>
              </div>
            </div>
          )}

          {/* Normal View: Current Class + Equivalent Classes */}
          {!loading && !successResult && preview && (
            <>
              {/* Current Class Box */}
              <div className="p-4 rounded-xl bg-surface-container border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {t('Lớp học hiện tại của bạn')}
                  </span>
                  {preview.canTransfer ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t('Chưa bắt đầu · Đủ điều kiện chuyển')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('Đã khai giảng')}
                    </span>
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-on-surface">
                      {preview.className}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-1">
                      {preview.subjectName && <span>{t('Bộ môn:')} <strong>{preview.subjectName}</strong></span>}
                      {preview.coachName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{preview.coachName}</span>}
                      {preview.roomName && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{preview.roomName}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-on-surface-variant block">{t('Học phí:')}</span>
                    <span className="text-base font-extrabold text-primary">{formatMoney(preview.classPrice)}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{t('Khai giảng:')} {formatDateTime(preview.firstSessionTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{t('Lịch học:')} {preview.schedulePattern || 'Theo lịch'} ({preview.totalSessions} {t('buổi')})</span>
                  </div>
                </div>

                {!preview.canTransfer && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{preview.message}</span>
                  </div>
                )}
              </div>

              {/* Equivalent Classes Section */}
              {preview.canTransfer && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface">
                        {t('Chọn lớp học tương đương để chuyển sang')}
                      </h4>
                      <p className="text-xs text-on-surface-variant">
                        {t('Danh sách các lớp đồng giá')} ({formatMoney(preview.classPrice)}) {t('chưa khai giảng và không trùng lịch học')}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                      {preview.equivalentClasses?.length || 0} {t('lớp khả dụng')}
                    </span>
                  </div>

                  {(!preview.equivalentClasses || preview.equivalentClasses.length === 0) ? (
                    <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-surface-container/30 text-on-surface-variant text-sm">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">{t('Hiện tại không có lớp học nào khác cùng mức giá chưa khai giảng.')}</p>
                      <p className="text-xs mt-1 text-on-surface-variant/80">
                        {t('Vui lòng thử lại sau hoặc liên hệ Lễ tân nếu bạn muốn bảo lưu/hủy lớp.')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {preview.equivalentClasses.map((item) => {
                        const isSelected = selectedTargetId === item.classId;
                        const canSelect = item.canSelect;

                        return (
                          <div
                            key={item.classId}
                            onClick={() => {
                              if (canSelect) setSelectedTargetId(item.classId);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                              !canSelect
                                ? 'bg-surface-container/30 border-border/60 opacity-70 cursor-not-allowed'
                                : isSelected
                                ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm'
                                : 'bg-surface border-border hover:border-primary/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="text-sm font-bold text-on-surface truncate">
                                    {item.className}
                                  </h5>
                                  {item.subjectName && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                                      {item.subjectName}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant mb-2">
                                  {item.coachName && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {item.coachName}
                                    </span>
                                  )}
                                  {item.roomName && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {item.roomName}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.schedulePattern || 'Theo lịch'} ({item.totalSessions} {t('buổi')})
                                  </span>
                                  <span>
                                    {t('Chỗ:')} <strong>{item.bookedSlots}/{item.maxSlots}</strong>
                                  </span>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  {canSelect && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      <Check className="w-3.5 h-3.5" />
                                      {t('Không trùng lịch · Còn')} {item.maxSlots - item.bookedSlots} {t('chỗ')}
                                    </span>
                                  )}

                                  {item.hasConflict && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                      {item.conflictDetail || t('Trùng lịch với lớp khác')}
                                    </span>
                                  )}

                                  {item.isFull && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      {t('Đã hết chỗ trống')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Radio selector */}
                              <div className="shrink-0 pt-0.5">
                                <div
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                    !canSelect
                                      ? 'border-border bg-surface-container'
                                      : isSelected
                                      ? 'border-primary bg-primary text-white'
                                      : 'border-outline-variant hover:border-primary'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!loading && !successResult && preview?.canTransfer && (
          <div className="px-6 py-4 border-t border-border bg-surface-container/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-on-surface-variant text-center sm:text-left">
              {selectedTargetClass ? (
                <span>
                  {t('Sẽ chuyển sang:')} <strong className="text-primary">{selectedTargetClass.className}</strong>
                  <span className="ml-2 font-semibold text-emerald-600 dark:text-emerald-400">(0 ₫ chênh lệch)</span>
                </span>
              ) : (
                <span>{t('Vui lòng chọn 1 lớp học tương đương để tiếp tục')}</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-semibold text-xs transition-colors"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={!selectedTargetId || submitting}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('Đang xử lý...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('Xác nhận chuyển lớp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferClassModal;
