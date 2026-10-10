import { useEffect, useId, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, History, MapPin, Package, Pencil, ShieldCheck, Users, X } from 'lucide-react';
import { codeLabel, t, useLanguage } from '../../i18n/useLanguage';
import { formatDate, formatDateTime, formatMoney } from '../../utils/displayFormat';
import ResourcePhoto from './ResourcePhoto';
import { auditValue } from './packageAudit';
import './package-detail.css';

export default function PackageDetailDialog({ id, load, loadHistory, onClose, onEdit }) {
  useLanguage();
  const titleId = useId();
  const [data, setData] = useState(null), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyState, setHistoryState] = useState(null), [page, setPage] = useState(1), [historyAttempt, setHistoryAttempt] = useState(0);
  const history = historyState?.page === page && historyState?.attempt === historyAttempt ? historyState.data : null;
  const historyError = historyState?.page === page && historyState?.attempt === historyAttempt ? historyState.error : '';
  const dialog = useRef(null);
  useEffect(() => {
    let active = true;
    load(id).then(response => { if (active) setData(response.data); }).catch(() => { if (active) setError('Unable to load package details.'); });
    return () => { active = false; };
  }, [id, load, attempt]);
  useEffect(() => {
    if (!loadHistory || !historyOpen) return;
    let active = true;
    loadHistory(id, page).then(response => { if (active) setHistoryState({ page, attempt: historyAttempt, data: response.data }); }).catch(() => { if (active) setHistoryState({ page, attempt: historyAttempt, error: 'Unable to load change history.' }); });
    return () => { active = false; };
  }, [id, loadHistory, historyOpen, page, historyAttempt]);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const keyDown = event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const nodes = [...dialog.current.querySelectorAll('button:not(:disabled),a[href],summary')].filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first?.focus(); }
    }
  };
  const benefits = data?.benefits || [];
  const remaining = Boolean(data?.membershipId);
  const typeName = data?.packageTypeName ? t(data.packageTypeName) : codeLabel(data?.packageType || '');
  return <div className="package-detail-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} onKeyDown={keyDown}>
    <section className="package-detail-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog} tabIndex={-1}>
      <header className="package-detail-header">
        <span className="package-detail-heading-icon"><Package size={20} aria-hidden="true" /></span>
        <h2 id={titleId}>{t('Package details')}</h2>
        <button className="package-detail-close" type="button" onClick={onClose} aria-label={t('Close')}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="package-detail-body">
        {!data && !error && <div className="package-detail-loading" role="status"><span className="package-detail-skeleton" /><p>{t('Loading package details...')}</p></div>}
        {error && <div className="package-detail-notice" role="alert"><p>{t(error)}</p><button type="button" onClick={() => { setError(''); setData(null); setAttempt(n => n + 1); }}>{t('Retry')}</button></div>}
        {data && <>
          <section className="package-detail-hero" aria-label={t('Overview')}>
            <div className="package-detail-cover"><ResourcePhoto imagePath={data.imagePath} name={data.packageName} variant="cover" fallback={<><Package size={40} strokeWidth={1.5} aria-hidden="true" /><span>{t('No photo yet')}</span></>} /></div>
            <div className="package-detail-intro">
              <div className="package-detail-badges"><span className="package-detail-type">{typeName}</span>{data.sellingStatus && <span className={`package-detail-status ${data.sellingStatus === 'SELLING' ? 'selling' : 'stopped'}`}><i aria-hidden="true" />{t(data.sellingStatus === 'SELLING' ? 'Selling' : 'Stopped')}</span>}</div>
              <h3>{data.packageName}</h3>
              <div className="package-detail-price"><span>{t('Price')}</span><strong>{Number(data.price) === 0 ? t('Free') : formatMoney(data.price)}</strong></div>
            </div>
          </section>
          <dl className="package-detail-metrics">
            <div><dt><CalendarDays size={17} aria-hidden="true" />{t('Duration')}</dt><dd>{data.durationDays} <span>{t('days')}</span></dd></div>
            <div><dt><ShieldCheck size={17} aria-hidden="true" />{t('Purchase limit per member')}</dt><dd>{data.purchaseLimitPerMember ?? t('Unlimited')}</dd></div>
            {data.endDate ? <div><dt><CalendarDays size={17} aria-hidden="true" />{t('End Date')}</dt><dd>{formatDate(data.endDate)}</dd></div> : data.activeSubscribers != null ? <div><dt><Users size={17} aria-hidden="true" />{t('Active registrations')}</dt><dd>{new Intl.NumberFormat().format(data.activeSubscribers)}</dd></div> : <div><dt><Package size={17} aria-hidden="true" />{t('Package type')}</dt><dd>{typeName}</dd></div>}
          </dl>
          {benefits.length > 0 && <section className="package-detail-section"><h3>{t('Subject benefits')}</h3><ul className="package-detail-benefits">{benefits.map(benefit => <li key={benefit.subjectId}>
            <div className="package-detail-benefit-top"><strong>{benefit.subjectName}</strong><span>{remaining ? t('{0} / {1} sessions available', [benefit.remainingSessions, benefit.sessionLimit]) : t('{0} sessions', [benefit.sessionLimit])}</span></div>
            {remaining && <progress max={Math.max(1, Number(benefit.sessionLimit))} value={Math.max(0, Number(benefit.remainingSessions) || 0)} aria-label={benefit.subjectName} />}
            <p><MapPin size={15} aria-hidden="true" /><span><span className="package-detail-location-label">{t('Applicable locations')}: </span>{benefit.rooms?.length ? benefit.rooms.map(room => room.roomName).join(' · ') : t('All locations')}</span></p>
          </li>)}</ul></section>}
          <div className="package-detail-copy-grid">
            <section className="package-detail-section"><h3>{t('Description')}</h3><p className={`package-detail-text${data.description ? '' : ' is-empty'}`}>{data.description || t('No description provided.')}</p></section>
            <section className="package-detail-section"><h3>{t('Terms')}</h3><p className={`package-detail-text${data.terms ? '' : ' is-empty'}`}>{data.terms || t('No terms provided.')}</p></section>
          </div>
          {data.activeSubscribers != null && <p className="package-detail-caption"><Users size={15} aria-hidden="true" /><span>{t('Counts active registration records. A member with several registrations is counted several times.')}</span></p>}
          {data.purchaseBlockReason && <p className="package-detail-notice" role="status">{t(data.purchaseBlockReason)}</p>}
        </>}
        {loadHistory && <details className="package-detail-history" onToggle={event => setHistoryOpen(event.currentTarget.open)}>
          <summary><History size={18} aria-hidden="true" /><span>{t('Change history')}</span><ChevronDown size={17} aria-hidden="true" /></summary>
          {historyOpen && <div className="package-detail-history-body">
            {!history && !historyError && <p role="status">{t('Loading...')}</p>}
            {historyError && <div className="package-detail-notice" role="alert">{t(historyError)} <button type="button" onClick={() => setHistoryAttempt(n => n + 1)}>{t('Retry')}</button></div>}
            {history && <>{!history.items.length && <p className="package-detail-text is-empty">{t('No changes recorded.')}</p>}<ol className="package-history">{history.items.map((entry, index) => <li key={`${page}-${index}`}><div className="package-history-meta"><strong>{entry.actor}</strong><time>{formatDateTime(entry.createdAt)}</time></div>{entry.changes?.fields ? <ul>{Object.entries(entry.changes.fields).map(([field, change]) => <li key={field}><b>{t(field)}</b>: {field === 'image' ? t('Image changed') : `${auditValue(field, change.before)} → ${auditValue(field, change.after)}`}</li>)}</ul> : <p>{entry.details}</p>}</li>)}</ol>{history.total > 20 && <div className="package-history-paging"><button type="button" disabled={page <= 1} onClick={() => setPage(n => n - 1)}>{t('Previous')}</button><span>{page}</span><button type="button" disabled={page * 20 >= history.total} onClick={() => setPage(n => n + 1)}>{t('Next')}</button></div>}</>}
          </div>}
        </details>}
      </div>
      <footer className="package-detail-footer"><button type="button" onClick={onClose}>{t('Close')}</button>{onEdit && data && <button className="package-detail-edit" type="button" onClick={() => onEdit(data)}><Pencil size={16} aria-hidden="true" />{t('Edit')}</button>}</footer>
    </section>
  </div>;
}
