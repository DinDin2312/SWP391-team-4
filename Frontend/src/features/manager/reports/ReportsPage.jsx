import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowDownToLine, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Dumbbell, FileClock, Info, Minus, Package, Trophy, UserPlus, Users, Wallet } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore';
import { formatDate, formatMoney } from '../../../utils/displayFormat';
import { isoDate, reportCsv } from '../managerUtils';
import { bucketDays, fillDays } from './revenueSeries';
import ManagerPageHeader from '../components/ManagerPageHeader';
import CoachTeachingReport from './CoachTeachingReport';
import './reports.css';
import VnDateInput from '../../../components/VnDateInput';

const LOW_OCCUPANCY = 25;

function Empty({ icon: Icon = BarChart3, text }) {
  return <div className="reports-empty"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /><p>{t(text)}</p></div>;
}

const compact = value => new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
const count = value => new Intl.NumberFormat(locale()).format(Number(value || 0));
const percent = value => `${new Intl.NumberFormat(locale(), { maximumFractionDigits: value > 0 && value < 1 ? 1 : 0 }).format(value)}%`;
const shortDate = iso => new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit' }).format(new Date(`${iso}T00:00:00`));

// Clean 1-2-2.5-5 tick steps so axis labels are round numbers.
function niceScale(maximum, targetTicks = 4) {
  if (!(maximum > 0)) return { top: 1, ticks: [0, 1] };
  const raw = maximum / targetTicks;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find(candidate => raw / power <= candidate) * power;
  const top = Math.ceil(maximum / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step) };
}

function columnPath(x, y, width, height, radius = 4) {
  const r = Math.min(radius, width / 2, height);
  return `M${x},${y + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + width - r}Q${x + width},${y} ${x + width},${y + r}V${y + height}Z`;
}

