import { locale } from '../../../i18n/languageStore.js';
import LanguageSwitcher from '../../../i18n/LanguageSwitcher';
import { t, useLanguage } from '../../../i18n/useLanguage';
import OperationalOverview from '../components/OperationalOverview';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BarChart3, CalendarDays, Camera,
  ClipboardList, Dumbbell, LayoutDashboard, LogOut,
  Menu, Package, Pencil, Plus, RefreshCw, ShieldCheck, Users, X,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import ManagerPageHeader from '../components/ManagerPageHeader';
import managerService from '../services/managerService';
import { isoDate, initialForm, apiError, reportCsv } from '../managerUtils';
import { formatMoney, formatDate, formatDateTime } from '../../../utils/displayFormat';
import StaffPage from '../staff/StaffPage';
import OperationsPage, { OperationsSkeleton } from '../operations/OperationsPage';
import { weekRange } from '../operations/operationsUtils';
import ManagerToast from '../staff/ManagerToast';
import StaffSkeleton from '../staff/StaffSkeleton';
import StaffAvatar from '../staff/StaffAvatar';
import ManagerSelect from '../staff/ManagerSelect';
import PasswordInput from '../staff/PasswordInput';
import { validateAvatarFile } from '../staff/staffData';
import './manager.css';
import './manager-polish.css';

const today = new Date();
const initialFrom = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
const initialTo = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
const money = formatMoney;
const dateTime = formatDateTime;

const adminPages = [
  { id: 'dashboard', title: 'Overview', description: 'Monitor center performance and recent operational activity.', icon: LayoutDashboard },
  { id: 'people', title: 'Staff & Permissions', description: 'Manage account access, roles, and status in one place.', icon: Users },
  { id: 'operations', title: 'Center Operations', description: 'Coordinate classes, schedules, subjects, and rooms.', icon: CalendarDays },
  { id: 'packages', title: 'Membership Packages', description: 'Manage membership plans, pricing, and availability.', icon: Package },
  { id: 'reports', title: 'Reports', description: 'Review financial and operational performance by date range.', icon: BarChart3 },
  { id: 'audit', title: 'System Audit Log', description: 'Review administrative changes and account activity.', icon: ClipboardList },
];

function EmptyState({ message = 'No matching data available.' }) {
  useLanguage();
  return <div className="manager-empty"><ClipboardList size={28} /><span>{t(message)}</span></div>;
}

function Loading() {
  useLanguage();
  return <div className="manager-loading"><RefreshCw size={20} />{t("Loading data...")}</div>;
}

