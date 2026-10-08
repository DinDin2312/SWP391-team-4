import { t, useLanguage } from '../../../i18n/useLanguage';
import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', busy, onConfirm, onClose }) {
  useLanguage();
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const keyDown = (event) => { if (event.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('keydown', keyDown); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open, busy, onClose]);
  if (!open) return null;
  return <div className="manager-modal-backdrop" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
    <section className="manager-modal manager-confirm-dialog" ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" tabIndex={-1}>
      <button className="manager-confirm-close" type="button" disabled={busy} onClick={onClose} aria-label={t("Close")}><X size={18} /></button>
      <span className={`manager-confirm-icon is-${tone}`}><AlertTriangle size={22} /></span>
      <h3 id="confirm-title">{t(title)}</h3><p>{t(message)}</p>
      <footer><button className="manager-secondary" type="button" disabled={busy} onClick={onClose}>{t("Cancel")}</button><button className={tone === 'danger' ? 'manager-danger' : 'manager-primary'} type="button" disabled={busy} onClick={onConfirm}>{t(busy ? t('Working…') : confirmLabel)}</button></footer>
    </section>
  </div>;
}

export default ConfirmDialog;
