import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Sparkles,
} from 'lucide-react';

const ReceptionistLayout = ({ children, activeFeature = 'search-members', onSelectFeature }) => {
  const navigate = useNavigate();
  const location = useLocation();
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
      label: 'Tìm kiếm & Xem hội viên',
      icon: Users,
      badge: 'Chính',
      isReady: true,
    },
    {
      id: 'register-member',
      label: 'Đăng ký hội viên mới',
      icon: UserPlus,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
    {
      id: 'manage-memberships',
      label: 'Gói tập & Gia hạn',
      icon: CreditCard,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
    {
      id: 'check-validity',
      label: 'Kiểm tra gói & Thời hạn',
      icon: Clock,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
    {
      id: 'class-bookings',
      label: 'Đặt & Hủy lịch lớp học',
      icon: Dumbbell,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
    {
      id: 'invoices-payment',
      label: 'Thu phí & Hóa đơn',
      icon: Receipt,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
    {
      id: 'support-requests',
      label: 'Tiếp nhận hỗ trợ',
      icon: Headphones,
      badge: 'Sắp ra mắt',
      isReady: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060b17', color: '#f1f5f9', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ===================== SIDEBAR ===================== */}
      <aside
        style={{
          width: '280px',
          backgroundColor: '#091124',
          borderRight: '1px solid #15203b',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand Logo Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #15203b', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)',
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              <Dumbbell style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '1.1rem', color: '#ffffff' }}>NEXUS</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }}></span>
              </div>
              <p style={{ margin: 0, fontSize: '0.65rem', letterSpacing: '0.12em', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                FRONT DESK PORTAL
              </p>
            </div>
          </div>

          {/* Role Pill Indicator */}
          <div style={{ padding: '1rem 1.25rem 0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
              }}
            >
              <ShieldCheck style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Vai trò: </span>
                <strong style={{ color: '#38bdf8' }}>Lễ Tân Trung Tâm</strong>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 0.75rem' }}>
              CHỨC NĂNG LỄ TÂN
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFeature === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onSelectFeature) {
                      onSelectFeature(item.id);
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '0.65rem',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.16)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#111d38';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon style={{ width: '18px', height: '18px', color: isSelected ? '#38bdf8' : '#64748b' }} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '0.25rem',
                        backgroundColor: item.isReady ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                        color: item.isReady ? '#34d399' : '#64748b',
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
        <div style={{ padding: '1rem', borderTop: '1px solid #15203b', backgroundColor: '#070d1a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {fullName}
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '0.5rem',
                border: '1px solid #1e293b',
                backgroundColor: '#111d38',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.borderColor = '#1e293b';
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

export default ReceptionistLayout;
