import { LockKeyhole, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import managerEn from '../i18n/en';

function LockAccountModal({ users, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const copy = managerEn.staff.lock;
  useEffect(() => { dialogRef.current?.focus(); }, []);
  const submit = (event) => {
    event.preventDefault();
    if (!reason.trim()) { setError(copy.required); return; }
    onConfirm(reason.trim());
  };
  return <div className="manager-modal-backdrop" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
    <section className="manager-modal manager-lock-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lock-account-title" tabIndex="-1">
      <header><div><span><LockKeyhole size={15} /> {users.length > 1 ? copy.bulkTitle : copy.title}</span><h3 id="lock-account-title">{users.length > 1 ? copy.bulkTitle : users[0]?.fullName}</h3></div><button type="button" disabled={busy} title={copy.cancel} aria-label={copy.cancel} onClick={onClose}><X size={19} /></button></header>
      <form onSubmit={submit}><p>{copy.description(users.length)}</p><label>{copy.reason}<textarea autoFocus rows="4" maxLength="500" value={reason} placeholder={copy.reasonPlaceholder} onChange={(event) => { setReason(event.target.value); setError(''); }} /></label>{error && <div className="manager-form-error" role="alert">{error}</div>}<footer><button type="button" className="manager-secondary" disabled={busy} onClick={onClose}>{copy.cancel}</button><button className="manager-danger" disabled={busy}>{copy.confirm}</button></footer></form>
    </section>
  </div>;
}

export default LockAccountModal;
