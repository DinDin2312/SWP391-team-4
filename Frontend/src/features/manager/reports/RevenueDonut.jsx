import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { t } from '../../../i18n/useLanguage';
import { locale } from '../../../i18n/languageStore';
import { formatMoney } from '../../../utils/displayFormat';
import { buildSlices, exactShares } from './classRevenue';

const RADIUS = 78;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 2;                  // surface gap between slices

const count = value => new Intl.NumberFormat(locale()).format(Number(value || 0));
const sharePercent = value => `${new Intl.NumberFormat(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;

// Revenue split as a donut; the legend below carries the exact amounts and shares.
// `shareNote` is a message with {0} = this revenue's share of the period total and {1} = that total.
export default function RevenueDonut({ items, totalRevenue, ariaLabel, centerLabel, otherLabel, emptyText, shareNote, initialOpen = null }) {
  const [open, setOpen] = useState(initialOpen);
  const [hover, setHover] = useState(null);
  const slices = buildSlices(items || [], otherLabel);
  const courseRevenue = slices.reduce((sum, slice) => sum + slice.revenue, 0);
  if (!courseRevenue) return <div className="reports-empty"><p>{t(emptyText)}</p></div>;

  const focus = slices.find(slice => slice.key === (hover ?? open));
  const lengths = slices.map(slice => slice.revenue / courseRevenue * CIRCUMFERENCE);
  const arcs = slices.map((slice, index) => ({ ...slice, length: lengths[index], start: lengths.slice(0, index).reduce((sum, value) => sum + value, 0) }));
  const toggle = key => setOpen(current => (current === key ? null : key));
  const total = Number(totalRevenue || 0);

  return <div className="reports-donut">
    <div className="reports-donut-figure">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${t(ariaLabel)}: ${slices.map(slice => `${slice.label} ${formatMoney(slice.revenue)} (${sharePercent(slice.share)})`).join(', ')}`}>
        <circle cx="100" cy="100" r={RADIUS} className="reports-donut-track" strokeWidth={STROKE} />
        {arcs.map(arc => {
          const visible = Math.max(arc.length - (arcs.length > 1 ? GAP : 0), 0.6);
          return <circle key={arc.key} cx="100" cy="100" r={RADIUS} fill="none" strokeWidth={STROKE}
            className={`reports-donut-slice is-slot-${arc.slot}${focus && focus.key !== arc.key ? ' is-dim' : ''}`}
            strokeDasharray={`${visible} ${CIRCUMFERENCE}`} strokeDashoffset={-arc.start} transform="rotate(-90 100 100)"
            onMouseEnter={() => setHover(arc.key)} onMouseLeave={() => setHover(null)} onClick={() => arc.rows.length && toggle(arc.key)}>
            <title>{`${arc.label}: ${formatMoney(arc.revenue)} (${sharePercent(arc.share)})`}</title>
          </circle>;
        })}
      </svg>
      <div className="reports-donut-center" aria-hidden="true">
        <strong>{formatMoney(focus ? focus.revenue : courseRevenue)}</strong>
        <span>{focus ? `${focus.label} · ${sharePercent(focus.share)}` : t(centerLabel)}</span>
      </div>
    </div>
    <ul className="reports-donut-legend">{slices.map(slice => <li key={slice.key} className={open === slice.key ? 'is-open' : ''}>
      <button type="button" aria-expanded={slice.rows.length ? open === slice.key : undefined} onClick={() => slice.rows.length && toggle(slice.key)} onMouseEnter={() => setHover(slice.key)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(slice.key)} onBlur={() => setHover(null)}>
        <span className={`reports-swatch reports-donut-swatch is-slot-${slice.slot}`} aria-hidden="true" />
        <span className="reports-donut-main">
          <b>{slice.label}</b>
          <span className="reports-donut-figures"><small>{t('{0} registrations', [count(slice.registrations)])}</small><span><strong>{formatMoney(slice.revenue)}</strong><em>{sharePercent(slice.share)}</em></span></span>
        </span>
        {slice.rows.length > 0 ? <ChevronDown size={15} className="reports-donut-chevron" aria-hidden="true" /> : <span aria-hidden="true" />}
      </button>
      {open === slice.key && slice.rows.length > 0 && <ol className="reports-donut-rows">{slice.rows.map((row, index, rows) => <li key={row.key}>
        <span className="reports-donut-main">
          <b>{row.label}</b>
          <span className="reports-donut-figures"><small>{row.meta || '\u00a0'}</small><span><strong>{formatMoney(row.revenue)}</strong><em>{sharePercent(exactShares(rows.map(item => item.revenue))[index])}</em></span></span>
        </span>
      </li>)}</ol>}
    </li>)}</ul>
    {total > 0 && <p className="reports-card-note">
      {shareNote && total > courseRevenue && <>{t(shareNote, [sharePercent(courseRevenue / total * 100), formatMoney(total)])} </>}
      {t('When one invoice has several items, the amount paid is split by item price.')}
    </p>}
  </div>;
}
