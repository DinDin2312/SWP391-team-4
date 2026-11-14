import React, { useState, useEffect } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert,
  Send, User, Phone, Mail, BookOpen, Clock,
  CreditCard, ArrowUpRight, RotateCcw, Sparkles,
  Wrench, UserCheck, Copy, Check
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import {
  getPriorityBadge as renderPriorityBadge,
  getDisplayTitle,
  formatRespondedAt,
  formatSupportDate,
  getStatusBadge,
  cleanSupportTitle,
  parseSupportRequestDetails,
  getAttendancePolicySummary,
  isCashRefundRequest,
  canStaffProcessTicket,
  EvidencePreviewBox
} from '../../../utils/supportDisplayUtils';
import receptionistService from '../services/receptionistService';
import { splitCode } from '../../manager/components/classSearch';

const COLOR_THEMES = {
  emerald: {
    selected: 'border-emerald-600 bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/40',
    unselected: 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text)] hover:border-emerald-500/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
    descSelected: 'text-emerald-50'
  },
  blue: {
    selected: 'border-blue-600 bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/40',
    unselected: 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text)] hover:border-blue-500/50',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
    descSelected: 'text-blue-50'
  },
  purple: {
    selected: 'border-purple-600 bg-purple-600 text-white shadow-lg ring-2 ring-purple-400/40',
    unselected: 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text)] hover:border-purple-500/50',
    icon: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30',
    descSelected: 'text-purple-50'
  },
  rose: {
    selected: 'border-rose-600 bg-rose-600 text-white shadow-lg ring-2 ring-rose-400/40',
    unselected: 'border-[var(--border)] bg-[var(--surface-hover)] text-[var(--text)] hover:border-rose-500/50',
    icon: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30',
    descSelected: 'text-rose-50'
  }
};

