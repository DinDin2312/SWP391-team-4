import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime as displayFormatDateTime, formatMoney } from '../../../utils/displayFormat';
import React, { useState, useEffect } from 'react';
import {
    Search,
    RotateCw,
    RefreshCw,
    CheckCircle2,
    User,
    Layers,
    X,
    BookOpen,
    Ban,
    PlusCircle,
    Eye,
    Info,
    CreditCard,
    Banknote,
    Clock,
    MapPin,
    Users,
    Dumbbell
} from 'lucide-react';
import receptionistService from '../services/receptionistService';
import MemberDetailModal from './MemberDetailModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';

export default function ManageMembershipsView() {
  useLanguage();
    // Receipt Modal States
    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [currentReceipt, setCurrentReceipt] = useState(null);

    // Package Subscription States
    const [packagesList, setPackagesList] = useState([]);
    const [packageModalOpen, setPackageModalOpen] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [startDateInput, setStartDateInput] = useState(new Date().toISOString().split('T')[0]);
    const [subscribing, setSubscribing] = useState(false);
    const [pkgFeedback, setPkgFeedback] = useState(null);

    const [keyword, setKeyword] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberBookings, setMemberBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Renewal Modal States
    const [renewalModalOpen, setRenewalModalOpen] = useState(false);
    const [suggestedClass, setSuggestedClass] = useState(null);
    const [confirming, setConfirming] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [renewalNotice, setRenewalNotice] = useState(null); // { isOpen, courseName, message }

    // Course Cancellation States
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [cancelFeedback, setCancelFeedback] = useState(null);

    // Enroll New Class States
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [loadingAvailableClasses, setLoadingAvailableClasses] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [enrollFeedback, setEnrollFeedback] = useState(null);
    const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' | 'TRANSFER'

    // 1. Search members
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const data = await receptionistService.searchMembers({ keyword, status: 'ACTIVE' });
            setMembers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to search members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);

    // Gom nhóm các buổi lẻ (sessions) thành từng khóa học (course) phân biệt theo classId
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
                    coachName: b.coachName || 'N/A',
                    roomName: b.roomName || 'N/A',
                    firstSessionDate: b.startTime,
                    lastSessionDate: b.startTime,
                    sessionsCount: 0,
                    upcomingCount: 0,
                    sampleBookingId: b.bookingId,
                };
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
            const isUpcoming = sessionEnd && sessionEnd > now && b.bookingStatus !== 'CANCELLED' && b.attendanceStatus !== 'PRESENT';
            if (isUpcoming) {
                grouped[key].upcomingCount += 1;
            }

            if (new Date(b.startTime) < new Date(grouped[key].firstSessionDate)) {
                grouped[key].firstSessionDate = b.startTime;
            }
            if (new Date(b.startTime) > new Date(grouped[key].lastSessionDate)) {
                grouped[key].lastSessionDate = b.startTime;
                grouped[key].sampleBookingId = b.bookingId;
            }
        });

        const courses = Object.values(grouped);
        // Sắp xếp các khóa học: 2 lớp cùng môn/cùng khóa (Tháng 10 & Tháng 11, Đợt 1 & Đợt 2) luôn nằm liền kề nhau
        const cleanBaseName = (name = '') => name.replace(/\s*[-–(]?\s*(?:Đợt|Khóa|K|Tháng|T)\s*\d+.*[)]?/i, '').trim();
        courses.sort((a, b) => {
            const baseA = cleanBaseName(a.courseName);
            const baseB = cleanBaseName(b.courseName);
            const cmp = baseA.localeCompare(baseB, 'vi');
            if (cmp !== 0) return cmp;
            return new Date(a.firstSessionDate) - new Date(b.firstSessionDate);
        });

        return courses;
    };

    const handleOpenCancelCourse = (course) => {
        setCancelTarget(course);
        setCancelReason('');
        setCancelFeedback(null);
        setCancelModalOpen(true);
    };

    const handleConfirmCancelCourse = async () => {
        if (!cancelTarget || !selectedMember) return;
        setCancelling(true);
        setCancelFeedback(null);
        try {
            const res = await receptionistService.cancelCourseForMember({
                userId: selectedMember.userId,
                classId: cancelTarget.classId,
                reason: cancelReason,
            });
            setCancelFeedback({
                type: 'success',
                message: typeof res === 'string' ? res : t('Course cancelled successfully. Quota refunded.'),
            });
            setTimeout(() => {
                setCancelModalOpen(false);
                setCancelTarget(null);
                handleSelectMember(selectedMember);
            }, 1200);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to cancel course.';
            setCancelFeedback({ type: 'error', message: msg });
        } finally {
            setCancelling(false);
        }
    };

    const handleOpenEnrollModal = async () => {
        if (!selectedMember) return;
        setEnrollFeedback(null);
        setSelectedClassId('');
        setEnrollModalOpen(true);
        setLoadingAvailableClasses(true);
        try {
            const data = await receptionistService.getAvailableClassesForMember(selectedMember.userId);
            setAvailableClasses(Array.isArray(data) ? data : []);
            if (data && data.length > 0) {
                const unbooked = data.find((c) => !c.isBookedByMe);
                if (unbooked) setSelectedClassId(String(unbooked.classId));
                else setSelectedClassId(String(data[0].classId));
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to load available classes.';
            setEnrollFeedback({ type: 'error', message: typeof msg === 'string' ? msg : 'Failed to load available classes.' });
        } finally {
            setLoadingAvailableClasses(false);
        }
    };

    const handleConfirmEnrollClass = async () => {
        if (!selectedClassId || !selectedMember) return;
        setEnrolling(true);
        setEnrollFeedback(null);
        try {
            const receipt = await receptionistService.enrollMemberToClass({
                userId: selectedMember.userId,
                classId: Number(selectedClassId),
                paymentMethod: paymentMethod,
            });
            setEnrollFeedback({ type: 'success', message: t('Member enrolled into class successfully!') });
            if (receipt && receipt.invoiceId) {
                setCurrentReceipt(receipt);
            }
            setTimeout(() => {
                setEnrollModalOpen(false);
                handleSelectMember(selectedMember);
                if (receipt && receipt.invoiceId) {
                    setReceiptModalOpen(true);
                }
            }, 800);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to enroll member into class.';
            setEnrollFeedback({ type: 'error', message: msg });
        } finally {
            setEnrolling(false);
        }
    };

    // Select member & load enrolled courses
    const handleSelectMember = async (m) => {
        setSelectedMember(m);
        setLoadingBookings(true);
        setMemberBookings([]);
        try {
            const detail = await receptionistService.getMemberDetail(m.userId);
            setSelectedMemberDetail(detail);
            const rawBookings = detail.bookings || [];
            // Gom nhóm trước khi lưu vào state
            setMemberBookings(groupBookingsByCourse(rawBookings));
        } catch (err) {
            console.error('Failed to load member classes:', err);
            setSelectedMemberDetail(null);
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleShowAlreadyRenewedNotice = (currentCourse, nextCourse) => {
        setRenewalNotice({
            isOpen: true,
            type: 'ALREADY_RENEWED',
            currentCourse,
            nextCourse,
        });
    };

    // 3. Find next class recommendation
    const handleFindRenewal = async (bookingId, courseName = '') => {
        setLoading(true);
        setFeedback(null);
        try {
            const data = await receptionistService.suggestNextClassRenewal(selectedMember.userId, bookingId);
            setSuggestedClass(data);
            setPaymentMethod('CASH');
            setRenewalModalOpen(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || t('No upcoming recurring schedule found for this course.');
            const isAlreadyEnrolled = typeof msg === 'string' && (msg.includes('đã') || msg.includes('already'));
            setRenewalNotice({
                isOpen: true,
                type: isAlreadyEnrolled ? 'ALREADY_ENROLLED' : 'NO_SCHEDULE',
                courseName: isAlreadyEnrolled ? null : courseName,
                message: typeof msg === 'string' ? msg : JSON.stringify(msg)
            });
        } finally {
            setLoading(false);
        }
    };

    // 4. Confirm enrollment
    const handleConfirmEnrollment = async () => {
        if (!suggestedClass) return;
        setConfirming(true);
        setFeedback(null);

        try {
            const receipt = await receptionistService.confirmClassRenewal({
                userId: selectedMember.userId,
                newScheduleId: suggestedClass.suggestedScheduleId,
                previousBookingId: suggestedClass.currentBookingId,
                paymentMethod: paymentMethod,
            });

            setFeedback({ type: 'success', message: t('Successfully renewed and enrolled into the next class!') });
            if (receipt && receipt.invoiceId) {
                setCurrentReceipt(receipt);
            }
            setTimeout(() => {
                setRenewalModalOpen(false);
                setSuggestedClass(null);
                handleSelectMember(selectedMember); // Reload bookings list
                if (receipt && receipt.invoiceId) {
                    setReceiptModalOpen(true);
                }
            }, 800);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to complete renewal.';
            setFeedback({ type: 'error', message: msg });
        } finally {
            setConfirming(false);
        }
    };

    const handleOpenSubscribeModal = async () => {
        setPkgFeedback(null);
        try {
            const data = await receptionistService.getAllPackages();
            setPackagesList(Array.isArray(data) ? data : []);
            if (data && data.length > 0) setSelectedPackageId(data[0].packageId);
            setPackageModalOpen(true);
        } catch {
            alert('Failed to load packages list.');
        }
    };

    const handleConfirmSubscribe = async () => {
        if (!selectedPackageId) return;
        setSubscribing(true);
        setPkgFeedback(null);
        try {
            const receipt = await receptionistService.subscribePackage({
                userId: selectedMember.userId,
                packageId: Number(selectedPackageId),
                startDate: startDateInput,
                paymentMethod: paymentMethod,
            });
            setPkgFeedback({ type: 'success', message: t('Combo Package subscribed successfully!') });
            if (receipt && receipt.invoiceId) {
                setCurrentReceipt(receipt);
            }
            setTimeout(() => {
                setPackageModalOpen(false);
                handleSelectMember(selectedMember);
                if (receipt && receipt.invoiceId) {
                    setReceiptModalOpen(true);
                }
            }, 800);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to subscribe package.';
            setPkgFeedback({ type: 'error', message: msg });
        } finally {
            setSubscribing(false);
        }
    };

    const formatDateTime = displayFormatDateTime;

    const formatCurrency = formatMoney;

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{t("Course & Membership Renewal")}</h1>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t("Select a member to view active course enrolments and automatically book next recurring classes.")}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Left Column: Select Member */}
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder={t("Search member name / phone...")}
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.6rem 0.75rem 0.6rem 2.2rem', color: 'var(--text)', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <button type="submit" style={{ padding: '0.6rem 0.9rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>{t("Find")}</button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
                        {loading && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>{t("Loading members...")}</p>}
                        {!loading && members.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>{t("No active members found.")}</p>}
                        {members.map((m) => {
                            const isSelected = selectedMember?.userId === m.userId;
                            return (
                                <div
                                    key={m.userId}
                                    onClick={() => handleSelectMember(m)}
                                    style={{
                                        padding: '0.85rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                                        border: `1px solid ${isSelected ? 'var(--border)' : 'var(--border)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{m.fullName}</strong>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{t("#MEM-")}{String(m.userId).padStart(4, '0')}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        {m.phone || m.email}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Member Courses & Renewal Workspace */}
                <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', minHeight: '400px' }}>
                    {!selectedMember ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Layers style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.4 }} />
                            <h3 style={{ margin: '0 0 0.35rem', color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t("No Member Selected")}</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>{t("Please select a member from the left list to review their classes and process renewal.")}</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                        {selectedMember.fullName}
                                    </h2>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>{t("Member ID: #MEM-")}{String(selectedMember.userId).padStart(4, '0')} • {selectedMember.phone || selectedMember.email}
                                    </span>
                                </div>

                                {/* Nhóm các nút thao tác phía trên */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => setDetailModalOpen(true)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            backgroundColor: 'var(--surface-hover)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text)',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Eye style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
                                        <span>{t("View Full Profile")}</span>
                                    </button>

                                    <button
                                        onClick={handleOpenEnrollModal}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            backgroundColor: 'var(--primary)',
                                            border: 'none',
                                            color: 'var(--on-primary)',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <PlusCircle style={{ width: '13px', height: '13px' }} />
                                        <span>{t("Enroll in Class")}</span>
                                    </button>

                                    <button
                                        onClick={handleOpenSubscribeModal}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            backgroundColor: 'var(--success-hover)',
                                            border: 'none',
                                            color: 'var(--on-primary)',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <PlusCircle style={{ width: '13px', height: '13px' }} />
                                        <span>{t("Subscribe Combo Package")}</span>
                                    </button>

                                    <button
                                        onClick={() => handleSelectMember(selectedMember)}
                                        disabled={loadingBookings}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            background: 'none',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text)',
                                            padding: '0.45rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <RefreshCw style={{ width: '13px', height: '13px', animation: loadingBookings ? t('spin 1s linear infinite') : t('none') }} />
                                        <span>{t("Reload Classes")}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Khối hiển thị Gói tập đang hoạt động & Hạn mức Quota */}
                            {selectedMemberDetail && (
                                <div style={{
                                    backgroundColor: selectedMemberDetail.currentMembershipStatus === 'ACTIVE' ? 'var(--surface-hover)' : 'var(--surface)',
                                    border: `1px solid ${selectedMemberDetail.currentMembershipStatus === 'ACTIVE' ? 'var(--primary)' : 'var(--border)'}`,
                                    borderRadius: '0.85rem',
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '1rem'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <CreditCard style={{ width: '13px', height: '13px' }} />
                                                <span>{t("Current Package & Quotas")}</span>
                                            </span>
                                            <span style={{
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                backgroundColor: selectedMemberDetail.currentMembershipStatus === 'ACTIVE' ? 'var(--success-soft)' : 'var(--danger-soft)',
                                                color: selectedMemberDetail.currentMembershipStatus === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)',
                                                border: '1px solid var(--border)'
                                            }}>
                                                ● {t(selectedMemberDetail.currentMembershipStatus === 'ACTIVE' ? 'Active' : 'Expired')}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>
                                            {selectedMemberDetail.currentPackageName || t("No active membership package")}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                            {t("Type:")} <strong>{t(selectedMemberDetail.currentPackageType || 'N/A')}</strong>
                                            {selectedMemberDetail.currentMembershipStatus === 'ACTIVE' && (
                                                <span> • {t("Time remaining:")} <strong style={{ color: selectedMemberDetail.daysRemaining <= 7 ? 'var(--warning-text)' : 'var(--success-text)' }}>
                                                    {selectedMemberDetail.daysRemaining === 1
                                                        ? t("1 day left (Expires today)")
                                                        : `${selectedMemberDetail.daysRemaining ?? 0} ${t("days left")}`}
                                                </strong></span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Danh sách Quota theo bộ môn */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {(() => {
                                            const activePkg = (selectedMemberDetail.memberships || []).find((m) => m.active);
                                            if (activePkg && Array.isArray(activePkg.benefits) && activePkg.benefits.length > 0) {
                                                return activePkg.benefits.map((b, bIdx) => (
                                                    <div key={bIdx} style={{
                                                        padding: '0.4rem 0.75rem',
                                                        borderRadius: '0.5rem',
                                                        backgroundColor: 'var(--surface)',
                                                        border: '1px solid var(--border)',
                                                        fontSize: '0.8rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center'
                                                    }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{b.subjectName}</span>
                                                        <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                                                            {b.remainingSessions ?? b.sessionLimit} / {b.sessionLimit} {t("sessions")}
                                                        </strong>
                                                    </div>
                                                ));
                                            }
                                            return (
                                                <div style={{
                                                    padding: '0.4rem 0.75rem',
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: 'var(--surface)',
                                                    border: '1px solid var(--border)',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                }}>
                                                    <Dumbbell style={{ width: '13px', height: '13px', color: 'var(--primary)' }} />
                                                    <span>{t("Gym & Equipment Access")}</span>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.85rem', fontWeight: 600 }}>{t("Enrolled Courses")} ({memberBookings.length})
                            </h4>

                            {loadingBookings ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t("Loading course enrolments...")}</p>
                            ) : memberBookings.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t("This member has no past or current course enrolments.")}</p>
                            ) : (
                                <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '0.75rem 1rem' }}>{t("Course Name")}</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>{t("Coach")}</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>{t("Room")}</th>
                                                <th style={{ padding: '0.75rem 1rem' }}>{t("Course Timeline")}</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t("Total Sessions")}</th>
                                                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t("Action")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {memberBookings.map((c, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text)' }}>{c.courseName}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>{c.coachName}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{c.roomName}</td>
                                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                                                        {formatDateTime(c.firstSessionDate)} → {formatDateTime(c.lastSessionDate)}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                                                        {c.sessionsCount}{' '}{t("sessions")}
                                                        {c.upcomingCount > 0 && (
                                                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                                                ({c.upcomingCount} {t("upcoming")})
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                            {(() => {
                                                                const cleanBaseName = (name = '') => name.replace(/\s*[-–(]?\s*(?:Đợt|Khóa|K|Tháng|T)\s*\d+.*[)]?/i, '').trim();
                                                                const baseName = cleanBaseName(c.courseName || c.className);
                                                                const nextBatch = memberBookings.find(other =>
                                                                    other !== c &&
                                                                    cleanBaseName(other.courseName || other.className) === baseName &&
                                                                    new Date(other.firstSessionDate) > new Date(c.firstSessionDate)
                                                                );

                                                                if (nextBatch) {
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleShowAlreadyRenewedNotice(c, nextBatch)}
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                gap: '0.35rem',
                                                                                padding: '0.4rem 0.85rem',
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
                                                                            <span>{t("Renewed")}</span>
                                                                        </button>
                                                                    );
                                                                }

                                                                return (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleFindRenewal(c.sampleBookingId, c.courseName || c.className)}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.4rem',
                                                                            padding: '0.4rem 0.85rem',
                                                                            backgroundColor: 'var(--primary-soft)',
                                                                            color: 'var(--text)',
                                                                            border: 'none',
                                                                            borderRadius: '0.5rem',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 600,
                                                                            cursor: 'pointer'
                                                                        }}
                                                                        title={t("Find next recurring session to renew")}
                                                                    >
                                                                        <RotateCw style={{ width: '12px', height: '12px' }} />
                                                                        <span>{t("Renew Course")}</span>
                                                                    </button>
                                                                );
                                                            })()}

                                                            {c.classId && c.upcomingCount > 0 && (
                                                                <button
                                                                    onClick={() => handleOpenCancelCourse(c)}
                                                                    style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.4rem',
                                                                        padding: '0.4rem 0.75rem',
                                                                        backgroundColor: 'var(--danger-soft)',
                                                                        color: 'var(--danger-text)',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: '0.5rem',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title={t("Cancel future sessions of this course and refund quota")}
                                                                >
                                                                    <Ban style={{ width: '12px', height: '12px' }} />
                                                                    <span>{t("Cancel Course")}</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Khóa học trong giỏ hàng chờ thanh toán (First-come first-served) */}
                            {memberCartBookings.length > 0 && (
                                <div style={{ marginTop: '1.5rem', border: '1px solid #fcd34d', backgroundColor: '#fffbeb', borderRadius: '0.75rem', padding: '1.15rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.1rem' }}>🛒</span>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', fontWeight: 700 }}>
                                                {t("Cart / Pending Payment")} ({memberCartBookings.length})
                                            </h4>
                                        </div>
                                        <span style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 500, backgroundColor: '#fef3c7', padding: '0.2rem 0.65rem', borderRadius: '9999px', border: '1px solid #fde68a' }}>
                                            ⚠️ {t("Seats not reserved · Pay at counter to confirm enrollment")}
                                        </span>
                                    </div>
                                    <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                                    <th style={{ padding: '0.75rem 1rem' }}>{t("Course Name")}</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>{t("Coach")}</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>{t("Room")}</th>
                                                    <th style={{ padding: '0.75rem 1rem' }}>{t("Course Timeline")}</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t("Total Sessions")}</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>{t("Action")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {memberCartBookings.map((c, idx) => (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text)' }}>
                                                            {c.courseName}
                                                            <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600 }}>
                                                                {t("In Cart")}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text)' }}>{c.coachName}</td>
                                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{c.roomName}</td>
                                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                                                            {formatDateTime(c.firstSessionDate)} → {formatDateTime(c.lastSessionDate)}
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                                                            {c.sessionsCount}{' '}{t("sessions")}
                                                        </td>
                                                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenEnrollModal(c.classId)}
                                                                    style={{
                                                                        padding: '0.4rem 0.85rem',
                                                                        borderRadius: '0.5rem',
                                                                        border: '1px solid #16a34a',
                                                                        backgroundColor: '#16a34a',
                                                                        color: '#ffffff',
                                                                        fontSize: '0.78rem',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.35rem'
                                                                    }}
                                                                    title={t("Collect payment at counter and confirm enrollment")}
                                                                >
                                                                    💳 {t("Pay at Counter")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenCancelCourse(c)}
                                                                    style={{
                                                                        padding: '0.4rem 0.75rem',
                                                                        borderRadius: '0.5rem',
                                                                        border: '1px solid var(--border)',
                                                                        backgroundColor: 'transparent',
                                                                        color: 'var(--text-muted)',
                                                                        fontSize: '0.78rem',
                                                                        fontWeight: 500,
                                                                        cursor: 'pointer'
                                                                    }}
                                                                    title={t("Remove from Cart")}
                                                                >
                                                                    ✕ {t("Remove")}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {renewalModalOpen && suggestedClass && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t("Enroll Next Recurring Course")}</h3>
                            <button onClick={() => setRenewalModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X style={{ width: '18px', height: '18px' }} />
                            </button>
                        </div>

                        {feedback && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: feedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', color: feedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)', fontSize: '0.85rem' }}>
                                {t(feedback.message)}
                            </div>
                        )}

                        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Target Course:")}</span><strong style={{ color: 'var(--text)' }}>{suggestedClass.className}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Coach:")}</span><span style={{ color: 'var(--text)' }}>{suggestedClass.coachName}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Room:")}</span><span style={{ color: 'var(--text)' }}>{suggestedClass.roomName}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Next Session Starts:")}</span><strong style={{ color: 'var(--primary)' }}>{formatDateTime(suggestedClass.startTime)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Course Fee:")}</span><strong style={{ color: 'var(--success-text)', fontSize: '0.95rem' }}>{formatCurrency(suggestedClass.price)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>{t("Availability:")}</span><span style={{ color: 'var(--text)' }}>{suggestedClass.availableSlots} / {suggestedClass.maxSlots}{' '}{t("slots")}</span></div>

                            <div style={{ marginTop: '0.4rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t("Payment method at counter:")}</span>
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
                            <button onClick={() => setRenewalModalOpen(false)} disabled={confirming} style={{ padding: '0.55rem 1rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>{t("Cancel")}</button>
                            <button onClick={handleConfirmEnrollment} disabled={confirming} style={{ padding: '0.55rem 1.25rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: confirming ? 'not-allowed' : 'pointer' }}>
                                {t(confirming ? t('Processing...') : t('Confirm Payment & Renew'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thông Báo Khi Không Tìm Thấy Lịch Gia Hạn Tiếp Theo */}
            {renewalNotice && renewalNotice.isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10001,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '480px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        boxShadow: 'var(--shadow)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', backgroundColor: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Info style={{ width: '18px', height: '18px' }} />
                                </div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                                    {t("Course Renewal Notice")}
                                </h3>
                            </div>
                            <button
                                onClick={() => setRenewalNotice(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                            >
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
                            {renewalNotice.type === 'NO_SCHEDULE' && (
                                <button
                                    onClick={() => {
                                        setRenewalNotice(null);
                                        handleOpenEnrollModal();
                                    }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        padding: '0.55rem 1.15rem',
                                        backgroundColor: 'var(--primary)',
                                        color: 'var(--on-primary)',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    <BookOpen style={{ width: '14px', height: '14px' }} />
                                    <span>{t("Enroll Another Class")}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đăng ký gói Combo */}
            {packageModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Layers style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t("Subscribe Combo Package")}</h3>
                            </div>
                            <button onClick={() => setPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                                <X style={{ width: '18px', height: '18px' }} />
                            </button>
                        </div>

                        {pkgFeedback && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: pkgFeedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', color: pkgFeedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                {t(pkgFeedback.message)}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>{t("Select Combo Package")}</label>
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', color: 'var(--text)', outline: 'none' }}
                                >
                                    {packagesList.map(p => (
                                        <option key={p.packageId} value={p.packageId}>
                                            {p.packageName} ({p.durationDays}{' '}{t("days) -")}{formatCurrency(p.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>{t("Activation Date")}</label>
                                <input
                                    type="date"
                                    value={startDateInput}
                                    onChange={(e) => setStartDateInput(e.target.value)}
                                    style={{ width: '100%', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.65rem', color: 'var(--text)', outline: 'none' }}
                                />
                            </div>

                            {/* Payment summary & method at counter */}
                            <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.65rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                                {(() => {
                                    const selPkg = packagesList.find(p => String(p.packageId) === String(selectedPackageId));
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t("Package Fee:")} <strong style={{ color: 'var(--text)' }}>{selPkg?.packageName || ''}</strong></span>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success-text)' }}>{formatCurrency(selPkg?.price || 0)}</span>
                                        </div>
                                    );
                                })()}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px dashed var(--border)' }}>
                                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)' }}>{t("Payment method at counter:")}</span>
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
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                            <button onClick={() => setPackageModalOpen(false)} disabled={subscribing} style={{ padding: '0.55rem 1rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>{t("Cancel")}</button>
                            <button onClick={handleConfirmSubscribe} disabled={subscribing} style={{ padding: '0.55rem 1.25rem', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: subscribing ? 'not-allowed' : 'pointer' }}>
                                {t(subscribing ? t('Subscribing...') : t('Confirm Payment & Subscribe'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Hủy Khóa Học (Course Cancellation Modal) */}
            {cancelModalOpen && cancelTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Ban style={{ width: '18px', height: '18px', color: 'var(--danger-text)' }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t("Cancel Course For Member")}</h3>
                            </div>
                            <button onClick={() => setCancelModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X style={{ width: '18px', height: '18px' }} />
                            </button>
                        </div>

                        {cancelFeedback && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: cancelFeedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', color: cancelFeedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                {t(cancelFeedback.message)}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                            <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.5 }}>
                                {t("Are you sure you want to cancel all {0} upcoming session(s) of course \"{1}\" for this member?").replace('{0}', cancelTarget.upcomingCount).replace('{1}', cancelTarget.courseName)}
                            </p>

                            <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-hover)', borderRadius: '0.5rem', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Info style={{ width: '14px', height: '14px', flexShrink: 0, color: 'var(--primary)' }} />
                                <span>{t("The cancelled session quota will be automatically returned and restored into the member's package benefits.")}</span>
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
                                onClick={handleConfirmCancelCourse}
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

            {/* Modal Đăng Ký Lớp Học Mới (Enroll in Class Modal) */}
            {enrollModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '580px',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* Fixed Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t("Enroll Member in Class")}</h3>
                            </div>
                            <button onClick={() => setEnrollModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                                <X style={{ width: '18px', height: '18px' }} />
                            </button>
                        </div>

                        {/* Scrollable Class List Section */}
                        <div style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                        }}>
                            {enrollFeedback && (
                                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: enrollFeedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)', color: enrollFeedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                    {t(enrollFeedback.message)}
                                </div>
                            )}

                            {loadingAvailableClasses ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{t("Loading available classes...")}</p>
                                </div>
                            ) : availableClasses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}>{t("No upcoming open classes found at this time.")}</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {t("Select an upcoming class to enroll member")} <strong>{selectedMember?.fullName}</strong>.
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {availableClasses.map((cls) => {
                                            const isSelected = selectedClassId === String(cls.classId);
                                            const isBooked = !!cls.isBookedByMe;
                                            const totalSlots = cls.maxSlots != null ? cls.maxSlots : 20;
                                            const bookedSlots = cls.bookedSlots != null ? cls.bookedSlots : 0;
                                            const availableSlots = Math.max(0, totalSlots - bookedSlots);
                                            const isFull = availableSlots <= 0;

                                            return (
                                                <div
                                                    key={cls.classId}
                                                    onClick={() => {
                                                        if (!isBooked && !isFull) setSelectedClassId(String(cls.classId));
                                                    }}
                                                    style={{
                                                        padding: '0.85rem',
                                                        borderRadius: '0.65rem',
                                                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                                        backgroundColor: isSelected ? 'var(--primary-soft)' : (isBooked || isFull) ? 'var(--surface-hover)' : 'var(--surface)',
                                                        cursor: (isBooked || isFull) ? 'not-allowed' : 'pointer',
                                                        opacity: (isBooked || isFull) ? 0.6 : 1,
                                                        transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                                                        <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>
                                                            {cls.className}
                                                        </span>
                                                        <span style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '0.85rem' }}>
                                                            {formatMoney(cls.price || 0)}
                                                        </span>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <User style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                                            <span>{cls.coachName || t('Coach TBD')}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <MapPin style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                                            <span>{cls.roomName || t('Room TBD')}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <Clock style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                                            <span>{displayFormatDateTime(cls.nextSessionTime || cls.startTime)}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                            <Users style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                                            <span>{availableSlots}/{totalSlots} {t("slots left")}</span>
                                                        </div>
                                                    </div>

                                                    {isBooked && (
                                                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                            ✓ {t("Already enrolled")}
                                                        </div>
                                                    )}
                                                    {isFull && !isBooked && (
                                                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--danger-text)', fontWeight: 600 }}>
                                                            ✕ {t("Class is full")}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PINNED: Selected Class Summary & Payment Method Selection (Always visible, no scrolling needed) */}
                        {selectedClassId && (() => {
                            const sel = availableClasses.find(c => String(c.classId) === String(selectedClassId));
                            if (!sel) return null;
                            return (
                                <div style={{
                                    padding: '0.85rem 1.5rem',
                                    backgroundColor: 'var(--surface-hover)',
                                    borderTop: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.55rem',
                                    flexShrink: 0
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {t("Selected Class:")} <strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{sel.className}</strong>
                                        </span>
                                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--success-text)' }}>
                                            {formatMoney(sel.price || 0)}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.45rem', borderTop: '1px dashed var(--border)' }}>
                                        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text)' }}>{t("Payment method at counter:")}</span>
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
                            );
                        })()}

                        {/* Fixed Footer with Action Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem',
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={() => setEnrollModalOpen(false)}
                                disabled={enrolling}
                                style={{ padding: '0.55rem 1rem', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                {t("Cancel")}
                            </button>
                            <button
                                onClick={handleConfirmEnrollClass}
                                disabled={enrolling || !selectedClassId || availableClasses.length === 0}
                                style={{
                                    padding: '0.55rem 1.25rem',
                                    backgroundColor: 'var(--primary)',
                                    color: 'var(--on-primary)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: (enrolling || !selectedClassId || availableClasses.length === 0) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {enrolling ? t("Enrolling...") : t("Confirm Payment & Enroll")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xem chi tiết hồ sơ hội viên */}
            {detailModalOpen && selectedMember && (
                <MemberDetailModal
                    member={selectedMemberDetail || selectedMember}
                    onClose={() => {
                        setDetailModalOpen(false);
                        handleSelectMember(selectedMember);
                    }}
                />
            )}

            {/* Modal In & Xem hóa đơn/biên lai */}
            <InvoiceReceiptModal
                isOpen={receiptModalOpen}
                onClose={() => setReceiptModalOpen(false)}
                receipt={currentReceipt}
            />
        </div>
    );
}