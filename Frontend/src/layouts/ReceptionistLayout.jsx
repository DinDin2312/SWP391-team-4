import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

const ReceptionistLayout = ({ children, activeFeature = 'search-members', onSelectFeature }) => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo, logout } = useContext(AuthContext);

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
      label: t('Search & View Members'),
      icon: Users,
      badge: 'Primary',
      isReady: true,
    },
    {
      id: 'member-checkin',
      label: t('Member Check-in (Gym & Facility)'),
      icon: UserCheck,
      badge: 'Live',
      isReady: true,
    },
    {
      id: 'register-member',
      label: t('Register New Member'),
      icon: UserPlus,
      badge: '',
      isReady: true,
    },
    {
      id: 'manage-memberships',
      label: t('Packages & Renewals'),
      icon: CreditCard,
      badge: '',
      isReady: true,
    },
    {
      id: 'manage-invoices',
      label: t('Invoices & Receipts'),
      icon: Receipt,
      badge: '',
      isReady: true,
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{t(item.label)}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.isReady ? 'bg-[var(--surface)] text-[var(--success-text)]' : 'bg-[var(--surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {item.badge}
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
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--success-hover)] border-2 border-[var(--border)]"></span>
              </div>
              <div className="auto-sidebar-profile-text text-left">
                <p className="text-xs font-bold text-[var(--text)] leading-tight">{fullName}</p>
                <p className="text-[10px] text-[var(--primary)] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[var(--primary)] inline" />{t("Front Desk")}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title={t("Logout")}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AutoSidebar>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <header className="role-page-topbar role-reception-topbar">
          <nav className="role-breadcrumb" aria-label={t('Breadcrumb')}><span>{t('Front desk portal')}</span><span aria-hidden="true">/</span><strong>{navItems.find(item => item.id === activeFeature)?.label}</strong></nav>
          <div className="role-header-actions"><LanguageSwitcher /></div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default ReceptionistLayout;
