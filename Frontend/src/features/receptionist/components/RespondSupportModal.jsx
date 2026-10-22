import React, { useState, useEffect } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert,
  Send, User, Phone, Mail, BookOpen, Clock, Calendar,
  CreditCard, ArrowUpRight, DollarSign, RotateCcw
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import receptionistService from '../services/receptionistService';

const RespondSupportModal = ({ isOpen, request, isManager = false, onClose, onSuccess }) => {
  useLanguage();

  const [resolutionType, setResolutionType] = useState('ISSUE_CREDIT'); // 'ISSUE_CREDIT' | 'GYM_PASS' | 'ESCALATE' | 'REJECT'
  const [creditAmount, setCreditAmount] = useState(0);
  const [validDays, setValidDays] = useState(60);
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (isOpen && request) {
      setShowRevokeConfirm(false);
      setRevokeReason('');
      const suggested = request.calculatedCreditAmount ?? request.proratedCredit ?? request.classPrice ?? 0;
      setCreditAmount(suggested);
      setValidDays(60);
      const isEscalatedClassCancel = isManager && (request.status === 'ESCALATED' || request.category === 'CLASS_CANCELLATION');
      const defaultType = isEscalatedClassCancel
        ? 'CASH_REFUND'
        : (request.category === 'CLASS_CANCELLATION' ? 'ISSUE_CREDIT' : 'APPROVE_GENERAL');
      setResolutionType(defaultType);

      const rolePrefix = isManager ? 'Quản lý trung tâm' : 'Lễ tân';
      setResponseNote(
        isEscalatedClassCancel
          ? `Quản lý trung tâm đã phê duyệt hoàn tiền học phí lớp ${request.className || ""}. Số tiền ${formatMoney(suggested)} sẽ được hoàn trả trực tiếp tại quầy hoặc chuyển khoản.`
          : (request.category === 'CLASS_CANCELLATION'
              ? `${rolePrefix} đã phê duyệt yêu cầu bảo lưu lớp ${request.className || ""}. Mã tín dụng 60 ngày trị giá ${formatMoney(suggested)} đã được cấp vào tài khoản học viên.`
              : `${rolePrefix} đã tiếp nhận và xử lý yêu cầu của bạn.`)
      );
      setError('');
    }
  }, [isOpen, request, isManager]);

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'URGENT': return t('Urgent');
      case 'HIGH': return t('High');
      case 'LOW': return t('Low');
      case 'NORMAL':
      default:
        return t('Normal');
    }
  };

  const isClosed = request?.status === 'APPROVED' || request?.status === 'RESOLVED' || request?.status === 'REJECTED';
  const isEscalatedForReceptionist = !isManager && request?.status === 'ESCALATED';
  const isReadOnly = isClosed || isEscalatedForReceptionist;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('Resolved')}
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {t('Escalated')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> {t('Rejected')}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {t('Pending')}
          </span>
        );
    }
  };

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

      if (resolutionType === 'ISSUE_CREDIT' || resolutionType === 'CASH_REFUND') {
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

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      setError(t('Please provide a reason for revoking the approval.'));
      return;
    }

    try {
      setRevoking(true);
      setError('');
      await receptionistService.revokeSupportRequest(request.requestId, {
        reason: revokeReason.trim()
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || t('Failed to revoke approval.'));
    } finally {
      setRevoking(false);
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
                {isReadOnly ? t('Support Ticket Details') : t('Resolve Support Ticket')} #{request.requestId}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {request.title} &bull; {t('Priority:')} <span className="font-semibold">{getPriorityLabel(request.priority)}</span>
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
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{request.userFullName || request.memberName}</span>
            </div>
            {(request.userPhone || request.memberPhone) && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{request.userPhone || request.memberPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-semibold">
              <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{request.userEmail || request.memberEmail}</span>
            </div>
          </div>

          {/* Ticket Request Content */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 shadow-sm">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {t('Member Request Description')}
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
              {request.content}
            </p>
          </div>

          {/* Associated Class Proration Card (if cancellation) */}
          {request.classId && (
            <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800/70 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {t('Enrolled Course Information')}
                </span>
                <span className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                  {request.className}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px] mb-0.5">{t('Total Fee')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formatMoney(request.classPrice)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px] mb-0.5">{t('Total Sessions')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{request.totalSessions || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px] mb-0.5">{t('Attended')}</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{request.attendedSessions || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-slate-500 dark:text-slate-400 block font-semibold text-[11px] mb-0.5">{t('Remaining')}</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">{request.remainingSessions || 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 text-xs border-t border-blue-200/80 dark:border-blue-900/60">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  {t('Prorated Remaining Value (Recommended Credit):')}
                </span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-300">
                  {formatMoney(request.calculatedCreditAmount ?? request.proratedCredit ?? request.classPrice ?? 0)}
                </span>
              </div>
            </div>
          )}

          {/* If Read-Only (Closed Ticket or Escalated for Receptionist): Show Resolution Summary */}
          {isReadOnly ? (
            <div className="space-y-4">
              {/* If Escalated for Receptionist banner */}
              {isEscalatedForReceptionist && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{t('Ticket Escalated to Center Management')}</span>
                  </div>
                  <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    {t('This ticket involves mid-course refund or exception and has been escalated to Center Manager for review. Receptionists cannot modify escalated tickets.')}
                  </p>
                </div>
              )}

              {/* Resolution Result Summary Card */}
              {isClosed && (
                <div className="p-4 rounded-xl border space-y-3.5 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t('Resolution Outcome')}
                    </span>
                    <div>{getStatusBadge(request.status)}</div>
                  </div>

                  {/* If Credit Voucher was generated */}
                  {request.generatedCreditCode && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> {t('Credit Voucher Issued')}
                        </div>
                        <code className="text-sm font-black text-emerald-950 dark:text-emerald-100 tracking-wider block mt-1">
                          {request.generatedCreditCode}
                        </code>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{t('Amount')}</div>
                        <div className="text-base font-black text-emerald-800 dark:text-emerald-300">
                          {formatMoney(request.generatedCreditAmount || request.calculatedCreditAmount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Cash Refund Approved */}
                  {request.status === 'APPROVED' && !request.generatedCreditCode && request.category === 'CLASS_CANCELLATION' && (
                    <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-700/60 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="text-xs font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-teal-700 dark:text-teal-400" /> {t('Direct Cash / Bank Refund Approved')}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-semibold">
                          {t('Authorized by Center Management')}
                        </div>
                      </div>
                      <div className="text-base font-black text-teal-800 dark:text-teal-300">
                        {formatMoney(request.calculatedCreditAmount ?? request.classPrice)}
                      </div>
                    </div>
                  )}

                  {/* Responder Information & Official Response */}
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
                      <span>{t('Processed By')}: <strong className="text-slate-900 dark:text-white">{request.responderName || t('Staff')}</strong></span>
                      {request.respondedAt && <span>{request.respondedAt}</span>}
                    </div>
                    {request.responseNote && (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed shadow-sm">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          {t('Official Response to Member')}:
                        </span>
                        "{request.responseNote}"
                      </div>
                    )}
                  </div>

                  {/* Revoke Confirmation Section (for Manager) */}
                  {showRevokeConfirm && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3 animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{t('Revoke Refund & Resolution')}</span>
                      </div>
                      <p className="text-xs text-red-900 dark:text-red-200 leading-relaxed font-medium">
                        {t('Warning: Revoking will invalidate the granted credit voucher in the member\'s wallet and set the ticket to Rejected. If the voucher has already been spent, revocation will be blocked.')}
                      </p>
                      <div className="space-y-1">
                        <label htmlFor="revoke-reason-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Revoke Reason (Required)')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="revoke-reason-input"
                          rows={2}
                          value={revokeReason}
                          onChange={(e) => setRevokeReason(e.target.value)}
                          placeholder={t('Enter reason for revoking approval (e.g. member policy violation, fraud, incorrect amount)...')}
                          className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRevokeConfirm(false);
                            setRevokeReason('');
                          }}
                          disabled={revoking}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleRevoke}
                          disabled={revoking || !revokeReason.trim()}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {revoking ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Processing...')}</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3.5 h-3.5" />
                              <span>{t('Confirm Revocation')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Resolution Action Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t('Select Resolution Action')} <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {request.category === 'CLASS_CANCELLATION' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setResolutionType('ISSUE_CREDIT')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                          resolutionType === 'ISSUE_CREDIT'
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        <span className={`font-black text-xs flex items-center justify-between ${
                          resolutionType === 'ISSUE_CREDIT'
                            ? 'text-emerald-950 dark:text-emerald-100'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          <span className="flex items-center gap-1.5">
                            <CreditCard className={`w-4 h-4 ${
                              resolutionType === 'ISSUE_CREDIT'
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`} />
                            {t('Issue Credit Voucher (Recommended)')}
                          </span>
                          {resolutionType === 'ISSUE_CREDIT' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          )}
                        </span>
                        <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                          resolutionType === 'ISSUE_CREDIT'
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {t('Generates 60-day voucher code for member to re-enroll without losing money.')}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setResolutionType('GYM_PASS')}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                          resolutionType === 'GYM_PASS'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                        }`}
                      >
                        <span className={`font-black text-xs flex items-center justify-between ${
                          resolutionType === 'GYM_PASS'
                            ? 'text-blue-950 dark:text-blue-100'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}>
                          <span className="flex items-center gap-1.5">
                            <Clock className={`w-4 h-4 ${
                              resolutionType === 'GYM_PASS'
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`} />
                            {t('Grant Free 1-Month Gym Pass')}
                          </span>
                          {resolutionType === 'GYM_PASS' && (
                            <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                          )}
                        </span>
                        <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                          resolutionType === 'GYM_PASS'
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {t('Alternative perk when student prefers gym workouts over class credit.')}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResolutionType('APPROVE_GENERAL')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        resolutionType === 'APPROVE_GENERAL'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                      }`}
                    >
                      <span className={`font-black text-xs flex items-center justify-between ${
                        resolutionType === 'APPROVE_GENERAL'
                          ? 'text-emerald-950 dark:text-emerald-100'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${
                            resolutionType === 'APPROVE_GENERAL'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`} />
                          {t('Approve & Resolve Issue')}
                        </span>
                        {resolutionType === 'APPROVE_GENERAL' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        )}
                      </span>
                      <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                        resolutionType === 'APPROVE_GENERAL'
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {t('Acknowledge repair, feedback or inquiry as fully resolved.')}
                      </span>
                    </button>
                  )}

                  {isManager ? (
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionType('CASH_REFUND');
                        setResponseNote(`Quản lý trung tâm đã phê duyệt hoàn tiền học phí lớp ${request.className || ""}. Số tiền ${formatMoney(creditAmount)} sẽ được hoàn trả trực tiếp tại quầy hoặc chuyển khoản.`);
                      }}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        resolutionType === 'CASH_REFUND'
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 shadow-md ring-2 ring-teal-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                      }`}
                    >
                      <span className={`font-black text-xs flex items-center justify-between ${
                        resolutionType === 'CASH_REFUND'
                          ? 'text-teal-950 dark:text-teal-100'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <DollarSign className={`w-4 h-4 ${
                            resolutionType === 'CASH_REFUND'
                              ? 'text-teal-700 dark:text-teal-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`} />
                          {t('Phê Duyệt Hoàn Tiền Mặt / Chuyển Khoản')}
                        </span>
                        {resolutionType === 'CASH_REFUND' && (
                          <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                        )}
                      </span>
                      <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                        resolutionType === 'CASH_REFUND'
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {t('Duyệt lệnh xuất quỹ/kế toán chuyển khoản hoàn trả học phí cho học viên.')}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResolutionType('ESCALATE')}
                      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                        resolutionType === 'ESCALATE'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 shadow-md ring-2 ring-purple-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                      }`}
                    >
                      <span className={`font-black text-xs flex items-center justify-between ${
                        resolutionType === 'ESCALATE'
                          ? 'text-purple-950 dark:text-purple-100'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <ArrowUpRight className={`w-4 h-4 ${
                            resolutionType === 'ESCALATE'
                              ? 'text-purple-700 dark:text-purple-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`} />
                          {t('Escalate to Center Manager')}
                        </span>
                        {resolutionType === 'ESCALATE' && (
                          <CheckCircle2 className="w-4 h-4 text-purple-700 dark:text-purple-400 shrink-0" />
                        )}
                      </span>
                      <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                        resolutionType === 'ESCALATE'
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {t('For special cash refunds or high-dispute exceptions.')}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setResolutionType('REJECT')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      resolutionType === 'REJECT'
                        ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 shadow-md ring-2 ring-rose-500/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-sm'
                    }`}
                  >
                    <span className={`font-black text-xs flex items-center justify-between ${
                      resolutionType === 'REJECT'
                        ? 'text-rose-950 dark:text-rose-100'
                        : 'text-slate-800 dark:text-slate-100'
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <X className={`w-4 h-4 ${
                          resolutionType === 'REJECT'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`} />
                        {t('Reject Request')}
                      </span>
                      {resolutionType === 'REJECT' && (
                        <CheckCircle2 className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
                      )}
                    </span>
                    <span className={`text-[11px] mt-1.5 leading-snug font-medium ${
                      resolutionType === 'REJECT'
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {t('Course completed >80% or violates center policies.')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Conditional Credit Voucher fields */}
              {resolutionType === 'ISSUE_CREDIT' && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/60 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    <CreditCard className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <span>{t('Thiết lập Voucher Tín Dụng Hoàn Trả')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="credit-amount-input" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('Voucher Credit Amount (VND)')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="credit-amount-input"
                        type="number"
                        min="10000"
                        step="5000"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="credit-validity-input" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('Validity (Days)')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="credit-validity-input"
                        type="number"
                        min="7"
                        max="365"
                        value={validDays}
                        onChange={(e) => setValidDays(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Cash Refund fields */}
              {resolutionType === 'CASH_REFUND' && (
                <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-700/60 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950 dark:text-teal-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    <span>{t('Xác nhận lệnh hoàn tiền mặt / chuyển khoản (Thẩm quyền Quản lý)')}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="cash-refund-amount" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('Số tiền duyệt hoàn (VNĐ)')} <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="cash-refund-amount"
                        type="number"
                        min="0"
                        step="1000"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 shadow-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t('Hình thức chi trả')}
                      </label>
                      <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm flex items-center h-[46px]">
                        {t('Tiền mặt tại quầy / Chuyển khoản ngân hàng')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Response Note (sent to member notification) */}
              <div className="space-y-1.5">
                <label htmlFor="response-note-textarea" className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                  {t('Official Response & Explanation to Member')} <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  id="response-note-textarea"
                  rows={3}
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder={t('Enter response note explaining resolution or rejection reason. This will be sent directly to the member.')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none shadow-sm"
                  required
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            {isReadOnly ? (
              <div className="flex items-center gap-2">
                {isManager && (request?.status === 'APPROVED' || request?.status === 'RESOLVED') && !showRevokeConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowRevokeConfirm(true)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-semibold text-sm transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('Revoke Approval')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  {t('Close')}
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RespondSupportModal;
