import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Trash2, Calendar, ShieldCheck,
  Receipt, RefreshCw, Search, ArrowRight, Check,
  SlidersHorizontal, Sparkles, Filter, UserCheck, Dumbbell, Megaphone
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import {
  filterNotifications,
  getUnreadCount,
  formatNotificationTime,
  getNotificationMeta,
  getNotificationAction,
  getSavedCoachPreferences
} from '../coachNotificationUtils';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All', icon: Bell },
  { id: 'BOOKING', label: 'Classes & Schedule', icon: Calendar },
  { id: 'TRAINEES', label: 'Trainees & Progress', icon: UserCheck },
  { id: 'SYSTEM', label: 'System & Security', icon: ShieldCheck }
];

const CoachNotifications = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();

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
      console.error('Failed to mark notification read', err);
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
    if (action?.path) {
      navigate(action.path);
    }
  };

  // Category counts and statistics
  const prefs = useMemo(() => getSavedCoachPreferences(), []);
  const allowedNotifications = useMemo(() => {
    return filterNotifications(notifications, 'ALL', prefs);
  }, [notifications, prefs]);

  const tabCounts = useMemo(() => {
    const counts = {};
    CATEGORY_TABS.forEach(tab => {
      counts[tab.id] = filterNotifications(notifications, tab.id, prefs).length;
    });
    return counts;
  }, [notifications, prefs]);

  const tabUnreadCounts = useMemo(() => {
    const unread = {};
    CATEGORY_TABS.forEach(tab => {
      const list = filterNotifications(notifications, tab.id, prefs);
      unread[tab.id] = list.filter(n => !n.isRead && !n.read).length;
    });
    return unread;
  }, [notifications, prefs]);

  // Filtered & Searched Notifications List
  const filteredList = useMemo(() => {
    let list = filterNotifications(notifications, activeFilter, prefs);

    if (onlyUnread) {
      list = list.filter(n => !n.isRead && !n.read);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q))
      );
    }

    return list;
  }, [notifications, activeFilter, onlyUnread, searchQuery, prefs]);

  const unreadTotal = getUnreadCount(notifications, prefs);

  const renderIcon = (action, meta) => {
    if (action?.iconType === 'trainee') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <UserCheck className="w-5 h-5 stroke-[1.75]" />
        </div>
      );
    }
    if (action?.iconType === 'workout') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <Dumbbell className="w-5 h-5 stroke-[1.75]" />
        </div>
      );
    }
    if (action?.iconType === 'schedule' || meta?.iconType === 'calendar') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <Calendar className="w-5 h-5 stroke-[1.75]" />
        </div>
      );
    }
    if (meta?.iconType === 'receipt') {
      return (
        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 shadow-xs">
          <Receipt className="w-5 h-5 stroke-[1.75]" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 flex items-center justify-center shrink-0 shadow-xs">
        <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
      </div>
    );
  };

  const getBadgeStyle = (action, meta) => {
    if (action?.iconType === 'trainee') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (action?.iconType === 'workout') {
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
    if (action?.iconType === 'schedule' || meta?.iconType === 'calendar') {
      return 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/20';
    }
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16 px-3 sm:px-6">

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

      {/* Clear All Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        onConfirm={handleClearAll}
        title={t('Clear all')}
        message={t('Are you sure you want to clear all notifications?')}
        confirmText={t('Clear all')}
        cancelText={t('Cancel')}
        isDestructive={true}
      />

      {/* =========================================================================
          APPLE HEADER SECTION
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
              <Bell className="w-3.5 h-3.5" />
              <span>{t('Notification Center')}</span>
            </span>
            {unreadTotal > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadTotal} {t('unread')}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('Notifications')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Stay updated with trainee enrollments, cancellations, and gym facility notices.')}
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer active:scale-95"
            title={t('Refresh')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
            <span>{t('Refresh')}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          12-COLUMN RESPONSIVE APPLE HIG GRID
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Column (8 cols): Controls & Notifications List */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Controls Bar: Search & Filter Chips */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search notifications input */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Search notifications...')}
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Only Unread Toggle Chip */}
              <button
                type="button"
                onClick={() => setOnlyUnread(prev => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  onlyUnread
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t('Only Unread')}</span>
                {unreadTotal > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Cupertino Segmented Tabs */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs font-semibold">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeFilter === tab.id;
                const count = tabCounts[tab.id] || 0;
                const unread = tabUnreadCounts[tab.id] || 0;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t(tab.label)}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                    {unread > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications Animated Cards List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="text-xs font-medium">{t('Loading Notifications...')}</span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-center px-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-black/[0.06] dark:border-white/10">
                <div className="w-14 h-14 rounded-3xl bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-center text-slate-400 shadow-inner">
                  <BellOff className="w-7 h-7 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery || onlyUnread ? t('No matching notifications') : t('No notifications yet')}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                  {searchQuery || onlyUnread
                    ? t('Try adjusting your search terms or filter.')
                    : t('When trainees book or modify your classes, alerts will appear here.')}
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredList.map((item) => {
                  const isUnread = !item.isRead && !item.read;
                  const meta = getNotificationMeta(item.type);
                  const action = getNotificationAction(item);

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      whileHover={{ scale: 1.003 }}
                      onClick={() => handleMarkAsRead(item.id, !isUnread)}
                      className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-200 border group cursor-pointer ${
                        isUnread
                          ? 'bg-white dark:bg-slate-900/90 border-emerald-500/30 dark:border-emerald-400/30 shadow-[0_4px_20px_rgba(16,185,129,0.06)] ring-1 ring-emerald-500/10'
                          : 'bg-white/60 dark:bg-slate-900/50 border-black/[0.05] dark:border-white/[0.08] hover:border-black/[0.1] hover:bg-white/90 dark:hover:bg-slate-900/80'
                      }`}
                    >
                      {/* Left accent bar for unread notifications */}
                      {isUnread && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 dark:bg-emerald-400" />
                      )}

                      <div className="flex items-start gap-3.5">
                        {/* Icon */}
                        <div className="relative shrink-0 mt-0.5">
                          {renderIcon(action, meta)}
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-w-0">
                          {/* Title and Time row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={t('unread')} />
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(action, meta)}`}>
                                {t(meta.label)}
                              </span>
                              <h3 className={`text-sm leading-snug tracking-tight ${
                                isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'
                              }`}>
                                {item.title}
                              </h3>
                            </div>

                            {/* Time & Delete button */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-slate-400 font-normal">
                                {formatNotificationTime(item.createdAt, currentLanguage)}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(e, item.id)}
                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors p-1.5 rounded-lg opacity-0 group-hover:opacity-100 cursor-pointer"
                                title={t('Delete notification')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Message Body */}
                          <p className={`text-xs mt-1.5 leading-relaxed whitespace-pre-line ${
                            isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.message}
                          </p>

                          {/* Contextual Action & Mark Read row */}
                          <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-black/[0.04] dark:border-white/[0.05] flex-wrap">
                            <div className="flex items-center gap-2">
                              {action && (
                                <button
                                  type="button"
                                  onClick={(e) => handleActionClick(e, item, action)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                  {action.iconType === 'trainee' && <UserCheck className="w-3.5 h-3.5" />}
                                  {action.iconType === 'workout' && <Dumbbell className="w-3.5 h-3.5" />}
                                  {action.iconType === 'schedule' && <Calendar className="w-3.5 h-3.5" />}
                                  {action.iconType === 'settings' && <SlidersHorizontal className="w-3.5 h-3.5" />}
                                  <span>{t(action.label)}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {isUnread && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(item.id, false);
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t('Mark as read')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* =========================================================================
            SIDEBAR COLUMN (4 cols): APPLE GLASS WIDGETS
            ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-6">

          {/* Widget 1: Notification Digest (Apple Gradient Card) */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white shadow-xl shadow-teal-900/20 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
            {/* Diffused specular glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-400/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/90">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>{t('Coach Notification Center Digest')}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-md text-white border border-white/20">
                {unreadTotal} {t('NEW')}
              </span>
            </div>

            <div className="relative z-10 my-4">
              <span className="text-2xl sm:text-3xl font-black tracking-tight block">
                {unreadTotal > 0 ? `${unreadTotal} ${t('Unread Alerts')}` : t('All Caught Up!')}
              </span>
              <p className="text-[11px] text-white/80 mt-1 font-normal">
                {unreadTotal > 0
                  ? `${unreadTotal} ${t('new updates waiting for your review')}`
                  : t('You have no unread notifications.')}
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/15 flex items-center gap-2">
              {unreadTotal > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t('Mark all as read')}</span>
                </button>
              )}
              {allowedNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmClearOpen(true)}
                  disabled={actionLoading}
                  className="py-2 px-3 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  title={t('Clear all')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('Clear all')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Widget 2: Category Quick-Filters */}
          <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('Notification Categories')}</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeFilter === tab.id;
                const count = tabCounts[tab.id] || 0;
                const unread = tabUnreadCounts[tab.id] || 0;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[1.75]" />
                      <span>{t(tab.label)}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {unread}
                        </span>
                      )}
                      <span className="text-slate-400 font-medium">({count})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget 3: Quick Alert Preferences Shortcut */}
          <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Megaphone className="w-3.5 h-3.5 text-teal-500" />
                <span>{t('Coach Alert Preferences')}</span>
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('Configure push alerts for attendance, assessments and schedule updates.')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/coach/settings')}
              className="w-full py-2.5 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>{t('Notification Settings')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CoachNotifications;
