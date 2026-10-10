import { ChevronLeft, ChevronRight } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';

export default function ManagerPagination({ block, onPage, onSize, size, sizes = [20, 50, 100], formatNumber = String }) {
  useLanguage();
  return <nav className="ops-pagination" aria-label={t('Pagination')}>
    <span role="status" aria-live="polite">{t('{0}–{1} of {2}', [block.start, block.end, block.total].map(formatNumber))}</span>
    {onSize && <label>{t('Rows per page')}<select value={size} onChange={event => onSize(Number(event.target.value))}>{sizes.map(value => <option key={value}>{value}</option>)}</select></label>}
    <div className="ops-pagination-controls"><button type="button" className="manager-icon-button" aria-label={t('Previous page')} disabled={block.page === 1} onClick={() => onPage(block.page - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
    <span>{t('Page {0} of {1}', [formatNumber(block.page), formatNumber(block.pages)])}</span>
    <button type="button" className="manager-icon-button" aria-label={t('Next page')} disabled={block.page === block.pages} onClick={() => onPage(block.page + 1)}><ChevronRight size={16} aria-hidden="true" /></button></div>
  </nav>;
}
