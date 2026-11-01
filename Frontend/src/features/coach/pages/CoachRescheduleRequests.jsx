import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarSync, Plus, RefreshCw, AlertCircle, CheckCircle2,
  Clock, XCircle, Calendar, Users, MapPin, AlertTriangle, ShieldAlert, UserCheck
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import CreateRescheduleModal from '../components/CreateRescheduleModal';
import CoachToast from '../components/CoachToast';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import {
  getReasonLabel,
  getStatusMeta,
  formatDateTime,
  formatScheduleSlot,
  isDeadlineExpired,
  isMakeupSession,
  isSubstituteCoach
} from '../coachRescheduleUtils';

const CoachRescheduleRequests = () => {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [toastState, setToastState] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const fetchRequests = async () => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8080/api/v1/coach/reschedule-requests/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load reschedule requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (msg, type = 'success', title = '') => {
    setToastState({
      isOpen: true,
      type,
      title: title || (type === 'error' ? t('Notification') : t('Success')),
      message: msg,
    });
  };

  const handleCancelRequest = async (requestId) => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setCancellingId(requestId);
      await axios.put(`http://localhost:8080/api/v1/coach/reschedule-requests/${requestId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(t('Request cancelled successfully.'));
      setRequestToCancel(null);
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      showToast(msg || t('Failed to cancel request.'), 'error');
    } finally {
      setCancellingId(null);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length;
    return { total, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filterTab === 'ALL') return requests;
    if (filterTab === 'PENDING') return requests.filter(r => r.status === 'PENDING');
    if (filterTab === 'APPROVED') return requests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED');
    if (filterTab === 'REJECTED') return requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED');
    return requests;
  }, [requests, filterTab]);

  return (
    <div className="space-y-6">
      {/* Apple Dynamic Island Toast Notification */}
      <CoachToast
        isOpen={toastState.isOpen}
        onClose={() => setToastState(prev => ({ ...prev, isOpen: false }))}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
      />

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <CalendarSync className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--text)] tracking-tight">
                {t('Reschedule & Make-up Sessions')}
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('Request class rescheduling when no substitute coach is available or urgent leave arises')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold hover:brightness-105 active:scale-95 transition-all shadow-[var(--shadow)] flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('Create Reschedule Request')}</span>
        </button>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Total Requests')}</p>
          <p className="text-2xl font-black text-[var(--text)] mt-1">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-amber-500/20 bg-amber-500/5 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('Pending Review')}</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('Approved & Active')}</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Rejected / Cancelled')}</p>
          <p className="text-2xl font-black text-[var(--text-muted)] mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter Tabs & Content */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-[var(--border)] bg-[var(--surface-hover)] overflow-x-auto">
          {[
            { id: 'ALL', label: t('All Requests') },
            { id: 'PENDING', label: t('Pending Review') },
            { id: 'APPROVED', label: t('Approved') },
            { id: 'REJECTED', label: t('Rejected / Cancelled') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                filterTab === tab.id
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs border border-[var(--border)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchRequests}
            title={t('Refresh')}
            className="ml-auto text-[var(--text-muted)] hover:text-[var(--text)] p-2 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* List / Table */}
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-xs">{t('Loading requests...')}</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <CalendarSync className="w-8 h-8 opacity-40" />
            <p className="text-sm font-semibold">{t('No reschedule requests found')}</p>
            <p className="text-xs max-w-sm">{t('When you submit a reschedule or make-up class request, it will appear here with live tracking.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredRequests.map((req) => {
              const statusMeta = getStatusMeta(req.status, lang);
              const reasonLabel = getReasonLabel(req.reasonCategory, lang);
              const isExpired = isDeadlineExpired(req.confirmationDeadline);

              return (
                <div key={req.requestId} className="p-5 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Class & Details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text)]">
                          #{req.requestId} • {req.className}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {isMakeupSession(req.actionType) ? t('Make-up Session') : t('Substitute Coach')}
                        </span>
                      </div>

                      {/* Original Schedule Info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>{t('Original')}: <strong>{formatScheduleSlot(req.originalStartTime, req.originalEndTime, lang)}</strong></span>
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('Room')}: <strong>{req.originalRoomName}</strong></span>
                        </span>

                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{t('Trainees')}: <strong>{req.totalEnrolledMembers}</strong></span>
                        </span>
                      </div>

                      {/* Proposed Slot (if MAKE_UP_SESSION) */}
                      {isMakeupSession(req.actionType) && (
                        <div className="p-2.5 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-xs text-[var(--text)] flex flex-wrap items-center gap-3">
                          <span className="font-bold text-[var(--primary)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('Proposed Make-up')}:</span>
                          </span>
                          <span><strong>{formatScheduleSlot(req.proposedStartTime, req.proposedEndTime, lang)}</strong></span>
                          {req.proposedRoomName && (
                            <span>• {t('Room')}: <strong>{req.proposedRoomName}</strong></span>
                          )}
                        </div>
                      )}

                      {/* Reason */}
                      <div className="text-xs text-[var(--text-muted)] flex items-baseline gap-2">
                        <span className="font-semibold text-[var(--text)]">{t('Reason')}:</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] border border-[var(--border)] font-medium text-[var(--text)]">
                          {reasonLabel}
                        </span>
                        {req.reasonNote && <span>— {req.reasonNote}</span>}
                      </div>

                      {/* Manager Note or Rejection Reason */}
                      {req.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong>{t('Manager Rejection Reason')}:</strong> {req.rejectionReason}
                          </div>
                        </div>
                      )}

                      {req.adminNote && (
                        <div className="text-xs text-[var(--text-muted)] italic">
                          <span>{t('Admin Note')}: "{req.adminNote}"</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Confirmation Progress & Actions */}
                    <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                      {req.status === 'APPROVED' && (
                        isSubstituteCoach(req.actionType) ? (
                          <div className="w-full lg:w-48 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{t('Substitute Assigned')}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-[var(--text)]">
                              {req.substituteCoachName || t('Assigned Coach')}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {t('Class taught at regular slot')}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full lg:w-56 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold">
                              <span className="text-[var(--text-muted)]">{t('Confirmations')}:</span>
                              <span className="text-[var(--primary)] font-bold">
                                {req.acceptedCount ?? req.acceptedMembersCount ?? 0}
                                <span className="text-[var(--text-muted)] font-normal text-[10px]"> / {req.totalEnrolledMembers || 0}</span>
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 rounded-full bg-[var(--surface-hover)] overflow-hidden">
                              <div
                                className="h-full bg-[var(--primary)] transition-all duration-300"
                                style={{
                                  width: `${req.totalEnrolledMembers > 0 ? (((req.acceptedCount ?? req.acceptedMembersCount ?? 0)) / req.totalEnrolledMembers) * 100 : 0}%`
                                }}
                              />
                            </div>

                            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                              <span>{t('Min Quorum')}:</span>
                              <span className="font-semibold text-[var(--text)]">
                                {req.minAttendees ?? req.minAttendeesRequired ?? 1} {t('members')}
                              </span>
                            </div>

                            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border)]/40">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                <span>{t('Deadline')}:</span>
                              </span>
                              <span className={isExpired ? 'text-rose-500 font-bold' : 'font-medium text-[var(--text)]'}>
                                {isExpired ? t('Deadline expired') : formatDateTime(req.confirmationDeadline)}
                              </span>
                            </div>

                            {Number(req.declinedCount) > 0 && (
                              <div className="text-[10px] text-amber-500 flex justify-between font-medium pt-1 border-t border-[var(--border)]/40">
                                <span>{t('Declined')}:</span>
                                <span className="font-bold">{req.declinedCount}</span>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => setRequestToCancel(req)}
                          disabled={cancellingId === req.requestId}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          {cancellingId === req.requestId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{t('Cancel Request')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateRescheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          showToast(t('Reschedule request created successfully!'));
          fetchRequests();
        }}
      />

      {/* Modern Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={Boolean(requestToCancel)}
        onClose={() => setRequestToCancel(null)}
        onConfirm={() => {
          if (requestToCancel) {
            handleCancelRequest(requestToCancel.requestId);
          }
        }}
        title={t('Cancel Reschedule Request')}
        message={t('Are you sure you want to cancel this reschedule request?')}
        confirmText={t('Cancel Request')}
        cancelText={t('Keep Request')}
        isDestructive={true}
      />
    </div>
  );
};

export default CoachRescheduleRequests;
