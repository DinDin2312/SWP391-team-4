import React, { useState } from 'react';
import {
  X,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Shield,
  FileText,
  AlertTriangle,
  Award,
  CalendarDays,
  MapPin,
  Flame,
  Check
} from 'lucide-react';

const MemberDetailModal = ({ member, onClose }) => {
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'bookings' | 'profile'
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!member) return null;

  const handleCopyPhone = () => {
    if (member.phone) {
      navigator.clipboard.writeText(member.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
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

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '—';
    try {
      const dt = new Date(dtStr);
      if (isNaN(dt.getTime())) return dtStr;
      return dt.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dtStr;
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          backgroundColor: '#0a1120',
          border: '1px solid #1e293b',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div
          style={{
            position: 'relative',
            padding: '1.5rem 1.75rem',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Avatar Circle */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#ffffff',
                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0,
              }}
            >
              {getInitials(member.fullName)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  {member.fullName}
                </h2>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    backgroundColor: member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: member.status === 'ACTIVE' ? '#34d399' : '#f87171',
                    border: `1px solid ${member.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  {member.status === 'ACTIVE' ? '● Đang hoạt động' : '● Tạm khóa'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    backgroundColor: '#1e293b',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '0.375rem',
                    fontFamily: 'monospace',
                  }}
                >
                  #MEM-{String(member.userId).padStart(4, '0')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {member.phone && (
                  <button
                    onClick={handleCopyPhone}
                    title="Bấm để sao chép SĐT"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'none',
                      border: 'none',
                      color: '#cbd5e1',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <Phone style={{ width: '14px', height: '14px', color: '#38bdf8' }} />
                    <span>{member.phone}</span>
                    {copiedPhone ? (
                      <Check style={{ width: '12px', height: '12px', color: '#34d399' }} />
                    ) : null}
                  </button>
                )}
                {member.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                    <Mail style={{ width: '14px', height: '14px', color: '#a855f7' }} />
                    <span>{member.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '0.5rem',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#64748b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = '#334155';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* ================= SUMMARY STATS BAR ================= */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Gói tập hiện tại</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.currentMembershipStatus === 'ACTIVE' ? '#38bdf8' : '#e2e8f0', marginTop: '0.2rem' }}>
              {member.currentPackageName || 'Chưa đăng ký gói'}
            </div>
          </div>
          <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Thời hạn còn lại</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.daysRemaining > 0 ? '#34d399' : '#f87171', marginTop: '0.2rem' }}>
              {member.currentMembershipStatus === 'ACTIVE' ? `${member.daysRemaining} ngày` : 'Hết hạn / Không có'}
            </div>
          </div>
          <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Số lớp đã đặt</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc', marginTop: '0.2rem' }}>
              {member.totalBookingsCount ?? member.bookings?.length ?? 0} buổi
            </div>
          </div>
          <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Chuyên cần</span>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#a78bfa', marginTop: '0.2rem' }}>
              {member.attendedCount ?? 0} có mặt / {member.absentCount ?? 0} vắng
            </div>
          </div>
        </div>

        {/* ================= NAV TABS ================= */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.75rem 0',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#0a1120',
          }}
        >
          <button
            onClick={() => setActiveTab('packages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'packages' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'packages' ? '2px solid #38bdf8' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CreditCard style={{ width: '16px', height: '16px' }} />
            <span>Gói tập & Thời hạn ({member.memberships?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'bookings' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'bookings' ? '2px solid #38bdf8' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <CalendarDays style={{ width: '16px', height: '16px' }} />
            <span>Lớp học & Điểm danh ({member.bookings?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: activeTab === 'profile' ? '#38bdf8' : '#94a3b8',
              borderBottom: activeTab === 'profile' ? '2px solid #38bdf8' : '2px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <User style={{ width: '16px', height: '16px' }} />
            <span>Thông tin cá nhân & Ghi chú</span>
          </button>
        </div>

        {/* ================= TAB CONTENTS ================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {/* TAB 1: GÓI TẬP & THỜI HẠN */}
          {activeTab === 'packages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Highlight Card for Current Active Package */}
              {member.currentMembershipStatus === 'ACTIVE' && (
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(6, 78, 59, 0.3) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '1rem',
                    padding: '1.25rem 1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                        <span style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                          Gói tập đang hoạt động
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', margin: '0.4rem 0 0.2rem' }}>
                        {member.currentPackageName}
                      </h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                        Loại gói: <strong style={{ color: '#e2e8f0' }}>{member.currentPackageType || 'GYM_ACCESS'}</strong>
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          padding: '0.35rem 0.85rem',
                          borderRadius: '9999px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                        }}
                      >
                        <Clock style={{ width: '14px', height: '14px' }} />
                        Còn {member.daysRemaining} ngày sử dụng
                      </span>
                    </div>
                  </div>

                  {/* Progress bar indication */}
                  <div style={{ marginTop: '1rem' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, Math.max(10, member.daysRemaining * 3))}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Package History Table */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem' }}>
                  Lịch sử đăng ký & gia hạn gói tập
                </h4>

                {(!member.memberships || member.memberships.length === 0) ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '0.75rem',
                      border: '1px dashed #334155',
                      color: '#94a3b8',
                    }}
                  >
                    <CreditCard style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>Hội viên chưa có lịch sử đăng ký gói tập nào.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tên gói tập</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Loại</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Giá gói</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Ngày bắt đầu</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Ngày hết hạn</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody style={{ divideY: '1px solid #1e293b' }}>
                        {member.memberships.map((pkg, idx) => (
                          <tr
                            key={pkg.membershipId || idx}
                            style={{
                              borderBottom: '1px solid #1e293b',
                              backgroundColor: pkg.active ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                            }}
                          >
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{pkg.packageName}</span>
                                {pkg.active && (
                                  <span style={{ fontSize: '0.65rem', backgroundColor: '#2563eb', color: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', fontWeight: 700 }}>
                                    ĐANG DÙNG
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{pkg.packageType || 'GYM_ACCESS'}</td>
                            <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0', fontWeight: 500 }}>
                              {formatCurrency(pkg.price)}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{formatDate(pkg.startDate)}</td>
                            <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{formatDate(pkg.endDate)}</td>
                            <td style={{ padding: '0.85rem 1rem' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '0.2rem 0.6rem',
                                  borderRadius: '9999px',
                                  backgroundColor: pkg.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                  color: pkg.active ? '#34d399' : '#94a3b8',
                                  border: `1px solid ${pkg.active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                                }}
                              >
                                {pkg.active ? 'Hiệu lực' : 'Đã kết thúc'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LỚP HỌC & ĐIỂM DANH */}
          {activeTab === 'bookings' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem' }}>
                Danh sách lịch học & Trạng thái điểm danh
              </h4>

              {(!member.bookings || member.bookings.length === 0) ? (
                <div
                  style={{
                    padding: '2.5rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '0.75rem',
                    border: '1px dashed #334155',
                    color: '#94a3b8',
                  }}
                >
                  <CalendarDays style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>Hội viên chưa đăng ký tham gia lớp học nào.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '0.75rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Tên lớp học</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>HLV hướng dẫn</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Phòng tập</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Thời gian học</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Đặt chỗ</th>
                        <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Điểm danh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.bookings.map((b, idx) => (
                        <tr key={b.bookingId || idx} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                            {b.className}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            {b.coachName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                            {b.roomName}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                            {formatDateTime(b.startTime)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '0.2rem 0.5rem',
                                borderRadius: '0.375rem',
                                backgroundColor: b.bookingStatus === 'CONFIRMED' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: b.bookingStatus === 'CONFIRMED' ? '#60a5fa' : '#f87171',
                              }}
                            >
                              {b.bookingStatus === 'CONFIRMED' ? 'Đã xác nhận' : b.bookingStatus}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            {b.attendanceStatus === 'PRESENT' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                                <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                                Có mặt
                              </span>
                            )}
                            {b.attendanceStatus === 'ABSENT' && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}>
                                <XCircle style={{ width: '15px', height: '15px' }} />
                                Vắng mặt
                              </span>
                            )}
                            {(!b.attendanceStatus || b.attendanceStatus === 'NOT_YET') && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                                <Clock style={{ width: '14px', height: '14px' }} />
                                Chưa điểm danh
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: THÔNG TIN CÁ NHÂN & GHI CHÚ */}
          {activeTab === 'profile' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #1e293b',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User style={{ width: '18px', height: '18px' }} />
                  Thông tin tài khoản
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Họ và tên</span>
                    <strong style={{ color: '#f8fafc' }}>{member.fullName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Mã định danh thành viên</span>
                    <strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>#MEM-{String(member.userId).padStart(4, '0')}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Số điện thoại liên hệ</span>
                    <strong style={{ color: '#f8fafc' }}>{member.phone || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Địa chỉ Email</span>
                    <strong style={{ color: '#f8fafc' }}>{member.email || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Vai trò hệ thống</span>
                    <strong style={{ color: '#60a5fa' }}>{member.roleName || 'Member'}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #1e293b',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                }}
              >
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText style={{ width: '18px', height: '18px' }} />
                  Tiểu sử & Ghi chú sức khỏe
                </h4>

                <div
                  style={{
                    backgroundColor: '#0a101f',
                    border: '1px solid #1e293b',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    minHeight: '140px',
                    color: member.bio ? '#e2e8f0' : '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                  }}
                >
                  {member.bio || 'Chưa có ghi chú hoặc thông tin tiểu sử nào được lưu cho hội viên này.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#070d18',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
            Hệ thống quản lý trung tâm thể thao NEXUS Sports Center
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;
