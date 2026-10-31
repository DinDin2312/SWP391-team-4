import React, { useState } from 'react';
import { X, CheckCircle2, User, Phone, CreditCard, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import lostAndFoundService from '../services/lostAndFoundService';
import receptionistService from '../services/receptionistService';

const ClaimItemModal = ({ isOpen, item, onClose, onSuccess }) => {
  useLanguage();

  const [isMember, setIsMember] = useState(true);
  const [memberKeyword, setMemberKeyword] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchingMember, setSearchingMember] = useState(false);

  const [claimantName, setClaimantName] = useState('');
  const [claimantPhone, setClaimantPhone] = useState('');
  const [claimantIdCard, setClaimantIdCard] = useState('');
  const [claimNotes, setClaimNotes] = useState('Khách đã mở khóa / cung cấp đúng đặc điểm đối chiếu');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !item) return null;

  const handleSearchMember = async (keyword) => {
    setMemberKeyword(keyword);
    if (!keyword || keyword.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    setSearchingMember(true);
    try {
      const res = await receptionistService.searchMembers({ keyword: keyword.trim() });
      setMemberResults(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingMember(false);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setClaimantName(member.fullName || member.name || '');
    setClaimantPhone(member.phone || '');
    setMemberResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!claimantName.trim()) {
      setErrorMsg('Vui lòng nhập tên người nhận.');
      return;
    }
    if (!claimantPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại người nhận.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        claimedByUserId: isMember && selectedMember ? selectedMember.userId : null,
        claimantName: claimantName.trim(),
        claimantPhone: claimantPhone.trim(),
        claimantIdCard: claimantIdCard ? claimantIdCard.trim() : null,
        claimNotes: claimNotes.trim(),
      };

      await lostAndFoundService.claimItem(item.itemId, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể xác nhận bàn giao đồ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[var(--surface)] text-[var(--text)] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-hover)]/30">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {t('Xác minh & Bàn giao Đồ thất lạc')}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('Mã món đồ:')} <span className="font-mono font-semibold text-[var(--primary)]">{item.itemCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Item Mini Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-hover)]/40 border border-[var(--border)] flex items-center gap-3.5">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.itemName}
                className="w-16 h-16 rounded-xl object-cover bg-black/20 shrink-0 border border-[var(--border)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-lg shrink-0">
                📦
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-[var(--text)] truncate">{item.itemName}</h3>
              <p className="text-xs text-[var(--text-muted)]">
                📍 {t('Vị trí cất:')} <span className="font-semibold text-[var(--text)]">{item.storageLocation}</span>
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                🕒 {t('Nơi nhặt:')} {item.foundLocation} {item.color ? `• Màu: ${item.color}` : ''}
              </p>
            </div>
          </div>

          {/* Secret Details Preview for Staff */}
          {item.secretDetails && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 mb-1">
                <ShieldCheck className="w-4 h-4" />
                {t('Đặc điểm đối chiếu (Lễ tân hỏi khách để xác nhận):')}
              </div>
              <p className="text-xs font-medium text-[var(--text)] bg-[var(--surface)] p-2.5 rounded-xl border border-amber-500/20">
                "{item.secretDetails}"
              </p>
            </div>
          )}

          {/* Type Toggle: Member vs Walk-in Guest */}
          <div className="flex rounded-xl bg-[var(--surface-hover)] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsMember(true)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isMember
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              👤 {t('Hội viên trung tâm')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMember(false);
                setSelectedMember(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isMember
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              🏷️ {t('Khách ngoài / Khách vãng lai')}
            </button>
          </div>

          {/* Member Search if isMember */}
          {isMember && (
            <div className="relative">
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5">
                {t('Tìm kiếm Hội viên theo Tên hoặc Số điện thoại')}
              </label>
              <input
                type="text"
                placeholder={t('Nhập SĐT hoặc họ tên hội viên...')}
                value={memberKeyword}
                onChange={(e) => handleSearchMember(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
              {searchingMember && (
                <div className="text-xs text-[var(--text-muted)] mt-1 animate-pulse">{t('Đang tìm...')}</div>
              )}

              {memberResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl max-h-48 overflow-y-auto z-20 p-1.5 space-y-1">
                  {memberResults.map((m) => (
                    <div
                      key={m.userId}
                      onClick={() => handleSelectMember(m)}
                      className="p-2.5 rounded-xl hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] cursor-pointer text-xs flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-sm">{m.fullName || m.name}</div>
                        <div className="text-[var(--text-muted)]">{m.phone} • {m.email}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-hover)] border border-[var(--border)]">
                        ID #{m.userId}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedMember && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                  <span>✓ Đã liên kết: <b>{selectedMember.fullName || selectedMember.name}</b> (#{selectedMember.userId})</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Claimant Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t('Họ và tên người nhận')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={t('Nhập họ tên đầy đủ')}
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                {t('Số điện thoại')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder={t('Nhập số điện thoại')}
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t('Số CCCD / CMND')} <span className="text-[var(--text-muted)] font-normal">({t('Bắt buộc đối với đồ giá trị cao')})</span>
            </label>
            <input
              type="text"
              placeholder={t('Nhập số căn cước công dân hoặc số thẻ')}
              value={claimantIdCard}
              onChange={(e) => setClaimantIdCard(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
              {t('Ghi chú xác minh bàn giao')}
            </label>
            <textarea
              rows={2}
              placeholder={t('Ghi chú bằng chứng đối chiếu: mở khóa điện thoại, xuất trình CCCD...')}
              value={claimNotes}
              onChange={(e) => setClaimNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:border-[var(--primary)] outline-none text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-3 bg-[var(--surface-hover)]/20">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            {t('Hủy')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {t('Xác nhận bàn giao')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimItemModal;

