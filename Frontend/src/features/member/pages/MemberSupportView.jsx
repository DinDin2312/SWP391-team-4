import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle, CreditCard, Ticket, Clock, CheckCircle2,
  AlertTriangle, Plus, Send, X, Copy, Check, MessageSquare,
  ShieldCheck, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
  Dumbbell, DollarSign, Sparkles, Wrench, UserCheck, Calendar, RotateCcw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import memberService from '../services/memberService';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import { useClassCancellation } from '../hooks/useClassCancellation';
import {
  getDaysLeft,
  getReasonLabel,
  getCoachAspectLabel,
  getFacilityAreaLabel,
  getScheduleTypeLabel,
  getComplaintTypeLabel,
  getCategoryLabel,
  getStatusBadge,
  getPriorityBadge
} from '../../../utils/supportDisplayUtils';
import {
  ClassCancellationPreviewCard,
  ClassCancellationSuccessCard,
  CancellationGuaranteeNotice,
  ClassCancellationFormSection
} from '../components/ClassCancellationCards';

const CATEGORY_OPTIONS = [
  {
    key: 'CLASS_CANCELLATION',
    label: 'Class Cancellation & Proration',
    desc: 'Request class cancellation, credit voucher or refund',
    icon: CreditCard,
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
  },
  {
    key: 'COACH_FEEDBACK',
    label: 'Coach & Training Feedback',
    desc: 'Feedback on coaching attitude, method or technique',
    icon: UserCheck,
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
  },
  {
    key: 'FACILITY_ISSUE',
    label: 'Facility & Equipment Broken Report',
    desc: 'Report broken equipment, gym rooms or hygiene',
    icon: Wrench,
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
  },
  {
    key: 'SCHEDULE_SUPPORT',
    label: 'Schedule Support & Absence/Makeup',
    desc: 'Request session makeup, single absence or time swap',
    icon: Calendar,
    badgeBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
  },
  {
    key: 'COMPLAINT',
    label: 'Service Complaint & Appeals',
    desc: 'Report service issues, staff conduct or disputes',
    icon: AlertTriangle,
    badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
  },
  {
    key: 'GENERAL_INQUIRY',
    label: 'General Inquiry & Assistance',
    desc: 'Ask general questions about packages or services',
    icon: MessageSquare,
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
  }
];

const getPaginationRange = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

