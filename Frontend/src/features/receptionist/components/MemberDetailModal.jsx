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
    Check,
    RotateCw,
    RefreshCw,
    Users
} from 'lucide-react';
import receptionistService from '../services/receptionistService';

const MemberDetailModal = ({ member, onClose }) => {
    const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'bookings' | 'profile'
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Helper gom các buổi học lẻ thành từng khóa học
    const groupBookingsByCourse = (bookingsList) => {
        const grouped = {};
        (bookingsList || []).forEach((b) => {
            const key = b.className || 'Unknown Course';
            if (!grouped[key]) {
                grouped[key] = {
                    courseName: key,
                    coachName: b.coachName || 'N/A',
                    roomName: b.roomName || 'N/A',
                    firstSessionDate: b.startTime,
                    lastSessionDate: b.startTime,
                    sessionsCount: 0,
                    attendedCount: 0,
                    absentCount: 0,
                    pendingCount: 0,
                    sampleBookingId: b.bookingId,
                };
            }
            grouped[key].sessionsCount += 1;
            if (b.attendanceStatus === 'PRESENT') grouped[key].attendedCount += 1;
            else if (b.attendanceStatus === 'ABSENT') grouped[key].absentCount += 1;
            else grouped[key].pendingCount += 1;

            if (new Date(b.startTime) < new Date(grouped[key].firstSessionDate)) {
                grouped[key].firstSessionDate = b.startTime;
            }
            if (new Date(b.startTime) > new Date(grouped[key].lastSessionDate)) {
                grouped[key].lastSessionDate = b.startTime;
                grouped[key].sampleBookingId = b.bookingId;
            }
        });
        return Object.values(grouped);
    };

    // States for Class Renewal Flow
    const [renewalLoading, setRenewalLoading] = useState(false);
    const [suggestedClass, setSuggestedClass] = useState(null);
    const [renewalModalOpen, setRenewalModalOpen] = useState(false);
    const [confirmingRenewal, setConfirmingRenewal] = useState(false);
    const [renewalFeedback, setRenewalFeedback] = useState(null);

    if (!member) return null;

    const handleCopyPhone = () => {
        if (member.phone) {
            navigator.clipboard.writeText(member.phone);
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'MB';
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
            return date.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
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
            return dt.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dtStr;
        }
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '0 VND';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // 1. Fetch renewal suggestion
    const handleOpenRenewal = async (bookingId) => {
        setRenewalLoading(true);
        setRenewalFeedback(null);
        try {
            const data = await receptionistService.suggestNextClassRenewal(member.userId, bookingId);
            setSuggestedClass(data);
            setRenewalModalOpen(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'No upcoming recurring schedule found for this class.';
            alert(`Course Renewal Notice: ${msg}`);
        } finally {
            setRenewalLoading(false);
        }
    };

    // 2. Confirm renewal
    const handleConfirmRenewal = async () => {
        if (!suggestedClass) return;
        setConfirmingRenewal(true);
        setRenewalFeedback(null);

        try {
            await receptionistService.confirmClassRenewal({
                userId: member.userId,
                newScheduleId: suggestedClass.suggestedScheduleId,
                previousBookingId: suggestedClass.currentBookingId,
            });

            setRenewalFeedback({
                type: 'success',
                message: 'Successfully enrolled into the next recurring class!'
            });

            setTimeout(() => {
                setRenewalModalOpen(false);
                setSuggestedClass(null);
                if (onClose) onClose(); // Refresh or close
            }, 1500);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to enroll into next class.';
            setRenewalFeedback({ type: 'error', message: msg });
        } finally {
            setConfirmingRenewal(false);
        }
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
                    maxWidth: '920px',
                    maxHeight: '90vh',
                    backgroundColor: '#0a1120',
                    border: '1px solid #1e293b',
                    borderRadius: '1.25rem',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
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
                  {member.status === 'ACTIVE' ? '● Active' : '● Inactive'}
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
                                        title="Click to copy phone number"
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
                                        {copiedPhone && <Check style={{ width: '12px', height: '12px', color: '#34d399' }} />}
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
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Active Package</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.currentMembershipStatus === 'ACTIVE' ? '#38bdf8' : '#e2e8f0', marginTop: '0.2rem' }}>
                            {member.currentPackageName || 'No Active Package'}
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Days Remaining</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.daysRemaining > 0 ? '#34d399' : '#f87171', marginTop: '0.2rem' }}>
                            {member.currentMembershipStatus === 'ACTIVE' ? `${member.daysRemaining} days` : 'Expired / None'}
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Enrolled Classes</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f8fafc', marginTop: '0.2rem' }}>
                            {member.totalBookingsCount ?? member.bookings?.length ?? 0} sessions
                        </div>
                    </div>
                    <div style={{ backgroundColor: '#0b1329', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Attendance</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#a78bfa', marginTop: '0.2rem' }}>
                            {member.attendedCount ?? 0} present / {member.absentCount ?? 0} absent
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
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <CreditCard style={{ width: '16px', height: '16px' }} />
                        <span>Packages & Passes ({member.memberships?.length || 0})</span>
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
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <CalendarDays style={{ width: '16px', height: '16px' }} />
                        <span>Classes & Attendance ({member.bookings?.length || 0})</span>
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
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <User style={{ width: '16px', height: '16px' }} />
                        <span>Profile & Notes</span>
                    </button>
                </div>

                {/* ================= TAB CONTENTS ================= */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
                    {/* TAB 1: GÓI TẬP */}
                    {activeTab === 'packages' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {member.currentMembershipStatus === 'ACTIVE' && (
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(6, 78, 59, 0.3) 100%)',
                                        border: '1px solid rgba(59, 130, 246, 0.4)',
                                        borderRadius: '1rem',
                                        padding: '1.25rem 1.5rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Award style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
                                                <span style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                          Currently Active Package
                        </span>
                                            </div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ffffff', margin: '0.4rem 0 0.2rem' }}>
                                                {member.currentPackageName}
                                            </h3>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>
                                                Type: <strong style={{ color: '#e2e8f0' }}>{member.currentPackageType || 'COMBO_PROMO'}</strong>
                                            </p>
                                        </div>

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
                                            {member.daysRemaining} days left
                    </span>
                                    </div>
                                </div>
                            )}

                            {/* Package History */}
                            <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.75rem' }}>
                                    Package History
                                </h4>

                                {(!member.memberships || member.memberships.length === 0) ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.75rem', border: '1px dashed #334155', color: '#94a3b8' }}>
                                        <CreditCard style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No package history found for this member.</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '0.75rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                            <thead>
                                            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Package Name</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Type</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Price</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Start Date</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>End Date</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {member.memberships.map((pkg, idx) => (
                                                <tr key={pkg.membershipId || idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>{pkg.packageName}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{pkg.packageType || 'COMBO'}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0' }}>{formatCurrency(pkg.price)}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{formatDate(pkg.startDate)}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{formatDate(pkg.endDate)}</td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: pkg.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: pkg.active ? '#34d399' : '#94a3b8' }}>
                                {pkg.active ? 'Active' : 'Expired'}
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

                    {/* TAB 2: LỚP HỌC & CỘT GIA HẠN KHÓA NỐI TIẾP */}
                    {activeTab === 'bookings' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', margin: 0 }}>
                                    Course Schedule & Attendance Records
                                </h4>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Click "Renew Course" to enroll member into the next upcoming session.
                </span>
                            </div>

                            {(!member.bookings || member.bookings.length === 0) ? (
                                <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: '0.75rem', border: '1px dashed #334155', color: '#94a3b8' }}>
                                    <CalendarDays style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0 }}>No course bookings found for this member.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '0.75rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                        <thead>
                                        <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Course Name</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Coach</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Room</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Course Timeline</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Attendance Summary</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>Action</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {groupBookingsByCourse(member.bookings).map((course, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                                                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>
                                                    {course.courseName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                                                    {course.coachName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                                                    {course.roomName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                                                    {formatDateTime(course.firstSessionDate)} → {formatDateTime(course.lastSessionDate)}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                                        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{course.sessionsCount} sessions</span>
                                                        <span style={{ color: '#64748b' }}>•</span>
                                                        <span style={{ color: '#34d399' }}>{course.attendedCount} present</span>
                                                        {course.absentCount > 0 && (
                                                            <>
                                                                <span style={{ color: '#64748b' }}>•</span>
                                                                <span style={{ color: '#f87171' }}>{course.absentCount} absent</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleOpenRenewal(course.sampleBookingId)}
                                                        disabled={renewalLoading}
                                                        title="Find and enroll into next recurring course"
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.4rem 0.75rem',
                                                            backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                                            border: '1px solid rgba(56, 189, 248, 0.3)',
                                                            color: '#38bdf8',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)')}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)')}
                                                    >
                                                        <RotateCw style={{ width: '13px', height: '13px' }} />
                                                        <span>Renew Course</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: PROFILE */}
                    {activeTab === 'profile' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User style={{ width: '18px', height: '18px' }} /> Account Information
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                                    <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Full Name</span><strong style={{ color: '#f8fafc' }}>{member.fullName}</strong></div>
                                    <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Member ID</span><strong style={{ color: '#f8fafc', fontFamily: 'monospace' }}>#MEM-{String(member.userId).padStart(4, '0')}</strong></div>
                                    <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Phone</span><strong style={{ color: '#f8fafc' }}>{member.phone || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Email</span><strong style={{ color: '#f8fafc' }}>{member.email || 'N/A'}</strong></div>
                                    <div><span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>System Role</span><strong style={{ color: '#60a5fa' }}>{member.roleName || 'Member'}</strong></div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText style={{ width: '18px', height: '18px' }} /> Sports Interests & Notes
                                </h4>
                                <div style={{ backgroundColor: '#0a101f', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '1rem', minHeight: '140px', color: member.bio ? '#e2e8f0' : '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    {member.bio || 'No notes or sports interests recorded for this member.'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= MODAL FOOTER ================= */}
                <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid #1e293b', backgroundColor: '#070d18', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        NEXUS Sports Center Receptionist Portal
                    </div>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.5rem 1.25rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
                    >
                        Close
                    </button>
                </div>

                {/* ================= RENEWAL CONFIRMATION POPUP MODAL ================= */}
                {renewalModalOpen && suggestedClass && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10000,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '520px',
                                backgroundColor: '#0c1527',
                                border: '1px solid #2563eb',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCw style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                        Confirm Next Course Renewal
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setRenewalModalOpen(false)}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    <X style={{ width: '18px', height: '18px' }} />
                                </button>
                            </div>

                            {renewalFeedback && (
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    backgroundColor: renewalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    border: `1px solid ${renewalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    color: renewalFeedback.type === 'success' ? '#34d399' : '#f87171',
                                    fontSize: '0.85rem'
                                }}>
                                    {renewalFeedback.message}
                                </div>
                            )}

                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 1rem' }}>
                                System automatically found the closest recurring session for member <strong>{member.fullName}</strong>:
                            </p>

                            <div style={{ backgroundColor: '#060b17', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Course:</span>
                                    <strong style={{ color: '#f8fafc' }}>{suggestedClass.className}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Coach:</span>
                                    <span style={{ color: '#cbd5e1' }}>{suggestedClass.coachName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Room:</span>
                                    <span style={{ color: '#cbd5e1' }}>{suggestedClass.roomName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Starts On:</span>
                                    <strong style={{ color: '#38bdf8' }}>{formatDateTime(suggestedClass.startTime)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Course Fee:</span>
                                    <strong style={{ color: '#34d399' }}>{formatCurrency(suggestedClass.price)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Available Slots:</span>
                                    <span style={{ color: '#e2e8f0' }}>{suggestedClass.availableSlots} / {suggestedClass.maxSlots} slots left</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                                <button
                                    onClick={() => setRenewalModalOpen(false)}
                                    disabled={confirmingRenewal}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        backgroundColor: '#1e293b',
                                        color: '#cbd5e1',
                                        border: '1px solid #334155',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRenewal}
                                    disabled={confirmingRenewal}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.6rem 1.25rem',
                                        backgroundColor: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: confirmingRenewal ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {confirmingRenewal ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                                    <span>{confirmingRenewal ? 'Enrolling...' : 'Confirm & Enroll'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberDetailModal;