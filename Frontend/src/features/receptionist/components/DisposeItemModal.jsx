import React, { useState } from 'react';
import { X, AlertTriangle, Check, AlertCircle } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import lostAndFoundService from '../services/lostAndFoundService';

const DISPOSAL_REASONS = [
  { value: 'DONATED', label: 'Quyên góp từ thiện (Hội chữ thập đỏ / Quỹ từ thiện)' },
  { value: 'DESTROYED', label: 'Tiêu hủy vệ sinh (Đồ dùng cũ, đồ dễ hỏng)' },
  { value: 'POLICE_HANDOVER', label: 'Bàn giao cơ quan Công an (Giấy tờ tùy thân, tài sản lớn)' },
  { value: 'AUCTIONED', label: 'Thanh lý nội bộ theo quy định trung tâm' },
];

const DisposeItemModal = ({ isOpen, item, onClose, onSuccess }) => {
  useLanguage();

  const [reason, setReason] = useState('DONATED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await lostAndFoundService.disposeItem(item.itemId, {
        disposalReason: reason,
        disposalNotes: notes.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể xử lý thanh lý món đồ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            {t('Xử lý Thanh lý / Tiêu hủy')}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="text-xs text-[var(--text-muted)]">
          {t('Bạn đang xử lý món đồ:')}{' '}
          <span className="font-bold text-[var(--text)]">{item.itemName}</span> ({item.itemCode})
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t('Hình thức xử lý')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              {DISPOSAL_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t('Ghi chú xử lý / Biên bản')}
            </label>
            <textarea
              rows={3}
              placeholder={t('Ghi chú chi tiết người duyệt, đơn vị tiếp nhận hoặc ngày hủy...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
            >
              {t('Hủy')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang xử lý...' : t('Xác nhận xử lý')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisposeItemModal;

