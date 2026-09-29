import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import managerEn from '../i18n/en';
import { roleLabel } from './roleUtils';
import { staffDate } from './staffData';

function StaffDrawer({ user, onClose }) {
  const drawerRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    drawerRef.current?.focus();
    const keyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('keydown', keyDown); previous?.focus(); };
  }, [onClose]);
  if (!user) return null;
  const copy = managerEn.staff.drawer;
  return <div className="manager-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <aside className="manager-detail-drawer" ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="staff-drawer-title" tabIndex="-1">
      <header><div><span>{copy.title}</span><h2 id="staff-drawer-title">{user.fullName}</h2><small>{roleLabel(user.roleName)}</small></div><button type="button" title={copy.close} aria-label={copy.close} onClick={onClose}><X size={19} /></button></header>
      <section><h3>{copy.information}</h3><dl><div><dt>{copy.email}</dt><dd>{user.email}</dd></div><div><dt>{copy.phone}</dt><dd>{user.phone || '—'}</dd></div><div><dt>{copy.status}</dt><dd>{user.status}</dd></div><div><dt>{copy.joined}</dt><dd>{staffDate(user.joinedAt)}</dd></div><div><dt>{copy.lastLogin}</dt><dd>{staffDate(user.lastLoginAt)}</dd></div><div><dt>{copy.plan}</dt><dd>{user.currentPlan}</dd></div></dl></section>
      <section><h3>{copy.planHistory}</h3>{user.planHistory.length ? <ul>{user.planHistory.map((plan, index) => <li key={`${plan.name}-${index}`}><strong>{plan.name}</strong><span>{plan.status} · {staffDate(plan.startedAt)}</span></li>)}</ul> : <p>{copy.noPlans}</p>}</section>
      <section><h3>{copy.activity}</h3>{user.activity.length ? <ul>{user.activity.map((item, index) => <li key={`${item.label}-${index}`}><strong>{item.label}</strong><span>{staffDate(item.occurredAt)}</span></li>)}</ul> : <p>{copy.noActivity}</p>}</section>
    </aside>
  </div>;
}

export default StaffDrawer;
