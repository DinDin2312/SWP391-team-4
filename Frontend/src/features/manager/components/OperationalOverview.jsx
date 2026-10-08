import { locale } from '../../../i18n/languageStore.js';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { ArrowRight, CalendarDays, Clock3, Users, CreditCard, BadgeCheck, CheckCircle2, ChevronDown, Info } from 'lucide-react';

import ManagerPageHeader from './ManagerPageHeader';

import managerService from '../services/managerService';

import { SessionDrawer, OperationConfirmation } from '../operations/OperationsDrawers';

import { formatDate, formatDateTime, formatMoney } from '../../../utils/displayFormat';

import './operational-overview.css';

import OverviewRowMenu from './OverviewRowMenu';
import managerCopy from '../i18n/en';

import { LOW_REGISTRATION_THRESHOLD, URGENT_WINDOW_HOURS, lowRegistrationBreakdown, sessionDisplayStatus, relativeActivityTime, sessionCountdown } from './overviewUtils';





const ZONE = 'Asia/Ho_Chi_Minh';

// CONFIRMED and PENDING bookings reserve seats. Low registration is strictly below 25%.

const LOW_HINT = 'Upcoming scheduled sessions below 25% capacity. Confirmed and pending bookings both count as reserved seats.';

const parse = (value) => new Date(typeof value === 'string' && !/Z$|[+-]\d\d:\d\d$/.test(value) ? `${value}+07:00` : value);

