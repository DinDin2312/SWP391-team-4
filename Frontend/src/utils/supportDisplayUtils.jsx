import React from 'react';
import {
  Clock, RefreshCw, CheckCircle2, ShieldCheck, X, AlertCircle, ArrowUp, ArrowDown, Minus, ArrowUpRight, CreditCard, Dumbbell, DollarSign
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
    case 'SCHEDULE_SUPPORT': return t('Schedule & Absence Support');
    case 'COMPLAINT': return t('Customer Complaint & Service Feedback');
    default: return t('General Inquiry & Feedback');
  }
};

export const getCategoryBadge = (category) => {
  switch (category) {
    case 'CLASS_CANCELLATION':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">{t('Class Cancellation')}</span>;
    case 'FACILITY_ISSUE':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300">{t('Facility Issue')}</span>;
    case 'COACH_FEEDBACK':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{t('Coach Feedback')}</span>;
    case 'COMPLAINT':
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-700 dark:text-red-300">{t('Complaint')}</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300">{t('General Inquiry')}</span>;
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

export const getPreferredResolutionBadge = (pref) => {
  switch (pref) {
    case 'ISSUE_CREDIT':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1">
          <CreditCard className="w-3 h-3" /> {t('Credit Voucher')}
        </span>
      );
    case 'GYM_PASS':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 inline-flex items-center gap-1">
          <Dumbbell className="w-3 h-3" /> {t('1-Month Gym Pass')}
        </span>
      );
    case 'CASH_REFUND':
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 inline-flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> {t('Cash / Bank Refund')}
        </span>
      );
    default:
      return null;
  }
};

export const getPriorityBadge = (priority, preferredResolution, extraClassName = '') => {
  const effectivePriority = (priority === 'HIGH' || preferredResolution === 'CASH_REFUND') ? 'HIGH' : priority;
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
          <Clock className="w-3.5 h-3.5" /> {isMember ? t('Pending Reception Review') : t('Pending')}
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
