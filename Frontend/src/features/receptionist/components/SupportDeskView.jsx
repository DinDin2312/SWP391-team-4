import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import {
  LifeBuoy, Search, Filter, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, ChevronLeft,
  ChevronRight, MessageSquare, ArrowUpRight,
  Eye, ChevronDown, RotateCcw, X, ShieldAlert, Wrench
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import {
  getPriorityBadge,
  getStatusBadge,
  getCategoryBadge,
  getPreferredResolutionBadge,
  getCompactSupportSummary,
  parseSupportRequestDetails,
  getAttendancePolicySummary,
  getMemberInitials,
  formatSupportDate,
  canStaffProcessTicket
} from '../../../utils/supportDisplayUtils';
import receptionistService from '../services/receptionistService';
import RespondSupportModal from './RespondSupportModal';
import ManagerPageHeader from '../../manager/components/ManagerPageHeader';
import { splitCode } from '../../manager/components/classSearch';

const SupportDeskView = (props) => {
  useLanguage();
  const { userRole, userInfo } = useContext(AuthContext);
  const normalizedRole = String(userRole || userInfo?.role || '').trim().toUpperCase();
  const isManager = Boolean(
    props.isManager ||
    normalizedRole === 'CENTER MANAGER' ||
    normalizedRole === 'CENTER_MANAGER' ||
    normalizedRole === 'ADMIN'
  );

  const [stats, setStats] = useState({
    pending: 0,
    cancellations: 0,
    facilities: 0,
    resolved: 0,
    escalated: 0,
    approved: 0,
    rejected: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState(props.initialKeyword || '');

  useEffect(() => {
    if (props.initialKeyword !== undefined && props.initialKeyword !== null) {
      setSearchKeyword(props.initialKeyword);
      setSelectedStatus('ALL');
      setSelectedCategory('ALL');
      setCurrentPage(0);
    }
  }, [props.initialKeyword]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal
  const [activeRequest, setActiveRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await receptionistService.getSupportStats();
      if (res) {
        const approved = res.approved || 0;
        const rejected = res.rejected || 0;
        const resolved = (res.resolved !== undefined) ? res.resolved : (approved + rejected);
        setStats({
          pending: res.pending || 0,
          cancellations: res.classCancellations || 0,
          facilities: res.facilityIssues || 0,
          resolved,
          escalated: res.escalated || 0,
          approved,
          rejected
        });
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await receptionistService.getSupportRequests({
        status: selectedStatus,
        category: selectedCategory,
        keyword: searchKeyword,
        page: currentPage,
        size: 10
      });
      setRequests(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch (err) {
      console.error('Requests fetch error:', err);
      setError(t('Failed to load support requests. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory, searchKeyword, currentPage]);

  useEffect(() => {
    void fetchStats();
    void fetchRequests();
  }, [fetchStats, fetchRequests]);

  const handleOpenModal = (req) => {
    setActiveRequest(req);
    setIsModalOpen(true);
  };

  const handleResolutionSuccess = () => {
    showToast(t('Support ticket resolved and member notified successfully.'), 'success');
    void fetchStats();
    void fetchRequests();
  };

  const hasActiveFilters = selectedStatus !== 'ALL' || selectedCategory !== 'ALL' || Boolean(searchKeyword.trim());

  const resetFilters = () => {
    setSelectedStatus('ALL');
    setSelectedCategory('ALL');
    setSearchKeyword('');
    setCurrentPage(0);
  };

  const applyQuickFilter = (nextStatus = 'ALL', nextCategory = 'ALL') => {
    setSelectedStatus(nextStatus);
    setSelectedCategory(nextCategory);
    setCurrentPage(0);
  };

  const isPendingCardActive = selectedStatus === 'PENDING' && selectedCategory === 'ALL';
  const isSecondCardActive = isManager
    ? (selectedStatus === 'ESCALATED' && selectedCategory === 'ALL')
    : (selectedCategory === 'CLASS_CANCELLATION' && selectedStatus === 'ALL');
  const isFacilityCardActive = selectedCategory === 'FACILITY_ISSUE' && selectedStatus === 'ALL';
  const isApprovedCardActive = selectedStatus === 'APPROVED' && selectedCategory === 'ALL';

  const refreshButton = (
    <button
      type="button"
      onClick={() => {
        void fetchStats();
        void fetchRequests();
      }}
      className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-semibold inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[var(--primary)]' : ''}`} />
      <span>{t('Refresh Queue')}</span>
    </button>
  );

  const quickPills = [
    {
      key: 'ALL',
      label: t('All Tickets'),
      active: selectedStatus === 'ALL' && selectedCategory === 'ALL',
      onClick: () => applyQuickFilter('ALL', 'ALL')
    },
    {
      key: 'PENDING',
      label: t('Pending'),
      count: stats.pending,
      active: isPendingCardActive,
      onClick: () => (isPendingCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('PENDING', 'ALL'))
    },
    ...(isManager ? [{
      key: 'ESCALATED',
      label: t('Escalated to Manager'),
      count: stats.escalated || 0,
      active: selectedStatus === 'ESCALATED' && selectedCategory === 'ALL',
      onClick: () => (selectedStatus === 'ESCALATED' && selectedCategory === 'ALL'
        ? applyQuickFilter('ALL', 'ALL')
        : applyQuickFilter('ESCALATED', 'ALL'))
    }] : []),
    {
      key: 'CLASS_CANCELLATION',
      label: t('Class Cancellation'),
      active: selectedCategory === 'CLASS_CANCELLATION' && selectedStatus === 'ALL',
      onClick: () => (selectedCategory === 'CLASS_CANCELLATION' && selectedStatus === 'ALL'
        ? applyQuickFilter('ALL', 'ALL')
        : applyQuickFilter('ALL', 'CLASS_CANCELLATION'))
    },
    {
      key: 'FACILITY_ISSUE',
      label: t('Facility Issue'),
      active: isFacilityCardActive,
      onClick: () => (isFacilityCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('ALL', 'FACILITY_ISSUE'))
    },
    {
      key: 'COACH_FEEDBACK',
      label: t('Coach Feedback'),
      active: selectedCategory === 'COACH_FEEDBACK' && selectedStatus === 'ALL',
      onClick: () => (selectedCategory === 'COACH_FEEDBACK' && selectedStatus === 'ALL'
        ? applyQuickFilter('ALL', 'ALL')
        : applyQuickFilter('ALL', 'COACH_FEEDBACK'))
    },
    {
      key: 'APPROVED',
      label: t('Approved Tickets'),
      active: isApprovedCardActive,
      onClick: () => (isApprovedCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('APPROVED', 'ALL'))
    }
  ];

  return (
    <div className="flex flex-col w-full pb-12 space-y-6">
      {/* Toast Alert */}
      <div className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 ease-out flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--surface)] text-[var(--text)] shadow-2xl border border-[var(--border)] ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>

      {/* Header */}
      {isManager ? (
        <ManagerPageHeader
          title="Center Operations: Support & Escalation Reviews"
          description="Review escalated member appeals, authorize cash or bank refunds, and oversee facility maintenance tickets."
          actions={refreshButton}
        />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
              <LifeBuoy className="w-8 h-8 text-[var(--primary)]" />
              {t('Reception Support Desk & Cancellations')}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {t('Review class cancellation requests, issue credit vouchers, and escalate cash refunds or coach feedback to Admin.')}
            </p>
          </div>
          {refreshButton}
        </div>
      )}

      {/* Quick Stats Grid — All 4 cards toggle matching filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => (isPendingCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('PENDING', 'ALL'))}
          aria-pressed={isPendingCardActive}
          className={`p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5 cursor-pointer hover:border-amber-500 transition-all text-left ${isPendingCardActive ? 'ring-2 ring-amber-500 bg-amber-500/5' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.pending}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Pending Review')}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => (isSecondCardActive
            ? applyQuickFilter('ALL', 'ALL')
            : (isManager ? applyQuickFilter('ESCALATED', 'ALL') : applyQuickFilter('ALL', 'CLASS_CANCELLATION')))}
          aria-pressed={isSecondCardActive}
          className={`p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5 cursor-pointer hover:border-purple-500 transition-all text-left ${isSecondCardActive ? 'ring-2 ring-purple-500 bg-purple-500/5' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{isManager ? (stats.escalated || 0) : stats.cancellations}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{isManager ? t('Escalated to Manager') : t('Cancellation Requests')}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => (isFacilityCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('ALL', 'FACILITY_ISSUE'))}
          aria-pressed={isFacilityCardActive}
          className={`p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5 cursor-pointer hover:border-rose-500 transition-all text-left ${isFacilityCardActive ? 'ring-2 ring-rose-500 bg-rose-500/5' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.facilities}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Facility Issues')}</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => (isApprovedCardActive ? applyQuickFilter('ALL', 'ALL') : applyQuickFilter('APPROVED', 'ALL'))}
          aria-pressed={isApprovedCardActive}
          className={`p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5 cursor-pointer hover:border-emerald-500 transition-all text-left ${isApprovedCardActive ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.resolved}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Resolved Tickets')}</div>
            {(stats.approved > 0 || stats.rejected > 0) && (
              <div className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5">
                {stats.approved} {t('Approved Tickets')} • {stats.rejected} {t('Rejected')}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Filter, Quick Pills & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input with Clear Button */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(0);
              }}
              placeholder={t('Search member name, phone, title...')}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword('');
                  setCurrentPage(0);
                }}
                aria-label={t('Clear search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdowns + Reset */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Filter className="w-3.5 h-3.5" />
              <span>{t('Status')}:</span>
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(0);
                }}
                aria-label={t('Status')}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              >
                <option value="ALL">{t('All Statuses')}</option>
                <option value="PENDING">{t('Pending')}</option>
                <option value="IN_PROGRESS">{t('In Progress')}</option>
                <option value="APPROVED">{t('Approved Tickets')}</option>
                <option value="ESCALATED">{t('Escalated to Manager')}</option>
                <option value="REJECTED">{t('Rejected')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] ml-1">
              <span>{t('Category')}:</span>
            </div>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(0);
                }}
                aria-label={t('Category')}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              >
                <option value="ALL">{t('All Categories')}</option>
                <option value="CLASS_CANCELLATION">{t('Class Cancellation')}</option>
                <option value="FACILITY_ISSUE">{t('Facility Issue')}</option>
                <option value="GENERAL_INQUIRY">{t('General Inquiry')}</option>
                <option value="COACH_FEEDBACK">{t('Coach Feedback')}</option>
                <option value="COMPLAINT">{t('Complaint')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('Clear Filters')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-[var(--border)]/70">
          {quickPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={pill.onClick}
              aria-pressed={pill.active}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                pill.active
                  ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs'
                  : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--primary)]/50'
              }`}
            >
              <span>{pill.label}</span>
              {typeof pill.count === 'number' && pill.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  pill.active ? 'bg-white/20 text-white' : 'bg-[var(--surface)] text-[var(--text)]'
                }`}>
                  {pill.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <div className="w-8 h-8 border-4 border-[var(--primary-soft)] border-t-[var(--primary)] rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium">{t('Loading support tickets...')}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <LifeBuoy className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
            <h4 className="text-sm font-bold text-[var(--text)]">{t('No support requests match the criteria')}</h4>
            <p className="text-xs text-[var(--text-muted)]">{t('Change your filters or search query to find tickets.')}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-2 px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text)] inline-flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('Clear Filters')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">ID</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Member')}</th>
                  <th className="px-5 py-3.5">{t('Request Details')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Class & Context')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Submitted At')}</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">{t('Status')}</th>
                  <th className="px-5 py-3.5 text-right whitespace-nowrap">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {requests.map((req) => {
                  const isCancellationOrFacility = req.category === 'CLASS_CANCELLATION' || req.category === 'REFUND_REQUEST' || req.category === 'FACILITY_ISSUE' || req.preferredResolution === 'CASH_REFUND';
                  const isHighPriority = (req.priority === 'HIGH' && isCancellationOrFacility) || req.priority === 'URGENT';
                  const memberName = req.userFullName || req.memberName || '—';
                  const memberContact = req.userPhone || req.memberPhone || req.userEmail || req.memberEmail || '';
                  const memberEmail = req.userEmail || req.memberEmail || '';
                  const canProcessTicket = canStaffProcessTicket(req, isManager);
                  const details = parseSupportRequestDetails(req.content, req);
                  const policy = getAttendancePolicySummary(req);
                  const summaryText = getCompactSupportSummary(req, details);
                  const securityTooltip = req.category === 'COACH_FEEDBACK'
                    ? t('Confidential Feedback')
                    : (!isManager && req.category === 'FACILITY_ISSUE' ? t('Management Review Only') : '');
                  const refundAmount = req.calculatedCreditAmount ?? req.proratedCredit;
                  const rowAccentClass = isManager && req.status === 'ESCALATED'
                    ? 'border-l-[3px] border-l-purple-500 bg-purple-500/[0.025]'
                    : canProcessTicket && isHighPriority
                      ? 'border-l-[3px] border-l-rose-500 bg-rose-500/[0.02]'
                      : '';
                  const contextTag = details.fields.area || details.fields.supportType || details.fields.complaintType;

                  return (
                    <tr key={req.requestId} className={`hover:bg-[var(--surface-hover)]/70 transition-colors ${rowAccentClass}`}>
                      {/* Cột 1: ID & Priority */}
                      <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                        <div className="font-mono font-bold text-sm text-[var(--primary)]">
                          #{req.requestId}
                        </div>
                        {isHighPriority && (
                          <div className="mt-1">
                            {getPriorityBadge(req.priority, req.preferredResolution, '', req.category)}
                          </div>
                        )}
                      </td>

                      {/* Cột 2: Hội viên với Avatar viết tắt */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                            {getMemberInitials(memberName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-[var(--text)] truncate max-w-[150px]" title={memberEmail}>
                              {memberName}
                            </div>
                            {memberContact && (
                              <div className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[150px]" title={memberContact}>
                                {memberContact}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Phân loại gọn + 1 dòng tóm tắt */}
                      <td className="px-5 py-3.5 max-w-sm align-middle">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          {getCategoryBadge(req.category, { compact: true })}
                          {getPreferredResolutionBadge(req.preferredResolution, { compact: true })}
                          {securityTooltip && (
                            <span
                              className="inline-flex items-center justify-center p-0.5 rounded text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20"
                              title={securityTooltip}
                              aria-label={securityTooltip}
                            >
                              <ShieldAlert className="w-3 h-3 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-xs text-[var(--text)] line-clamp-1" title={summaryText}>
                          {summaryText || '—'}
                        </div>
                      </td>

                      {/* Cột 4: Lớp học & thông số cốt lõi */}
                      <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                        {req.className ? (() => {
                          const { code, name } = splitCode(req.className);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 max-w-[230px]">
                                {code && (
                                  <span className="shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                    {code}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-[var(--text)] truncate" title={req.className}>
                                  {name || req.className}
                                </span>
                              </div>
                              {policy.isCancellationLike && (policy.total > 0 || refundAmount != null) && (
                                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 flex-wrap">
                                  {policy.total > 0 && (
                                    <>
                                      <span>
                                        <strong className="text-[var(--text)]">{policy.attended}/{policy.total}</strong>
                                        <span className="ml-1 font-mono">({policy.percent}%)</span>
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                        policy.exceedsEightyPercent
                                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                      }`}>
                                        {policy.exceedsEightyPercent ? t('Over 80%') : t('Eligible')}
                                      </span>
                                    </>
                                  )}
                                  {refundAmount != null && (
                                    <span className={`font-bold ${policy.exceedsEightyPercent ? 'text-[var(--text-muted)]' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      · {formatMoney(refundAmount)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })() : req.category === 'FACILITY_ISSUE' ? (
                          <div className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1.5 max-w-[210px]">
                            <Wrench className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="truncate" title={t(details.fields.area) || t('Facility & Equipment')}>
                              {t(details.fields.area) || t('Facility & Equipment')}
                            </span>
                          </div>
                        ) : req.category === 'COACH_FEEDBACK' ? (
                          <div className="text-xs text-[var(--text-muted)] truncate max-w-[210px]" title={t(details.targetInfo) || t('Coach & Training')}>
                            {t(details.targetInfo) || t('Coach & Training')}
                          </div>
                        ) : contextTag ? (
                          <div className="text-xs text-[var(--text-muted)] inline-flex items-center gap-1.5 max-w-[210px]">
                            <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                            <span className="truncate" title={t(contextTag)}>{t(contextTag)}</span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] italic">—</span>
                        )}
                      </td>

                      {/* Cột 5: Ngày gửi format chuẩn */}
                      <td className="px-5 py-3.5 text-xs text-[var(--text-muted)] whitespace-nowrap font-mono align-middle">
                        {formatSupportDate(req.createdAt)}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(req)}
                          title={canProcessTicket ? t('Review & Resolve') : t('View Details')}
                          aria-label={canProcessTicket ? t('Review & Resolve') : t('View Details')}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5 text-xs ${
                            canProcessTicket
                              ? (req.status === 'ESCALATED'
                                ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                                : 'bg-[var(--primary)] text-white hover:opacity-90 shadow-sm')
                              : 'bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {canProcessTicket ? t('Resolve') : t('Details')}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <div>
              {t('Showing page')} <strong className="text-[var(--text)]">{currentPage + 1}</strong> {t('of')} <strong className="text-[var(--text)]">{totalPages}</strong> ({totalElements} {t('tickets')})
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
                aria-label={t('Previous page')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-hover)] disabled:opacity-40 transition-colors"
                aria-label={t('Next page')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <RespondSupportModal
        isOpen={isModalOpen}
        request={activeRequest}
        isManager={isManager}
        onClose={() => {
          setIsModalOpen(false);
          setActiveRequest(null);
        }}
        onSuccess={handleResolutionSuccess}
      />
    </div>
  );
};

export default SupportDeskView;