const time = (value) => new Intl.DateTimeFormat(locale(), { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(parse(value));

const dateKey = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(parse(value));

const addDay = (day, count) => { const d = new Date(`${day}T12:00:00+07:00`); d.setUTCDate(d.getUTCDate() + count); return dateKey(d); };

const destination = (from, to, extra = {}) => `/admin/dashboard?${new URLSearchParams({ view: 'operations', tab: 'schedules', from, to, ...extra })}`;



export function BookingProgress({ row, now }) {
  useLanguage();

  const ratio = Number(row.booked || 0) / Math.max(1, Number(row.maxSlots));

  const low = row.status === 'SCHEDULED' && parse(row.startTime) >= now && ratio < LOW_REGISTRATION_THRESHOLD;

  const empty = Number(row.booked || 0) === 0;
  const tone = low ? (empty || parse(row.startTime) - now < 24 * 3600000 ? 'danger' : 'warning') : 'neutral';

  return <div className={`overview-booking is-${tone}`}><div className="overview-booking-caption"><span title={t('{0}/{1} booked', [row.booked || 0, row.maxSlots])}>{row.booked || 0}/{row.maxSlots}</span>{low && <strong className="overview-booking-severity" title={empty ? managerCopy.overview.noBookings : t(LOW_HINT)}>{empty ? managerCopy.overview.empty : managerCopy.overview.low}</strong>}</div><meter min="0" max={Math.max(1, Number(row.maxSlots))} value={Number(row.booked || 0)} aria-label={t("{0} of {1} seats booked",[row.booked || 0,row.maxSlots])} /></div>;

}

export function OverviewStatus({ row, now }) {
  useLanguage();

  const label = sessionDisplayStatus(row, now);

  if (!label) return null;

  return <span className={`overview-status is-${label.toLowerCase()}`}><i aria-hidden="true" />{t(label)}</span>;

}

function Panel({ id, title, hint, action, titleNote, children }) {
  useLanguage();

  return <section id={id} className="manager-panel overview-panel"><header className="overview-card-header"><div><div className="overview-title-line"><h2>{t(title)}</h2>{titleNote && <span className="overview-time-note" title={t(titleNote)} aria-label={t(titleNote)} tabIndex={0}><Info size={14}/></span>}</div>{hint && <p>{t(hint)}</p>}</div>{action}</header>{children}</section>;

}

function OverviewSkeleton() {
  useLanguage();

  return <div className="overview-skeleton" aria-busy="true" aria-label={t("Loading overview")}><div className="overview-stats">{[1,2,3].map(i => <div key={i} />)}</div><div className="overview-grid"><div /><div /></div><div /></div>;

}

function PagedList({ block, initial, render, empty, refreshKey }) {
  useLanguage();

  const [page, setPage] = useState(0);

  const [result, setResult] = useState(null);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');

  const [retry, setRetry] = useState(0);

  useEffect(() => { let current = true;

    if(page === 0) return undefined;

    managerService.overviewPage(block,page).then(value => { if(current) { setResult(value); setBusy(false); } }).catch(() => { if(current) { setError('Unable to load this page.'); setBusy(false); } });

    return () => { current = false; };

  }, [block,page,retry,refreshKey]);

  const visible = page === 0 ? initial : result;

  const total = initial?.total || 0;

  const change = (next) => { setPage(next); setResult(null); setError(''); setBusy(next !== 0); };

  return <>{error ? <div className="manager-alert" role="alert">{t(error)}<button onClick={() => { setError(''); setBusy(true); setRetry(x=>x+1); }}>{t("Retry")}</button></div> : busy ? <p role="status">{t("Loading…")}</p> : visible?.items?.length ? <ul className="overview-list">{visible.items.map(render)}</ul> : <p className="overview-empty">{t(empty)}</p>}

    {total > 6 && <nav className="overview-pager" aria-label={t("{0} pagination",[t(block === "attention" ? "Upcoming sessions needing attention" : "Plans expiring soon")])}><button disabled={page===0 || busy} onClick={()=>change(page-1)}>{t("Previous")}</button><span>{t("Page")}{' '}{page+1}{' '}{t("of")}{' '}{Math.ceil(total/6)} · {total}{' '}{t("results")}</span><button disabled={(page+1)*6>=total || busy} onClick={()=>change(page+1)}>{t("Next")}</button></nav>}</>;

}



export default function OperationalOverview({ data, page, loading, loadError, refresh, notify, updatedAt }) {
  useLanguage();

  const navigate = useNavigate();

  // The committed Overview displayed its activity feed expanded.
  const [activityOpen, setActivityOpen] = useState(true);

  const [detail, setDetail] = useState(null);

  const [confirmation, setConfirmation] = useState(null);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => { const timer=setInterval(()=>setNow(new Date()),30000);return ()=>clearInterval(timer); }, []);

  const today = data?.centerDate || dateKey(now);

  const fullDate = `${new Intl.DateTimeFormat(locale(),{timeZone:ZONE,weekday:'long'}).format(now)}, ${formatDate(today)}`;

  if (!data && loading) return <><ManagerPageHeader title={t(page.title)} description={t(fullDate)} /><OverviewSkeleton /></>;

  if (!data && loadError) return <><ManagerPageHeader title={t(page.title)} description={t(fullDate)} /><p className="overview-empty">{t("Overview is unavailable. Use Retry above to load the latest information.")}</p></>;

  const urgent = data?.urgentSessions || [];

  const todayRows = [...(data?.todaySessions || [])].sort((a,b)=>parse(a.startTime)-parse(b.startTime));

  const todayIds = new Set(todayRows.map(row=>row.scheduleId));

  const urgentIds = new Set(urgent.map(row=>row.scheduleId));

  const viewToday = destination(today,today,{excludeCancelled:'true'});

  const viewLow = destination(today,addDay(today,7),{lowRegistration:'true',status:'SCHEDULED'});

  const viewAttention = destination(addDay(today,1),addDay(today,7),{lowRegistration:'true',status:'SCHEDULED',excludeUrgent:'true'});

  const groups = lowRegistrationBreakdown(data, now);

  const lowHelper = groups ? Object.entries(groups).filter(([, count]) => count > 0).map(([name, count]) => `${count} ${t(name)}`).join(' · ') || t('No low registrations') : t('Quick view from limited data');

  const nextSession = todayRows.find(row => row.status === 'SCHEDULED' && parse(row.startTime) > now);
  const countdown = nextSession ? sessionCountdown(nextSession.startTime, now) : null;
  const cards=[{label:t('Sessions today'),value:data?.sessionsToday,helper:nextSession ? t('Next: {0} {1}', [time(nextSession.startTime), nextSession.className]) : t('No sessions left today'),hint:t('All sessions starting today, excluding cancellations.'),icon:CalendarDays,to:viewToday,tone:'neutral'},

    {label:t('Low registrations'),value:data?.lowRegistrationSessions,helper:lowHelper,hint:LOW_HINT,icon:Users,to:viewLow,tone:'warning'},

    {label:t('Plans expiring soon'),value:data?.expiringMemberships,helper:'Today through 7 days',hint:t('Active plans expiring today through the next 7 days.'),icon:Clock3,to:Number(data?.expiringMemberships || 0) > 0 ? '#overview-renewals' : null,tone:'neutral'}];

  const actions = row => <div className="overview-actions"><button onClick={()=>setDetail(row)}>{t("View session")}</button>{row.status==='SCHEDULED' && <button className="is-danger" onClick={()=>setConfirmation({type:'cancel',item:row})}>{t("Cancel session")}</button>}</div>;

  const classButton = row => <button type="button" className="overview-class-button" title={t(row.className)} aria-label={t("View session {0}, {1} {2}",[row.className,formatDate(row.startTime),time(row.startTime)])} onClick={() => setDetail(row)}>{row.className}</button>;

  const rowMenu = row => <OverviewRowMenu row={row} time={time(row.startTime)} view={setDetail} cancel={item => setConfirmation({type:'cancel',item})} />;

  const relativeDay = value => dateKey(value) === addDay(today,1) ? t('Tomorrow') : `${t(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(`${dateKey(value)}T12:00:00+07:00`).getUTCDay()])} ${formatDate(value).slice(0,5)}`;
  const activity = data?.recentActivity || [];
  const latestActivity = activity.reduce((latest, row) => !latest || parse(row.occurredAt) > parse(latest.occurredAt) ? row : latest, null);

  const nowMarkerIndex=todayRows.findIndex(row=>parse(row.endTime)>now);

  const allEnded=todayRows.length>0 && todayRows.every(row=>parse(row.endTime)<=now);

  const saved = async message => { setConfirmation(null);setDetail(null);notify?.(message);await refresh(); };

  return <>

    <ManagerPageHeader title={t(page.title)} description={t(fullDate)} />

    {urgent.length>0 && <section className="overview-urgent" aria-labelledby="urgent-title"><header><h2 id="urgent-title">{t("Needs attention now")}<span>({data.urgentCount})</span></h2><p>{t("Low bookings in the next {0} hours.", [data.urgentWindowHours || URGENT_WINDOW_HOURS])}</p></header><ul className="overview-list">{urgent.map(row=><li key={row.scheduleId}><div><strong>{row.className}</strong><p>{t(dateKey(row.startTime)===today ? t('Today') : relativeDay(row.startTime))} · {time(row.startTime)} · {row.roomName}</p></div><BookingProgress row={row} now={now}/>{actions(row)}</li>)}</ul></section>}

    <div className="overview-stats">{cards.map(({label,value,helper,hint,icon:Icon,to,tone})=>{const content=<><span className={`overview-kpi-icon is-${tone}`}><Icon size={20}/></span><div><small>{t(label)}</small><strong>{t(value ?? '—')}{to && <ArrowRight size={15}/>}</strong><p>{t(helper)}</p></div></>;return !to ? <div key={label} className="overview-kpi is-static" title={t(hint)}>{content}</div> : to.startsWith('#')?<a key={label} href={to} className="overview-kpi" title={t(hint)}>{content}</a>:<Link key={label} to={to} className="overview-kpi" title={t(hint)}>{content}</Link>;})}</div>

    <div className="overview-grid">

<div className="overview-left">      <Panel id="overview-today" title={t("Today's schedule")} titleNote="Times shown in Vietnam time" action={todayRows.length < Number(data?.sessionsToday || 0) ? <Link className="overview-link" to={viewToday}>{t("View all ({0})", [data?.sessionsToday || 0])} →</Link> : null}>

        {todayRows.length ? <ul className="overview-list overview-timeline">{todayRows.map((row,index)=>{const marker=index===nowMarkerIndex;return <li className="overview-timeline-entry" key={row.scheduleId}>{marker && <div className="overview-now">{t("Now ·")}{' '}{' '}{time(now)}</div>}<div className="overview-timeline-row"><div className="overview-time-column"><time>{time(row.startTime)}–{time(row.endTime)}</time>{row.scheduleId === nextSession?.scheduleId && <small className="overview-countdown">{t("in {0}h {1}m", [countdown.hours, countdown.minutes])}</small>}</div><div>{classButton(row)}<p>{row.coachName} · {row.roomName}</p><OverviewStatus row={row} now={now}/></div><BookingProgress row={row} now={now}/>{rowMenu(row)}</div></li>;})}{allEnded && <li className="overview-empty">{t("No more sessions today.")}<Link to={viewToday}>{t("View schedules →")}</Link></li>}</ul>:<p className="overview-empty">{t("No sessions scheduled today.")}<Link to={viewToday}>{t("View or create schedules →")}</Link></p>}


      </Panel>

    {Number(data?.expiringMemberships || 0) === 0 ? <section id="overview-renewals" className="manager-panel overview-renewal-strip"><CheckCircle2 size={18}/><p><strong>{t('Plans expiring soon')}</strong><span>{t('No active plans expire in the next 7 days.')}</span></p></section> : <Panel id="overview-renewals" title={t("Plans expiring soon")} hint={t("Renewals to follow up today through the next 7 days")}>

      <PagedList key={`renewals-${updatedAt}`} block="renewals" initial={data?.renewalPage} refreshKey={updatedAt} empty={<span className="overview-renewal-empty"><CheckCircle2 size={18}/>{t("No active plans expire in the next 7 days.")}</span>} render={row=><li key={row.membershipId}><div><strong>{row.fullName}</strong><p>{row.packageName}{t(row.phone?` · ${row.phone}`:t(''))}</p></div><span>{t("Ends")}{' '}{formatDate(row.endDate)}</span></li>}/>

    </Panel>}

    <section className="manager-panel overview-activity"><header className="overview-card-header"><h2><button type="button" className="overview-activity-toggle" aria-expanded={activityOpen} aria-controls="overview-activity-content" onClick={()=>setActivityOpen(value=>!value)}><ChevronDown size={17} className={activityOpen ? 'is-open' : ''}/>{t('Recent activity')}</button></h2>{(activityOpen || activity.length > 6) && <Link className="overview-link" to="/admin/dashboard?view=audit">{t('View all')} →</Link>}</header>
      {!activityOpen && <p className="overview-activity-summary">{latestActivity ? t('{0} activities · latest {1}', [activity.length, t(relativeActivityTime(latestActivity.occurredAt, now))]) : t('No recent activity.')}</p>}

      {activityOpen && <div id="overview-activity-content"><ul className="overview-list">{(data?.recentActivity || []).slice(0,6).map((row,i)=>{

        const payment = row.type === 'PAYMENT';

        const amountMatch = payment ? row.detail?.match(/^([\d,]+) VND\s*-\s*(.*)$/) : null;

        const Icon = payment ? CreditCard : BadgeCheck;

        const membershipName = !payment ? row.title?.match(/^Membership (?:for|cho) (.+)$/)?.[1] : null;
        const title = payment && row.memberName ? t('Payment · {0}', [row.memberName]) : membershipName ? t('Membership for {0}', [membershipName]) : t(row.title);

        return <li className="overview-activity-row" key={`${row.type}-${i}`}><Icon size={18}/><div><strong>{title}</strong><p>{t(amountMatch ? amountMatch[2] : row.detail)}</p></div>{amountMatch && <strong className="overview-amount">{formatMoney(amountMatch[1].replaceAll(',',''))}</strong>}<time title={formatDateTime(row.occurredAt)}>{t(relativeActivityTime(row.occurredAt,now))}</time></li>;

      })}</ul>{!data?.recentActivity?.length && <p className="overview-empty">{t("No recent activity.")}</p>}</div>}

    </section>

</div><aside className="overview-right">      <Panel title={t("Upcoming sessions needing attention")} hint={t("After today · next 7 days")} action={Number(data?.attentionPage?.total || 0) > (data?.attentionPage?.items?.length || 0) ? <Link className="overview-link" to={viewAttention}>{t("View all ({0})", [data?.attentionPage?.total || 0])} →</Link> : null}>

        <PagedList key={`attention-${updatedAt}`} block="attention" initial={data?.attentionPage} refreshKey={updatedAt} empty={t("Nothing needs attention after today in the next 7 days.")} render={row => todayIds.has(row.scheduleId)||urgentIds.has(row.scheduleId)?null:<li className="overview-upcoming-row" key={row.scheduleId}><div className="overview-slot"><span>{relativeDay(row.startTime)}</span><small>{time(row.startTime)}–{time(row.endTime)}</small></div><div>{classButton(row)}<p>{row.roomName}</p><OverviewStatus row={row} now={now}/></div><BookingProgress row={row} now={now}/>{rowMenu(row)}</li>}/>

      </Panel>

</aside></div>
    {detail && <SessionDrawer schedule={detail} onClose={()=>setDetail(null)} edit={()=>{setDetail(null);navigate(destination(dateKey(detail.startTime),dateKey(detail.startTime),{editSchedule:String(detail.scheduleId)}));}} confirm={(type,item)=>{setDetail(null);setConfirmation({type,item});}}/>}

    {confirmation && <OperationConfirmation config={confirmation} onClose={()=>setConfirmation(null)} onSaved={saved}/>}

  </>;

}