const ResolutionActionCard = ({
  actionType,
  selectedType,
  onSelect,
  icon: Icon,
  title,
  desc,
  color = 'blue',
  isMemberChoice = false,
  memberChoiceLabel,
  disabled = false
}) => {
  const isSelected = selectedType === actionType;
  const theme = COLOR_THEMES[color] || COLOR_THEMES.blue;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(actionType)}
      className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
        disabled ? "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800" : 
        isSelected ? theme.selected : theme.unselected
      }`}
    >
      <span className="font-bold text-xs flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : theme.icon}`} />
          <span className={isSelected ? 'text-white font-black' : 'text-[var(--text)]'}>
            {title}
          </span>
        </span>
        <div className="flex items-center gap-1.5">
          {isMemberChoice && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                isSelected
                  ? 'bg-white/20 text-white border border-white/40'
                  : theme.badge
              }`}
            >
              ★ {memberChoiceLabel}
            </span>
          )}
          {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
        </div>
      </span>
      <span
        className={`text-[11px] mt-1.5 leading-snug font-medium ${
          isSelected ? theme.descSelected : 'text-[var(--text-muted)]'
        }`}
      >
        {desc}
      </span>
    </button>
  );
};

const NON_CANCELLATION_RESOLUTIONS = {
  COACH_FEEDBACK: {
    primary: { actionType: 'ACKNOWLEDGE_AND_TRAIN', icon: UserCheck, titleKey: 'Acknowledge & Work with Coach', descKey: 'Remind coach and review with Department Head to enhance teaching quality.' },
    secondary: { actionType: 'TRANSFER_CLASS_SUGGESTION', icon: BookOpen, titleKey: 'Suggest Class / Coach Transfer', descKey: 'Consult and support member to transfer to a more suitable class or coach.' },
    escalate: { titleKey: 'Escalate to Discipline Management', descKey: 'Serious conduct or policy violation requiring management action.' },
    reject: { titleKey: 'Dismiss Feedback (Unsubstantiated)', descKey: 'After reviewing history/cameras, coach followed all standard protocols.' }
  },
  FACILITY_ISSUE: {
    primary: { actionType: 'ASSIGN_MAINTENANCE', icon: Wrench, titleKey: 'Dispatch Maintenance Immediately', descKey: 'Issue repair order to maintenance team and post equipment inspection notices.' },
    secondary: { actionType: 'SCHEDULED_FIX', icon: Clock, titleKey: 'Announce Repair Schedule', descKey: 'Equipment under maintenance, expected to be back in service within 24-48 hours.' },
    escalate: { titleKey: 'Escalate to Facility Management (Replacement)', descKey: 'Severely damaged equipment requiring manager approval for full replacement.' },
    reject: { titleKey: 'Inspection Complete (Normal Operation)', descKey: 'Technicians verified equipment works properly; staff will guide member on usage.' }
  },
  COMPLAINT: {
    primary: { actionType: 'RESOLVE_COMPLAINT', icon: CheckCircle2, titleKey: 'Apologize & Resolve Issue', descKey: 'Apologize to member, record shortcomings, and implement corrective workflows.' },
    secondary: { actionType: 'CONTACT_DIRECTLY', icon: Phone, titleKey: 'Contact Directly to Reconcile', descKey: 'Duty manager/receptionist has met or called member directly to resolve satisfactorily.' },
    escalate: { titleKey: 'Escalate to Center Management', descKey: 'Complex dispute requiring center manager direct intervention.' },
    reject: { titleKey: 'Dismiss Complaint (No Violation)', descKey: 'Investigation confirmed procedures were followed with no misconduct by center.' }
  },
  GENERAL_INQUIRY: {
    primary: { actionType: 'ANSWER_INQUIRY', icon: CheckCircle2, titleKey: 'Answer & Guide Member', descKey: 'Provide complete answers and instructions addressing member inquiry.' },
    secondary: { actionType: 'CONTACT_DIRECTLY', icon: Phone, titleKey: 'Consult Directly / via Phone', descKey: 'Receptionist has contacted member directly at the front desk or via hotline.' },
    escalate: { titleKey: 'Escalate to Manager for Answer', descKey: 'Policy questions exceeding front desk receptionist authority.' },
    reject: { titleKey: 'Close Support Request', descKey: 'Inquiry has been addressed or closed per member request.' }
  }
};

const RespondSupportModal = ({ isOpen, request, isManager = false, onClose, onSuccess }) => {
  const currentLang = useLanguage();

  const [resolutionType, setResolutionType] = useState('ISSUE_CREDIT'); // 'ISSUE_CREDIT' | 'ESCALATE' | 'REJECT'
  const [creditAmount, setCreditAmount] = useState(0);
  const [validDays, setValidDays] = useState(60);
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const policy = getAttendancePolicySummary(request);
  const isClassCancellationOrCompensation = policy.isCancellationLike;
  const details = parseSupportRequestDetails(request?.content, request);

  const getNoteTemplate = (type, amt = creditAmount, days = validDays) => {
    const rolePrefix = isManager ? (currentLang === 'vi' ? 'Quản lý trung tâm' : 'Center Management') : (currentLang === 'vi' ? 'Lễ tân' : 'Reception');
    const clsNameVi = request?.className ? ` lớp "${request.className}"` : '';
    const clsNameEn = request?.className ? ` for class "${request.className}"` : '';
    const rawAmt = Number(amt ?? 0);
    const suggested = Math.round(Number(request?.calculatedCreditAmount ?? request?.proratedCredit ?? request?.classPrice ?? 0) / 1000) * 1000;
    const effectiveAmt = rawAmt > 0 ? rawAmt : suggested;
    const roundedAmt = Math.round(Number(effectiveAmt || 0) / 1000) * 1000;
    const formattedAmt = formatMoney(roundedAmt);
    const parsedDays = Math.max(7, Math.min(365, Number.parseInt(days, 10) || 60));

    if (currentLang === 'vi') {
      switch (type) {
        case 'ISSUE_CREDIT':
          return `${rolePrefix} đã duyệt bảo lưu${clsNameVi} và cấp Credit ${formattedAmt} (hạn ${parsedDays} ngày).`;
        case 'ACKNOWLEDGE_AND_TRAIN':
          return `${rolePrefix} đã ghi nhận phản hồi về HLV${clsNameVi} và trao đổi với bộ môn để cải thiện chất lượng giảng dạy.`;
        case 'TRANSFER_CLASS_SUGGESTION':
          return `${rolePrefix} đã ghi nhận góp ý và hỗ trợ tư vấn chuyển sang lớp khác phù hợp hơn.`;
        case 'ASSIGN_MAINTENANCE':
          return `${rolePrefix} đã chuyển yêu cầu kiểm tra, bảo trì thiết bị tới bộ phận kỹ thuật.`;
        case 'SCHEDULED_FIX':
          return 'Thiết bị đang được bảo trì và dự kiến hoạt động lại trong 24h - 48h tới.';
        case 'RESOLVE_COMPLAINT':
          return `Trung tâm xin lỗi học viên về trải nghiệm vừa qua. ${rolePrefix} đã phối hợp xử lý khắc phục vấn đề này.`;
        case 'ANSWER_INQUIRY':
          return `${rolePrefix} đã giải đáp thắc mắc của bạn. Nếu cần hỗ trợ thêm, vui lòng liên hệ quầy lễ tân.`;
        case 'CONTACT_DIRECTLY':
          return `${rolePrefix} đã liên hệ trực tiếp với học viên để hướng dẫn và hỗ trợ chi tiết.`;
        case 'ESCALATE':
          return `${rolePrefix} đã chuyển tiếp yêu cầu lên Quản lý trung tâm xem xét, giải quyết.`;
        case 'REJECT':
          return `${rolePrefix} rất tiếc chưa thể duyệt yêu cầu do chưa đáp ứng điều kiện quy định.`;
        case 'APPROVE_GENERAL':
        default:
          return `${rolePrefix} đã tiếp nhận và xử lý yêu cầu của bạn.`;
      }
    } else {
      switch (type) {
        case 'ISSUE_CREDIT':
          return `${rolePrefix} approved tuition retention${clsNameEn} with a ${parsedDays}-day credit of ${formattedAmt}.`;
        case 'ACKNOWLEDGE_AND_TRAIN':
          return `${rolePrefix} acknowledged coach feedback${clsNameEn} and will review with the Head of Department.`;
        case 'TRANSFER_CLASS_SUGGESTION':
          return `${rolePrefix} acknowledged feedback and suggested transferring to another suitable class.`;
        case 'ASSIGN_MAINTENANCE':
          return `${rolePrefix} dispatched a maintenance inspection request to the technical team.`;
        case 'SCHEDULED_FIX':
          return 'Equipment has been tagged for maintenance and should return to service within 24-48 hours.';
        case 'RESOLVE_COMPLAINT':
          return `We apologize for the inconvenience. ${rolePrefix} has coordinated with the team to resolve this issue.`;
        case 'ANSWER_INQUIRY':
          return `${rolePrefix} answered your inquiry. Feel free to reach out at Reception if you need more help.`;
        case 'CONTACT_DIRECTLY':
          return `${rolePrefix} contacted the member directly to assist with the request.`;
        case 'ESCALATE':
          return `${rolePrefix} escalated the request to Center Management for review.`;
        case 'REJECT':
          return `${rolePrefix} could not approve this request under center policy.`;
        case 'APPROVE_GENERAL':
        default:
          return `${rolePrefix} received and processed your request.`;
      }
    }
  };

  const handleSelectResolution = (type) => {
    setResolutionType(type);
    const suggested = Math.round(Number(request?.calculatedCreditAmount ?? request?.proratedCredit ?? request?.classPrice ?? 0) / 1000) * 1000;
    const effectiveAmt = (creditAmount > 0) ? creditAmount : suggested;
    if (creditAmount <= 0 && effectiveAmt > 0) {
      setCreditAmount(effectiveAmt);
    }
    setResponseNote(getNoteTemplate(type, effectiveAmt, validDays));
  };

  const handleAmountChange = (newVal) => {
    setCreditAmount(newVal);
    const parsed = Number.parseFloat(newVal) || 0;
    setResponseNote(getNoteTemplate(resolutionType, parsed, validDays));
  };

  const handleValidDaysChange = (newDays) => {
    setValidDays(newDays);
    if (resolutionType === 'ISSUE_CREDIT') {
      const parsed = Number.parseFloat(creditAmount) || 0;
      setResponseNote(getNoteTemplate(resolutionType, parsed, newDays));
    }
  };

  const handleCopyCreditCode = async () => {
    if (!request?.generatedCreditCode) return;
    try {
      await globalThis.navigator?.clipboard?.writeText(request.generatedCreditCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(false);
    }
  };

  useEffect(() => {
    if (isOpen && request) {
      setShowRevokeConfirm(false);
      setCopiedCode(false);
      setRevokeReason('');
      const rawSuggested = request.calculatedCreditAmount ?? request.proratedCredit ?? request.classPrice ?? 0;
      const suggested = Math.round(Number(rawSuggested) / 1000) * 1000;
      setCreditAmount(suggested);
      setValidDays(60);

      let defaultType = 'APPROVE_GENERAL';

      if (isClassCancellationOrCompensation) {
        defaultType = 'ISSUE_CREDIT';
      } else if (request.category === 'COACH_FEEDBACK') {
        defaultType = isManager ? 'ACKNOWLEDGE_AND_TRAIN' : 'ESCALATE';
      } else if (request.category === 'FACILITY_ISSUE') {
        defaultType = 'ASSIGN_MAINTENANCE';
      } else if (request.category === 'COMPLAINT') {
        defaultType = 'RESOLVE_COMPLAINT';
      } else {
        defaultType = 'ANSWER_INQUIRY';
      }

      setResolutionType(defaultType);
      setResponseNote(getNoteTemplate(defaultType, suggested, 60));
      setError('');
    }
  }, [isOpen, request, isManager, currentLang]);

  const isClosed = request?.status === 'APPROVED' || request?.status === 'RESOLVED' || request?.status === 'REJECTED';
  const isEscalatedForReceptionist = !isManager && request?.status === 'ESCALATED';
  const isCoachFeedbackForReceptionist = !isManager && request?.category === 'COACH_FEEDBACK';
  const isFacilityIssueForReceptionist = !isManager && request?.category === 'FACILITY_ISSUE';
  const isCancellationForReceptionist = !isManager && (request?.category === 'CLASS_CANCELLATION' || request?.category === 'REFUND_REQUEST');
  const isCashRefundForReceptionist = !isManager && !isClosed && isCashRefundRequest(request);
  const isReadOnly = isClosed || !canStaffProcessTicket(request, isManager);

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
        let parsed = Number.parseFloat(creditAmount) || 0;
        if (parsed <= 0) {
          parsed = Math.round(Number(request?.calculatedCreditAmount ?? request?.proratedCredit ?? request?.classPrice ?? 0) / 1000) * 1000;
        }
        finalCreditAmount = parsed;
      } else if (resolutionType === 'APPROVE_GENERAL') {
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
        validityDays: resolutionType === 'ISSUE_CREDIT' ? Number.parseInt(validDays, 10) : 60,
        creditExpiryDays: resolutionType === 'ISSUE_CREDIT' ? Number.parseInt(validDays, 10) : 60
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


  const renderResolutionActions = () => {
    let actions = [];

    if (isClassCancellationOrCompensation) {
      actions = [
        {
          actionType: 'ISSUE_CREDIT',
          icon: CreditCard,
          title: t('Issue Credit Voucher (Approved)'),
          desc: t('Generates 60-day Credit Voucher and releases class bookings for the member.'),
          color: 'emerald',
          disabled: false,
          isMemberChoice: true
        },
        {
          actionType: 'REJECT',
          icon: X,
          title: t('Reject Request'),
          desc: t('Decline cancellation request; member bookings stay unchanged on schedule.'),
          color: 'rose',
          isMemberChoice: false
        }
      ];
    } else {
      const cfg = NON_CANCELLATION_RESOLUTIONS[request.category] || NON_CANCELLATION_RESOLUTIONS.GENERAL_INQUIRY;
      if (request.category === 'COACH_FEEDBACK' && !isManager) {
        actions = [
          {
            actionType: 'ESCALATE',
            icon: ArrowUpRight,
            color: 'purple',
            title: t('Escalate to Training Management for Review & Resolution'),
            desc: t("Coach complaints fall under the Center Manager's authority. Reception logs and routes directly."),
            isMemberChoice: true
          }
        ];
      } else if (request.category === 'COACH_FEEDBACK' && isManager) {
        actions = [
          { ...cfg.primary, color: 'emerald', title: t(cfg.primary.titleKey), desc: t(cfg.primary.descKey) },
          { ...cfg.secondary, color: 'blue', title: t(cfg.secondary.titleKey), desc: t(cfg.secondary.descKey) },
          { actionType: 'REJECT', icon: X, color: 'rose', title: t(cfg.reject.titleKey), desc: t(cfg.reject.descKey) }
        ];
      } else {
        actions = [
          { ...cfg.primary, color: 'emerald', title: t(cfg.primary.titleKey), desc: t(cfg.primary.descKey) },
          { ...cfg.secondary, color: 'blue', title: t(cfg.secondary.titleKey), desc: t(cfg.secondary.descKey) },
          ...(!(isManager && request.status === 'ESCALATED')
            ? [{ actionType: 'ESCALATE', icon: ArrowUpRight, color: 'purple', title: t(cfg.escalate.titleKey), desc: t(cfg.escalate.descKey) }]
            : []),
          { actionType: 'REJECT', icon: X, color: 'rose', title: t(cfg.reject.titleKey), desc: t(cfg.reject.descKey) }
        ];
      }
    }

    return (
      <>
        {actions.map((act) => (
          <ResolutionActionCard
            key={act.actionType}
            actionType={act.actionType}
            selectedType={resolutionType}
            onSelect={handleSelectResolution}
            icon={act.icon}
            title={act.title}
            desc={act.desc}
            color={act.color}
            isMemberChoice={act.isMemberChoice}
            memberChoiceLabel={t("Member's Choice")}
            disabled={act.disabled}
          />
        ))}
      </>
    );
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
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="respond-modal-title" className="text-lg font-bold text-[var(--text)]">
                {isReadOnly ? t('Support Ticket Details') : t('Resolve Support Ticket')} #{request.requestId}
              </h2>
              <p className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>
                  {request.category === 'COACH_FEEDBACK'
                    ? cleanSupportTitle(request)
                    : getDisplayTitle(request.title)}
                </span>
                <span>&bull;</span>
                <span>{t('Priority:')}</span>
                {renderPriorityBadge(request.priority, request.preferredResolution, '', request.category)}
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
          <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-bold text-[var(--text)]">{request.userFullName || request.memberName}</span>
            </div>
            {(request.userPhone || request.memberPhone) && (
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-mono">{request.userPhone || request.memberPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Mail className="w-3.5 h-3.5" />
              <span>{request.userEmail || request.memberEmail}</span>
            </div>
            {request.createdAt && (
              <div className="flex items-center gap-1 text-[var(--text-muted)] font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatSupportDate(request.createdAt)}</span>
              </div>
            )}
          </div>

          {/* Ticket Request Content */}
          {request.category === 'COACH_FEEDBACK' ? (
            <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/25 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  {t('Coach Feedback Topic')}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  {t(details.aspect || 'Coach & Training Feedback')}
                </span>
              </div>

              {details.targetInfo && (
                <div className="text-xs text-[var(--text)] flex flex-wrap items-center gap-2">
                  <span className="text-[var(--text-muted)] font-medium">{t('Associated Target')}:</span>
                  <span className="font-semibold text-[var(--text)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                    {details.targetInfo}
                  </span>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                  {t('Student Feedback & Comments')}:
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text)] whitespace-pre-line leading-relaxed shadow-xs">
                  "{details.bodyText || request.title || t('No additional comments provided.')}"
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                {t('Member Request Description')}
              </div>
              {details.chips.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {details.chips.map((chip, idx) => (
                    <div
                      key={`${chip.key}-${idx}`}
                      className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs flex flex-col gap-0.5"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {t(chip.labelKey)}
                      </span>
                      <span className="font-semibold text-[var(--text)] break-words">
                        {t(chip.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {(details.bodyText || (!details.chips.length && request.content)) && (
                <p className="text-sm text-[var(--text)] whitespace-pre-line leading-relaxed">
                  {details.bodyText || request.content}
                </p>
              )}
            </div>
          )}

          {/* Associated Class Proration Card */}
          {request.classId && (() => {
            const { code, name } = splitCode(request.className || '');
            return (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 shrink-0" />
                    {t('Enrolled Course Information')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {code && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-800 dark:text-blue-200 border border-blue-500/30">
                        {code}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {name || request.className}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--text-muted)] block">{t('Total Fee')}</span>
                    <span className="font-bold text-[var(--text)]">{formatMoney(request.classPrice)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--text-muted)] block">{t('Total Sessions')}</span>
                    <span className="font-bold text-[var(--text)]">{policy.total}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--text-muted)] block">{t('Attended')}</span>
                    <span className="font-bold text-emerald-600">{policy.attended}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-[var(--text-muted)] block">{t('Remaining')}</span>
                    <span className="font-bold text-amber-600">{policy.remaining}</span>
                  </div>
                </div>
                {policy.total > 0 && isClassCancellationOrCompensation && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--text-muted)]">
                        {t('Attendance Progress')}: <strong className="text-[var(--text)]">{policy.percent}%</strong>
                      </span>
                    </div>
                    <div className="relative h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-emerald-500"
                        style={{ width: `${policy.percent}%` }}
                      />
                    </div>
                  </div>
                )}
                {isClassCancellationOrCompensation && (
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="font-bold text-[var(--text)]">
                      {t('Prorated Remaining Value (Recommended Credit):')}
                    </span>
                    <span className="text-base font-extrabold text-[var(--primary)]">
                      {formatMoney(request.calculatedCreditAmount ?? request.proratedCredit ?? request.classPrice ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Uploaded Evidence Preview (for late cancellation & admin audit) */}
          {request.evidenceUrl && (
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                {t('Supporting Evidence File / Photo')}
              </div>
              <EvidencePreviewBox evidenceUrl={request.evidenceUrl} />
            </div>
          )}

          {/* Member's Requested Benefit (concise single-row badge) */}
          {request.preferredResolution && (
            <div className="px-3.5 py-2.5 rounded-xl border bg-[var(--surface-hover)] border-[var(--border)] flex items-center justify-between gap-2 shadow-sm">
              <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                {t('Requested Benefit')}
              </span>
              {request.preferredResolution === 'NONE' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
                  {t('No Compensation')}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> {t('Credit Voucher')}
                </span>
              )}
            </div>
          )}

          {/* If Read-Only (Closed Ticket or Admin-Only Ticket for Receptionist): Show Concise Summary */}
          {isReadOnly ? (
            <div className="space-y-4">
              {(isCoachFeedbackForReceptionist || isFacilityIssueForReceptionist || isCancellationForReceptionist) && !isClosed && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <ArrowUpRight className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span>{t('Management Review Only')}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                    {isCoachFeedbackForReceptionist
                      ? t('Coach feedback is handled confidentially by Center Management.')
                      : isCancellationForReceptionist
                        ? t('Only Admin / Center Management can review evidence and approve or reject class cancellation requests.')
                        : t('Facility and equipment reports are routed directly to Center Management for technical inspection and resolution.')}
                  </p>
                </div>
              )}

              {!isCoachFeedbackForReceptionist && !isFacilityIssueForReceptionist && !isCancellationForReceptionist && isCashRefundForReceptionist && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t('Admin-Only Action')}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                    {t('Only Admin / Center Management can review and finalize this request.')}
                  </p>
                </div>
              )}

              {!isCoachFeedbackForReceptionist && !isFacilityIssueForReceptionist && !isCancellationForReceptionist && !isCashRefundForReceptionist && isEscalatedForReceptionist && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <ArrowUpRight className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span>{t('Escalated to Management')}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                    {t('This ticket has been escalated to Center Management for review.')}
                  </p>
                </div>
              )}

              {/* Resolution Result Summary Card */}
              {isClosed && (
                <div className="p-4 rounded-xl border space-y-3.5 bg-[var(--surface-hover)] border-[var(--border)]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                      {t('Resolution Outcome')}
                    </span>
                    <div>{getStatusBadge(request.status)}</div>
                  </div>

                  {/* If Credit Voucher was generated */}
                  {request.generatedCreditCode && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4" /> {t('Credit Voucher Issued')}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="text-sm font-black text-[var(--text)] tracking-wider">
                            {request.generatedCreditCode}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyCreditCode}
                            className="px-2 py-0.5 rounded-md border border-emerald-500/30 bg-[var(--surface)] hover:bg-emerald-500/15 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1 transition-colors"
                            aria-label={t('Copy voucher code')}
                          >
                            {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedCode ? t('Copied') : t('Copy code')}</span>
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[var(--text-muted)] font-medium">{t('Amount')}</div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(request.generatedCreditAmount || request.calculatedCreditAmount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Responder Information & Official Response */}
                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300 font-semibold">
                      <span>{t('Processed By')}: <strong className="text-slate-900 dark:text-white font-bold">{request.responderName || t('System Automated')}</strong></span>
                      {request.respondedAt && <span>{formatRespondedAt(request.respondedAt)}</span>}
                    </div>
                    {request.responseNote && (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-900 dark:text-zinc-100 whitespace-pre-line leading-relaxed shadow-sm">
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 block mb-1">
                          {t('Official Response to Member')}:
                        </span>
                        "{request.responseNote}"
                      </div>
                    )}
                  </div>

                  {/* Revoke Confirmation Section (for Manager) */}
                  {showRevokeConfirm && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 space-y-3 shadow-md animate-fade-in">
                      <div className="flex items-center gap-2 text-sm font-extrabold text-red-800 dark:text-red-300">
                        <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
                        <span>{t('Revoke Refund & Resolution')}</span>
                      </div>
                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 text-xs text-red-950 dark:text-red-200 leading-relaxed font-semibold shadow-sm">
                        <span className="font-extrabold text-red-700 dark:text-red-400">{t('Warning:')} </span>
                        {t('Warning: Revoking will invalidate the granted credit voucher in the member\'s wallet and set the ticket to Rejected. If the voucher has already been spent, revocation will be blocked.')}
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="revoke-reason-input" className="block text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wide">
                          {t('Revoke Reason (Required)')} <span className="text-red-600 font-bold">*</span>
                        </label>
                        <textarea
                          id="revoke-reason-input"
                          rows={2}
                          value={revokeReason}
                          onChange={(e) => setRevokeReason(e.target.value)}
                          placeholder={t('Enter reason for revoking approval (e.g. member policy violation, fraud, incorrect amount)...')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border-2 border-slate-300 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none shadow-sm"
                          required
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRevokeConfirm(false);
                            setRevokeReason('');
                          }}
                          disabled={revoking}
                          className="px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors shadow-sm"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleRevoke}
                          disabled={revoking || !revokeReason.trim()}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/30 disabled:opacity-50"
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
              {/* Coach Feedback Policy Alert for Receptionist */}
              {request.category === 'COACH_FEEDBACK' && !isManager && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-purple-900 dark:text-purple-200">
                      {t('Coach complaints fall under Manager authority')}
                    </div>
                    <p className="text-[var(--text-muted)] leading-relaxed font-medium">
                      {t('Reception does not have authority to handle Coach performance or discipline. Please escalate to Center Management.')}
                    </p>
                  </div>
                </div>
              )}

              {/* Resolution Action Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-[var(--text)]">
                  {t('Select Resolution Action')} <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {renderResolutionActions()}
                </div>
              </div>

              {/* Conditional Amount & Validity Fields for Credit Voucher */}
              {resolutionType === 'ISSUE_CREDIT' && (
                <div className="p-4 rounded-xl bg-[var(--surface-hover)] border-2 border-emerald-500/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="resolution-amount-input" className="block text-xs font-black text-[var(--text)]">
                        {t('Voucher Credit Amount (VND)')}{' '}
                        <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="resolution-amount-input"
                        type="number"
                        min="0"
                        step="any"
                        value={creditAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor="credit-validity-input" className="block text-xs font-black text-[var(--text)]">
                          {t('Validity (Days)')} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                          {[30, 60, 90].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleValidDaysChange(preset)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                                Number(validDays) === preset
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                              }`}
                            >
                              {preset} {t('days')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        id="credit-validity-input"
                        type="number"
                        min="7"
                        max="365"
                        value={validDays}
                        onChange={(e) => handleValidDaysChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Response Note (sent to member notification) */}
              <div className="space-y-1.5">
                <label htmlFor="response-note-textarea" className="block text-xs font-black text-[var(--text)]">
                  {t('Official Response & Explanation to Member')} <span className="text-red-500 font-bold">*</span>
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
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {!submitting && <Send className="w-4 h-4" />}
                  <span>{submitting ? t('Processing...') : t('Submit Resolution & Notify Member')}</span>
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
