import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import {
  Bell, Check, Clock, CheckCheck, RefreshCw,
  ExternalLink, AlertTriangle, Gift
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { getReasonLabel, formatDateTime, formatScheduleSlot } from '../../coach/coachRescheduleUtils';
import { getSavedMemberNotificationPreferences, getMemberUnreadCount } from '../memberUtils';

export default function MemberNotificationDropdown({ isOpen, onClose, onUnreadChange }) {
  const currentLang = useLanguage();
  const lang = (currentLang === 'vi' || globalThis.localStorage?.getItem('nexusLanguage') === 'vi') ? 'vi' : 'en';
  const navigate = useNavigate();

  const [reschedules, setReschedules] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const dropdownRef = useRef(null);

  const fetchData = async () => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const [reschedRes, notifRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/member/reschedule-responses/my', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('http://localhost:8080/api/v1/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      const reschedList = Array.isArray(reschedRes.data) ? reschedRes.data : [];
      const notifList = Array.isArray(notifRes.data) ? notifRes.data : [];

      setReschedules(reschedList);
      setNotifications(notifList);

      const memberNotifPrefs = getSavedMemberNotificationPreferences();
      const pendingReschedulesCount = reschedList.filter(r => r.responseStatus === 'PENDING' && !r.isExpired).length;
      const unreadNotifsCount = getMemberUnreadCount(notifList, memberNotifPrefs);
      const totalUnread = pendingReschedulesCount + unreadNotifsCount;

      if (typeof onUnreadChange === 'function') {
        onUnreadChange(totalUnread);
      }
    } catch (err) {
      console.error('Failed to load member notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Member responds: ACCEPT or DECLINE
  const handleRespond = async (requestId, action) => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      setActionBusyId(requestId);
      await axios.post(
        `http://localhost:8080/api/v1/member/reschedule-responses/${requestId}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh to update state
      fetchData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || t('Action failed.'));
      setTimeout(() => setErrorMessage(''), 4500);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const token = globalThis.localStorage?.getItem('token');
    if (!token) return;

    try {
      await axios.put('http://localhost:8080/api/v1/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const pendingReschedules = reschedules.filter(r => r.responseStatus === 'PENDING' && !r.isExpired);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl z-50 overflow-hidden flex flex-col text-[var(--text)]"
      style={{ maxHeight: '80vh' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-hover)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--primary)]" />
          <h4 className="text-xs font-bold uppercase tracking-wider">{t('Notifications & Alerts')}</h4>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t('Mark all read')}</span>
            </button>
          )}
          <button
            onClick={fetchData}
            title={t('Refresh')}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="overflow-y-auto divide-y divide-[var(--border)] flex-1">
        {/* RESCHEDULE ACTION CARDS (Chỉ hiện khi có ca chờ phản hồi) */}
        {pendingReschedules.length > 0 && (
          <div className="p-3 bg-amber-500/5 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{t('Make-up Session Requests')}</span>
            </p>

            {pendingReschedules.map((req) => {
              const isPending = true;
              const isBusy = actionBusyId === req.requestId;

              return (
                <div
                  key={req.requestId}
                  className="p-3 rounded-xl bg-[var(--surface)] border border-amber-500/30 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-[var(--text)] leading-tight">{req.className}</strong>
                    {req.responseStatus === 'ACCEPTED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                        {t('Confirmed')}
                      </span>
                    ) : (req.responseStatus === 'DECLINED' || req.responseStatus === 'DECLINED_REFUNDED') ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
                        {t('Refunded')}
                      </span>
                    ) : req.isExpired ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-500">
                        {t('Expired')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 animate-pulse">
                        {t('Action Required')}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)]">
                    {t('Coach')}: <strong>{req.coachName}</strong> • {t('Reason')}: {getReasonLabel(req.reasonCategory, lang)}
                  </p>

                  {/* Slot shift details */}
                  <div className="p-2 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] space-y-0.5">
                    <p className="text-[var(--text-muted)] line-through">
                      {t('Original')}: {formatScheduleSlot(req.originalStartTime, req.originalEndTime, lang)}
                    </p>
                    <p className="text-[var(--primary)] font-bold">
                      {t('New Make-up')}: {formatScheduleSlot(req.proposedStartTime, req.proposedEndTime, lang)}
                    </p>
                    {req.proposedRoomName && (
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {t('Room')}: {req.proposedRoomName}
                      </p>
                    )}
                  </div>

                  {/* Actions if PENDING */}
                  {isPending && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req.requestId, 'ACCEPT')}
                        disabled={isBusy}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{t('Attend Make-up')}</span>
                      </button>

                      <button
                        onClick={() => handleRespond(req.requestId, 'DECLINE')}
                        disabled={isBusy}
                        className="flex-1 py-1.5 px-2 rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title={t('Busy? Automatic 100% Credit Refund')}
                      >
                        <Gift className="w-3 h-3" />
                        <span>{t('Busy - 100% Credit')}</span>
                      </button>
                    </div>
                  )}

                  {/* Voucher code display if refunded */}
                  {(req.creditVoucherCode || req.creditCode) && (
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 font-semibold flex items-center justify-between">
                      <span>{t('Credit Voucher')}: <strong>{req.creditVoucherCode || req.creditCode}</strong></span>
                      <span>{req.creditAmount ? `+${Number(req.creditAmount).toLocaleString('vi-VN')}đ (1 buổi)` : '+100% 1 buổi'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* GENERAL NOTIFICATIONS */}
        {notifications.length === 0 && reschedules.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-xs">
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p>{t('No new notifications')}</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <div
              key={n.notificationId}
              className={`p-3 text-xs hover:bg-[var(--surface-hover)] transition-colors flex items-start gap-2.5 ${
                !n.isRead ? 'bg-[var(--primary-soft)]/20' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" style={{ opacity: n.isRead ? 0 : 1 }} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--text)] leading-tight">{n.title}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.content}</p>
                <span className="text-[10px] text-[var(--text-muted)] opacity-70 mt-1 block">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-[var(--border)] bg-[var(--surface-hover)] text-center">
        <button
          onClick={() => {
            onClose();
            navigate('/member/notifications');
          }}
          className="text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>{t('View All Notifications')}</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
