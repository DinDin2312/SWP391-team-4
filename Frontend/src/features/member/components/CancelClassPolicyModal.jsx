import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, AlertTriangle, CheckCircle2,
  CreditCard, Send
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import memberService from '../services/memberService';
import {
  ClassCancellationPreviewCard,
  ClassCancellationSuccessCard,
  CancellationGuaranteeNotice
} from './ClassCancellationCards';

const CancelClassPolicyModal = ({ isOpen, classId, onClose, onSuccess }) => {
  useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  // Form state for in-progress support request
  const [reasonCategory, setReasonCategory] = useState('CLASS_CANCELLATION');
  const [reasonContent, setReasonContent] = useState('');
  const [preferredResolution, setPreferredResolution] = useState('ISSUE_CREDIT'); // 'ISSUE_CREDIT' | 'GYM_PASS' | 'CASH_REFUND'

  // Result state
  const [successResult, setSuccessResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      fetchPreview();
    } else {
      resetState();
    }
  }, [isOpen, classId]);

  const resetState = () => {
    setLoading(false);
    setSubmitting(false);
    setError('');
    setPreview(null);
    setReasonContent('');
    setPreferredResolution('ISSUE_CREDIT');
    setSuccessResult(null);
    setCopiedCode(false);
  };

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await memberService.getCancelClassPreview(classId);
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to load cancellation policy preview.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectCancel = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await memberService.cancelClassDirectly(classId);
      setSuccessResult({
        type: 'DIRECT_CANCEL_SUCCESS',
        requestId: res.requestId,
        creditCode: res.creditCode,
        creditAmount: res.creditAmount,
        expiryDate: res.expiryDate,
        message: res.message
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to cancel class.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getReasonLabel = (val) => {
    switch (val) {
      case 'CLASS_CANCELLATION': return t('Mid-Course Emergency / Medical / Relocation');
      case 'GENERAL_INQUIRY': return t('Schedule Conflict / Need Class Transfer');
      case 'COMPLAINT': return t('Course Quality / Other Reason');
      default: return t('Other');
    }
  };

  const handleSubmitSupportRequest = async (e) => {
    if (e) e.preventDefault();
    if (!reasonContent.trim()) {
      setError(t('Please describe the reason for your support request.'));
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const title = t('Cancellation & Retention Request for') + ` ${preview?.className || ''}`;
      const res = await memberService.createSupportRequest({
        classId,
        category: 'CLASS_CANCELLATION',
        preferredResolution,
        title,
        content: `[${t('Reason')}: ${getReasonLabel(reasonCategory)}] ${reasonContent.trim()}`,
        priority: 'NORMAL'
      });

      let prefLabel = t('Course Credit Voucher');
      if (preferredResolution === 'GYM_PASS') prefLabel = t('Free 1-Month Gym Pass');
      if (preferredResolution === 'CASH_REFUND') prefLabel = t('Cash / Bank Refund');

      setSuccessResult({
        type: 'SUPPORT_REQUEST_SUBMITTED',
        requestId: res.requestId,
        preferredResolution,
        preferredLabel: prefLabel,
        message: t('Your support ticket has been submitted to Reception. Our staff will review your request and issue a credit or alternative resolution.')
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to submit support request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="relative w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="cancel-modal-title" className="text-lg font-bold text-[var(--text)]">
                {t('Class Cancellation & Refund Policy')}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {preview ? preview.className : t('Checking policy terms...')}
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

        {/* Content Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <div className="w-10 h-10 border-4 border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">{t('Evaluating class schedule & credit terms...')}</p>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success View */}
          {successResult && (
            <ClassCancellationSuccessCard
              result={successResult}
              onClose={onClose}
              onViewDetails={() => {
                onClose();
                navigate('/member/support');
              }}
              viewDetailsText={t('View My Credits & Tickets')}
              copiedCode={copiedCode}
              onCopyCode={handleCopyCode}
            />
          )}

          {/* Policy Preview View */}
          {!loading && !successResult && preview && (
            <>
              <ClassCancellationPreviewCard
                preview={preview}
                preferredResolution={preferredResolution}
                onSelectResolution={setPreferredResolution}
              />

              {/* Action Area: 1-Click Cancel (if not started & credit voucher) OR Support Form */}
              {!preview.hasStarted && preferredResolution === 'ISSUE_CREDIT' ? (
                <div className="space-y-4 pt-2">
                  <CancellationGuaranteeNotice />

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                    >
                      {t('Keep My Booking')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDirectCancel}
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('Processing...')}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('Confirm Cancel & Receive Credit Now')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Support Ticket Form to Receptionist / Manager */
                <form onSubmit={handleSubmitSupportRequest} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label htmlFor="cancel-reason-select" className="block text-xs font-bold text-[var(--text)]">
                      {t('Reason for Request')}
                    </label>
                    <select
                      id="cancel-reason-select"
                      value={reasonCategory}
                      onChange={(e) => setReasonCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      <option value="CLASS_CANCELLATION">{t('Mid-Course Emergency / Medical / Relocation')}</option>
                      <option value="GENERAL_INQUIRY">{t('Schedule Conflict / Need Class Transfer')}</option>
                      <option value="COMPLAINT">{t('Course Quality / Other Reason')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="cancel-reason-content" className="block text-xs font-bold text-[var(--text)]">
                      {t('Detailed Situation & Note for Receptionist')} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="cancel-reason-content"
                      rows={3}
                      value={reasonContent}
                      onChange={(e) => setReasonContent(e.target.value)}
                      placeholder={t('Please specify your reason (e.g. medical reason, work relocation). Receptionist will review and approve your credit voucher or compensation.')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                    >
                      {t('Keep My Booking')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !reasonContent.trim()}
                      className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('Submitting...')}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{t('Send Request to Reception')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelClassPolicyModal;
