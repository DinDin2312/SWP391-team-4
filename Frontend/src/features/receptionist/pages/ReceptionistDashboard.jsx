import React, { useState } from 'react';
import ReceptionistLayout from '../../../layouts/ReceptionistLayout';
import MemberManagementView from '../components/MemberManagementView';
import { Sparkles, ArrowLeft, Clock } from 'lucide-react';

const ReceptionistDashboard = () => {
  const [activeFeature, setActiveFeature] = useState('search-members');

  const getFeatureTitle = (id) => {
    switch (id) {
      case 'register-member':
        return 'Đăng ký thành viên mới tại quầy';
      case 'manage-memberships':
        return 'Quản lý đăng ký / gia hạn các gói thành viên';
      case 'check-validity':
        return 'Kiểm tra trạng thái gói tập & thời hạn sử dụng';
      case 'class-bookings':
        return 'Đăng ký lớp học hoặc hỗ trợ hủy lớp cho thành viên';
      case 'invoices-payment':
        return 'Ghi nhận các khoản thanh toán & in/xuất hóa đơn';
      case 'support-requests':
        return 'Tiếp nhận & ghi nhận các yêu cầu hỗ trợ từ thành viên';
      default:
        return 'Tìm kiếm & xem thông tin thành viên';
    }
  };

  return (
    <ReceptionistLayout activeFeature={activeFeature} onSelectFeature={setActiveFeature}>
      {activeFeature === 'search-members' ? (
        <MemberManagementView />
      ) : (
        <div style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '60vh' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '1.25rem',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              marginBottom: '1.5rem',
            }}
          >
            <Clock style={{ width: '32px', height: '32px' }} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.5rem' }}>
            {getFeatureTitle(activeFeature)}
          </h2>

          <p style={{ maxWidth: '480px', color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
            Tính năng này đang được lên kế hoạch phát triển cho role Lễ tân (Receptionist). Bạn có thể quay lại tính năng <strong>Tìm kiếm và xem thông tin thành viên</strong> bất cứ lúc nào.
          </p>

          <button
            onClick={() => setActiveFeature('search-members')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Quay lại Tra cứu hội viên</span>
          </button>
        </div>
      )}
    </ReceptionistLayout>
  );
};

export default ReceptionistDashboard;
