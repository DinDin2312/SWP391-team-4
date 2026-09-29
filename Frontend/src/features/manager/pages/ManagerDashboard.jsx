import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, BookOpen, CalendarDays, ChevronRight,
  CircleDollarSign, ClipboardList, Dumbbell, LayoutDashboard, LogOut,
  Menu, Package, Pencil, Plus, RefreshCw, Search, ShieldCheck, Users, X,
} from 'lucide-react';
import { AuthContext } from '../../../context/AuthContext';
import RoleThemeToggle from '../../../components/RoleThemeToggle';
import { useRoleTheme } from '../../../hooks/useRoleTheme';
import managerService from '../services/managerService';
import { isoDate, initialForm, apiError, reportCsv } from '../managerUtils';
import './manager.css';

const today = new Date();
const initialFrom = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
const initialTo = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateTime = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
const statusLabel = { ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending', SCHEDULED: 'Scheduled', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'people', label: 'Staff & Permissions', icon: Users },
  { id: 'operations', label: 'Center Operations', icon: CalendarDays },
  { id: 'packages', label: 'Membership Packages', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'audit', label: 'System Audit Log', icon: ClipboardList },
];

function Status({ value }) {
  return <span className={`manager-status is-${String(value).toLowerCase()}`}>{statusLabel[value] || value}</span>;
}

function EmptyState({ message = 'No matching data available.' }) {
  return <div className="manager-empty"><ClipboardList size={28} /><span>{message}</span></div>;
}

function Loading() {
  return <div className="manager-loading"><RefreshCw size={20} /> Loading data...</div>;
}

function PageHeader({ eyebrow, title, actions }) {
  return <div className="manager-page-header"><div><span>{eyebrow}</span><h2>{title}</h2></div><div className="manager-header-actions">{actions}</div></div>;
}

function ManagerDashboard() {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useRoleTheme();
  const [active, setActive] = useState('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [operationTab, setOperationTab] = useState('classes');
  const [filters, setFilters] = useState({ keyword: '', role: 'ALL', status: 'ALL', from: initialFrom, to: initialTo });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const requestId = useRef(0);
  const [roster, setRoster] = useState(null);
  const [notice, setNotice] = useState('');
  const invalidateRequest = useCallback(() => { requestId.current++; }, []);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    setData(null);
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
      if (currentRequest === requestId.current) setError(apiError(err, err.message || 'Unable to load data.'));
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
    setActive(id);
    setData(null);
    setMobileNav(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSaved = async (message = 'Changes saved.') => { setModal(null); setNotice(message); await load(); };
  const applyFilters = () => setAppliedFilters({ ...filters });
  const initials = (userInfo?.fullName || 'Center Manager').split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const pageTitle = navItems.find((item) => item.id === active)?.label;

  return (
    <div className={`manager-app ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
      <aside className={`manager-sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="manager-brand"><span><Dumbbell size={22} /></span><div><strong>NEXUS</strong><small>CENTER CONTROL</small></div><button className="manager-mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button></div>
        <div className="manager-role"><ShieldCheck size={16} /><span>Center Manager</span></div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => selectPage(id)}><Icon size={18} /><span>{label}</span><ChevronRight size={15} /></button>)}
        </nav>
        <div className="manager-profile">
          <div className="manager-avatar">{initials}</div><div><strong>{userInfo?.fullName || 'Center Manager'}</strong><small>{userInfo?.email || 'admin@sport.com'}</small></div>
          <button onClick={handleLogout} title="Log out"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileNav && <button className="manager-overlay" onClick={() => setMobileNav(false)} aria-label="Close menu" />}

      <main className="manager-main">
        <header className="manager-topbar">
          <button className="manager-menu-button" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div><span>NEXUS Center</span><h1>{pageTitle}</h1></div>
          <RoleThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="manager-icon-button" onClick={load} title="Refresh" aria-label="Refresh data"><RefreshCw size={18} /></button>
        </header>

        <section className="manager-content">
          {notice && <div className="manager-notice" role="status">{notice}</div>}
          {error && <div className="manager-alert" role="alert"><span>{error}</span><button onClick={load}>Retry</button></div>}
          {loading ? <Loading /> : <ManagerView active={active} data={data} filters={filters} appliedFilters={appliedFilters} setFilters={setFilters} reload={applyFilters} openModal={setModal} openRoster={setRoster} operationTab={operationTab} setOperationTab={setOperationTab} />}
        </section>
      </main>
      {modal && <EditorModal config={modal} dictionaries={active === 'people' || active === 'operations' ? data : null} onClose={() => setModal(null)} onSaved={handleSaved} />}
      {roster && <RosterModal schedule={roster} onClose={() => setRoster(null)} />}
    </div>
  );
}

