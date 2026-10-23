import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AlertTriangle, CreditCard } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import memberService from '../services/memberService';
import { useClassCancellation } from '../hooks/useClassCancellation';
import { getReasonLabel } from '../../../utils/supportDisplayUtils';
import {
  ClassCancellationPreviewCard,
  ClassCancellationSuccessCard,
  ClassCancellationFormSection
} from './ClassCancellationCards';

const CancelClassPolicyModal = ({ isOpen, classId, onClose, onSuccess }) => {
  useLanguage();
  const navigate = useNavigate();

  const {
    loading,
    error,
    setError,
    preview,
    loadPreview,
    executeDirectCancel,
    reset: resetCancellation
  } = useClassCancellation();

  const [submitting, setSubmitting] = useState(false);
  const [reasonCategory, setReasonCategory] = useState('CLASS_CANCELLATION');
  const [reasonContent, setReasonContent] = useState('');
  const [preferredResolution, setPreferredResolution] = useState('ISSUE_CREDIT');
  const [successResult, setSuccessResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      void loadPreview(classId);
    } else {
      resetCancellation();
      setSubmitting(false);
      setReasonContent('');
      setPreferredResolution('ISSUE_CREDIT');
      setSuccessResult(null);
      setCopiedCode(false);
    }
  }, [isOpen, classId, loadPreview, resetCancellation]);

  const handleDirectCancel = async () => {
    setSubmitting(true);
    const res = await executeDirectCancel(classId);
    setSubmitting(false);
    if (res.success) {
      setSuccessResult(res.data);
      if (onSuccess) onSuccess();
    }
  };

  const handleSubmitSupportRequest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
    void navigator.clipboard.writeText(code);
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

              <ClassCancellationFormSection
                preview={preview}
                preferredResolution={preferredResolution}
                reasonCategory={reasonCategory}
                onChangeReasonCategory={setReasonCategory}
                reasonContent={reasonContent}
                onChangeReasonContent={setReasonContent}
                submitting={submitting}
                onClose={onClose}
                onDirectCancel={handleDirectCancel}
                onSubmitSupport={handleSubmitSupportRequest}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelClassPolicyModal;
