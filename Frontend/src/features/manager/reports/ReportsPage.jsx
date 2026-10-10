import { useId, useState } from 'react';
import { ArrowDownToLine, BarChart3, CalendarDays, CheckCircle2, ChevronDown, ClipboardList, FileClock, Package, Users, Wallet } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore';
import { formatDate, formatMoney } from '../../../utils/displayFormat';
import { isoDate, reportCsv } from '../managerUtils';
import ManagerPageHeader from '../components/ManagerPageHeader';
import './reports.css';

function Empty({ icon: Icon = BarChart3, text }) {
  return <div className="reports-empty"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /><p>{t(text)}</p></div>;
}

function RevenueChart({ rows }) {
  const chartId = useId();
  const maximum = Math.max(...rows.map(row => Number(row.value)), 1);
  const ceiling = Math.ceil(maximum / (10 ** Math.floor(Math.log10(maximum)))) * (10 ** Math.floor(Math.log10(maximum)));
  const compact = value => new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  const step = 760 / rows.length;
  const ticks = [...new Set(Array.from({ length: Math.min(rows.length, 5) }, (_, index) => Math.round(index * (rows.length - 1) / Math.max(1, Math.min(rows.length, 5) - 1))))];
  return <div className="reports-chart" aria-label={t('Daily revenue')}>
    <div className="reports-chart-legend"><i aria-hidden="true" />{t('Revenue (VND)')}</div>
    <div className="reports-chart-grid"><div className="reports-chart-axis" aria-hidden="true">{[1, .75, .5, .25, 0].map(ratio => <span key={ratio}>{compact(ceiling * ratio)}</span>)}</div>
      <div className="reports-chart-canvas"><svg viewBox="0 0 760 220" preserveAspectRatio="none" role="img" aria-labelledby={chartId}><title id={chartId}>{t('Daily revenue')}</title>{rows.map((row, index) => {
        const height = Math.max(1, Number(row.value) / ceiling * 220);
        return <rect key={row.label} x={index * step + step * .18} y={220 - height} width={Math.max(.5, step * .64)} height={height} rx={rows.length > 30 ? 1 : 4}><title>{`${formatDate(row.label)}: ${formatMoney(row.value)}`}</title></rect>;
      })}</svg></div>
    </div>
    <div className="reports-chart-dates" aria-hidden="true">{ticks.map(index => <span key={index}>{formatDate(rows[index].label)}</span>)}</div>
  </div>;
}

