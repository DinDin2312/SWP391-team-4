import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime } from '../../../utils/displayFormat';
import { ConfirmModal } from '../../../components/ui/confirm-modal';
import { 
  Bell, 
  BellOff, 
  Trash2, 
  CheckCheck, 
  Check, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Calendar, 
  CreditCard, 
  Megaphone,
  ShieldCheck,
  Dumbbell,
  LifeBuoy,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

const TABS = [
  { id: 'ALL', labelKey: 'All', shortLabelKey: 'All', icon: Bell, types: [] },
  { id: 'SCHEDULE', labelKey: 'Classes & Schedule', shortLabelKey: 'Schedule', icon: Calendar, types: ['BOOKING', 'SCHEDULE'] },
  { id: 'COACH', labelKey: 'Coach & Workouts', shortLabelKey: 'Coach', icon: Dumbbell, types: ['COACH', 'WORKOUT'] },
  { id: 'PAYMENT', labelKey: 'Packages & Billing', shortLabelKey: 'Billing', icon: CreditCard, types: ['PAYMENT', 'MEMBERSHIP'] },
  { id: 'SUPPORT', labelKey: 'Support Desk', shortLabelKey: 'Support', icon: LifeBuoy, types: ['SUPPORT', 'SUPPORT_REVOKED'] },
  { id: 'SYSTEM', labelKey: 'System Alerts', shortLabelKey: 'System', icon: ShieldCheck, types: ['SYSTEM', 'URGENT', 'ANNOUNCEMENT'] }
];

const getNotificationMeta = (type, title = '', message = '') => {
  const normType = (type || 'SYSTEM').toUpperCase();
  const lowerMsg = (title + ' ' + message).toLowerCase();

  switch (normType) {
    case 'BOOKING':
    case 'SCHEDULE':
      return {
        badge: t('Classes & Schedule'),
        icon: Calendar,
        badgeStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/20',
        iconStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF]',
        action: { label: t('View Schedule'), path: '/member/schedule' }
      };
    case 'COACH':
      return {
        badge: t('Coach'),
        icon: UserCheck,
        badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        iconStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        action: { label: t('View Dashboard'), path: '/member/dashboard' }
      };
    case 'WORKOUT':
      return {
        badge: t('Workout Plan'),
        icon: Dumbbell,
        badgeStyle: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        iconStyle: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
        action: { label: t('View Workout Plan'), path: '/member/dashboard' }
      };
    case 'PAYMENT':
      return {
        badge: t('Payment'),
        icon: CreditCard,
        badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        iconStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        action: { label: t('View Invoices'), path: '/member/billing' }
      };
    case 'MEMBERSHIP':
      return {
        badge: t('Membership Package'),
        icon: ShieldCheck,
        badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        iconStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        action: { label: t('View Packages'), path: '/member/memberships' }
      };
    case 'SUPPORT':
      return {
        badge: t('Member Support'),
        icon: LifeBuoy,
        badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        iconStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
        action: { label: t('View Ticket'), path: '/member/support' }
      };
    case 'SUPPORT_REVOKED':
      return {
        badge: t('Support Revoked'),
        icon: AlertTriangle,
        badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        iconStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        action: { label: t('View Ticket'), path: '/member/support' }
      };
    case 'URGENT':
      return {
        badge: t('Urgent'),
        icon: AlertTriangle,
        badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        iconStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        action: null
      };
    case 'ANNOUNCEMENT':
      return {
        badge: t('Announcement'),
        icon: Megaphone,
        badgeStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/20',
        iconStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF]',
        action: null
      };
    case 'SYSTEM':
    default:
      if (lowerMsg.includes('class') || lowerMsg.includes('lớp') || lowerMsg.includes('lịch') || lowerMsg.includes('booking')) {
        return {
          badge: t('Classes & Schedule'),
          icon: Calendar,
          badgeStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/20',
          iconStyle: 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF]',
          action: { label: t('View Schedule'), path: '/member/schedule' }
        };
      }
      if (lowerMsg.includes('membership') || lowerMsg.includes('gói') || lowerMsg.includes('check-in')) {
        return {
          badge: t('Membership Package'),
          icon: ShieldCheck,
          badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          iconStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          action: { label: t('View Packages'), path: '/member/memberships' }
        };
      }
      return {
        badge: t('System'),
        icon: SettingsIcon,
        badgeStyle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
        iconStyle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        action: null
      };
  }
};

