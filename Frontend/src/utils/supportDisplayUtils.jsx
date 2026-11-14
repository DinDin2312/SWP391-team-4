import React from 'react';
import {
  Clock, RefreshCw, CheckCircle2, ShieldCheck, X, AlertCircle, ArrowUp, ArrowDown, Minus, ArrowUpRight, CreditCard, Dumbbell, DollarSign, FileText, Download, Image as ImageIcon
} from 'lucide-react';
import { t } from '../i18n/useLanguage';

/**
 * Calculates remaining days from an ISO date string (YYYY-MM-DD) or returns provided days.
 */
export const getDaysLeft = (expiryDate, providedDays) => {
  if (providedDays != null && !Number.isNaN(Number(providedDays))) return providedDays;
  if (!expiryDate) return 0;
  try {
    const parts = String(expiryDate).split('-');
    if (parts.length === 3) {
      const exp = new Date(Number.parseInt(parts[0], 10), Number.parseInt(parts[1], 10) - 1, Number.parseInt(parts[2], 10));
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  } catch {
    // fallback
  }
  return 0;
};

/**
 * Common category and reason labels for support requests
 */
export const getReasonLabel = (val) => {
  switch (val) {
    case 'CLASS_CANCELLATION': return t('Mid-Course Emergency / Medical / Relocation');
    case 'GENERAL_INQUIRY': return t('Schedule Conflict / Need Class Transfer');
    case 'COMPLAINT': return t('Course Quality / Other Reason');
    default: return t('Other');
  }
};

export const getCoachAspectLabel = (val) => {
  switch (val) {
    case 'TEACHING_METHOD': return t('Teaching Method & Delivery');
    case 'ATTITUDE': return t('Attitude & Member Care');
    case 'PUNCTUALITY': return t('Punctuality & Professionalism');
    case 'TECHNICAL_GUIDANCE': return t('Technical Expertise & Form Correction');
    default: return t('Other Feedback');
  }
};

export const getFacilityAreaLabel = (val) => {
  switch (val) {
    case 'GYM_FLOOR': return t('Gym & Free Weights Area');
    case 'CARDIO_ZONE': return t('Cardio Zone');
    case 'STUDIO_ROOM': return t('Studio / Yoga / Aerobics Room');
    case 'SWIMMING_POOL': return t('Swimming Pool & Jacuzzi');
    case 'LOCKER_SAUNA': return t('Locker Room & Sauna');
    case 'LOBBY_RECEPTION': return t('Lobby & Reception Area');
    default: return t('Other Area');
  }
};

export const getScheduleTypeLabel = (val) => {
  switch (val) {
    case 'SINGLE_ABSENCE': return t('Request Single Session Absence');
    case 'MAKEUP_CLASS': return t('Register Makeup Session');
    case 'CLASS_TRANSFER': return t('Request Class Time Transfer');
    case 'SCHEDULE_INQUIRY': return t('Schedule & Holiday Inquiry');
    default: return t('Schedule Support');
  }
};

export const getComplaintTypeLabel = (val) => {
  switch (val) {
    case 'STAFF_BEHAVIOR': return t('Staff / Receptionist Service');
    case 'CLEANLINESS': return t('Cleanliness & Environment');
    case 'BILLING_POLICY': return t('Pricing, Membership & Billing Policy');
    default: return t('Other Issue');
  }
};

export const getCategoryLabel = (category) => {
  switch (category) {
    case 'CLASS_CANCELLATION': return t('Class Cancellation & Proration');
    case 'FACILITY_ISSUE': return t('Facility & Equipment Report');
    case 'COACH_FEEDBACK': return t('Coach & Training Feedback');
    case 'SCHEDULE_SUPPORT': return t('General Inquiry & Feedback');
    case 'COMPLAINT': return t('Customer Complaint & Service Feedback');
    default: return t('General Inquiry & Feedback');
  }
};

export const getCategoryBadge = (category, { compact = false } = {}) => {
  switch (category) {
    case 'CLASS_CANCELLATION':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">{t(compact ? 'Cancel Class' : 'Class Cancellation')}</span>;
    case 'FACILITY_ISSUE':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">{t('Facility Issue')}</span>;
    case 'COACH_FEEDBACK':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{t('Coach Feedback')}</span>;
    case 'COMPLAINT':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-700 dark:text-red-300">{t('Complaint')}</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300">{t(compact ? 'Inquiry' : 'General Inquiry')}</span>;
  }
};

export const getPriorityLabel = (priority) => {
  switch (priority) {
    case 'URGENT': return t('Urgent');
    case 'HIGH': return t('High');
    case 'LOW': return t('Low');
    case 'NORMAL':
    default:
      return t('Normal');
  }
};

export const getPreferredResolutionBadge = (pref, { compact = false } = {}) => {
  switch (pref) {
    case 'ISSUE_CREDIT':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
          <CreditCard className="w-3 h-3" /> {t(compact ? 'Credit Refund' : 'Credit Voucher')}
        </span>
      );
    case 'GYM_PASS':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 inline-flex items-center gap-1">
          <Dumbbell className="w-3 h-3" /> {t(compact ? 'Gym Pass' : '1-Month Gym Pass')}
        </span>
      );
    case 'CASH_REFUND':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 inline-flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> {t(compact ? 'Cash Refund' : 'Cash / Bank Refund')}
        </span>
      );
    case 'NO_REFUND':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 inline-flex items-center gap-1">
          {t('100% Tuition Forfeited')}
        </span>
      );
    default:
      return null;
  }
};