function ManagerDashboard() {
  useLanguage();
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useSearchParams();
  const active = adminPages.some((p) => p.id === query.get('view')) ? query.get('view') : 'dashboard';
  const [updatedAt, setUpdatedAt] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [data, setData] = useState(null);
  const [dataView, setDataView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const [filters, setFilters] = useState({ keyword: '', role: 'ALL', status: 'ALL', from: initialFrom, to: initialTo });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const requestId = useRef(0);
  const operationLookups = useRef(null);
  const opsFrom=query.get('from') || (active==='operations'?weekRange().from:appliedFilters.from);
  const opsTo=query.get('to') || (active==='operations'?weekRange().to:appliedFilters.to);
  const opsLow=query.get('lowRegistration')==='true', opsStatus=query.get('status') || undefined, opsExclude=query.get('excludeUrgent')==='true';

  const [notice, setNotice] = useState('');
  const invalidateRequest = useCallback(() => { requestId.current++; }, []);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    const publish = (result) => { if (currentRequest === requestId.current) { setData(result); setDataView(active); setUpdatedAt(new Date()); } };
    try {
      if (['operations', 'reports'].includes(active) && (!appliedFilters.from || !appliedFilters.to || appliedFilters.from > appliedFilters.to)) {
        throw new Error('Select a valid date range: the start date cannot be after the end date.');
      }
      if (active === 'dashboard') publish(await managerService.dashboard());
      if (active === 'people') {
        const [users, roles] = await Promise.all([managerService.users(appliedFilters), managerService.roles()]);
        publish({ users, roles });
      }
      if (active === 'operations') {
        const [lookups,schedules] = await Promise.all([
          operationLookups.current || Promise.all([managerService.subjects(),managerService.rooms(),managerService.classes(),managerService.users({role:'Coach',status:'ACTIVE'})]),
          managerService.schedules(opsFrom,opsTo,{lowRegistration:opsLow,status:opsStatus,excludeUrgent:opsExclude}),
        ]);
        const [subjects,rooms,classes,coaches]=lookups;
        if(currentRequest===requestId.current) operationLookups.current=lookups;
        publish({ subjects, rooms, classes, schedules, coaches });
      }
      if (active === 'packages') publish(await managerService.packages());
      if (active === 'reports') publish(await managerService.reports(appliedFilters.from, appliedFilters.to));
      if (active === 'audit') publish(await managerService.auditLogs());
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(apiError(err, err.message || 'Unable to load data.'));
        if (active === 'operations') setData(null);
        setDataView(active);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [active, appliedFilters, opsFrom, opsTo, opsLow, opsStatus, opsExclude]);
  const refreshAll = () => { operationLookups.current=null; return load(); };

  useEffect(() => {
    if (active !== 'operations') operationLookups.current = null;
  }, [active]);

  useEffect(() => {
    const timer = window.setTimeout(() => { if (active === 'operations' && query.has('from') && query.has('to')) setFilters(current => ({ ...current, from: query.get('from'), to: query.get('to') })); }, 0);
    return () => window.clearTimeout(timer);
  }, [active, query]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(load, 0);
    return () => { window.clearTimeout(refreshTimer); invalidateRequest(); };
  }, [load, invalidateRequest]);

  const selectPage = (id) => {
    if (id === active) { setMobileNav(false); return; }
    requestId.current++;
    setLoading(true);
    setNotice('');
    if (id === 'operations') {
      const next = { ...filters, ...weekRange() };
      setFilters(next); setAppliedFilters(next);
    }
    setQuery(id === 'dashboard' ? {} : { view: id });
    setData(null);
    setMobileNav(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSaved = async (message = 'Changes saved.') => { setModal(null); setNotice(message); await refreshAll(); };
  const applyFilters = (nextFilters = filters) => { setAppliedFilters({ ...nextFilters }); if (active === 'operations') { const next = new URLSearchParams(query); next.set('from', nextFilters.from); next.set('to', nextFilters.to); setQuery(next); } };
  const initials = (userInfo?.fullName || 'Center Manager').split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const operationFilters = { ...appliedFilters, from: opsFrom, to: opsTo };
  const currentPage = adminPages.find((item) => item.id === active) || adminPages[0];
  const initialLoading = dataView !== active || (loading && data === null);

  return (
    <div className={`manager-app ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <aside id="manager-sidebar" className={`manager-sidebar ${mobileNav ? 'is-open' : ''}`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        onFocus={() => setSidebarCollapsed(false)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) setSidebarCollapsed(true); }}>
        <div className="manager-brand"><span><Dumbbell size={22} /></span><div><strong>{t("NEXUS")}</strong><small>{t("CENTER CONTROL")}</small></div><button className="manager-mobile-close" onClick={() => setMobileNav(false)} aria-label={t("Close menu")} title={t("Close menu")}><X size={20} /></button></div>
        <div className="manager-role"><ShieldCheck size={16} /><span>{t("Center Manager")}</span></div>
        <nav>
          {adminPages.map(({ id, title, icon: Icon }) => <button key={id} title={t(title)} aria-label={t(title)} aria-current={active === id ? 'page' : undefined} className={active === id ? 'active' : ''} onClick={() => selectPage(id)}><Icon size={18} /><span>{t(title)}</span></button>)}
        </nav>
        <div className="manager-profile">
          <div className="manager-avatar">{initials}</div><div><strong>{t(userInfo?.fullName || 'Center Manager')}</strong><small>{t(userInfo?.email || 'admin@sport.com')}</small></div>
          <button onClick={handleLogout} title={t("Log out")} aria-label={t("Log out")}><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileNav && <button className="manager-overlay" onClick={() => setMobileNav(false)} aria-label={t("Close menu")} />}

      <main className="manager-main">
        <header className="manager-topbar">
          <button type="button" className="manager-sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-controls="manager-sidebar" aria-expanded={!sidebarCollapsed} aria-label={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')} title={t(sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar')}><Menu size={20} /></button>
          <button className="manager-menu-button" onClick={() => setMobileNav(true)} aria-label={t("Open menu")} title={t("Open menu")}><Menu size={20} /></button>
          <nav className="manager-breadcrumb" aria-label={t("Breadcrumb")}><span>{t("Nexus Center")}</span><i aria-hidden="true">/</i><strong>{t(currentPage.title)}</strong></nav>
          <span className="overview-updated" role="status">{t(updatedAt ? t(`Updated ${new Intl.DateTimeFormat(locale(), { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(updatedAt)}`) : t('Loading…'))}</span>
          <LanguageSwitcher />
          <button className={`manager-icon-button ${loading ? 'is-refreshing' : ''}`} onClick={refreshAll} title={t("Refresh")} aria-label={t("Refresh data")} aria-busy={loading} disabled={initialLoading}><RefreshCw size={18} /></button>
        </header>

        <section className="manager-content">
          {error && <div className="manager-alert" role="alert"><span>{t(error)}</span><button onClick={load}>{t("Retry")}</button></div>}
          {initialLoading && active !== 'dashboard' ? (active === 'people' ? <StaffSkeleton /> : active === 'operations' ? <OperationsSkeleton /> : <Loading />) : <ManagerView page={currentPage} active={active} data={dataView === active ? data : null} filters={filters} appliedFilters={active === 'operations' ? operationFilters : appliedFilters} setFilters={setFilters} reload={applyFilters} selectPage={selectPage} currentUser={userInfo} notify={setNotice} openModal={setModal} refresh={refreshAll} loading={loading || dataView !== active} loadError={error} updatedAt={updatedAt} />}
        </section>
      </main>
      <ManagerToast message={t(notice)} onClose={() => setNotice('')} />
      {modal && <EditorModal config={modal} dictionaries={active === 'people' || active === 'operations' ? data : null} onClose={() => setModal(null)} onSaved={handleSaved} />}

    </div>
  );
}

function ManagerView(props) {
  useLanguage();
  if (props.active === 'dashboard') return <OperationalOverview {...props} />;
  if (props.active === 'people') return <StaffPage {...props} />;
  if (props.active === 'operations') return <OperationsPage {...props} />;
  if (props.active === 'packages') return <PackagesView {...props} />;
  if (props.active === 'reports') return <ReportsView {...props} />;
  return <AuditView {...props} />;
}

function PackagesView({ data, openModal, page }) {
  useLanguage();
  return <>
    <ManagerPageHeader title={t(page.title)} description={t(page.description)} actions={<button className="manager-primary" onClick={() => openModal({ type: 'package' })}><Plus size={17} />{t("Add Package")}</button>} />
    <div className="manager-package-grid">{data?.map((item) => <article key={item.packageId}><div className="manager-package-top"><span><Package size={19} /></span><button onClick={() => openModal({ type: 'package', item })}><Pencil size={16} /></button></div><small>{item.packageType?.replace('_', ' ')}</small><h3>{item.packageName}</h3><strong>{money(item.price)}</strong><div><span>{item.durationDays}{' '}{t("days")}</span><span>{item.activeSubscribers || 0}{' '}{t("active")}</span></div></article>)}</div>{!data?.length && <EmptyState />}
  </>;
}

function ReportsView({ data, filters, appliedFilters, setFilters, reload, page }) {
  useLanguage();
  const summary = data?.summary || {};
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([reportCsv(data)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url;
    link.download = 'report-' + appliedFilters.from + '-' + appliedFilters.to + '.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const maxRevenue = Math.max(...(data?.revenueByDay || []).map((item) => Number(item.value)), 1);
  return <>
    <ManagerPageHeader title={t(page.title)} description={t(page.description)} actions={<div className="manager-report-range"><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><span>{t("to")}</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /><button className="manager-secondary" onClick={reload}>{t("View")}</button><button className="manager-secondary" disabled={!data} onClick={exportReport}>{t("Export CSV")}</button></div>} />
    <div className="manager-report-stats"><div><small>{t("Revenue")}</small><strong>{money(summary.revenue)}</strong></div><div><small>{t("Successful transactions")}</small><strong>{summary.successfulPayments || 0}</strong></div><div><small>{t("Pending invoices")}</small><strong>{summary.pendingInvoices || 0}</strong></div><div><small>{t("Class bookings")}</small><strong>{summary.confirmedBookings || 0}</strong></div></div>
    <div className="manager-report-grid"><section className="manager-panel"><div className="manager-panel-heading"><div><span>{t("Daily revenue")}</span><strong>{t("Revenue trend")}</strong></div><BarChart3 size={20} /></div><div className="manager-bars">{data?.revenueByDay?.map((item) => <div key={item.label}><span>{formatDate(item.label)}</span><i><b style={{ width: `${(Number(item.value) / maxRevenue) * 100}%` }} /></i><strong>{money(item.value)}</strong></div>)}{!data?.revenueByDay?.length && <EmptyState />}</div></section><section className="manager-panel"><div className="manager-panel-heading"><div><span>{t("Class performance")}</span><strong>{t("Bookings / total session capacity")}</strong></div><Users size={20} /></div><div className="manager-occupancy">{data?.classOccupancy?.map((item) => <div key={item.classId}><div><span>{t(item.label)}</span><strong>{item.value}/{item.capacity}</strong></div><i><b style={{ width: `${Math.min((Number(item.value) / Number(item.capacity || 1)) * 100, 100)}%` }} /></i></div>)}</div></section></div>
  </>;
}

function AuditView({ data, page }) {
  useLanguage();
  return <><ManagerPageHeader title={t(page.title)} description={t(page.description)} /><div className="manager-table-wrap"><table><thead><tr><th>{t("Time")}</th><th>{t("Actor")}</th><th>{t("Action")}</th><th>{t("Entity")}</th><th>{t("Details")}</th></tr></thead><tbody>{data?.map((log) => <tr key={log.auditId}><td>{dateTime(log.createdAt)}</td><td><strong>{log.actorEmail}</strong></td><td><span className="manager-action-tag">{log.action}</span></td><td>{log.entityType} #{log.entityId}</td><td>{log.details}</td></tr>)}</tbody></table>{!data?.length && <EmptyState message={t("No administrative activity recorded yet.")} />}</div></>;
}

function EditorModal({ config, dictionaries, onClose, onSaved }) {
  useLanguage();
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const item = config.item || {};
  const [form, setForm] = useState(() => initialForm(config.type, item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [touched, setTouched] = useState({});
  const dialogRef = useDialog(onClose, saving);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const titles = { user: 'account', subject: 'subject', room: 'room', class: 'class', schedule: 'schedule', package: 'membership package' };
  const isUserEditor = config.type === 'user';
  const isEditing = Boolean(config.item);
  const userErrors = isUserEditor ? validateUserForm(form, isEditing) : {};
  const userInvalid = isUserEditor && Object.keys(userErrors).length > 0;
  const blur = (key) => setTouched((current) => ({ ...current, [key]: true }));
  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); }, [avatarPreview]);
  const selectAvatar = (file) => {
    const validationError = validateAvatarFile(file);
    if (validationError) { setError(validationError); return; }
    setError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (userInvalid) { setTouched({ fullName: true, email: true, roleId: true, status: true, password: true }); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      ['roleId', 'capacity', 'subjectId', 'coachId', 'roomId', 'maxSlots', 'classId', 'durationDays', 'occurrences', 'intervalWeeks'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      ['price'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      if (config.type === 'user') {
        const userPayload = {
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone || '',
          password: payload.password,
          roleId: payload.roleId,
          status: payload.status,
          forcePasswordChange: Boolean(payload.forcePasswordChange),
        };
        if (!userPayload.password) delete userPayload.password;
        let userId = item.userId;
        if (item.userId) await managerService.updateUser(item.userId, userPayload);
        else userId = (await managerService.createUser(userPayload)).id;
        if (avatarFile) {
          try { await managerService.updateUserAvatar(userId, avatarFile); }
          catch (avatarError) {
            await onSaved(`Account saved, but the avatar was not uploaded: ${apiError(avatarError)}`);
            return;
          }
        }
        if (item.email?.toLowerCase() === userInfo?.email?.toLowerCase()
            && userPayload.email.trim().toLowerCase() !== userInfo.email.toLowerCase()) {
          logout(); navigate('/'); return;
        }
      }
      if (config.type === 'subject') await managerService.saveSubject(payload);
      if (config.type === 'room') await managerService.saveRoom(payload);
      if (config.type === 'class') await managerService.saveClass(payload);
      if (config.type === 'schedule') {
        if (payload.endTime <= payload.startTime) throw new Error('The end time must be after the start time.');
        if (form.repeat && !item.scheduleId) await managerService.createScheduleSeries(payload);
        else await managerService.saveSchedule(payload);
      }
      if (config.type === 'package') await managerService.savePackage(payload);
      await onSaved(config.type === 'schedule' && form.repeat && !item.scheduleId
        ? 'Created ' + form.occurrences + ' sessions. Select the appropriate date range to view the new schedule.'
        : 'Changes saved.');
    } catch (err) { setError(apiError(err, err.message || 'Unable to save changes.')); } finally { setSaving(false); }
  };

  return <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => !saving && e.target === e.currentTarget && onClose()}><section ref={dialogRef} className={`manager-modal ${isUserEditor ? 'manager-account-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="manager-editor-title" tabIndex={-1}><header><div><span>{t(isEditing ? t('Edit') : t('Create'))}</span><h3 id="manager-editor-title">{t(isUserEditor ? (isEditing ? t('Edit account') : t('Add new account')) : titles[config.type])}</h3></div><button type="button" disabled={saving} aria-label={t("Close")} onClick={onClose}><X size={20} /></button></header><form onSubmit={submit} noValidate={isUserEditor}>{error && <div className="manager-form-error" role="alert">{t(error)}</div>}<fieldset disabled={saving}><EditorFields type={config.type} form={form} set={set} data={dictionaries} editing={isEditing} avatarPreview={avatarPreview} onAvatarSelect={selectAvatar} errors={userErrors} touched={touched} onBlur={blur} focusPassword={config.focusPassword} /></fieldset><footer><button type="button" className="manager-secondary" disabled={saving} onClick={onClose}>{t("Cancel")}</button><button className="manager-primary" disabled={saving || userInvalid}>{t(saving ? t('Saving...') : isUserEditor && !isEditing ? t('Create Account') : t('Save Changes'))}</button></footer></form></section></div>;
}

function validateUserForm(form, editing) {
  const errors = {};
  if (!form.fullName?.trim()) errors.fullName = 'Full name is required.';
  if (!form.email?.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address.';
  if (!form.roleId) errors.roleId = 'Role is required.';
  if (!form.status) errors.status = 'Status is required.';
  if (!editing && !form.password) errors.password = 'Password is required.';
  else if (form.password && (form.password.length < 6 || form.password.length > 72)) errors.password = 'Password must be 6–72 characters.';
  return errors;
}

function EditorFields({ type, form, set, data, editing, avatarPreview, onAvatarSelect, errors = {}, touched = {}, onBlur = () => {}, focusPassword }) {
  useLanguage();
  if (type === 'user') {
    const avatarUser = { userId: form.userId, fullName: form.fullName, avatarPath: form.avatarPath };
    return <div className="manager-account-editor">
      <div className="manager-account-preview">
        <StaffAvatar user={avatarUser} source={avatarPreview} className="manager-profile-avatar" />
        <div><strong>{t(form.fullName?.trim() || 'New account')}</strong><small>{t("PNG or JPEG · max 2 MB")}</small></div>
        {editing && <label className="manager-avatar-upload"><Camera size={15} />{t(avatarPreview || form.avatarPath ? t('Change photo') : t('Upload photo'))}<input type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAvatarSelect(file); event.target.value = ''; }} /></label>}
      </div>
      <section className="manager-account-section">
        <div className="manager-form-grid">
          <Field label={t("Full name")} required error={touched.fullName && errors.fullName}><input aria-invalid={Boolean(touched.fullName && errors.fullName)} autoComplete="name" placeholder={t("Enter full name")} value={form.fullName || ''} onBlur={() => onBlur('fullName')} onChange={(e) => set('fullName', e.target.value)} /></Field>
          <Field label={t("Email")} required error={touched.email && errors.email}><input aria-invalid={Boolean(touched.email && errors.email)} type="email" autoComplete="email" placeholder={t("name@example.com")} value={form.email || ''} onBlur={() => onBlur('email')} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label={t("Phone")}><input type="tel" autoComplete="tel" placeholder={t("Phone number")} value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label={t("Role")} required error={touched.roleId && errors.roleId}><ManagerSelect aria-invalid={Boolean(touched.roleId && errors.roleId)} value={form.roleId || ''} onBlur={() => onBlur('roleId')} onChange={(e) => set('roleId', e.target.value)}><option value="">{t("Select a role")}</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleId}>{t(role.roleName)}</option>)}</ManagerSelect></Field>
          <Field label={t("Status")} required error={touched.status && errors.status}><ManagerSelect aria-invalid={Boolean(touched.status && errors.status)} value={form.status || 'ACTIVE'} onBlur={() => onBlur('status')} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">{t("Active")}</option><option value="INACTIVE">{t("Inactive")}</option><option value="PENDING">{t("Pending")}</option></ManagerSelect></Field>
          <Field label={t(editing ? 'New password' : 'Temporary password')} required={!editing} error={touched.password && errors.password}><PasswordInput value={form.password || ''} onChange={(e) => set('password', e.target.value)} onBlur={() => onBlur('password')} invalid={Boolean(touched.password && errors.password)} autoFocus={focusPassword} /><small className="manager-field-help">{t("6–72 characters")}</small></Field>
          <label className="manager-force-password wide"><input type="checkbox" checked={Boolean(form.forcePasswordChange)} onChange={(event) => set('forcePasswordChange', event.target.checked)} /><span>{t("Force password change on first login")}</span></label>
        </div>
      </section>
    </div>;
  }
  if (type === 'subject') return <div className="manager-form-grid one"><Field label={t("Subject name")}><input required value={form.subjectName || ''} onChange={(e) => set('subjectName', e.target.value)} /></Field><Field label={t("Description")}><textarea rows="4" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field></div>;
  if (type === 'room') return <div className="manager-form-grid"><Field label={t("Room name")}><input required value={form.roomName || ''} onChange={(e) => set('roomName', e.target.value)} /></Field><Field label={t("Capacity")}><input required min="1" type="number" value={form.capacity || ''} onChange={(e) => set('capacity', e.target.value)} /></Field></div>;
  if (type === 'class') return <div className="manager-form-grid"><Field label={t("Class name")} wide><input required value={form.className || ''} onChange={(e) => set('className', e.target.value)} /></Field><Field label={t("Subject")}><select required value={form.subjectId || ''} onChange={(e) => set('subjectId', e.target.value)}><option value="">{t("Select a subject")}</option>{data?.subjects?.map((x) => <option key={x.subjectId} value={x.subjectId}>{x.subjectName}</option>)}</select></Field><Field label={t("Coach")}><select required value={form.coachId || ''} onChange={(e) => set('coachId', e.target.value)}><option value="">{t("Select a coach")}</option>{data?.coaches?.map((x) => <option key={x.userId} value={x.userId}>{x.fullName}</option>)}</select></Field><Field label={t("Room")}><select required value={form.roomId || ''} onChange={(e) => set('roomId', e.target.value)}><option value="">{t("Select a room")}</option>{data?.rooms?.map((x) => <option key={x.roomId} value={x.roomId}>{x.roomName} ({x.capacity})</option>)}</select></Field><Field label={t("Maximum capacity")}><input required min="1" type="number" value={form.maxSlots || ''} onChange={(e) => set('maxSlots', e.target.value)} /></Field><Field label={t("Fee")}><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field><Field label={t("Status")}><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">{t("Active")}</option><option value="INACTIVE">{t("Inactive")}</option></select></Field></div>;
  if (type === 'schedule') return <div className="manager-form-grid"><Field label={t("Class")} wide><select required value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}><option value="">{t("Select a class")}</option>{data?.classes?.filter((x) => x.status === 'ACTIVE' || x.classId === Number(form.classId)).map((x) => <option key={x.classId} value={x.classId}>{x.className}</option>)}</select></Field><Field label={t("Start time")}><input required type="datetime-local" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)} /></Field><Field label={t("End time")}><input required type="datetime-local" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)} /></Field><Field label={t("Status")} wide><select value={form.status || 'SCHEDULED'} onChange={(e) => set('status', e.target.value)}><option value="SCHEDULED">{t("Scheduled")}</option>{editing && <><option value="COMPLETED">{t("Completed")}</option><option value="CANCELLED">{t("Cancelled")}</option></>}</select></Field>
    {!editing && <><Field label={t("Repeat weekly")} wide><input type="checkbox" checked={form.repeat} onChange={(e) => set('repeat', e.target.checked)} /></Field>{form.repeat && <><Field label={t("Total sessions (including the first)")}><input required type="number" min="2" max="52" value={form.occurrences} onChange={(e) => set('occurrences', e.target.value)} /></Field><Field label={t("Interval (weeks)")}><input required type="number" min="1" max="4" value={form.intervalWeeks} onChange={(e) => set('intervalWeeks', e.target.value)} /></Field><p className="wide manager-help">{t("If any session conflicts with an existing schedule, the entire series will be cancelled.")}</p></>}</>}
    {form.status === 'CANCELLED' && <p className="wide manager-help">{t("Cancelling a session will cancel its bookings and send notifications. Fees must be reconciled separately by reception; the system does not issue automatic refunds.")}</p>}
  </div>;
  return <div className="manager-form-grid"><Field label={t("Package name")} wide><input required value={form.packageName || ''} onChange={(e) => set('packageName', e.target.value)} /></Field><Field label={t("Package type")}><select value={form.packageType || 'GYM_ACCESS'} onChange={(e) => set('packageType', e.target.value)}><option value="GYM_ACCESS">{t("Gym access")}</option><option value="AI_ACCESS">{t("AI access")}</option><option value="COMBO">{t("Combo (Gym + AI)")}</option><option value="PREMIUM">{t("Premium")}</option></select></Field><Field label={t("Duration (days)")}><input required min="1" type="number" value={form.durationDays || ''} onChange={(e) => set('durationDays', e.target.value)} /></Field><Field label={t("Price")} wide><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field></div>;
}

function Field({ label, required, error, wide, children }) {
  useLanguage(); return <label className={`${wide ? 'wide ' : ''}${error ? 'is-invalid' : ''}`.trim()}><span>{t(label)}{required && <b aria-hidden="true"> *</b>}</span>{children}{error && <small className="manager-field-error">{t(error)}</small>}</label>; }

function useDialog(onClose, busy = false) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const element = ref.current;
    const keyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key !== 'Tab') return;
      const controls = [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) { event.preventDefault(); first.focus(); }
    };
    element?.addEventListener('keydown', keyDown);
    return () => element?.removeEventListener('keydown', keyDown);
  }, [onClose, busy]);
  return ref;
}

export default ManagerDashboard;
