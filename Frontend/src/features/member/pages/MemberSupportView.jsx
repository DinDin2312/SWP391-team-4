import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle, CreditCard, Ticket, Clock, CheckCircle2,
  AlertTriangle, Plus, Send, X, Copy, Check, MessageSquare,
  ShieldCheck, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
  Dumbbell, DollarSign, Sparkles, Wrench, UserCheck, Calendar, RotateCcw,
  ArrowUp, Minus, ArrowDown
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import memberService from '../services/memberService';
import { ConfirmModal } from '../../../components/ui/confirm-modal';

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

const MemberSupportView = () => {
  useLanguage();

  const [activeTab, setActiveTab] = useState('credits'); // 'credits' | 'tickets'
  const [credits, setCredits] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Cancellation preview state
  const [cancelPreview, setCancelPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

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
    fetchData();
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
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(t('Copied credit code: ') + code, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleModalCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
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
        fetchCancelPreview(ticketForm.classId);
      }
    } else {
      setCancelPreview(null);
      setPreviewError('');
    }
  }, [isModalOpen, ticketForm.category, ticketForm.classId, classes]);

  const fetchCancelPreview = async (classId) => {
    try {
      setLoadingPreview(true);
      setPreviewError('');
      const data = await memberService.getCancelClassPreview(classId);
      setCancelPreview(data);
    } catch (err) {
      console.error(err);
      setPreviewError(err.response?.data?.message || err.message || t('Failed to load cancellation policy preview.'));
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDirectCancel = async (classId) => {
    try {
      setCreating(true);
      setPreviewError('');
      const res = await memberService.cancelClassDirectly(classId);
      setModalSuccess({
        type: 'DIRECT_CANCEL_SUCCESS',
        requestId: res.requestId,
        creditCode: res.creditCode,
        creditAmount: res.creditAmount,
        expiryDate: res.expiryDate,
        message: res.message
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || err.message || t('Failed to cancel class.'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const getDaysLeft = (expiryDate, providedDays) => {
    if (providedDays != null && !isNaN(providedDays)) return providedDays;
    if (!expiryDate) return 0;
    try {
      const parts = String(expiryDate).split('-');
      if (parts.length === 3) {
        const exp = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
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

  const getReasonLabel = (val) => {
    switch (val) {
      case 'CLASS_CANCELLATION': return t('Mid-Course Emergency / Medical / Relocation');
      case 'GENERAL_INQUIRY': return t('Schedule Conflict / Need Class Transfer');
      case 'COMPLAINT': return t('Course Quality / Other Reason');
      default: return t('Other');
    }
  };

  const getCoachAspectLabel = (val) => {
    switch (val) {
      case 'TEACHING_METHOD': return t('Teaching Method & Delivery');
      case 'ATTITUDE': return t('Attitude & Member Care');
      case 'PUNCTUALITY': return t('Punctuality & Professionalism');
      case 'TECHNICAL_GUIDANCE': return t('Technical Expertise & Form Correction');
      default: return t('Other Feedback');
    }
  };

  const getFacilityAreaLabel = (val) => {
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

  const getScheduleTypeLabel = (val) => {
    switch (val) {
      case 'SINGLE_ABSENCE': return t('Request Single Session Absence');
      case 'MAKEUP_CLASS': return t('Register Makeup Session');
      case 'CLASS_TRANSFER': return t('Request Class Time Transfer');
      case 'SCHEDULE_INQUIRY': return t('Schedule & Holiday Inquiry');
      default: return t('Schedule Support');
    }
  };

  const getComplaintTypeLabel = (val) => {
    switch (val) {
      case 'STAFF_BEHAVIOR': return t('Staff / Receptionist Service');
      case 'CLEANLINESS': return t('Cleanliness & Environment');
      case 'BILLING_POLICY': return t('Pricing, Membership & Billing Policy');
      default: return t('Other Issue');
    }
  };

  const handleCreateTicket = async (e) => {
    if (e) e.preventDefault();

    let finalTitle = '';
    let finalContent = '';
    let finalPriority = ticketForm.priority || 'NORMAL';
    const finalClassId = ticketForm.classId ? parseInt(ticketForm.classId, 10) : null;
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
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || t('Failed to create ticket.'), 'error');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> {t('Pending Reception Review')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('In Progress')}
          </span>
        );
      case 'APPROVED':
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('Approved & Resolved')}
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {t('Escalated to Manager')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> {t('Rejected')}
          </span>
        );
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600">{status}</span>;
    }
  };

  const getPriorityBadge = (priority, preferredResolution) => {
    const effectivePriority = (priority === 'HIGH' || preferredResolution === 'CASH_REFUND') ? 'HIGH' : priority;
    switch (effectivePriority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 shadow-xs">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{t('Urgent')}</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            <ArrowUp className="w-3 h-3 shrink-0" />
            <span>{t('High')}</span>
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <ArrowDown className="w-3 h-3 shrink-0" />
            <span>{t('Low')}</span>
          </span>
        );
      case 'NORMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            <Minus className="w-3 h-3 shrink-0" />
            <span>{t('Normal')}</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'CLASS_CANCELLATION': return t('Class Cancellation & Proration');
      case 'FACILITY_ISSUE': return t('Facility & Equipment Report');
      case 'COACH_FEEDBACK': return t('Coach & Training Feedback');
      case 'SCHEDULE_SUPPORT': return t('Schedule Support & Absence/Makeup');
      case 'COMPLAINT': return t('Service Complaint');
      default: return t('General Inquiry');
    }
  };

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--surface)] text-[var(--text)] shadow-2xl border border-[var(--border)] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-[var(--primary)]" />
            {t('Help Center & Credit Wallet')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('Manage course cancellation credit vouchers and submit support requests to Reception.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            handleCloseModal();
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('New Support Ticket')}</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('credits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'credits' ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('Course Credit Vouchers')} ({credits.filter(c => c.status === 'ACTIVE').length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === 'tickets' ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
        >
          <Ticket className="w-4 h-4" />
          <span>{t('My Support Requests')} ({tickets.length})</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Credit Vouchers */}
      {activeTab === 'credits' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">{t('Policy Tip:')} </span>
              <span>{t('Credit Vouchers are issued when a class is cancelled before start (100% value) or approved by Reception for mid-course retention. Apply them at Cart Checkout to deduct up to 100% of your new class fee.')}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-[var(--text-muted)]">{t('Loading credits...')}</div>
          ) : credits.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <CreditCard className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[var(--text)]">{t('No Credit Vouchers Yet')}</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {t('When you cancel an eligible class or receive a resolution from Reception, your credit vouchers will appear here.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {credits.map((c) => {
                const isActive = c.status === 'ACTIVE';
                return (
                  <div
                    key={c.creditId}
                    className={`relative p-5 rounded-2xl bg-[var(--surface)] border transition-all ${isActive ? 'border-[var(--primary)]/40 shadow-md' : 'border-[var(--border)] opacity-60'}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                          {isActive ? t('READY TO USE') : c.status}
                        </span>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{c.reason || t('Course Credit')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-[var(--primary)]">
                          {formatMoney(c.remainingAmount)}
                        </div>
                        {c.remainingAmount < c.amount && (
                          <div className="text-[11px] text-[var(--text-muted)] line-through">
                            {formatMoney(c.amount)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voucher Code Box */}
                    <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between my-3">
                      <code className="text-sm font-bold text-[var(--text)] tracking-wider">
                        {c.creditCode}
                      </code>
                      {isActive && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(c.creditCode)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1"
                        >
                          {copiedCode === c.creditCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedCode === c.creditCode ? t('Copied') : t('Copy')}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                      <span>{t('Expires:')} {c.expiryDate}</span>
                      {isActive && (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {getDaysLeft(c.expiryDate, c.daysUntilExpiry)} {t('days left')}
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

      {/* Tab 2: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-[var(--text-muted)]">{t('Loading tickets...')}</div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <Ticket className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-50" />
              <h3 className="text-base font-bold text-[var(--text)]">{t('No Support Tickets Submitted')}</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {t('Need help with class retention, facility reports, or feedback? Click "New Support Ticket" to contact Reception.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((tkt) => {
                const isExpanded = expandedTicketId === tkt.requestId;
                return (
                  <div
                    key={tkt.requestId}
                    className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden transition-all"
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
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[var(--primary)]">
                            #{tkt.requestId}
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                            {getCategoryLabel(tkt.category)}
                          </span>
                          {getStatusBadge(tkt.status)}
                          {getPriorityBadge(tkt.priority, tkt.preferredResolution)}
                        </div>
                        <h4 className="text-base font-bold text-[var(--text)]">
                          {tkt.title}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {t('Submitted on')} {tkt.createdAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          {isExpanded ? t('Hide Details') : t('View Details')}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-[var(--border)] bg-[var(--surface-hover)] space-y-4 text-sm animate-fade-in">
                        <div>
                          <div className="text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wide">
                            {t('Your Request Description')}
                          </div>
                          <p className="text-sm text-[var(--text)] whitespace-pre-line leading-relaxed bg-[var(--surface)] p-3.5 rounded-xl border border-[var(--border)]">
                            {tkt.content}
                          </p>
                        </div>

                        {tkt.className && (
                          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="font-semibold">{t('Associated Class')}:</span>
                            <span className="font-bold text-[var(--text)]">{tkt.className}</span>
                          </div>
                        )}

                        {tkt.preferredResolution && (
                          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <span className="font-semibold">{t('Preferred Compensation')}:</span>
                            <span className="font-bold text-[var(--primary)]">
                              {tkt.preferredResolution === 'ISSUE_CREDIT' && t('Credit Voucher')}
                              {tkt.preferredResolution === 'GYM_PASS' && t('1-Month Gym Pass')}
                              {tkt.preferredResolution === 'CASH_REFUND' && t('Cash / Bank Refund')}
                            </span>
                          </div>
                        )}

                        {/* Staff Response Box */}
                        {tkt.responseNote ? (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                {t('Reception Response')} {tkt.respondedByName ? `(${tkt.respondedByName})` : ''}
                              </span>
                              <span>{tkt.respondedAt}</span>
                            </div>
                            <p className="text-sm whitespace-pre-line leading-relaxed">
                              {tkt.responseNote}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
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
                              className="px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
            </div>
          )}
        </div>
      )}

      {/* Dynamic Ticket Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            className="relative w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
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
                  <h3 id="ticket-modal-title" className="text-lg font-bold text-[var(--text)]">
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
                  <p className="text-xs text-[var(--text-muted)]">
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
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                aria-label={t('Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 overflow-y-auto flex-1 space-y-4">
              {/* SUCCESS VIEW */}
              {modalSuccess ? (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  {modalSuccess.type === 'DIRECT_CANCEL_SUCCESS' ? (
                    <>
                      <h4 className="text-xl font-bold text-[var(--text)]">
                        {t('Class Cancelled & 100% Credit Granted!')}
                      </h4>
                      <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                        {t('Because this class has not started yet, 100% of your course fee has been converted into a Course Credit Voucher valid for 60 days.')}
                      </p>

                      <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] max-w-sm mx-auto text-left space-y-2">
                        <div className="text-xs text-[var(--text-muted)] font-medium">{t('Credit Voucher Code')}</div>
                        <div className="flex items-center justify-between bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
                          <code className="text-base font-bold text-[var(--primary)] tracking-wider">
                            {modalSuccess.creditCode}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleModalCopyCode(modalSuccess.creditCode)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1.5"
                          >
                            {modalCopiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {modalCopiedCode ? t('Copied') : t('Copy')}
                          </button>
                        </div>
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-[var(--text-muted)]">{t('Amount:')}</span>
                          <span className="font-bold text-[var(--text)]">{formatMoney(modalSuccess.creditAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">{t('Valid Until:')}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{modalSuccess.expiryDate} (60 {t('days')})</span>
                        </div>
                        {modalSuccess.requestId && (
                          <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
                            <span className="text-[var(--text-muted)]">{t('Ticket ID')}:</span>
                            <span className="font-bold text-[var(--text)]">#{modalSuccess.requestId} &bull; <span className="text-emerald-600 font-bold">{t('Approved & Resolved')}</span></span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-xl font-bold text-[var(--text)]">
                        {t('Support Ticket Submitted!')}
                      </h4>
                      <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
                        {modalSuccess.message}
                      </p>
                      {modalSuccess.preferredLabel && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-xs font-bold border border-[var(--primary)]/20">
                          <span>{t('Requested Benefit')}:</span>
                          <span>{modalSuccess.preferredLabel}</span>
                        </div>
                      )}
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {t('Ticket ID')}: #{modalSuccess.requestId} &bull; {t('You will receive a notification once Reception reviews and resolves your ticket.')}
                      </div>
                    </>
                  )}

                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                    >
                      {t('Close')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetTab = modalSuccess.type === 'DIRECT_CANCEL_SUCCESS' ? 'credits' : 'tickets';
                        handleCloseModal();
                        setActiveTab(targetTab);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      {modalSuccess.type === 'DIRECT_CANCEL_SUCCESS' ? t('View My Credits & Tickets') : t('View My Support Tickets')}
                    </button>
                  </div>
                </div>
              ) : (
                /* FORM VIEW */
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  {/* Category Selector with Professional Vector Icons */}
                  <div className="relative space-y-1.5 pb-2 border-b border-[var(--border)]">
                    <label className="block text-xs font-bold text-[var(--text)]">
                      {t('Select Request Category')} <span className="text-red-500">*</span>
                    </label>

                    {/* Custom Dropdown Trigger */}
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--surface-hover)] border-2 border-[var(--border)] hover:border-[var(--primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeCat.badgeBg}`}>
                          <ActiveCatIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[var(--text)] truncate">
                            {t(activeCat.label)}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] truncate">
                            {t(activeCat.desc)}
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180 text-[var(--primary)]' : ''}`} />
                    </button>

                    {/* Floating Dropdown Menu with SVG Icons */}
                    {categoryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setCategoryDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 z-30 p-2 rounded-2xl bg-[var(--surface)] border-2 border-[var(--border)] shadow-2xl space-y-1 animate-fade-in max-h-72 overflow-y-auto">
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
                                    ? 'bg-[var(--primary-soft)] border border-[var(--primary)]/40 shadow-sm'
                                    : 'hover:bg-[var(--surface-hover)] border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.badgeBg}`}>
                                    <CatIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}>
                                      {t(cat.label)}
                                    </div>
                                    <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                      {t(cat.desc)}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0 ml-2 shadow-sm">
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
                          {/* Status Header Badge */}
                          <div className={`p-4 rounded-xl border ${!cancelPreview.hasStarted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300'}`}>
                            <div className="flex items-center gap-2.5 font-bold text-sm mb-1">
                              {!cancelPreview.hasStarted ? (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  <span>{t('Class Has Not Started Yet - 100% Credit Eligible')}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  <span>{t('Class In Progress - Reception Support Required')}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed opacity-90">
                              {cancelPreview.policyNotice}
                            </p>
                          </div>

                          {/* Course Progress & Pricing Breakdown */}
                          <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[var(--text-muted)]">{t('Course Name')}:</span>
                              <span className="font-bold text-[var(--text)]">{cancelPreview.className}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[var(--text-muted)]">{t('Course Tuition')}:</span>
                              <span className="font-bold text-[var(--text)]">{formatMoney(cancelPreview.classPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[var(--text-muted)]">{t('Session Progress')}:</span>
                              <span className="font-medium text-[var(--text)]">
                                {cancelPreview.attendedSessions} / {cancelPreview.totalSessions} {t('sessions taken')} ({cancelPreview.remainingSessions} {t('remaining')})
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-[var(--border)] h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
                                style={{ width: `${cancelPreview.totalSessions > 0 ? (cancelPreview.attendedSessions / cancelPreview.totalSessions) * 100 : 0}%` }}
                              />
                            </div>

                            {cancelPreview.hasStarted && (
                              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--text-muted)]">
                                  {t('Estimated Prorated Credit Value:')}
                                </span>
                                <span className="text-base font-extrabold text-[var(--primary)]">
                                  {formatMoney(cancelPreview.proratedCredit)}
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
                                onClick={() => setTicketForm({ ...ticketForm, preferredResolution: 'ISSUE_CREDIT' })}
                                className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                                  ticketForm.preferredResolution === 'ISSUE_CREDIT'
                                    ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-500/15 ring-2 ring-emerald-500/30'
                                    : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-emerald-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`p-2 rounded-lg mt-0.5 ${
                                      ticketForm.preferredResolution === 'ISSUE_CREDIT'
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
                                          {!cancelPreview.hasStarted ? '100% ' + t('Tuition Value') : formatMoney(cancelPreview.proratedCredit)}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-snug">
                                        {t('100% or prorated value credited for 60 days to book any other class or gym package.')}
                                      </p>
                                      <div className="mt-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>{!cancelPreview.hasStarted ? t('Auto-issued instantly (1-click)') : t('Quick reception review')}</span>
                                      </div>
                                    </div>
                                  </div>
                                  {ticketForm.preferredResolution === 'ISSUE_CREDIT' && (
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </button>

                              {/* Option 2: 1-Month Gym Pass */}
                              <button
                                type="button"
                                onClick={() => setTicketForm({ ...ticketForm, preferredResolution: 'GYM_PASS' })}
                                className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                                  ticketForm.preferredResolution === 'GYM_PASS'
                                    ? 'border-blue-600 bg-blue-500/10 dark:bg-blue-500/15 ring-2 ring-blue-500/30'
                                    : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-blue-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`p-2 rounded-lg mt-0.5 ${
                                      ticketForm.preferredResolution === 'GYM_PASS'
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
                                  {ticketForm.preferredResolution === 'GYM_PASS' && (
                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </button>

                              {/* Option 3: Cash / Bank Refund */}
                              <button
                                type="button"
                                onClick={() => setTicketForm({ ...ticketForm, preferredResolution: 'CASH_REFUND' })}
                                className={`p-3.5 rounded-xl border-2 text-left transition-all relative ${
                                  ticketForm.preferredResolution === 'CASH_REFUND'
                                    ? 'border-purple-600 bg-purple-500/10 dark:bg-purple-500/15 ring-2 ring-purple-500/30'
                                    : 'border-[var(--border)] bg-[var(--surface-hover)] hover:border-purple-500/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <div className={`p-2 rounded-lg mt-0.5 ${
                                      ticketForm.preferredResolution === 'CASH_REFUND'
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
                                          {!cancelPreview.hasStarted ? formatMoney(cancelPreview.classPrice) : formatMoney(cancelPreview.proratedCredit)}
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
                                  {ticketForm.preferredResolution === 'CASH_REFUND' && (
                                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  )}
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Action Area: Direct Cancel or Support Form */}
                          {!cancelPreview.hasStarted && ticketForm.preferredResolution === 'ISSUE_CREDIT' ? (
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
                                  onClick={handleCloseModal}
                                  disabled={creating}
                                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                                >
                                  {t('Keep My Booking')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectCancel(ticketForm.classId)}
                                  disabled={creating || !cancelPreview.canDirectCancelWithCredit || !!existingPendingTicketForSelectedClass}
                                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {creating ? (
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
                            /* Support Ticket Form to Reception */
                            <div className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <label htmlFor="cancel-reason-select" className="block text-xs font-bold text-[var(--text)]">
                                  {t('Reason for Request')}
                                </label>
                                <select
                                  id="cancel-reason-select"
                                  value={ticketForm.cancellationReason}
                                  onChange={(e) => setTicketForm({ ...ticketForm, cancellationReason: e.target.value })}
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
                                  value={ticketForm.content}
                                  onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                                  placeholder={t('Please specify your reason (e.g. medical reason, work relocation). Receptionist will review and approve your credit voucher or compensation.')}
                                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                                  required
                                />
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={handleCloseModal}
                                  disabled={creating}
                                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                                >
                                  {t('Keep My Booking')}
                                </button>
                                <button
                                  type="submit"
                                  disabled={creating || !ticketForm.content.trim() || !!existingPendingTicketForSelectedClass}
                                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {creating ? (
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
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 2: COACH_FEEDBACK (Góp ý HLV & Huấn luyện)
                     ========================================================================= */}
                  {ticketForm.category === 'COACH_FEEDBACK' && (
                    <div className="space-y-4">
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

                      <div className="space-y-1.5">
                        <label htmlFor="coach-title-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Title / Subject')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="coach-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={t('Brief summary of your feedback')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="coach-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                          {t('Detailed Content')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="coach-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={t('Please provide as much detail as possible so Reception can assist you accurately...')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.title.trim() || !ticketForm.content.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{t('Submit Feedback to Reception')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 3: FACILITY_ISSUE (Báo sự cố thiết bị & CSVC)
                     ========================================================================= */}
                  {ticketForm.category === 'FACILITY_ISSUE' && (
                    <div className="space-y-4">
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

                      <div className="space-y-1.5">
                        <label htmlFor="facility-title-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Title / Subject')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="facility-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={t('Brief summary of facility issue')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="facility-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                          {t('Detailed Content')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="facility-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={t('Please provide as much detail as possible so Reception can assist you accurately...')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.title.trim() || !ticketForm.content.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{t('Submit Incident Report')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 4: SCHEDULE_SUPPORT (Hỗ trợ lịch tập & Xin nghỉ/Học bù)
                     ========================================================================= */}
                  {ticketForm.category === 'SCHEDULE_SUPPORT' && (
                    <div className="space-y-4">
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

                      <div className="space-y-1.5">
                        <label htmlFor="schedule-title-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Title / Subject')}
                        </label>
                        <input
                          id="schedule-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={t('Brief summary of schedule request')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="schedule-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                          {t('Detailed Content')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="schedule-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={t('Please describe your schedule support request.')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.content.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{t('Submit Schedule Request')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 5: COMPLAINT (Khiếu nại dịch vụ & Phản ánh)
                     ========================================================================= */}
                  {ticketForm.category === 'COMPLAINT' && (
                    <div className="space-y-4">
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

                      <div className="space-y-1.5">
                        <label htmlFor="complaint-title-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Title / Subject')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="complaint-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={t('Brief summary of your complaint')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="complaint-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                          {t('Detailed Content')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="complaint-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={t('Please provide as much detail as possible so Reception can assist you accurately...')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.title.trim() || !ticketForm.content.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{t('Submit Complaint to Reception')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* =========================================================================
                      CASE 6: GENERAL_INQUIRY (Hỏi đáp chung & Thắc mắc khác)
                     ========================================================================= */}
                  {ticketForm.category === 'GENERAL_INQUIRY' && (
                    <div className="space-y-4">
                      {classes.length > 0 && (
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

                      <div className="space-y-1.5">
                        <label htmlFor="general-title-input" className="block text-xs font-bold text-[var(--text)]">
                          {t('Title / Subject')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="general-title-input"
                          type="text"
                          value={ticketForm.title}
                          onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                          placeholder={t('Brief summary of your issue or request')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="general-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                          {t('Detailed Content')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="general-content-textarea"
                          rows={4}
                          value={ticketForm.content}
                          onChange={(e) => setTicketForm({ ...ticketForm, content: e.target.value })}
                          placeholder={t('Please provide as much detail as possible so Reception can assist you accurately...')}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          disabled={creating}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] font-medium text-sm transition-colors"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={creating || !ticketForm.title.trim() || !ticketForm.content.trim()}
                          className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 disabled:opacity-50"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{t('Submitting...')}</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{t('Submit Question to Reception')}</span>
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