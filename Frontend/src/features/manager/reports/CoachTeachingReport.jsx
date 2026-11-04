import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDownToLine, CalendarDays, CalendarSync,
  CheckCircle2, Clock, RefreshCw, Search,
  UserCheck, Users, X
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore';
import { formatDate } from '../../../utils/displayFormat';
import { isoDate } from '../managerUtils';
import managerService from '../services/managerService';
import { exportCoachTeachingToExcel } from './coachTeachingExport';
import StaffAvatar from '../staff/StaffAvatar';

const LOW_OCCUPANCY = 40;

const count = value => new Intl.NumberFormat(locale()).format(Number(value || 0));
const percent = value => `${new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(Number(value || 0))}%`;

function OccupancyMeter({ rate }) {
  if (rate == null) return <span className="reports-occupancy-none">—</span>;
  const numRate = Number(rate);
  const low = numRate < LOW_OCCUPANCY;
  const high = numRate >= 85;
  return (
    <div className={`reports-occupancy${low ? ' is-low' : high ? ' is-high' : ''}`}>
      <span>
        {low && <AlertTriangle size={12} aria-label={t('Low occupancy')} />}
        {percent(numRate)}
      </span>
      <i aria-hidden="true">
        <b style={{ width: `${Math.max(0, Math.min(numRate, 100))}%` }} />
      </i>
    </div>
  );
}

