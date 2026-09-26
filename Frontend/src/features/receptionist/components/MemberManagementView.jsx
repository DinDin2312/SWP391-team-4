import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  Users,
  Activity,
  CheckCircle,
  Clock,
  ChevronRight,
  Shield,
  Sparkles,
  UserX,
} from 'lucide-react';
import receptionistService from '../services/receptionistService';
import MemberDetailModal from './MemberDetailModal';

// Dữ liệu mẫu chuẩn từ database_init.sql để fallback khi Backend chưa kết nối
const FALLBACK_MEMBERS = [
  {
    userId: 6,
    fullName: 'Trần Bùi Thái',
    email: 'thai@gmail.com',
    phone: '0901234567',
    status: 'ACTIVE',
    bio: 'Mục tiêu tăng cơ giảm mỡ, tập sáng.',
    currentMembershipId: 1,
    currentPackageName: 'Thẻ Gym 1 Tháng',
    currentPackageType: 'GYM_ACCESS',
    membershipStartDate: '2026-09-01',
    membershipEndDate: '2026-10-01',
    membershipStatus: 'ACTIVE',
    daysRemaining: 5,
    totalBookings: 3,
  },
  {
    userId: 7,
    fullName: 'Nguyễn Kiều Oanh',
    email: 'oanh@gmail.com',
    phone: '0912345678',
    status: 'ACTIVE',
    bio: 'Yêu thích Yoga và bơi lội.',
    currentMembershipId: 2,
    currentPackageName: 'Thẻ Gym 1 Năm',
    currentPackageType: 'GYM_ACCESS',
    membershipStartDate: '2026-01-01',
    membershipEndDate: '2027-01-01',
    membershipStatus: 'ACTIVE',
    daysRemaining: 97,
    totalBookings: 3,
  },
  {
    userId: 8,
    fullName: 'Lê Hoàng Long',
    email: 'long@gmail.com',
    phone: '0987654321',
    status: 'ACTIVE',
    bio: 'Mới bắt đầu tập luyện thể hình.',
    currentMembershipId: 3,
    currentPackageName: 'Gói Thuê AI Cá Nhân 1 Tháng',
    currentPackageType: 'AI_ACCESS',
    membershipStartDate: '2026-09-15',
    membershipEndDate: '2026-10-15',
    membershipStatus: 'ACTIVE',
    daysRemaining: 19,
    totalBookings: 2,
  },
  {
    userId: 9,
    fullName: 'Vũ Đức Mạnh',
    email: 'manh@gmail.com',
    phone: '0933445566',
    status: 'ACTIVE',
    bio: 'Tập cardio và lớp đạp xe buổi tối.',
    currentMembershipId: 4,
    currentPackageName: 'Thẻ Gym 3 Tháng',
    currentPackageType: 'GYM_ACCESS',
    membershipStartDate: '2026-08-01',
    membershipEndDate: '2026-11-01',
    membershipStatus: 'ACTIVE',
    daysRemaining: 36,
    totalBookings: 2,
  },
  {
    userId: 10,
    fullName: 'Đinh Thị Thu',
    email: 'thu@gmail.com',
    phone: '0977889900',
    status: 'ACTIVE',
    bio: 'Học bơi và tăng thể lực.',
    currentMembershipId: 5,
    currentPackageName: 'Thẻ Gym 1 Tháng',
    currentPackageType: 'GYM_ACCESS',
    membershipStartDate: '2026-09-20',
    membershipEndDate: '2026-10-20',
    membershipStatus: 'ACTIVE',
    daysRemaining: 24,
    totalBookings: 2,
  },
  {
    userId: 11,
    fullName: 'Phạm Tuấn Ngọc',
    email: 'ngoc@gmail.com',
    phone: '0922334455',
    status: 'ACTIVE',
    bio: '',
    currentMembershipId: null,
    currentPackageName: null,
    currentPackageType: null,
    membershipStartDate: null,
    membershipEndDate: null,
    membershipStatus: 'NO_MEMBERSHIP',
    daysRemaining: 0,
    totalBookings: 2,
  },
  {
    userId: 12,
    fullName: 'Bùi Tấn Trường',
    email: 'truong@gmail.com',
    phone: '0944556677',
    status: 'ACTIVE',
    bio: 'Vận động viên cử tạ nghiệp dư.',
    currentMembershipId: null,
    currentPackageName: null,
    currentPackageType: null,
    membershipStartDate: null,
    membershipEndDate: null,
    membershipStatus: 'NO_MEMBERSHIP',
    daysRemaining: 0,
    totalBookings: 2,
  },
  {
    userId: 18,
    fullName: 'Hồ Ngọc Hà',
    email: 'ha@gmail.com',
    phone: '0966778899',
    status: 'INACTIVE',
    bio: 'Tạm ngưng do bận công tác.',
    currentMembershipId: null,
    currentPackageName: 'Thẻ Tập Thử VIP (1 Ngày)',
    currentPackageType: 'GYM_ACCESS',
    membershipStartDate: '2026-07-01',
    membershipEndDate: '2026-07-02',
    membershipStatus: 'EXPIRED',
    daysRemaining: 0,
    totalBookings: 0,
  },
];

