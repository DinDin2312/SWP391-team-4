import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, Calendar, ShieldCheck,
  Receipt, X, RefreshCw, ExternalLink, Dumbbell
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import {
  filterNotifications,
  getUnreadCount,
  formatNotificationTime,
  getNotificationMeta,
  getSavedCoachPreferences
} from '../coachNotificationUtils';

const CoachNotificationDropdown = ({ isOpen, onClose, onUnreadChange }) => {
  const { currentLanguage } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const dropdownRef = useRef(null);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);

      const prefs = getSavedCoachPreferences();
      const unread = getUnreadCount(data, prefs);
      if (typeof onUnreadChange === 'function') {
        onUnreadChange(unread);
      }
    } catch (err) {
      console.error('Failed to fetch coach notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Mark single notification as read
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:8080/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n)
      );
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      setActionLoading(true);
      await axios.put('http://localhost:8080/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, read: true }))
      );
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single notification
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:8080/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    if (!window.confirm(t('Are you sure you want to clear all notifications?'))) return;
    const token = localStorage.getItem('token');
    try {
      setActionLoading(true);
      await axios.delete('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error('Failed to clear notifications', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const prefs = getSavedCoachPreferences();
  const filteredList = filterNotifications(notifications, filter, prefs);
  const unreadTotal = getUnreadCount(notifications, prefs);

  const renderIcon = (type) => {
    const meta = getNotificationMeta(type);
    if (meta.iconType === 'calendar') {
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
      );
    }
    if (meta.iconType === 'receipt') {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      );
    }
    if (meta.iconType === 'workout') {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4 h-4" />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="absolute right-0 top-12 w-[380px] sm:w-[420px] max-w-[calc(100vw-24px)] rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-2xl z-50 overflow-hidden flex flex-col text-slate-900 dark:text-white"
        style={{ maxHeight: 'calc(100vh - 90px)' }}
      >
        {/* Apple Style Header */}
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight">{t('Notifications')}</h3>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-bold">
                {unreadTotal}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
                className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-[#0071E3] dark:text-[#0A84FF] font-medium transition-colors cursor-pointer flex items-center gap-1"
                title={t('Mark all as read')}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">{t('Mark all read')}</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={actionLoading}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title={t('Clear all')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cupertino Segmented Filter Control */}
        <div className="p-2.5 bg-slate-100/60 dark:bg-slate-950/40 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('All')}
            </button>
            <button
              type="button"
              onClick={() => setFilter('BOOKING')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'BOOKING'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('Classes')}
            </button>
            <button
              type="button"
              onClick={() => setFilter('SYSTEM')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'SYSTEM'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('System')}
            </button>
          </div>
        </div>

        {/* Notification Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.06] max-h-[380px]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0071E3]" />
              <span className="text-xs">{t('Loading notifications...')}</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center gap-2.5 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center text-slate-400">
                <BellOff className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('No notifications yet')}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[240px]">
                {t('When trainees book or modify your classes, alerts will appear here.')}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isUnread = !item.isRead && !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkAsRead(item.id, !isUnread)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 relative group ${
                    isUnread
                      ? 'bg-[#0071E3]/[0.03] dark:bg-[#0071E3]/[0.08] hover:bg-[#0071E3]/[0.06]'
                      : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Unread blue dot indicator */}
                  {isUnread && (
                    <span className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]" />
                  )}

                  {renderIcon(item.type)}

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatNotificationTime(item.createdAt, currentLanguage)}</span>
                    </div>
                  </div>

                  {/* Delete action button on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="absolute top-3 right-3 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                    title={t('Delete notification')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <span>{notifications.length} {t('total')}</span>
          <span className="font-medium text-[#0071E3] dark:text-[#0A84FF] text-[10px]">
            NEXUS Notification Center
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoachNotificationDropdown;
