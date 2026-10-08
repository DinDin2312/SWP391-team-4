import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDate as displayFormatDate, formatDateTime as displayFormatDateTime, formatMoney } from '../../../utils/displayFormat';
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
  useLanguage();
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

    const formatDate = displayFormatDate;

    const formatDateTime = displayFormatDateTime;

    const formatCurrency = formatMoney;

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
                message: t('Successfully enrolled into the next recurring class!')
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
                backgroundColor: 'var(--surface-hover)',
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
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '1.25rem',
                    boxShadow: 'var(--shadow)',
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
                        background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--surface-hover) 100%)',
                        borderBottom: '1px solid var(--border)',
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
                                background: 'linear-gradient(135deg, var(--primary-soft), var(--primary-soft))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text)',
                                boxShadow: 'var(--shadow)',
                                border: '2px solid var(--border)',
                                flexShrink: 0,
                            }}
                        >
                            {getInitials(member.fullName)}
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                    {member.fullName}
                                </h2>
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '9999px',
                                        backgroundColor: member.status === 'ACTIVE' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                        color: member.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)',
                                        border: `1px solid ${member.status === 'ACTIVE' ? 'var(--border)' : 'var(--border)'}`,
                                    }}
                                >
                  {t(member.status === 'ACTIVE' ? t('● Active') : t('● Inactive'))}
                </span>
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        backgroundColor: 'var(--surface)',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.375rem',
                                        fontFamily: 'monospace',
                                    }}
                                >{t("#MEM-")}{String(member.userId).padStart(4, '0')}
                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {member.phone && (
                                    <button
                                        onClick={handleCopyPhone}
                                        title={t("Click to copy phone number")}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--text)',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        <Phone style={{ width: '14px', height: '14px', color: 'var(--primary)' }} />
                                        <span>{member.phone}</span>
                                        {copiedPhone && <Check style={{ width: '12px', height: '12px', color: 'var(--success-text)' }} />}
                                    </button>
                                )}
                                {member.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                        <Mail style={{ width: '14px', height: '14px', color: 'var(--violet)' }} />
                                        <span>{member.email}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--surface-hover)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
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
                        backgroundColor: 'var(--surface)',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <div style={{ backgroundColor: 'var(--surface)', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t("Active Package")}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.currentMembershipStatus === 'ACTIVE' ? 'var(--primary)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                            {t(member.currentPackageName || 'No Active Package')}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface)', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t("Days Remaining")}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: member.daysRemaining > 0 ? 'var(--success-text)' : 'var(--danger-text)', marginTop: '0.2rem' }}>
                            {t(member.currentMembershipStatus === 'ACTIVE' ? `${member.daysRemaining} days` : t('Expired / None'))}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface)', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t("Total Enrolled Classes")}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginTop: '0.2rem' }}>
                            {member.totalBookingsCount ?? member.bookings?.length ?? 0}{' '}{t("sessions")}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface)', padding: '0.875rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t("Attendance")}</span>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--violet)', marginTop: '0.2rem' }}>
                            {member.attendedCount ?? 0}{' '}{t("present /")}{member.absentCount ?? 0}{' '}{t("absent")}</div>
                    </div>
                </div>

                {/* ================= NAV TABS ================= */}
                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        padding: '0.75rem 1.75rem 0',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
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
                            color: activeTab === 'packages' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'packages' ? '2px solid var(--primary)' : '2px solid transparent',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <CreditCard style={{ width: '16px', height: '16px' }} />
                        <span>{t("Packages & Passes (")}{' '}{member.memberships?.length || 0})</span>
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
                            color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'bookings' ? '2px solid var(--primary)' : '2px solid transparent',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <CalendarDays style={{ width: '16px', height: '16px' }} />
                        <span>{t("Classes & Attendance (")}{' '}{member.bookings?.length || 0})</span>
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
                            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <User style={{ width: '16px', height: '16px' }} />
                        <span>{t("Profile & Notes")}</span>
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
                                        background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--success-soft) 100%)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '1rem',
                                        padding: '1.25rem 1.5rem',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Award style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{t("Currently Active Package")}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', margin: '0.4rem 0 0.2rem' }}>
                                                {member.currentPackageName}
                                            </h3>
                                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t("Type:")}<strong style={{ color: 'var(--text)' }}>{t(member.currentPackageType || 'COMBO_PROMO')}</strong>
                                            </p>
                                        </div>

                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                backgroundColor: 'var(--success-soft)',
                                                color: 'var(--success-text)',
                                                border: '1px solid var(--border)',
                                                padding: '0.35rem 0.85rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                            }}
                                        >
                      <Clock style={{ width: '14px', height: '14px' }} />
                                            {member.daysRemaining}{' '}{t("days left")}</span>
                                    </div>
                                </div>
                            )}

                            {/* Package History */}
                            <div>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.75rem' }}>{t("Package History")}</h4>

                                {(!member.memberships || member.memberships.length === 0) ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--surface-hover)', borderRadius: '0.75rem', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                                        <CreditCard style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>{t("No package history found for this member.")}</p>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                            <thead>
                                            <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Package Name")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Type")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Price")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Start Date")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("End Date")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Status")}</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {member.memberships.map((pkg, idx) => (
                                                <tr key={pkg.membershipId || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text)' }}>{pkg.packageName}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{t(pkg.packageType || 'COMBO')}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>{formatCurrency(pkg.price)}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>{formatDate(pkg.startDate)}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>{formatDate(pkg.endDate)}</td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: pkg.active ? t('var(--success-soft)') : t('var(--primary-soft)'), color: pkg.active ? t('var(--success-text)') : t('var(--text-muted)') }}>
                                {t(pkg.active ? t('Active') : t('Expired'))}
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
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{t("Course Schedule & Attendance Records")}</h4>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t("Click \"Renew Course\" to enroll member into the next upcoming session.")}</span>
                            </div>

                            {(!member.bookings || member.bookings.length === 0) ? (
                                <div style={{ padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--surface-hover)', borderRadius: '0.75rem', border: '1px dashed var(--border)', color: 'var(--text-muted)' }}>
                                    <CalendarDays style={{ width: '32px', height: '32px', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                                    <p style={{ margin: 0 }}>{t("No course bookings found for this member.")}</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                                        <thead>
                                        <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Course Name")}</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Coach")}</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Room")}</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Course Timeline")}</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Attendance Summary")}</th>
                                            <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>{t("Action")}</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {groupBookingsByCourse(member.bookings).map((course, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text)' }}>
                                                    {course.courseName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>
                                                    {course.coachName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                                                    {course.roomName}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                                                    {formatDateTime(course.firstSessionDate)} → {formatDateTime(course.lastSessionDate)}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{course.sessionsCount}{' '}{t("sessions")}</span>
                                                        <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                        <span style={{ color: 'var(--success-text)' }}>{course.attendedCount}{' '}{t("present")}</span>
                                                        {course.absentCount > 0 && (
                                                            <>
                                                                <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                                <span style={{ color: 'var(--danger-text)' }}>{course.absentCount}{' '}{t("absent")}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleOpenRenewal(course.sampleBookingId)}
                                                        disabled={renewalLoading}
                                                        title={t("Find and enroll into next recurring course")}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.4rem 0.75rem',
                                                            backgroundColor: 'var(--primary-soft)',
                                                            border: '1px solid var(--border)',
                                                            color: 'var(--primary)',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-soft)')}
                                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary-soft)')}
                                                    >
                                                        <RotateCw style={{ width: '13px', height: '13px' }} />
                                                        <span>{t("Renew Course")}</span>
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
                            <div style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User style={{ width: '18px', height: '18px' }} />{t("Account Information")}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                                    <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t("Full Name")}</span><strong style={{ color: 'var(--text)' }}>{member.fullName}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t("Member ID")}</span><strong style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{t("#MEM-")}{String(member.userId).padStart(4, '0')}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t("Phone")}</span><strong style={{ color: 'var(--text)' }}>{t(member.phone || 'N/A')}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t("Email")}</span><strong style={{ color: 'var(--text)' }}>{t(member.email || 'N/A')}</strong></div>
                                    <div><span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{t("System Role")}</span><strong style={{ color: 'var(--primary)' }}>{t(member.roleName || 'Member')}</strong></div>
                                </div>
                            </div>

                            <div style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText style={{ width: '18px', height: '18px' }} />{t("Sports Interests & Notes")}</h4>
                                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem', minHeight: '140px', color: member.bio ? 'var(--text-muted)' : 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    {t(member.bio || 'No notes or sports interests recorded for this member.')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ================= MODAL FOOTER ================= */}
                <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t("NEXUS Sports Center Receptionist Portal")}</div>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.5rem 1.25rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
                    >{t("Close")}</button>
                </div>

                {/* ================= RENEWAL CONFIRMATION POPUP MODAL ================= */}
                {renewalModalOpen && suggestedClass && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10000,
                            backgroundColor: 'var(--surface-hover)',
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
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                boxShadow: 'var(--shadow)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <RotateCw style={{ width: '20px', height: '20px', color: 'var(--primary)' }} />
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t("Confirm Next Course Renewal")}</h3>
                                </div>
                                <button
                                    onClick={() => setRenewalModalOpen(false)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    <X style={{ width: '18px', height: '18px' }} />
                                </button>
                            </div>

                            {renewalFeedback && (
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    marginBottom: '1rem',
                                    backgroundColor: renewalFeedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                    border: `1px solid ${renewalFeedback.type === 'success' ? 'var(--border)' : 'var(--border)'}`,
                                    color: renewalFeedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                                    fontSize: '0.85rem'
                                }}>
                                    {t(renewalFeedback.message)}
                                </div>
                            )}

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>{t("System automatically found the closest recurring session for member")}<strong>{member.fullName}</strong>:
                            </p>

                            <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Course:")}</span>
                                    <strong style={{ color: 'var(--text)' }}>{suggestedClass.className}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Coach:")}</span>
                                    <span style={{ color: 'var(--text)' }}>{suggestedClass.coachName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Room:")}</span>
                                    <span style={{ color: 'var(--text)' }}>{suggestedClass.roomName}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Starts On:")}</span>
                                    <strong style={{ color: 'var(--primary)' }}>{formatDateTime(suggestedClass.startTime)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Course Fee:")}</span>
                                    <strong style={{ color: 'var(--success-text)' }}>{formatCurrency(suggestedClass.price)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>{t("Available Slots:")}</span>
                                    <span style={{ color: 'var(--text)' }}>{suggestedClass.availableSlots} / {suggestedClass.maxSlots}{' '}{t("slots left")}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                                <button
                                    onClick={() => setRenewalModalOpen(false)}
                                    disabled={confirmingRenewal}
                                    style={{
                                        padding: '0.6rem 1rem',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >{t("Cancel")}</button>
                                <button
                                    onClick={handleConfirmRenewal}
                                    disabled={confirmingRenewal}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.6rem 1.25rem',
                                        backgroundColor: 'var(--primary)',
                                        color: 'var(--on-primary)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: confirmingRenewal ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {confirmingRenewal ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                                    <span>{t(confirmingRenewal ? t('Enrolling...') : t('Confirm & Enroll'))}</span>
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