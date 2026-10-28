import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ChevronLeft, ChevronRight, FileText, Search, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatDateTime, formatMoney } from '../../../utils/displayFormat';
import { apiError, isoDate } from '../managerUtils';
import managerService from '../services/managerService';
import ManagerPageHeader from '../components/ManagerPageHeader';
import './transactions.css';

const paymentStates = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'CANCELLED', 'REVIEW'];
const invoiceStates = ['ALL', 'PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REVIEW'];
export function Status({ value }) { return <span className={`tx-status tx-${String(value).toLowerCase()}`}>{t(value || 'Unknown')}</span>; }

function InvoiceDetail({ id, onClose }) {
  const [data, setData] = useState(null), [error, setError] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    let cancelled = false;
    managerService.transactionDetail(id).then(result => { if (!cancelled) setData(result); }).catch(err => { if (!cancelled) setError(apiError(err, 'Unable to load data.')); });
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; ref.current?.focus();
    return () => { cancelled = true; document.body.style.overflow = overflow; previous?.focus(); };
  }, [id]);
  return <div className="tx-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><section className="tx-dialog" role="dialog" aria-modal="true" aria-labelledby="tx-detail-title" tabIndex={-1} ref={ref} onKeyDown={event => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') { const buttons = ref.current.querySelectorAll('button'); const first = buttons[0], last = buttons[buttons.length - 1]; if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  }}>
    <header><div><span>{t('Invoice details')}</span><h2 id="tx-detail-title">{t('Invoice')} #{id}</h2></div><button type="button" onClick={onClose} aria-label={t('Close')}><X size={20} /></button></header>
    <div className="tx-dialog-body">{error ? <p role="alert">{t(error)}</p> : !data ? <p role="status">{t('Loading...')}</p> : <>
      <div className="tx-detail-summary"><div><Status value={data.invoiceStatus} /><h3>{data.memberName || '—'}</h3><span>{data.memberEmail}</span><p>{formatDateTime(data.createdAt)}</p></div><div><span>{t('Invoice total')}</span><strong>{formatMoney(data.totalAmount)}</strong></div></div>
      <h3>{t('Purchased Items')}</h3><div className="tx-items">{data.items.map(item => <div key={item.detailId}><span><small>{t(item.itemType === 'PACKAGE' ? 'Package' : 'Class')}</small>{item.itemName}</span><strong>{formatMoney(item.unitPrice)}</strong></div>)}{!data.items.length && <p>{t('No detailed items found for this invoice.')}</p>}</div>
      <h3>{t('Payment attempts')}</h3><p className="tx-note">{t('Invoice status and payment status are tracked separately.')}</p>
      {data.payments.map(payment => <article className="tx-payment" key={payment.paymentId}><div><strong>{t('Payment')} #{payment.paymentId}</strong><Status value={payment.paymentStatus} /></div><strong>{formatMoney(payment.amount)}</strong><dl><dt>{t('Payment Method')}</dt><dd>{payment.paymentMethod || '—'}</dd><dt>{t('Transaction ID')}</dt><dd>{payment.transactionNo || '—'}</dd><dt>{t('Payment Date')}</dt><dd>{formatDateTime(payment.paymentDate)}</dd></dl></article>)}
      {!data.payments.length && <p className="tx-empty">{t('No payment recorded for this invoice.')}</p>}
      {(data.invoiceStatus === 'REVIEW' || data.payments.some(p => p.paymentStatus === 'REVIEW')) && <p className="tx-review">{t('This payment needs reconciliation. Verify the provider record before handling it; this screen does not change payment status.')}</p>}
    </>}</div><footer><button type="button" className="manager-secondary" onClick={onClose}>{t('Close')}</button></footer>
  </section></div>;
}

export default function TransactionsPage({ updatedAt }) {
  useLanguage();
  const [query, setQuery] = useSearchParams();
  const now = new Date(), fromDefault = isoDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const mode = query.get('mode') === 'invoices' ? 'invoices' : 'payments';
  const states = mode === 'payments' ? paymentStates : invoiceStates;
  const from = query.get('from') || fromDefault, to = query.get('to') || isoDate(now);
  const status = states.includes(query.get('status')) ? query.get('status') : 'ALL';
  const method = query.get('method') || 'ALL', keyword = query.get('keyword') || '';
  const page = Math.max(0, Number(query.get('page')) || 0), size = 20;
  const [draft, setDraft] = useState({ from, to, status, method, keyword });
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [detail, setDetail] = useState(null), [retry, setRetry] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => setDraft({ from, to, status, method, keyword }), 0); return () => window.clearTimeout(timer); }, [from, to, status, method, keyword]);
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true); setError(''); setData(null);
      managerService.transactions({ mode, from, to, status, method, keyword, page, size }).then(result => { if (!cancelled) setData(result); }).catch(err => { if (!cancelled) setError(apiError(err, 'Unable to load data.')); }).finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [mode, from, to, status, method, keyword, page, updatedAt, retry]);
  const change = values => setQuery({ view: 'transactions', mode, from, to, status, method, keyword, page: String(page), ...values });
  const valid = draft.from && draft.to && draft.from <= draft.to;
  return <div className="tx-page">
    <ManagerPageHeader title="Transactions" description="Monitor system-wide invoices and payment history." />
    <div className="tx-tabs" role="group" aria-label={t('Transaction view')}>{[['payments', 'Payments', ArrowDownLeft], ['invoices', 'Invoices', FileText]].map(([key, label, Icon]) => <button type="button" key={key} aria-pressed={mode === key} onClick={() => change({ mode: key, status: 'ALL', page: '0' })}><Icon size={17} />{t(label)}</button>)}</div>
    <form className="tx-filters" onSubmit={event => { event.preventDefault(); if (valid) change({ ...draft, page: '0' }); }}>
      <label className="tx-search">{t('Search')}<div><Search size={17} /><input value={draft.keyword} maxLength={200} placeholder={t('Invoice, transaction ID, member name or email')} onChange={event => setDraft(current => ({ ...current, keyword: event.target.value }))} /></div></label>
      <label>{t('Status')}<select value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value }))}>{states.map(value => <option key={value} value={value}>{t(value === 'ALL' ? 'All' : value)}</option>)}</select></label>
      <label>{t('Payment Method')}<select value={draft.method} onChange={event => setDraft(current => ({ ...current, method: event.target.value }))}>{['ALL', 'PAYOS', 'VNPAY', 'MOMO', 'CASH', 'FREE'].map(value => <option key={value} value={value}>{t(value === 'ALL' ? 'All' : value === 'PAYOS' ? 'VietQR (PayOS)' : value)}</option>)}</select></label>
      <label>{t('From')}<input type="date" required max={draft.to} value={draft.from} onInput={event => setDraft(current => ({ ...current, from: event.target.value }))} /></label><label>{t('To')}<input type="date" required min={draft.from} value={draft.to} onInput={event => setDraft(current => ({ ...current, to: event.target.value }))} /></label><button type="submit" className="manager-primary" disabled={!valid}>{t('Apply filters')}</button>
    </form>
    <p className="tx-note">{t(mode === 'payments' ? 'Dates filter payment records. Each row is one payment attempt.' : 'Dates filter invoice creation. An invoice may have several payment attempts.')}</p>
    {error && <div className="manager-alert" role="alert">{t(error)}<button onClick={() => setRetry(value => value + 1)}>{t('Retry')}</button></div>}
    <section className="tx-table-card" aria-busy={loading}><header><h2>{t(mode === 'payments' ? 'Payment history' : 'Invoice history')}</h2><span>{data ? `${data.total} ${t('records')}` : '—'}</span></header>
      <div className="tx-table-wrap"><table><thead><tr><th>{t(mode === 'payments' ? 'Payment / Invoice' : 'Invoice')}</th><th>{t('Member')}</th><th>{t(mode === 'payments' ? 'Payment Date' : 'Created at')}</th><th>{t('Amount')}</th>{mode === 'payments' && <th>{t('Payment Method')}</th>}<th>{t(mode === 'payments' ? 'Payment status' : 'Invoice status')}</th><th>{t('Details')}</th></tr></thead><tbody>{data?.items.map(row => <tr key={row.paymentId || row.invoiceId}><td><strong>{mode === 'payments' ? `#${row.paymentId}` : `#${row.invoiceId}`}</strong><small>{mode === 'payments' ? `${t('Invoice')} #${row.invoiceId}` : `${row.paymentCount} ${t('payment attempts')}`}</small>{mode === 'payments' && <small className="tx-reference">{row.transactionNo || '—'}</small>}</td><td><strong>{row.memberName || '—'}</strong><small>{row.memberEmail}</small></td><td>{formatDateTime(mode === 'payments' ? row.paymentDate : row.createdAt)}</td><td className="tx-amount">{formatMoney(mode === 'payments' ? row.amount : row.totalAmount)}</td>{mode === 'payments' && <td>{row.paymentMethod || '—'}</td>}<td><Status value={mode === 'payments' ? row.paymentStatus : row.invoiceStatus} /></td><td><button type="button" className="tx-view" onClick={() => setDetail(row.invoiceId)} aria-label={`${t('Invoice details')} #${row.invoiceId}`}>{t('View')}</button></td></tr>)}</tbody></table></div>
      {loading ? <p className="tx-empty" role="status">{t('Loading...')}</p> : !error && !data?.items.length && <p className="tx-empty">{t('No matching transactions. Try another date range or filter.')}</p>}
      <footer><span>{data?.total ? `${page * size + 1}–${Math.min((page + 1) * size, data.total)} / ${data.total}` : '0'}</span><div><button type="button" disabled={loading || !data || page === 0} onClick={() => change({ page: String(page - 1) })} aria-label={t('Previous page')}><ChevronLeft size={17} /></button><span>{t('Page')} {page + 1}</span><button type="button" disabled={loading || !data || (page + 1) * size >= data.total} onClick={() => change({ page: String(page + 1) })} aria-label={t('Next page')}><ChevronRight size={17} /></button></div></footer>
    </section>{detail != null && <InvoiceDetail key={detail} id={detail} onClose={() => setDetail(null)} />}
  </div>;
}