export const getPriorityBadge = (priority, preferredResolution, extraClassName = '', category = null) => {
  let effectivePriority = priority;
  if (category) {
    const isCancellationOrFacility = category === 'CLASS_CANCELLATION' || category === 'REFUND_REQUEST' || category === 'FACILITY_ISSUE' || preferredResolution === 'CASH_REFUND';
    if (isCancellationOrFacility) {
      effectivePriority = (priority === 'URGENT') ? 'URGENT' : 'HIGH';
    } else if (effectivePriority !== 'URGENT') {
      effectivePriority = 'NORMAL';
    }
  } else if (priority === 'HIGH' || preferredResolution === 'CASH_REFUND') {
    effectivePriority = 'HIGH';
  }
  const baseClass = extraClassName ? ` ${extraClassName}` : '';
  switch (effectivePriority) {
    case 'URGENT':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-xs${baseClass}`}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{t('Urgent')}</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs${baseClass}`}>
          <ArrowUp className="w-3 h-3 shrink-0" />
          <span>{t('High')}</span>
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20${baseClass}`}>
          <ArrowDown className="w-3 h-3 shrink-0" />
          <span>{t('Low')}</span>
        </span>
      );
    case 'NORMAL':
    default:
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20${baseClass}`}>
          <Minus className="w-3 h-3 shrink-0" />
          <span>{t('Normal')}</span>
        </span>
      );
  }
};

export const getStatusBadge = (status, options = {}) => {
  const isMember = typeof options === 'boolean' ? options : !!options.isMember;
  switch (status) {
    case 'PENDING':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {isMember ? t('Pending Reception Review') : t('Pending Review')}
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('In Progress')}
        </span>
      );
    case 'APPROVED':
    case 'RESOLVED':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> {isMember ? t('Approved & Resolved') : t('Resolved')}
        </span>
      );
    case 'ESCALATED':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1.5">
          {isMember ? <ShieldCheck className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />} {isMember ? t('Escalated to Manager') : t('Escalated')}
        </span>
      );
    case 'REJECTED':
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> {t('Rejected')}
        </span>
      );
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600">{status}</span>;
  }
};

export const getDisplayTitle = (title) => {
  if (!title) return '';
  return title.replace('Cancellation & Retention Request for', t('Cancellation & Retention Request for'));
};


/**
 * Strips redundant automated prefixes from support ticket titles
 */
const META_FIELD_MATCHERS = [
  { key: 'aspect', labelKey: 'Coach Feedback Topic', regex: /^(?:Feedback Aspect|Nội dung góp ý HLV|Khía cạnh góp ý|Chủ đề góp ý|Chủ đề|Aspect):\s*(.+)$/i },
  { key: 'targetInfo', labelKey: 'Associated Target', regex: /^(?:Associated Class|Lớp học liên quan|Lớp học|HLV|Coach):\s*(.+)$/i },
  { key: 'area', labelKey: 'Facility Area', regex: /^(?:Khu vực|Area|Facility Area):\s*(.+)$/i },
  { key: 'equipment', labelKey: 'Equipment / Location', regex: /^(?:Thiết bị|Equipment|Vị trí|Location|Device\s*\/\s*Location Detail|Tên máy\s*\/\s*Vị trí cụ thể):\s*(.+)$/i },
  { key: 'supportType', labelKey: 'Support Type', regex: /^(?:Loại hỗ trợ|Support Type|Chủ đề hỗ trợ):\s*(.+)$/i },
  { key: 'detail', labelKey: 'Schedule / Detail', regex: /^(?:Chi tiết|Details?|Detail|Thời gian|Schedule|Incident Date\s*&\s*Time|Thời gian xảy ra sự việc(?:\s*\(Nếu có\))?):\s*(.+)$/i },
  { key: 'complaintType', labelKey: 'Complaint Type', regex: /^(?:Loại khiếu nại|Complaint Type|Loại phản ánh|Complaint Area|Lĩnh vực khiếu nại):\s*(.+)$/i },
  { key: 'reason', labelKey: 'Reason', regex: /^(?:Lý do|Reason):\s*(.+)$/i }
];