function useWidth(fallback = 760) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function RevenueChart({ days }) {
  const titleId = useId();
  const [ref, width] = useWidth();
  const [active, setActive] = useState(null);
  const { unit, buckets } = useMemo(() => bucketDays(days), [days]);
  const narrow = width < 520;
  const margin = { top: 28, right: 12, bottom: 30, left: narrow ? 44 : 56 };
  const height = narrow ? 220 : 260;
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const values = buckets.map(bucket => bucket.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  const average = buckets.length ? total / buckets.length : 0;
  const peakIndex = values.reduce((best, value, index) => value > values[best] ? index : best, 0);
  const { top, ticks } = niceScale(Math.max(...values, 1), narrow ? 3 : 4);
  const band = plotW / buckets.length;
  const barWidth = Math.max(2, Math.min(24, band * 0.68));
  const xCenter = index => margin.left + band * index + band / 2;
  const y = value => margin.top + plotH - (value / top) * plotH;
  const tickCount = Math.min(buckets.length, narrow ? 4 : 7);
  const xTicks = [...new Set(Array.from({ length: tickCount }, (_, index) => Math.round(index * (buckets.length - 1) / Math.max(1, tickCount - 1))))];
  const shown = active == null ? null : buckets[active];
  const tooltipOnLeft = active != null && xCenter(active) > width / 2;
  const tooltipLeft = active == null ? 0 : xCenter(active) + (tooltipOnLeft ? -10 : 10);
  const edgeAnchor = index => buckets.length < 2 ? 'middle' : index === 0 ? 'start' : index === buckets.length - 1 ? 'end' : 'middle';
  const edgeShift = index => buckets.length < 2 ? 0 : index === 0 ? -Math.min(barWidth / 2, 8) : index === buckets.length - 1 ? Math.min(barWidth / 2, 8) : 0;

  const onKeyDown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    setActive(current => {
      if (event.key === 'Home') return 0;
      if (event.key === 'End') return buckets.length - 1;
      return Math.max(0, Math.min(buckets.length - 1, (current ?? peakIndex) + (event.key === 'ArrowLeft' ? -1 : 1)));
    });
  };

  return <div className="reports-chart" ref={ref}>
    <div className="reports-chart-meta"><div className="reports-chart-legend"><span><i aria-hidden="true" />{t(unit === 'week' ? 'Weekly revenue' : 'Daily revenue')}</span>{average > 0 && <span><b aria-hidden="true" />{t(unit === 'week' ? 'Weekly average' : 'Daily average')}: {compact(average)}</span>}</div>{unit === 'week' && <span>{t('Long ranges are grouped by week (Monday to Sunday).')}</span>}</div>
    <div className="reports-chart-stage" tabIndex={0} role="group" aria-labelledby={titleId}
      aria-describedby={`${titleId}-hint`} onKeyDown={onKeyDown} onFocus={() => setActive(current => current ?? peakIndex)}
      onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)}>
      <span id={`${titleId}-hint`} className="reports-sr-only">{t('Use the left and right arrow keys to read each column.')}</span>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{t(unit === 'week' ? 'Weekly revenue' : 'Daily revenue')}</title>
        {ticks.map(tick => <g key={tick} className="reports-axis-y">
          <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} className={tick === 0 ? 'is-baseline' : ''} />
          <text x={margin.left - 8} y={y(tick)} dy="0.32em">{compact(tick)}</text>
        </g>)}
        {buckets.map((bucket, index) => bucket.value > 0 && <path key={bucket.date} className={`reports-column${active === index ? ' is-active' : ''}${active != null && active !== index ? ' is-dimmed' : ''}`}
          d={columnPath(xCenter(index) - barWidth / 2, y(bucket.value), barWidth, y(0) - y(bucket.value))} />)}
        {average > 0 && <g className="reports-average">
          <line x1={margin.left} x2={width - margin.right} y1={y(average)} y2={y(average)} />
        </g>}
        {values[peakIndex] > 0 && active == null && <g className="reports-peak">
          <text x={Math.min(Math.max(xCenter(peakIndex), margin.left + 30), width - margin.right - 30)} y={y(values[peakIndex]) - 9} textAnchor="middle">{compact(values[peakIndex])}</text>
        </g>}
        {active != null && <g className="reports-crosshair"><line x1={xCenter(active)} x2={xCenter(active)} y1={margin.top} y2={y(0)} /></g>}
        <g className="reports-axis-x">{xTicks.map(index => <text key={index} x={xCenter(index)} y={height - 8} textAnchor={edgeAnchor(index)} dx={edgeShift(index)}>{shortDate(buckets[index].date)}</text>)}</g>
        <g className="reports-hit">{buckets.map((bucket, index) => <rect key={bucket.date} x={margin.left + band * index} y={margin.top} width={band} height={plotH}
          onPointerEnter={() => setActive(index)} onPointerMove={() => setActive(index)} />)}</g>
      </svg>
      {shown && <div className="reports-tooltip" role="status" style={{ left: tooltipLeft, top: margin.top, transform: tooltipOnLeft ? 'translateX(-100%)' : 'none' }}>
        <strong>{formatMoney(shown.value)}</strong>
        <span><i aria-hidden="true" />{shown.end !== shown.date ? `${shortDate(shown.date)} – ${formatDate(shown.end)}` : formatDate(shown.date)}{shown.value > 0 && total > 0 ? ` · ${percent(shown.value / total * 100)} ${t('of period')}` : ''}</span>
      </div>}
    </div>
  </div>;
}

function RevenueStats({ days }) {
  const total = days.reduce((sum, day) => sum + day.value, 0);
  const paidDays = days.filter(day => day.value > 0).length;
  const peak = days.reduce((best, day) => day.value > best.value ? day : best, days[0]);
  const stats = [
    { label: 'Total revenue', value: formatMoney(total) },
    { label: 'Daily average', value: formatMoney(days.length ? total / days.length : 0), note: t('{0} days in period', [count(days.length)]) },
    { label: 'Best day', value: formatMoney(peak.value), note: peak.value > 0 ? formatDate(peak.date) : '—' },
    { label: 'Days with revenue', value: `${count(paidDays)}/${count(days.length)}`, note: percent(days.length ? paidDays / days.length * 100 : 0) },
  ];
  return <dl className="reports-revenue-stats">{stats.map(stat => <div key={stat.label}><dt>{t(stat.label)}</dt><dd>{stat.value}</dd>{stat.note && <span>{stat.note}</span>}</div>)}</dl>;
}

const BOOKING_STATUSES = [
  { status: 'CONFIRMED', label: 'Confirmed', tone: 'confirmed' },
  { status: 'PENDING', label: 'Pending', tone: 'pending' },
  { status: 'CANCELLED', label: 'Cancelled', tone: 'cancelled' },
];

