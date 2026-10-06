import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, BookOpen, CalendarDays, Camera,
  CircleDollarSign, ClipboardList, Dumbbell, LayoutDashboard, LogOut,
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
  return <div className="manager-empty"><ClipboardList size={28} /><span>{message}</span></div>;
}

function Loading() {
  return <div className="manager-loading"><RefreshCw size={20} /> Loading data...</div>;
}

function ManagerDashboard() {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);

  const [filters, setFilters] = useState({ keyword: '', role: 'ALL', status: 'ALL', from: initialFrom, to: initialTo });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const requestId = useRef(0);

  const [notice, setNotice] = useState('');
  const invalidateRequest = useCallback(() => { requestId.current++; }, []);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    const publish = (result) => { if (currentRequest === requestId.current) setData(result); };
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
        const [subjects, rooms, classes, schedules, coaches] = await Promise.all([
          managerService.subjects(), managerService.rooms(), managerService.classes(),
          managerService.schedules(appliedFilters.from, appliedFilters.to), managerService.users({ role: 'Coach', status: 'ACTIVE' }),
        ]);
        publish({ subjects, rooms, classes, schedules, coaches });
      }
      if (active === 'packages') publish(await managerService.packages());
      if (active === 'reports') publish(await managerService.reports(appliedFilters.from, appliedFilters.to));
      if (active === 'audit') publish(await managerService.auditLogs());
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(apiError(err, err.message || 'Unable to load data.'));
        if (active === 'operations') setData(null);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [active, appliedFilters]);

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
    setActive(id);
    setData(null);
    setMobileNav(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSaved = async (message = 'Changes saved.') => { setModal(null); setNotice(message); await load(); };
  const applyFilters = (nextFilters = filters) => setAppliedFilters({ ...nextFilters });
  const initials = (userInfo?.fullName || 'Center Manager').split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const currentPage = adminPages.find((item) => item.id === active) || adminPages[0];
  const initialLoading = loading && data === null;

  return (
    <div className={`manager-app ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      <aside id="manager-sidebar" className={`manager-sidebar ${mobileNav ? 'is-open' : ''}`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
        onFocus={() => setSidebarCollapsed(false)}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) setSidebarCollapsed(true); }}>
        <div className="manager-brand"><span><Dumbbell size={22} /></span><div><strong>NEXUS</strong><small>CENTER CONTROL</small></div><button className="manager-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button></div>
        <div className="manager-role"><ShieldCheck size={16} /><span>Center Manager</span></div>
        <nav>
          {adminPages.map(({ id, title, icon: Icon }) => <button key={id} title={title} aria-label={title} aria-current={active === id ? 'page' : undefined} className={active === id ? 'active' : ''} onClick={() => selectPage(id)}><Icon size={18} /><span>{title}</span></button>)}
        </nav>
        <div className="manager-profile">
          <div className="manager-avatar">{initials}</div><div><strong>{userInfo?.fullName || 'Center Manager'}</strong><small>{userInfo?.email || 'admin@sport.com'}</small></div>
          <button onClick={handleLogout} title="Log out" aria-label="Log out"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileNav && <button className="manager-overlay" onClick={() => setMobileNav(false)} aria-label="Close menu" />}

      <main className="manager-main">
        <header className="manager-topbar">
          <button type="button" className="manager-sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-controls="manager-sidebar" aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Menu size={20} /></button>
          <button className="manager-menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20} /></button>
          <nav className="manager-breadcrumb" aria-label="Breadcrumb"><span>Nexus Center</span><i aria-hidden="true">/</i><strong>{currentPage.title}</strong></nav>
          <button className={`manager-icon-button ${loading ? 'is-refreshing' : ''}`} onClick={load} title="Refresh" aria-label="Refresh data" aria-busy={loading} disabled={initialLoading}><RefreshCw size={18} /></button>
        </header>

        <section className="manager-content">
          {error && <div className="manager-alert" role="alert"><span>{error}</span><button onClick={load}>Retry</button></div>}
          {initialLoading ? (active === 'people' ? <StaffSkeleton /> : active === 'operations' ? <OperationsSkeleton /> : <Loading />) : <ManagerView page={currentPage} active={active} data={data} filters={filters} appliedFilters={appliedFilters} setFilters={setFilters} reload={applyFilters} selectPage={selectPage} currentUser={userInfo} notify={setNotice} openModal={setModal} refresh={load} loading={loading} loadError={error} />}
        </section>
      </main>
      <ManagerToast message={notice} onClose={() => setNotice('')} />
      {modal && <EditorModal config={modal} dictionaries={active === 'people' || active === 'operations' ? data : null} onClose={() => setModal(null)} onSaved={handleSaved} />}

    </div>
  );
}

function ManagerView(props) {
  if (props.active === 'dashboard') return <DashboardView {...props} />;
  if (props.active === 'people') return <StaffPage {...props} />;
  if (props.active === 'operations') return <OperationsPage {...props} />;
  if (props.active === 'packages') return <PackagesView {...props} />;
  if (props.active === 'reports') return <ReportsView {...props} />;
  return <AuditView {...props} />;
}

function DashboardView({ data, page }) {
  const stats = [
    ['Members', data?.totalMembers, Users, 'blue'], ['Active coaches', data?.activeCoaches, Dumbbell, 'green'],
    ['Active classes', data?.activeClasses, BookOpen, 'amber'], ['Active memberships', data?.activeMemberships, ShieldCheck, 'cyan'],
  ];
  return <>
    <ManagerPageHeader title={page.title} description={page.description} />
    <div className="manager-stat-grid">{stats.map(([label, value, Icon, tone]) => <div className={`manager-stat tone-${tone}`} key={label}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value ?? 0}</strong></div></div>)}</div>
    <div className="manager-dashboard-grid">
      <section className="manager-panel manager-revenue"><div className="manager-panel-heading"><div><span>Revenue this month</span><strong>{money(data?.monthlyRevenue)}</strong></div><CircleDollarSign size={24} /></div><div className="manager-metric-row"><span>Sessions in the next 7 days</span><b>{data?.upcomingSchedules || 0} sessions</b></div></section>
      <section className="manager-panel"><div className="manager-panel-heading"><div><span>Recent activity</span><strong>Operations feed</strong></div><Activity size={21} /></div><div className="manager-timeline">{data?.recentActivity?.length ? data.recentActivity.map((item, index) => <div key={`${item.type}-${index}`}><i /><div><strong>{item.title}</strong><span>{item.type === 'PAYMENT' ? item.detail.replace(/^([\d,]+) VND/, (_, amount) => money(amount.replaceAll(',', ''))) : item.detail}</span></div><time>{dateTime(item.occurredAt)}</time></div>) : <EmptyState />}</div></section>
    </div>
  </>;
}

function PackagesView({ data, openModal, page }) {
  return <>
    <ManagerPageHeader title={page.title} description={page.description} actions={<button className="manager-primary" onClick={() => openModal({ type: 'package' })}><Plus size={17} /> Add Package</button>} />
    <div className="manager-package-grid">{data?.map((item) => <article key={item.packageId}><div className="manager-package-top"><span><Package size={19} /></span><button onClick={() => openModal({ type: 'package', item })}><Pencil size={16} /></button></div><small>{item.packageType?.replace('_', ' ')}</small><h3>{item.packageName}</h3><strong>{money(item.price)}</strong><div><span>{item.durationDays} days</span><span>{item.activeSubscribers || 0} active</span></div></article>)}</div>{!data?.length && <EmptyState />}
  </>;
}

function ReportsView({ data, filters, appliedFilters, setFilters, reload, page }) {
  const summary = data?.summary || {};
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([reportCsv(data)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url;
    link.download = 'report-' + appliedFilters.from + '-' + appliedFilters.to + '.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const maxRevenue = Math.max(...(data?.revenueByDay || []).map((item) => Number(item.value)), 1);
  return <>
    <ManagerPageHeader title={page.title} description={page.description} actions={<div className="manager-report-range"><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><span>to</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /><button className="manager-secondary" onClick={reload}>View</button><button className="manager-secondary" disabled={!data} onClick={exportReport}>Export CSV</button></div>} />
    <div className="manager-report-stats"><div><small>Revenue</small><strong>{money(summary.revenue)}</strong></div><div><small>Successful transactions</small><strong>{summary.successfulPayments || 0}</strong></div><div><small>Pending invoices</small><strong>{summary.pendingInvoices || 0}</strong></div><div><small>Class bookings</small><strong>{summary.confirmedBookings || 0}</strong></div></div>
    <div className="manager-report-grid"><section className="manager-panel"><div className="manager-panel-heading"><div><span>Daily revenue</span><strong>Revenue trend</strong></div><BarChart3 size={20} /></div><div className="manager-bars">{data?.revenueByDay?.map((item) => <div key={item.label}><span>{formatDate(item.label)}</span><i><b style={{ width: `${(Number(item.value) / maxRevenue) * 100}%` }} /></i><strong>{money(item.value)}</strong></div>)}{!data?.revenueByDay?.length && <EmptyState />}</div></section><section className="manager-panel"><div className="manager-panel-heading"><div><span>Class performance</span><strong>Bookings / total session capacity</strong></div><Users size={20} /></div><div className="manager-occupancy">{data?.classOccupancy?.map((item) => <div key={item.classId}><div><span>{item.label}</span><strong>{item.value}/{item.capacity}</strong></div><i><b style={{ width: `${Math.min((Number(item.value) / Number(item.capacity || 1)) * 100, 100)}%` }} /></i></div>)}</div></section></div>
  </>;
}

function AuditView({ data, page }) {
  return <><ManagerPageHeader title={page.title} description={page.description} /><div className="manager-table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{data?.map((log) => <tr key={log.auditId}><td>{dateTime(log.createdAt)}</td><td><strong>{log.actorEmail}</strong></td><td><span className="manager-action-tag">{log.action}</span></td><td>{log.entityType} #{log.entityId}</td><td>{log.details}</td></tr>)}</tbody></table>{!data?.length && <EmptyState message="No administrative activity recorded yet." />}</div></>;
}

function EditorModal({ config, dictionaries, onClose, onSaved }) {
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

  return <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => !saving && e.target === e.currentTarget && onClose()}><section ref={dialogRef} className={`manager-modal ${isUserEditor ? 'manager-account-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="manager-editor-title" tabIndex={-1}><header><div><span>{isEditing ? 'Edit' : 'Create'}</span><h3 id="manager-editor-title">{isUserEditor ? (isEditing ? 'Edit account' : 'Add new account') : titles[config.type]}</h3></div><button type="button" disabled={saving} aria-label="Close" onClick={onClose}><X size={20} /></button></header><form onSubmit={submit} noValidate={isUserEditor}>{error && <div className="manager-form-error" role="alert">{error}</div>}<fieldset disabled={saving}><EditorFields type={config.type} form={form} set={set} data={dictionaries} editing={isEditing} avatarPreview={avatarPreview} onAvatarSelect={selectAvatar} errors={userErrors} touched={touched} onBlur={blur} focusPassword={config.focusPassword} /></fieldset><footer><button type="button" className="manager-secondary" disabled={saving} onClick={onClose}>Cancel</button><button className="manager-primary" disabled={saving || userInvalid}>{saving ? 'Saving...' : isUserEditor && !isEditing ? 'Create Account' : 'Save Changes'}</button></footer></form></section></div>;
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
  if (type === 'user') {
    const avatarUser = { userId: form.userId, fullName: form.fullName, avatarPath: form.avatarPath };
    return <div className="manager-account-editor">
      <div className="manager-account-preview">
        <StaffAvatar user={avatarUser} source={avatarPreview} className="manager-profile-avatar" />
        <div><strong>{form.fullName?.trim() || 'New account'}</strong><small>PNG or JPEG · max 2 MB</small></div>
        {editing && <label className="manager-avatar-upload"><Camera size={15} />{avatarPreview || form.avatarPath ? 'Change photo' : 'Upload photo'}<input type="file" accept="image/png,image/jpeg" onChange={(event) => { const file = event.target.files?.[0]; if (file) onAvatarSelect(file); event.target.value = ''; }} /></label>}
      </div>
      <section className="manager-account-section">
        <div className="manager-form-grid">
          <Field label="Full name" required error={touched.fullName && errors.fullName}><input aria-invalid={Boolean(touched.fullName && errors.fullName)} autoComplete="name" placeholder="Enter full name" value={form.fullName || ''} onBlur={() => onBlur('fullName')} onChange={(e) => set('fullName', e.target.value)} /></Field>
          <Field label="Email" required error={touched.email && errors.email}><input aria-invalid={Boolean(touched.email && errors.email)} type="email" autoComplete="email" placeholder="name@example.com" value={form.email || ''} onBlur={() => onBlur('email')} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="Phone"><input type="tel" autoComplete="tel" placeholder="Phone number" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Role" required error={touched.roleId && errors.roleId}><ManagerSelect aria-invalid={Boolean(touched.roleId && errors.roleId)} value={form.roleId || ''} onBlur={() => onBlur('roleId')} onChange={(e) => set('roleId', e.target.value)}><option value="">Select a role</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}</ManagerSelect></Field>
          <Field label="Status" required error={touched.status && errors.status}><ManagerSelect aria-invalid={Boolean(touched.status && errors.status)} value={form.status || 'ACTIVE'} onBlur={() => onBlur('status')} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></ManagerSelect></Field>
          <Field label={editing ? 'New password' : 'Temporary password'} required={!editing} error={touched.password && errors.password}><PasswordInput value={form.password || ''} onChange={(e) => set('password', e.target.value)} onBlur={() => onBlur('password')} invalid={Boolean(touched.password && errors.password)} autoFocus={focusPassword} /><small className="manager-field-help">6–72 characters</small></Field>
          <label className="manager-force-password wide"><input type="checkbox" checked={Boolean(form.forcePasswordChange)} onChange={(event) => set('forcePasswordChange', event.target.checked)} /><span>Force password change on first login</span></label>
        </div>
      </section>
    </div>;
  }
  if (type === 'subject') return <div className="manager-form-grid one"><Field label="Subject name"><input required value={form.subjectName || ''} onChange={(e) => set('subjectName', e.target.value)} /></Field><Field label="Description"><textarea rows="4" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field></div>;
  if (type === 'room') return <div className="manager-form-grid"><Field label="Room name"><input required value={form.roomName || ''} onChange={(e) => set('roomName', e.target.value)} /></Field><Field label="Capacity"><input required min="1" type="number" value={form.capacity || ''} onChange={(e) => set('capacity', e.target.value)} /></Field></div>;
  if (type === 'class') return <div className="manager-form-grid"><Field label="Class name" wide><input required value={form.className || ''} onChange={(e) => set('className', e.target.value)} /></Field><Field label="Subject"><select required value={form.subjectId || ''} onChange={(e) => set('subjectId', e.target.value)}><option value="">Select a subject</option>{data?.subjects?.map((x) => <option key={x.subjectId} value={x.subjectId}>{x.subjectName}</option>)}</select></Field><Field label="Coach"><select required value={form.coachId || ''} onChange={(e) => set('coachId', e.target.value)}><option value="">Select a coach</option>{data?.coaches?.map((x) => <option key={x.userId} value={x.userId}>{x.fullName}</option>)}</select></Field><Field label="Room"><select required value={form.roomId || ''} onChange={(e) => set('roomId', e.target.value)}><option value="">Select a room</option>{data?.rooms?.map((x) => <option key={x.roomId} value={x.roomId}>{x.roomName} ({x.capacity})</option>)}</select></Field><Field label="Maximum capacity"><input required min="1" type="number" value={form.maxSlots || ''} onChange={(e) => set('maxSlots', e.target.value)} /></Field><Field label="Fee"><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field><Field label="Status"><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field></div>;
  if (type === 'schedule') return <div className="manager-form-grid"><Field label="Class" wide><select required value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}><option value="">Select a class</option>{data?.classes?.filter((x) => x.status === 'ACTIVE' || x.classId === Number(form.classId)).map((x) => <option key={x.classId} value={x.classId}>{x.className}</option>)}</select></Field><Field label="Start time"><input required type="datetime-local" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)} /></Field><Field label="End time"><input required type="datetime-local" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)} /></Field><Field label="Status" wide><select value={form.status || 'SCHEDULED'} onChange={(e) => set('status', e.target.value)}><option value="SCHEDULED">Scheduled</option>{editing && <><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></>}</select></Field>
    {!editing && <><Field label="Repeat weekly" wide><input type="checkbox" checked={form.repeat} onChange={(e) => set('repeat', e.target.checked)} /></Field>{form.repeat && <><Field label="Total sessions (including the first)"><input required type="number" min="2" max="52" value={form.occurrences} onChange={(e) => set('occurrences', e.target.value)} /></Field><Field label="Interval (weeks)"><input required type="number" min="1" max="4" value={form.intervalWeeks} onChange={(e) => set('intervalWeeks', e.target.value)} /></Field><p className="wide manager-help">If any session conflicts with an existing schedule, the entire series will be cancelled.</p></>}</>}
    {form.status === 'CANCELLED' && <p className="wide manager-help">Cancelling a session will cancel its bookings and send notifications. Fees must be reconciled separately by reception; the system does not issue automatic refunds.</p>}
  </div>;
  return <div className="manager-form-grid"><Field label="Package name" wide><input required value={form.packageName || ''} onChange={(e) => set('packageName', e.target.value)} /></Field><Field label="Package type"><select value={form.packageType || 'GYM_ACCESS'} onChange={(e) => set('packageType', e.target.value)}><option value="GYM_ACCESS">Gym access</option><option value="AI_ACCESS">AI access</option><option value="COMBO">Combo (Gym + AI)</option><option value="PREMIUM">Premium</option></select></Field><Field label="Duration (days)"><input required min="1" type="number" value={form.durationDays || ''} onChange={(e) => set('durationDays', e.target.value)} /></Field><Field label="Price" wide><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field></div>;
}

function Field({ label, required, error, wide, children }) { return <label className={`${wide ? 'wide ' : ''}${error ? 'is-invalid' : ''}`.trim()}><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}{error && <small className="manager-field-error">{error}</small>}</label>; }

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
