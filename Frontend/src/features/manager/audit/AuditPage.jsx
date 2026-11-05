import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import managerService from '../services/managerService';
import { t, useLanguage } from '../../../i18n/useLanguage';
import ManagerPageHeader from '../components/ManagerPageHeader';
import { describe, groupByDay } from './auditUtils';
import './audit.css';
import VnDateInput from '../../../components/VnDateInput';

const SIZE = 30;
const TYPES = [['', 'Everything'], ['schedule', 'Sessions'], ['class', 'Classes'], ['room', 'Rooms'], ['subject', 'Subjects'], ['account', 'Accounts'], ['package', 'Packages'], ['payment', 'Payments']];
const dayLabel = day => { const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); if (day === today) return t('Today'); const [y, m, d] = day.split('-'); return `${d}/${m}/${y}`; };

export function AuditEntry({ entry }) {
  useLanguage();
  const { verb, fallback, target, detail, sensitive } = describe(entry);
  return <li className={`audit-entry${sensitive ? ' is-sensitive' : ''}`}>
    <time>{String(entry.at || '').slice(11, 16)}</time>
    <p><b>{entry.actorName || entry.actorEmail}</b> {verb ? t(verb) : fallback} {target && <strong>{target}</strong>}{detail && <span className="audit-detail">{detail}</span>}</p>
    {sensitive && <span className="audit-flag" title={t('Sensitive change')}>{t('Sensitive')}</span>}
  </li>;
}

export default function AuditPage({ page }) {
  useLanguage();
  const [filters, setFilters] = useState({ q: '', type: '', from: '', to: '' });
  const [query, setQuery] = useState(filters);
  const [entries, setEntries] = useState([]), [total, setTotal] = useState(0), [pageNo, setPageNo] = useState(0);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');

  // Typing waits a moment before searching; other filters apply at once.
  useEffect(() => { const timer = setTimeout(() => setQuery(filters), filters.q === query.q ? 0 : 350); return () => clearTimeout(timer); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback((nextPage, replace) => {
    setLoading(true); setError('');
    const params = Object.fromEntries(Object.entries({ ...query, page: nextPage, size: SIZE }).filter(([, v]) => v !== ''));
    managerService.auditSearch(params)
      .then(res => { setEntries(cur => replace ? res.items : [...cur, ...res.items]); setTotal(res.total); setPageNo(nextPage); })
      .catch(() => setError(t('Could not load the audit log.')))
      .finally(() => setLoading(false));
  }, [query]);
  useEffect(() => { load(0, true); }, [load]);

  const set = (key, value) => setFilters(cur => ({ ...cur, [key]: value }));
  const filtered = query.q || query.type || query.from || query.to;

  return <div className="audit-page">
    <ManagerPageHeader title={t(page?.title || 'Audit log')} description={t('Who changed what, and when.')} />
    <div className="audit-filters">
      <label className="audit-search"><Search size={16} aria-hidden="true" /><input value={filters.q} onChange={e => set('q', e.target.value)} placeholder={t('Search by person, class, room or account')} aria-label={t('Search')} /></label>
      <select value={filters.type} onChange={e => set('type', e.target.value)} aria-label={t('Type')}>{TYPES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}</select>
      <VnDateInput type="date" value={filters.from} max={filters.to || undefined} onChange={e => set('from', e.target.value)} aria-label={t('From')} />
      <VnDateInput type="date" value={filters.to} min={filters.from || undefined} onChange={e => set('to', e.target.value)} aria-label={t('To')} />
      {filtered && <button type="button" className="audit-clear" onClick={() => setFilters({ q: '', type: '', from: '', to: '' })}>{t('Clear')}</button>}
    </div>
    {error && <p className="audit-error" role="alert">{error}</p>}
    {!entries.length && !loading ? <p className="audit-empty">{t(filtered ? 'No changes match these filters.' : 'No changes recorded yet.')}</p> :
      groupByDay(entries).map(group => <section key={group.day} className="audit-day" aria-label={dayLabel(group.day)}>
        <h2>{dayLabel(group.day)}</h2>
        <ul>{group.items.map(entry => <AuditEntry key={entry.id} entry={entry} />)}</ul>
      </section>)}
    <div className="audit-more" role="status">
      {loading ? t('Loading…') : entries.length < total ? <button type="button" onClick={() => load(pageNo + 1, false)}>{t('Show older changes ({0} more)', [total - entries.length])}</button> : entries.length ? t('{0} changes', [total]) : null}
    </div>
  </div>;
}
