import { Ellipsis, FileClock, KeyRound, LockKeyhole, Pencil, UnlockKeyhole, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import managerEn from '../i18n/en';

function StaffActionsMenu({ user, disabled, lockDisabled, onDetails, onEdit, onResetPassword, onToggleLock, onViewLogs }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const labels = managerEn.staff.actions;
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const keyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', keyDown); };
  }, [open]);
  const run = (callback) => { setOpen(false); callback(user); };
  const items = [
    [labels.details, UserRound, onDetails, false],
    [labels.edit, Pencil, onEdit, false],
    [labels.resetPassword, KeyRound, onResetPassword, false],
    [user.status === 'INACTIVE' ? labels.unlock : labels.lock, user.status === 'INACTIVE' ? UnlockKeyhole : LockKeyhole, onToggleLock, user.status !== 'INACTIVE' && lockDisabled],
    [labels.viewLogs, FileClock, onViewLogs, false],
  ];

  return <div className="manager-actions-menu" ref={rootRef} onClick={(event) => event.stopPropagation()}>
    <button className="manager-action-trigger" type="button" disabled={disabled} title={labels.open} aria-label={`${labels.open} for ${user.fullName}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Ellipsis size={18} /></button>
    {open && <div className="manager-actions-popover" role="menu">{items.map(([label, Icon, action, itemDisabled]) => (
      <button type="button" role="menuitem" key={label} disabled={itemDisabled} title={label} aria-label={`${label} ${user.fullName}`} onClick={() => run(action)}><Icon size={15} /><span>{label}</span></button>
    ))}</div>}
  </div>;
}

export default StaffActionsMenu;
