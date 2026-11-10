import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, UserCheck, Package,
  Receipt, RefreshCw, Search, ArrowRight, Check,
  Filter, Headphones, ShieldAlert,
  X
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import {
  filterReceptionistNotifications,
  getReceptionistUnreadCount,
  formatNotificationTime,
  getReceptionistNotificationMeta,
  getReceptionistNotificationAction,
  getSavedReceptionistPreferences
} from '../receptionistNotificationUtils';
import { API_ORIGIN } from '../../../config/apiBase.js';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All', icon: Bell },
  { id: 'SUPPORT', label: 'Support & Cancellations', icon: Headphones },
  { id: 'CHECKIN', label: 'Check-in & Attendance', icon: UserCheck },
  { id: 'LOST_FOUND', label: 'Lost & Found', icon: Package },
  { id: 'INVOICE', label: 'Invoices & Finance', icon: Receipt },
  { id: 'SYSTEM', label: 'System Alerts', icon: ShieldAlert },
];

const ReceptionistNotificationsView = ({ onNavigateFeature }) => {
  const { currentLanguage } = useLanguage();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_ORIGIN}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load receptionist notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notificationUpdated', handleUpdate);
    window.addEventListener('receptionistNotificationUpdated', handleUpdate);
    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
      window.removeEventListener('receptionistNotificationUpdated', handleUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id, isRead) => {
    if (isRead) return;
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_ORIGIN}/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n)
      );
      window.dispatchEvent(new Event('notificationUpdated'));
      window.dispatchEvent(new Event('receptionistNotificationUpdated'));
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      setActionLoading(true);
      await axios.put(`${API_ORIGIN}/api/v1/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, read: true }))
      );
      window.dispatchEvent(new Event('notificationUpdated'));
      window.dispatchEvent(new Event('receptionistNotificationUpdated'));
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
      await axios.delete(`${API_ORIGIN}/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notificationUpdated'));
      window.dispatchEvent(new Event('receptionistNotificationUpdated'));
      showToast(t('Notification deleted'));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    const token = localStorage.getItem('token');
    try {
      setActionLoading(true);
      await axios.delete(`${API_ORIGIN}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      window.dispatchEvent(new Event('notificationUpdated'));
      window.dispatchEvent(new Event('receptionistNotificationUpdated'));
      showToast(t('All notifications cleared'));
    } catch (err) {
      console.error('Failed to clear notifications', err);
    } finally {
      setActionLoading(false);
      setIsConfirmClearOpen(false);
    }
  };

  // Click on contextual action button
  const handleActionClick = (e, item, action) => {
    e.stopPropagation();
    const isUnread = !item.isRead && !item.read;
    if (isUnread) {
      handleMarkAsRead(item.id, false);
    }
    if (action?.featureId && typeof onNavigateFeature === 'function') {
      onNavigateFeature(action.featureId, action.params || {});
    }
  };

  const prefs = useMemo(() => getSavedReceptionistPreferences(), []);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let list = filterReceptionistNotifications(notifications, activeFilter, prefs, searchQuery);
    if (onlyUnread) {
      list = list.filter(n => !n.isRead && !n.read);
    }
    return list;
  }, [notifications, activeFilter, prefs, searchQuery, onlyUnread]);

  // Statistics
  const totalCount = notifications.length;
  const unreadTotal = useMemo(() => getReceptionistUnreadCount(notifications, prefs), [notifications, prefs]);
  const supportCount = useMemo(() => filterReceptionistNotifications(notifications, 'SUPPORT', prefs).length, [notifications, prefs]);
  const _checkinCount = useMemo(() => filterReceptionistNotifications(notifications, 'CHECKIN', prefs).length, [notifications, prefs]);
  const lostFoundCount = useMemo(() => filterReceptionistNotifications(notifications, 'LOST_FOUND', prefs).length, [notifications, prefs]);

  const renderCardIcon = (item) => {
    const meta = getReceptionistNotificationMeta(item);
    switch (meta.categoryKey) {
      case 'CHECKIN':
        return (
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        );
      case 'LOST_FOUND':
        return (
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        );
      case 'INVOICE':
        return (
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        );
      case 'SUPPORT':
        return (
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header & Bento Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-[#0A84FF]">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-[#0071E3] dark:text-[#0A84FF]">
              {t('Front Desk Notifications')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('Notification Center')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('Real-time updates on check-in anomalies, cancellation requests, lost items, and front desk operations.')}
          </p>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-900 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={t('Refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0071E3]' : ''}`} />
            <span className="hidden sm:inline">{t('Refresh')}</span>
          </button>

          {unreadTotal > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="px-3.5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm shadow-[#0071E3]/20 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{t('Mark all as read')}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmClearOpen(true)}
              disabled={actionLoading}
              className="p-2.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title={t('Clear all')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('Clear all')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{t('Total')}</span>
            <Bell className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#0071E3] dark:text-[#0A84FF]">{t('Unread')}</span>
            <div className="w-2 h-2 rounded-full bg-[#0071E3] animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-[#0071E3] dark:text-[#0A84FF] mt-2">{unreadTotal}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">{t('Support')}</span>
            <Headphones className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{supportCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">{t('Lost & Found')}</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{lostFoundCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
        {/* Search & Only Unread Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search notifications by member, keyword, item...')}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-transparent focus:border-[#0071E3]/40 focus:bg-white dark:focus:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlyUnread(!onlyUnread)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              onlyUnread
                ? 'border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3] dark:text-[#0A84FF]'
                : 'border-black/[0.08] dark:border-white/[0.1] text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t('Only unread')}</span>
            {unreadTotal > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0071E3] text-white text-[10px] flex items-center justify-center font-bold">
                {unreadTotal}
              </span>
            )}
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0071E3] text-white shadow-xs'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t(tab.label)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0071E3]" />
            <span className="text-xs font-medium">{t('Loading notifications...')}</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 rounded-2xl bg-white dark:bg-slate-900/40 border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center text-slate-400">
              <BellOff className="w-7 h-7 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t('No notifications found')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
              {t('When members request cancellations, check-in without desk verification, or items expire in lost storage, alerts will appear here.')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isUnread = !item.isRead && !item.read;
            const meta = getReceptionistNotificationMeta(item);
            const action = getReceptionistNotificationAction(item);

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => handleMarkAsRead(item.id, !isUnread)}
                className={`p-4 rounded-2xl transition-all border cursor-pointer relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'bg-white dark:bg-slate-900 border-[#0071E3]/30 shadow-md shadow-[#0071E3]/5'
                    : 'bg-white/60 dark:bg-slate-900/40 border-black/[0.05] dark:border-white/[0.06] hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                {/* Unread Accent Bar */}
                {isUnread && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#0071E3] rounded-r-full" />
                )}

                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {renderCardIcon(item)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeBg} ${meta.badgeColor}`}>
                        {t(meta.categoryLabel)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatNotificationTime(item.createdAt, currentLanguage)}
                      </span>
                      {isUnread && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#0071E3] text-white text-[9px] font-bold">
                          {t('New')}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm tracking-tight mb-1 ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {action && (
                    <button
                      type="button"
                      onClick={(e) => handleActionClick(e, item, action)}
                      className="px-3.5 py-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer group/btn"
                    >
                      <span>{t(action.label)}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title={t('Delete notification')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Confirm Clear All Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleClearAll}
        title={t('Clear All Notifications?')}
        message={t('This will permanently delete all notifications in your Front Desk inbox. This action cannot be undone.')}
        confirmText={t('Clear All')}
        cancelText={t('Cancel')}
        isDestructive={true}
      />
    </div>
  );
};

export default ReceptionistNotificationsView;
