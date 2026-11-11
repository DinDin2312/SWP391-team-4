import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  CreditCard,
  UserCheck,
  Dumbbell,
  LogOut,
  ShieldCheck,
  Receipt,
  LifeBuoy,
  PackageSearch,
  Settings,
  Bell,
} from 'lucide-react';
import ReceptionistNotificationDropdown from '../features/receptionist/components/ReceptionistNotificationDropdown';
import {
  getSavedReceptionistPreferences,
  getReceptionistUnreadCount,
} from '../features/receptionist/receptionistNotificationUtils';
import { API_ORIGIN } from '../config/apiBase.js';

const ReceptionistLayout = ({ children, activeFeature = 'search-members', onSelectFeature }) => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo, logout, updateUserInfo } = useContext(AuthContext);

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleProfileSync = () => {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && updateUserInfo) {
            updateUserInfo(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileSync);
    return () => window.removeEventListener('userProfileUpdated', handleProfileSync);
  }, [updateUserInfo]);

  // Sync Front Desk unread notifications
  useEffect(() => {
    const fetchUnread = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get(`${API_ORIGIN}/api/v1/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = Array.isArray(res.data) ? res.data : [];
        const prefs = getSavedReceptionistPreferences();
        setUnreadCount(getReceptionistUnreadCount(data, prefs));
      } catch {}
    };

    fetchUnread();
    const handleUpdate = () => fetchUnread();
    window.addEventListener('notificationUpdated', handleUpdate);
    window.addEventListener('receptionistNotificationUpdated', handleUpdate);
    return () => {
      window.removeEventListener('notificationUpdated', handleUpdate);
      window.removeEventListener('receptionistNotificationUpdated', handleUpdate);
    };
  }, []);

  const fullName = userInfo?.fullName || 'Lễ Tân Thúy Kiều';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    {
      id: 'search-members',
      label: 'Search & View Members',
      icon: Users,
    },
    {
      id: 'member-checkin',
      label: 'Check-in',
      icon: UserCheck,
    },
    {
      id: 'register-member',
      label: 'Register New Member',
      icon: UserPlus,
    },
    {
      id: 'manage-memberships',
      label: 'Packages & Renewals',
      icon: CreditCard,
    },
    {
      id: 'manage-invoices',
      label: 'Invoices & Receipts',
      icon: Receipt,
    },
    {
      id: 'support-desk',
      label: 'Support & Cancellations',
      icon: LifeBuoy,
    },
    {
      id: 'lost-and-found',
      label: 'Lost & Found',
      icon: PackageSearch,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="role-shell min-h-screen bg-[var(--bg)] text-[var(--text)] flex font-sans antialiased selection:bg-[var(--primary)] selection:text-[color:var(--on-primary)]">
      {/* ===================== SIDEBAR ===================== */}
      <AutoSidebar className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Logo Header */}
          <div className="auto-sidebar-brand p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow)] text-[color:var(--on-primary)] shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-[var(--text)]">{t("NEXUS")}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
              </div>
              <p className="text-[10px] tracking-widest text-[var(--text-muted)] font-semibold uppercase">{t("FRONT DESK PORTAL")}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="auto-sidebar-nav px-3 space-y-1 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFeature === item.id;

              return (
                <button
                  key={item.id}
                  aria-label={t(item.label)}
                  title={t(item.label)}
                  onClick={() => {
                    if (onSelectFeature) {
                      onSelectFeature(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold shadow-xs'
                      : 'border border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center shrink-0 relative">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  <span className="text-left leading-tight truncate flex-1 min-w-0">{t(item.label)}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile & Logout Footer */}
        <div className="auto-sidebar-footer p-4 border-t border-[var(--border)]">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
            <div
              onClick={() => {
                if (onSelectFeature) {
                  onSelectFeature('settings');
                }
              }}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
              title={t("Settings & Avatar")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectFeature) onSelectFeature('settings');
                }
              }}
            >
              <div className="relative shrink-0">
                {userInfo?.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl.startsWith('http') ? userInfo.avatarUrl : `${API_ORIGIN}${userInfo.avatarUrl}`}
                    alt={fullName}
                    className="w-9 h-9 rounded-xl object-cover border border-[var(--primary-soft)] group-hover:ring-2 group-hover:ring-[var(--primary)] transition-all"
                    onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div
                  style={{ display: userInfo?.avatarUrl ? 'none' : 'flex' }}
                  className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs items-center justify-center group-hover:ring-2 group-hover:ring-[var(--primary)] transition-all"
                >
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--success-hover)] border-2 border-[var(--border)]"></span>
              </div>
              <div className="auto-sidebar-profile-text text-left min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--text)] leading-tight group-hover:text-[var(--primary)] transition-colors truncate">{fullName}</p>
                <p className="text-[10px] text-[var(--primary)] flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-[var(--primary)] inline shrink-0" />
                  <span className="truncate">{t("Front Desk")}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t("Logout")}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1.5 rounded-lg hover:bg-[var(--surface-hover)] shrink-0 ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AutoSidebar>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
        <header className="role-page-topbar role-reception-topbar">
          <nav className="role-breadcrumb" aria-label={t('Breadcrumb')}>
            <span>{t('Front desk portal')}</span>
            <span aria-hidden="true">/</span>
            <strong>{t(navItems.find(item => item.id === activeFeature)?.label || '')}</strong>
          </nav>
          <div className="role-header-actions flex items-center gap-2">
            {/* Front Desk Notification Bell Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  isNotifDropdownOpen
                    ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-md shadow-blue-500/20'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)]'
                }`}
                title={t("Notifications")}
                aria-label={t("Notifications")}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <ReceptionistNotificationDropdown
                isOpen={isNotifDropdownOpen}
                onClose={() => setIsNotifDropdownOpen(false)}
                onUnreadChange={setUnreadCount}
                onNavigateFeature={onSelectFeature}
              />
            </div>

            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default ReceptionistLayout;
