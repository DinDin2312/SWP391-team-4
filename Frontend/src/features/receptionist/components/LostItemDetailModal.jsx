import React, { useState } from 'react';
import {
  X, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock,
  User, Phone, CreditCard, Tag, Box, AlertTriangle, Trash2,
  ExternalLink, ZoomIn, Eye, EyeOff
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';

const LostItemDetailModal = ({ isOpen, item, onClose, onOpenClaim, onOpenDispose, onDelete }) => {
  useLanguage();

  const [showSecret, setShowSecret] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!isOpen || !item) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const formatShortDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'STORED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('Đang lưu kho')}
          </span>
        );
      case 'CLAIMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('Đã bàn giao')}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t('Quá hạn lưu trữ')}
          </span>
        );
      case 'DISPOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            {t('Đã thanh lý / Tiêu hủy')}
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const getValuationBadge = (type) => {
    if (type === 'HIGH_VALUE') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
          💎 {t('Giá trị cao')}
        </span>
      );
    }
    if (type === 'PERISHABLE') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20">
          🥗 {t('Đồ dễ hỏng (48h)')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
        📦 {t('Tiêu chuẩn')}
      </span>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] font-bold">
                  {item.itemCode}
                </span>
                {getStatusBadge(item.status)}
                {getValuationBadge(item.valuationType)}
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mt-1.5">{item.itemName}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Image Preview Card */}
            {item.imageUrl ? (
              <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-[var(--border)] bg-black/5 group">
                <img
                  src={item.imageUrl}
                  alt={item.itemName}
                  className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setLightboxOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  {t('Phóng to ảnh')}
                </button>
              </div>
            ) : (
              <div className="w-full h-36 rounded-2xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--surface-hover)]/20">
                <Box className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-xs">{t('Chưa có hình ảnh chụp lúc tiếp nhận')}</span>
              </div>
            )}

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border)]">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {t('Vị trí cất giữ')}
                </div>
                <div className="text-xs font-bold text-[var(--text)] truncate">{item.storageLocation}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border)]">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  {t('Nơi nhặt được')}
                </div>
                <div className="text-xs font-bold text-[var(--text)] truncate">{item.foundLocation}</div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border)]">
                <div className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {t('Hạn lưu trữ')}
                </div>
                <div className="text-xs font-bold text-[var(--text)]">
                  {formatShortDate(item.expiryDate)}
                  {item.status === 'STORED' && (
                    <span className="text-[10px] text-[var(--text-muted)] block font-normal">
                      ({item.daysUntilExpiry >= 0 ? `Còn ${item.daysUntilExpiry} ngày` : 'Đã quá hạn'})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Public Description */}
            {item.publicDescription && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  {t('Mô tả công khai')}
                </h4>
                <p className="text-sm text-[var(--text)] p-3 rounded-2xl bg-[var(--surface-hover)]/30 border border-[var(--border)] leading-relaxed">
                  {item.publicDescription}
                </p>
              </div>
            )}

            {/* Secret Identification Details (Collapsible for privacy) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  {t('Đặc điểm nhận dạng bí mật (Chỉ nhân viên)')}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showSecret ? t('Ẩn') : t('Xem')}
                </button>
              </div>

              {showSecret ? (
                <p className="text-xs font-semibold text-[var(--text)] bg-[var(--surface)] p-3 rounded-xl border border-amber-500/20 mt-2">
                  {item.secretDetails || t('Chưa có ghi chú bí mật.')}
                </p>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">
                  {t('Nội dung bị ẩn để bảo mật. Bấm "Xem" khi cần đối chiếu với người đến nhận.')}
                </p>
              )}
            </div>

            {/* Claimed Info (if status == CLAIMED) */}
            {item.status === 'CLAIMED' && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('Thông tin người đã nhận lại đồ')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)]">{t('Người nhận:')}</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{item.claimantName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">{t('Số điện thoại:')}</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{item.claimantPhone}</span>
                  </div>
                  {item.claimantIdCard && (
                    <div>
                      <span className="text-[var(--text-muted)]">{t('Số CCCD:')}</span>{' '}
                      <span className="font-semibold text-[var(--text)]">{item.claimantIdCard}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--text-muted)]">{t('Thời gian trả:')}</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{formatDate(item.claimedAt)}</span>
                  </div>
                </div>
                {item.claimNotes && (
                  <p className="text-xs text-[var(--text-muted)] italic bg-[var(--surface)] p-2.5 rounded-xl border border-blue-500/20 mt-1">
                    "{item.claimNotes}"
                  </p>
                )}
              </div>
            )}

            {/* Disposal Info (if status == DISPOSED) */}
            {item.status === 'DISPOSED' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-xs">
                <div className="font-bold text-rose-500 uppercase tracking-wider">
                  {t('Đã xử lý thanh lý / tiêu hủy')}
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{t('Lý do:')}</span>{' '}
                  <span className="font-semibold text-[var(--text)]">{item.disposalReason}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{t('Ngày xử lý:')}</span>{' '}
                  <span className="font-semibold text-[var(--text)]">{formatDate(item.disposedAt)}</span>
                </div>
                {item.disposalNotes && (
                  <p className="text-xs text-[var(--text-muted)] italic">{item.disposalNotes}</p>
                )}
              </div>
            )}

            {/* Timeline footer note */}
            <div className="text-[11px] text-[var(--text-muted)] border-t border-[var(--border)] pt-3 flex flex-wrap justify-between gap-2">
              <span>{t('Tiếp nhận:')} {formatDate(item.createdAt)} {item.createdByName ? `bởi ${item.createdByName}` : ''}</span>
              {item.foundByName && <span>{t('Người mang nộp:')} {item.foundByName}</span>}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]/20">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi món đồ này?')) {
                  onDelete?.(item.itemId);
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1.5 p-2 rounded-xl hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('Xóa bản ghi')}
            </button>

            <div className="flex items-center gap-2">
              {item.status === 'STORED' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenClaim(item);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('Bàn giao cho khách')}
                </button>
              )}

              {(item.status === 'STORED' || item.status === 'OVERDUE') && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDispose(item);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-600 hover:bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {t('Thanh lý / Tiêu hủy')}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
              >
                {t('Đóng')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Large Image View */}
      {lightboxOpen && item.imageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={item.imageUrl}
              alt={item.itemName}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LostItemDetailModal;

