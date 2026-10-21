import React, { useState, useEffect } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert,
  Send, User, Phone, Mail, BookOpen, Clock, Calendar,
  CreditCard, ArrowUpRight, DollarSign
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import receptionistService from '../services/receptionistService';

const RespondSupportModal = ({ isOpen, request, onClose, onSuccess }) => {
  useLanguage();

  const [resolutionType, setResolutionType] = useState('ISSUE_CREDIT'); // 'ISSUE_CREDIT' | 'GYM_PASS' | 'ESCALATE' | 'REJECT'
  const [creditAmount, setCreditAmount] = useState(0);
  const [validDays, setValidDays] = useState(60);
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      const suggested = request.proratedCredit || request.classPrice || 0;
      setCreditAmount(suggested);
      setValidDays(60);
      setResolutionType(request.category === 'CLASS_CANCELLATION' ? 'ISSUE_CREDIT' : 'APPROVE_GENERAL');
      setResponseNote(
        request.category === 'CLASS_CANCELLATION'
          ? `Lễ tân đã phê duyệt yêu cầu bảo lưu lớp ${request.className || ''}. Mã tín dụng 60 ngày trị giá ${formatMoney(suggested)} đã được cấp vào tài khoản học viên.`
          : 'Lễ tân đã tiếp nhận và xử lý yêu cầu của bạn.'
      );
      setError('');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!responseNote.trim()) {
      setError(t('Please provide a response note for the member.'));
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      let status = 'APPROVED';
      let finalCreditAmount = null;

      if (resolutionType === 'ISSUE_CREDIT') {
        status = 'APPROVED';
        finalCreditAmount = parseFloat(creditAmount) || 0;
      } else if (resolutionType === 'GYM_PASS' || resolutionType === 'APPROVE_GENERAL') {
        status = 'APPROVED';
        finalCreditAmount = null;
      } else if (resolutionType === 'ESCALATE') {
        status = 'ESCALATED';
        finalCreditAmount = null;
      } else if (resolutionType === 'REJECT') {
        status = 'REJECTED';
        finalCreditAmount = null;
      }

      await receptionistService.respondSupportRequest(request.requestId, {
        status,
        resolutionType,
        responseNote: responseNote.trim(),
        creditAmount: finalCreditAmount,
        validityDays: resolutionType === 'ISSUE_CREDIT' ? parseInt(validDays, 10) : 60,
        creditExpiryDays: resolutionType === 'ISSUE_CREDIT' ? parseInt(validDays, 10) : 60
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to process response.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="respond-modal-title"
        className="relative w-full max-w-2xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="respond-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t('Resolve Support Ticket')} #{request.requestId}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {request.title} &bull; {t('Priority:')} <span className="font-semibold">{request.priority}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={t('Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Card */}
          <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-bold text-[var(--text)]">{request.userFullName}</span>
            </div>
            {request.userPhone && (
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Phone className="w-3.5 h-3.5" />
                <span>{request.userPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Mail className="w-3.5 h-3.5" />
              <span>{request.userEmail}</span>
            </div>
          </div>

          {/* Ticket Request Content */}
          <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
            <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
              {t('Member Request Description')}
            </div>
            <p className="text-sm text-[var(--text)] whitespace-pre-line leading-relaxed">
              {request.content}
            </p>
          </div>

          {/* Associated Class Proration Card (if cancellation) */}
          {request.classId && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {t('Enrolled Course Information')}
                </span>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {request.className}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block">{t('Total Fee')}</span>
                  <span className="font-bold text-[var(--text)]">{formatMoney(request.classPrice)}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block">{t('Total Sessions')}</span>
                  <span className="font-bold text-[var(--text)]">{request.totalSessions || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block">{t('Attended')}</span>
                  <span className="font-bold text-emerald-600">{request.attendedSessions || 0}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[var(--text-muted)] block">{t('Remaining')}</span>
                  <span className="font-bold text-amber-600">{request.remainingSessions || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  {t('Prorated Remaining Value (Recommended Credit):')}
                </span>
                <span className="text-base font-extrabold text-[var(--primary)]">
                  {formatMoney(request.proratedCredit)}
                </span>
              </div>
            </div>
          )}

          {/* Resolution Action Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text)]">
              {t('Select Resolution Action')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {request.category === 'CLASS_CANCELLATION' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setResolutionType('ISSUE_CREDIT')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${resolutionType === 'ISSUE_CREDIT' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CreditCard className="w-4 h-4" /> {t('Issue Credit Voucher (Recommended)')}
                    </span>
                    <span className="text-[11px] mt-1 opacity-80">
                      {t('Generates 60-day voucher code for member to re-enroll without losing money.')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionType('GYM_PASS')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${resolutionType === 'GYM_PASS' ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200' : 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <Clock className="w-4 h-4" /> {t('Grant Free 1-Month Gym Pass')}
                    </span>
                    <span className="text-[11px] mt-1 opacity-80">
                      {t('Alternative perk when student prefers gym workouts over class credit.')}
                    </span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setResolutionType('APPROVE_GENERAL')}
                  className={`p-3 rounded-xl border text-left transition-all ${resolutionType === 'APPROVE_GENERAL' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200' : 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}
                >
                  <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> {t('Approve & Resolve Issue')}
                  </span>
                  <span className="text-[11px] mt-1 block opacity-80">
                    {t('Acknowledge repair, feedback or inquiry as fully resolved.')}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setResolutionType('ESCALATE')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${resolutionType === 'ESCALATE' ? 'border-purple-500 bg-purple-500/10 text-purple-900 dark:text-purple-200' : 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <ArrowUpRight className="w-4 h-4" /> {t('Escalate to Center Manager')}
                </span>
                <span className="text-[11px] mt-1 opacity-80">
                  {t('For special cash refunds or high-dispute exceptions.')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setResolutionType('REJECT')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${resolutionType === 'REJECT' ? 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-200' : 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text-muted)]'}`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <X className="w-4 h-4" /> {t('Reject Request')}
                </span>
                <span className="text-[11px] mt-1 opacity-80">
                  {t('Course completed >80% or violates center policies.')}
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Credit Voucher fields */}
          {resolutionType === 'ISSUE_CREDIT' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="credit-amount-input" className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {t('Voucher Credit Amount (VND)')}
                  </label>
                  <input
                    id="credit-amount-input"
                    type="number"
                    min="10000"
                    step="5000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="credit-validity-input" className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    {t('Validity (Days)')}
                  </label>
                  <input
                    id="credit-validity-input"
                    type="number"
                    min="7"
                    max="365"
                    value={validDays}
                    onChange={(e) => setValidDays(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-bold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Response Note (sent to member notification) */}
          <div className="space-y-1.5">
            <label htmlFor="response-note-textarea" className="block text-xs font-bold text-[var(--text)]">
              {t('Official Response & Explanation to Member')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="response-note-textarea"
              rows={3}
              value={responseNote}
              onChange={(e) => setResponseNote(e.target.value)}
              placeholder={t('Enter response note explaining resolution or rejection reason. This will be sent directly to the member.')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !responseNote.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('Processing...')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('Submit Resolution & Notify Member')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RespondSupportModal;
