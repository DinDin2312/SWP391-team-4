import React, { useState, useEffect } from 'react';
import {
    Search,
    RotateCw,
    RefreshCw,
    CheckCircle2,
    XCircle,
    User,
    Shield,
    Layers,
    X
} from 'lucide-react';
import receptionistService from '../services/receptionistService';

export default function ManageMembershipsView() {
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

    // Gom nhóm các buổi lẻ (sessions) thành từng khóa học (course)
    const groupBookingsByCourse = (bookingsList) => {
        const grouped = {};
        (bookingsList || []).forEach((b) => {
            // Nhóm theo tên lớp học (hoặc classId nếu có)
            const key = b.className || 'Unknown Course';
            if (!grouped[key]) {
                grouped[key] = {
                    courseName: key,
                    coachName: b.coachName || 'N/A',
                    roomName: b.roomName || 'N/A',
                    firstSessionDate: b.startTime,
                    lastSessionDate: b.startTime,
                    sessionsCount: 0,
                    sampleBookingId: b.bookingId,
                };
            }
            grouped[key].sessionsCount += 1;
            if (new Date(b.startTime) < new Date(grouped[key].firstSessionDate)) {
                grouped[key].firstSessionDate = b.startTime;
            }
            if (new Date(b.startTime) > new Date(grouped[key].lastSessionDate)) {
                grouped[key].lastSessionDate = b.startTime;
                // Lấy booking của buổi học cuối cùng để làm mốc tính gia hạn
                grouped[key].sampleBookingId = b.bookingId;
            }
        });
        return Object.values(grouped);
    };

    // Select member & load enrolled courses
    const handleSelectMember = async (m) => {
        setSelectedMember(m);
        setLoadingBookings(true);
        setMemberBookings([]);
        try {
            const detail = await receptionistService.getMemberDetail(m.userId);
            const rawBookings = detail.bookings || [];
            // Gom nhóm trước khi lưu vào state
            setMemberBookings(groupBookingsByCourse(rawBookings));
        } catch (err) {
            console.error('Failed to load member classes:', err);
        } finally {
            setLoadingBookings(false);
        }
    };

    // 3. Find next class recommendation
    const handleFindRenewal = async (bookingId) => {
        setLoading(true);
        setFeedback(null);
        try {
            const data = await receptionistService.suggestNextClassRenewal(selectedMember.userId, bookingId);
            setSuggestedClass(data);
            setRenewalModalOpen(true);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'No upcoming recurring schedule found for this course.';
            alert(`Notice: ${msg}`);
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
            await receptionistService.confirmClassRenewal({
                userId: selectedMember.userId,
                newScheduleId: suggestedClass.suggestedScheduleId,
                previousBookingId: suggestedClass.currentBookingId,
            });

            setFeedback({ type: 'success', message: 'Successfully renewed and enrolled into the next class!' });
            setTimeout(() => {
                setRenewalModalOpen(false);
                setSuggestedClass(null);
                handleSelectMember(selectedMember); // Reload bookings list
            }, 1300);
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
        } catch (err) {
            alert('Failed to load packages list.');
        }
    };

    const handleConfirmSubscribe = async () => {
        if (!selectedPackageId) return;
        setSubscribing(true);
        setPkgFeedback(null);
        try {
            await receptionistService.subscribePackage({
                userId: selectedMember.userId,
                packageId: Number(selectedPackageId),
                startDate: startDateInput,
            });
            setPkgFeedback({ type: 'success', message: 'Combo Package subscribed successfully!' });
            setTimeout(() => {
                setPackageModalOpen(false);
                handleSelectMember(selectedMember);
            }, 1200);
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || 'Failed to subscribe package.';
            setPkgFeedback({ type: 'error', message: msg });
        } finally {
            setSubscribing(false);
        }
    };

    const formatDateTime = (dtStr) => {
        if (!dtStr) return '—';
        try {
            return new Date(dtStr).toLocaleString('en-US', {
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
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    Course & Membership Renewal
                </h1>
                <p style={{ margin: '0.4rem 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Select a member to view active course enrolments and automatically book next recurring classes.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                {/* Left Column: Select Member */}
                <div style={{ backgroundColor: '#091124', border: '1px solid #162444', borderRadius: '1rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="Search member name / phone..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#060b17', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.6rem 0.75rem 0.6rem 2.2rem', color: '#f8fafc', fontSize: '0.85rem', outline: 'none' }}
                            />
                        </div>
                        <button type="submit" style={{ padding: '0.6rem 0.9rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                            Find
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '520px', overflowY: 'auto' }}>
                        {loading && <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>Loading members...</p>}
                        {!loading && members.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>No active members found.</p>}
                        {members.map((m) => {
                            const isSelected = selectedMember?.userId === m.userId;
                            return (
                                <div
                                    key={m.userId}
                                    onClick={() => handleSelectMember(m)}
                                    style={{
                                        padding: '0.85rem',
                                        borderRadius: '0.75rem',
                                        backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.15)' : '#0d1833',
                                        border: `1px solid ${isSelected ? '#38bdf8' : '#1e293b'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{m.fullName}</strong>
                                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>#MEM-{String(m.userId).padStart(4, '0')}</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                                        {m.phone || m.email}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Member Courses & Renewal Workspace */}
                <div style={{ backgroundColor: '#091124', border: '1px solid #162444', borderRadius: '1rem', padding: '1.5rem', minHeight: '400px' }}>
                    {!selectedMember ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', textAlign: 'center', color: '#64748b' }}>
                            <Layers style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.4 }} />
                            <h3 style={{ margin: '0 0 0.35rem', color: '#94a3b8', fontSize: '1.1rem' }}>No Member Selected</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Select a member from the left list to review their classes and process renewal.</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                        {selectedMember.fullName}
                                    </h2>
                                    <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>
                    Member ID: #MEM-{String(selectedMember.userId).padStart(4, '0')} • {selectedMember.phone || selectedMember.email}
                  </span>
                                </div>

                                {/* Nhóm các nút thao tác phía trên */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                    <button
                                        onClick={handleOpenSubscribeModal}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            backgroundColor: '#10b981',
                                            border: 'none',
                                            color: '#ffffff',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Subscribe Combo Package
                                    </button>

                                    <button
                                        onClick={() => handleSelectMember(selectedMember)}
                                        disabled={loadingBookings}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            background: 'none',
                                            border: '1px solid #334155',
                                            color: '#cbd5e1',
                                            padding: '0.45rem 0.75rem',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <RefreshCw style={{ width: '13px', height: '13px', animation: loadingBookings ? 'spin 1s linear infinite' : 'none' }} />
                                        <span>Reload Classes</span>
                                    </button>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.85rem', fontWeight: 600 }}>
                                Enrolled Courses ({memberBookings.length})
                            </h4>

                            {loadingBookings ? (
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading course enrolments...</p>
                            ) : memberBookings.length === 0 ? (
                                <p style={{ color: '#64748b', fontSize: '0.85rem' }}>This member has no past or current course enrolments.</p>
                            ) : (
                                <div style={{ overflowX: 'auto', border: '1px solid #1e293b', borderRadius: '0.75rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                        <thead>
                                        <tr style={{ backgroundColor: '#0c1630', borderBottom: '1px solid #162444', color: '#94a3b8' }}>
                                            <th style={{ padding: '0.75rem 1rem' }}>Course Name</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Coach</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Room</th>
                                            <th style={{ padding: '0.75rem 1rem' }}>Course Timeline</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total Sessions</th>
                                            <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {memberBookings.map((c, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #162444' }}>
                                                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f8fafc' }}>{c.courseName}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>{c.coachName}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>{c.roomName}</td>
                                                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8' }}>
                                                    {formatDateTime(c.firstSessionDate)} → {formatDateTime(c.lastSessionDate)}
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center', color: '#38bdf8', fontWeight: 600 }}>
                                                    {c.sessionsCount} sessions
                                                </td>
                                                <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleFindRenewal(c.sampleBookingId)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.4rem 0.85rem',
                                                            backgroundColor: '#2563eb',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <RotateCw style={{ width: '12px', height: '12px' }} />
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
                </div>
            </div>

            {/* Confirmation Modal */}
            {renewalModalOpen && suggestedClass && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#0c1527', border: '1px solid #2563eb', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Enroll Next Recurring Course</h3>
                            <button onClick={() => setRenewalModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <X style={{ width: '18px', height: '18px' }} />
                            </button>
                        </div>

                        {feedback && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: feedback.type === 'success' ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
                                {feedback.message}
                            </div>
                        )}

                        <div style={{ backgroundColor: '#060b17', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Target Course:</span><strong style={{ color: '#f8fafc' }}>{suggestedClass.className}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Coach:</span><span style={{ color: '#cbd5e1' }}>{suggestedClass.coachName}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Room:</span><span style={{ color: '#cbd5e1' }}>{suggestedClass.roomName}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Next Session Starts:</span><strong style={{ color: '#38bdf8' }}>{formatDateTime(suggestedClass.startTime)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Course Fee:</span><strong style={{ color: '#34d399' }}>{formatCurrency(suggestedClass.price)}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Availability:</span><span style={{ color: '#e2e8f0' }}>{suggestedClass.availableSlots} / {suggestedClass.maxSlots} slots</span></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                            <button onClick={() => setRenewalModalOpen(false)} disabled={confirming} style={{ padding: '0.55rem 1rem', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleConfirmEnrollment} disabled={confirming} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: confirming ? 'not-allowed' : 'pointer' }}>
                                {confirming ? 'Enrolling...' : 'Confirm & Enroll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal đăng ký gói Combo */}
            {packageModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#0c1527', border: '1px solid #10b981', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.75rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>Subscribe Combo Package</h3>
                            <button onClick={() => setPackageModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                        </div>

                        {pkgFeedback && (
                            <div style={{ padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', backgroundColor: pkgFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: pkgFeedback.type === 'success' ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
                                {pkgFeedback.message}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                            <div>
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Select Combo Package</label>
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    style={{ width: '100%', backgroundColor: '#060b17', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.65rem', color: '#f8fafc', outline: 'none' }}
                                >
                                    {packagesList.map(p => (
                                        <option key={p.packageId} value={p.packageId}>
                                            {p.packageName} ({p.durationDays} days) - {formatCurrency(p.price)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Activation Date</label>
                                <input
                                    type="date"
                                    value={startDateInput}
                                    onChange={(e) => setStartDateInput(e.target.value)}
                                    style={{ width: '100%', backgroundColor: '#060b17', border: '1px solid #1e293b', borderRadius: '0.5rem', padding: '0.65rem', color: '#f8fafc', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setPackageModalOpen(false)} disabled={subscribing} style={{ padding: '0.55rem 1rem', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleConfirmSubscribe} disabled={subscribing} style={{ padding: '0.55rem 1.25rem', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: subscribing ? 'not-allowed' : 'pointer' }}>
                                {subscribing ? 'Subscribing...' : 'Confirm Subscription'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}