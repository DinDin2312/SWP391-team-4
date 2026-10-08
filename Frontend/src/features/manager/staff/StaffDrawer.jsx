import { t, useLanguage } from '../../../i18n/useLanguage';
import { Activity, CalendarDays, Check, ChevronDown, Clipboard, Clock3, CreditCard, FileClock, KeyRound, LockKeyhole, Mail, Pencil, Phone, UnlockKeyhole, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import managerEn from '../i18n/en';
import { RoleBadge, StatusBadge } from './AccountBadge';
import StaffAvatar from './StaffAvatar';
import { displayStaffName, staffDate } from './staffData';

const permissionsByRole = {
  Administrator: ['Full access', 'Manage accounts', 'Audit logs'],
  'Center Manager': ['Manage staff', 'Center operations', 'Reports'],
  Receptionist: ['Member records', 'Bookings', 'Payments'],
  Coach: ['Class roster', 'Attendance', 'Schedule'],
  Member: ['Book classes', 'Membership', 'Profile'],
};
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

function StaffDrawer({ user, onClose, onEdit, onResetPassword, onToggleLock, onViewLogs, lockDisabled }) {
  useLanguage();
  const dialogRef = useRef(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!user) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const keyDown = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', keyDown);
    return () => { document.removeEventListener('keydown', keyDown); document.body.style.overflow = overflow; previous?.focus(); };
  }, [user, onClose]);
  if (!user) return null;

  const copy = managerEn.staff.drawer;
  const uid = `UID-${String(user.userId).padStart(4, '0')}`;
  const runAndClose = (action) => { onClose(); action(user); };
  const copyUid = async () => { await navigator.clipboard.writeText(uid); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };

  return <div className="manager-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="manager-detail-drawer" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="staff-drawer-title" tabIndex="-1">
      <header className="manager-detail-hero">
        <button className="manager-drawer-close" type="button" title={t(copy.close)} aria-label={t(copy.close)} onClick={onClose}><X size={19} /></button>
        <StaffAvatar user={user} className="manager-profile-avatar" />
        <div className="manager-detail-identity"><span>{t(copy.title)}</span><h2 id="staff-drawer-title">{displayStaffName(user.fullName)}</h2><p>{user.email}</p><div className="manager-detail-badges"><RoleBadge role={user.roleName} /><StatusBadge status={user.status} /></div></div>
      </header>

      <div className="manager-detail-actions" role="toolbar" aria-label={t("Account actions")}>
        <button type="button" onClick={() => runAndClose(onEdit)}><Pencil size={15} />{t("Edit")}</button>
        <button type="button" onClick={() => runAndClose(onResetPassword)}><KeyRound size={15} />{t("Reset password")}</button>
        <button className="is-warning" type="button" disabled={user.status !== 'INACTIVE' && lockDisabled} onClick={() => runAndClose(onToggleLock)}>{user.status === 'INACTIVE' ? <UnlockKeyhole size={15} /> : <LockKeyhole size={15} />}{t(user.status === 'INACTIVE' ? t('Unlock') : t('Lock'))}</button>
        <button type="button" onClick={onViewLogs}><FileClock size={15} />{t("View logs")}</button>
      </div>

      <section className="manager-detail-summary" aria-label={t(copy.summary)}>
        <article><CreditCard size={17} /><div><span>{t(copy.plan)}</span><strong>{t(user.currentPlan || 'No plan')}</strong></div></article>
        <article><CalendarDays size={17} /><div><span>{t(copy.joined)}</span><strong>{staffDate(user.joinedAt)}</strong></div></article>
        <article><Clock3 size={17} /><div><span>{t(copy.lastLogin)}</span><strong>{staffDate(user.lastLoginAt)}</strong></div></article>
      </section>

      <section className="manager-detail-section">
        <div className="manager-detail-section-title"><UserRound size={17} /><div><h3>{t("Contact details")}</h3><p>{t("Contact information and account identifier")}</p></div></div>
        <div className="manager-contact-grid">
          <article><span><Mail size={17} /></span><div><small>{t(copy.email)}</small><strong>{user.email}</strong></div></article>
          <article><span><Phone size={17} /></span><div><small>{t(copy.phone)}</small><strong>{t(user.phone || 'No phone')}</strong></div></article>
          <article><span><Clipboard size={17} /></span><div><small>{t("Account UID")}</small><strong>{uid}</strong></div><button className="manager-copy-icon" type="button" onClick={copyUid} aria-label={t("Copy UID")}>{copied ? <Check size={15} /> : <Clipboard size={15} />}</button></article>
        </div>
        <div className="manager-permissions"><small>{t("Permissions")}</small><div>{(permissionsByRole[user.roleName] || ['Standard access']).map((permission) => <span key={permission}>{permission}</span>)}</div></div>
      </section>

      <details className="manager-detail-section manager-plan-disclosure" key={user.userId}>
        <summary><div className="manager-detail-section-title"><CreditCard size={17} /><div><h3>{t(copy.planHistory)} <span className="manager-plan-count">({user.planHistory.length})</span></h3><p>{t(copy.planHint)}</p></div></div><ChevronDown size={18} className="manager-plan-chevron" /></summary>
        {user.planHistory.length ? <div className="manager-plan-history" tabIndex="0" role="region" aria-label={t(copy.planHistory)}>{user.planHistory.map((plan, index) => <article key={`${plan.name}-${index}`}><div><strong>{plan.name}</strong><StatusBadge status={String(plan.status).toUpperCase()} /></div><dl><div><dt>{t("Start")}</dt><dd>{staffDate(plan.startedAt)}</dd></div><div><dt>{t("End")}</dt><dd>{staffDate(plan.endedAt)}</dd></div><div><dt>{t("Price")}</dt><dd>{money(plan.price)}</dd></div></dl></article>)}</div> : <div className="manager-detail-empty">{t(copy.noPlans)}</div>}
      </details>

      <section className="manager-detail-section">
        <div className="manager-detail-section-title"><Activity size={17} /><div><h3>{t(copy.activity)}</h3><p>{t(copy.activityHint)}</p></div></div>
        {user.activity.length ? <ul className="manager-detail-timeline is-activity">{user.activity.map((item, index) => <li key={`${item.label}-${index}`}><i /><div><strong>{t(item.label)}</strong><span>{staffDate(item.occurredAt)}</span></div></li>)}</ul> : <div className="manager-detail-empty">{t(copy.noActivity)}</div>}
      </section>
    </section>
  </div>;
}

export default StaffDrawer;
