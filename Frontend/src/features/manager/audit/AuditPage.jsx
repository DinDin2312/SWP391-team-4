import { Fragment, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Layers, Search, ShieldCheck, Users, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime } from '../../../utils/displayFormat';
import ManagerPageHeader from '../components/ManagerPageHeader';
import { actionLabels, entityLabels, entityKey, changeFields, changeValue, filterLogs } from './auditUtils';
import './audit.css';

const blank = { keyword: '', action: '', entity: '', from: '', to: '' };
const fieldLabels = { packageName: 'Package name', packageType: 'Package type', durationDays: 'Duration (days)', price: 'Price', description: 'Description', terms: 'Terms', benefits: 'Benefits', purchaseLimitPerMember: 'Purchase limit per member', sellingStatus: 'Selling status', image: 'Image' };
function ActionBadge({ action }) { const tone = action === 'CREATE' || action === 'CHECK_IN' || action === 'CLASS_TRANSFER' ? 'create' : action === 'DELETE' || action === 'REMOVE_IMAGE' || action === 'CANCEL_BOOKING_SUPPORT' || action === 'CANCEL_COURSE_SUPPORT' ? 'delete' : action === 'PAYMENT_REVIEW' ? 'review' : 'update'; return <span className={`audit-action ${tone}`}><i aria-hidden="true" />{t(actionLabels[action] || action)}</span>; }
export function AuditChanges({ log }) {
  const fields = changeFields(log);
  return <div className="audit-expanded"><div className="audit-record-info"><strong>{t('Recorded details')}</strong><p>{log.details || t('No details recorded.')}</p><span>{t('Record')} #{log.auditId} · {log.action} · {log.entityType}{log.entityId != null ? ` #${log.entityId}` : ''}</span></div>
    {fields.length > 0 ? <div className="audit-changes-wrap"><table className="audit-changes"><thead><tr><th>{t('Changed field')}</th><th>{t('Before')}</th><th>{t('After')}</th></tr></thead><tbody>{fields.map(([field, value]) => <tr key={field}><th scope="row">{t(fieldLabels[field] || field)}</th>{value && typeof value === 'object' && ('before' in value || 'after' in value) ? <><td><pre>{changeValue(value.before, t)}</pre></td><td><pre>{changeValue(value.after, t)}</pre></td></> : <td colSpan={2}>{t('Change recorded; previous and new values are unavailable.')}</td>}</tr>)}</tbody></table><p className="audit-detail-note">{t('Values appear exactly as recorded. Long text may have been shortened when logged.')}</p></div> : <p className="audit-detail-note">{t('This record does not contain a before/after snapshot.')}</p>}
  </div>;
}