const MemberManagementView = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPackageStatus, setSelectedPackageStatus] = useState('ALL');

  // Detail Modal State
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await receptionistService.searchMembers({
        keyword: searchKeyword,
        status: selectedStatus,
        membershipFilter: selectedPackageStatus,
      });

      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers(FALLBACK_MEMBERS);
      }
    } catch (err) {
      console.warn('API error, using fallback data:', err);
      // Client-side filtering on fallback data
      let filtered = [...FALLBACK_MEMBERS];

      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        filtered = filtered.filter(
          (m) =>
            m.fullName.toLowerCase().includes(q) ||
            (m.phone && m.phone.includes(q)) ||
            (m.email && m.email.toLowerCase().includes(q)) ||
            String(m.userId) === q
        );
      }

      if (selectedStatus !== 'ALL') {
        filtered = filtered.filter((m) => m.status === selectedStatus);
      }

      if (selectedPackageStatus !== 'ALL') {
        filtered = filtered.filter((m) => m.membershipStatus === selectedPackageStatus);
      }

      setMembers(filtered);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, selectedStatus, selectedPackageStatus]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [fetchMembers]);

  // Handle View Member Detail
  const handleViewDetail = async (userId) => {
    setLoadingDetail(true);
    try {
      const detail = await receptionistService.getMemberDetail(userId);
      setSelectedMemberDetail(detail);
    } catch (err) {
      console.warn('Failed to load detail from API, using fallback:', err);
      const member = members.find((m) => m.userId === userId) || FALLBACK_MEMBERS.find((m) => m.userId === userId);
      if (member) {
        setSelectedMemberDetail({
          ...member,
          roleName: 'Member',
          totalBookingsCount: member.totalBookings || 2,
          attendedCount: 2,
          absentCount: 0,
          upcomingCount: 1,
          memberships: member.currentPackageName
            ? [
                {
                  membershipId: member.currentMembershipId || 1,
                  packageName: member.currentPackageName,
                  packageType: member.currentPackageType || 'GYM_ACCESS',
                  price: 500000,
                  startDate: member.membershipStartDate || '2026-09-01',
                  endDate: member.membershipEndDate || '2026-10-01',
                  status: member.membershipStatus,
                  daysRemaining: member.daysRemaining,
                  active: member.membershipStatus === 'ACTIVE',
                },
              ]
            : [],
          bookings: [
            {
              bookingId: 101,
              className: 'Gym Căn Bản Cho Nam',
              coachName: 'HLV Nguyễn Văn Tuấn',
              roomName: 'Phòng Gym Tầng 1',
              startTime: '2026-10-01T17:00:00',
              endTime: '2026-10-01T18:30:00',
              bookingStatus: 'CONFIRMED',
              attendanceStatus: 'PRESENT',
            },
            {
              bookingId: 102,
              className: 'Siết Cơ Cấp Tốc',
              coachName: 'HLV Nguyễn Văn Tuấn',
              roomName: 'Phòng Gym Tầng 1',
              startTime: '2026-10-03T17:00:00',
              endTime: '2026-10-03T18:30:00',
              bookingStatus: 'CONFIRMED',
              attendanceStatus: 'NOT_YET',
            },
          ],
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'HV';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Stats calculation
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const hasActivePackageCount = members.filter((m) => m.membershipStatus === 'ACTIVE').length;
  const expiredPackageCount = members.filter((m) => m.membershipStatus === 'EXPIRED').length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ================= PAGE HEADER ================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Tra Cứu & Quản Lý Hội Viên
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              Lễ Tân Quầy
            </span>
          </div>
          <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Tìm kiếm nhanh thông tin thành viên qua Họ tên, Số điện thoại, Email hoặc Mã ID. Xem chi tiết thẻ tập và lịch sử đặt lớp.
          </p>
        </div>

        <button
          onClick={fetchMembers}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.15rem',
            backgroundColor: '#111d38',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '0.65rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#182b52';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#111d38';
          }}
        >
          <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* ================= STATS OVERVIEW CARDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Tổng số hội viên */}
        <div
          style={{
            backgroundColor: '#0a1224',
            border: '1px solid #162444',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Tổng số hội viên</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.1rem' }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Card 2: Tài khoản hoạt động */}
        <div
          style={{
            backgroundColor: '#0a1224',
            border: '1px solid #162444',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}
          >
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Đang hoạt động</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '0.1rem' }}>
              {activeCount}
            </div>
          </div>
        </div>

        {/* Card 3: Có gói tập hiệu lực */}
        <div
          style={{
            backgroundColor: '#0a1224',
            border: '1px solid #162444',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <CreditCard style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Gói tập còn hạn</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.1rem' }}>
              {hasActivePackageCount}
            </div>
          </div>
        </div>

        {/* Card 4: Gói hết hạn */}
        <div
          style={{
            backgroundColor: '#0a1224',
            border: '1px solid #162444',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <AlertCircle style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Gói tập hết hạn</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', marginTop: '0.1rem' }}>
              {expiredPackageCount}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & FILTER CONTROL BAR ================= */}
      <div
        style={{
          backgroundColor: '#091124',
          border: '1px solid #162444',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <Search
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '18px',
                height: '18px',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              placeholder="Tìm theo Tên hội viên, SĐT (09xx), Email hoặc Mã ID (#MEM)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#060b17',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#38bdf8')}
              onBlur={(e) => (e.target.style.borderColor = '#1e293b')}
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '0.2rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter: Account Status */}
          <div style={{ minWidth: '180px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#060b17',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Tất cả tài khoản</option>
              <option value="ACTIVE">● Đang hoạt động (Active)</option>
              <option value="INACTIVE">● Tạm ngưng (Inactive)</option>
            </select>
          </div>

          {/* Filter: Membership Package Status */}
          <div style={{ minWidth: '200px' }}>
            <select
              value={selectedPackageStatus}
              onChange={(e) => setSelectedPackageStatus(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#060b17',
                border: '1px solid #1e293b',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">Tất cả gói tập</option>
              <option value="ACTIVE">🟢 Gói đang hiệu lực</option>
              <option value="EXPIRED">🔴 Gói đã hết hạn</option>
              <option value="NO_MEMBERSHIP">⚪ Chưa có gói tập</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips indicator */}
        {(searchKeyword || selectedStatus !== 'ALL' || selectedPackageStatus !== 'ALL') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Đang lọc:</span>
            {searchKeyword && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#1e293b',
                  color: '#93c5fd',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Từ khóa: "{searchKeyword}"
                <button
                  onClick={() => setSearchKeyword('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#1e293b',
                  color: '#34d399',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Trạng thái: {selectedStatus}
                <button
                  onClick={() => setSelectedStatus('ALL')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedPackageStatus !== 'ALL' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: '#1e293b',
                  color: '#38bdf8',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Gói tập: {selectedPackageStatus}
                <button
                  onClick={() => setSelectedPackageStatus('ALL')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedStatus('ALL');
                setSelectedPackageStatus('ALL');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* ================= MEMBERS TABLE ================= */}
      <div
        style={{
          backgroundColor: '#091124',
          border: '1px solid #162444',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0c1630', borderBottom: '1px solid #162444', color: '#94a3b8' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Mã & Họ tên</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Liên hệ (SĐT / Email)</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Gói tập hiện tại</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Thời hạn & Số ngày</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Trạng thái TK</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid rgba(56, 189, 248, 0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ marginTop: '0.75rem', margin: '0.75rem 0 0', fontSize: '0.9rem' }}>Đang tìm kiếm dữ liệu thành viên...</p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(30, 41, 59, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: '#64748b',
                      }}
                    >
                      <UserX style={{ width: '28px', height: '28px' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 0.4rem' }}>
                      Không tìm thấy hội viên nào
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                      Không có kết quả phù hợp với từ khóa "{searchKeyword}". Hãy thử thay đổi tiêu chí tìm kiếm.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isCurrentActive = member.membershipStatus === 'ACTIVE';
                  const isExpired = member.membershipStatus === 'EXPIRED';

                  return (
                    <tr
                      key={member.userId}
                      style={{
                        borderBottom: '1px solid #15203b',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d1833')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      onClick={() => handleViewDetail(member.userId)}
                    >
                      {/* Mã & Họ Tên */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '0.65rem',
                              background: 'linear-gradient(135deg, #1e40af, #0284c7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: '#ffffff',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', display: 'block' }}>
                              #MEM-{String(member.userId).padStart(4, '0')}
                            </span>
                            <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
                              {member.fullName}
                            </strong>
                          </div>
                        </div>
                      </td>

                      {/* Liên Hệ */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                            <Phone style={{ width: '13px', height: '13px', color: '#38bdf8' }} />
                            <span>{member.phone || 'Chưa có SĐT'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.775rem' }}>
                            <Mail style={{ width: '13px', height: '13px', color: '#818cf8' }} />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Gói Tập Hiện Tại */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {isCurrentActive ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: '#38bdf8' }}>{member.currentPackageName}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Loại: {member.currentPackageType || 'GYM_ACCESS'}</span>
                          </div>
                        ) : isExpired ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{member.currentPackageName}</span>
                            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Đã hết hạn</span>
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>Chưa đăng ký gói</span>
                        )}
                      </td>

                      {/* Thời Hạn & Số Ngày */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {isCurrentActive ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '0.2rem 0.55rem',
                                borderRadius: '9999px',
                                width: 'fit-content',
                                backgroundColor: member.daysRemaining > 7 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: member.daysRemaining > 7 ? '#34d399' : '#fbbf24',
                                border: `1px solid ${member.daysRemaining > 7 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                              }}
                            >
                              <Clock style={{ width: '12px', height: '12px' }} />
                              Còn {member.daysRemaining} ngày
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Hết hạn: {formatDate(member.membershipEndDate)}
                            </span>
                          </div>
                        ) : isExpired ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#f87171',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.35rem',
                            }}
                          >
                            Hết hạn từ {formatDate(member.membershipEndDate)}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>

                      {/* Trạng Thái TK */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.65rem',
                            borderRadius: '9999px',
                            backgroundColor: member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: member.status === 'ACTIVE' ? '#34d399' : '#f87171',
                            border: `1px solid ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {member.status === 'ACTIVE' ? '● Hoạt động' : '● Tạm khóa'}
                        </span>
                      </td>

                      {/* Thao Tác */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(member.userId);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.5rem 0.85rem',
                            backgroundColor: '#111d38',
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#182b52';
                            e.currentTarget.style.borderColor = '#38bdf8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#111d38';
                            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                          }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                          <span>Xem chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#0c1630',
            borderTop: '1px solid #162444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          <span>Hiển thị {members.length} hội viên</span>
          <span>Bấm vào hàng bất kỳ để xem hồ sơ hội viên đầy đủ</span>
        </div>
      </div>

      {/* ================= MEMBER DETAIL MODAL ================= */}
      {selectedMemberDetail && (
        <MemberDetailModal
          member={selectedMemberDetail}
          onClose={() => setSelectedMemberDetail(null)}
        />
      )}
    </div>
  );
};

export default MemberManagementView;
