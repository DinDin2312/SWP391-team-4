import { t, useLanguage } from '../../../i18n/useLanguage';
import { Ellipsis, FileClock, KeyRound, LockKeyhole, Pencil, UnlockKeyhole, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import managerEn from '../i18n/en';

function StaffActionsMenu({ user, disabled, lockDisabled, onDetails, onEdit, onResetPassword, onToggleLock, onViewLogs }) {
  useLanguage();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, flip: false });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const labels = managerEn.staff.actions;
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false); };
    const keyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', keyDown); };
  }, [open]);
  const toggle = () => {
    if (!open) {
      const bounds = triggerRef.current.getBoundingClientRect();
      const flip = window.innerHeight - bounds.bottom < 250;
      setPosition({ top: flip ? bounds.top : bounds.bottom + 6, left: Math.max(12, bounds.right - 190), flip });
    }
    setOpen((value) => !value);
  };
  const run = (callback) => { setOpen(false); callback(user); };
  const items = [[labels.details, UserRound, onDetails, false], [labels.edit, Pencil, onEdit, false], [labels.resetPassword, KeyRound, onResetPassword, false], [labels.viewLogs, FileClock, onViewLogs, false]];

  return <div className="manager-actions-menu" ref={rootRef} onClick={(event) => event.stopPropagation()}>
    <button ref={triggerRef} className="manager-action-trigger" type="button" disabled={disabled} title={t(labels.open)} aria-label={t("{0} for {1}",[labels.open,user.fullName])} aria-expanded={open} onClick={toggle}><Ellipsis size={18} /></button>
    {open && createPortal(<div ref={menuRef} className={`manager-actions-popover is-portal ${position.flip ? 'is-flipped' : ''}`} style={{ top: position.top, left: position.left }} role="menu">{items.map(([label, Icon, action, itemDisabled]) => (
      <button type="button" role="menuitem" key={label} disabled={itemDisabled} title={t(label)} aria-label={t("{0} {1}",[label,user.fullName])} onClick={() => run(action)}><Icon size={15} /><span>{t(label)}</span></button>
    ))}<div className="manager-menu-divider" /><button className="is-warning" type="button" role="menuitem" disabled={user.status !== 'INACTIVE' && lockDisabled} onClick={() => run(onToggleLock)}>{user.status === 'INACTIVE' ? <UnlockKeyhole size={15} /> : <LockKeyhole size={15} />}<span>{t(user.status === 'INACTIVE' ? labels.unlock : labels.lock)}</span></button></div>, document.body)}
  </div>;
}

export default StaffActionsMenu;
