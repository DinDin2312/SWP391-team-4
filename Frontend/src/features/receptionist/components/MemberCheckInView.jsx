import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  CreditCard,
  LogOut,
  Users,
  Activity,
  Calendar,
  FileText,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Eye,
  X,
  Dumbbell,
  GraduationCap,
  Zap,
  Key,
} from 'lucide-react';
import receptionistService from '../services/receptionistService';
import { AuthContext } from '../../../context/AuthContext';
import MemberDetailModal from './MemberDetailModal';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MemberCheckInView = ({ initialMemberId = null, onNavigateFeature }) => {
  useLanguage();
  const { userInfo } = useContext(AuthContext);

  // Member lookup state
  const [memberKeyword, setMemberKeyword] = useState('');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
  const [memberMemberships, setMemberMemberships] = useState([]);
  const [memberBookings, setMemberBookings] = useState([]);
  const [loadingMemberships, setLoadingMemberships] = useState(false);

  // Check-in form state
  const [checkInType, setCheckInType] = useState('GYM_FACILITY'); // 'GYM_FACILITY' | 'CLASS_SESSION' | 'COMBO_ALL'
  const [selectedMembershipId, setSelectedMembershipId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [activateEarly, setActivateEarly] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [customFacility, setCustomFacility] = useState('');
  const [note, setNote] = useState('');
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Facility rooms & Check-in history state
  const [rooms, setRooms] = useState([]);
  const [historyDate, setHistoryDate] = useState(getTodayDateString());
  const [historyKeyword, setHistoryKeyword] = useState('');
  const [historyStatus, setHistoryStatus] = useState('ALL');
  const [allDayRecords, setAllDayRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState(null);

  // Feedback banner & Detail modal
  const [feedback, setFeedback] = useState(null);
  const [detailModalUserId, setDetailModalUserId] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5500);
  };

  const fetchRooms = useCallback(async () => {
    try {
      const data = await receptionistService.getFacilityRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching facility rooms:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await receptionistService.getCheckInHistory({
        date: historyDate,
      });
      setAllDayRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching check-in history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [historyDate]);

  const fetchMembersList = useCallback(async (kw = '') => {
    setLoadingMembers(true);
    try {
      const data = await receptionistService.searchMembers({
        keyword: kw,
        status: 'ALL',
        membershipFilter: 'ALL',
      });
      const list = Array.isArray(data) ? data : [];
      setMembers(list);
      return list;
    } catch (err) {
      console.error('Error searching members for check-in:', err);
      return [];
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const handleSelectMember = useCallback(async (member) => {
    setSelectedMember(member);
    setSelectedMemberDetail(null);
    setSelectedMembershipId('');
    setSelectedBookingId('');
    setSelectedRoomId('');
    setActivateEarly(false);
    setFeedback(null);
    if (!member) {
      setMemberMemberships([]);
      setMemberBookings([]);
      return;
    }
    setLoadingMemberships(true);
    try {
      const detail = await receptionistService.getMemberDetail(member.userId);
      setSelectedMemberDetail(detail);
      const pkgList = Array.isArray(detail?.memberships) ? detail.memberships : [];
      const bksList = Array.isArray(detail?.bookings) ? detail.bookings : [];
      setMemberMemberships(pkgList);
      setMemberBookings(bksList);

      const activeOnes = pkgList.filter((m) => m.active);
      const todayStr = getTodayDateString();
      const todaysClasses = bksList.filter(
        (b) => b.startTime && b.startTime.slice(0, 10) === todayStr && b.bookingStatus === 'CONFIRMED'
      );

      if (activeOnes.length > 0) {
        setSelectedMembershipId(String(activeOnes[0].membershipId));
      }
      if (todaysClasses.length > 0) {
        setSelectedBookingId(String(todaysClasses[0].bookingId));
        if (todaysClasses[0].roomId) {
          setSelectedRoomId(String(todaysClasses[0].roomId));
        }
      }
    } catch (err) {
      console.error('Error loading member profile for check-in:', err);
      setMemberMemberships([]);
      setMemberBookings([]);
    } finally {
      setLoadingMemberships(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchHistory();
  }, [fetchRooms, fetchHistory]);

  useEffect(() => {
    fetchMembersList('').then((list) => {
      if (initialMemberId && list.length > 0) {
        const found = list.find((m) => Number(m.userId) === Number(initialMemberId));
        if (found) {
          handleSelectMember(found);
        }
      }
    });
  }, [initialMemberId, fetchMembersList, handleSelectMember]);

  const handleSearchMembersSubmit = (e) => {
    e.preventDefault();
    fetchMembersList(memberKeyword);
  };

  // Determine if the selected member is currently checked in today
  const activeCheckInForSelectedMember = useMemo(() => {
    if (!selectedMember) return null;
    return allDayRecords.find(
      (r) =>
        Number(r.userId) === Number(selectedMember.userId) &&
        r.status === 'CHECKED_IN'
    );
  }, [selectedMember, allDayRecords]);

  // Active memberships for the selected member (truly active today: startDate <= today <= endDate)
  const activeMemberships = useMemo(() => {
    return memberMemberships.filter((m) => m.active);
  }, [memberMemberships]);

  const upcomingMemberships = useMemo(() => {
    return memberMemberships.filter((m) => m.status === 'UPCOMING');
  }, [memberMemberships]);

  // Today's enrolled classes for the selected member
  const todayClasses = useMemo(() => {
    if (!Array.isArray(memberBookings)) return [];
    const todayStr = getTodayDateString();
    return memberBookings.filter((b) => {
      if (!b.startTime) return false;
      const bDate = b.startTime.slice(0, 10);
      return bDate === todayStr && b.bookingStatus === 'CONFIRMED';
    });
  }, [memberBookings]);

  // Currently selected class booking object
  const selectedClassBooking = useMemo(() => {
    if (!todayClasses.length) return null;
    return todayClasses.find((b) => String(b.bookingId) === String(selectedBookingId)) || todayClasses[0];
  }, [todayClasses, selectedBookingId]);

  // Allowed rooms for currently chosen membership
  const selectedMembershipObj = useMemo(() => {
    return activeMemberships.find(
      (m) => String(m.membershipId) === String(selectedMembershipId)
    );
  }, [activeMemberships, selectedMembershipId]);

  const allowedRoomIdsForSelectedPackage = useMemo(() => {
    if (!selectedMembershipObj || !Array.isArray(selectedMembershipObj.benefits)) {
      return null;
    }
    const ids = new Set();
    selectedMembershipObj.benefits.forEach((b) => {
      if (Array.isArray(b.rooms)) {
        b.rooms.forEach((r) => {
          if (r.roomId != null) ids.add(Number(r.roomId));
        });
      }
    });
    return ids.size > 0 ? ids : null;
  }, [selectedMembershipObj]);

  const hasGymAccess = useMemo(() => {
    return activeMemberships.length > 0 || (activateEarly && upcomingMemberships.length > 0);
  }, [activeMemberships, activateEarly, upcomingMemberships]);

  const hasTodayClass = useMemo(() => {
    return todayClasses.length > 0;
  }, [todayClasses]);

  const handleConfirmCheckIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedMember) {
      showFeedback('error', t('Please choose a member first.'));
      return;
    }

    if (!hasGymAccess && !hasTodayClass && !activateEarly) {
      showFeedback('error', t('Hội viên không có gói tập hợp lệ và không có lịch học hôm nay. Không thể Check-in.'));
      return;
    }

    setSubmittingCheckIn(true);
    setFeedback(null);
    try {
      const payload = {
        userId: Number(selectedMember.userId),
        membershipId: selectedMembershipId ? Number(selectedMembershipId) : (activeMemberships[0]?.membershipId || (activateEarly && upcomingMemberships[0]?.membershipId) || null),
        bookingId: selectedBookingId ? Number(selectedBookingId) : (todayClasses[0]?.bookingId || null),
        activateEarly: Boolean(activateEarly),
        roomId: selectedRoomId ? Number(selectedRoomId) : null,
        note: note.trim() || null,
        receptionistEmail: userInfo?.email || 'letan@sport.com',
      };

      const record = await receptionistService.checkInMember(payload);

      showFeedback(
        'success',
        `${t('Check-in successful for')} ${record.memberName || selectedMember.fullName}! ${record.packageName}${record.accessCode ? ` (${t('Door Code:')} ${record.accessCode})` : ''}`
      );
      setNote('');
      setActivateEarly(false);

      // Refresh data
      await Promise.all([
        fetchHistory(),
        fetchRooms(),
        handleSelectMember(selectedMember),
        fetchMembersList(memberKeyword),
      ]);
    } catch (err) {
      const msg =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message || err?.message || t('Unable to complete member check-in.');
      showFeedback('error', msg);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleCheckOut = async (checkInId, memberName) => {
    setCheckingOutId(checkInId);
    try {
      await receptionistService.checkOutMember(checkInId);
      showFeedback('success', `${t('Checked out successfully:')} ${memberName}`);
      await Promise.all([fetchHistory(), fetchRooms()]);
    } catch (err) {
      const msg =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : err?.response?.data?.message || err?.message || t('Unable to check out member.');
      showFeedback('error', msg);
    } finally {
      setCheckingOutId(null);
    }
  };

  // Summary statistics
  const stats = useMemo(() => {
    const total = allDayRecords.length;
    const activeInCenter = allDayRecords.filter((r) => r.status === 'CHECKED_IN').length;
    const checkedOut = allDayRecords.filter((r) => r.status === 'CHECKED_OUT').length;
    const anomalies = allDayRecords.filter((r) => r.hasAnomaly).length;
    return { total, activeInCenter, checkedOut, anomalies, roomCount: rooms.length };
  }, [allDayRecords, rooms]);

  // Filtered check-in records for display in table
  const filteredRecords = useMemo(() => {
    const kw = historyKeyword.trim().toLowerCase();
    return allDayRecords.filter((rec) => {
      if (historyStatus === 'CHECKED_IN' && rec.status !== 'CHECKED_IN') return false;
      if (historyStatus === 'CHECKED_OUT' && rec.status !== 'CHECKED_OUT') return false;
      if (historyStatus === 'ANOMALY' && !rec.hasAnomaly) return false;
      if (kw) {
        const matches =
          (rec.memberName && rec.memberName.toLowerCase().includes(kw)) ||
          (rec.memberPhone && rec.memberPhone.toLowerCase().includes(kw)) ||
          (rec.memberEmail && rec.memberEmail.toLowerCase().includes(kw)) ||
          (rec.packageName && rec.packageName.toLowerCase().includes(kw)) ||
          (rec.facilityName && rec.facilityName.toLowerCase().includes(kw)) ||
          (rec.note && rec.note.toLowerCase().includes(kw)) ||
          (rec.accessCode && rec.accessCode.toLowerCase().includes(kw)) ||
          (rec.userId && String(rec.userId).includes(kw));
        if (!matches) return false;
      }
      return true;
    });
  }, [allDayRecords, historyStatus, historyKeyword]);

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '—';
    const d = new Date(dtStr);
    if (Number.isNaN(d.getTime())) return String(dtStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
      ' - ' +
      d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTimeOnly = (dtStr) => {
    if (!dtStr) return '—';
    const d = new Date(dtStr);
    if (Number.isNaN(d.getTime())) return String(dtStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ===================== PAGE HEADER ===================== */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'var(--surface)',
          padding: '1.35rem 1.5rem',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.85rem',
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <UserCheck style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
                {t('Member Check-in & Facility Access')}
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--success-soft)',
                  color: 'var(--success-text)',
                  border: '1px solid var(--border)',
                }}
              >
                {t('Front Desk Counter')}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {t('Verify active gym/facility packages, record member entry & exit, and monitor live room occupancy.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchHistory();
            fetchRooms();
            fetchMembersList(memberKeyword);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '0.65rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw style={{ width: '15px', height: '15px' }} />
          {t('Refresh Data')}
        </button>
      </div>

      {/* ===================== FEEDBACK ALERT ===================== */}
      {feedback && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.9rem 1.25rem',
            borderRadius: '0.85rem',
            backgroundColor: feedback.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
            color: feedback.type === 'success' ? 'var(--success-text)' : 'var(--danger-text)',
            border: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {feedback.type === 'success' ? (
              <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            ) : (
              <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* ===================== 4 LIVE STAT CARDS ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('Total Check-ins')}
            </p>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)' }}>
              {stats.total}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {historyDate === getTodayDateString() ? t('Today') : historyDate}
            </span>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--primary-soft)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          onClick={() => setHistoryStatus(historyStatus === 'CHECKED_IN' ? 'ALL' : 'CHECKED_IN')}
          style={{
            backgroundColor: 'var(--surface)',
            border: historyStatus === 'CHECKED_IN' ? '2px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-text)', textTransform: 'uppercase' }}>
              {t('Currently In Center')}
            </p>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--success-text)' }}>
              {stats.activeInCenter}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('Active in gym/facilities')}
            </span>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--success-soft)',
              color: 'var(--success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          onClick={() => setHistoryStatus(historyStatus === 'CHECKED_OUT' ? 'ALL' : 'CHECKED_OUT')}
          style={{
            backgroundColor: 'var(--surface)',
            border: historyStatus === 'CHECKED_OUT' ? '2px solid var(--primary)' : '1px solid var(--border)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('Checked Out')}
            </p>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)' }}>
              {stats.checkedOut}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('Completed sessions')}
            </span>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--bg)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
            }}
          >
            <CheckCircle2 style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              {t('Facility Zones')}
            </p>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)' }}>
              {stats.roomCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('Available training rooms')}
            </span>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--violet-soft)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin style={{ width: '22px', height: '22px' }} />
          </div>
        </div>

        <div
          onClick={() => setHistoryStatus(historyStatus === 'ANOMALY' ? 'ALL' : 'ANOMALY')}
          style={{
            backgroundColor: 'var(--surface)',
            border: historyStatus === 'ANOMALY' ? '2px solid #EF4444' : '1px solid var(--border)',
            borderRadius: '0.9rem',
            padding: '1.1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase' }}>
              {t('Anomalies')}
            </p>
            <h3 style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 800, color: '#EF4444' }}>
              {stats.anomalies}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('Coach flagged absent')}
            </span>
          </div>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '0.75rem',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert style={{ width: '22px', height: '22px' }} />
          </div>
        </div>
      </div>

      {/* ===================== MAIN 2-COLUMN WORKSPACE ===================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 430px) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* ================= LEFT COLUMN: CHECK-IN TERMINAL ================= */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.35rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
              {t('Quick Member Check-in Desk')}
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('Search by member name, phone, email, or ID to verify package status.')}
            </p>
          </div>

          {/* Search Member Form */}
          <form onSubmit={handleSearchMembersSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={memberKeyword}
                onChange={(e) => {
                  const val = e.target.value;
                  setMemberKeyword(val);
                  if (selectedMember) {
                    handleSelectMember(null);
                  }
                  fetchMembersList(val);
                }}
                placeholder={t('Enter member name, phone, email or #ID...')}
                style={{
                  width: '100%',
                  padding: memberKeyword
                    ? '0.65rem 2.2rem 0.65rem 2.3rem'
                    : '0.65rem 0.75rem 0.65rem 2.3rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                }}
              />
              {memberKeyword && (
                <button
                  type="button"
                  onClick={() => {
                    setMemberKeyword('');
                    fetchMembersList('');
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={t('Clear search')}
                >
                  <X style={{ width: '14px', height: '14px' }} />
                </button>
              )}
            </div>
          </form>

          {/* Member Quick List (shown when no member is selected) */}
          {!selectedMember && (
            <div
              style={{
                maxHeight: '380px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg)',
              }}
            >
              {loadingMembers ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('Searching members...')}
                </div>
              ) : members.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('No matching members found.')}
                </div>
              ) : (
                members.map((m) => {
                  const isChosen = selectedMember?.userId === m.userId;
                  const isMemberActive = m.membershipStatus === 'ACTIVE';
                  const isExpiring = m.daysRemaining != null && m.daysRemaining > 0 && m.daysRemaining <= 7 && isMemberActive;

                  return (
                    <div
                      key={m.userId}
                      onClick={() => handleSelectMember(m)}
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: isChosen ? 'var(--primary-soft)' : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)' }}>
                            {m.fullName}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            #{m.userId}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {m.phone || t('No phone')} • {m.email}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.18rem 0.5rem',
                            borderRadius: '999px',
                            backgroundColor: isMemberActive
                              ? isExpiring
                                ? 'var(--warning-soft)'
                                : 'var(--success-soft)'
                              : 'var(--danger-soft)',
                            color: isMemberActive
                              ? isExpiring
                                ? 'var(--warning-text)'
                                : 'var(--success-text)'
                              : 'var(--danger-text)',
                          }}
                        >
                          {isMemberActive
                            ? isExpiring
                              ? `${t('Expiring')} (${m.daysRemaining}d)`
                              : t('Active Package')
                            : m.membershipStatus === 'EXPIRED'
                            ? t('Expired')
                            : t('No Package')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Selected Member Verification & Form */}
          {selectedMember ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Selected Member Header Card */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '0.8rem',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                }}
              >
                {/* Top Row: Full Name + ID + Active Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={selectedMember.fullName}
                    >
                      {selectedMember.fullName}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      #{selectedMember.userId}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.18rem 0.5rem',
                      borderRadius: '0.35rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      backgroundColor:
                        selectedMember.status === 'ACTIVE' ? 'var(--success-soft)' : 'var(--danger-soft)',
                      color:
                        selectedMember.status === 'ACTIVE' ? 'var(--success-text)' : 'var(--danger-text)',
                    }}
                  >
                    {selectedMember.status === 'ACTIVE' ? t('● Active') : t('● Inactive')}
                  </span>
                </div>

                {/* Bottom Row: Contact info + Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)' }}>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                    title={`${selectedMember.phone || '—'} • ${selectedMember.email}`}
                  >
                    {selectedMember.phone || '—'} • {selectedMember.email}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleSelectMember(null)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.35rem 0.6rem',
                        borderRadius: '0.45rem',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                      title={t('Change member')}
                    >
                      <X style={{ width: '13px', height: '13px' }} />
                      {t('Change')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailModalUserId(selectedMember.userId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.45rem',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--primary)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Eye style={{ width: '13px', height: '13px' }} />
                      {t('Details')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Anomaly Warning Banner for selected member */}
              {selectedMemberDetail && selectedMemberDetail.anomalyCount > 0 && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldAlert style={{ width: '15px', height: '15px', flexShrink: 0, color: '#DC2626' }} />
                  <span>
                    {t('Notice: Member was recorded absent by coach {0} time(s) after check-in.', [selectedMemberDetail.anomalyCount])}
                  </span>
                </div>
              )}

              {/* Case 1: Member is already checked in */}
              {activeCheckInForSelectedMember ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '0.8rem',
                    backgroundColor: 'var(--primary-soft)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem' }}>
                    <Activity style={{ width: '18px', height: '18px' }} />
                    <span>{t('Member is currently checked in at the center')}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                    <div>
                      <strong>{t('Facility / Zone:')}</strong> {activeCheckInForSelectedMember.facilityName}
                    </div>
                    <div>
                      <strong>{t('Package:')}</strong> {activeCheckInForSelectedMember.packageName}
                    </div>
                    <div>
                      <strong>{t('Check-in Time:')}</strong> {formatTimeOnly(activeCheckInForSelectedMember.checkInTime)}
                    </div>
                    {activeCheckInForSelectedMember.note && (
                      <div>
                        <strong>{t('Note:')}</strong> {activeCheckInForSelectedMember.note}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={checkingOutId === activeCheckInForSelectedMember.checkInId}
                    onClick={() =>
                      handleCheckOut(
                        activeCheckInForSelectedMember.checkInId,
                        activeCheckInForSelectedMember.memberName
                      )
                    }
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.65rem',
                      border: 'none',
                      backgroundColor: '#EF4444',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: checkingOutId === activeCheckInForSelectedMember.checkInId ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 1px 3px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <LogOut style={{ width: '16px', height: '16px' }} />
                    {checkingOutId === activeCheckInForSelectedMember.checkInId ? t('Checking out...') : t('Check-out Member Now')}
                  </button>
                </div>
              ) : loadingMemberships ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {t('Checking member package eligibility...')}
                </div>
              ) : (activeMemberships.length === 0 && todayClasses.length === 0 && !activateEarly) ? (
                /* Case 2: No active membership and no class today -> Block or offer Early Activation / Renewal */
                <div
                  style={{
                    padding: '1.1rem',
                    borderRadius: '0.85rem',
                    backgroundColor: upcomingMemberships.length > 0 ? 'var(--warning-soft)' : 'var(--danger-soft)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: upcomingMemberships.length > 0 ? 'var(--warning-text)' : 'var(--danger-text)', fontWeight: 800, fontSize: '0.9rem' }}>
                    {upcomingMemberships.length > 0 ? (
                      <Clock style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    ) : (
                      <ShieldAlert style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    )}
                    <span>
                      {upcomingMemberships.length > 0
                        ? t('Gói tập chưa đến ngày bắt đầu hiệu lực')
                        : t('Ineligible for Check-in: No Active Package')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: upcomingMemberships.length > 0 ? 'var(--warning-text)' : 'var(--danger-text)', lineHeight: 1.45 }}>
                    {upcomingMemberships.length > 0
                      ? `${t('Gói')} "${upcomingMemberships[0].packageName}" ${t('được đăng ký bắt đầu từ ngày')} ${upcomingMemberships[0].startDate} (${t('hết hạn')} ${upcomingMemberships[0].endDate}). ${t('Hiện tại chưa đến ngày bắt đầu nên hội viên chưa thể Check-in vào tập.')}`
                      : t('This member does not have an active membership package or their package has expired. Please register or renew a package at the counter before checking in.')}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.2rem' }}>
                    {upcomingMemberships.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivateEarly(true);
                          setCheckInType('GYM_FACILITY');
                          setSelectedMembershipId(String(upcomingMemberships[0].membershipId));
                        }}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.6rem',
                          border: 'none',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <Zap style={{ width: '15px', height: '15px' }} />
                        {t('Activate Early From Today')}
                      </button>
                    )}

                    {onNavigateFeature && (
                      <button
                        type="button"
                        onClick={() => onNavigateFeature('manage-memberships')}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: '0.6rem',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                        }}
                      >
                        <CreditCard style={{ width: '15px', height: '15px' }} />
                        {t('Go to Packages & Renewals')}
                        <ArrowRight style={{ width: '14px', height: '14px' }} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Case 3: Eligible (Active Gym Package or Class Session Today or Early Activation) */
                <form onSubmit={handleConfirmCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                  {/* Access Entitlements Card */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.85rem',
                      backgroundColor: (hasGymAccess && hasTodayClass)
                        ? 'rgba(99, 102, 241, 0.08)'
                        : hasGymAccess
                        ? 'rgba(16, 185, 129, 0.08)'
                        : 'rgba(14, 165, 233, 0.08)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
                        {t('Access Entitlements')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '0.4rem',
                          backgroundColor: (hasGymAccess && hasTodayClass) ? '#6366F1' : hasGymAccess ? '#10B981' : '#0EA5E9',
                          color: '#ffffff',
                        }}
                      >
                        {(hasGymAccess && hasTodayClass)
                          ? t('Gym & Class')
                          : hasGymAccess
                          ? t('Gym Access')
                          : t('Class Access')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem' }}>
                      {/* Gym Entitlement */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '0.45rem',
                            backgroundColor: hasGymAccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                            color: hasGymAccess ? '#10B981' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.1rem',
                          }}
                        >
                          <Dumbbell style={{ width: '15px', height: '15px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: hasGymAccess ? 'var(--text)' : 'var(--text-muted)' }}>
                            {t('Gym & Equipment Area')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {hasGymAccess
                              ? `${t('Package:')} ${activeMemberships[0]?.packageName || t('Active Gym Package')}`
                              : t('No active gym package')}
                          </div>
                        </div>
                      </div>

                      {/* Class Entitlement */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '0.45rem',
                            backgroundColor: hasTodayClass ? 'rgba(14, 165, 233, 0.15)' : 'rgba(156, 163, 175, 0.15)',
                            color: hasTodayClass ? '#0EA5E9' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '0.1rem',
                          }}
                        >
                          <GraduationCap style={{ width: '15px', height: '15px' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: hasTodayClass ? 'var(--text)' : 'var(--text-muted)' }}>
                            {t("Today's Class")}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {hasTodayClass
                              ? `${todayClasses[0]?.className} ${t('at')} ${todayClasses[0]?.startTime?.slice(11, 16)} (${todayClasses[0]?.roomName || t('Classroom')}) • ${t('Coach:')} ${todayClasses[0]?.coachName || t('Coach')}`
                              : t('No classes scheduled today')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Early Activation Notice if user has upcoming membership */}
                  {activateEarly && (
                    <div
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0.65rem',
                        backgroundColor: 'var(--warning-soft)',
                        color: 'var(--warning-text)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Zap style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                        <span>
                          <strong>{t('Early Activation:')}</strong> {upcomingMemberships[0]?.packageName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActivateEarly(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'inherit',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  )}

                  {/* Optional Counter Note / Locker Key */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
                      {t('Counter Note / Locker Key (Optional)')}
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('e.g., Locker #18, Towel issued, Morning workout...')}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '0.65rem',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingCheckIn || selectedMember.status !== 'ACTIVE'}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1.2rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      cursor: submittingCheckIn ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <UserCheck style={{ width: '18px', height: '18px' }} />
                    {submittingCheckIn ? t('Processing Check-in...') : t('Confirm Check-in')}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--bg)',
                border: '1px dashed var(--border)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
              }}
            >
              {t('Click on a member from the list above to verify their membership and perform check-in.')}
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN: DAILY CHECK-IN LOG ================= */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            padding: '1.35rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.85rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '18px', height: '18px', color: 'var(--primary)' }} />
                {t('Daily Check-in & Facility Attendance Log')}
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {t('Real-time tracking of members currently training and completed visits.')}
              </p>
            </div>

            {/* Date Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg)', padding: '0.35rem 0.65rem', borderRadius: '0.6rem', border: '1px solid var(--border)' }}>
                <Calendar style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
              {historyDate !== getTodayDateString() && (
                <button
                  type="button"
                  onClick={() => setHistoryDate(getTodayDateString())}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0.55rem',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t('Today')}
                </button>
              )}
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                value={historyKeyword}
                onChange={(e) => setHistoryKeyword(e.target.value)}
                placeholder={t('Filter log by member name, phone, package, room, note...')}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.2rem',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.83rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: t('All Visits') },
                { id: 'CHECKED_IN', label: t('In Center') },
                { id: 'CHECKED_OUT', label: t('Checked Out') },
                { id: 'ANOMALY', label: `⚠️ ${t('Anomalies')} (${stats.anomalies})` },
              ].map((tab) => {
                const active = historyStatus === tab.id;
                const isAnomalyTab = tab.id === 'ANOMALY';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryStatus(tab.id)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border)',
                      backgroundColor: active
                        ? isAnomalyTab
                          ? '#EF4444'
                          : 'var(--primary)'
                        : 'var(--bg)',
                      color: active
                        ? '#fff'
                        : isAnomalyTab && stats.anomalies > 0
                        ? '#EF4444'
                        : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Check-in History Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '0.85rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', minWidth: '130px' }}>
                    {t('Member')}
                  </th>
                  <th style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', minWidth: '180px' }}>
                    {t('Package & Facility')}
                  </th>
                  <th style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', minWidth: '140px', whiteSpace: 'nowrap' }}>
                    {t('Check-in / Out Time')}
                  </th>
                  <th style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', minWidth: '120px', whiteSpace: 'nowrap' }}>
                    {t('Status')}
                  </th>
                  <th style={{ padding: '0.8rem 1rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', textAlign: 'right', minWidth: '135px', whiteSpace: 'nowrap' }}>
                    {t('Action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t('Loading check-in records...')}
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t('No check-in records found for the selected filter.')}
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => {
                    const isCurrentlyIn = rec.status === 'CHECKED_IN';
                    return (
                      <tr
                        key={rec.checkInId}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          backgroundColor: rec.hasAnomaly ? 'rgba(239, 68, 68, 0.04)' : isCurrentlyIn ? 'var(--surface)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                            {rec.memberName}{' '}
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              #{rec.userId}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {rec.memberPhone || '—'} • {rec.memberEmail}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{rec.packageName}</span>
                            {rec.checkInType === 'CLASS_SESSION' || rec.packageType === 'CLASS' ? (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '0.35rem',
                                  backgroundColor: 'var(--primary-soft)',
                                  color: 'var(--primary)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {t('Class Session')}
                              </span>
                            ) : rec.checkInType === 'COMBO_ALL' ? (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '0.35rem',
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  border: '1px solid #C7D2FE',
                                }}
                              >
                                {t('Combo Gym + Lớp')}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '0.35rem',
                                  backgroundColor: 'var(--bg)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                {t('Gym Workout')}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 600 }}>
                            <MapPin style={{ width: '13px', height: '13px' }} />
                            <span>{rec.facilityName}</span>
                          </div>

                          {/* Access Code Pill / Class Direct Entry Pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                            {rec.accessCode ? (
                              <div
                                title={t('Mã quét mở khóa cửa phân khu gym công cộng')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '0.35rem',
                                  backgroundColor: 'var(--surface-hover)',
                                  color: 'var(--text)',
                                  border: '1px solid var(--border)',
                                  fontWeight: 600,
                                }}
                              >
                                <Key style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />
                                <span>{t('Door Code:')} <strong style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>{rec.accessCode}</strong></span>
                              </div>
                            ) : rec.checkInType === 'CLASS_SESSION' ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '0.35rem',
                                  backgroundColor: '#EFF6FF',
                                  color: '#2563EB',
                                  border: '1px solid #BFDBFE',
                                  fontWeight: 600,
                                }}
                              >
                                <GraduationCap style={{ width: '12px', height: '12px' }} />
                                <span>{t('Class Session')}</span>
                              </div>
                            ) : null}

                            {rec.note && (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '0.35rem', backgroundColor: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                <FileText style={{ width: '11px', height: '11px' }} />
                                <span>{rec.note}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          <div style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {t('In:')} {formatDateTime(rec.checkInTime)}
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
                            {t('Out:')} {rec.checkOutTime ? formatDateTime(rec.checkOutTime) : '—'}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.22rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: isCurrentlyIn ? 'var(--success-soft)' : 'var(--bg)',
                                color: isCurrentlyIn ? 'var(--success-text)' : 'var(--text-muted)',
                                border: '1px solid var(--border)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: isCurrentlyIn ? 'var(--success-text)' : 'var(--text-muted)',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ whiteSpace: 'nowrap' }}>{isCurrentlyIn ? t('In Center') : t('Checked Out')}</span>
                            </span>

                            {rec.hasAnomaly && (
                              <div
                                title={rec.anomalyReason || t('Check-in vào trung tâm học lớp nhưng HLV ghi nhận VẮNG MẶT trong lớp')}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '0.4rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  backgroundColor: '#FEF2F2',
                                  color: '#EF4444',
                                  border: '1px solid #FCA5A5',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <ShieldAlert style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                                <span>{t('Coach flagged absent')}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => setDetailModalUserId(rec.userId)}
                              title={t('View Member Profile')}
                              style={{
                                padding: '0.4rem 0.6rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg)',
                                color: 'var(--text)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                flexShrink: 0,
                              }}
                            >
                              <Eye style={{ width: '14px', height: '14px' }} />
                            </button>

                            {isCurrentlyIn && (
                              <button
                                type="button"
                                disabled={checkingOutId === rec.checkInId}
                                onClick={() => handleCheckOut(rec.checkInId, rec.memberName)}
                                style={{
                                  padding: '0.42rem 0.75rem',
                                  borderRadius: '0.5rem',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--primary-soft)',
                                  color: 'var(--primary)',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                <LogOut style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                                <span style={{ whiteSpace: 'nowrap' }}>{t('Check-out')}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Member Detail Modal (with blurred backdrop & history state support) */}
      {detailModalUserId && (
        <MemberDetailModal
          userId={detailModalUserId}
          onClose={() => setDetailModalUserId(null)}
        />
      )}
    </div>
  );
};

export default MemberCheckInView;