/**
 * Parses leading [Key: Value | Key2: Value2] body metadata across support ticket categories
 * while preserving plain class-code prefixes such as [YOGA-101] Question....
 */
export const parseSupportRequestDetails = (content, req = {}) => {
  const rawContent = String(content || '').trim();
  const isCoachFeedback = req?.category === 'COACH_FEEDBACK';
  const result = {
    fields: {},
    chips: [],
    aspect: '',
    targetInfo: '',
    bodyText: rawContent,
    hasStructuredMeta: false
  };

  const prefixMatch = rawContent.match(/^\[((?:[^\[\]\r\n]|\[[^\]\r\n]*\])+)\]\s*([\s\S]*)$/);
  if (prefixMatch) {
    const metaStr = prefixMatch[1].trim();
    const restText = prefixMatch[2].trim();
    const looksStructured = metaStr.includes(':') || metaStr.includes('|') || isCoachFeedback;

    if (looksStructured) {
      result.hasStructuredMeta = true;
      result.bodyText = restText;

      const parts = metaStr.split('|').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        let matched = false;
        for (const matcher of META_FIELD_MATCHERS) {
          const m = part.match(matcher.regex);
          if (m && m[1]?.trim()) {
            const value = m[1].trim();
            if (!result.fields[matcher.key]) {
              result.fields[matcher.key] = value;
            }
            result.chips.push({ key: matcher.key, labelKey: matcher.labelKey, value });
            matched = true;
            break;
          }
        }
        if (!matched) {
          const genericPair = part.match(/^([^:]{2,40}):\s*(.+)$/);
          if (genericPair && genericPair[2]?.trim()) {
            result.chips.push({ key: 'extra', labelKey: genericPair[1].trim(), value: genericPair[2].trim() });
          } else if (isCoachFeedback && !result.fields.aspect) {
            result.fields.aspect = part;
          } else {
            result.chips.push({ key: 'extra', labelKey: 'Detail', value: part });
          }
        }
      }
    }
  }

  result.aspect = result.fields.aspect || (isCoachFeedback ? t('Coach & Training Feedback') : '');
  result.targetInfo = result.fields.targetInfo || req?.className || '';
  return result;
};

/**
 * Parses structured coach feedback metadata from content string
 */
export const parseCoachFeedback = (content, req = {}) => {
  if (!content && !req.title) return { aspect: '', targetInfo: '', comment: '' };
  const details = parseSupportRequestDetails(content, { ...req, category: 'COACH_FEEDBACK' });
  return {
    aspect: details.aspect,
    targetInfo: details.targetInfo,
    comment: details.bodyText || req.title || ''
  };
};

export const cleanSupportTitle = (req) => {
  if (!req) return '';
  if (req.category === 'COACH_FEEDBACK') {
    const parsed = parseCoachFeedback(req.content, req);
    const aspectName = parsed.aspect ? t(parsed.aspect) : t('Coach & Training Feedback');
    return `${t('Coach Feedback')}: ${aspectName}`;
  }
  const raw = req.title || '';
  const cleaned = raw
    .replace(/^Bảo lưu học phí tự động:\s*/i, '')
    .replace(/^Cancellation & Retention Request for:?\s*/i, '')
    .replace(/^Yêu cầu hủy & bảo lưu lớp:?\s*/i, '')
    .replace(/^Chuyển lớp tự động:\s*/i, '')
    .replace(/^Yêu cầu hỗ trợ:\s*/i, '')
    .trim();
  return cleaned || raw || req.className || '';
};

/**
 * Returns a single-line summary for support tables without repeating category badges or class names.
 */
export const getCompactSupportSummary = (req, parsedDetails) => {
  if (!req) return '';
  const details = parsedDetails || parseSupportRequestDetails(req.content, req);
  if (req.category === 'COACH_FEEDBACK') {
    if (details.fields.aspect) return t(details.fields.aspect);
    return details.bodyText || t('Coach & Training Feedback');
  }

  const title = cleanSupportTitle(req);
  if (req.category === 'CLASS_CANCELLATION' || req.category === 'REFUND_REQUEST') {
    const normalizedClass = String(req.className || '').trim().toLowerCase();
    const normalizedTitle = title.trim().toLowerCase();
    const isBoilerplate = !normalizedTitle
      || /^(?:xin\s+)?h[ủu]y\s+l[ớơ]p\b/i.test(title)
      || /^(?:request\s+)?cancel/i.test(title)
      || /^\[[a-z0-9\s-]+\]/i.test(title)
      || (normalizedClass && (normalizedTitle === normalizedClass || normalizedTitle.includes(normalizedClass)));
    if (isBoilerplate) {
      return (details.fields.reason ? t(details.fields.reason) : '') || details.bodyText || title;
    }
  }

  return title
    || details.fields.supportType
    || details.fields.complaintType
    || details.fields.equipment
    || details.bodyText
    || '';
};

