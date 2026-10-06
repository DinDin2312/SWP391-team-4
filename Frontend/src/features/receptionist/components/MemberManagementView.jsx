import { formatDate as displayFormatDate } from '../../../utils/displayFormat';
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

    const formatDate = displayFormatDate;

  // Stats calculation
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const hasActivePackageCount = members.filter((m) => m.membershipStatus === 'ACTIVE').length;
  const expiredPackageCount = members.filter((m) => m.membershipStatus === 'EXPIRED').length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* ================= PAGE HEADER ================= */}
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                    Member Search & Directory
                </h1>
                <span
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        border: '1px solid var(--border)',
                    }}
                >
              Front Desk
            </span>
            </div>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Search members by Name, Phone number, Email or Member ID (#MEM). View membership status and course history.
            </p>
        </div>

        <button
            onClick={fetchMembers}
            disabled={loading}
            // ...style giữ nguyên...
        >
            <RefreshCw style={{ width: '15px', height: '15px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh List</span>
        </button>

      {/* ================= STATS OVERVIEW CARDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Tổng số hội viên */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Users style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Members</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.1rem' }}>
              {totalCount}
            </div>
          </div>
        </div>

        {/* Card 2: Tài khoản hoạt động */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--success-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-text)',
            }}
          >
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Accounts</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success-text)', marginTop: '0.1rem' }}>
              {activeCount}
            </div>
          </div>
        </div>

        {/* Card 3: Có gói tập hiệu lực */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--primary-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <CreditCard style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Packages</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.1rem' }}>
              {hasActivePackageCount}
            </div>
          </div>
        </div>

        {/* Card 4: Gói hết hạn */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--danger-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger-text)',
            }}
          >
            <AlertCircle style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Expired Packages</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger-text)', marginTop: '0.1rem' }}>
              {expiredPackageCount}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SEARCH & FILTER CONTROL BAR ================= */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
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
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by Member Name, Phone (09xx), Email or ID (#MEM)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                color: 'var(--text)',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--border)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
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
                  color: 'var(--text-muted)',
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
                    // ...style giữ nguyên...
                >
                    <option value="ALL">All Account Status</option>
                    <option value="ACTIVE">● Active</option>
                    <option value="INACTIVE">● Inactive</option>
                </select>
            </div>

            {/* Filter: Membership Package Status */}
            <div style={{ minWidth: '200px' }}>
                <select
                    value={selectedPackageStatus}
                    onChange={(e) => setSelectedPackageStatus(e.target.value)}
                    // ...style giữ nguyên...
                >
                    <option value="ALL">All Package Status</option>
                    <option value="ACTIVE">🟢 Active Package</option>
                    <option value="EXPIRED">🔴 Expired Package</option>
                    <option value="NO_MEMBERSHIP">⚪ No Package</option>
                </select>
            </div>
        </div>

        {/* Active Filter Chips indicator */}
        {(searchKeyword || selectedStatus !== 'ALL' || selectedPackageStatus !== 'ALL') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Filtering by:</span>
            {searchKeyword && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Keyword: "${searchKeyword}"
                <button
                  onClick={() => setSearchKeyword('')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--success-text)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Status: ${selectedStatus}
                <button
                  onClick={() => setSelectedStatus('ALL')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedPackageStatus !== 'ALL' && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--primary)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                Package: ${selectedPackageStatus}
                <button
                  onClick={() => setSelectedPackageStatus('ALL')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
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
                color: 'var(--danger-text)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
                Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* ================= MEMBERS TABLE ================= */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
                <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Member & Name</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Contact Info</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Current Package</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Validity & Days</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>Account Status</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'center' }}>Action</th>
                </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid var(--border)', borderTopColor: 'var(--border)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ marginTop: '0.75rem', margin: '0.75rem 0 0', fontSize: '0.9rem' }}>Searching member records...</p>
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
                        backgroundColor: 'var(--surface-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <UserX style={{ width: '28px', height: '28px' }} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', margin: '0 0 0.4rem' }}>
                        No members found
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                        No results found matching keyword "${searchKeyword}". Please try other filters.
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
                        borderBottom: '1px solid var(--border)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
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
                              background: 'linear-gradient(135deg, var(--primary-soft), var(--primary-soft))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: 'var(--text)',
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', display: 'block' }}>
                              #MEM-{String(member.userId).padStart(4, '0')}
                            </span>
                            <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                              {member.fullName}
                            </strong>
                          </div>
                        </div>
                      </td>

                      {/* Liên Hệ */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text)', fontSize: '0.85rem' }}>
                            <Phone style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
                            <span>{member.phone || 'No phone'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                            <Mail style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Gói Tập Hiện Tại */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {isCurrentActive ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{member.currentPackageName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type: {member.currentPackageType || 'COMBO'}</span>
                          </div>
                        ) : isExpired ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>{member.currentPackageName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--danger-text)' }}>Expired</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>No Package Enrolled</span>
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
                                backgroundColor: member.daysRemaining > 7 ? 'var(--success-soft)' : 'var(--warning-soft)',
                                color: member.daysRemaining > 7 ? 'var(--success-text)' : 'var(--warning-text)',
                                border: `1px solid ${member.daysRemaining > 7 ? 'var(--border)' : 'var(--border)'}`,
                              }}
                            >
                              <Clock style={{ width: '12px', height: '12px' }} />
                              {member.daysRemaining} days left
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Expires on: {formatDate(member.membershipEndDate)}
                            </span>
                          </div>
                        ) : isExpired ? (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'var(--danger-text)',
                              backgroundColor: 'var(--danger-soft)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '0.35rem',
                            }}
                          >
                            Expired since {formatDate(member.membershipEndDate)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
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
                            backgroundColor: member.status === 'ACTIVE' ? 'var(--success-soft)' : 'var(--danger-soft)',
                            color: member.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)',
                            border: `1px solid ${member.status === 'ACTIVE' ? 'var(--border)' : 'var(--border)'}`,
                          }}
                        >
                          {member.status === 'ACTIVE' ? '● Active' : '● Inactive'}
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
                            backgroundColor: 'var(--surface)',
                            color: 'var(--primary)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                          }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                          <span>View Details</span>
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
                  backgroundColor: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
              }}
          >
              <span>Showing {members.length} members</span>
              <span>Click any row to view complete member profile</span>
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