function ManagerView(props) {
  if (props.active === 'dashboard') return <DashboardView {...props} />;
  if (props.active === 'people') return <PeopleView {...props} />;
  if (props.active === 'operations') return <OperationsView {...props} />;
  if (props.active === 'packages') return <PackagesView {...props} />;
  if (props.active === 'reports') return <ReportsView {...props} />;
  return <AuditView {...props} />;
}

function DashboardView({ data }) {
  const stats = [
    ['Members', data?.totalMembers, Users, 'blue'], ['Active coaches', data?.activeCoaches, Dumbbell, 'green'],
    ['Active classes', data?.activeClasses, BookOpen, 'amber'], ['Active memberships', data?.activeMemberships, ShieldCheck, 'cyan'],
  ];
  return <>
    <PageHeader eyebrow="Today's snapshot" title="Operations Overview" />
    <div className="manager-stat-grid">{stats.map(([label, value, Icon, tone]) => <div className={`manager-stat tone-${tone}`} key={label}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value ?? 0}</strong></div></div>)}</div>
    <div className="manager-dashboard-grid">
      <section className="manager-panel manager-revenue"><div className="manager-panel-heading"><div><span>Revenue this month</span><strong>{money(data?.monthlyRevenue)}</strong></div><CircleDollarSign size={24} /></div><div className="manager-metric-row"><span>Sessions in the next 7 days</span><b>{data?.upcomingSchedules || 0} sessions</b></div></section>
      <section className="manager-panel"><div className="manager-panel-heading"><div><span>Recent activity</span><strong>Operations feed</strong></div><Activity size={21} /></div><div className="manager-timeline">{data?.recentActivity?.length ? data.recentActivity.map((item, index) => <div key={`${item.type}-${index}`}><i /><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{dateTime(item.occurredAt)}</time></div>) : <EmptyState />}</div></section>
    </div>
  </>;
}

