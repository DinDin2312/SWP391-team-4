import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ShieldAlert, ReceiptText, UsersRound, CheckCircle2, ChevronDown } from 'lucide-react';
import ManagerPageHeader from './ManagerPageHeader';
import { formatDate, formatMoney } from '../../../utils/displayFormat';
import { parseCenterTime, centerDate, fillPercent, splitTodaySchedule, decisionLink } from './overviewUtils';
import './operational-overview.css';

const ZONE = 'Asia/Ho_Chi_Minh';
const clock = value => new Intl.DateTimeFormat(locale(), { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(parseCenterTime(value));
const dayTime = value => new Intl.DateTimeFormat(locale(), { timeZone: ZONE, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(parseCenterTime(value));

const KIND = {
  RESCHEDULE: { icon: CalendarClock, tone: 'primary', action: 'Review request' },
  ESCALATION: { icon: ShieldAlert, tone: 'danger', action: 'Handle complaint' },
  PAYMENT_REVIEW: { icon: ReceiptText, tone: 'warning', action: 'Reconcile invoice' },
  LOW_FILL: { icon: UsersRound, tone: 'warning', action: 'Keep or cancel' },
};

function decisionText(item) {
  if (item.type === 'RESCHEDULE') return {
    title: `${t(item.actionType === 'SUBSTITUTE_COACH' ? 'Substitute coach' : 'Make-up session')}: ${item.className}`,
    meta: `${item.coachName} · ${t('session')} ${dayTime(item.dueAt)}`,
  };
  if (item.type === 'ESCALATION') return { title: item.className, meta: `${item.coachName} · ${t('escalated')} ${dayTime(item.createdAt)}` };
  if (item.type === 'PAYMENT_REVIEW') return { title: `${t('Invoice')} #${item.id} ${t('needs reconciling')}`, meta: `${item.coachName || t('Walk-in')} · ${formatMoney(item.amount)}` };
  return { title: `${item.className} ${t('at')} ${clock(item.startTime)}`, meta: `${item.booked}/${item.maxSlots} ${t('seats booked')} · ${item.coachName}` };
}

function Decisions({ items, today }) {
  if (!items.length) return <section className="ov-decisions is-clear" aria-labelledby="ov-dec-title">
    <CheckCircle2 size={20} aria-hidden="true" />
    <div><h2 id="ov-dec-title">{t('Nothing needs your decision')}</h2><p>{t('Requests, escalations and low-fill sessions will appear here.')}</p></div>
  </section>;
  return <section className="ov-decisions" aria-labelledby="ov-dec-title">
    <header><h2 id="ov-dec-title">{t('Needs your decision')}</h2><span className="ov-count">{items.length}</span></header>
    <ul>
      {items.map(item => {
        const kind = KIND[item.type] || KIND.LOW_FILL;
        const Icon = kind.icon;
        const text = decisionText(item);
        return <li key={`${item.type}-${item.id}`} className={`tone-${kind.tone}`}>
          <Icon size={18} aria-hidden="true" />
          <div className="ov-dec-body"><strong>{text.title}</strong><span>{text.meta}</span></div>
          <Link className="ov-dec-action" to={decisionLink(item, today)}>{t(kind.action)}</Link>
        </li>;
      })}
    </ul>
  </section>;
}

function Pulse({ pulse, sessions, doneCount }) {
  const fill = fillPercent(pulse);
  const stats = [
    { label: 'Sessions', value: `${doneCount}/${sessions}`, note: 'finished today' },
    { label: 'On site now', value: pulse.onSiteNow ?? 0, note: `${pulse.checkInsToday ?? 0} ${t('check-ins today')}` },
    { label: 'Seats filled', value: `${fill}%`, note: `${pulse.bookedSeatsToday ?? 0}/${pulse.totalSeatsToday ?? 0} ${t('seats')}`, meter: fill },
    { label: 'Rooms in use', value: `${pulse.roomsInUse ?? 0}/${pulse.totalRooms ?? 0}`, note: 'right now' },
  ];
  return <section className="ov-pulse" aria-label={t('Today at a glance')}>
    {stats.map(s => <div key={s.label} className="ov-stat">
      <span className="ov-stat-label">{t(s.label)}</span>
      <strong>{s.value}</strong>
      {s.meter !== undefined && <span className="ov-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow={s.meter} aria-label={t('Seats filled')}><i style={{ width: `${Math.min(100, s.meter)}%` }} /></span>}
      <span className="ov-stat-note">{t(s.note)}</span>
    </div>)}
  </section>;
}

function Row({ row, now }) {
  const ongoing = parseCenterTime(row.startTime) <= now && now < parseCenterTime(row.endTime);
  return <li className={ongoing ? 'is-live' : ''}>
    <time>{clock(row.startTime)}<small>{clock(row.endTime)}</small></time>
    <div><strong>{row.className}</strong><span>{row.coachName} · {row.roomName}</span></div>
    <span className="ov-seats">{ongoing && <em>{t('In progress')}</em>}{row.booked}/{row.maxSlots}</span>
  </li>;
}

function Schedule({ rows, now, today }) {
  const [showDone, setShowDone] = useState(false);
  const { done, live, nowIndex } = splitTodaySchedule(rows, now);
  return <section className="ov-schedule" aria-labelledby="ov-sch-title">
    <header><h2 id="ov-sch-title">{t("Today's schedule")}</h2><Link to={`/admin/dashboard?view=operations&tab=schedules&from=${today}&to=${today}&excludeCancelled=true`}>{t('Open in Operations')}</Link></header>
    {!rows.length ? <p className="ov-empty">{t('No sessions scheduled today.')}</p> : <>
      {done.length > 0 && <button type="button" className="ov-done-toggle" aria-expanded={showDone} onClick={() => setShowDone(v => !v)}>
        <ChevronDown size={16} aria-hidden="true" />{done.length} {t(done.length === 1 ? 'session finished' : 'sessions finished')}
      </button>}
      <ol>
        {showDone && done.map(row => <Row key={row.scheduleId} row={row} now={now} />)}
        {live.map((row, i) => <FragmentRow key={row.scheduleId} showNow={i === nowIndex} row={row} now={now} />)}
        {nowIndex === live.length && live.length > 0 && <NowLine now={now} />}
      </ol>
      {!live.length && <p className="ov-empty">{t('All sessions for today are finished.')}</p>}
    </>}
  </section>;
}
const NowLine = ({ now }) => <li className="ov-now" aria-label={t('Now')}><span>{clock(now)}</span></li>;
const FragmentRow = ({ showNow, row, now }) => <>{showNow && <NowLine now={now} />}<Row row={row} now={now} /></>;

export default function OperationalOverview({ data, page, loading, loadError }) {
  useLanguage();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);
  const today = data?.centerDate || centerDate(now);
  const description = `${new Intl.DateTimeFormat(locale(), { timeZone: ZONE, weekday: 'long' }).format(now)}, ${formatDate(today)}`;
  const header = <ManagerPageHeader title={t(page.title)} description={description} />;
  if (!data && loading) return <>{header}<div className="ov-skeleton" aria-busy="true" /></>;
  if (!data && loadError) return <>{header}<p className="ov-empty">{t('Overview is unavailable. Use Retry above to load the latest information.')}</p></>;
  const rows = data?.todaySessions || [];
  const doneCount = splitTodaySchedule(rows, now).done.length;
  return <div className="ov">
    {header}
    <Decisions items={data?.decisions || []} today={today} />
    <Pulse pulse={data?.pulse || {}} sessions={rows.filter(r => r.status !== 'CANCELLED').length} doneCount={doneCount} />
    <Schedule rows={rows} now={now} today={today} />
  </div>;
}
