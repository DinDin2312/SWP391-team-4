import React, { useState, useEffect } from 'react';
import {
  HelpCircle, CreditCard, Ticket, Clock, CheckCircle2,
  AlertTriangle, Plus, Send, X, Copy, Check, MessageSquare,
  ShieldCheck, AlertCircle, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import memberService from '../services/memberService';

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
    category: 'GENERAL_INQUIRY',
    classId: '',
    title: '',
    content: '',
    priority: 'NORMAL'
  });

  // UI helpers
  const [copiedCode, setCopiedCode] = useState(null);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

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

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.content.trim()) {
      showToast(t('Please fill in title and description.'), 'error');
      return;
    }
    try {
      setCreating(true);
      const payload = {
        category: ticketForm.category,
        classId: ticketForm.classId ? parseInt(ticketForm.classId, 10) : null,
        title: ticketForm.title.trim(),
        content: ticketForm.content.trim(),
        priority: ticketForm.priority
      };
      await memberService.createSupportRequest(payload);
      showToast(t('Support ticket submitted successfully to Reception desk.'), 'success');
      setIsModalOpen(false);
      setTicketForm({
        category: 'GENERAL_INQUIRY',
        classId: '',
        title: '',
        content: '',
        priority: 'NORMAL'
      });
      setActiveTab('tickets');
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

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'CLASS_CANCELLATION': return t('Class Cancellation & Proration');
      case 'FACILITY_ISSUE': return t('Facility & Equipment Report');
      case 'COACH_FEEDBACK': return t('Coach & Training Feedback');
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
          onClick={() => setIsModalOpen(true)}
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
                          {c.daysUntilExpiry} {t('days left')}
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-modal-title"
            className="relative w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="ticket-modal-title" className="text-lg font-bold text-[var(--text)]">
                    {t('Submit New Support Ticket')}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t('Send inquiries or facility reports directly to Reception.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors"
                aria-label={t('Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="py-4 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label htmlFor="ticket-category-select" className="block text-xs font-bold text-[var(--text)]">
                  {t('Category')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="ticket-category-select"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="GENERAL_INQUIRY">{t('General Inquiry / Assistance')}</option>
                  <option value="CLASS_CANCELLATION">{t('Class Cancellation & Proration')}</option>
                  <option value="FACILITY_ISSUE">{t('Facility & Equipment Broken Report')}</option>
                  <option value="COACH_FEEDBACK">{t('Coach & Training Feedback')}</option>
                  <option value="COMPLAINT">{t('Complaint / Feedback')}</option>
                </select>
              </div>

              {classes.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="ticket-class-select" className="block text-xs font-bold text-[var(--text)]">
                    {t('Related Class (Optional)')}
                  </label>
                  <select
                    id="ticket-class-select"
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
                <label htmlFor="ticket-title-input" className="block text-xs font-bold text-[var(--text)]">
                  {t('Title / Subject')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="ticket-title-input"
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder={t('Brief summary of your issue or request')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ticket-content-textarea" className="block text-xs font-bold text-[var(--text)]">
                  {t('Detailed Content')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="ticket-content-textarea"
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
                  onClick={() => setIsModalOpen(false)}
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
                      <span>{t('Submit Ticket')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSupportView;
