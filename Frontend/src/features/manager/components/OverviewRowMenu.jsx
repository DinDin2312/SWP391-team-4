import { t, useLanguage } from '../../../i18n/useLanguage';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function OverviewRowMenu({ row, time, view, cancel, items, buttonLabel }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const root = useRef(null);
  const opener = useRef(null);
  const menu = useRef(null);
  const close = () => { setOpen(false); opener.current?.focus(); };
  const show = () => {
    if (items) {
      const box = opener.current.getBoundingClientRect();
      const height = items.length * 40 + 10;
      setPosition({ position: 'fixed', right: 'auto', zIndex: 30,
        left: Math.max(8, Math.min(box.right - 160, window.innerWidth - 168)),
        top: Math.max(8, box.bottom + height + 6 > window.innerHeight ? box.top - height - 6 : box.bottom + 6) });
    }
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return undefined;
    menu.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) { setOpen(false); opener.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    const moved = () => setOpen(false);
    if (items) { window.addEventListener('resize', moved); window.addEventListener('scroll', moved, true); }
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', moved); window.removeEventListener('scroll', moved, true);
    };
  }, [open, items]);
  const keys = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const items = [...menu.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
      const index = items.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    }
    if (event.key === 'Tab') setOpen(false);
  };
  return <div className="overview-row-menu" ref={root}>
    <button ref={opener} type="button" className={`overview-menu-opener${buttonLabel?' has-label':''}`} title={t("Actions for {0}",[row.className])} aria-label={time ? t("Actions for {0}, {1}",[row.className,time]) : t('Actions for {0}',[row.className])} aria-haspopup="menu" aria-expanded={open} onClick={() => open ? close() : show()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); } }}><MoreHorizontal size={18} aria-hidden="true" />{buttonLabel&&<span>{t(buttonLabel)}</span>}</button>
    {open && <div ref={menu} style={position} role="menu" aria-label={t("Actions for {0}",[row.className])} onKeyDown={keys}>
      {items ? items.map(item => <button key={item.label} role="menuitem" tabIndex={-1} className={item.danger ? 'is-danger' : ''} disabled={item.disabled} onClick={()=>{close();item.run();}}>{t(item.label)}</button>) : <><button role="menuitem" tabIndex={-1} onClick={() => { close(); view(row); }}>{t("View session")}</button><button role="menuitem" tabIndex={-1} className="is-danger" disabled={row.status !== 'SCHEDULED'} onClick={() => { close(); cancel(row); }}>{t("Cancel session")}</button></>}
    </div>}
  </div>;
}