function BookingBreakdown({ rows }) {
  const known = BOOKING_STATUSES.map(item => ({ ...item, value: Number(rows.find(row => row.status === item.status)?.value || 0) }));
  const other = rows.filter(row => !BOOKING_STATUSES.some(item => item.status === row.status)).reduce((sum, row) => sum + Number(row.value || 0), 0);
  const parts = other > 0 ? [...known, { status: 'OTHER', label: 'Other booking statuses', tone: 'other', value: other }] : known;
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return <Empty icon={ClipboardList} text="No bookings in this period." />;
  return <div className="reports-breakdown">
    <div className="reports-breakdown-total"><strong>{count(total)}</strong><span>{t('bookings created')}</span></div>
    <div className="reports-segments" role="img" aria-label={parts.map(part => `${t(part.label)}: ${count(part.value)} (${percent(part.value / total * 100)})`).join(', ')}>
      {parts.filter(part => part.value > 0).map(part => <span key={part.status} className={`is-${part.tone}`} style={{ flexGrow: part.value }} title={`${t(part.label)}: ${count(part.value)}`} />)}
    </div>
    <ul className="reports-breakdown-list">{parts.map(part => <li key={part.status}>
      <span className={`reports-swatch is-${part.tone}`} aria-hidden="true" />
      <span className="reports-breakdown-name">{t(part.label)}</span>
      <strong>{count(part.value)}</strong>
      <span className="reports-breakdown-share">{percent(part.value / total * 100)}</span>
    </li>)}</ul>
  </div>;
}