const formatNotificationTitle = (title) => {
  if (!title) return '';
  return t(title);
};

const formatNotificationMessage = (msg) => {
  if (!msg) return '';
  const match = msg.match(/^Your invoice (\d+) is complete\.$/i);
  if (match) {
    const id = match[1];
    return t("Invoice #{0} has been paid successfully. Please click 'View Invoices' below to check transaction details.", id);
  }
  return t(msg);
};

const getPaginationRange = (current, total) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

const Notifications = () => {
  useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    // Optimistic UI Update: Cập nhật giao diện lập tức (0ms latency)
    const prevNotifications = notifications;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark as read", err);
      setNotifications(prevNotifications);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic UI Update: Cập nhật giao diện đọc tất cả ngay lập tức (0ms latency)
    const prevNotifications = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark all as read", err);
      setNotifications(prevNotifications);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDelete = async (id) => {
    // Optimistic UI Update: Xóa khỏi giao diện lập tức (0ms latency)
    const prevNotifications = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to delete notification", err);
      setNotifications(prevNotifications);
    }
  };

  const confirmDeleteAll = async () => {
    setIsConfirmAllOpen(false);

    // Optimistic UI Update: Xóa toàn bộ khỏi giao diện lập tức (0ms latency)
    const prevNotifications = notifications;
    setNotifications([]);

    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to delete all notifications", err);
      setNotifications(prevNotifications);
    }
  };

  const handleActionClick = (notification, actionPath) => {
    const isUnread = !(notification.isRead ?? notification.read);
    if (isUnread) {
      handleMarkAsRead(notification.id);
    }
    if (actionPath) {
      navigate(actionPath);
    }
  };

  // Compute category statistics
  const tabStats = useMemo(() => {
    const stats = {};
    TABS.forEach(tab => {
      let matching = notifications;
      if (tab.id !== 'ALL') {
        matching = notifications.filter(n => {
          const normType = (n.type || 'SYSTEM').toUpperCase();
          if (tab.types.includes(normType)) return true;
          if (normType === 'SYSTEM') {
            const combined = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();
            if (tab.id === 'SCHEDULE' && (combined.includes('class') || combined.includes('lớp') || combined.includes('lịch') || combined.includes('booking'))) return true;
            if (tab.id === 'PAYMENT' && (combined.includes('membership') || combined.includes('gói') || combined.includes('check-in'))) return true;
          }
          return false;
        });
      }
      const total = matching.length;
      const unread = matching.filter(n => !(n.isRead ?? n.read)).length;
      stats[tab.id] = { total, unread };
    });
    return stats;
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
    const q = searchQuery.trim().toLowerCase();

    return notifications.filter(n => {
      const isRead = Boolean(n.isRead ?? n.read);
      if (onlyUnread && isRead) return false;

      const normType = (n.type || 'SYSTEM').toUpperCase();
      const combined = ((n.title || '') + ' ' + (n.message || '')).toLowerCase();

      if (activeTab !== 'ALL') {
        const matchesType = currentTab.types.includes(normType);
        let matchesContext = false;
        if (normType === 'SYSTEM') {
          if (activeTab === 'SCHEDULE' && (combined.includes('class') || combined.includes('lớp') || combined.includes('lịch') || combined.includes('booking'))) matchesContext = true;
          if (activeTab === 'PAYMENT' && (combined.includes('membership') || combined.includes('gói') || combined.includes('check-in'))) matchesContext = true;
        }
        if (!matchesType && !matchesContext) return false;
      }

      if (q) {
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [notifications, activeTab, onlyUnread, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, onlyUnread, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedNotifications = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, validPage, pageSize]);

  const startRecord = filteredNotifications.length === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endRecord = Math.min(validPage * pageSize, filteredNotifications.length);

  const totalUnreadCount = notifications.filter(n => !(n.isRead ?? n.read)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <div className="text-slate-400 flex items-center gap-2 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-[#0071E3]" />
          <span>{t("Loading Notifications...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>{t("Notifications")}</span>
            {totalUnreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border border-blue-500/20 text-xs font-semibold">
                {totalUnreadCount} {t("NEW")}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("Stay updated on your schedule, payments, and system alerts.")}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-black/[0.06] dark:border-white/[0.08] transition-all cursor-pointer active:scale-95"
            title={t("Refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t("Refresh")}</span>
          </button>
        </div>
      </div>

      {/* 12-Column Responsive Apple HIG Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Column (8 cols): Controls & Notifications List */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* Controls Bar: Search & Filter + Adaptive Grid Cupertino Segmented Control */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Search notifications input + Unread only toggle chip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search notifications...")}
                  className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/50 transition-all"
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

              {/* Unread Only Chip */}
              <button
                type="button"
                onClick={() => setOnlyUnread(prev => !prev)}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
                  onlyUnread
                    ? 'bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border-blue-500/30 font-bold shadow-xs'
                    : 'bg-black/[0.03] dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.06]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{t("Unread only")}</span>
                {totalUnreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-[#0071E3] text-white text-[10px] font-bold">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Row 2: Cupertino Segmented Control (Adaptive Grid: 3 cols on mobile, 6 cols on sm/desktop - ZERO scrollbar) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.05] gap-1">
              {TABS.map((tab) => {
                const stat = tabStats[tab.id] || { total: 0, unread: 0 };
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={t(tab.labelKey)}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="truncate">{t(tab.shortLabelKey)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-500/15 text-[#0071E3] dark:text-[#0A84FF]'
                        : 'bg-black/[0.05] dark:bg-white/[0.08] text-slate-500'
                    }`}>
                      {stat.total}
                    </span>
                    {stat.unread > 0 && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex flex-col gap-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 text-center backdrop-blur-xl">
                <BellOff className="w-12 h-12 text-slate-400 mb-3 opacity-50 stroke-[1.5]" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("No notifications yet")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  {t("When you get updates, they'll show up here.")}
                </p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 bg-white/70 dark:bg-slate-900/60 rounded-3xl border border-slate-200/80 dark:border-white/10 text-center backdrop-blur-xl">
                <Search className="w-10 h-10 text-slate-400 mb-3 opacity-50 stroke-[1.5]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t("No notifications found in this category")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  {searchQuery || onlyUnread
                    ? t("Try adjusting your keyword filter or show read notifications.")
                    : t("You don't have any notifications under this tab.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ALL');
                    setSearchQuery('');
                    setOnlyUnread(false);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  {t("Clear filters")}
                </button>
              </div>
            ) : (
              paginatedNotifications.map((notification) => {
                const isUnread = !(notification.isRead ?? notification.read);
                const meta = getNotificationMeta(notification.type, notification.title, notification.message);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={notification.id}
                    className={`relative p-4 sm:p-5 rounded-2xl transition-all duration-200 border group ${
                      isUnread
                        ? 'bg-white dark:bg-slate-900/90 border-[#0071E3]/30 dark:border-[#0A84FF]/30 shadow-[0_4px_20px_rgba(0,113,227,0.06)] ring-1 ring-[#0071E3]/10'
                        : 'bg-white/60 dark:bg-slate-900/50 border-black/[0.05] dark:border-white/[0.08] hover:border-black/[0.1] hover:bg-white/90 dark:hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Left icon with unread indicator */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-current/15 ${meta.iconStyle}`}>
                          <IconComponent className="w-5 h-5 stroke-[1.75]" />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Time row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#0071E3] shrink-0" title={t("Unread")} />
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badgeStyle}`}>
                              {meta.badge}
                            </span>
                            <h3 className={`text-sm leading-snug tracking-tight ${
                              isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'
                            }`}>
                              {formatNotificationTitle(notification.title)}
                            </h3>
                          </div>

                          {/* Time & Delete button */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-slate-400 font-normal">
                              {formatDateTime(notification.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(notification.id)}
                              className="text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors p-1 rounded-lg cursor-pointer"
                              title={t("Delete notification")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Message */}
                        <p className={`text-xs mt-1.5 leading-relaxed whitespace-pre-line ${
                          isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {formatNotificationMessage(notification.message)}
                        </p>

                        {/* Actions line */}
                        {(meta.action || isUnread) && (
                          <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 border-t border-black/[0.04] dark:border-white/[0.05]">
                            <div className="flex items-center gap-2">
                              {meta.action && (
                                <button
                                  type="button"
                                  onClick={() => handleActionClick(notification, meta.action.path)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white active:scale-95 transition-all shadow-xs cursor-pointer"
                                >
                                  <span>{meta.action.label}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:underline px-2 py-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{t("Mark as read")}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Numbered Pagination (1, 2, 3...) */}
          {filteredNotifications.length > 0 && (
            <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                <span>{t("Showing")} <strong className="text-slate-900 dark:text-white font-semibold">{startRecord}–{endRecord}</strong> {t("of")} <strong className="text-slate-900 dark:text-white font-semibold">{filteredNotifications.length}</strong> {t("notifications")}</span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1 select-none">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={validPage === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    aria-label={t("Previous")}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPaginationRange(validPage, totalPages).map((p, idx) => {
                    if (p === '...') {
                      return (
                        <span key={`dots-${idx}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = p === validPage;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#0071E3] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={validPage === totalPages}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                    aria-label={t("Next")}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Column (4 cols): Apple Glass Widgets */}
        <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-6">
          
          {/* Widget 1: Notification Digest (Apple Gradient Card) */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#0071E3] via-blue-700 to-indigo-800 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[190px]">
            {/* Diffused specular glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-400/30 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                <Inbox className="w-4 h-4" />
                <span>{t("Notification Center Digest")}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 backdrop-blur-md text-white border border-white/20">
                {totalUnreadCount} {t("NEW")}
              </span>
            </div>

            <div className="relative z-10 my-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight">
                {totalUnreadCount > 0 ? `${totalUnreadCount} ${t("Unread Notifications")}` : t("All Caught Up!")}
              </span>
              <p className="text-[11px] text-white/80 mt-1 font-normal">
                {totalUnreadCount > 0
                  ? `${totalUnreadCount} ${t("new updates waiting for your review")}`
                  : t("You have no unread notifications.")}
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/15 flex items-center gap-2">
              {totalUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t("Mark all as read")}</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsConfirmAllOpen(true)}
                  className="py-2 px-3 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 font-semibold text-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  title={t("Clear All")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t("Clear All")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Widget 2: Category Quick-Filters */}
          <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>{t("Notification Categories")}</span>
            </h4>

            <div className="space-y-1.5 text-xs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const stat = tabStats[tab.id] || { total: 0, unread: 0 };
                const isSelected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-500/15 text-[#0071E3] dark:text-[#0A84FF] font-bold border border-blue-500/25'
                        : 'bg-black/[0.02] dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 stroke-[1.75]" />
                      <span>{t(tab.labelKey)}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {stat.unread > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-[#0071E3] dark:text-[#0A84FF] text-[10px] font-bold">
                          {stat.unread}
                        </span>
                      )}
                      <span className="text-slate-400 font-medium">({stat.total})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Widget 3: Notification Delivery & Security */}
          <div className="rounded-3xl p-5 bg-white/70 dark:bg-slate-900/65 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>{t("Notification Channels")}</span>
            </h4>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t("Real-time push alerts for class schedules, gate check-in & e-invoices.")}
            </p>

            <div className="space-y-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.05] text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t("Email & Push Sync")}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{t("Active")}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t("Turnstile Access Sync")}</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{t("Instant Delivery")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/member/settings')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>{t("Notification Preferences")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmAllOpen}
        onClose={() => setIsConfirmAllOpen(false)}
        onConfirm={confirmDeleteAll}
        title={t("Clear All")}
        message={t("Are you sure you want to delete ALL notifications? This action cannot be undone.")}
        confirmText={t("Clear All")}
        cancelText={t("Cancel")}
        isDestructive={true}
      />
    </div>
  );
};

export default Notifications;
