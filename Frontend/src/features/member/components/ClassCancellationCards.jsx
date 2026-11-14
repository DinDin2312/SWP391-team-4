import React, { useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import { processEvidenceFile, EvidencePreviewBox } from '../../../utils/supportDisplayUtils';

const isCourseCompleted = (preview) =>
  (preview?.totalSessions ?? 0) > 0 && (preview?.remainingSessions ?? 0) <= 0;

export const ClassCancellationPreviewCard = ({
  preview,
  showCourseName = true
}) => {
  useLanguage();
  if (!preview) return null;

  const isCompleted = isCourseCompleted(preview);
  const isDirectEligible = !isCompleted && Boolean(preview.canDirectCancelWithCredit);

  return (
    <div className="space-y-2.5">
      {/* Compact Policy / Completion Banner */}
      <div
        className={`p-3 rounded-xl border ${
          isCompleted
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200'
            : isDirectEligible
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="font-bold text-sm">
          {isCompleted
            ? t('Course Completed')
            : isDirectEligible
              ? t('Before 1 Week — 50% Voucher Refund')
              : t('After 1 Week — 100% Tuition Forfeited')}
        </div>
        <p className="text-xs mt-0.5 opacity-90">
          {isCompleted
            ? t('You have already completed this course.')
            : isDirectEligible
              ? t('50% tuition forfeited; remaining 50% refunded as a 60-day Voucher.')
              : t('Choose immediate cancellation (0đ refund) or request a Voucher review from Admin.')}
        </p>
      </div>

      {/* Compact Key-Value Summary */}
      <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-1.5 text-sm">
        {showCourseName && (
          <div className="flex justify-between items-center gap-3">
            <span className="text-xs text-[var(--text-muted)]">{t('Course Name')}</span>
            <span className="font-semibold text-[var(--text)] text-right">{preview.className}</span>
          </div>
        )}
        <div className="flex justify-between items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{t('Tuition')}</span>
          <span className="font-bold text-[var(--text)]">{formatMoney(preview.classPrice)}</span>
        </div>
        <div className="flex justify-between items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">{t('Progress')}</span>
          <span className="font-medium text-[var(--text)]">
            {preview.attendedSessions}/{preview.totalSessions} {t('sessions')} ({preview.remainingSessions} {t('left')})
          </span>
        </div>
        {!isCompleted && (
          <div className="pt-1.5 border-t border-[var(--border)] flex justify-between items-center gap-3">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {isDirectEligible ? t('50% Voucher (60 days)') : t('Est. Voucher (If Approved)')}
            </span>
            <span className="text-base font-extrabold text-[var(--primary)]">
              {formatMoney(preview.estimatedCreditAmount ?? preview.proratedCredit ?? 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ClassCancellationSuccessCard = ({
  result,
  onClose,
  onViewDetails,
  viewDetailsText,
  copiedCode,
  onCopyCode
}) => {
  useLanguage();
  if (!result) return null;

  return (
    <div className="py-3 text-center space-y-4">
      <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
        {t('Done')}
      </div>

      {result.type === 'DIRECT_CANCEL_SUCCESS' ? (
        <>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {t('Class Cancelled & 50% Credit Granted!')}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {t('50% tuition forfeited; remaining 50% refunded as a 60-day Voucher.')}
          </p>

          <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="text-[var(--text-muted)] font-medium">{t('Credit Voucher Code')}</div>
            <div className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
              <code className="text-sm font-bold text-[var(--primary)] tracking-wider">
                {result.creditCode}
              </code>
              <button
                type="button"
                onClick={() => onCopyCode(result.creditCode)}
                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"
              >
                {copiedCode ? t('Copied') : t('Copy')}
              </button>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-[var(--text-muted)]">{t('Amount:')}</span>
              <span className="font-bold text-[var(--text)]">{formatMoney(result.creditAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">{t('Valid Until:')}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{result.expiryDate}</span>
            </div>
            {result.requestId && (
              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                <span className="text-[var(--text-muted)]">{t('Ticket ID')}</span>
                <span className="font-bold text-[var(--text)]">#{result.requestId}</span>
              </div>
            )}
          </div>
        </>
      ) : result.type === 'FORFEIT_CANCEL_SUCCESS' ? (
        <>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {t('Class Cancelled (100% Tuition Forfeited)')}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {t('Your remaining class sessions have been cancelled and released immediately. Per policy, no refund or credit voucher was issued.')}
          </p>
          <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text)] max-w-sm mx-auto">
            {t('Ticket ID')}: #{result.requestId} &bull; {t('Approved & Resolved')}
          </div>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-[var(--text)]">
            {result.title || t('Voucher Request Submitted')}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            {result.message}
          </p>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium max-w-md mx-auto">
            {t('Ticket ID')}: #{result.requestId} &bull;{' '}
            {result.footerNote || t('Your current class schedule remains active on My Schedule until Admin approves your request.')}
          </div>
        </>
      )}

      <div className="pt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-xs cursor-pointer"
        >
          {t('Close')}
        </button>
        {onViewDetails && (
          <button
            type="button"
            onClick={onViewDetails}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-medium text-xs hover:opacity-90 cursor-pointer"
          >
            {viewDetailsText || t('View My Credits & Tickets')}
          </button>
        )}
      </div>
    </div>
  );
};

export const ClassCancellationFormSection = ({
  preview,
  step = 'CHOICE',
  onStepChange,
  reasonCategory,
  onChangeReasonCategory,
  reasonContent,
  onChangeReasonContent,
  evidenceUrl = '',
  evidenceFileName = '',
  onChangeEvidence,
  submitting,
  onClose,
  onDirectCancel,
  onSubmitSupport,
  directCancelDisabled = false,
  supportSubmitDisabled = false,
  forfeitCancelDisabled = false
}) => {
  useLanguage();
  const [uploadError, setUploadError] = useState('');

  if (!preview) return null;

  // Completed course (0 sessions left): lock cancellation and complaints completely
  if (isCourseCompleted(preview)) {
    return (
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-xs cursor-pointer"
        >
          {t('Close')}
        </button>
      </div>
    );
  }

  // Early cancellation (>= 7 days before start): direct 50% voucher cancel
  if (preview.canDirectCancelWithCredit) {
    return (
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-xs cursor-pointer"
        >
          {t('Keep Booking')}
        </button>
        <button
          type="button"
          onClick={() => onDirectCancel && onDirectCancel()}
          disabled={submitting || directCancelDisabled}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {submitting ? t('Processing...') : t('Confirm & Get 50% Voucher')}
        </button>
      </div>
    );
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const processed = await processEvidenceFile(file);
      if (onChangeEvidence) {
        onChangeEvidence(processed.dataUrl, processed.fileName);
      }
    } catch (err) {
      setUploadError(err.message || t('Failed to process evidence file.'));
    }
    e.target.value = '';
  };

  const noRemaining = (preview.remainingSessions ?? 0) <= 0;
  const isForfeitSelected = step === 'CONFIRM_FORFEIT';
  const isVoucherSelected = step === 'VOUCHER_FORM';

  // Late cancellation: inline mode selector + dynamic section in the same modal
  return (
    <div className="space-y-3 pt-1">
      <div className="text-xs font-bold text-[var(--text)]">
        {t('Select Cancellation Option')}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onStepChange && onStepChange('CONFIRM_FORFEIT')}
          disabled={submitting || forfeitCancelDisabled || noRemaining}
          className={`w-full text-left p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            isForfeitSelected
              ? 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-500/10'
              : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10'
          }`}
        >
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {t('Cancel Completely (0 Refund)')}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
            {t('Cancel remaining sessions immediately with no refund or voucher.')}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onStepChange && onStepChange('VOUCHER_FORM')}
          disabled={submitting || supportSubmitDisabled}
          className={`w-full text-left p-3 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            isVoucherSelected
              ? 'border-[var(--primary)] ring-2 ring-[var(--primary-soft)] bg-[var(--primary-soft)]/40'
              : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--primary)]'
          }`}
        >
          <div className="text-xs font-bold text-[var(--text)]">
            {t('Request Voucher Refund (Admin Review)')}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
            {t('Submit cancellation reason and supporting evidence for Admin approval.')}
          </p>
        </button>
      </div>

      {isForfeitSelected && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-2 text-xs">
          <div className="font-bold text-rose-700 dark:text-rose-300">
            {t('Confirm Full Cancellation')}
          </div>
          <p className="text-[var(--text)] leading-relaxed">
            {t('Are you sure you want to cancel all remaining sessions of this class immediately?')}
          </p>
          <div className="pt-2 border-t border-rose-500/20 flex flex-wrap justify-between gap-2">
            <span>
              <span className="text-[var(--text-muted)]">{t('Remaining Sessions Cancelled:')} </span>
              <strong className="text-[var(--text)]">{preview.remainingSessions} {t('sessions')}</strong>
            </span>
            <span>
              <span className="text-[var(--text-muted)]">{t('Refund / Voucher:')} </span>
              <strong className="text-rose-600 dark:text-rose-400">0 ₫</strong>
            </span>
          </div>
        </div>
      )}

      {isVoucherSelected && (
        <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] space-y-3">
          <div className="space-y-1">
            <label htmlFor="cancel-reason-select" className="block text-xs font-bold text-[var(--text)]">
              {t('Reason for Request')}
            </label>
            <select
              id="cancel-reason-select"
              value={reasonCategory}
              onChange={(e) => onChangeReasonCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="CLASS_CANCELLATION">{t('Mid-Course Emergency / Medical / Relocation')}</option>
              <option value="GENERAL_INQUIRY">{t('Schedule Conflict / Urgent Work Commitment')}</option>
              <option value="COMPLAINT">{t('Other Justified Reason')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="cancel-reason-content" className="block text-xs font-bold text-[var(--text)]">
              {t('Detailed Reason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancel-reason-content"
              rows={2}
              value={reasonContent}
              onChange={(e) => onChangeReasonContent(e.target.value)}
              placeholder={t('Please explain your late cancellation reason in detail (medical certificate, work transfer, emergency) for Admin approval.')}
              className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="cancel-evidence-upload" className="block text-xs font-bold text-[var(--text)]">
              {t('Supporting Evidence File / Photo')} <span className="text-red-500">*</span>
            </label>
            <label
              htmlFor="cancel-evidence-upload"
              className="block p-3 rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--primary)] bg-[var(--surface)] text-center cursor-pointer transition-colors"
            >
              <span className="text-xs font-medium text-[var(--text)]">
                {t('Upload photo or PDF (PNG, JPG, WEBP, PDF - max 3 MB)')}
              </span>
              <input
                id="cancel-evidence-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {uploadError && (
              <p className="text-xs text-rose-500 font-medium">{uploadError}</p>
            )}

            <EvidencePreviewBox
              evidenceUrl={evidenceUrl}
              fileName={evidenceFileName}
              onClear={() => onChangeEvidence && onChangeEvidence('', '')}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-xs cursor-pointer"
        >
          {t('Keep Booking')}
        </button>

        {isForfeitSelected && (
          <button
            type="button"
            onClick={() => onDirectCancel && onDirectCancel({ acceptForfeit: true })}
            disabled={submitting || forfeitCancelDisabled}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? t('Processing...') : t('Confirm Cancel (0 Refund)')}
          </button>
        )}

        {isVoucherSelected && (
          <button
            type="button"
            onClick={onSubmitSupport}
            disabled={submitting || !reasonContent?.trim() || !evidenceUrl || supportSubmitDisabled}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? t('Submitting...') : t('Submit Voucher Request')}
          </button>
        )}
      </div>
    </div>
  );
};