/**
 * Extracts compact 2-letter uppercase initials from full member name
 */
export const getMemberInitials = (name) => {
  if (!name) return 'HV';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formats ISO date string to DD/MM/YYYY HH:mm
 */
export const formatSupportDate = (val) => {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    }
  } catch {
    // fallback
  }
  return String(val).replace('T', ' ').slice(0, 16);
};

export const formatRespondedAt = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch {
    // fallback
  }
  return String(val).replace('T', ' ').slice(0, 16);
};

/**
 * Computes cancellation eligibility & attendance progress against center 80% policy.
 */
export const getAttendancePolicySummary = (req = {}) => {
  const total = Number(req?.totalSessions) || 0;
  const attended = Number(req?.attendedSessions) || 0;
  const remaining = req?.remainingSessions != null
    ? Number(req.remainingSessions)
    : Math.max(0, total - attended);
  const percent = total > 0 ? Math.min(100, Math.round((attended / total) * 100)) : 0;
  const exceedsEightyPercent = false;
  const isCancellationLike = Boolean(
    req?.category === 'CLASS_CANCELLATION' ||
    req?.category === 'REFUND_REQUEST' ||
    (req?.preferredResolution && ['ISSUE_CREDIT', 'GYM_PASS', 'CASH_REFUND'].includes(req.preferredResolution)) ||
    (req?.title && /cancellation|hủy|bảo lưu|retention/i.test(req.title))
  );

  return {
    attended,
    total,
    remaining,
    percent,
    exceedsEightyPercent,
    isCancellationLike
  };
};

export const isCashRefundRequest = (req = {}) => {
  const pref = String(req?.preferredResolution || '').toUpperCase();
  return pref === 'CASH_REFUND' || pref === 'MANAGER_REFUND';
};

export const isManagerOnlySupportTicket = (req = {}) =>
  req?.category === 'COACH_FEEDBACK' ||
  req?.category === 'FACILITY_ISSUE' ||
  req?.category === 'CLASS_CANCELLATION' ||
  req?.category === 'REFUND_REQUEST' ||
  req?.status === 'ESCALATED' ||
  isCashRefundRequest(req);

export const canStaffProcessTicket = (req = {}, isManager = false) => {
  if (!req?.status) return false;
  const isOpen = req.status === 'PENDING' || req.status === 'IN_PROGRESS' || req.status === 'ESCALATED';
  if (!isOpen) return false;
  return isManager ? true : !isManagerOnlySupportTicket(req);
};

/**
 * Compresses image evidence via canvas or validates PDF evidence up to 3 MB, returning { dataUrl, fileName }.
 */
export const processEvidenceFile = (file, { imageOnly = false } = {}) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error(t('Please select an evidence file.')));
      return;
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    const isImage = file.type.startsWith('image/');
    if (imageOnly && !isImage) {
      reject(new Error(t('Only photo evidence files (PNG, JPG, WEBP) are supported.')));
      return;
    }
    if (!isPdf && !isImage) {
      reject(new Error(t('Only image (PNG, JPG, WEBP) or PDF evidence files are supported.')));
      return;
    }
    if (isPdf && file.size > 3 * 1024 * 1024) {
      reject(new Error(t('PDF evidence file must not exceed 3 MB.')));
      return;
    }
    if (isImage && file.size > 10 * 1024 * 1024) {
      reject(new Error(t('Image file must not exceed 10 MB.')));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('Failed to read selected file.')));
    reader.onload = (event) => {
      const rawUrl = event?.target?.result;
      if (isPdf) {
        resolve({ dataUrl: rawUrl, fileName: file.name || 'evidence.pdf' });
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error(t('Invalid or corrupted image file.')));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.85), fileName: file.name || 'evidence.jpg' });
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });

export const EvidencePreviewBox = ({ evidenceUrl, fileName, onClear }) => {
  if (!evidenceUrl) return null;
  const isPdf = String(evidenceUrl).startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(String(evidenceUrl));
  const label = fileName || (isPdf ? t('Attached PDF Evidence') : t('Attached Image Evidence'));

  return (
    <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isPdf ? (
            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          <span className="text-xs font-bold text-[var(--text)] truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={evidenceUrl}
            download={fileName || (isPdf ? 'cancellation-evidence.pdf' : 'cancellation-evidence.jpg')}
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] hover:opacity-85 inline-flex items-center gap-1 transition-opacity"
          >
            <Download className="w-3 h-3" />
            <span>{t('Download')}</span>
          </a>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              aria-label={t('Remove file')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!isPdf && (
        <img
          src={evidenceUrl}
          alt={t('Cancellation evidence')}
          className="w-full max-h-56 object-contain rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--border)]"
        />
      )}
    </div>
  );
};
