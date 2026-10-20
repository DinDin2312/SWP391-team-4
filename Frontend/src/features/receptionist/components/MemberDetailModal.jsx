import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDate as displayFormatDate, formatDateTime as displayFormatDateTime, formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    User,
    CreditCard,
    CheckCircle2,
    Clock,
    Phone,
    Mail,
    FileText,
    AlertTriangle,
    Award,
    CalendarDays,
    Check,
    RotateCw,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Ban,
    Info,
    Banknote,
    Receipt,
    Printer
} from 'lucide-react';
import receptionistService from '../services/receptionistService';
import InvoiceReceiptModal from './InvoiceReceiptModal';

const MemberDetailModal = ({ member: initialMember, onClose }) => {
  useLanguage();
    const [member, setMemberData] = useState(initialMember);
    const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'bookings' | 'invoices' | 'profile'
    const [copiedPhone, setCopiedPhone] = useState(false);

    // Invoices Tab States
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [activeReceipt, setActiveReceipt] = useState(null);
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);

    useEffect(() => {
        setMemberData(initialMember);
    }, [initialMember]);

    const refreshMemberData = async () => {
        if (!member?.userId) return;
        try {
            const fresh = await receptionistService.getMemberDetail(member.userId);
            if (fresh) setMemberData(fresh);
        } catch (e) {
            console.error('Failed to reload member detail:', e);
        }
    };

    useEffect(() => {
        if (activeTab === 'invoices' && member?.userId) {
            setLoadingInvoices(true);
            receptionistService.getMemberInvoices(member.userId)
                .then((data) => setInvoices(Array.isArray(data) ? data : []))
                .catch((err) => {
                    console.error('Failed to load member invoices:', err);
                    setInvoices([]);
                })
                .finally(() => setLoadingInvoices(false));
        }
    }, [activeTab, member?.userId]);

    // Helper gom các buổi học lẻ thành từng khóa học kèm danh sách buổi chi tiết
    const groupBookingsByCourse = (bookingsList) => {
        const grouped = {};
        const now = new Date();
        (bookingsList || []).forEach((b) => {
            const key = b.classId ? `class_${b.classId}` : (b.className || 'Unknown Course');
            if (!grouped[key]) {
                grouped[key] = {
                    key: key,
                    courseName: b.className || 'Unknown Course',
                    classId: b.classId,
                    subjectId: b.subjectId,
                    subjectName: b.subjectName,
                    coachName: b.coachName || 'N/A',
                    roomName: b.roomName || 'N/A',
                    firstSessionDate: b.startTime,
                    lastSessionDate: b.startTime,
                    sessionsCount: 0,
                    attendedCount: 0,
                    absentCount: 0,
                    pendingCount: 0,
                    cancelledCount: 0,
                    upcomingCount: 0,
                    sampleBookingId: b.bookingId,
                    daysOfWeek: new Set(),
                    timeSlot: b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
                    sessions: [],
                };
            }
            if (b.subjectId && !grouped[key].subjectId) grouped[key].subjectId = b.subjectId;
            if (b.subjectName && !grouped[key].subjectName) grouped[key].subjectName = b.subjectName;
            if (b.startTime) {
                grouped[key].daysOfWeek.add(new Date(b.startTime).getDay());
                if (!grouped[key].timeSlot) {
                    grouped[key].timeSlot = new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                }
            }
            grouped[key].sessionsCount += 1;
            if (b.classId && !grouped[key].classId) {
                grouped[key].classId = b.classId;
            }
            if (b.coachName && grouped[key].coachName === 'N/A') {
                grouped[key].coachName = b.coachName;
            }
            if (b.roomName && grouped[key].roomName === 'N/A') {
                grouped[key].roomName = b.roomName;
            }

            const sessionEnd = b.endTime ? new Date(b.endTime) : (b.startTime ? new Date(b.startTime) : null);
            const isCancelled = b.bookingStatus === 'CANCELLED';
            const isPresent = b.attendanceStatus === 'PRESENT';
            const isAbsent = b.attendanceStatus === 'ABSENT';
            const isUpcoming = sessionEnd && sessionEnd > now && !isCancelled && !isPresent;

            if (isCancelled) {
                grouped[key].cancelledCount += 1;
            } else if (isPresent) {
                grouped[key].attendedCount += 1;
            } else if (isAbsent) {
                grouped[key].absentCount += 1;
            } else {
                grouped[key].pendingCount += 1;
            }

            if (isUpcoming) {
                grouped[key].upcomingCount += 1;
            }

            grouped[key].sessions.push({
                ...b,
                isUpcoming,
                isCancelled,
                isPresent,
                isAbsent,
            });

            if (new Date(b.startTime) < new Date(grouped[key].firstSessionDate)) {
                grouped[key].firstSessionDate = b.startTime;
            }
            if (new Date(b.startTime) > new Date(grouped[key].lastSessionDate)) {
                grouped[key].lastSessionDate = b.startTime;
                grouped[key].sampleBookingId = b.bookingId;
            }
        });

        // Sắp xếp các buổi học theo thời gian tăng dần
        Object.values(grouped).forEach((course) => {
            course.sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        });

        const courses = Object.values(grouped);
        // Sắp xếp các khóa học: Gom cùng bộ môn / loại lớp và sắp theo thời gian khai giảng
        courses.sort((a, b) => {
            const nameA = (a.subjectName || a.courseName || '').toLowerCase();
            const nameB = (b.subjectName || b.courseName || '').toLowerCase();
            const cmp = nameA.localeCompare(nameB, 'vi');
            if (cmp !== 0) return cmp;
            return new Date(a.firstSessionDate) - new Date(b.firstSessionDate);
        });

        return courses;
    };

    // States for Class Renewal Flow
    const [renewalLoading, setRenewalLoading] = useState(false);
    const [suggestedClass, setSuggestedClass] = useState(null);
    const [selectedRenewalClassId, setSelectedRenewalClassId] = useState(null);
    const [renewalModalOpen, setRenewalModalOpen] = useState(false);
    const [confirmingRenewal, setConfirmingRenewal] = useState(false);
    const [renewalFeedback, setRenewalFeedback] = useState(null);
    const [renewalNotice, setRenewalNotice] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER'

    // States for Class Cancellation Support
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelFeedback, setCancelFeedback] = useState(null);
    const [expandedCourseKey, setExpandedCourseKey] = useState(null);

    const handleOpenCancelCourse = (course) => {
        setCancelTarget({
            type: 'COURSE',
            classId: course.classId,
            className: course.courseName,
            upcomingCount: course.upcomingCount,
            sampleBookingId: course.sampleBookingId,
        });
        setCancelReason('');
        setCancelFeedback(null);
        setCancelModalOpen(true);
    };

    const handleOpenCancelSession = (session, course) => {
        setCancelTarget({
            type: 'SESSION',
            bookingId: session.bookingId,
            className: course.courseName,
            sessionTime: session.startTime,
        });
        setCancelReason('');
        setCancelFeedback(null);
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        setCancelFeedback(null);
        try {
            if (cancelTarget.type === 'COURSE') {
                const res = await receptionistService.cancelCourseForMember({
                    userId: member.userId,
                    classId: cancelTarget.classId,
                    reason: cancelReason,
                });
                setCancelFeedback({
                    type: 'success',
                    message: typeof res === 'string' ? res : t('Course sessions cancelled successfully. Quota refunded.'),
                });
            } else {
                const res = await receptionistService.cancelBookingForMember({
                    userId: member.userId,
                    bookingId: cancelTarget.bookingId,
                    reason: cancelReason,
                });
                setCancelFeedback({
                    type: 'success',
                    message: typeof res === 'string' ? res : t('Session cancelled successfully. Quota refunded.'),
                });
            }
            await refreshMemberData();
            setTimeout(() => {
                setCancelModalOpen(false);
                setCancelTarget(null);
            }, 1200);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to cancel session.';
            setCancelFeedback({ type: 'error', message: msg });
        } finally {
            setCancelling(false);
        }
    };

    const handleDismissModal = useCallback(() => {
        if (window.history.state?.nexusModal === 'member-detail') {
            window.history.back();
        } else if (onClose) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (!member) return undefined;
        window.history.pushState({ nexusModal: 'member-detail', userId: member.userId }, '');
        const handlePopState = () => {
            if (onClose) onClose();
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleDismissModal();
            }
        };
        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [member, onClose, handleDismissModal]);

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

    const handleShowAlreadyRenewedNotice = (currentCourse, nextCourse) => {
        setRenewalNotice({
            isOpen: true,
            type: 'ALREADY_RENEWED',
            currentCourse,
            nextCourse,
        });
    };

    // 1. Fetch renewal suggestion
    const handleOpenRenewal = async (bookingId, courseName = '') => {
        setRenewalLoading(true);
        setRenewalFeedback(null);
        try {
            const data = await receptionistService.suggestNextClassRenewal(member.userId, bookingId);
            setSuggestedClass(data);
            const defaultId = data.classId || (data.options && data.options[0]?.classId);
            setSelectedRenewalClassId(defaultId);
            setPaymentMethod('CASH');
            setRenewalModalOpen(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || t('No upcoming recurring schedule found for this class.');
            const isAlreadyEnrolled = typeof msg === 'string' && (msg.includes('đã') || msg.includes('already'));
            setRenewalNotice({
                isOpen: true,
                type: isAlreadyEnrolled ? 'ALREADY_ENROLLED' : 'NO_SCHEDULE',
                courseName: isAlreadyEnrolled ? null : courseName,
                message: typeof msg === 'string' ? msg : JSON.stringify(msg)
            });
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
                newScheduleId: ((suggestedClass.options || []).find(o => o.classId === selectedRenewalClassId) || suggestedClass).suggestedScheduleId,
                previousBookingId: suggestedClass.currentBookingId,
                paymentMethod: paymentMethod,
            });

            setRenewalFeedback({
                type: 'success',
                message: t('Successfully enrolled into the next recurring class!')
            });

            await refreshMemberData();

            setTimeout(() => {
                setRenewalModalOpen(false);
                setSuggestedClass(null);
            }, 1200);
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
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                padding: '1rem',
            }}
            onClick={handleDismissModal}
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
                        onClick={handleDismissModal}
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
                        onClick={() => setActiveTab('invoices')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.65rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: activeTab === 'invoices' ? 'var(--primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'invoices' ? '2px solid var(--primary)' : '2px solid transparent',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <Receipt style={{ width: '16px', height: '16px' }} />
                        <span>{t("Hóa đơn & Biên lai")}</span>
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
                            {member.currentMembershipStatus === 'ACTIVE' && (() => {
                                const activePkgs = (member.memberships || []).filter((m) => m.active);
                                const activePkg = activePkgs[0] || (member.memberships || [])[0];
                                const sameTypeActive = activePkgs.filter((m) => !member.currentPackageType || m.packageType === member.currentPackageType);
                                const targetList = sameTypeActive.length > 0 ? sameTypeActive : activePkgs;
                                const stackedDuration = targetList.reduce((sum, m) => sum + (Number(m.durationDays) || 30), 0);
                                const remainingDays = member.daysRemaining ?? 0;
                                const totalDuration = Math.max(stackedDuration || 30, remainingDays);
                                const pct = Math.min(100, Math.max(0, Math.round((remainingDays / Math.max(1, totalDuration)) * 100)));
                                const isExpiringSoon = remainingDays <= 7;
                                const earliestStart = targetList
                                    .map((m) => m.startDate)
                                    .filter(Boolean)
                                    .sort()[0] || activePkg?.startDate;
                                const latestEnd = targetList
                                    .map((m) => m.endDate)
                                    .filter(Boolean)
                                    .sort()
                                    .slice(-1)[0] || activePkg?.endDate;
                                return (
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary-soft) 0%, var(--success-soft) 100%)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '1rem',
                                            padding: '1.25rem 1.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.85rem',
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
                                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                    {t("Type:")} <strong style={{ color: 'var(--text)' }}>{t(member.currentPackageType || 'COMBO_PROMO')}</strong>
                                                    {earliestStart && latestEnd && (
                                                        <span> • {formatDate(earliestStart)} → {formatDate(latestEnd)}</span>
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    backgroundColor: isExpiringSoon ? 'var(--warning-soft)' : 'var(--success-soft)',
                                                    color: isExpiringSoon ? 'var(--warning-text)' : 'var(--success-text)',
                                                    border: '1px solid var(--border)',
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '9999px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                <Clock style={{ width: '14px', height: '14px' }} />
                                                {remainingDays === 1 ? t("1 day left (Expires today)") : `${remainingDays} ${t("days left")}`}
                                            </span>
                                        </div>

                                        {/* Validity Progress Bar */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                                <span>{t("Validity Remaining")}</span>
                                                <strong>{remainingDays} / {totalDuration} {t("days")} ({pct}%)</strong>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface)', borderRadius: '9999px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                <div
                                                    style={{
                                                        width: `${pct}%`,
                                                        height: '100%',
                                                        backgroundColor: isExpiringSoon ? 'var(--warning-text)' : 'var(--primary)',
                                                        borderRadius: '9999px',
                                                        transition: 'width 0.3s ease',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {isExpiringSoon && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.6rem 0.85rem',
                                                    backgroundColor: 'var(--warning-soft)',
                                                    color: 'var(--warning-text)',
                                                    borderRadius: '0.5rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                <AlertTriangle style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                                                <span>{t("This membership package will expire within 7 days. Please remind the member to renew.")}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

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
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Benefits & Quota")}</th>
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
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>
                                                        <div>{formatDate(pkg.endDate)}</div>
                                                        {pkg.active && (
                                                            <span style={{ fontSize: '0.72rem', color: pkg.daysRemaining <= 7 ? 'var(--warning-text)' : 'var(--success-text)', fontWeight: 600 }}>
                                                                ({pkg.daysRemaining === 1 ? t("1 day left (Expires today)") : `${pkg.daysRemaining} ${t("days left")}`})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', color: 'var(--text)' }}>
                                                        {Array.isArray(pkg.benefits) && pkg.benefits.length > 0 ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                                {pkg.benefits.map((b, bIdx) => (
                                                                    <span key={bIdx} style={{ display: 'inline-block', padding: '0.15rem 0.45rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.35rem', border: '1px solid var(--border)' }}>
                                                                        <strong>{b.subjectName}:</strong> {b.remainingSessions}/{b.sessionLimit} {t("sessions")}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)' }}>{t("Gym & Facility Access")}</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px', backgroundColor: pkg.active ? 'var(--success-soft)' : 'var(--primary-soft)', color: pkg.active ? 'var(--success-text)' : 'var(--text-muted)' }}>
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
                                        {(() => {
                                            const confirmedBookings = (member?.bookings || []).filter(b => b.bookingStatus === "CONFIRMED");
                                            const allCourses = groupBookingsByCourse(confirmedBookings);
                                            return allCourses.map((course, idx) => {
                                                const courseKey = course.key || (course.classId ? `class_${course.classId}` : course.courseName);
                                                const isExpanded = expandedCourseKey === courseKey;
                                                // Nhận diện lớp gia hạn theo đúng tiêu chí nghiệp vụ:
                                                // 1. Của tương lai (sau ngày khai giảng lớp hiện tại)
                                                // 2. Cùng loại lớp (cùng subjectId hoặc cùng tên bộ môn)
                                                // 3. Cùng lịch học (cùng các thứ trong tuần & cùng khung giờ học)
                                                // 4. Khác giáo viên thì được (không bắt buộc cùng HLV)
                                                const nextBatch = allCourses.find(other => {
                                                    if (other === course) return false;
                                                    if (new Date(other.firstSessionDate) <= new Date(course.firstSessionDate)) return false;

                                                    const sameSubject = (course.subjectId && other.subjectId && course.subjectId === other.subjectId)
                                                        || (course.subjectName && other.subjectName && course.subjectName.trim().toLowerCase() === other.subjectName.trim().toLowerCase());
                                                    const cleanBaseName = (name = '') => name.replace(/\s*[-–(]?\s*(?:Đợt|Khóa|K|Tháng|T)\s*\d+.*[)]?/i, '').trim();
                                                    const sameBase = cleanBaseName(course.courseName) === cleanBaseName(other.courseName);
                                                    if (!sameSubject && !sameBase) return false;

                                                    const daysA = course.daysOfWeek || new Set();
                                                    const daysB = other.daysOfWeek || new Set();
                                                    let daysMatch = true;
                                                    if (daysA.size > 0 && daysB.size > 0) {
                                                        let matchCount = 0;
                                                        daysA.forEach(d => { if (daysB.has(d)) matchCount++; });
                                                        daysMatch = matchCount >= Math.min(daysA.size, daysB.size);
                                                    }
                                                    const slotMatch = !course.timeSlot || !other.timeSlot || course.timeSlot === other.timeSlot;

                                                    return daysMatch && slotMatch;
                                                });
                                                return (
                                                    <React.Fragment key={idx}>
                                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setExpandedCourseKey(isExpanded ? null : courseKey)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            padding: '2px',
                                                                            cursor: 'pointer',
                                                                            color: 'var(--text-muted)',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                        }}
                                                                        title={t("View individual sessions")}
                                                                    >
                                                                        {isExpanded ? <ChevronUp style={{ width: '15px', height: '15px' }} /> : <ChevronDown style={{ width: '15px', height: '15px' }} />}
                                                                    </button>
                                                                    <span>{course.courseName}</span>
                                                                </div>
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
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                                                                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{course.sessionsCount}{' '}{t("sessions")}</span>
                                                                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                                    <span style={{ color: 'var(--success-text)' }}>{course.attendedCount}{' '}{t("present")}</span>
                                                                    {course.absentCount > 0 && (
                                                                        <>
                                                                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                                            <span style={{ color: 'var(--danger-text)' }}>{course.absentCount}{' '}{t("absent")}</span>
                                                                        </>
                                                                    )}
                                                                    {course.cancelledCount > 0 && (
                                                                        <>
                                                                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                                                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{course.cancelledCount}{' '}{t("cancelled")}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                                                    {nextBatch ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleShowAlreadyRenewedNotice(course, nextBatch)}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.35rem',
                                                                                padding: '0.35rem 0.65rem',
                                                                                backgroundColor: 'var(--success-soft)',
                                                                                color: 'var(--success-text)',
                                                                                border: '1px solid var(--border)',
                                                                                borderRadius: '0.5rem',
                                                                                fontSize: '0.75rem',
                                                                                fontWeight: 600,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                            title={t("Course already renewed to next batch. Click to view.")}
                                                                        >
                                                                            <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                                                                            <span>{t("Enrolled in Next Term")}</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleOpenRenewal(course.sampleBookingId, course.courseName || course.className)}
                                                                            disabled={renewalLoading}
                                                                            title={t("Find and enroll into next recurring course")}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.35rem',
                                                                                padding: '0.35rem 0.65rem',
                                                                                backgroundColor: 'var(--primary-soft)',
                                                                                border: '1px solid var(--border)',
                                                                                color: 'var(--primary)',
                                                                                borderRadius: '0.5rem',
                                                                                fontSize: '0.75rem',
                                                                                fontWeight: 600,
                                                                                cursor: 'pointer',
                                                                            }}
                                                                        >
                                                                            <RotateCw style={{ width: '12px', height: '12px' }} />
                                                                            <span>{t("Renew")}</span>
                                                                        </button>
                                                                    )}
                                                                {course.upcomingCount > 0 && (
                                                                    <button
                                                                        onClick={() => handleOpenCancelCourse(course)}
                                                                        title={t("Cancel upcoming sessions for this course")}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.35rem',
                                                                            padding: '0.35rem 0.65rem',
                                                                            backgroundColor: 'var(--danger-soft)',
                                                                            border: '1px solid var(--border)',
                                                                            color: 'var(--danger-text)',
                                                                            borderRadius: '0.5rem',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 600,
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    >
                                                                        <Ban style={{ width: '12px', height: '12px' }} />
                                                                        <span>{t("Cancel Course")}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Hàng mở rộng danh sách từng buổi học */}
                                                    {isExpanded && (
                                                        <tr style={{ backgroundColor: 'var(--surface-hover)' }}>
                                                            <td colSpan={6} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
                                                                    {t("Class Schedule & Session Attendance:")}
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                                    {course.sessions.map((s, sIdx) => (
                                                                        <div
                                                                            key={s.bookingId || sIdx}
                                                                            style={{
                                                                                display: 'flex',
                                                                                justifyContent: 'space-between',
                                                                                alignItems: 'center',
                                                                                padding: '0.45rem 0.75rem',
                                                                                backgroundColor: 'var(--surface)',
                                                                                border: '1px solid var(--border)',
                                                                                borderRadius: '0.5rem',
                                                                                fontSize: '0.78rem',
                                                                            }}
                                                                        >
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                                <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{sIdx + 1}</span>
                                                                                <span style={{ color: 'var(--text)' }}>{formatDateTime(s.startTime)} → {formatDateTime(s.endTime)}</span>
                                                                                <span style={{ color: 'var(--text-muted)' }}>• {s.roomName || 'Room'}</span>
                                                                            </div>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                                                {s.isCancelled ? (
                                                                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                                                        {t("Cancelled (Refunded)")}
                                                                                    </span>
                                                                                ) : s.isPresent ? (
                                                                                    <span style={{ color: 'var(--success-text)', fontWeight: 600, backgroundColor: 'var(--success-soft)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                                                        ✓ {t("Attended (Present)")}
                                                                                    </span>
                                                                                ) : s.isAbsent ? (
                                                                                    <span style={{ color: 'var(--danger-text)', fontWeight: 600, backgroundColor: 'var(--danger-soft)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                                                                        ✕ {t("Absent")}
                                                                                    </span>
                                                                                ) : s.isUpcoming ? (
                                                                                    <span style={{ color: 'var(--primary)', fontWeight: 600, backgroundColor: 'var(--primary-soft)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                                        <Clock style={{ width: '11px', height: '11px' }} />
                                                                                        <span>{t("Scheduled")}</span>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface-hover)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                                        <CheckCircle2 style={{ width: '11px', height: '11px' }} />
                                                                                        <span>{t("Past Session")}</span>
                                                                                    </span>
                                                                                )}

                                                                                {s.isUpcoming && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleOpenCancelSession(s, course)}
                                                                                        style={{
                                                                                            padding: '0.2rem 0.55rem',
                                                                                            backgroundColor: 'var(--surface)',
                                                                                            border: '1px solid var(--border)',
                                                                                            color: 'var(--danger-text)',
                                                                                            borderRadius: '0.35rem',
                                                                                            cursor: 'pointer',
                                                                                            fontSize: '0.72rem',
                                                                                            fontWeight: 600,
                                                                                        }}
                                                                                        title={t("Cancel this single session and refund session quota")}
                                                                                    >
                                                                                        {t("Cancel Session")}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        });
                                        })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: INVOICES */}
                    {activeTab === 'invoices' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                                        {t("Lịch sử hóa đơn & phiếu thu")}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                                        {t("Tất cả các giao dịch thanh toán gói tập và khóa học đã thực hiện của hội viên")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (member?.userId) {
                                            setLoadingInvoices(true);
                                            receptionistService.getMemberInvoices(member.userId)
                                                .then((data) => setInvoices(Array.isArray(data) ? data : []))
                                                .catch((e) => console.error(e))
                                                .finally(() => setLoadingInvoices(false));
                                        }
                                    }}
                                    disabled={loadingInvoices}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.4rem 0.75rem',
                                        fontSize: '0.78rem',
                                        fontWeight: 500,
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.4rem',
                                        cursor: loadingInvoices ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <RefreshCw style={{ width: '13px', height: '13px', animation: loadingInvoices ? 'spin 1s linear infinite' : 'none' }} />
                                    <span>{t("Làm mới")}</span>
                                </button>
                            </div>

                            {loadingInvoices ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    <RotateCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                                    <div>{t("Đang tải danh sách hóa đơn...")}</div>
                                </div>
                            ) : invoices.length === 0 ? (
                                <div style={{
                                    padding: '3rem',
                                    textAlign: 'center',
                                    backgroundColor: 'var(--surface-hover)',
                                    border: '1px dashed var(--border)',
                                    borderRadius: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.875rem'
                                }}>
                                    <Receipt style={{ width: '36px', height: '36px', margin: '0 auto 0.75rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                                        {t("Chưa có hóa đơn nào")}
                                    </div>
                                    <div style={{ fontSize: '0.78rem' }}>
                                        {t("Hội viên chưa có lịch sử thanh toán hoặc hóa đơn được ghi nhận trên hệ thống.")}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.75rem',
                                    overflow: 'hidden',
                                    backgroundColor: 'var(--surface)'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--surface-hover)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Mã HĐ")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Thời gian")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Nội dung dịch vụ")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{t("Hình thức")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>{t("Số tiền")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>{t("Trạng thái")}</th>
                                                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'center' }}>{t("Thao tác")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((inv) => (
                                                <tr key={inv.invoiceId} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                                        {inv.invoiceCode || `#INV-${inv.invoiceId}`}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text)' }}>
                                                        {displayFormatDateTime(inv.createdAt)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text)', fontWeight: 500 }}>
                                                        {inv.items && inv.items.length > 0
                                                            ? inv.items.map(it => it.itemName).join(', ')
                                                            : t("Dịch vụ thể thao")}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                                                        {inv.paymentMethod === 'CASH'
                                                            ? t("Tiền mặt")
                                                            : inv.paymentMethod === 'BANK_TRANSFER'
                                                            ? t("Chuyển khoản")
                                                            : (inv.paymentMethod || 'CASH')}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text)' }}>
                                                        {formatMoney(inv.totalAmount)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '0.2rem 0.55rem',
                                                            borderRadius: '9999px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 600,
                                                            backgroundColor: inv.status === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                                            color: inv.status === 'PAID' ? '#16a34a' : '#ca8a04'
                                                        }}>
                                                            {inv.status === 'PAID' ? t("Đã thanh toán") : inv.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => {
                                                                setActiveReceipt(inv);
                                                                setReceiptModalOpen(true);
                                                            }}
                                                            type="button"
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.35rem',
                                                                padding: '0.35rem 0.65rem',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                backgroundColor: 'var(--surface-hover)',
                                                                color: 'var(--primary)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: '0.4rem',
                                                                cursor: 'pointer'
                                                            }}
                                                            title={t("Xem và in hóa đơn/biên lai")}
                                                        >
                                                            <Printer style={{ width: '13px', height: '13px' }} />
                                                            <span>{t("In HĐ")}</span>
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
                        onClick={handleDismissModal}
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
                            backgroundColor: 'rgba(15, 23, 42, 0.45)',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem'
                        }}
                    >
                        {(() => {
                            const optionsList = suggestedClass.options && suggestedClass.options.length > 0 ? suggestedClass.options : [suggestedClass];
                            const chosenOption = optionsList.find(o => o.classId === selectedRenewalClassId) || optionsList[0];
                            const isChosenDisabled = chosenOption?.alreadyEnrolled || (chosenOption?.availableSlots <= 0);

                            return (
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '640px',
                                        maxHeight: '90vh',
                                        overflowY: 'auto',
                                        backgroundColor: 'var(--surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '1rem',
                                        padding: '1.5rem',
                                        boxShadow: 'var(--shadow)',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                                {t("Enroll Next Term Course")}
                                            </h3>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {t("Select the next term class for {0} (Subject: {1})", [member.fullName, suggestedClass.subjectName || suggestedClass.currentClassName])}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setRenewalModalOpen(false)}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
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

                                    {/* Banner thói quen tập luyện của lớp cũ */}
                                    <div style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.825rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{t("Current Course:")} <strong style={{ color: 'var(--text)' }}>{suggestedClass.currentClassName}</strong></span>
                                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{suggestedClass.subjectName || ''}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                                            <Clock style={{ width: '13px', height: '13px' }} />
                                            <span>{t("Familiar Schedule:")} <strong style={{ color: 'var(--text)' }}>{suggestedClass.currentSchedulePattern || ''}</strong></span>
                                        </div>
                                    </div>

                                    {/* Tiêu đề danh sách lớp mở */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                                            {t("Available Classes for Next Term:")} ({optionsList.length})
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {t("Select one class to enroll")}
                                        </span>
                                    </div>

                                    {/* Danh sách các lớp học ứng viên */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.35rem', marginBottom: '1rem' }}>
                                        {optionsList.map((opt) => {
                                            const isSelected = selectedRenewalClassId === opt.classId;
                                            const isOptDisabled = opt.alreadyEnrolled || (opt.availableSlots <= 0);

                                            return (
                                                <div
                                                    key={opt.classId}
                                                    onClick={() => { if (!isOptDisabled) setSelectedRenewalClassId(opt.classId); }}
                                                    style={{
                                                        padding: '0.75rem 1rem',
                                                        borderRadius: '0.75rem',
                                                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                        backgroundColor: isSelected ? 'var(--primary-soft)' : isOptDisabled ? 'var(--surface-hover)' : 'var(--surface)',
                                                        cursor: isOptDisabled ? 'not-allowed' : 'pointer',
                                                        opacity: isOptDisabled ? 0.65 : 1,
                                                        transition: 'all 0.15s ease',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.4rem'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input
                                                                type="radio"
                                                                name="renewalModalClassOption"
                                                                checked={isSelected}
                                                                disabled={isOptDisabled}
                                                                onChange={() => setSelectedRenewalClassId(opt.classId)}
                                                                style={{ cursor: isOptDisabled ? 'not-allowed' : 'pointer' }}
                                                            />
                                                            <strong style={{ fontSize: '0.9rem', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                                                                {opt.className}
                                                            </strong>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            {opt.isBestMatch && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.55rem',
                                                                    borderRadius: '9999px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: 700,
                                                                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                                                                    color: '#ca8a04',
                                                                    border: '1px solid rgba(234, 179, 8, 0.3)',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.25rem'
                                                                }}>
                                                                    ⭐ {t("Best Match - Same Schedule")}
                                                                </span>
                                                            )}
                                                            {opt.alreadyEnrolled && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '9999px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    backgroundColor: 'var(--success-soft)',
                                                                    color: 'var(--success-text)',
                                                                    border: '1px solid var(--border)'
                                                                }}>
                                                                    {t("Already Enrolled")}
                                                                </span>
                                                            )}
                                                            {!opt.alreadyEnrolled && opt.availableSlots <= 0 && (
                                                                <span style={{
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '9999px',
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 600,
                                                                    backgroundColor: 'var(--danger-soft)',
                                                                    color: 'var(--danger-text)'
                                                                }}>
                                                                    {t("Full")}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '1.4rem' }}>
                                                        <div>👤 {t("Coach:")} <strong style={{ color: 'var(--text)' }}>{opt.coachName}</strong> • {opt.roomName}</div>
                                                        <div>⏰ {t("Schedule:")} <strong style={{ color: 'var(--text)' }}>{opt.daysOfWeekText || ''} · {opt.timeSlotText || ''}</strong></div>
                                                        <div>🗓️ {t("Starts:")} <strong style={{ color: 'var(--primary)' }}>{formatDateTime(opt.startTime)}</strong></div>
                                                        <div>👥 {t("Availability:")} <strong style={{ color: opt.availableSlots > 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>{opt.availableSlots} / {opt.maxSlots} {t("slots left")}</strong></div>
                                                    </div>

                                                    {opt.hasConflict && (
                                                        <div style={{ marginLeft: '1.4rem', fontSize: '0.75rem', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <AlertTriangle style={{ width: '13px', height: '13px' }} />
                                                            <span>{opt.conflictReason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Khung thanh toán tại quầy */}
                                    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {t("Tuition Fee:")} <strong style={{ color: 'var(--text)' }}>{chosenOption?.className || ''}</strong>
                                            </span>
                                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success-text)' }}>
                                                {formatCurrency(chosenOption?.price || suggestedClass.price)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px dashed var(--border)' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.825rem' }}>{t("Payment method at counter:")}</span>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('CASH')}
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '0.4rem',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600,
                                                        border: paymentMethod === 'CASH' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                                        backgroundColor: paymentMethod === 'CASH' ? 'var(--primary-soft)' : 'var(--surface)',
                                                        color: paymentMethod === 'CASH' ? 'var(--primary)' : 'var(--text)',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}
                                                >
                                                    <Banknote style={{ width: '13px', height: '13px' }} />
                                                    <span>{t("Cash")}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMethod('TRANSFER')}
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '0.4rem',
                                                        fontSize: '0.78rem',
                                                        fontWeight: 600,
                                                        border: paymentMethod === 'TRANSFER' ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                                                        backgroundColor: paymentMethod === 'TRANSFER' ? 'var(--primary-soft)' : 'var(--surface)',
                                                        color: paymentMethod === 'TRANSFER' ? 'var(--primary)' : 'var(--text)',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem'
                                                    }}
                                                >
                                                    <CreditCard style={{ width: '13px', height: '13px' }} />
                                                    <span>{t("Bank Transfer")}</span>
                                                </button>
                                            </div>
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
                                            disabled={confirmingRenewal || isChosenDisabled}
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
                                                cursor: (confirmingRenewal || isChosenDisabled) ? 'not-allowed' : 'pointer',
                                                opacity: isChosenDisabled ? 0.6 : 1
                                            }}
                                        >
                                            {confirmingRenewal ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: '14px', height: '14px' }} />}
                                            <span>{t(confirmingRenewal ? t('Processing...') : t('Confirm Payment & Enroll'))}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Modal Thông Báo Khi Không Tìm Thấy Lịch Gia Hạn Tiếp Theo */}
                {renewalNotice && renewalNotice.isOpen && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10002,
                            backgroundColor: 'rgba(15, 23, 42, 0.45)',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '460px',
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                boxShadow: 'var(--shadow)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Info style={{ width: '18px', height: '18px' }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                        {t("Course Renewal Notice")}
                                    </h3>
                                </div>
                                <button onClick={() => setRenewalNotice(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                                    <X style={{ width: '18px', height: '18px' }} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
                                <div style={{
                                    padding: '0.85rem 1rem',
                                    backgroundColor: 'var(--surface-hover)',
                                    borderRadius: '0.65rem',
                                    border: '1px solid var(--border)',
                                    lineHeight: 1.55,
                                    color: 'var(--text)'
                                }}>
                                {renewalNotice.type === 'ALREADY_RENEWED' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 700, fontSize: '0.95rem' }}>
                                            <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                                            <span>{t("Course renewed successfully!")}</span>
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {t("Member has been registered and enrolled into the next batch:")}
                                        </p>
                                        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.825rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{t("Next Batch:")}</span>
                                                <strong style={{ color: 'var(--primary)' }}>{renewalNotice.nextCourse?.courseName}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{t("Coach / Room:")}</span>
                                                <span style={{ color: 'var(--text)' }}>{renewalNotice.nextCourse?.coachName} • {renewalNotice.nextCourse?.roomName}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{t("Timeline:")}</span>
                                                <span style={{ color: 'var(--text)' }}>{formatDateTime(renewalNotice.nextCourse?.firstSessionDate)} → {formatDateTime(renewalNotice.nextCourse?.lastSessionDate)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{t("Total Sessions:")}</span>
                                                <strong style={{ color: 'var(--success-text)' }}>{renewalNotice.nextCourse?.sessionsCount} {t("sessions (In schedule)")}</strong>
                                            </div>
                                        </div>
                                    </div>
                                ) : renewalNotice.type === 'ALREADY_ENROLLED' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-text)', fontWeight: 600 }}>
                                            <CheckCircle2 style={{ width: '18px', height: '18px' }} />
                                            <span>{renewalNotice.message}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span>{t("No upcoming recurring schedule found for course:")} </span>
                                        <strong style={{ color: 'var(--primary)' }}>{renewalNotice.courseName}</strong>.
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {t("The center has not scheduled the next recurring batch for this course yet. You can enroll the member into another available class or check back later.")}
                                        </p>
                                    </>
                                )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                                <button
                                    onClick={() => setRenewalNotice(null)}
                                    style={{
                                        padding: '0.55rem 1.1rem',
                                        backgroundColor: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t("Close")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= CANCELLATION CONFIRMATION POPUP MODAL ================= */}
                {cancelModalOpen && cancelTarget && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 10001,
                            backgroundColor: 'rgba(15, 23, 42, 0.45)',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '460px',
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '1rem',
                                padding: '1.5rem',
                                boxShadow: 'var(--shadow)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ban style={{ width: '18px', height: '18px' }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                        {cancelTarget.type === 'COURSE' ? t("Confirm Course Cancellation") : t("Confirm Session Cancellation")}
                                    </h3>
                                </div>
                                <button onClick={() => setCancelModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X style={{ width: '18px', height: '18px' }} />
                                </button>
                            </div>

                            {cancelFeedback && (
                                <div
                                    style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '0.5rem',
                                        marginBottom: '1rem',
                                        backgroundColor: cancelFeedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                        color: cancelFeedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    {t(cancelFeedback.message)}
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.5 }}>
                                    {cancelTarget.type === 'COURSE'
                                        ? t("Are you sure you want to cancel all {0} upcoming session(s) of course \"{1}\" for this member?").replace('{0}', cancelTarget.upcomingCount).replace('{1}', cancelTarget.className)
                                        : t("Are you sure you want to cancel the session at {0} of course \"{1}\"?").replace('{0}', formatDateTime(cancelTarget.sessionTime)).replace('{1}', cancelTarget.className)
                                    }
                                </p>

                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.5rem', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                    ℹ️ {t("The cancelled session quota will be automatically returned and restored into the member's package benefits.")}
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                                        {t("Cancellation Reason (Optional):")}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t("e.g. Member requested at front desk due to schedule conflict")}
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        style={{
                                            width: '100%',
                                            backgroundColor: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.5rem',
                                            padding: '0.6rem 0.75rem',
                                            color: 'var(--text)',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                                <button
                                    onClick={() => setCancelModalOpen(false)}
                                    disabled={cancelling}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    {t("Back")}
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={cancelling}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        backgroundColor: 'var(--danger)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: cancelling ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {cancelling ? t("Cancelling...") : t("Confirm Cancellation")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal In & Xem hóa đơn/biên lai */}
                <InvoiceReceiptModal
                    isOpen={receiptModalOpen}
                    onClose={() => setReceiptModalOpen(false)}
                    receipt={activeReceipt}
                />
            </div>
        </div>
    );
};

export default MemberDetailModal;