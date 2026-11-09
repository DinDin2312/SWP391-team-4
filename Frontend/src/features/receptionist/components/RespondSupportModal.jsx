import React, { useState, useEffect } from 'react';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert,
  Send, User, Phone, Mail, BookOpen, Clock, Calendar,
  CreditCard, ArrowUpRight, DollarSign, RotateCcw, Dumbbell, Sparkles,
  Wrench, UserCheck, AlertCircle
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import {
  getPriorityBadge as renderPriorityBadge,
  getDisplayTitle,
  formatRespondedAt,
  getStatusBadge,
  cleanSupportTitle,
  parseCoachFeedback
} from '../../../utils/supportDisplayUtils';
import receptionistService from '../services/receptionistService';

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
  SCHEDULE_SUPPORT: {
    primary: { actionType: 'APPROVE_SCHEDULE_CHANGE', icon: Calendar, titleKey: 'Support Session Swap / Makeup', descKey: 'Receptionist has updated new class schedule for member on management system.' },
    secondary: { actionType: 'GUIDE_BOOKING', icon: BookOpen, titleKey: 'Guide App Self-Reschedule', descKey: 'Instruct member on how to reschedule sessions via app 24h in advance.' },
    escalate: { titleKey: 'Escalate to Manager (Special Slot Allocation)', descKey: 'Out-of-policy session schedule requests requiring management approval.' },
    reject: { titleKey: 'Decline Reschedule (Full / Expired)', descKey: 'Desired session is fully booked or notification was submitted after cutoff deadline.' }
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

  const [resolutionType, setResolutionType] = useState('ISSUE_CREDIT'); // 'ISSUE_CREDIT' | 'GYM_PASS' | 'ESCALATE' | 'REJECT'
  const [creditAmount, setCreditAmount] = useState(0);
  const [validDays, setValidDays] = useState(60);
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  const isClassCancellationOrCompensation = Boolean(
    request?.category === 'CLASS_CANCELLATION' ||
    request?.category === 'REFUND_REQUEST' ||
    (request?.preferredResolution && ['ISSUE_CREDIT', 'GYM_PASS', 'CASH_REFUND'].includes(request.preferredResolution)) ||
    (request?.title && /cancellation|hủy|bảo lưu|retention/i.test(request.title))
  );

  const exceedsEightyPercent = Boolean(
    request?.totalSessions > 0 && ((request?.attendedSessions || 0) / request.totalSessions > 0.8)
  );

  const getNoteTemplate = (type, amt = creditAmount) => {
    const rolePrefix = isManager ? (currentLang === 'vi' ? 'Quản lý trung tâm' : 'Center Management') : (currentLang === 'vi' ? 'Lễ tân' : 'Reception');
    const clsNameVi = request?.className ? ` lớp "${request.className}"` : '';
    const clsNameEn = request?.className ? ` for class "${request.className}"` : '';
    const rawAmt = Number(amt ?? 0);
    const suggested = Math.round(Number(request?.calculatedCreditAmount ?? request?.proratedCredit ?? request?.classPrice ?? 0) / 1000) * 1000;
    const effectiveAmt = rawAmt > 0 ? rawAmt : suggested;
    const roundedAmt = Math.round(Number(effectiveAmt || 0) / 1000) * 1000;
    const formattedAmt = formatMoney(roundedAmt);

    if (currentLang === 'vi') {
      switch (type) {
        // Cancellation actions
        case 'ISSUE_CREDIT':
          return `${rolePrefix} đã phê duyệt bảo lưu${clsNameVi}. Mã tín dụng 60 ngày trị giá ${formattedAmt} đã được cấp vào ví tài khoản học viên.`;
        case 'GYM_PASS':
          return `${rolePrefix} đã phê duyệt chuyển đổi${clsNameVi} sang Thẻ tập Gym 01 tháng miễn phí. Mã voucher kích hoạt trị giá ${formattedAmt} đã được cấp vào ví tài khoản học viên.`;
        case 'CASH_REFUND':
          return `Quản lý trung tâm đã phê duyệt hoàn tiền học phí${clsNameVi}. Số tiền ${formattedAmt} sẽ được hoàn trả trực tiếp tại quầy hoặc chuyển khoản.`;

        // Coach feedback actions
        case 'ACKNOWLEDGE_AND_TRAIN':
          return `${rolePrefix} đã tiếp nhận phản ánh của học viên về HLV phụ trách${clsNameVi}. Trung tâm đã làm việc với Trưởng bộ môn và nhắc nhở HLV để chấn chỉnh, nâng cao chất lượng giảng dạy.`;
        case 'TRANSFER_CLASS_SUGGESTION':
          return `${rolePrefix} đã ghi nhận phản hồi và tư vấn hỗ trợ học viên chuyển sang lớp của HLV khác phù hợp hơn với nhu cầu tập luyện.`;

        // Facility actions
        case 'ASSIGN_MAINTENANCE':
          return `${rolePrefix} đã tiếp nhận thông tin và chuyển ngay lệnh kiểm tra, bảo trì thiết bị tới bộ phận kỹ thuật để khắc phục sớm nhất.`;
        case 'SCHEDULED_FIX':
          return 'Thiết bị đã được gắn biển bảo trì và dự kiến sẽ hoàn tất kiểm tra, sửa chữa đưa vào sử dụng trong vòng 24h - 48h tới.';

        // Schedule support actions
        case 'APPROVE_SCHEDULE_CHANGE':
          return `${rolePrefix} đã hỗ trợ cập nhật lịch học mới cho học viên trên hệ thống. Chúc bạn có buổi tập hiệu quả!`;
        case 'GUIDE_BOOKING':
          return `${rolePrefix} đã gửi hướng dẫn qua ứng dụng để học viên có thể chủ động chuyển đổi lịch tập theo thời gian biểu mong muốn.`;

        // Complaint actions
        case 'RESOLVE_COMPLAINT':
          return `Trung tâm chân thành xin lỗi học viên về trải nghiệm chưa tốt. ${rolePrefix} đã làm việc với các bộ phận liên quan để khắc phục ngay vấn đề này.`;

        // Inquiry actions
        case 'ANSWER_INQUIRY':
          return `${rolePrefix} đã giải đáp chi tiết thắc mắc của bạn. Nếu cần hỗ trợ thêm, bạn vui lòng liên hệ trực tiếp quầy lễ tân.`;
        case 'CONTACT_DIRECTLY':
          return `${rolePrefix} đã liên hệ trực tiếp với học viên để giải đáp và hướng dẫn chi tiết mọi nội dung thắc mắc.`;

        // Common actions
        case 'ESCALATE':
          return `${rolePrefix} đã tiếp nhận yêu cầu của học viên và chuyển tiếp đến Quản lý trung tâm xem xét, giải quyết.`;
        case 'REJECT':
          return exceedsEightyPercent
            ? `${rolePrefix} từ chối yêu cầu do khóa học đã diễn ra quá 80% số buổi theo quy định của trung tâm.`
            : `${rolePrefix} rất tiếc chưa thể phê duyệt yêu cầu của học viên do không thỏa điều kiện theo quy định của trung tâm.`;
        case 'APPROVE_GENERAL':
        default:
          return `${rolePrefix} đã tiếp nhận và xử lý yêu cầu của bạn.`;
      }
    } else {
      switch (type) {
        // Cancellation actions
        case 'ISSUE_CREDIT':
          return `${rolePrefix} approved tuition retention${clsNameEn}. A 60-day credit voucher worth ${formattedAmt} has been issued to member wallet.`;
        case 'GYM_PASS':
          return `${rolePrefix} approved conversion${clsNameEn} to a free 1-month Gym Pass. Activation voucher worth ${formattedAmt} has been issued to member wallet.`;
        case 'CASH_REFUND':
          return `Center Management approved tuition fee refund${clsNameEn}. The amount of ${formattedAmt} will be refunded directly at the counter or via bank transfer.`;

        // Coach feedback actions
        case 'ACKNOWLEDGE_AND_TRAIN':
          return `${rolePrefix} acknowledged member feedback regarding instructor${clsNameEn}. Center management reviewed with Head of Department and reminded the coach to enhance teaching quality.`;
        case 'TRANSFER_CLASS_SUGGESTION':
          return `${rolePrefix} acknowledged member feedback and advised transferring to another coach class better suited to member training goals.`;

        // Facility actions
        case 'ASSIGN_MAINTENANCE':
          return `${rolePrefix} received the report and dispatched an urgent inspection/maintenance order to the technical team.`;
        case 'SCHEDULED_FIX':
          return 'Equipment has been tagged for maintenance and is scheduled to complete repairs and return to service within 24-48 hours.';

        // Schedule support actions
        case 'APPROVE_SCHEDULE_CHANGE':
          return `${rolePrefix} updated the new schedule for member in the system. Wishing you productive workouts!`;
        case 'GUIDE_BOOKING':
          return `${rolePrefix} sent instructions via the app so member can actively adjust upcoming session schedules.`;

        // Complaint actions
        case 'RESOLVE_COMPLAINT':
          return `The center sincerely apologizes for the subpar experience. ${rolePrefix} has coordinated with relevant departments to resolve this matter immediately.`;

        // Inquiry actions
        case 'ANSWER_INQUIRY':
          return `${rolePrefix} answered your inquiry in detail. If you need further assistance, please contact the reception desk.`;
        case 'CONTACT_DIRECTLY':
          return `${rolePrefix} contacted the member directly to assist and guide on all questions.`;

        // Common actions
        case 'ESCALATE':
          return `${rolePrefix} received member request and escalated to Center Management for review and resolution.`;
        case 'REJECT':
          return exceedsEightyPercent
            ? `${rolePrefix} rejected request: class attended sessions exceeded 80% per center policy.`
            : `${rolePrefix} regrets that your request could not be approved as it does not meet center policy criteria.`;
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
    setResponseNote(getNoteTemplate(type, effectiveAmt));
  };

  const handleAmountChange = (newVal) => {
    setCreditAmount(newVal);
    const parsed = Number.parseFloat(newVal) || 0;
    setResponseNote(getNoteTemplate(resolutionType, parsed));
  };

  useEffect(() => {
    if (isOpen && request) {
      setShowRevokeConfirm(false);
      setRevokeReason('');
      const rawSuggested = request.calculatedCreditAmount ?? request.proratedCredit ?? request.classPrice ?? 0;
      const suggested = Math.round(Number(rawSuggested) / 1000) * 1000;
      setCreditAmount(suggested);
      setValidDays(60);

      const pref = request.preferredResolution;
      let defaultType = 'APPROVE_GENERAL';

      if (isClassCancellationOrCompensation) {
        if (pref === 'GYM_PASS') {
          defaultType = 'GYM_PASS';
        } else if (pref === 'CASH_REFUND') {
          defaultType = isManager ? 'CASH_REFUND' : 'ESCALATE';
        } else if (exceedsEightyPercent) {
          defaultType = 'REJECT';
        } else {
          // Default or ISSUE_CREDIT
          defaultType = isManager && (request.status === 'ESCALATED') ? 'CASH_REFUND' : 'ISSUE_CREDIT';
        }
      } else if (request.category === 'COACH_FEEDBACK') {
        defaultType = isManager ? 'ACKNOWLEDGE_AND_TRAIN' : 'ESCALATE';
      } else if (request.category === 'FACILITY_ISSUE') {
        defaultType = 'ASSIGN_MAINTENANCE';
      } else if (request.category === 'SCHEDULE_SUPPORT') {
        defaultType = 'APPROVE_SCHEDULE_CHANGE';
      } else if (request.category === 'COMPLAINT') {
        defaultType = 'RESOLVE_COMPLAINT';
      } else {
        defaultType = 'ANSWER_INQUIRY';
      }

      setResolutionType(defaultType);
      setResponseNote(getNoteTemplate(defaultType, suggested));
      setError('');
    }
  }, [isOpen, request, isManager, currentLang]);

  const isClosed = request?.status === 'APPROVED' || request?.status === 'RESOLVED' || request?.status === 'REJECTED';
  const isEscalatedForReceptionist = !isManager && request?.status === 'ESCALATED';
  const isCoachFeedbackForReceptionist = !isManager && request?.category === 'COACH_FEEDBACK';
  const isReadOnly = isClosed || isEscalatedForReceptionist || isCoachFeedbackForReceptionist;

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

      if (resolutionType === 'ISSUE_CREDIT' || resolutionType === 'CASH_REFUND' || resolutionType === 'GYM_PASS') {
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
        validityDays: (resolutionType === 'ISSUE_CREDIT' || resolutionType === 'GYM_PASS') ? Number.parseInt(validDays, 10) : 60,
        creditExpiryDays: (resolutionType === 'ISSUE_CREDIT' || resolutionType === 'GYM_PASS') ? Number.parseInt(validDays, 10) : 60
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
          title: t('Issue Credit Voucher (Recommended)'),
          desc: exceedsEightyPercent
            ? t('Ineligible per center policy (>80% attended).')
            : t('Generates 60-day voucher code for member to re-enroll without losing money.'),
          color: exceedsEightyPercent ? 'rose' : 'emerald',
          disabled: exceedsEightyPercent,
          isMemberChoice: !exceedsEightyPercent && (request.preferredResolution === 'ISSUE_CREDIT' || !request.preferredResolution)
        },
        {
          actionType: 'GYM_PASS',
          icon: Clock,
          title: t('Grant Free 1-Month Gym Pass'),
          desc: exceedsEightyPercent
            ? t('Ineligible per center policy (>80% attended).')
            : t('Alternative perk when student prefers gym workouts over class credit.'),
          color: exceedsEightyPercent ? 'rose' : 'blue',
          disabled: exceedsEightyPercent,
          isMemberChoice: !exceedsEightyPercent && request.preferredResolution === 'GYM_PASS'
        },
        isManager
          ? {
              actionType: 'CASH_REFUND',
              icon: DollarSign,
              title: t('Approve Cash / Bank Refund'),
              desc: exceedsEightyPercent
                ? t('Ineligible per center policy (>80% attended).')
                : t('Authorizes cash disbursement or bank transfer to refund tuition to member.'),
              color: exceedsEightyPercent ? 'rose' : 'purple',
              disabled: exceedsEightyPercent,
              isMemberChoice: !exceedsEightyPercent && request.preferredResolution === 'CASH_REFUND'
            }
          : {
              actionType: 'ESCALATE',
              icon: ArrowUpRight,
              title: t('Escalate to Center Manager'),
              desc: exceedsEightyPercent
                ? t('Ineligible per center policy (>80% attended).')
                : t('For special cash refunds or high-dispute exceptions.'),
              color: exceedsEightyPercent ? 'rose' : 'purple',
              disabled: exceedsEightyPercent,
              isMemberChoice: false
            },
        {
          actionType: 'REJECT',
          icon: X,
          title: exceedsEightyPercent ? t('Reject Request (Policy Enforced)') : t('Reject Request'),
          desc: exceedsEightyPercent
            ? t('Class attended sessions exceeded 80%. Center policy strictly prohibits refunds or perks.')
            : t('Course completed >80% or violates center policies.'),
          color: 'rose',
          isMemberChoice: exceedsEightyPercent || request.preferredResolution === 'REJECT'
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
          { actionType: 'ESCALATE', icon: ArrowUpRight, color: 'purple', title: t(cfg.escalate.titleKey), desc: t(cfg.escalate.descKey) },
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
          <div className="p-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--primary)]" />
              <span className="font-bold text-[var(--text)]">{request.userFullName || request.memberName}</span>
            </div>
            {(request.userPhone || request.memberPhone) && (
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Phone className="w-3.5 h-3.5" />
                <span>{request.userPhone || request.memberPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Mail className="w-3.5 h-3.5" />
              <span>{request.userEmail || request.memberEmail}</span>
            </div>
          </div>

          {/* Ticket Request Content */}
          {request.category === 'COACH_FEEDBACK' ? (
            (() => {
              const parsed = parseCoachFeedback(request.content, request);
              return (
                <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/25 space-y-3">
                  <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      {t('Coach Feedback Topic')}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      {t(parsed.aspect || 'Coach & Training Feedback')}
                    </span>
                  </div>

                  {parsed.targetInfo && (
                    <div className="text-xs text-[var(--text)] flex items-center gap-2">
                      <span className="text-[var(--text-muted)] font-medium">{t('Associated Target')}:</span>
                      <span className="font-semibold text-[var(--text)] bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                        {parsed.targetInfo}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-1">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                      {t('Student Feedback & Comments')}:
                    </div>
                    <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text)] whitespace-pre-line leading-relaxed shadow-xs">
                      "{parsed.comment || request.title || t('No additional comments provided.')}"
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
                {t('Member Request Description')}
              </div>
              <p className="text-sm text-[var(--text)] whitespace-pre-line leading-relaxed">
                {request.content}
              </p>
            </div>
          )}

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
              {request.totalSessions > 0 && ((request.attendedSessions || 0) / request.totalSessions > 0.8) && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{t('Class attendance exceeded 80%. Under center policy, member is not eligible for voucher refund.')}</span>
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
          )}

          {/* Member's Preferred Compensation Benefit Card */}
          {request.preferredResolution && (
            <div className="p-3.5 rounded-xl border bg-[var(--surface-hover)] border-[var(--border)] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  {t("Member's Requested Benefit:")}
                </span>
                {request.preferredResolution === 'ISSUE_CREDIT' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> {t('Credit Voucher')}
                  </span>
                )}
                {request.preferredResolution === 'GYM_PASS' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" /> {t('1-Month Gym Pass')}
                  </span>
                )}
                {request.preferredResolution === 'CASH_REFUND' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> {t('Cash / Bank Refund')}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                {request.preferredResolution === 'ISSUE_CREDIT' && t('Member requested compensation: Credit Voucher.')}
                {request.preferredResolution === 'GYM_PASS' && t('Member requested compensation: 1-Month Gym Pass.')}
                {request.preferredResolution === 'CASH_REFUND' && t('Member requested compensation: Cash / Bank Refund.')}
              </p>
            </div>
          )}

          {/* If Read-Only (Closed Ticket or Escalated for Receptionist): Show Resolution Summary */}
          {isReadOnly ? (
            <div className="space-y-4">
              {/* If Coach Feedback for Receptionist banner */}
              {isCoachFeedbackForReceptionist && !isClosed && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <ArrowUpRight className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span>{t('Coach Feedback Directly Routed to Management')}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                    {t('This ticket reports issues regarding a Coach / Instructor and has been routed directly to Center Management for review. Receptionists have view-only access.')}
                  </p>
                </div>
              )}

              {/* If Escalated for Receptionist banner (other categories) */}
              {!isCoachFeedbackForReceptionist && isEscalatedForReceptionist && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                    <ArrowUpRight className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                    <span>{t('Ticket Escalated to Center Management')}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                    {t('This ticket involves mid-course refund or exception and has been escalated to Center Manager for review. Receptionists cannot modify escalated tickets.')}
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
                        <code className="text-sm font-black text-[var(--text)] tracking-wider block mt-1">
                          {request.generatedCreditCode}
                        </code>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[var(--text-muted)] font-medium">{t('Amount')}</div>
                        <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(request.generatedCreditAmount || request.calculatedCreditAmount)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Cash Refund Approved */}
                  {request.status === 'APPROVED' && !request.generatedCreditCode && isClassCancellationOrCompensation && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4" /> {t('Direct Cash / Bank Refund Approved')}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                          {t('Authorized by Center Management')}
                        </div>
                      </div>
                      <div className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                        {formatMoney(request.calculatedCreditAmount ?? request.classPrice)}
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

              {/* Conditional Amount & Benefit Fields (Credit Voucher or Cash Refund) */}
              {(resolutionType === 'ISSUE_CREDIT' || resolutionType === 'CASH_REFUND') && (
                <div
                  className={`p-4 rounded-xl bg-[var(--surface-hover)] border-2 space-y-3 ${
                    resolutionType === 'ISSUE_CREDIT' ? 'border-emerald-500/50' : 'border-purple-500/50'
                  }`}
                >
                  {resolutionType === 'CASH_REFUND' && (
                    <div className="flex items-center gap-2 text-xs font-extrabold text-[var(--text)]">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>{t('Confirm cash / bank refund order (Manager Authority)')}</span>
                    </div>
                  )}
                  {resolutionType === 'ISSUE_CREDIT' && exceedsEightyPercent && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{t('Warning: This class exceeded 80% attendance. Issuing voucher violates center policy.')}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label htmlFor="resolution-amount-input" className="block text-xs font-black text-[var(--text)]">
                        {resolutionType === 'ISSUE_CREDIT' ? t('Voucher Credit Amount (VND)') : t('Approved Refund Amount (VND)')}{' '}
                        <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        id="resolution-amount-input"
                        type="number"
                        min="0"
                        step="any"
                        value={creditAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] font-black text-base focus:outline-none focus:ring-2 ${
                          resolutionType === 'ISSUE_CREDIT' ? 'focus:ring-emerald-500' : 'focus:ring-purple-500'
                        }`}
                        required
                      />
                    </div>
                    {resolutionType === 'ISSUE_CREDIT' ? (
                      <div className="space-y-1.5">
                        <label htmlFor="credit-validity-input" className="block text-xs font-black text-[var(--text)]">
                          {t('Validity (Days)')} <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input
                          id="credit-validity-input"
                          type="number"
                          min="7"
                          max="365"
                          value={validDays}
                          onChange={(e) => setValidDays(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border-2 border-[var(--border)] text-[var(--text)] font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-[var(--text)]">
                          {t('Payment Method')}
                        </label>
                        <div className="px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border-2 border-[var(--border)] text-xs font-bold text-[var(--text)] flex items-center h-[46px]">
                          {t('Cash at desk / Bank transfer')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Note (sent to member notification) */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="response-note-textarea" className="block text-xs font-black text-[var(--text)]">
                    {t('Official Response & Explanation to Member')} <span className="text-red-500 font-bold">*</span>
                  </label>
                  {resolutionType === 'REJECT' && (
                    <button
                      type="button"
                      onClick={() => setResponseNote(
                        currentLang === 'vi'
                          ? `${isManager ? 'Quản lý trung tâm' : 'Lễ tân'} xin phép đóng đơn do yêu cầu này đã được giải quyết hoặc bị trùng lặp với đơn hỗ trợ khác.`
                          : `${isManager ? 'Center Management' : 'Reception'} is closing this ticket as the request has already been addressed or is duplicate with another ticket.`
                      )}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-colors flex items-center gap-1"
                    >
                      <span>⚠️ {t('Template: Close as Duplicate')}</span>
                    </button>
                  )}
                </div>
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
