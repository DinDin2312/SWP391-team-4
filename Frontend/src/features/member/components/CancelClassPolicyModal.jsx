import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, AlertTriangle, CheckCircle2, Clock, Calendar,
  CreditCard, Send, ShieldAlert, Copy, Check, Dumbbell, DollarSign, Sparkles
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import memberService from '../services/memberService';

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
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              {successResult.type === 'DIRECT_CANCEL_SUCCESS' ? (
                <>
                  <h3 className="text-xl font-bold text-[var(--text)]">
                    {t('Class Cancelled & 100% Credit Granted!')}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                    {t('Because this class has not started yet, 100% of your course fee has been converted into a Course Credit Voucher valid for 60 days.')}
                  </p>

                  <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-w-sm mx-auto text-left space-y-2">
                    <div className="text-xs text-[var(--text-muted)] font-medium">{t('Credit Voucher Code')}</div>
                    <div className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                      <code className="text-base font-bold text-[var(--primary)] tracking-wider">
                        {successResult.creditCode}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(successResult.creditCode)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? t('Copied') : t('Copy')}
                      </button>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-[var(--text-muted)]">{t('Amount:')}</span>
                      <span className="font-bold text-[var(--text)]">{formatMoney(successResult.creditAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">{t('Valid Until:')}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{successResult.expiryDate} (60 {t('days')})</span>
                    </div>
                    {successResult.requestId && (
                      <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
                        <span className="text-[var(--text-muted)]">{t('Ticket ID')}:</span>
                        <span className="font-bold text-[var(--text)]">#{successResult.requestId} &bull; <span className="text-emerald-600 font-bold">{t('Approved & Resolved')}</span></span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-[var(--text)]">
                    {t('Support Ticket Submitted!')}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                    {successResult.message}
                  </p>
                  {successResult.preferredLabel && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20">
                      <span>{t('Requested Benefit')}:</span>
                      <span>{successResult.preferredLabel}</span>
                    </div>
                  )}
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    {t('Ticket ID')}: #{successResult.requestId} &bull; {t('You will receive a notification once Reception reviews and resolves your ticket.')}
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                >
                  {t('Close')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/member/support');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  {t('View My Credits & Tickets')}
                </button>
              </div>
            </div>
          )}

          {/* Policy Preview View */}
          {!loading && !successResult && preview && (
            <>
              {/* Status Header Badge */}
              <div className={`p-4 rounded-xl border ${!preview.hasStarted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'}`}>
                <div className="flex items-center gap-2.5 font-bold text-sm mb-1">
                  {!preview.hasStarted ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>{t('Class Has Not Started Yet - 100% Credit Eligible')}</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span>{t('Class In Progress - Reception Support Required')}</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {preview.policyNotice}
                </p>
              </div>

              {/* Course Progress & Pricing Breakdown */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-muted)]">{t('Course Name')}:</span>
                  <span className="font-bold text-[var(--text)]">{preview.className}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-muted)]">{t('Course Tuition')}:</span>
                  <span className="font-bold text-[var(--text)]">{formatMoney(preview.classPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--text-muted)]">{t('Session Progress')}:</span>
                  <span className="font-medium text-[var(--text)]">
                    {preview.attendedSessions} / {preview.totalSessions} {t('sessions taken')} ({preview.remainingSessions} {t('remaining')})
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                    style={{ width: `${preview.totalSessions > 0 ? (preview.attendedSessions / preview.totalSessions) * 100 : 0}%` }}
                  />
                </div>

                {preview.hasStarted && (
                  <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">
                      {t('Estimated Prorated Credit Value:')}
                    </span>
                    <span className="text-base font-extrabold text-[var(--primary)]">
                      {formatMoney(preview.proratedCredit)}
                    </span>
                  </div>
                )}
              </div>

              {/* Member Compensation Benefit Selection */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-extrabold text-[var(--text)] uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{t('Select Desired Compensation Benefit')}</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                    {t('Choose how you would like to be compensated if this class is cancelled.')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Option 1: Course Credit Voucher */}
                  <button
                    type="button"
                    onClick={() => setPreferredResolution('ISSUE_CREDIT')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                      preferredResolution === 'ISSUE_CREDIT'
                        ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30'
                        : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          preferredResolution === 'ISSUE_CREDIT'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-[var(--text)]">
                              {t('Course Credit Voucher (Recommended)')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              {!preview.hasStarted ? '100% ' + t('Tuition Value') : formatMoney(preview.proratedCredit)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                            {t('100% or prorated value credited for 60 days to book any other class or gym package.')}
                          </p>
                          <div className="mt-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{!preview.hasStarted ? t('Auto-issued instantly (1-click)') : t('Quick reception review')}</span>
                          </div>
                        </div>
                      </div>
                      {preferredResolution === 'ISSUE_CREDIT' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Option 2: 1-Month Gym Pass */}
                  <button
                    type="button"
                    onClick={() => setPreferredResolution('GYM_PASS')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                      preferredResolution === 'GYM_PASS'
                        ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/15 ring-2 ring-blue-500/30'
                        : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          preferredResolution === 'GYM_PASS'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        }`}>
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-[var(--text)]">
                              {t('Free 1-Month Gym Pass')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                              1 {t('Month')} VIP
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                            {t('Exchange remaining sessions for 1 full month of unlimited gym & fitness access.')}
                          </p>
                          <div className="mt-1.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('Instant activation upon review')}</span>
                          </div>
                        </div>
                      </div>
                      {preferredResolution === 'GYM_PASS' && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Option 3: Cash / Bank Refund */}
                  <button
                    type="button"
                    onClick={() => setPreferredResolution('CASH_REFUND')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                      preferredResolution === 'CASH_REFUND'
                        ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-500/15 ring-2 ring-purple-500/30'
                        : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          preferredResolution === 'CASH_REFUND'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                        }`}>
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-[var(--text)]">
                              {t('Cash / Bank Refund Request')}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              {!preview.hasStarted ? formatMoney(preview.classPrice) : formatMoney(preview.proratedCredit)}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                            {t('Request remaining class tuition refunded via bank transfer or cash at counter.')}
                          </p>
                          <div className="mt-1.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t('Requires Center Manager approval')}</span>
                          </div>
                        </div>
                      </div>
                      {preferredResolution === 'CASH_REFUND' && (
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Area: 1-Click Cancel (if not started & credit voucher) OR Support Form */}
              {!preview.hasStarted && preferredResolution === 'ISSUE_CREDIT' ? (
                <div className="space-y-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t('Terms & Guarantee:')}</span>
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      <li>{t('100% of your course price will be credited as a 60-day voucher.')}</li>
                      <li>{t('Use the voucher at checkout for any other class or gym membership.')}</li>
                      <li>{t('All upcoming sessions will be released for other members.')}</li>
                    </ul>
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
