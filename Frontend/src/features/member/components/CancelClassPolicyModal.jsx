import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
    step,
    setStep,
    loadPreview,
    executeDirectCancel,
    reset: resetCancellation
  } = useClassCancellation();

  const [submitting, setSubmitting] = useState(false);
  const [reasonCategory, setReasonCategory] = useState('CLASS_CANCELLATION');
  const [reasonContent, setReasonContent] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceFileName, setEvidenceFileName] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && classId) {
      void loadPreview(classId);
    } else {
      resetCancellation();
      setSubmitting(false);
      setReasonContent('');
      setEvidenceUrl('');
      setEvidenceFileName('');
      setSuccessResult(null);
      setCopiedCode(false);
    }
  }, [isOpen, classId, loadPreview, resetCancellation]);

  const handleDirectCancel = async (options = {}) => {
    setSubmitting(true);
    const res = await executeDirectCancel(classId, options);
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
    if (!preview?.canDirectCancelWithCredit && !evidenceUrl) {
      setError(t('Please attach supporting evidence (image or PDF) for Admin approval.'));
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      const title = t('Cancellation & Retention Request for') + ' ' + (preview?.className || '');
      const res = await memberService.createSupportRequest({
        classId,
        category: 'CLASS_CANCELLATION',
        preferredResolution: 'ISSUE_CREDIT',
        title,
        content: `[${t('Reason')}: ${getReasonLabel(reasonCategory)}] ${reasonContent.trim()}`,
        evidenceUrl,
        priority: 'HIGH'
      });

      setSuccessResult({
        type: 'SUPPORT_REQUEST_SUBMITTED',
        requestId: res.requestId,
        preferredResolution: 'ISSUE_CREDIT',
        preferredLabel: t('Course Credit Voucher'),
        message: t('Your cancellation request and evidence have been sent to Admin / Center Management for review. Your current schedule remains unchanged until approved.')
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
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border)]">
          <div>
            <h2 id="cancel-modal-title" className="text-lg font-bold text-[var(--text)]">
              {t('Class Cancellation Policy')}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              {preview ? preview.className : t('Checking policy terms...')}
            </p>
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

        {/* Sticky Error Banner (always visible regardless of scroll position) */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium shrink-0">
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)]">
              <div className="w-10 h-10 border-4 border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">{t('Evaluating class schedule & credit terms...')}</p>
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
                showCourseName={false}
              />

              <ClassCancellationFormSection
                preview={preview}
                step={step}
                onStepChange={(next) => {
                  setError('');
                  setStep(next);
                }}
                reasonCategory={reasonCategory}
                onChangeReasonCategory={setReasonCategory}
                reasonContent={reasonContent}
                onChangeReasonContent={setReasonContent}
                evidenceUrl={evidenceUrl}
                evidenceFileName={evidenceFileName}
                onChangeEvidence={(url, name) => {
                  setEvidenceUrl(url);
                  setEvidenceFileName(name);
                }}
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
