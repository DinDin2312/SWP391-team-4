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
  X,
  ArrowRight,
  UserCheck
} from 'lucide-react';

const TABS = [
  { id: 'ALL', labelKey: 'All', icon: Bell, types: [] },
  { id: 'SCHEDULE', labelKey: 'Classes & Schedule', icon: Calendar, types: ['BOOKING', 'SCHEDULE'] },
  { id: 'COACH', labelKey: 'Coach & Workouts', icon: Dumbbell, types: ['COACH', 'WORKOUT'] },
  { id: 'PAYMENT', labelKey: 'Packages & Billing', icon: CreditCard, types: ['PAYMENT', 'MEMBERSHIP'] },
  { id: 'SUPPORT', labelKey: 'Support Desk', icon: LifeBuoy, types: ['SUPPORT', 'SUPPORT_REVOKED'] },
  { id: 'SYSTEM', labelKey: 'System Alerts', icon: ShieldCheck, types: ['SYSTEM', 'URGENT', 'ANNOUNCEMENT'] }
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
        badgeStyle: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        iconStyle: 'bg-blue-500/10 text-blue-400',
        action: { label: t('View Schedule'), path: '/member/schedule' }
      };
    case 'COACH':
      return {
        badge: t('Coach'),
        icon: UserCheck,
        badgeStyle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        iconStyle: 'bg-emerald-500/10 text-emerald-400',
        action: { label: t('View Dashboard'), path: '/member/dashboard' }
      };
    case 'WORKOUT':
      return {
        badge: t('Workout Plan'),
        icon: Dumbbell,
        badgeStyle: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        iconStyle: 'bg-teal-500/10 text-teal-400',
        action: { label: t('View Workout Plan'), path: '/member/dashboard' }
      };
    case 'PAYMENT':
      return {
        badge: t('Payment'),
        icon: CreditCard,
        badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        iconStyle: 'bg-amber-500/10 text-amber-400',
        action: { label: t('View Invoices'), path: '/member/billing' }
      };
    case 'MEMBERSHIP':
      return {
        badge: t('Membership Package'),
        icon: ShieldCheck,
        badgeStyle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        iconStyle: 'bg-indigo-500/10 text-indigo-400',
        action: { label: t('View Packages'), path: '/member/memberships' }
      };
    case 'SUPPORT':
      return {
        badge: t('Member Support'),
        icon: LifeBuoy,
        badgeStyle: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        iconStyle: 'bg-purple-500/10 text-purple-400',
        action: { label: t('View Ticket'), path: '/member/support' }
      };
    case 'SUPPORT_REVOKED':
      return {
        badge: t('Support Revoked'),
        icon: AlertTriangle,
        badgeStyle: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        iconStyle: 'bg-rose-500/10 text-rose-400',
        action: { label: t('View Ticket'), path: '/member/support' }
      };
    case 'URGENT':
      return {
        badge: t('Urgent'),
        icon: AlertTriangle,
        badgeStyle: 'bg-red-500/10 text-red-400 border-red-500/20',
        iconStyle: 'bg-red-500/10 text-red-400',
        action: null
      };
    case 'ANNOUNCEMENT':
      return {
        badge: t('Announcement'),
        icon: Megaphone,
        badgeStyle: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        iconStyle: 'bg-cyan-500/10 text-cyan-400',
        action: null
      };
    case 'SYSTEM':
    default:
      if (lowerMsg.includes('class') || lowerMsg.includes('lớp') || lowerMsg.includes('lịch') || lowerMsg.includes('booking')) {
        return {
          badge: t('Classes & Schedule'),
          icon: Calendar,
          badgeStyle: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          iconStyle: 'bg-blue-500/10 text-blue-400',
          action: { label: t('View Schedule'), path: '/member/schedule' }
        };
      }
      if (lowerMsg.includes('membership') || lowerMsg.includes('gói') || lowerMsg.includes('check-in')) {
        return {
          badge: t('Membership Package'),
          icon: ShieldCheck,
          badgeStyle: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          iconStyle: 'bg-indigo-500/10 text-indigo-400',
          action: { label: t('View Packages'), path: '/member/memberships' }
        };
      }
      return {
        badge: t('System'),
        icon: SettingsIcon,
        badgeStyle: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        iconStyle: 'bg-slate-500/10 text-slate-400',
        action: null
      };
  }
};


const formatNotificationTitle = (title) => {
  if (!title) return '';
  if (title === 'Payment Successful') {
    return 'Thanh toán thành công / Payment Successful';
  }
  return title;
};

const formatNotificationMessage = (msg) => {
  if (!msg) return '';
  const match = msg.match(/^Your invoice (\d+) is complete\.$/i);
  if (match) {
    const id = match[1];
    return `Hóa đơn #${id} đã được thanh toán thành công.\nVui lòng nhấn "Xem hóa đơn" bên dưới để kiểm tra chi tiết giao dịch.`;
  }
  return t(msg);
};