export default function ReportsPage({ data, filters, appliedFilters, setFilters, reload, page, loading = false, loadError = '', openTransactions }) {
  useLanguage();
  const [showDaily, setShowDaily] = useState(false);
  const report = !loading && !loadError ? data : null;
  const summary = report?.summary;
  const daily = [...(report?.revenueByDay || [])].sort((a, b) => String(a.label).localeCompare(String(b.label)));
  const classes = report?.classOccupancy || [];
  const packages = [...(report?.memberships || [])].filter(item => Number(item.value) > 0).sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5);
  const maxPackages = Math.max(...packages.map(item => Number(item.value)), 1);
  const valid = Boolean(filters.from && filters.to && filters.from <= filters.to);
  const pendingRange = filters.from !== appliedFilters.from || filters.to !== appliedFilters.to;
  const count = value => new Intl.NumberFormat(locale()).format(Number(value || 0));
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
  const cards = [
    { key: 'revenue', label: 'Revenue', icon: Wallet, value: summary ? formatMoney(summary.revenue) : '—', note: 'Successful payments only', tone: 'revenue' },
    { key: 'successfulPayments', label: 'Successful transactions', icon: CheckCircle2, value: summary ? count(summary.successfulPayments) : '—', note: 'Payments completed in this period', tone: 'success' },
    { key: 'pendingInvoices', label: 'Pending invoices', icon: FileClock, value: summary ? count(summary.pendingInvoices) : '—', note: 'Invoices created in this period', tone: 'pending' },
    { key: 'confirmedBookings', label: 'Class bookings', icon: Users, value: summary ? count(summary.confirmedBookings) : '—', note: 'Confirmed bookings by session date', tone: 'bookings' },
  ];
  return <div className="reports-page" aria-busy={loading}>
    <ManagerPageHeader title={page.title} description={page.description} actions={<button type="button" className="manager-secondary reports-export" disabled={!report} onClick={exportReport}><ArrowDownToLine size={16} aria-hidden="true" />{t('Export CSV')}</button>} />
    <form className="reports-filter" onSubmit={event => { event.preventDefault(); if (valid && !loading) reload(); }}>
      <div className="reports-filter-title"><CalendarDays size={18} aria-hidden="true" /><span>{t('Reporting period')}</span></div>
      <div className="reports-presets">{presets.map(label => { const range = presetRange(label); return <button type="button" key={label} disabled={loading} aria-pressed={filters.from === range.from && filters.to === range.to} onClick={() => setFilters(current => ({ ...current, ...range }))}>{t(label)}</button>; })}</div>
      <div className="reports-date-inputs"><label>{t('From')}<input type="date" value={filters.from} max={filters.to || undefined} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label><span aria-hidden="true">–</span><label>{t('To')}<input type="date" value={filters.to} min={filters.from || undefined} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label><button className="manager-primary" type="submit" disabled={!valid || loading}>{t(loading ? 'Loading...' : 'View')}</button></div>
      {(!valid || pendingRange) && <p className="reports-filter-hint" role="status">{t(!valid ? 'Select a valid date range: the start date cannot be after the end date.' : 'Apply the date range to update this report.')}</p>}
    </form>
    <div className="reports-period"><span>{t('Performance summary')}</span><span><CalendarDays size={14} aria-hidden="true" />{formatDate(appliedFilters.from)} — {formatDate(appliedFilters.to)}</span></div>
    <div className="reports-kpis">{cards.map(({ key, label, icon: Icon, value, note, tone }) => <article key={key} className={`reports-kpi ${tone}${loading ? ' is-loading' : ''}`}><div className="reports-kpi-label"><span>{t(label)}</span><span className="reports-kpi-icon"><Icon size={18} aria-hidden="true" /></span></div><strong>{value}</strong><p>{t(note)}</p>{openTransactions && key !== 'confirmedBookings' && <button type="button" className="reports-ledger-link" disabled={!report} onClick={() => openTransactions({ mode: key === 'pendingInvoices' ? 'invoices' : 'payments', status: key === 'pendingInvoices' ? 'PENDING' : 'SUCCESS', from: appliedFilters.from, to: appliedFilters.to })}>{t('View transactions')} →</button>}</article>)}</div>
    <section className="reports-card reports-revenue">
      <div className="reports-card-header"><div><h2>{t('Revenue trend')}</h2><p>{t('Daily totals from successful payments.')}</p></div><span className="reports-unit">VND</span></div>
      {loading ? <div className="reports-chart-loading" role="status">{t('Loading...')}</div> : daily.length ? <RevenueChart rows={daily} /> : <Empty text={loadError ? 'Report data is unavailable.' : 'No successful payments in this period.'} />}
      {daily.length > 0 && <><div className="reports-chart-footer"><span>{t('Only days with successful payments are shown.')}</span><button type="button" aria-expanded={showDaily} onClick={() => setShowDaily(current => !current)}>{t('Daily revenue')}<ChevronDown size={15} className={showDaily ? 'is-open' : ''} aria-hidden="true" /></button></div>{showDaily && <div className="reports-daily-table"><table><thead><tr><th scope="col">{t('Date')}</th><th scope="col">{t('Revenue (VND)')}</th></tr></thead><tbody>{daily.map(row => <tr key={row.label}><td>{formatDate(row.label)}</td><td>{formatMoney(row.value)}</td></tr>)}</tbody></table></div>}</>}
    </section>
    <div className="reports-bottom-grid">
      <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Class performance')}</h2><p>{t('Top 10 classes by confirmed bookings.')}</p></div><span className="reports-section-icon"><Users size={19} aria-hidden="true" /></span></div>
        {loading ? <div className="reports-chart-loading" role="status">{t('Loading...')}</div> : classes.length ? <div className="reports-class-table"><table><thead><tr><th scope="col">{t('Class')}</th><th scope="col">{t('Bookings')}</th><th scope="col">{t('Total session capacity')}</th><th scope="col">{t('Occupancy')}</th></tr></thead><tbody>{classes.map(item => { const rate = Number(item.capacity) > 0 ? Number(item.value) / Number(item.capacity) * 100 : null; return <tr key={item.classId}><td><strong>{item.label}</strong></td><td>{count(item.value)}</td><td>{count(item.capacity)}</td><td><div className="reports-occupancy"><span>{rate == null ? '—' : `${Math.round(rate)}%`}</span><i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(rate || 0, 100))}%` }} /></i></div></td></tr>; })}</tbody></table></div> : <Empty icon={ClipboardList} text={loadError ? 'Report data is unavailable.' : 'No class sessions in this period.'} />}
        {classes.length > 0 && <p className="reports-card-note">{t('Capacity is summed across sessions in the selected period.')}</p>}
      </section>
      <section className="reports-card"><div className="reports-card-header"><div><h2>{t('Package registrations')}</h2><p>{t('Top 5 packages by registrations.')}</p></div><span className="reports-section-icon"><Package size={19} aria-hidden="true" /></span></div>
        {loading ? <div className="reports-chart-loading" role="status">{t('Loading...')}</div> : packages.length ? <ol className="reports-packages">{packages.map((item, index) => <li key={index}><span className="reports-package-rank">{String(index + 1).padStart(2, '0')}</span><div><div className="reports-package-name"><strong>{item.label}</strong><span>{count(item.value)}</span></div><i aria-hidden="true"><b style={{ width: `${Number(item.value) / maxPackages * 100}%` }} /></i></div></li>)}</ol> : <Empty icon={Package} text={loadError ? 'Report data is unavailable.' : 'No package registrations in this period.'} />}
        {packages.length > 0 && <p className="reports-card-note">{t('Based on membership start date, not payment status.')}</p>}
      </section>
    </div>
  </div>;
}
