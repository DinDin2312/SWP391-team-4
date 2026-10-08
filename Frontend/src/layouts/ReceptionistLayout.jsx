import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  CreditCard,
  Clock,
  Dumbbell,
  Receipt,
  Headphones,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

const ReceptionistLayout = ({ children, activeFeature = 'search-members', onSelectFeature }) => {
  useLanguage();
  const navigate = useNavigate();
  const { userInfo, logout } = useContext(AuthContext);

  const fullName = userInfo?.fullName || 'Lễ Tân Thúy Kiều';
  const email = userInfo?.email || 'letan@sport.com';
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
      id: 'register-member',
      label: t('Register New Member'),
      icon: UserPlus,
      badge: '',
      isReady: false,
    },
    {
      id: 'manage-memberships',
      label: t('Packages & Renewals'),
      icon: CreditCard,
      badge: '',
      isReady: false,
    },
    {
      id: 'check-validity',
      label: t('Package Status'),
      icon: Clock,
      badge: '',
      isReady: false,
    },
    {
      id: 'class-bookings',
      label: t('Class Bookings'),
      icon: Dumbbell,
      badge: '',
      isReady: false,
    },
    {
      id: 'invoices-payment',
      label: t('Billing & Invoices'),
      icon: Receipt,
      badge: '',
      isReady: false,
    },
    {
      id: 'support-requests',
      label: t('Customer Support'),
      icon: Headphones,
      badge: '',
      isReady: false,
    },
  ];

  return (
    <div className="role-shell" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ===================== SIDEBAR ===================== */}
      <AutoSidebar
        style={{
          backgroundColor: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'var(--role-sidebar-justify, space-between)',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="auto-sidebar-brand" style={{ padding: 'var(--role-sidebar-padding, 1.5rem)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, var(--primary-soft), var(--primary-soft))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow)',
                color: 'var(--text)',
                flexShrink: 0,
              }}
            >
              <Dumbbell style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '1.1rem', color: 'var(--text)' }}>{t("NEXUS")}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-soft)' }}></span>
              </div>
              <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{t("FRONT DESK PORTAL")}</p>
            </div>
          </div>

          {/* Role Pill Indicator */}
          <div className="auto-sidebar-role" style={{ padding: '1rem 1.25rem 0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--primary-soft)',
                border: '1px solid var(--border)',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
              }}
            >
              <ShieldCheck style={{ width: '16px', height: '16px', color: 'var(--primary)' }} />
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t("Role:")}</span>
                <strong style={{ color: 'var(--primary)' }}>{t("Front Desk Receptionist")}</strong>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="auto-sidebar-nav" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 0.75rem' }}>{t("RECEPTIONIST FEATURES")}</span>

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
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'var(--role-sidebar-justify, space-between)',
                    padding: '0.7rem var(--role-sidebar-padding, 0.85rem)',
                    borderRadius: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                    backgroundColor: isSelected ? 'var(--primary-soft)' : 'transparent',
                    border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                      e.currentTarget.style.color = 'var(--text)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon style={{ width: '18px', height: '18px', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }} />
                    <span>{t(item.label)}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '0.25rem',
                        backgroundColor: item.isReady ? 'var(--success-soft)' : 'var(--surface)',
                        color: item.isReady ? 'var(--success-text)' : 'var(--text-muted)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile & Logout Footer */}
        <div className="auto-sidebar-footer" style={{ padding: 'var(--role-sidebar-padding, 1rem)', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div style={{ display: 'flex', flexDirection: 'var(--role-sidebar-direction, row)', alignItems: 'center', justifyContent: 'var(--role-sidebar-justify, space-between)', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-soft), var(--violet-soft))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div className="auto-sidebar-profile-text" style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {fullName}
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title={t("Đăng xuất")}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger-text)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </AutoSidebar>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default ReceptionistLayout;