export default function CoachTeachingReport({ initialFrom, initialTo }) {
  useLanguage();

  const [dateRange, setDateRange] = useState({
    from: initialFrom || isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    to: initialTo || isoDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
  });
  const [appliedRange, setAppliedRange] = useState(dateRange);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [appliedCoachId, setAppliedCoachId] = useState('');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local table filters
  const [coachSearch, setCoachSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState('ALL');

  const presets = ['This month', 'Last 7 days', 'Last 30 days'];
  const presetRange = label => {
    const to = new Date(), from = new Date(to);
    if (label === 'This month') from.setDate(1);
    else from.setDate(from.getDate() - (label === 'Last 7 days' ? 6 : 29));
    return { from: isoDate(from), to: isoDate(to) };
  };

  const loadReport = useCallback(async (from, to, coachId) => {
    setLoading(true);
    setError('');
    try {
      const res = await managerService.coachTeachingReport(from, to, coachId ? Number(coachId) : null);
      setData(res.data || res);
    } catch (err) {
      console.error('Failed to load coach teaching report:', err);
      setError(err?.response?.data?.message || t('Unable to load coach teaching report.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(appliedRange.from, appliedRange.to, appliedCoachId);
  }, [appliedRange, appliedCoachId, loadReport]);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    if (dateRange.from && dateRange.to && dateRange.from <= dateRange.to) {
      setAppliedRange(dateRange);
      setAppliedCoachId(selectedCoachId);
    }
  };

  const handleExport = () => {
    if (!data) return;
    exportCoachTeachingToExcel(data, appliedRange.from, appliedRange.to);
  };

  const overview = data?.overview || {};
  const coachStats = useMemo(() => data?.coachStats || [], [data]);
  const sessions = useMemo(() => data?.sessions || [], [data]);
  const coachesList = useMemo(() => data?.coaches || [], [data]);

  // Filtered coaches for table
  const filteredCoachStats = useMemo(() => {
    if (!coachSearch.trim()) return coachStats;
    const q = coachSearch.toLowerCase().trim();
    return coachStats.filter(c =>
      (c.coachName && c.coachName.toLowerCase().includes(q)) ||
      (c.coachEmail && c.coachEmail.toLowerCase().includes(q))
    );
  }, [coachStats, coachSearch]);

  // Filtered sessions for table
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      // Status filter
      if (sessionStatusFilter === 'COMPLETED' && s.status === 'CANCELLED') return false;
      if (sessionStatusFilter === 'CANCELLED' && s.status !== 'CANCELLED') return false;
      if (sessionStatusFilter === 'SUBSTITUTE' && !s.isSubstitute) return false;

      // Text search
      if (!sessionSearch.trim()) return true;
      const q = sessionSearch.toLowerCase().trim();
      return (
        (s.className && s.className.toLowerCase().includes(q)) ||
        (s.subjectName && s.subjectName.toLowerCase().includes(q)) ||
        (s.roomName && s.roomName.toLowerCase().includes(q)) ||
        (s.actualCoachName && s.actualCoachName.toLowerCase().includes(q)) ||
        (s.substituteNote && s.substituteNote.toLowerCase().includes(q))
      );
    });
  }, [sessions, sessionSearch, sessionStatusFilter]);

  const kpis = [
    {
      key: 'completed',
      label: 'Completed sessions',
      icon: CheckCircle2,
      value: count(overview.completedSessions || 0),
      note: t('Sessions successfully conducted in this period'),
      tone: 'success',
    },
    {
      key: 'hours',
      label: 'Teaching hours',
      icon: Clock,
      value: `${overview.totalTeachingHours || 0}h`,
      note: t('Total teaching time for completed sessions'),
      tone: 'revenue',
    },
    {
      key: 'substitutes',
      label: 'Substitute sessions',
      icon: CalendarSync,
      value: count(overview.substituteSessions || 0),
      note: t('Sessions where a substitute coach stepped in'),
      tone: 'pending',
    },
    {
      key: 'students',
      label: 'Total students taught',
      icon: Users,
      value: count(overview.totalStudents || 0),
      note: t('Total confirmed attendee seats across completed classes'),
      tone: 'bookings',
    },
    {
      key: 'occupancy',
      label: 'Avg occupancy rate',
      icon: UserCheck,
      value: percent(overview.avgOccupancyRate || 0),
      note: t('Average attendance ratio vs maximum class capacity'),
      tone: 'members',
    },
  ];

  return (
    <div className="coach-teaching-report">
      {/* FILTER BAR */}
      <form className="reports-filter" onSubmit={handleApplyFilter}>
        <div className="reports-filter-title">
          <CalendarDays size={18} aria-hidden="true" />
          <span>{t('Filter criteria')}</span>
        </div>

        {/* Date presets */}
        <div className="reports-presets">
          {presets.map(label => {
            const range = presetRange(label);
            const active = dateRange.from === range.from && dateRange.to === range.to;
            return (
              <button
                type="button"
                key={label}
                disabled={loading}
                aria-pressed={active}
                onClick={() => setDateRange(range)}
              >
                {t(label)}
              </button>
            );
          })}
        </div>

        {/* Coach Selector */}
        <div className="coach-filter-select">
          <label htmlFor="coach-select">{t('Coach')}</label>
          <select
            id="coach-select"
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value)}
            disabled={loading}
          >
            <option value="">{t('All coaches ({0})', [coachesList.length])}</option>
            {coachesList.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        {/* Date inputs */}
        <div className="reports-date-inputs">
          <label>
            {t('From')}
            <input
              type="date"
              value={dateRange.from}
              max={dateRange.to || undefined}
              onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
          </label>
          <span aria-hidden="true">–</span>
          <label>
            {t('To')}
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from || undefined}
              onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </label>
          <button className="manager-primary" type="submit" disabled={loading}>
            {loading ? <RefreshCw size={14} className="spin" /> : t('Apply')}
          </button>
        </div>
      </form>

      {/* ACTION BAR: PERIOD & EXPORT BUTTON */}
      <div className="reports-period">
        <span>
          {t('Coach teaching workload & performance overview')}
        </span>
        <div className="coach-report-actions">
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(appliedRange.from)} — {formatDate(appliedRange.to)}
            {appliedCoachId && (
              <span className="coach-badge-filter">
                {coachesList.find(c => String(c.id) === String(appliedCoachId))?.name || t('Selected coach')}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCoachId('');
                    setAppliedCoachId('');
                  }}
                  title={t('Clear coach filter')}
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </span>
          <button
            type="button"
            className="manager-secondary reports-export"
            disabled={!data || loading}
            onClick={handleExport}
          >
            <ArrowDownToLine size={16} aria-hidden="true" />
            {t('Export Excel (.xls)')}
          </button>
        </div>
      </div>

      {error && (
        <div className="reports-error-banner" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI STAT CARDS */}
      <div className="reports-kpis coach-kpis">
        {kpis.map(({ key, label, icon: Icon, value, note, tone }) => (
          <article key={key} className={`reports-kpi ${tone}${loading ? ' is-loading' : ''}`}>
            <div className="reports-kpi-label">
              <span>{t(label)}</span>
              <span className="reports-kpi-icon">
                <Icon size={18} aria-hidden="true" />
              </span>
            </div>
            <strong>{value}</strong>
            <p>{note}</p>
          </article>
        ))}
      </div>

      {/* SECTION 1: COACH SUMMARY TABLE */}
      <section className="reports-card coach-table-card">
        <div className="reports-card-header">
          <div>
            <h2>{t('Coach Workload & Performance Summary')}</h2>
            <p>{t('Workload, completed hours, substitutions and student attendance by coach.')}</p>
          </div>
          <div className="coach-table-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="text"
              placeholder={t('Search coach by name or email...')}
              value={coachSearch}
              onChange={e => setCoachSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="reports-class-table coach-stats-table-wrapper">
          <table>
            <thead>
              <tr>
                <th scope="col">{t('Coach')}</th>
                <th scope="col">{t('Completed')}</th>
                <th scope="col">{t('Upcoming')}</th>
                <th scope="col">{t('Cancelled')}</th>
                <th scope="col">{t('Total Hours')}</th>
                <th scope="col">{t('Substitute')}</th>
                <th scope="col">{t('Students')}</th>
                <th scope="col">{t('Occupancy')}</th>
                <th scope="col">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoachStats.length > 0 ? (
                filteredCoachStats.map(c => {
                  const userObj = {
                    userId: c.coachId,
                    fullName: c.coachName,
                    email: c.coachEmail,
                    avatarPath: c.avatarPath,
                  };
                  return (
                    <tr key={c.coachId}>
                      <td>
                        <div className="coach-cell-profile">
                          <StaffAvatar user={userObj} className="staff-table-avatar" />
                          <div>
                            <strong>{c.coachName}</strong>
                            <span className="reports-class-meta">{c.coachEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-completed">{count(c.completedSessions)}</span>
                      </td>
                      <td>{count(c.scheduledSessions)}</td>
                      <td>
                        {c.cancelledSessions > 0 ? (
                          <span className="badge-cancelled">{count(c.cancelledSessions)}</span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td>
                        <strong>{c.totalHours}h</strong>
                      </td>
                      <td>
                        <div className="substitute-counts">
                          {c.substituteSessionsCount > 0 && (
                            <span className="badge-sub-in" title={t('Taught as substitute for others')}>
                              +{c.substituteSessionsCount} {t('taught')}
                            </span>
                          )}
                          {c.transferredSessionsCount > 0 && (
                            <span className="badge-sub-out" title={t('Transferred class to substitute')}>
                              -{c.transferredSessionsCount} {t('transferred')}
                            </span>
                          )}
                          {!c.substituteSessionsCount && !c.transferredSessionsCount && '—'}
                        </div>
                      </td>
                      <td>
                        <strong>{count(c.totalStudents)}</strong>
                        {c.uniqueStudents > 0 && (
                          <span className="reports-class-meta">
                            {t('{0} unique', [count(c.uniqueStudents)])}
                          </span>
                        )}
                      </td>
                      <td>
                        <OccupancyMeter rate={c.avgOccupancyRate} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="coach-row-filter-btn"
                          onClick={() => {
                            setSelectedCoachId(String(c.coachId));
                            setAppliedCoachId(String(c.coachId));
                          }}
                        >
                          {t('View sessions')} →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="coach-table-empty">
                    {loading ? t('Loading...') : t('No coach data found matching criteria.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: DETAILED TEACHING SESSIONS */}
      <section className="reports-card coach-sessions-card">
        <div className="reports-card-header">
          <div>
            <h2>{t('Detailed Teaching Sessions')}</h2>
            <p>
              {appliedCoachId
                ? t('Showing sessions taught by {0}', [
                    coachesList.find(c => String(c.id) === String(appliedCoachId))?.name || t('selected coach')
                  ])
                : t('All scheduled and completed class sessions in this period.')}
            </p>
          </div>
          <div className="coach-session-controls">
            <div className="coach-table-search">
              <Search size={15} aria-hidden="true" />
              <input
                type="text"
                placeholder={t('Search by class, room, or coach...')}
                value={sessionSearch}
                onChange={e => setSessionSearch(e.target.value)}
              />
            </div>
            <div className="coach-status-pills">
              {['ALL', 'COMPLETED', 'SUBSTITUTE', 'CANCELLED'].map(st => (
                <button
                  type="button"
                  key={st}
                  className={`pill-btn${sessionStatusFilter === st ? ' is-active' : ''}`}
                  onClick={() => setSessionStatusFilter(st)}
                >
                  {t(st === 'ALL' ? 'All' : st === 'COMPLETED' ? 'Completed' : st === 'SUBSTITUTE' ? 'Substituted' : 'Cancelled')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="reports-class-table coach-sessions-table-wrapper">
          <table>
            <thead>
              <tr>
                <th scope="col">{t('Session Time')}</th>
                <th scope="col">{t('Class & Subject')}</th>
                <th scope="col">{t('Room')}</th>
                <th scope="col">{t('Teacher / Substitute')}</th>
                <th scope="col">{t('Duration')}</th>
                <th scope="col">{t('Attendees')}</th>
                <th scope="col">{t('Occupancy')}</th>
                <th scope="col">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length > 0 ? (
                filteredSessions.map(s => {
                  const startTimeStr = s.startTime ? s.startTime.replace('T', ' ').slice(0, 16) : '';
                  const timeStr = s.startTime && s.endTime ? `${s.startTime.slice(11, 16)} - ${s.endTime.slice(11, 16)}` : '';
                  const dateStr = startTimeStr ? startTimeStr.slice(0, 10) : '';

                  return (
                    <tr key={s.scheduleId}>
                      <td>
                        <strong>{dateStr}</strong>
                        <span className="reports-class-meta">{timeStr}</span>
                      </td>
                      <td>
                        <strong>{s.className}</strong>
                        {s.subjectName && <span className="reports-class-meta">{s.subjectName}</span>}
                      </td>
                      <td>{s.roomName || '—'}</td>
                      <td>
                        <div className="coach-sub-cell">
                          <strong>{s.actualCoachName}</strong>
                          {s.isSubstitute && (
                            <span className="badge-substitute-note">
                              {s.substituteNote}
                            </span>
                          )}
                          {s.isTransferred && (
                            <span className="badge-transferred-note">
                              {s.substituteNote}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{s.durationHours || 0}h</td>
                      <td>
                        <strong>{count(s.bookedStudents)}</strong> / {count(s.maxSlots)}
                      </td>
                      <td>
                        <OccupancyMeter rate={s.occupancyRate} />
                      </td>
                      <td>
                        <span className={`schedule-status-badge status-${(s.status || '').toLowerCase()}`}>
                          {s.status === 'CANCELLED' ? t('Cancelled') : s.status === 'SCHEDULED' ? t('Scheduled') : t('Completed')}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="coach-table-empty">
                    {loading ? t('Loading...') : t('No sessions found for this period.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