export default function AuditPage({ data, page, loading = false, loadError = '' }) {
  useLanguage();
  const [filters, setFilters] = useState(blank), [current, setCurrent] = useState(0), [expanded, setExpanded] = useState(null);
  const logs = !loading && !loadError && Array.isArray(data) ? data : [];
  const invalidRange = Boolean(filters.from && filters.to && filters.from > filters.to);
  const filtered = invalidRange ? [] : filterLogs(logs, filters, t);
  const size = 20, pageNumber = Math.min(current, Math.max(0, Math.ceil(filtered.length / size) - 1)), rows = filtered.slice(pageNumber * size, (pageNumber + 1) * size);
  const actors = new Set(logs.map(log => log.actorEmail).filter(Boolean)).size, resources = [...new Set(logs.map(log => entityKey(log.entityType)))].sort(), actions = [...new Set(logs.map(log => log.action))].sort();
  const set = (key, value) => { setFilters(previous => ({ ...previous, [key]: value })); setCurrent(0); setExpanded(null); };
  const activeFilters = Object.values(filters).some(Boolean);
  return <div className="audit-page" aria-busy={loading}>
    <ManagerPageHeader title={page.title} description={page.description} actions={<span className="audit-readonly"><ShieldCheck size={15} aria-hidden="true" />{t('Read-only history')}</span>} />
    <div className="audit-summary">{[{ label: 'Loaded records', value: logs.length, icon: ClipboardList, tone: 'blue' }, { label: 'Recorded actors', value: actors, icon: Users, tone: 'purple' }, { label: 'Affected resource types', value: resources.length, icon: Layers, tone: 'teal' }].map(({ label, value, icon: Icon, tone }) => <article key={label}><span className={`audit-summary-icon ${tone}`}><Icon size={21} aria-hidden="true" /></span><div><span>{t(label)}</span><strong>{loading || loadError ? '—' : value}</strong></div></article>)}</div>
    <div className="audit-scope"><ShieldCheck size={16} aria-hidden="true" /><p>{t('Showing up to 100 latest records. Filters and counts apply to this loaded set.')}</p></div>
    <section className="audit-filters" aria-label={t('Audit filters')}>
      <label className="audit-search">{t('Search')}<div><Search size={17} aria-hidden="true" /><input type="search" value={filters.keyword} onChange={event => set('keyword', event.target.value)} placeholder={t('Actor, action, resource or recorded details')} /></div></label>
      <label>{t('Action')}<select value={filters.action} onChange={event => set('action', event.target.value)}><option value="">{t('All actions')}</option>{actions.map(action => <option key={action} value={action}>{t(actionLabels[action] || action)}</option>)}</select></label>
      <label>{t('Resource')}<select value={filters.entity} onChange={event => set('entity', event.target.value)}><option value="">{t('All resources')}</option>{resources.map(resource => <option key={resource} value={resource}>{t(entityLabels[resource] || resource)}</option>)}</select></label>
      <label>{t('From')}<input type="date" max={filters.to || undefined} value={filters.from} onInput={event => set('from', event.target.value)} /></label><label>{t('To')}<input type="date" min={filters.from || undefined} value={filters.to} onInput={event => set('to', event.target.value)} /></label>
      {activeFilters && <button type="button" className="audit-clear" onClick={() => { setFilters(blank); setCurrent(0); setExpanded(null); }}><X size={14} />{t('Clear filters')}</button>}
      {invalidRange && <p role="alert">{t('Select a valid date range: the start date cannot be after the end date.')}</p>}
    </section>
    <section className="audit-log-card"><header><div><h2>{t('Activity history')}</h2><p>{t('Who changed what, and when.')}</p></div><span>{loading || loadError ? '—' : `${filtered.length} ${t('records')}`}</span></header>
      <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>{t('Time')}</th><th>{t('Actor')}</th><th>{t('Action')}</th><th>{t('Resource')}</th><th>{t('Recorded details')}</th><th>{t('Details')}</th></tr></thead><tbody>{rows.map(log => <Fragment key={log.auditId}><tr className={expanded === log.auditId ? 'is-expanded' : ''}><td className="audit-time"><strong>{formatDateTime(log.createdAt).split(' · ')[0]}</strong><small>{formatDateTime(log.createdAt).split(' · ')[1]}</small></td><td><div className="audit-actor"><span aria-hidden="true">{(log.actorEmail || '?').slice(0, 2).toUpperCase()}</span><strong>{log.actorEmail || '—'}</strong></div></td><td><ActionBadge action={log.action} /></td><td><span className="audit-resource">{t(entityLabels[entityKey(log.entityType)] || log.entityType)}</span>{log.entityId != null && <small>#{log.entityId}</small>}</td><td className="audit-message"><p>{t(log.details) || '—'}</p></td><td><button type="button" className="audit-expand" aria-expanded={expanded === log.auditId} aria-controls={`audit-details-${log.auditId}`} aria-label={`${t('View audit record')} #${log.auditId}`} onClick={() => setExpanded(value => value === log.auditId ? null : log.auditId)}>{t('Details')}<ChevronDown size={14} aria-hidden="true" /></button></td></tr>{expanded === log.auditId && <tr id={`audit-details-${log.auditId}`}><td colSpan={6}><AuditChanges log={log} /></td></tr>}</Fragment>)}</tbody></table></div>
      {loading ? <div className="audit-empty" role="status"><ClipboardList size={28} /><p>{t('Loading...')}</p></div> : loadError ? <div className="audit-empty"><p>{t('Audit data is unavailable.')}</p></div> : !rows.length && <div className="audit-empty"><Search size={28} strokeWidth={1.5} aria-hidden="true" /><h3>{t(logs.length ? 'No matching audit records.' : 'No administrative activity recorded yet.')}</h3><p>{t(logs.length ? 'Try another filter within the latest loaded records.' : 'Recorded administrative changes will appear here.')}</p></div>}
      <footer><span>{filtered.length ? `${pageNumber * size + 1}–${Math.min((pageNumber + 1) * size, filtered.length)} / ${filtered.length}` : '0'}</span><div><button type="button" disabled={loading || pageNumber === 0} aria-label={t('Previous page')} onClick={() => { setCurrent(pageNumber - 1); setExpanded(null); }}><ChevronLeft size={16} /></button><span>{t('Page')} {pageNumber + 1} / {Math.max(1, Math.ceil(filtered.length / size))}</span><button type="button" disabled={loading || (pageNumber + 1) * size >= filtered.length} aria-label={t('Next page')} onClick={() => { setCurrent(pageNumber + 1); setExpanded(null); }}><ChevronRight size={16} /></button></div></footer>
    </section>
  </div>;
}
