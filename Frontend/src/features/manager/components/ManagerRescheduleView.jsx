import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  CalendarSync, CheckCircle, XCircle, AlertTriangle, AlertCircle, Clock,
  Check, X, RefreshCw, UserCheck
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import ManagerPageHeader from './ManagerPageHeader';

import {
  getReasonLabel,
  getStatusMeta,
  formatDateTime,
  formatScheduleSlot,
  isDeadlineExpired,
  isMakeupSession,
  isSubstituteCoach
} from '../../coach/coachRescheduleUtils';

export default function ManagerRescheduleView() {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('PENDING');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Modals state
  const [approveModal, setApproveModal] = useState(null); // request object
  const [rejectModal, setRejectModal] = useState(null); // request object
  const [substituteModal, setSubstituteModal] = useState(null); // request object
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  // Form states inside modals
  const [approvalNote, setApprovalNote] = useState('');
  const [customMinAttendees, setCustomMinAttendees] = useState(1);
  const [deadlineHoursBefore, setDeadlineHoursBefore] = useState(6);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedSubstituteId, setSelectedSubstituteId] = useState('');
  const [substituteNote, setSubstituteNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const fetchRequests = async () => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8080/api/v1/manager/reschedule-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load reschedule requests for manager', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4500);
  };

  // Metrics
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const completed = requests.filter(r => r.status === 'COMPLETED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED').length;
    return { total, pending, approved, completed, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (filterTab === 'ALL') return requests;
    if (filterTab === 'PENDING') return requests.filter(r => r.status === 'PENDING');
    if (filterTab === 'APPROVED') return requests.filter(r => r.status === 'APPROVED');
    if (filterTab === 'REJECTED') return requests.filter(r => r.status === 'REJECTED' || r.status === 'CANCELLED');
    if (filterTab === 'COMPLETED') return requests.filter(r => r.status === 'COMPLETED');
    return requests;
  }, [requests, filterTab]);

  // Open Approve Modal
  const openApprove = (req) => {
    setApproveModal(req);
    setApprovalNote('');
    setCustomMinAttendees(req.totalEnrolledMembers ? Math.max(1, Math.round(req.totalEnrolledMembers * 0.5)) : 1);
    setDeadlineHoursBefore(6);
  };

  // Submit Approval
  const handleApprove = async () => {
    if (!approveModal) return;
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setActionBusy(true);
      await axios.post(
        `http://localhost:8080/api/v1/manager/reschedule-requests/${approveModal.requestId}/approve`,
        {
          customMinAttendees,
          deadlineHoursBefore,
          adminNote: approvalNote.trim() || undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      showToast(t('Request approved successfully! Members have been notified.'));
      setApproveModal(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || t('Approval failed.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  // Open Reject Modal
  const openReject = (req) => {
    setRejectModal(req);
    setRejectionReason('');
  };

  // Submit Rejection
  const handleReject = async () => {
    if (!rejectModal || !rejectionReason.trim()) {
      showToast(t('Please provide a reason for rejection.'), 'error');
      return;
    }
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setActionBusy(true);
      await axios.post(
        `http://localhost:8080/api/v1/manager/reschedule-requests/${rejectModal.requestId}/reject`,
        {
          rejectionReason: rejectionReason.trim(),
          reason: rejectionReason.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      showToast(t('Request rejected. Coach has been notified.'));
      setRejectModal(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || t('Rejection failed.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  // Open Substitute Coach Modal
  const openSubstitute = async (req) => {
    setSubstituteModal(req);
    setSelectedSubstituteId('');
    setSubstituteNote('');
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setLoadingCoaches(true);
      const res = await axios.get(
        `http://localhost:8080/api/v1/manager/reschedule-requests/available-coaches?scheduleId=${req.scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setAvailableCoaches(list);
      if (list.length > 0) {
        setSelectedSubstituteId(String(list[0].coachId || list[0].userId || ''));
      }
    } catch (err) {
      console.error('Failed to load coaches', err);
    } finally {
      setLoadingCoaches(false);
    }
  };

  // Submit Substitute Coach Assignment
  const handleAssignSubstitute = async () => {
    if (!substituteModal || !selectedSubstituteId) {
      showToast(t('Please select a substitute coach.'), 'error');
      return;
    }
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setActionBusy(true);
      await axios.post(
        `http://localhost:8080/api/v1/manager/reschedule-requests/assign-substitute`,
        {
          requestId: substituteModal.requestId,
          scheduleId: substituteModal.scheduleId,
          substituteCoachId: parseInt(selectedSubstituteId, 10),
          managerNote: substituteNote.trim() || undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      showToast(t('Substitute coach assigned successfully!'));
      setSubstituteModal(null);
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || t('Assignment failed.'), 'error');
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.message && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-white font-semibold text-xs shadow-xl flex items-center gap-2 transition-all ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <ManagerPageHeader
        title={t('Reschedule & Make-up Approvals')}
        description={t('Review coach reschedule requests, detect room & coach collisions, and assign substitute instructors.')}
      />

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Pending Review')}</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Approved & Active')}</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{stats.approved}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Completed')}</p>
          <p className="text-2xl font-black text-blue-500 mt-1">{stats.completed}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
          <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t('Rejected / Cancelled')}</p>
          <p className="text-2xl font-black text-[var(--text-muted)] mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-[var(--border)] bg-[var(--surface-hover)] overflow-x-auto">
          {[
            { id: 'PENDING', label: t('Pending Review') },
            { id: 'APPROVED', label: t('Approved') },
            { id: 'COMPLETED', label: t('Completed') },
            { id: 'REJECTED', label: t('Rejected / Cancelled') },
            { id: 'ALL', label: t('All Requests') }
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

        {/* Requests List */}
        {loading ? (
          <div className="py-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary)]" />
            <span className="text-xs">{t('Loading requests...')}</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <CalendarSync className="w-8 h-8 opacity-40" />
            <p className="text-sm font-semibold">{t('No requests match this filter')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredRequests.map((req) => {
              const statusMeta = getStatusMeta(req.status, lang);
              const reasonLabel = getReasonLabel(req.reasonCategory, lang);
              const isExpired = isDeadlineExpired(req.confirmationDeadline);
              const hasRoomConflict = Boolean(req.hasRoomConflict || req.hasRoomCollision);
              const hasCoachConflict = Boolean(req.hasCoachConflict || req.hasCoachCollision);
              const hasCollision = hasRoomConflict || hasCoachConflict;

              return (
                <div key={req.requestId} className="p-5 hover:bg-[var(--surface-hover)] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Request details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[var(--text)]">
                          #{req.requestId} • {req.className}
                        </span>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusMeta.badgeClass}`}>
                          {statusMeta.label}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {isMakeupSession(req.actionType) ? t('Make-up Session') : t('Substitute Coach')}
                        </span>

                        {/* Collision tags */}
                        {isMakeupSession(req.actionType) && (
                          <>
                            {hasCollision ? (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {hasRoomConflict && hasCoachConflict
                                  ? t('Conflict: Room & Coach Busy')
                                  : hasRoomConflict
                                  ? t('Conflict: Room Busy')
                                  : t('Conflict: Coach Busy')}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {t('Available: No Conflicts')}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Instructor & Session info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span>{t('Coach')}: <strong className="text-[var(--text)]">{req.coachName}</strong></span>
                        <span>{t('Original Date')}: <strong>{formatScheduleSlot(req.originalStartTime, req.originalEndTime, lang)}</strong></span>
                        <span>{t('Room')}: <strong>{req.originalRoomName}</strong></span>
                        <span>{t('Enrolled')}: <strong className="text-[var(--primary)]">{req.totalEnrolledMembers} {t('members')}</strong></span>
                      </div>

                      {/* Make-up Proposed Slot */}
                      {isMakeupSession(req.actionType) && (
                        <div className="p-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs flex flex-wrap items-center gap-3">
                          <span className="font-bold text-[var(--primary)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t('Proposed Slot')}:</span>
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
                        <span className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-medium text-[var(--text)]">
                          {reasonLabel}
                        </span>
                        {req.reasonNote && <span>— {req.reasonNote}</span>}
                      </div>

                      {/* Admin Note / Rejection Reason */}
                      {req.adminNote && (
                        <div className="text-xs text-[var(--text-muted)] italic">
                          <span>{t('Admin Note')}: "{req.adminNote}"</span>
                        </div>
                      )}
                      {req.rejectionReason && (
                        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
                          <strong>{t('Rejection Reason')}:</strong> {req.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Right: Confirmation status & Manager Actions */}
                    <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
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
                            <div className="flex justify-between items-center text-[11px] font-semibold">
                              <span className="text-[var(--text-muted)]">{t('Confirmed')}:</span>
                              <span className="text-[var(--primary)] font-bold">
                                {req.acceptedCount ?? req.acceptedMembersCount ?? 0}
                                <span className="text-[var(--text-muted)] font-normal text-[10px]"> / {req.totalEnrolledMembers || 0}</span>
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] flex justify-between items-center">
                              <span>{t('Min Quorum')}:</span>
                              <span className="font-semibold text-[var(--text)]">
                                {req.minAttendees ?? req.minAttendeesRequired ?? 1} {t('members')}
                              </span>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] flex justify-between items-center pt-1 border-t border-[var(--border)]/40">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                                <span>{t('Deadline')}:</span>
                              </span>
                              <span className={isExpired ? 'text-rose-500 font-bold' : 'font-medium text-[var(--text)]'}>
                                {isExpired ? t('Expired') : formatDateTime(req.confirmationDeadline)}
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
                        <div className="flex flex-wrap items-center gap-2">
                          {isMakeupSession(req.actionType) && (
                            <button
                              onClick={() => openApprove(req)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{t('Approve')}</span>
                            </button>
                          )}

                          <button
                            onClick={() => openSubstitute(req)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>{t('Assign Substitute')}</span>
                          </button>

                          <button
                            onClick={() => openReject(req)}
                            className="px-3 py-1.5 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/10 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('Reject')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================== MODAL: APPROVE ===================== */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>{t('Approve Reschedule Request')} #{approveModal.requestId}</span>
              </h3>
              <button onClick={() => setApproveModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              {t('Class')}: <strong className="text-[var(--text)]">{approveModal.className}</strong> • {t('Coach')}: <strong className="text-[var(--text)]">{approveModal.coachName}</strong>
            </p>

            {/* Warning if Room or Coach conflict */}
            {(approveModal.hasRoomConflict || approveModal.hasRoomCollision) && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('Room conflict detected: Another class is already using this room during the proposed make-up slot. Cannot approve without changing slot or rejecting.')}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('Minimum Confirmed Attendees Required (Quorum)')} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={approveModal.totalEnrolledMembers || 50}
                  value={customMinAttendees}
                  onChange={(e) => setCustomMinAttendees(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {t('If fewer than this number agree before deadline, make-up class is auto-cancelled and all members refunded.')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('Confirmation Deadline (Hours before make-up session)')} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={deadlineHoursBefore}
                  onChange={(e) => setDeadlineHoursBefore(parseInt(e.target.value, 10) || 6)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('Admin Note (Optional)')}
                </label>
                <textarea
                  rows={2}
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder={t('Message to coach and trainees...')}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                disabled={actionBusy || Boolean(approveModal.hasRoomConflict || approveModal.hasRoomCollision)}
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {actionBusy ? t('Approving...') : t('Confirm Approval')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: REJECT ===================== */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>{t('Reject Reschedule Request')} #{rejectModal.requestId}</span>
              </h3>
              <button onClick={() => setRejectModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1">
                {t('Reason for Rejection')} *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('Specify why this request cannot be approved...')}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                disabled={actionBusy || !rejectionReason.trim()}
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 disabled:opacity-50"
              >
                {actionBusy ? t('Rejecting...') : t('Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ASSIGN SUBSTITUTE COACH ===================== */}
      {substituteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-500" />
                <span>{t('Assign Substitute Coach')}</span>
              </h3>
              <button onClick={() => setSubstituteModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <p className="font-semibold">
                {t('Original Class Session')}: <strong>{formatScheduleSlot(substituteModal.originalStartTime, substituteModal.originalEndTime, lang)}</strong>
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {t('The session will proceed at its original schedule and room. The selected substitute coach will teach this class in place of')} <strong>{substituteModal.coachName}</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('Available Coaches')} *
                </label>
                {loadingCoaches ? (
                  <p className="text-xs text-[var(--text-muted)]">{t('Checking coach schedules...')}</p>
                ) : availableCoaches.length === 0 ? (
                  <p className="text-xs text-rose-500 font-semibold">{t('No other coaches available for this time slot.')}</p>
                ) : (
                  <select
                    value={selectedSubstituteId}
                    onChange={(e) => setSelectedSubstituteId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]"
                  >
                    {availableCoaches.map((c) => {
                      const id = c.coachId || c.userId;
                      return (
                        <option key={id} value={id}>
                          {c.fullName} ({c.email})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1">
                  {t('Manager Note (Optional)')}
                </label>
                <textarea
                  rows={2}
                  value={substituteNote}
                  onChange={(e) => setSubstituteNote(e.target.value)}
                  placeholder={t('Note to substitute instructor and class...')}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSubstituteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                disabled={actionBusy || !selectedSubstituteId}
                onClick={handleAssignSubstitute}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-50"
              >
                {actionBusy ? t('Assigning...') : t('Assign Coach')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
