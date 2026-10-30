import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, Calendar, ShieldCheck,
  Receipt, RefreshCw, Search, ArrowRight, Check, ExternalLink,
  SlidersHorizontal, Sparkles
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import {
  filterNotifications,
  getUnreadCount,
  formatNotificationTime,
  getNotificationMeta,
  getSavedCoachPreferences
} from '../coachNotificationUtils';

const CoachNotifications = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notificationUpdated', handleUpdate);
    return () => window.removeEventListener('notificationUpdated', handleUpdate);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Mark single as read
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
      console.error('Failed to mark notification read', err);
    }
  };

  // Mark all as read
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
      showToast(t('All notifications marked as read'));
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
      showToast(t('Notification deleted'));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm(t('Are you sure you want to clear all notifications?'))) return;
    const token = localStorage.getItem('token');
    try {
      setActionLoading(true);
      await axios.delete('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      window.dispatchEvent(new Event('notificationUpdated'));
      showToast(t('All notifications cleared'));
    } catch (err) {
      console.error('Failed to clear notifications', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search
  const filteredList = useMemo(() => {
    const prefs = getSavedCoachPreferences();
    let list = filterNotifications(notifications, activeFilter, prefs);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q))
      );
    }

    return list;
  }, [notifications, activeFilter, searchQuery]);

  const unreadTotal = getUnreadCount(notifications, getSavedCoachPreferences());

  const renderIcon = (type) => {
    const meta = getNotificationMeta(type);
    if (meta.iconType === 'calendar') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <Calendar className="w-5 h-5" />
        </div>
      );
    }
    if (meta.iconType === 'receipt') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <Receipt className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center justify-center shrink-0 shadow-xs">
        <ShieldCheck className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto pb-16 px-3 sm:px-6">

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-white dark:bg-white/90 dark:text-slate-900 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold"
          >
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          APPLE HEADER SECTION
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#0A84FF] text-[11px] font-semibold border border-[#0071E3]/20">
              <Bell className="w-3.5 h-3.5" />
              <span>{t('Notification Center')}</span>
            </span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadTotal} {t('unread')}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('Notifications')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Stay updated with trainee enrollments, cancellations, and gym facility notices.')}
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-semibold text-[#0071E3] dark:text-[#0A84FF] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('Mark all read')}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={actionLoading}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.1] hover:bg-red-500/10 text-xs font-semibold text-slate-500 hover:text-red-500 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title={t('Clear all')}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('Clear all')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.03] text-slate-600 dark:text-slate-300 shadow-xs transition-all cursor-pointer"
            title={t('Refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0071E3]' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          FILTER & SEARCH TOOLBAR
          ========================================================================= */}
      <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Cupertino Segmented Tabs */}
        <div className="w-full sm:w-auto grid grid-cols-3 gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('All')} ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('BOOKING')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'BOOKING'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('Classes')}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('SYSTEM')}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'SYSTEM'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('System')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search notifications...')}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] focus:outline-hidden focus:ring-2 focus:ring-[#0071E3]/20 focus:border-[#0071E3] transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* =========================================================================
          NOTIFICATIONS LIST
          ========================================================================= */}
      <div className="rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden divide-y divide-black/[0.04] dark:divide-white/[0.06]">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0071E3]" />
            <span className="text-xs font-medium">{t('Loading notifications...')}</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center text-slate-400 shadow-inner">
              <BellOff className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {searchQuery ? t('No matching notifications') : t('No notifications yet')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              {searchQuery
                ? t('Try adjusting your search terms or filter.')
                : t('When trainees book or modify your classes, alerts will appear here.')}
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isUnread = !item.isRead && !item.read;
            const isBooking = item.type === 'BOOKING' || item.type === 'CLASS';

            return (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id, !isUnread)}
                className={`p-4 sm:p-5 transition-colors cursor-pointer flex items-start gap-4 relative group ${
                  isUnread
                    ? 'bg-[#0071E3]/[0.03] dark:bg-[#0071E3]/[0.08] hover:bg-[#0071E3]/[0.06]'
                    : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                {/* Unread indicator bar */}
                {isUnread && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#0071E3] dark:bg-[#0A84FF]" />
                )}

                {renderIcon(item.type)}

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm tracking-tight ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]" />
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-slate-400">
                      {formatNotificationTime(item.createdAt, currentLanguage)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                    {item.message}
                  </p>

                  {/* Contextual Action Link */}
                  <div className="mt-3 flex items-center gap-3">
                    {isBooking && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id, !isUnread);
                          navigate('/coach/schedule');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0071E3] dark:text-[#0A84FF] hover:underline"
                      >
                        <span>{t('View Teaching Schedule')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isBooking && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id, !isUnread);
                          navigate('/coach/settings');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                      >
                        <span>{t('View Settings')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete button on hover */}
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, item.id)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                  title={t('Delete notification')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CoachNotifications;