const MemberSupportView = () => {
  useLanguage();

  const [activeTab, setActiveTab] = useState('credits'); // 'credits' | 'tickets'
  const [credits, setCredits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination state for support tickets
  const [ticketPage, setTicketPage] = useState(1);
  const ticketPageSize = 5;

  const totalTicketPages = Math.max(1, Math.ceil(tickets.length / ticketPageSize));
  const validTicketPage = Math.min(Math.max(1, ticketPage), totalTicketPages);

  const paginatedTickets = useMemo(() => {
    const start = (validTicketPage - 1) * ticketPageSize;
    return tickets.slice(start, start + ticketPageSize);
  }, [tickets, validTicketPage, ticketPageSize]);

  const ticketStartRecord = tickets.length === 0 ? 0 : (validTicketPage - 1) * ticketPageSize + 1;
  const ticketEndRecord = Math.min(validTicketPage * ticketPageSize, tickets.length);

  // New ticket modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    category: 'CLASS_CANCELLATION',
    classId: '',
    preferredResolution: 'ISSUE_CREDIT', // 'ISSUE_CREDIT' | 'GYM_PASS' | 'CASH_REFUND'
    cancellationReason: 'CLASS_CANCELLATION',
    coachAspect: 'TEACHING_METHOD',
    facilityArea: 'GYM_FLOOR',
    facilityDevice: '',
    facilityUrgency: 'NORMAL',
    scheduleType: 'SINGLE_ABSENCE',
    scheduleDateInfo: '',
    complaintType: 'STAFF_BEHAVIOR',
    complaintDateInfo: '',
    title: '',
    content: '',
    priority: 'NORMAL'
  });

  // Cancellation preview hook
  const {
    loading: loadingPreview,
    error: previewError,
    setError: setPreviewError,
    preview: cancelPreview,
    setPreview: setCancelPreview,
    loadPreview: fetchCancelPreview,
    executeDirectCancel
  } = useClassCancellation();

  // Modal success state
  const [modalSuccess, setModalSuccess] = useState(null);
  const [modalCopiedCode, setModalCopiedCode] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const activeCat = CATEGORY_OPTIONS.find(c => c.key === ticketForm.category) || CATEGORY_OPTIONS[0];
  const ActiveCatIcon = activeCat.icon;

  // UI helpers
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Identify pending cancellation tickets to prevent duplicate submissions
  const pendingCancellationTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        (t.status === 'PENDING' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED') &&
        (t.category === 'CLASS_CANCELLATION' || t.category === 'REFUND_REQUEST') &&
        t.gymClass?.classId
    );
  }, [tickets]);

  const pendingClassIds = useMemo(() => {
    return new Set(pendingCancellationTickets.map((t) => String(t.gymClass.classId)));
  }, [pendingCancellationTickets]);

  const existingPendingTicketForSelectedClass = useMemo(() => {
    if (!ticketForm.classId) return null;
    return pendingCancellationTickets.find((t) => String(t.gymClass?.classId) === String(ticketForm.classId));
  }, [pendingCancellationTickets, ticketForm.classId]);

  const [withdrawingId, setWithdrawingId] = useState(null);
  const [confirmWithdrawModal, setConfirmWithdrawModal] = useState({ isOpen: false, requestId: null });

  const handleWithdrawTicket = (requestId) => {
    setConfirmWithdrawModal({ isOpen: true, requestId });
  };

  const executeWithdrawTicket = async (requestId) => {
    if (!requestId) return;
    try {
      setWithdrawingId(requestId);
      await memberService.withdrawSupportRequest(requestId);
      showToast(t('Support request withdrawn successfully.'), 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || t('Failed to withdraw support request.'), 'error');
    } finally {
      setWithdrawingId(null);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [creditsRes, ticketsRes, classesRes] = await Promise.all([
        memberService.getMyCredits().catch(() => []),
        memberService.getMySupportRequests().catch(() => []),
        memberService.getEnrolledClasses().catch(() => [])
      ]);
      setCredits(creditsRes || []);
      setTickets(ticketsRes || []);
      setClasses(classesRes || []);
    } catch (err) {
      console.error(err);
      setError(t('Failed to load support data. Please refresh.'));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const handleCopyCode = (code) => {
    void navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(t('Copied credit code: ') + code, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleModalCopyCode = (code) => {
    if (!code) return;
    void navigator.clipboard.writeText(code);
    setModalCopiedCode(true);
    setTimeout(() => setModalCopiedCode(false), 2500);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryDropdownOpen(false);
    setModalSuccess(null);
    setModalCopiedCode(false);
    setCancelPreview(null);
    setPreviewError('');
    setTicketForm({
      category: 'CLASS_CANCELLATION',
      classId: classes.length > 0 ? String(classes[0].classId) : '',
      preferredResolution: 'ISSUE_CREDIT',
      cancellationReason: 'CLASS_CANCELLATION',
      coachAspect: 'TEACHING_METHOD',
      facilityArea: 'GYM_FLOOR',
      facilityDevice: '',
      facilityUrgency: 'NORMAL',
      scheduleType: 'SINGLE_ABSENCE',
      scheduleDateInfo: '',
      complaintType: 'STAFF_BEHAVIOR',
      complaintDateInfo: '',
      title: '',
      content: '',
      priority: 'NORMAL'
    });
  };

  // Auto-fetch cancel preview when class or category changes
  useEffect(() => {
    if (isModalOpen && ticketForm.category === 'CLASS_CANCELLATION') {
      if (!ticketForm.classId && classes.length > 0) {
        setTicketForm(prev => ({ ...prev, classId: String(classes[0].classId) }));
      } else if (ticketForm.classId) {
        void fetchCancelPreview(ticketForm.classId);
      }
    } else {
      setCancelPreview(null);
      setPreviewError('');
    }
  }, [isModalOpen, ticketForm.category, ticketForm.classId, classes]);

  const handleDirectCancel = async (classId) => {
    setCreating(true);
    const res = await executeDirectCancel(classId);
    setCreating(false);
    if (res.success) {
      setModalSuccess(res.data);
      await fetchData();
    } else {
      showToast(res.error, 'error');
    }
  };

  const handleCreateTicket = async (e) => {
    if (e) e.preventDefault();

    let finalTitle = '';
    let finalContent = '';
    let finalPriority = ticketForm.priority || 'NORMAL';
    const finalClassId = ticketForm.classId ? Number.parseInt(ticketForm.classId, 10) : null;
    let finalPreferredResolution = null;

    if (ticketForm.category === 'CLASS_CANCELLATION') {
      if (!finalClassId) {
        showToast(t('Please select an enrolled class to cancel or retain.'), 'error');
        return;
      }
      if (!ticketForm.content.trim()) {
        showToast(t('Please describe the reason for your support request.'), 'error');
        return;
      }
      finalTitle = t('Cancellation & Retention Request for') + ` ${cancelPreview?.className || ''}`;
      finalContent = `[${t('Reason')}: ${getReasonLabel(ticketForm.cancellationReason)}] ${ticketForm.content.trim()}`;
      finalPreferredResolution = ticketForm.preferredResolution;

      // Smart Priority Calculation for Cancellation:
      if (ticketForm.preferredResolution === 'CASH_REFUND') {
        finalPriority = 'HIGH'; // Cash refund involves Manager financial review
      } else if (ticketForm.cancellationReason === 'CLASS_CANCELLATION') {
        finalPriority = 'HIGH'; // Mid-course medical or emergency reason
      } else if (cancelPreview?.hasStarted) {
        finalPriority = 'HIGH'; // Course in progress: time-sensitive
      } else {
        finalPriority = 'NORMAL';
      }
    } else if (ticketForm.category === 'COACH_FEEDBACK') {
      if (!ticketForm.title.trim() || !ticketForm.content.trim()) {
        showToast(t('Please fill in title and description.'), 'error');
        return;
      }
      const selectedClass = classes.find(c => String(c.classId) === String(ticketForm.classId));
      finalTitle = ticketForm.title.trim();
      finalContent = `[${t('Feedback Aspect')}: ${getCoachAspectLabel(ticketForm.coachAspect)}${selectedClass ? ` | ${t('Associated Class')}: ${selectedClass.className} (${selectedClass.coachName || 'Coach'})` : ''}] ${ticketForm.content.trim()}`;
      if (ticketForm.coachAspect === 'ATTITUDE') {
        finalPriority = 'HIGH';
      } else {
        finalPriority = 'NORMAL';
      }
    } else if (ticketForm.category === 'FACILITY_ISSUE') {
      if (!ticketForm.title.trim() || !ticketForm.content.trim()) {
        showToast(t('Please fill in title and description.'), 'error');
        return;
      }
      finalTitle = ticketForm.title.trim();
      finalContent = `[${t('Facility Area')}: ${getFacilityAreaLabel(ticketForm.facilityArea)}${ticketForm.facilityDevice ? ` | ${t('Device / Location Detail')}: ${ticketForm.facilityDevice}` : ''}] ${ticketForm.content.trim()}`;
      finalPriority = ticketForm.facilityUrgency || 'NORMAL';
    } else if (ticketForm.category === 'SCHEDULE_SUPPORT') {
      if (!ticketForm.content.trim()) {
        showToast(t('Please describe your schedule support request.'), 'error');
        return;
      }
      const selectedClass = classes.find(c => String(c.classId) === String(ticketForm.classId));
      finalTitle = ticketForm.title.trim() || (t('Hỗ trợ lịch tập') + (selectedClass ? ` - ${selectedClass.className}` : ''));
      finalContent = `[${t('Schedule Support Type')}: ${getScheduleTypeLabel(ticketForm.scheduleType)}${ticketForm.scheduleDateInfo ? ` | ${t('Session / Date Detail')}: ${ticketForm.scheduleDateInfo}` : ''}] ${ticketForm.content.trim()}`;
      finalPriority = 'NORMAL';
    } else if (ticketForm.category === 'COMPLAINT') {
      if (!ticketForm.title.trim() || !ticketForm.content.trim()) {
        showToast(t('Please fill in title and description.'), 'error');
        return;
      }
      finalTitle = ticketForm.title.trim();
      finalContent = `[${t('Complaint Area')}: ${getComplaintTypeLabel(ticketForm.complaintType)}${ticketForm.complaintDateInfo ? ` | ${t('Incident Date & Time')}: ${ticketForm.complaintDateInfo}` : ''}] ${ticketForm.content.trim()}`;
      if (ticketForm.complaintType === 'BILLING_POLICY' || ticketForm.complaintType === 'STAFF_BEHAVIOR') {
        finalPriority = 'HIGH';
      } else {
        finalPriority = 'NORMAL';
      }
    } else {
      // GENERAL_INQUIRY
      if (!ticketForm.title.trim() || !ticketForm.content.trim()) {
        showToast(t('Please fill in title and description.'), 'error');
        return;
      }
      finalTitle = ticketForm.title.trim();
      finalContent = ticketForm.content.trim();
      finalPriority = 'NORMAL';
    }

    try {
      setCreating(true);
      const payload = {
        category: ticketForm.category,
        classId: finalClassId,
        preferredResolution: finalPreferredResolution,
        title: finalTitle,
        content: finalContent,
        priority: finalPriority
      };
      const res = await memberService.createSupportRequest(payload);

      let prefLabel = '';
      if (finalPreferredResolution === 'ISSUE_CREDIT') prefLabel = t('Course Credit Voucher');
      if (finalPreferredResolution === 'GYM_PASS') prefLabel = t('Free 1-Month Gym Pass');
      if (finalPreferredResolution === 'CASH_REFUND') prefLabel = t('Cash / Bank Refund');

      setModalSuccess({
        type: 'SUPPORT_REQUEST_SUBMITTED',
        requestId: res.requestId,
        preferredLabel: prefLabel,
        message: t('Your support ticket has been submitted to Reception. Our staff will review your request and issue a credit or alternative resolution.')
      });
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || t('Failed to create ticket.'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const getTitlePlaceholder = (cat) => {
    switch (cat) {
      case 'COACH_FEEDBACK':
        return t('Brief summary of your feedback');
      case 'FACILITY_ISSUE':
        return t('Brief summary of facility issue');
      case 'SCHEDULE_SUPPORT':
        return t('Brief summary of schedule request');
      case 'COMPLAINT':
        return t('Brief summary of your complaint');
      default:
        return t('Brief summary of your issue or request');
    }
  };

  const getContentPlaceholder = (cat) => {
    if (cat === 'SCHEDULE_SUPPORT') {
      return t('Please describe your schedule support request.');
    }
    return t('Please provide as much detail as possible so Reception can assist you accurately...');
  };

  const getSubmitButtonLabel = (cat) => {
    switch (cat) {
      case 'COACH_FEEDBACK':
        return t('Submit Feedback to Reception');
      case 'FACILITY_ISSUE':
        return t('Submit Incident Report');
      case 'SCHEDULE_SUPPORT':
        return t('Submit Schedule Request');
      case 'COMPLAINT':
        return t('Submit Complaint to Reception');
      default:
        return t('Submit Question to Reception');
    }
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Toast Notification - Apple Dynamic Island Style */}
      <div className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] backdrop-blur-2xl border ${
        toast.type === 'error'
          ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
          : 'bg-slate-950/90 dark:bg-slate-900/95 text-white border-white/10 dark:border-white/20'
      } ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          toast.type === 'error' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-tight">{toast.message}</span>
      </div>

      {/* Page Header - Apple Support Aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-blue-400 text-[11px] font-semibold tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("NEXUS Support & Wallet")}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 font-medium">{t("Member Concierge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {t('Help Center & Credit Wallet')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {t('Manage course cancellation credit vouchers and submit support requests to Reception.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            handleCloseModal();
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm shadow-blue-500/25 active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('New Support Ticket')}</span>
        </button>
      </div>

      {/* Apple Segmented Control */}
      <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.08] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.06] self-start shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('credits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'credits'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-500" />
          <span>{t('Course Credit Vouchers')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'credits'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400'
              : 'bg-slate-200/70 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
          }`}>
            {credits.filter(c => c.status === 'ACTIVE').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Ticket className="w-4 h-4 text-[#0071E3]" />
          <span>{t('My Support Requests')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'tickets'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
              : 'bg-slate-200/70 text-slate-500 dark:bg-white/[0.08] dark:text-slate-400'
          }`}>
            {tickets.length}
          </span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center gap-3 backdrop-blur-md">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Credit Vouchers (Apple Wallet Pass Layout) */}
      {activeTab === 'credits' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3.5 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#0071E3] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-bold">{t('Policy Tip:')} </span>
              <span className="leading-relaxed opacity-90">{t('Credit Vouchers are issued when a class is cancelled before start (100% value) or approved by Reception for mid-course retention. Apply them at Cart Checkout to deduct up to 100% of your new class fee.')}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0071E3]" />
              <span className="text-xs text-slate-400 font-semibold">{t('Loading credits...')}</span>
            </div>
          ) : credits.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center mx-auto text-slate-400">
                <CreditCard className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('No Credit Vouchers Yet')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {t('When you cancel an eligible class or receive a resolution from Reception, your credit vouchers will appear here.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {credits.map((c) => {
                const isActive = c.status === 'ACTIVE';
                return (
                  <div
                    key={c.creditId}
                    className={`relative rounded-3xl p-6 transition-all duration-200 overflow-hidden border ${
                      isActive
                        ? 'bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-stone-900 dark:to-slate-950 text-slate-900 dark:text-white border-slate-200/90 dark:border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(0,0,0,0.09)]'
                        : 'bg-slate-50/90 dark:bg-slate-900/40 border-slate-200/90 dark:border-white/[0.08] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {/* Top Decorative Apple Metallic Sheen */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-500 dark:bg-amber-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <span className="text-[10px] tracking-widest font-mono font-bold uppercase text-slate-400 dark:text-slate-400">
                            NEXUS CREDIT PASS
                          </span>
                        </div>
                        <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-400/30'
                            : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 border border-slate-300/80 dark:border-white/[0.06]'
                        }`}>
                          {isActive ? t('READY TO USE') : c.status}
                        </span>
                        <div className={`text-xs mt-1 font-medium ${isActive ? 'text-slate-600 dark:text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                          {c.reason || t('Course Credit')}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                          isActive
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500 line-through'
                        }`}>
                          {formatMoney(c.remainingAmount)}
                        </div>
                        {c.remainingAmount < c.amount && (
                          <div className="text-[11px] opacity-60 line-through text-slate-400">
                            {formatMoney(c.amount)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voucher Code Box */}
                    <div className={`p-3 rounded-2xl border flex items-center justify-between my-4 ${
                      isActive
                        ? 'bg-slate-50 dark:bg-white/[0.08] border-slate-200/90 dark:border-white/10'
                        : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Ticket className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400'}`} />
                        <code className={`text-sm font-bold tracking-widest font-mono ${
                          isActive
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-400 dark:text-slate-500 line-through'
                        }`}>
                          {c.creditCode}
                        </code>
                      </div>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.creditCode)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white/15 dark:hover:bg-white/25 dark:text-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                        >
                          {copiedCode === c.creditCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === c.creditCode ? t('Copied') : t('Copy')}</span>
                        </button>
                      )}
                    </div>

                    <div className={`flex justify-between items-center text-xs pt-3 border-t ${
                      isActive
                        ? 'border-slate-100 dark:border-white/10 text-slate-500 dark:text-white/70'
                        : 'border-slate-200/60 dark:border-white/[0.06] text-slate-400 dark:text-slate-500'
                    }`}>
                      <span>{t('Expires:')} {c.expiryDate}</span>
                      {isActive && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getDaysLeft(c.expiryDate, c.daysUntilExpiry)} {t('days left')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Support Tickets (Apple Care Case List) */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0071E3]" />
              <span className="text-xs text-slate-400 font-semibold">{t('Loading tickets...')}</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-black/[0.06] dark:border-white/[0.08] space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] flex items-center justify-center mx-auto text-slate-400">
                <Ticket className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('No Support Tickets Submitted')}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {t('Need help with class retention, facility reports, or feedback? Click "New Support Ticket" to contact Reception.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedTickets.map((tkt) => {
                const isExpanded = expandedTicketId === tkt.requestId;
                return (
                  <div
                    key={tkt.requestId}
                    className="rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-none hover:border-[#0071E3]/40 transition-all overflow-hidden"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedTicketId(isExpanded ? null : tkt.requestId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedTicketId(isExpanded ? null : tkt.requestId);
                        }
                      }}
                      className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                            #{tkt.requestId}
                          </span>
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.06]">
                            {getCategoryLabel(tkt.category)}
                          </span>
                          {getStatusBadge(tkt.status, { isMember: true })}
                          {getPriorityBadge(tkt.priority, tkt.preferredResolution)}
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {tkt.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {t('Submitted on')} {tkt.createdAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <span className="text-xs font-semibold text-[#0071E3]">
                          {isExpanded ? t('Hide Details') : t('View Details')}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center text-slate-500 dark:text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/40 space-y-4 text-sm animate-fade-in">
                        <div>
                          <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                            {t('Your Request Description')}
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
                            {tkt.content}
                          </p>
                        </div>

                        {tkt.className && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold">{t('Associated Class')}:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{tkt.className}</span>
                          </div>
                        )}

                        {tkt.preferredResolution && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold">{t('Preferred Compensation')}:</span>
                            <span className="font-bold text-[#0071E3]">
                              {tkt.preferredResolution === 'ISSUE_CREDIT' && t('Credit Voucher')}
                              {tkt.preferredResolution === 'GYM_PASS' && t('1-Month Gym Pass')}
                              {tkt.preferredResolution === 'CASH_REFUND' && t('Cash / Bank Refund')}
                            </span>
                          </div>
                        )}

                        {/* Staff Response Box */}
                        {tkt.responseNote ? (
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-950 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-200 space-y-2 backdrop-blur-md">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                {t('Reception Response')} {tkt.respondedByName ? `(${tkt.respondedByName})` : ''}
                              </span>
                              <span>{tkt.respondedAt}</span>
                            </div>
                            <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed opacity-95">
                              {tkt.responseNote}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-300 text-xs flex items-center gap-2.5 backdrop-blur-md">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{t('Ticket is currently in queue. Reception staff will respond shortly.')}</span>
                          </div>
                        )}

                        {/* If ticket is PENDING or ESCALATED: show Withdraw Button */}
                        {(tkt.status === 'PENDING' || tkt.status === 'ESCALATED') && (
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWithdrawTicket(tkt.requestId);
                              }}
                              disabled={withdrawingId === tkt.requestId}
                              className="px-4 py-2 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${withdrawingId === tkt.requestId ? 'animate-spin' : ''}`} />
                              <span>{withdrawingId === tkt.requestId ? t('Withdrawing...') : t('Withdraw / Cancel this request')}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination Controls */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs mt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 order-2 sm:order-1 font-medium">
                  <span>{t('Showing')}</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{ticketStartRecord}–{ticketEndRecord}</strong>
                  <span>{t('of')}</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{tickets.length}</strong>
                  <span>{t('requests')}</span>
                </div>

                {totalTicketPages > 1 && (
                  <div className="flex items-center gap-1.5 order-1 sm:order-2 select-none">
                    {/* Previous button */}
                    <button
                      type="button"
                      onClick={() => {
                        setTicketPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                      disabled={validTicketPage === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer font-medium shadow-2xs"
                      title={t('Previous')}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('Previous')}</span>
                    </button>

                    {/* Page numbers (1, 2, 3...) */}
                    <div className="flex items-center gap-1">
                      {getPaginationRange(validTicketPage, totalTicketPages).map((p, idx) => {
                        if (p === '...') {
                          return (
                            <span key={`dots-${idx}`} className="px-2 py-1 text-xs text-slate-400 font-medium">
                              ...
                            </span>
                          );
                        }
                        const isCurrent = p === validTicketPage;
                        return (
                          <button
                            key={`page-${p}`}
                            type="button"
                            onClick={() => {
                              setTicketPage(p);
                              window.scrollTo({ top: 150, behavior: 'smooth' });
                            }}
                            className={`min-w-[34px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-[#0071E3] text-white shadow-xs shadow-blue-500/30'
                                : 'border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next button */}
                    <button
                      type="button"
                      onClick={() => {
                        setTicketPage((p) => Math.min(totalTicketPages, p + 1));
                        window.scrollTo({ top: 150, behavior: 'smooth' });
                      }}
                      disabled={validTicketPage === totalTicketPages}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-30 disabled:pointer-events-none text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1 cursor-pointer font-medium shadow-2xs"
                      title={t('Next')}
                    >
                      <span className="hidden sm:inline">{t('Next')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Ticket Creation Modal - Apple Sheet Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 backdrop-blur-3xl border border-slate-200/90 dark:border-white/[0.1] shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0">
                  {modalSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : ticketForm.category === 'CLASS_CANCELLATION' ? (
                    <CreditCard className="w-5 h-5" />
                  ) : ticketForm.category === 'COACH_FEEDBACK' ? (
                    <UserCheck className="w-5 h-5" />
                  ) : ticketForm.category === 'FACILITY_ISSUE' ? (
                    <Wrench className="w-5 h-5" />
                  ) : ticketForm.category === 'SCHEDULE_SUPPORT' ? (
                    <Calendar className="w-5 h-5" />
                  ) : ticketForm.category === 'COMPLAINT' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 id="ticket-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {modalSuccess ? (
                      modalSuccess.type === 'DIRECT_CANCEL_SUCCESS'
                        ? t('Class Cancelled & 100% Credit Granted!')
                        : t('Support Ticket Submitted!')
                    ) : ticketForm.category === 'CLASS_CANCELLATION' ? (
                      t('Class Cancellation & Refund Policy')
                    ) : (
                      t('Submit New Support Ticket')
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {modalSuccess ? (
                      modalSuccess.type === 'DIRECT_CANCEL_SUCCESS'
                        ? t('100% credit granted to your wallet.')
                        : t('Ticket ID') + `: #${modalSuccess.requestId}`
                    ) : ticketForm.category === 'CLASS_CANCELLATION' && cancelPreview ? (
                      cancelPreview.className
                    ) : (
                      t('Send inquiries or facility reports directly to Reception.')
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
                aria-label={t('Close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto flex-1 space-y-4">
              {/* SUCCESS VIEW */}
              {modalSuccess ? (
                <ClassCancellationSuccessCard
                  result={modalSuccess}
                  onClose={handleCloseModal}
                  onViewDetails={() => {
                    const targetTab = modalSuccess.type === 'DIRECT_CANCEL_SUCCESS' ? 'credits' : 'tickets';
                    handleCloseModal();
                    setActiveTab(targetTab);
                  }}
                  viewDetailsText={modalSuccess.type === 'DIRECT_CANCEL_SUCCESS' ? t('View My Credits & Tickets') : t('View My Support Tickets')}
                  copiedCode={modalCopiedCode}
                  onCopyCode={handleModalCopyCode}
                />
              ) : (
                /* FORM VIEW */
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  {/* Category Selector with Professional Vector Icons */}
                  <div className="relative space-y-1.5 pb-2 border-b border-slate-100 dark:border-white/[0.08]">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('Select Request Category')} <span className="text-rose-500">*</span>
                    </label>

                    {/* Custom Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.1] hover:border-[#0071E3]/50 focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 transition-all text-left shadow-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeCat.badgeBg}`}>
                          <ActiveCatIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t(activeCat.label)}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {t(activeCat.desc)}
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[#0071E3]' : ''}`} />
                    </button>

                    {/* Floating Dropdown Menu with SVG Icons */}
                    {categoryDropdownOpen && (
                      <>
                        <button
                          type="button"
                          aria-label={t('Close category dropdown')}
                          className="fixed inset-0 z-20 cursor-default bg-transparent border-0 p-0 w-full h-full"
                          onClick={() => setCategoryDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.1] shadow-2xl space-y-1 animate-fade-in max-h-72 overflow-y-auto">
                          {CATEGORY_OPTIONS.map((cat) => {
                            const isSelected = ticketForm.category === cat.key;
                            const CatIcon = cat.icon;
                            return (
                              <button
                                key={cat.key}
                                type="button"
                                onClick={() => {
                                  setTicketForm({ ...ticketForm, category: cat.key });
                                  setCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-500/15 border border-blue-500/30'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.badgeBg}`}>
                                    <CatIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-[#0071E3]' : 'text-slate-900 dark:text-white'}`}>
                                      {t(cat.label)}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                      {t(cat.desc)}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-[#0071E3] text-white flex items-center justify-center shrink-0 ml-2 shadow-sm">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* =========================================================================
                      CASE 1: CLASS_CANCELLATION (Matches CancelClassPolicyModal format)
                     ========================================================================= */}
                  {ticketForm.category === 'CLASS_CANCELLATION' && (
                    <div className="space-y-4">
                      {/* Enrolled class selector */}
                      <div className="space-y-1.5">
                        <label htmlFor="cancel-class-select" className="block text-xs font-bold text-[var(--text)]">
                          {t('Select Enrolled Class')} <span className="text-red-500">*</span>
                        </label>
                        {classes.length === 0 ? (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{t('You are not enrolled in any active classes to request cancellation or retention.')}</span>
                          </div>
                        ) : (
                          <select
                            id="cancel-class-select"
                            value={ticketForm.classId}
                            onChange={(e) => setTicketForm({ ...ticketForm, classId: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            required
                          >
                            {classes.map((cls) => {
                              const isPending = pendingClassIds.has(String(cls.classId));
                              return (
                                <option key={cls.classId} value={cls.classId}>
                                  {cls.className} ({cls.coachName || 'Coach'}) {isPending ? ` [⚠️ ${t('Pending Reception Review')}]` : ''}
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </div>

                      {/* Warning if selected class already has a pending cancellation request */}
                      {existingPendingTicketForSelectedClass && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 shadow-sm">
                          <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>{t('This class has a pending request')}</span>
                          </div>
                          <p className="leading-relaxed">
                            {t('You already submitted ticket')} <strong>#{existingPendingTicketForSelectedClass.requestId}</strong> ({t('Title:')} "{existingPendingTicketForSelectedClass.title}"). {t('If you want to choose a different compensation option, you can withdraw this ticket to submit a new one.')}
                          </p>
                          <div className="pt-0.5 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleWithdrawTicket(existingPendingTicketForSelectedClass.requestId)}
                              disabled={withdrawingId === existingPendingTicketForSelectedClass.requestId}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${withdrawingId === existingPendingTicketForSelectedClass.requestId ? 'animate-spin' : ''}`} />
                              <span>{withdrawingId === existingPendingTicketForSelectedClass.requestId ? t('Withdrawing...') : t('Withdraw this ticket to re-select')}</span>
                            </button>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              {t('(The old ticket will be closed to unlock new submission)')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Loading preview state */}
                      {loadingPreview && (
                        <div className="py-8 flex flex-col items-center justify-center text-[var(--text-muted)]">
                          <div className="w-8 h-8 border-4 border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin mb-2"></div>
                          <p className="text-xs font-medium">{t('Evaluating class schedule & credit terms...')}</p>
                        </div>
                      )}

                      {/* Error state */}
                      {previewError && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{previewError}</span>
                        </div>
                      )}

                      {/* Preview Loaded Content */}
                      {!loadingPreview && cancelPreview && (
                        <div className="space-y-4">
                          <ClassCancellationPreviewCard
                            preview={cancelPreview}
                            preferredResolution={ticketForm.preferredResolution}
                            onSelectResolution={(res) => setTicketForm({ ...ticketForm, preferredResolution: res })}
                          />

                          <ClassCancellationFormSection
                            preview={cancelPreview}
                            preferredResolution={ticketForm.preferredResolution}
                            reasonCategory={ticketForm.cancellationReason}
                            onChangeReasonCategory={(val) => setTicketForm({ ...ticketForm, cancellationReason: val })}
                            reasonContent={ticketForm.content}
                            onChangeReasonContent={(val) => setTicketForm({ ...ticketForm, content: val })}
                            submitting={creating}
                            onClose={handleCloseModal}
                            onDirectCancel={() => handleDirectCancel(ticketForm.classId)}
                            onSubmitSupport={handleCreateTicket}
                            directCancelDisabled={!cancelPreview.canDirectCancelWithCredit || !!existingPendingTicketForSelectedClass}
                            supportSubmitDisabled={!!existingPendingTicketForSelectedClass}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 2 to 6: NON-CANCELLATION CATEGORIES
                     ========================================================================= */}
                  {ticketForm.category !== 'CLASS_CANCELLATION' && (
                    <div className="space-y-4">
                      {/* Sub-form: COACH_FEEDBACK */}
                      {ticketForm.category === 'COACH_FEEDBACK' && (
                        <>
                          {classes.length > 0 && (
                            <div className="space-y-1.5">
                              <label htmlFor="coach-class-select" className="block text-xs font-bold text-[var(--text)]">
                                {t('Associated Class')}
                              </label>
                              <select
                                id="coach-class-select"
                                value={ticketForm.classId}
                                onChange={(e) => setTicketForm({ ...ticketForm, classId: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              >
                                <option value="">-- {t('None / Not related to a specific class')} --</option>
                                {classes.map((cls) => (
                                  <option key={cls.classId} value={cls.classId}>
                                    {cls.className} ({cls.coachName || 'Coach'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <label htmlFor="coach-aspect-select" className="block text-xs font-bold text-[var(--text)]">
                              {t('Feedback Aspect')} <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="coach-aspect-select"
                              value={ticketForm.coachAspect}
                              onChange={(e) => setTicketForm({ ...ticketForm, coachAspect: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            >
                              <option value="TEACHING_METHOD">{t('Teaching Method & Delivery')}</option>
                              <option value="ATTITUDE">{t('Attitude & Member Care')}</option>
                              <option value="PUNCTUALITY">{t('Punctuality & Professionalism')}</option>
                              <option value="TECHNICAL_GUIDANCE">{t('Technical Expertise & Form Correction')}</option>
                              <option value="OTHER">{t('Other Feedback')}</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Sub-form: FACILITY_ISSUE */}
                      {ticketForm.category === 'FACILITY_ISSUE' && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="facility-area-select" className="block text-xs font-bold text-[var(--text)]">
                                {t('Facility Area')} <span className="text-red-500">*</span>
                              </label>
                              <select
                                id="facility-area-select"
                                value={ticketForm.facilityArea}
                                onChange={(e) => setTicketForm({ ...ticketForm, facilityArea: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              >
                                <option value="GYM_FLOOR">{t('Gym & Free Weights Area')}</option>
                                <option value="CARDIO_ZONE">{t('Cardio Zone')}</option>
                                <option value="STUDIO_ROOM">{t('Studio / Yoga / Aerobics Room')}</option>
                                <option value="SWIMMING_POOL">{t('Swimming Pool & Jacuzzi')}</option>
                                <option value="LOCKER_SAUNA">{t('Locker Room & Sauna')}</option>
                                <option value="LOBBY_RECEPTION">{t('Lobby & Reception Area')}</option>
                                <option value="OTHER">{t('Other Area')}</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="facility-urgency-select" className="block text-xs font-bold text-[var(--text)]">
                                {t('Urgency Level')}
                              </label>
                              <select
                                id="facility-urgency-select"
                                value={ticketForm.facilityUrgency}
                                onChange={(e) => setTicketForm({ ...ticketForm, facilityUrgency: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              >
                                <option value="URGENT">{t('Urgent (Safety Risk / Major Breakdown)')}</option>
                                <option value="NORMAL">{t('Normal (Affects Workout Experience)')}</option>
                                <option value="LOW">{t('Low (Routine Maintenance / Cleaning)')}</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="facility-device-input" className="block text-xs font-bold text-[var(--text)]">
                              {t('Device / Location Detail')}
                            </label>
                            <input
                              id="facility-device-input"
                              type="text"
                              value={ticketForm.facilityDevice}
                              onChange={(e) => setTicketForm({ ...ticketForm, facilityDevice: e.target.value })}
                              placeholder={t('Device / Location Detail')}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                          </div>
                        </>
                      )}

                      {/* Sub-form: SCHEDULE_SUPPORT */}
                      {ticketForm.category === 'SCHEDULE_SUPPORT' && (
                        <>
                          <div className="space-y-1.5">
                            <label htmlFor="schedule-class-select" className="block text-xs font-bold text-[var(--text)]">
                              {t('Associated Class')} <span className="text-red-500">*</span>
                            </label>
                            {classes.length === 0 ? (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{t('You are not enrolled in any active classes to request cancellation or retention.')}</span>
                              </div>
                            ) : (
                              <select
                                id="schedule-class-select"
                                value={ticketForm.classId}
                                onChange={(e) => setTicketForm({ ...ticketForm, classId: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                required
                              >
                                <option value="">-- {t('Select Enrolled Class')} --</option>
                                {classes.map((cls) => (
                                  <option key={cls.classId} value={cls.classId}>
                                    {cls.className} ({cls.coachName || 'Coach'})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="schedule-type-select" className="block text-xs font-bold text-[var(--text)]">
                                {t('Schedule Support Type')} <span className="text-red-500">*</span>
                              </label>
                              <select
                                id="schedule-type-select"
                                value={ticketForm.scheduleType}
                                onChange={(e) => setTicketForm({ ...ticketForm, scheduleType: e.target.value })}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              >
                                <option value="SINGLE_ABSENCE">{t('Request Single Session Absence')}</option>
                                <option value="MAKEUP_CLASS">{t('Register Makeup Session')}</option>
                                <option value="CLASS_TRANSFER">{t('Request Class Time Transfer')}</option>
                                <option value="SCHEDULE_INQUIRY">{t('Schedule & Holiday Inquiry')}</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="schedule-date-input" className="block text-xs font-bold text-[var(--text)]">
                                {t('Session / Date Detail')}
                              </label>
                              <input
                                id="schedule-date-input"
                                type="text"
                                value={ticketForm.scheduleDateInfo}
                                onChange={(e) => setTicketForm({ ...ticketForm, scheduleDateInfo: e.target.value })}
                                placeholder={t('Session / Date Detail')}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Sub-form: COMPLAINT */}
                      {ticketForm.category === 'COMPLAINT' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label htmlFor="complaint-area-select" className="block text-xs font-bold text-[var(--text)]">
                              {t('Complaint Area')} <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="complaint-area-select"
                              value={ticketForm.complaintType}
                              onChange={(e) => setTicketForm({ ...ticketForm, complaintType: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            >
                              <option value="STAFF_BEHAVIOR">{t('Staff / Receptionist Service')}</option>
                              <option value="CLEANLINESS">{t('Cleanliness & Environment')}</option>
                              <option value="BILLING_POLICY">{t('Pricing, Membership & Billing Policy')}</option>
                              <option value="OTHER">{t('Other Issue')}</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="complaint-date-input" className="block text-xs font-bold text-[var(--text)]">
                              {t('Incident Date & Time')}
                            </label>
                            <input
                              id="complaint-date-input"
                              type="text"
                              value={ticketForm.complaintDateInfo}
                              onChange={(e) => setTicketForm({ ...ticketForm, complaintDateInfo: e.target.value })}
                              placeholder={t('Incident Date & Time')}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Sub-form: GENERAL_INQUIRY */}
                      {ticketForm.category === 'GENERAL_INQUIRY' && classes.length > 0 && (
                        <div className="space-y-1.5">
                          <label htmlFor="general-class-select" className="block text-xs font-bold text-[var(--text)]">
                            {t('Related Class (Optional)')}
                          </label>
                          <select
                            id="general-class-select"
                            value={ticketForm.classId}
                            onChange={(e) => setTicketForm({ ...ticketForm, classId: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          >
                            <option value="">-- {t('None / Not related to a specific class')} --</option>
                            {classes.map((cls) => (
                              <option key={cls.classId} value={cls.classId}>
                                {cls.className} ({cls.coachName || 'Coach'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Shared Title Field */}
                      <div className="space-y-1.5">
                        <label htmlFor="ticket-title-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t('Title / Subject')} {ticketForm.category !== 'SCHEDULE_SUPPORT' && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          id="ticket-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={getTitlePlaceholder(ticketForm.category)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15"
                          required={ticketForm.category !== 'SCHEDULE_SUPPORT'}
                        />
                      </div>

                      {/* Shared Detailed Content Field */}
                      <div className="space-y-1.5">
                        <label htmlFor="ticket-content-textarea" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t('Detailed Content')} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="ticket-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={getContentPlaceholder(ticketForm.category)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#0071E3]/15 resize-none"
                          required
                        />
                      </div>

                      {/* Shared Action Buttons Footer */}
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-5 py-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.content.trim() || (ticketForm.category !== 'SCHEDULE_SUPPORT' && !ticketForm.title.trim())}
                          className="px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm shadow-blue-500/25 disabled:opacity-50 active:scale-95 cursor-pointer"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{getSubmitButtonLabel(ticketForm.category)}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modern Bilingual Withdraw Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmWithdrawModal.isOpen}
        onClose={() => setConfirmWithdrawModal({ isOpen: false, requestId: null })}
        onConfirm={() => executeWithdrawTicket(confirmWithdrawModal.requestId)}
        title="Withdraw Support Request?"
        message="Are you sure you want to withdraw this request? Once withdrawn, the ticket will be closed and you can submit a new request if needed."
        confirmText="Withdraw Request"
        cancelText="Keep Request"
        isDestructive={true}
        icon={RotateCcw}
      />
    </div>
  );
};

export default MemberSupportView;