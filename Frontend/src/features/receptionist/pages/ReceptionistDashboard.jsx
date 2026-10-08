import { t, useLanguage } from '../../../i18n/useLanguage';

import React, { useState } from 'react';
import ReceptionistLayout from '../../../layouts/ReceptionistLayout';
import MemberManagementView from '../components/MemberManagementView';
import RegisterMemberView from '../components/RegisterMemberView'; // Thêm dòng import này
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';
import ManageMembershipsView from '../components/ManageMembershipsView';


const ReceptionistDashboard = () => {
  useLanguage();
  const [activeFeature, setActiveFeature] = useState('search-members');

  const getFeatureTitle = (id) => {
    switch (id) {
      case 'register-member':
        return 'Register New Member';
      case 'manage-memberships':
        return 'Manage & Renew Member Packages';
      case 'check-validity':
        return 'Check Package Status & Validity';
      case 'class-bookings':
        return 'Book or Cancel Classes for Members';
      case 'invoices-payment':
        return 'Record Payments & Issue Invoices';
      case 'support-requests':
        return 'Receive & Log Member Requests';
      default:
        return 'Search & View Member Information';
    }
  };

  return (
      <ReceptionistLayout activeFeature={activeFeature} onSelectFeature={setActiveFeature}>
        {/* 1. Màn hình tra cứu hội viên */}
        {activeFeature === 'search-members' && <MemberManagementView />}

        {/* 2. Màn hình đăng ký thành viên mới tại quầy */}
        {activeFeature === 'register-member' && (
            <RegisterMemberView onSuccess={() => setActiveFeature('search-members')} />
        )}

        {/* 3. Màn hình gia hạn lớp học nối tiếp (Thêm mới tại đây) */}
        {activeFeature === 'manage-memberships' && <ManageMembershipsView />}

        {/* 4. Màn hình chờ cho các tính năng còn lại */}
        {activeFeature !== 'search-members' &&
            activeFeature !== 'register-member' &&
            activeFeature !== 'manage-memberships' && (
                <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '60vh' }}>
                  <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '1.25rem',
                        backgroundColor: 'var(--primary-soft)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        marginBottom: '1.5rem',
                      }}
                  >
                    <Clock style={{ width: '32px', height: '32px' }} />
                  </div>

                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem' }}>
                    {getFeatureTitle(activeFeature)}
                  </h1>

                  <p style={{ maxWidth: '480px', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem' }}>{t("This feature is currently under development for the Receptionist role. You can switch back to")}<strong>{t("Search & View Member Information")}</strong>{t("at any time.")}</p>

                  <button
                      onClick={() => setActiveFeature('search-members')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-soft)',
                        color: 'var(--text)',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-soft)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-soft)')}
                  >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    <span>{t("Back to Member Search")}</span>
                  </button>
                </div>
            )}
      </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;