import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy, Search, Filter, RefreshCw, CheckCircle2,
  Clock, AlertTriangle, ShieldCheck, X, ChevronLeft,
  ChevronRight, CreditCard, MessageSquare, ArrowUpRight,
  Eye, Phone, Mail, User
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import receptionistService from '../services/receptionistService';
import RespondSupportModal from './RespondSupportModal';

const SupportDeskView = () => {
  useLanguage();

  const [stats, setStats] = useState({
    pending: 0,
    cancellations: 0,
    facilities: 0,
    resolved: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
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
        setStats({
          pending: res.pending || 0,
          cancellations: res.classCancellations || 0,
          facilities: res.facilityIssues || 0,
          resolved: res.approved || 0
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
    fetchStats();
    fetchRequests();
  }, [fetchStats, fetchRequests]);

  const handleOpenModal = (req) => {
    setActiveRequest(req);
    setIsModalOpen(true);
  };

  const handleResolutionSuccess = () => {
    showToast(t('Support ticket resolved and member notified successfully.'), 'success');
    fetchStats();
    fetchRequests();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t('Pending')}
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 inline-flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> {t('In Progress')}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {t('Resolved')}
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> {t('Escalated')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 inline-flex items-center gap-1">
            <X className="w-3 h-3" /> {t('Rejected')}
          </span>
        );
      default:
        return <span className="px-2 py-0.5 rounded text-xs bg-zinc-500/10 text-zinc-600">{status}</span>;
    }
  };

  const getCategoryBadge = (category) => {
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
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300">{t('General')}</span>;
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-[var(--primary)]" />
            {t('Reception Support Desk & Cancellations')}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t('Review mid-course class cancellation requests, issue credit vouchers, and address member facility inquiries.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchStats();
            fetchRequests();
          }}
          className="px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('Refresh Queue')}</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.pending}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Pending Review')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.cancellations}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Cancellation Requests')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.facilities}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Facilities & Feedback')}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[var(--text)]">{stats.resolved}</div>
            <div className="text-xs font-medium text-[var(--text-muted)]">{t('Resolved Tickets')}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              setCurrentPage(0);
            }}
            placeholder={t('Search member name, phone, title...')}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Filter className="w-3.5 h-3.5" />
            <span>{t('Status')}:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="ALL">{t('All Statuses')}</option>
            <option value="PENDING">{t('Pending')}</option>
            <option value="IN_PROGRESS">{t('In Progress')}</option>
            <option value="APPROVED">{t('Resolved')}</option>
            <option value="ESCALATED">{t('Escalated to Manager')}</option>
            <option value="REJECTED">{t('Rejected')}</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] ml-2">
            <span>{t('Category')}:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="ALL">{t('All Categories')}</option>
            <option value="CLASS_CANCELLATION">{t('Class Cancellation')}</option>
            <option value="FACILITY_ISSUE">{t('Facility Issue')}</option>
            <option value="GENERAL_INQUIRY">{t('General Inquiry')}</option>
            <option value="COACH_FEEDBACK">{t('Coach Feedback')}</option>
            <option value="COMPLAINT">{t('Complaint')}</option>
          </select>
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] border-b border-[var(--border)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">ID & {t('Priority')}</th>
                  <th className="px-5 py-3.5">{t('Member Info')}</th>
                  <th className="px-5 py-3.5">{t('Category & Title')}</th>
                  <th className="px-5 py-3.5">{t('Class & Proration')}</th>
                  <th className="px-5 py-3.5">{t('Submitted')}</th>
                  <th className="px-5 py-3.5">{t('Status')}</th>
                  <th className="px-5 py-3.5 text-right">{t('Action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                {requests.map((req) => (
                  <tr key={req.requestId} className="hover:bg-[var(--surface-hover)]/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-[var(--primary)]">
                      #{req.requestId}
                      {req.priority === 'URGENT' && (
                        <span className="block mt-0.5 text-[10px] text-red-500 font-bold uppercase">{t('Urgent')}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold">{req.userFullName}</div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" /> {req.userEmail}
                      </div>
                      {req.userPhone && (
                        <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {req.userPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="mb-1">{getCategoryBadge(req.category)}</div>
                      <div className="font-semibold line-clamp-1">{req.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">{req.content}</div>
                    </td>
                    <td className="px-5 py-4">
                      {req.className ? (
                        <div>
                          <div className="font-semibold text-[var(--text)]">{req.className}</div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {req.attendedSessions || 0}/{req.totalSessions || 0} {t('taken')}
                          </div>
                          {req.proratedCredit != null && (
                            <div className="text-[11px] font-bold text-[var(--primary)] mt-0.5">
                              {t('Est. Credit')}: {formatMoney(req.proratedCredit)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[var(--text-muted)] whitespace-nowrap">
                      {req.createdAt}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(req)}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{req.status === 'PENDING' ? t('Review & Resolve') : t('View Details')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