const Notifications = () => {
  useLanguage();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isConfirmAllOpen, setIsConfirmAllOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

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
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/v1/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/v1/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/api/v1/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const confirmDeleteAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/v1/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications([]);
      window.dispatchEvent(new Event('notificationUpdated'));
    } catch (err) {
      console.error("Failed to delete all notifications", err);
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
          // Contextual checks for SYSTEM fallback
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

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [notifications, activeTab, onlyUnread, searchQuery]);

  const totalUnreadCount = notifications.filter(n => !(n.isRead ?? n.read)).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <div className="text-on-surface-variant flex items-center gap-2 font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>{t("Loading Notifications...")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen pb-12">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg border-b border-surface-container mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl lg:text-4xl text-on-surface tracking-tight font-extrabold flex items-center gap-3">
            {t("Notifications")}{' '}
            {totalUnreadCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-sm font-bold shadow-[var(--shadow)] animate-pulse">
                {totalUnreadCount} {t("NEW")}
              </span>
            )}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {t("Stay updated on your schedule, payments, and system alerts.")}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap mt-4 lg:mt-0">
          {notifications.length > 0 && totalUnreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-[var(--success-text)] shrink-0" />
              <span>{t("Mark all as read")}</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setIsConfirmAllOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-error-container text-on-error-container text-sm font-bold transition-all shadow-sm active:scale-95 hover:brightness-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>{t("Clear All")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none border-b border-surface-container/60">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const stat = tabStats[tab.id] || { total: 0, unread: 0 };
          const isActive = activeTab === tab.id;
          const tabLabel = t(tab.labelKey);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/20 scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tabLabel}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : stat.unread > 0 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {stat.total}
              </span>
              {stat.unread > 0 && !isActive && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-surface-container-lowest p-3 rounded-2xl border border-surface-container">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search notifications...")}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-surface-container border border-surface-container-high text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Unread toggle chip */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOnlyUnread(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
              onlyUnread
                ? 'bg-primary-container text-on-primary-container border-primary font-bold shadow-sm'
                : 'bg-surface-container text-on-surface-variant border-surface-container-high hover:border-slate-500'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t("Unread only")}</span>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-primary text-on-primary text-[10px] font-bold">
                {totalUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3.5 max-w-4xl">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-2xl border border-surface-container text-center">
            <BellOff className="w-16 h-16 text-on-surface-variant mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-on-surface">{t("No notifications yet")}</h3>
            <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
              {t("When you get updates, they'll show up here.")}
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-container-lowest rounded-2xl border border-surface-container text-center">
            <Search className="w-12 h-12 text-on-surface-variant mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-on-surface">{t("No notifications found in this category")}</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-md">
              {searchQuery || onlyUnread
                ? t("Try adjusting your keyword filter or show read notifications.")
                : t("You don't have any notifications under this tab.")}
            </p>
            <button
              onClick={() => {
                setActiveTab('ALL');
                setSearchQuery('');
                setOnlyUnread(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:brightness-105 cursor-pointer"
            >
              {t("Clear filters")}
            </button>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const isUnread = !(notification.isRead ?? notification.read);
            const meta = getNotificationMeta(notification.type, notification.title, notification.message);
            const IconComponent = meta.icon;

            return (
              <div
                key={notification.id}
                className={`relative flex flex-col sm:flex-row sm:items-start gap-4 p-5 rounded-2xl transition-all duration-200 border ${
                  isUnread
                    ? 'bg-surface-container-low border-primary/30 shadow-md ring-1 ring-primary/10'
                    : 'bg-surface-container-lowest border-surface-container hover:border-surface-container-highest opacity-90'
                }`}
              >
                {/* Left icon & Unread ping */}
                <div className="flex items-center sm:items-start gap-3 shrink-0">
                  <div className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.iconStyle} border-current/15`}>
                    <IconComponent className="w-5 h-5 shrink-0" />
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-surface-container-low"></span>
                      </span>
                    )}
                  </div>

                  {/* Mobile header view */}
                  <div className="sm:hidden flex-1 flex items-center justify-between min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeStyle}`}>
                      {meta.badge}
                    </span>
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <div className="hidden sm:flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeStyle}`}>
                        {meta.badge}
                      </span>
                      <h3 className={`text-sm lg:text-base leading-snug ${
                        isUnread ? 'font-extrabold text-on-surface' : 'font-semibold text-on-surface-variant'
                      }`}>
                        {formatNotificationTitle(notification.title)}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2 py-1 rounded-lg">
                        {formatDateTime(notification.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/20 cursor-pointer"
                        title={t("Delete notification")}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Title */}
                  <h3 className={`sm:hidden text-sm leading-snug ${
                    isUnread ? 'font-extrabold text-on-surface' : 'font-semibold text-on-surface-variant'
                  }`}>
                    {formatNotificationTitle(notification.title)}
                  </h3>

                  {/* Notification Message */}
                  <p className={`text-xs sm:text-sm mt-0.5 leading-relaxed whitespace-pre-line ${
                    isUnread ? 'text-on-surface-variant font-medium' : 'text-on-surface-variant/80'
                  }`}>
                    {formatNotificationMessage(notification.message)}
                  </p>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-surface-container/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      {meta.action && (
                        <button
                          onClick={() => handleActionClick(notification, meta.action.path)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-container text-on-primary-container hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                        >
                          <span>{meta.action.label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isUnread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline px-2 py-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("Mark as read")}</span>
                        </button>
                      )}
                    </div>

                    {/* Mobile Delete button */}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="sm:hidden text-on-surface-variant hover:text-error transition-colors p-1 rounded-md cursor-pointer ml-auto"
                      title={t("Delete notification")}
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