function PeopleView({ data, filters, setFilters, reload, openModal }) {
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const applyFilters = (event) => { event.preventDefault(); reload(); };
  const toggle = async (user) => {
    setActionError(''); setPendingId(user.userId);
    try { await managerService.updateUserStatus(user.userId, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  return <>
    <PageHeader eyebrow="Center accounts" title="Staff & Permissions" actions={<button className="manager-primary" onClick={() => openModal({ type: 'user' })}><Plus size={17} /> Add Account</button>} />
    {actionError && <div className="manager-alert" role="alert">{actionError}</div>}
    <form className="manager-filterbar" onSubmit={applyFilters}>
      <label className="manager-search"><Search size={17} /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Name, email, or phone number" /></label>
      <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}><option value="ALL">All roles</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleName}>{role.roleName}</option>)}</select>
      <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></select>
      <button className="manager-secondary" type="submit">Filter</button>
    </form>
    <div className="manager-table-wrap"><table><thead><tr><th>Member</th><th>Contact</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{data?.users?.map((user) => <tr key={user.userId}><td><div className="manager-person"><span>{user.fullName?.[0]}</span><div><strong>{user.fullName}</strong><small>UID-{String(user.userId).padStart(4, '0')}</small></div></div></td><td><strong>{user.email}</strong><small className="manager-cell-sub">{user.phone || 'No phone number'}</small></td><td>{user.roleName}</td><td><Status value={user.status} /></td><td><div className="manager-row-actions"><button title="Edit" onClick={() => openModal({ type: 'user', item: user })}><Pencil size={16} /></button><button className="manager-text-action" disabled={pendingId !== null} onClick={() => toggle(user)}>{user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table>{!data?.users?.length && <EmptyState />}</div>
  </>;
}

function OperationsView({ data, filters, setFilters, reload, openModal, openRoster, operationTab, setOperationTab }) {
  const tabs = [['classes', 'Classes'], ['schedules', 'Schedules'], ['subjects', 'Subjects'], ['rooms', 'Rooms']];
  const typeMap = { classes: 'class', schedules: 'schedule', subjects: 'subject', rooms: 'room' };
  return <>
    <PageHeader eyebrow="Resource coordination" title="Center Operations" actions={<button className="manager-primary" onClick={() => openModal({ type: typeMap[operationTab] })}><Plus size={17} /> Create New</button>} />
    <div className="manager-tabs">{tabs.map(([id, label]) => <button key={id} className={operationTab === id ? 'active' : ''} onClick={() => setOperationTab(id)}>{label}<span>{data?.[id]?.length || 0}</span></button>)}</div>
    {operationTab === 'schedules' && <div className="manager-date-filter"><label>From<input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label><label>To<input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label><button className="manager-secondary" onClick={reload}>Apply</button></div>}
    <OperationsTable type={operationTab} rows={data?.[operationTab] || []} edit={(item) => openModal({ type: typeMap[operationTab], item })} openRoster={openRoster} />
  </>;
}

function OperationsTable({ type, rows, edit, openRoster }) {
  const heads = {
    classes: ['Class', 'Subject', 'Assignment', 'Maximum bookings/session', 'Fee', 'Status'],
    schedules: ['Time', 'Class', 'Coach / Room', 'Booked', 'Status'],
    subjects: ['Subject', 'Description', 'Classes'], rooms: ['Room', 'Capacity', 'Classes'],
  }[type];
  return <div className="manager-table-wrap"><table><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}<th /></tr></thead><tbody>{rows.map((row) => {
    if (type === 'classes') return <tr key={row.classId}><td><strong>{row.className}</strong><small className="manager-cell-sub">CLS-{row.classId}</small></td><td>{row.subjectName}</td><td><strong>{row.coachName}</strong><small className="manager-cell-sub">{row.roomName}</small></td><td>{row.enrolled}/{row.maxSlots}</td><td>{money(row.price)}</td><td><Status value={row.status} /></td><td><button className="manager-edit" aria-label="Edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    if (type === 'schedules') return <tr key={row.scheduleId}><td><strong>{dateTime(row.startTime)}</strong><small className="manager-cell-sub">to {dateTime(row.endTime)}</small></td><td>{row.className}</td><td><strong>{row.coachName}</strong><small className="manager-cell-sub">{row.roomName}</small></td><td>{row.booked}/{row.maxSlots}</td><td><Status value={row.status} /></td><td><button className="manager-secondary" onClick={() => openRoster(row)}>Roster</button><button disabled={row.status !== 'SCHEDULED'} className="manager-edit" aria-label="Edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    if (type === 'subjects') return <tr key={row.subjectId}><td><strong>{row.subjectName}</strong></td><td>{row.description || '-'}</td><td>{row.classCount}</td><td><button className="manager-edit" aria-label="Edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    return <tr key={row.roomId}><td><strong>{row.roomName}</strong></td><td>{row.capacity} people</td><td>{row.classCount}</td><td><button className="manager-edit" aria-label="Edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
  })}</tbody></table>{!rows.length && <EmptyState />}</div>;
}

function PackagesView({ data, openModal }) {
  return <>
    <PageHeader eyebrow="Business catalog" title="Membership Packages & Fees" actions={<button className="manager-primary" onClick={() => openModal({ type: 'package' })}><Plus size={17} /> Add Package</button>} />
    <div className="manager-package-grid">{data?.map((item) => <article key={item.packageId}><div className="manager-package-top"><span><Package size={19} /></span><button onClick={() => openModal({ type: 'package', item })}><Pencil size={16} /></button></div><small>{item.packageType?.replace('_', ' ')}</small><h3>{item.packageName}</h3><strong>{money(item.price)}</strong><div><span>{item.durationDays} days</span><span>{item.activeSubscribers || 0} active</span></div></article>)}</div>{!data?.length && <EmptyState />}
  </>;
}

function ReportsView({ data, filters, appliedFilters, setFilters, reload }) {
  const summary = data?.summary || {};
  const exportReport = () => {
    const url = URL.createObjectURL(new Blob([reportCsv(data)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url;
    link.download = 'report-' + appliedFilters.from + '-' + appliedFilters.to + '.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const maxRevenue = Math.max(...(data?.revenueByDay || []).map((item) => Number(item.value)), 1);
  return <>
    <PageHeader eyebrow="Business data" title="Reports by Date Range" actions={<div className="manager-report-range"><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><span>to</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /><button className="manager-secondary" onClick={reload}>View</button><button className="manager-secondary" disabled={!data} onClick={exportReport}>Export CSV</button></div>} />
    <div className="manager-report-stats"><div><small>Revenue</small><strong>{money(summary.revenue)}</strong></div><div><small>Successful transactions</small><strong>{summary.successfulPayments || 0}</strong></div><div><small>Pending invoices</small><strong>{summary.pendingInvoices || 0}</strong></div><div><small>Class bookings</small><strong>{summary.confirmedBookings || 0}</strong></div></div>
    <div className="manager-report-grid"><section className="manager-panel"><div className="manager-panel-heading"><div><span>Daily revenue</span><strong>Revenue trend</strong></div><BarChart3 size={20} /></div><div className="manager-bars">{data?.revenueByDay?.map((item) => <div key={item.label}><span>{new Date(item.label).toLocaleDateString('en-US')}</span><i><b style={{ width: `${(Number(item.value) / maxRevenue) * 100}%` }} /></i><strong>{money(item.value)}</strong></div>)}{!data?.revenueByDay?.length && <EmptyState />}</div></section><section className="manager-panel"><div className="manager-panel-heading"><div><span>Class performance</span><strong>Bookings / total session capacity</strong></div><Users size={20} /></div><div className="manager-occupancy">{data?.classOccupancy?.map((item) => <div key={item.classId}><div><span>{item.label}</span><strong>{item.value}/{item.capacity}</strong></div><i><b style={{ width: `${Math.min((Number(item.value) / Number(item.capacity || 1)) * 100, 100)}%` }} /></i></div>)}</div></section></div>
  </>;
}

function AuditView({ data }) {
  return <><PageHeader eyebrow="Change tracking" title="System Audit Log" /><div className="manager-table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{data?.map((log) => <tr key={log.auditId}><td>{dateTime(log.createdAt)}</td><td><strong>{log.actorEmail}</strong></td><td><span className="manager-action-tag">{log.action}</span></td><td>{log.entityType} #{log.entityId}</td><td>{log.details}</td></tr>)}</tbody></table>{!data?.length && <EmptyState message="No administrative activity recorded yet." />}</div></>;
}

function EditorModal({ config, dictionaries, onClose, onSaved }) {
  const { userInfo, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const item = config.item || {};
  const [form, setForm] = useState(() => initialForm(config.type, item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useDialog(onClose, saving);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const titles = { user: 'account', subject: 'subject', room: 'room', class: 'class', schedule: 'schedule', package: 'membership package' };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      ['roleId', 'capacity', 'subjectId', 'coachId', 'roomId', 'maxSlots', 'classId', 'durationDays', 'occurrences', 'intervalWeeks'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      ['price'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      if (config.type === 'user') {
        if (!payload.password) delete payload.password;
        if (item.userId) await managerService.updateUser(item.userId, payload);
        else await managerService.createUser(payload);
        if (item.email?.toLowerCase() === userInfo?.email?.toLowerCase()
            && payload.email.trim().toLowerCase() !== userInfo.email.toLowerCase()) {
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

  return <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => !saving && e.target === e.currentTarget && onClose()}><section ref={dialogRef} className="manager-modal" role="dialog" aria-modal="true" aria-labelledby="manager-editor-title" tabIndex={-1}><header><div><span>{item[`${config.type}Id`] || item.userId ? 'Edit' : 'Create'}</span><h3 id="manager-editor-title">{titles[config.type]}</h3></div><button disabled={saving} aria-label="Close" onClick={onClose}><X size={20} /></button></header><form onSubmit={submit}>{error && <div className="manager-form-error" role="alert">{error}</div>}<fieldset disabled={saving}><EditorFields type={config.type} form={form} set={set} data={dictionaries} editing={Boolean(config.item)} /></fieldset><footer><button type="button" className="manager-secondary" disabled={saving} onClick={onClose}>Cancel</button><button className="manager-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></footer></form></section></div>;
}

function EditorFields({ type, form, set, data, editing }) {
  if (type === 'user') return <div className="manager-form-grid"><Field label="Full name"><input required value={form.fullName || ''} onChange={(e) => set('fullName', e.target.value)} /></Field><Field label="Email"><input required type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field><Field label="Phone number"><input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field><Field label={editing ? 'New password (optional)' : 'Password'}><input required={!editing} minLength={6} maxLength={72} autoComplete="new-password" type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} /></Field><Field label="Role"><select required value={form.roleId || ''} onChange={(e) => set('roleId', e.target.value)}><option value="">Select a role</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}</select></Field><Field label="Status"><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></select></Field></div>;
  if (type === 'subject') return <div className="manager-form-grid one"><Field label="Subject name"><input required value={form.subjectName || ''} onChange={(e) => set('subjectName', e.target.value)} /></Field><Field label="Description"><textarea rows="4" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field></div>;
  if (type === 'room') return <div className="manager-form-grid"><Field label="Room name"><input required value={form.roomName || ''} onChange={(e) => set('roomName', e.target.value)} /></Field><Field label="Capacity"><input required min="1" type="number" value={form.capacity || ''} onChange={(e) => set('capacity', e.target.value)} /></Field></div>;
  if (type === 'class') return <div className="manager-form-grid"><Field label="Class name" wide><input required value={form.className || ''} onChange={(e) => set('className', e.target.value)} /></Field><Field label="Subject"><select required value={form.subjectId || ''} onChange={(e) => set('subjectId', e.target.value)}><option value="">Select a subject</option>{data?.subjects?.map((x) => <option key={x.subjectId} value={x.subjectId}>{x.subjectName}</option>)}</select></Field><Field label="Coach"><select required value={form.coachId || ''} onChange={(e) => set('coachId', e.target.value)}><option value="">Select a coach</option>{data?.coaches?.map((x) => <option key={x.userId} value={x.userId}>{x.fullName}</option>)}</select></Field><Field label="Room"><select required value={form.roomId || ''} onChange={(e) => set('roomId', e.target.value)}><option value="">Select a room</option>{data?.rooms?.map((x) => <option key={x.roomId} value={x.roomId}>{x.roomName} ({x.capacity})</option>)}</select></Field><Field label="Maximum capacity"><input required min="1" type="number" value={form.maxSlots || ''} onChange={(e) => set('maxSlots', e.target.value)} /></Field><Field label="Fee"><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field><Field label="Status"><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field></div>;
  if (type === 'schedule') return <div className="manager-form-grid"><Field label="Class" wide><select required value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}><option value="">Select a class</option>{data?.classes?.filter((x) => x.status === 'ACTIVE' || x.classId === Number(form.classId)).map((x) => <option key={x.classId} value={x.classId}>{x.className}</option>)}</select></Field><Field label="Start time"><input required type="datetime-local" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)} /></Field><Field label="End time"><input required type="datetime-local" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)} /></Field><Field label="Status" wide><select value={form.status || 'SCHEDULED'} onChange={(e) => set('status', e.target.value)}><option value="SCHEDULED">Scheduled</option>{editing && <><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></>}</select></Field>
    {!editing && <><Field label="Repeat weekly" wide><input type="checkbox" checked={form.repeat} onChange={(e) => set('repeat', e.target.checked)} /></Field>{form.repeat && <><Field label="Total sessions (including the first)"><input required type="number" min="2" max="52" value={form.occurrences} onChange={(e) => set('occurrences', e.target.value)} /></Field><Field label="Interval (weeks)"><input required type="number" min="1" max="4" value={form.intervalWeeks} onChange={(e) => set('intervalWeeks', e.target.value)} /></Field><p className="wide manager-help">If any session conflicts with an existing schedule, the entire series will be cancelled.</p></>}</>}
    {form.status === 'CANCELLED' && <p className="wide manager-help">Cancelling a session will cancel its bookings and send notifications. Fees must be reconciled separately by reception; the system does not issue automatic refunds.</p>}
  </div>;
  return <div className="manager-form-grid"><Field label="Package name" wide><input required value={form.packageName || ''} onChange={(e) => set('packageName', e.target.value)} /></Field><Field label="Package type"><select value={form.packageType || 'GYM_ACCESS'} onChange={(e) => set('packageType', e.target.value)}><option value="GYM_ACCESS">Gym access</option><option value="AI_ACCESS">AI access</option><option value="PREMIUM">Premium</option></select></Field><Field label="Duration (days)"><input required min="1" type="number" value={form.durationDays || ''} onChange={(e) => set('durationDays', e.target.value)} /></Field><Field label="Price" wide><input required min="0" step="0.01" max="99999999.99" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field></div>;
}

function Field({ label, wide, children }) { return <label className={wide ? 'wide' : ''}><span>{label}</span>{children}</label>; }

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

function RosterModal({ schedule, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const dialogRef = useDialog(onClose);
  useEffect(() => {
    let current = true;
    managerService.scheduleBookings(schedule.scheduleId)
      .then((result) => { if (current) setRows(result); })
      .catch((err) => { if (current) setError(apiError(err, 'Unable to load the roster.')); });
    return () => { current = false; };
  }, [schedule.scheduleId]);
  const attendance = { PRESENT: 'Present', ABSENT: 'Absent', NOT_YET: 'Not marked' };
  return <div className="manager-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section ref={dialogRef} className="manager-modal manager-roster" role="dialog" aria-modal="true" aria-labelledby="manager-roster-title" tabIndex={-1}>
      <header><div><h3 id="manager-roster-title">Roster — {schedule.className}</h3><span>{dateTime(schedule.startTime)}</span></div><button onClick={onClose} aria-label="Close"><X size={20} /></button></header>
      {error ? <div className="manager-alert" role="alert">{error}</div> : !rows ? <Loading /> : !rows.length ? <EmptyState message="No students have registered for this session." /> :
        <div className="manager-table-wrap"><table><thead><tr><th>Student</th><th>Contact</th><th>Booking</th><th>Attendance</th></tr></thead><tbody>{rows.map((row) => <tr key={row.bookingId}><td>{row.fullName}</td><td>{row.email}<small className="manager-cell-sub">{row.phone || 'No phone number'}</small></td><td>{row.status === 'CONFIRMED' ? 'Confirmed' : row.status === 'PENDING' ? 'Pending' : 'Cancelled'}</td><td>{attendance[row.attendanceStatus] || 'Not marked'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}

export default ManagerDashboard;