function OccupancyMeter({ rate }) {
  if (rate == null) return <span className="reports-occupancy-none">—</span>;
  const low = rate < LOW_OCCUPANCY;
  return <div className={`reports-occupancy${low ? ' is-low' : rate >= 85 ? ' is-high' : ''}`}>
    <span>{low && <AlertTriangle size={12} aria-label={t('Low occupancy')} />}{percent(Math.round(rate))}</span>
    <i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(rate, 100))}%` }} /></i>
  </div>;
}

// Delta vs. the previous period of equal length. `goodWhenUp` decides the colour, the arrow shows direction.
function Delta({ current, previous, goodWhenUp = true }) {
  if (previous == null || current == null) return null;
  const now = Number(current), before = Number(previous);
  if (!before && !now) return <span className="reports-delta is-flat"><Minus size={13} aria-hidden="true" />{t('No change vs previous period')}</span>;
  if (!before) return <span className="reports-delta is-new">{t('New this period (previous: 0)')}</span>;
  const change = (now - before) / before * 100;
  if (Math.abs(change) < 0.5) return <span className="reports-delta is-flat"><Minus size={13} aria-hidden="true" />{t('No change vs previous period')}</span>;
  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return <span className={`reports-delta ${up === goodWhenUp ? 'is-good' : 'is-bad'}`}>
    <Icon size={14} aria-hidden="true" /><b>{up ? '+' : '−'}{percent(Math.abs(change) >= 10 ? Math.round(Math.abs(change)) : Math.round(Math.abs(change) * 10) / 10)}</b>{t('vs previous period')}
  </span>;
}

function ClassPopularity({ rows }) {
  const max = Math.max(...rows.map(row => Number(row.students)), 1);
  return <ol className="reports-popularity">{rows.map((row, index) => {
    const students = Number(row.students), fresh = Number(row.newStudents || 0);
    const meta = [row.subject, row.coach].filter(Boolean).join(' · ');
    return <li key={row.classId} title={`${row.label}: ${t('{0} students', [count(students)])}${fresh ? `, ${t('{0} new this period', [count(fresh)])}` : ''}`}>
      <span className={`reports-popularity-rank${index === 0 ? ' is-top' : ''}`}>{index === 0 ? <Trophy size={13} aria-label="1" /> : index + 1}</span>
      <div className="reports-popularity-body">
        <div className="reports-popularity-head">
          <div><strong>{row.label}</strong>{meta && <span>{meta}</span>}</div>
          <div className="reports-popularity-value"><b>{count(students)}</b><span>{t('students')}</span>{fresh > 0 && <em>{t('+{0} new', [count(fresh)])}</em>}</div>
        </div>
        <div className="reports-popularity-bar"><i aria-hidden="true"><b style={{ width: `${students / max * 100}%` }} /></i></div>
      </div>
    </li>;
  })}</ol>;
}

export default function ReportsPage({ data, filters, appliedFilters, setFilters, reload, page, loading = false, loadError = '', openTransactions }) {
  useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDaily, setShowDaily] = useState(false);
  const report = !loading && !loadError ? data : null;
  const summary = report?.summary;
  const rawDaily = report?.revenueByDay;
  const days = useMemo(() => fillDays(rawDaily || [], appliedFilters.from, appliedFilters.to), [rawDaily, appliedFilters.from, appliedFilters.to]);
  const hasRevenue = days.some(day => day.value > 0);
  const classes = report?.classOccupancy || [];
  const allPackages = [...(report?.memberships || [])].filter(item => Number(item.value) > 0).sort((a, b) => Number(b.value) - Number(a.value));
  const packages = allPackages.slice(0, 5);
  const packageTotal = allPackages.reduce((sum, item) => sum + Number(item.value), 0);
  const packageRest = allPackages.slice(5);
  const maxPackages = Math.max(...packages.map(item => Number(item.value)), 1);
  const valid = Boolean(filters.from && filters.to && filters.from <= filters.to);
  const pendingRange = filters.from !== appliedFilters.from || filters.to !== appliedFilters.to;
  const presets = ['This month', 'Last 7 days', 'Last 30 days'];
  const presetRange = label => {
    const to = new Date(), from = new Date(to);
    if (label === 'This month') from.setDate(1); else from.setDate(from.getDate() - (label === 'Last 7 days' ? 6 : 29));
    return { from: isoDate(from), to: isoDate(to) };
  };
  const exportReport = () => {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([reportCsv(report)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = `report-${appliedFilters.from}-${appliedFilters.to}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const previous = report?.previousSummary;
  const previousPeriod = report?.previousPeriod;
  const averageTicket = summary && Number(summary.successfulPayments) > 0 ? Number(summary.revenue) / Number(summary.successfulPayments) : null;
  const unknownDates = Number(report?.memberGrowth?.unknownCreationDates || 0);
  const cards = [
    { key: 'revenue', label: 'Revenue', icon: Wallet, value: summary ? formatMoney(summary.revenue) : '—', current: summary?.revenue, before: previous?.revenue, note: averageTicket != null ? t('Average {0} per transaction', [formatMoney(averageTicket)]) : t('Successful payments only'), tone: 'revenue' },
    { key: 'successfulPayments', label: 'Successful transactions', icon: CheckCircle2, value: summary ? count(summary.successfulPayments) : '—', current: summary?.successfulPayments, before: previous?.successfulPayments, note: t('Payments completed in this period'), tone: 'success' },
    { key: 'newMembers', label: 'New members', icon: UserPlus, value: report ? count(report.memberGrowth?.newMembers) : '—', current: report?.memberGrowth?.newMembers, before: previous?.newMembers, note: t('Member accounts created in this period'), tone: 'members' },
    { key: 'confirmedBookings', label: 'Class bookings', icon: Users, value: summary ? count(summary.confirmedBookings) : '—', current: summary?.confirmedBookings, before: previous?.confirmedBookings, note: t('Confirmed session seats by session date'), tone: 'bookings' },
    { key: 'pendingInvoices', label: 'Pending invoices', icon: FileClock, value: summary ? count(summary.pendingInvoices) : '—', current: summary?.pendingInvoices, before: previous?.pendingInvoices, goodWhenUp: false, note: t('Invoices created in this period'), tone: 'pending' },
  ];
  const popularity = report?.classPopularity || [];
  const loadingBlock = <div className="reports-chart-loading" role="status">{t('Loading...')}</div>;

  return <div className="reports-page" aria-busy={loading}>
    <ManagerPageHeader
      title={page.title}
      description={page.description}
      actions={activeTab === 'overview' ? (
        <button type="button" className="manager-secondary reports-export" disabled={!report} onClick={exportReport}>
          <ArrowDownToLine size={16} aria-hidden="true" />{t('Export CSV')}
        </button>
      ) : null}
    />

    {/* SUB-TAB NAVIGATOR */}
    <div className="reports-tabs-nav" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'overview'}
        className={`reports-tab-item${activeTab === 'overview' ? ' is-active' : ''}`}
        onClick={() => setActiveTab('overview')}
      >
        <BarChart3 size={16} aria-hidden="true" />
        <span>{t('Center Overview & Revenue')}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'coaches'}
        className={`reports-tab-item${activeTab === 'coaches' ? ' is-active' : ''}`}
        onClick={() => setActiveTab('coaches')}
      >
        <Dumbbell size={16} aria-hidden="true" />
        <span>{t('Trainer Teaching Statistics')}</span>
      </button>
    </div>

    {activeTab === 'coaches' ? (
      <CoachTeachingReport initialFrom={appliedFilters.from} initialTo={appliedFilters.to} />
    ) : (
      <>
        <form className="reports-filter" onSubmit={event => { event.preventDefault(); if (valid && !loading) reload(); }}>
          <div className="reports-filter-title"><CalendarDays size={18} aria-hidden="true" /><span>{t('Reporting period')}</span></div>
          <div className="reports-presets">{presets.map(label => { const range = presetRange(label); return <button type="button" key={label} disabled={loading} aria-pressed={filters.from === range.from && filters.to === range.to} onClick={() => setFilters(current => ({ ...current, ...range }))}>{t(label)}</button>; })}</div>
          <div className="reports-date-inputs"><label>{t('From')}<VnDateInput type="date" value={filters.from} max={filters.to || undefined} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label><span aria-hidden="true">–</span><label>{t('To')}<VnDateInput type="date" value={filters.to} min={filters.from || undefined} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label><button className="manager-primary" type="submit" disabled={!valid || loading}>{t(loading ? 'Loading...' : 'View')}</button></div>
          {(!valid || pendingRange) && <p className="reports-filter-hint" role="status">{t(!valid ? 'Select a valid date range: the start date cannot be after the end date.' : 'Apply the date range to update this report.')}</p>}
        </form>

        <div className="reports-period"><span>{t('Performance summary')}</span><span><CalendarDays size={14} aria-hidden="true" />{formatDate(appliedFilters.from)} — {formatDate(appliedFilters.to)}{previousPeriod && <em>{t('compared with {0} – {1}', [formatDate(previousPeriod.from), formatDate(previousPeriod.to)])}</em>}</span></div>
        <div className="reports-kpis">{cards.map(({ key, label, icon: Icon, value, note, tone, current, before, goodWhenUp }) => <article key={key} className={`reports-kpi ${tone}${loading ? ' is-loading' : ''}`}>
          <div className="reports-kpi-label"><span>{t(label)}</span><span className="reports-kpi-icon"><Icon size={18} aria-hidden="true" /></span></div>
          <strong>{value}</strong>
          {report && <Delta current={current} previous={before} goodWhenUp={goodWhenUp} />}
          <p>{report ? note : '\u00a0'}{key === 'newMembers' && unknownDates > 0 && <span className="reports-kpi-info" title={t('These accounts are excluded because their registration period cannot be verified. Newly created accounts are recorded automatically.')}><Info size={12} aria-hidden="true" />{t('{0} existing member accounts have no creation date.', [count(unknownDates)])}</span>}</p>
          {openTransactions && ['revenue', 'successfulPayments', 'pendingInvoices'].includes(key) && <button type="button" className="reports-ledger-link" disabled={!report} onClick={() => openTransactions({ mode: key === 'pendingInvoices' ? 'invoices' : 'payments', status: key === 'pendingInvoices' ? 'PENDING' : 'SUCCESS', from: appliedFilters.from, to: appliedFilters.to })}>{t('View transactions')} →</button>}
        </article>)}</div>

        <section className="reports-card reports-revenue">
          <div className="reports-card-header"><div><h2>{t('Revenue trend')}</h2><p>{t('Daily totals from successful payments.')}</p></div><span className="reports-unit">VND</span></div>
          {loading ? loadingBlock : hasRevenue ? <><RevenueStats days={days} /><RevenueChart days={days} /></> : <Empty text={loadError ? 'Report data is unavailable.' : 'No successful payments in this period.'} />}
          {hasRevenue && <><div className="reports-chart-footer"><span>{t('Days without successful payments count as 0. Hover or use the arrow keys for each value.')}</span><button type="button" aria-expanded={showDaily} onClick={() => setShowDaily(current => !current)}>{t('View data table')}<ChevronDown size={15} className={showDaily ? 'is-open' : ''} aria-hidden="true" /></button></div>
            {showDaily && <div className="reports-daily-table"><table><thead><tr><th scope="col">{t('Date')}</th><th scope="col">{t('Revenue (VND)')}</th></tr></thead><tbody>{days.filter(day => day.value > 0).map(day => <tr key={day.date}><td>{formatDate(day.date)}</td><td>{formatMoney(day.value)}</td></tr>)}</tbody></table></div>}</>}
        </section>

        <div className="reports-bottom-grid reports-demand-grid">
          <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Most registered classes')}</h2><p>{t('Members studying each class in this period, each member counted once.')}</p></div><span className="reports-section-icon"><Trophy size={19} aria-hidden="true" /></span></div>
            {loading ? loadingBlock : popularity.length ? <ClassPopularity rows={popularity} /> : <Empty icon={Trophy} text={loadError ? 'Report data is unavailable.' : 'No class registrations in this period.'} />}
            {popularity.length > 0 && <p className="reports-card-note">{t('"New" = members whose registration was created in this period.')}</p>}
          </section>
          <div className="reports-stack">
            <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Booking status breakdown')}</h2><p>{t('By booking creation date, not session date. Statuses reflect the current state.')}</p></div><span className="reports-section-icon"><ClipboardList size={19} aria-hidden="true" /></span></div>
              {loading ? loadingBlock : report ? <BookingBreakdown rows={report.bookingStatuses || []} /> : <Empty icon={ClipboardList} text="Report data is unavailable." />}
            </section>
            <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Package registrations')}</h2><p>{t('Top 5 packages by registrations.')}</p></div><span className="reports-section-icon"><Package size={19} aria-hidden="true" /></span></div>
              {loading ? loadingBlock : packages.length ? <ol className="reports-packages">{packages.map((item, index) => <li key={`${item.label}-${index}`}>
                <span className="reports-package-rank">{index + 1}</span>
                <div><div className="reports-package-name"><strong>{item.label}</strong><span><b>{count(item.value)}</b> · {percent(Number(item.value) / packageTotal * 100)}</span></div><i aria-hidden="true"><b style={{ width: `${Number(item.value) / maxPackages * 100}%` }} /></i></div>
              </li>)}</ol> : <Empty icon={Package} text={loadError ? 'Report data is unavailable.' : 'No package registrations in this period.'} />}
              {packages.length > 0 && <p className="reports-card-note">{packageRest.length > 0 && <>{t('{0} other packages: {1} registrations.', [count(packageRest.length), count(packageRest.reduce((sum, item) => sum + Number(item.value), 0))])} </>}{t('Based on membership start date, not payment status.')}</p>}
            </section>
          </div>
        </div>

        <div className="reports-attention">
          <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Classes needing attention')}</h2><p>{t('10 classes with the lowest occupancy in this period.')}</p></div><span className="reports-section-icon is-warning"><AlertTriangle size={19} aria-hidden="true" /></span></div>
            {loading ? loadingBlock : classes.length ? <div className="reports-class-table"><table><thead><tr><th scope="col">{t('Class')}</th><th scope="col">{t('Students')}</th><th scope="col">{t('Seats booked')}</th><th scope="col">{t('Occupancy')}</th></tr></thead><tbody>{classes.map(item => { const rate = Number(item.capacity) > 0 ? Number(item.value) / Number(item.capacity) * 100 : null; const meta = [item.subject, item.coach].filter(Boolean).join(' · '); return <tr key={item.classId}><td><strong>{item.label}</strong>{meta && <span className="reports-class-meta">{meta}</span>}</td><td>{item.students == null ? '—' : count(item.students)}</td><td>{count(item.value)}/{count(item.capacity)}{item.sessions != null && <span className="reports-class-meta">{t('{0} sessions', [count(item.sessions)])}</span>}</td><td><OccupancyMeter rate={rate} /></td></tr>; })}</tbody></table></div> : <Empty icon={ClipboardList} text={loadError ? 'Report data is unavailable.' : 'No class sessions in this period.'} />}
            {classes.length > 0 && <div className="reports-card-note reports-occupancy-legend"><span><i className="is-low" aria-hidden="true" />{t('Below {0}%: low occupancy', [LOW_OCCUPANCY])}</span><span><i aria-hidden="true" />{t('Normal')}</span><span><i className="is-high" aria-hidden="true" />{t('85% or more: nearly full')}</span><span>{t('Seats booked = confirmed seats across all sessions / total seats of those sessions.')}</span></div>}
          </section>
        </div>
      </>
    )}
  </div>;
}
