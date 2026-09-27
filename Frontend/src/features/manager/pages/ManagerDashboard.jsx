import { useCallback, useContext, useEffect, useState } from 'react';
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
import './manager.css';

const today = new Date();
const isoDate = (date) => date.toISOString().slice(0, 10);
const initialFrom = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
const initialTo = isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
const money = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
const statusLabel = { ACTIVE: 'Hoạt động', INACTIVE: 'Tạm khóa', PENDING: 'Chờ duyệt', SCHEDULED: 'Đã xếp', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };

const navItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'people', label: 'Nhân sự & phân quyền', icon: Users },
  { id: 'operations', label: 'Vận hành trung tâm', icon: CalendarDays },
  { id: 'packages', label: 'Gói thành viên', icon: Package },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  { id: 'audit', label: 'Nhật ký hệ thống', icon: ClipboardList },
];

function Status({ value }) {
  return <span className={`manager-status is-${String(value).toLowerCase()}`}>{statusLabel[value] || value}</span>;
}

function EmptyState({ message = 'Chưa có dữ liệu phù hợp.' }) {
  return <div className="manager-empty"><ClipboardList size={28} /><span>{message}</span></div>;
}

function Loading() {
  return <div className="manager-loading"><RefreshCw size={20} /> Đang tải dữ liệu...</div>;
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (active === 'dashboard') setData(await managerService.dashboard());
      if (active === 'people') {
        const [users, roles] = await Promise.all([managerService.users(filters), managerService.roles()]);
        setData({ users, roles });
      }
      if (active === 'operations') {
        const [subjects, rooms, classes, schedules, coaches] = await Promise.all([
          managerService.subjects(), managerService.rooms(), managerService.classes(),
          managerService.schedules(filters.from, filters.to), managerService.users({ role: 'Coach', status: 'ACTIVE' }),
        ]);
        setData({ subjects, rooms, classes, schedules, coaches });
      }
      if (active === 'packages') setData(await managerService.packages());
      if (active === 'reports') setData(await managerService.reports(filters.from, filters.to));
      if (active === 'audit') setData(await managerService.auditLogs());
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  }, [active, filters]);

  useEffect(() => {
    const refreshTimer = window.setTimeout(load, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [load]);

  const selectPage = (id) => {
    setActive(id);
    setData(null);
    setMobileNav(false);
  };

  const handleLogout = () => { logout(); navigate('/'); };
  const handleSaved = async () => { setModal(null); await load(); };
  const initials = (userInfo?.fullName || 'Center Manager').split(' ').filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();
  const pageTitle = navItems.find((item) => item.id === active)?.label;

  return (
    <div className={`manager-app ${theme === 'light' ? 'is-light' : 'is-dark'}`}>
      <aside className={`manager-sidebar ${mobileNav ? 'is-open' : ''}`}>
        <div className="manager-brand"><span><Dumbbell size={22} /></span><div><strong>NEXUS</strong><small>CENTER CONTROL</small></div><button className="manager-mobile-close" onClick={() => setMobileNav(false)} aria-label="Đóng menu"><X size={20} /></button></div>
        <div className="manager-role"><ShieldCheck size={16} /><span>Center Manager</span></div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? 'active' : ''} onClick={() => selectPage(id)}><Icon size={18} /><span>{label}</span><ChevronRight size={15} /></button>)}
        </nav>
        <div className="manager-profile">
          <div className="manager-avatar">{initials}</div><div><strong>{userInfo?.fullName || 'Quản lý Trung tâm'}</strong><small>{userInfo?.email || 'admin@sport.com'}</small></div>
          <button onClick={handleLogout} title="Đăng xuất"><LogOut size={17} /></button>
        </div>
      </aside>
      {mobileNav && <button className="manager-overlay" onClick={() => setMobileNav(false)} aria-label="Đóng menu" />}

      <main className="manager-main">
        <header className="manager-topbar">
          <button className="manager-menu-button" onClick={() => setMobileNav(true)} aria-label="Mở menu"><Menu size={20} /></button>
          <div><span>Trung tâm NEXUS</span><h1>{pageTitle}</h1></div>
          <RoleThemeToggle theme={theme} onToggle={toggleTheme} />
          <button className="manager-icon-button" onClick={load} title="Làm mới" aria-label="Làm mới dữ liệu"><RefreshCw size={18} /></button>
        </header>

        <section className="manager-content">
          {error && <div className="manager-alert"><span>{error}</span><button onClick={load}>Thử lại</button></div>}
          {loading ? <Loading /> : <ManagerView active={active} data={data} filters={filters} setFilters={setFilters} reload={load} openModal={setModal} operationTab={operationTab} setOperationTab={setOperationTab} />}
        </section>
      </main>
      {modal && <EditorModal config={modal} dictionaries={active === 'people' || active === 'operations' ? data : null} onClose={() => setModal(null)} onSaved={handleSaved} />}
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
    ['Hội viên', data?.totalMembers, Users, 'blue'], ['HLV hoạt động', data?.activeCoaches, Dumbbell, 'green'],
    ['Lớp đang mở', data?.activeClasses, BookOpen, 'amber'], ['Gói còn hạn', data?.activeMemberships, ShieldCheck, 'cyan'],
  ];
  return <>
    <PageHeader eyebrow="Tình hình hôm nay" title="Tổng quan vận hành" />
    <div className="manager-stat-grid">{stats.map(([label, value, Icon, tone]) => <div className={`manager-stat tone-${tone}`} key={label}><span><Icon size={20} /></span><div><small>{label}</small><strong>{value ?? 0}</strong></div></div>)}</div>
    <div className="manager-dashboard-grid">
      <section className="manager-panel manager-revenue"><div className="manager-panel-heading"><div><span>Doanh thu tháng này</span><strong>{money(data?.monthlyRevenue)}</strong></div><CircleDollarSign size={24} /></div><div className="manager-metric-row"><span>Lịch trong 7 ngày tới</span><b>{data?.upcomingSchedules || 0} buổi</b></div></section>
      <section className="manager-panel"><div className="manager-panel-heading"><div><span>Hoạt động gần đây</span><strong>Dòng vận hành</strong></div><Activity size={21} /></div><div className="manager-timeline">{data?.recentActivity?.length ? data.recentActivity.map((item, index) => <div key={`${item.type}-${index}`}><i /><div><strong>{item.title}</strong><span>{item.detail}</span></div><time>{dateTime(item.occurredAt)}</time></div>) : <EmptyState />}</div></section>
    </div>
  </>;
}

function PeopleView({ data, filters, setFilters, reload, openModal }) {
  const applyFilters = (event) => { event.preventDefault(); reload(); };
  const toggle = async (user) => { await managerService.updateUserStatus(user.userId, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'); reload(); };
  return <>
    <PageHeader eyebrow="Tài khoản trung tâm" title="Nhân sự & phân quyền" actions={<button className="manager-primary" onClick={() => openModal({ type: 'user' })}><Plus size={17} /> Thêm tài khoản</button>} />
    <form className="manager-filterbar" onSubmit={applyFilters}>
      <label className="manager-search"><Search size={17} /><input value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} placeholder="Tên, email hoặc số điện thoại" /></label>
      <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}><option value="ALL">Tất cả vai trò</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleName}>{role.roleName}</option>)}</select>
      <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Tạm khóa</option><option value="PENDING">Chờ duyệt</option></select>
      <button className="manager-secondary" type="submit">Lọc</button>
    </form>
    <div className="manager-table-wrap"><table><thead><tr><th>Thành viên</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th /></tr></thead><tbody>{data?.users?.map((user) => <tr key={user.userId}><td><div className="manager-person"><span>{user.fullName?.[0]}</span><div><strong>{user.fullName}</strong><small>UID-{String(user.userId).padStart(4, '0')}</small></div></div></td><td><strong>{user.email}</strong><small className="manager-cell-sub">{user.phone || 'Chưa có SĐT'}</small></td><td>{user.roleName}</td><td><Status value={user.status} /></td><td><div className="manager-row-actions"><button title="Chỉnh sửa" onClick={() => openModal({ type: 'user', item: user })}><Pencil size={16} /></button><button className="manager-text-action" onClick={() => toggle(user)}>{user.status === 'ACTIVE' ? 'Khóa' : 'Mở'}</button></div></td></tr>)}</tbody></table>{!data?.users?.length && <EmptyState />}</div>
  </>;
}

function OperationsView({ data, filters, setFilters, reload, openModal, operationTab, setOperationTab }) {
  const tabs = [['classes', 'Lớp học'], ['schedules', 'Lịch hoạt động'], ['subjects', 'Bộ môn'], ['rooms', 'Phòng tập']];
  const typeMap = { classes: 'class', schedules: 'schedule', subjects: 'subject', rooms: 'room' };
  return <>
    <PageHeader eyebrow="Điều phối nguồn lực" title="Vận hành trung tâm" actions={<button className="manager-primary" onClick={() => openModal({ type: typeMap[operationTab] })}><Plus size={17} /> Tạo mới</button>} />
    <div className="manager-tabs">{tabs.map(([id, label]) => <button key={id} className={operationTab === id ? 'active' : ''} onClick={() => setOperationTab(id)}>{label}<span>{data?.[id]?.length || 0}</span></button>)}</div>
    {operationTab === 'schedules' && <div className="manager-date-filter"><label>Từ ngày<input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label><label>Đến ngày<input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label><button className="manager-secondary" onClick={reload}>Áp dụng</button></div>}
    <OperationsTable type={operationTab} rows={data?.[operationTab] || []} edit={(item) => openModal({ type: typeMap[operationTab], item })} />
  </>;
}

function OperationsTable({ type, rows, edit }) {
  const heads = {
    classes: ['Lớp học', 'Bộ môn', 'Phân công', 'Sĩ số', 'Học phí', 'Trạng thái'],
    schedules: ['Thời gian', 'Lớp học', 'HLV / Phòng', 'Đã đặt', 'Trạng thái'],
    subjects: ['Bộ môn', 'Mô tả', 'Số lớp'], rooms: ['Phòng tập', 'Sức chứa', 'Số lớp'],
  }[type];
  return <div className="manager-table-wrap"><table><thead><tr>{heads.map((head) => <th key={head}>{head}</th>)}<th /></tr></thead><tbody>{rows.map((row) => {
    if (type === 'classes') return <tr key={row.classId}><td><strong>{row.className}</strong><small className="manager-cell-sub">CLS-{row.classId}</small></td><td>{row.subjectName}</td><td><strong>{row.coachName}</strong><small className="manager-cell-sub">{row.roomName}</small></td><td>{row.enrolled}/{row.maxSlots}</td><td>{money(row.price)}</td><td><Status value={row.status} /></td><td><button className="manager-edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    if (type === 'schedules') return <tr key={row.scheduleId}><td><strong>{dateTime(row.startTime)}</strong><small className="manager-cell-sub">đến {dateTime(row.endTime)}</small></td><td>{row.className}</td><td><strong>{row.coachName}</strong><small className="manager-cell-sub">{row.roomName}</small></td><td>{row.booked}/{row.maxSlots}</td><td><Status value={row.status} /></td><td><button className="manager-edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    if (type === 'subjects') return <tr key={row.subjectId}><td><strong>{row.subjectName}</strong></td><td>{row.description || '-'}</td><td>{row.classCount}</td><td><button className="manager-edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
    return <tr key={row.roomId}><td><strong>{row.roomName}</strong></td><td>{row.capacity} người</td><td>{row.classCount}</td><td><button className="manager-edit" onClick={() => edit(row)}><Pencil size={16} /></button></td></tr>;
  })}</tbody></table>{!rows.length && <EmptyState />}</div>;
}

function PackagesView({ data, openModal }) {
  return <>
    <PageHeader eyebrow="Danh mục kinh doanh" title="Gói thành viên & học phí" actions={<button className="manager-primary" onClick={() => openModal({ type: 'package' })}><Plus size={17} /> Thêm gói</button>} />
    <div className="manager-package-grid">{data?.map((item) => <article key={item.packageId}><div className="manager-package-top"><span><Package size={19} /></span><button onClick={() => openModal({ type: 'package', item })}><Pencil size={16} /></button></div><small>{item.packageType?.replace('_', ' ')}</small><h3>{item.packageName}</h3><strong>{money(item.price)}</strong><div><span>{item.durationDays} ngày</span><span>{item.activeSubscribers || 0} đang dùng</span></div></article>)}</div>{!data?.length && <EmptyState />}
  </>;
}

function ReportsView({ data, filters, setFilters, reload }) {
  const summary = data?.summary || {};
  const maxRevenue = Math.max(...(data?.revenueByDay || []).map((item) => Number(item.value)), 1);
  return <>
    <PageHeader eyebrow="Dữ liệu kinh doanh" title="Báo cáo theo thời gian" actions={<div className="manager-report-range"><input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /><span>đến</span><input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /><button className="manager-secondary" onClick={reload}>Xem</button></div>} />
    <div className="manager-report-stats"><div><small>Doanh thu</small><strong>{money(summary.revenue)}</strong></div><div><small>Giao dịch thành công</small><strong>{summary.successfulPayments || 0}</strong></div><div><small>Hóa đơn chờ</small><strong>{summary.pendingInvoices || 0}</strong></div><div><small>Lượt đăng ký lớp</small><strong>{summary.confirmedBookings || 0}</strong></div></div>
    <div className="manager-report-grid"><section className="manager-panel"><div className="manager-panel-heading"><div><span>Doanh thu theo ngày</span><strong>Biến động doanh thu</strong></div><BarChart3 size={20} /></div><div className="manager-bars">{data?.revenueByDay?.map((item) => <div key={item.label}><span>{new Date(item.label).toLocaleDateString('vi-VN')}</span><i><b style={{ width: `${(Number(item.value) / maxRevenue) * 100}%` }} /></i><strong>{money(item.value)}</strong></div>)}{!data?.revenueByDay?.length && <EmptyState />}</div></section><section className="manager-panel"><div className="manager-panel-heading"><div><span>Hiệu suất lớp</span><strong>Sức chứa đã sử dụng</strong></div><Users size={20} /></div><div className="manager-occupancy">{data?.classOccupancy?.map((item) => <div key={item.label}><div><span>{item.label}</span><strong>{item.value}/{item.capacity}</strong></div><i><b style={{ width: `${Math.min((Number(item.value) / Number(item.capacity || 1)) * 100, 100)}%` }} /></i></div>)}</div></section></div>
  </>;
}

function AuditView({ data }) {
  return <><PageHeader eyebrow="Kiểm soát thay đổi" title="Nhật ký hệ thống" /><div className="manager-table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thao tác</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>{data?.map((log) => <tr key={log.auditId}><td>{dateTime(log.createdAt)}</td><td><strong>{log.actorEmail}</strong></td><td><span className="manager-action-tag">{log.action}</span></td><td>{log.entityType} #{log.entityId}</td><td>{log.details}</td></tr>)}</tbody></table>{!data?.length && <EmptyState message="Chưa phát sinh thao tác quản trị." />}</div></>;
}

function EditorModal({ config, dictionaries, onClose, onSaved }) {
  const item = config.item || {};
  const [form, setForm] = useState(() => ({ ...item, password: '', startTime: item.startTime?.slice(0, 16) || '', endTime: item.endTime?.slice(0, 16) || '' }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const titles = { user: 'tài khoản', subject: 'bộ môn', room: 'phòng tập', class: 'lớp học', schedule: 'lịch hoạt động', package: 'gói thành viên' };

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      ['roleId', 'capacity', 'subjectId', 'coachId', 'roomId', 'maxSlots', 'classId', 'durationDays'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      ['price'].forEach((key) => { if (payload[key] !== undefined && payload[key] !== '') payload[key] = Number(payload[key]); });
      if (config.type === 'user') {
        if (item.userId) await managerService.updateUser(item.userId, payload);
        else await managerService.createUser(payload);
      }
      if (config.type === 'subject') await managerService.saveSubject(payload);
      if (config.type === 'room') await managerService.saveRoom(payload);
      if (config.type === 'class') await managerService.saveClass(payload);
      if (config.type === 'schedule') await managerService.saveSchedule(payload);
      if (config.type === 'package') await managerService.savePackage(payload);
      onSaved();
    } catch (err) { setError(err.response?.data?.message || 'Không thể lưu thay đổi.'); } finally { setSaving(false); }
  };

  return <div className="manager-modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><section className="manager-modal" role="dialog" aria-modal="true"><header><div><span>{item[`${config.type}Id`] || item.userId ? 'Chỉnh sửa' : 'Tạo mới'}</span><h3>{titles[config.type]}</h3></div><button onClick={onClose}><X size={20} /></button></header><form onSubmit={submit}>{error && <div className="manager-form-error">{error}</div>}<EditorFields type={config.type} form={form} set={set} data={dictionaries} editing={Boolean(config.item)} /><footer><button type="button" className="manager-secondary" onClick={onClose}>Hủy</button><button className="manager-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></footer></form></section></div>;
}

function EditorFields({ type, form, set, data, editing }) {
  if (type === 'user') return <div className="manager-form-grid"><Field label="Họ và tên"><input required value={form.fullName || ''} onChange={(e) => set('fullName', e.target.value)} /></Field><Field label="Email"><input required type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field><Field label="Số điện thoại"><input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field><Field label={editing ? 'Mật khẩu mới (không bắt buộc)' : 'Mật khẩu'}><input required={!editing} minLength={6} type="password" value={form.password || ''} onChange={(e) => set('password', e.target.value)} /></Field><Field label="Vai trò"><select required value={form.roleId || ''} onChange={(e) => set('roleId', e.target.value)}><option value="">Chọn vai trò</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleId}>{role.roleName}</option>)}</select></Field><Field label="Trạng thái"><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Tạm khóa</option><option value="PENDING">Chờ duyệt</option></select></Field></div>;
  if (type === 'subject') return <div className="manager-form-grid one"><Field label="Tên bộ môn"><input required value={form.subjectName || ''} onChange={(e) => set('subjectName', e.target.value)} /></Field><Field label="Mô tả"><textarea rows="4" value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field></div>;
  if (type === 'room') return <div className="manager-form-grid"><Field label="Tên phòng"><input required value={form.roomName || ''} onChange={(e) => set('roomName', e.target.value)} /></Field><Field label="Sức chứa"><input required min="1" type="number" value={form.capacity || ''} onChange={(e) => set('capacity', e.target.value)} /></Field></div>;
  if (type === 'class') return <div className="manager-form-grid"><Field label="Tên lớp" wide><input required value={form.className || ''} onChange={(e) => set('className', e.target.value)} /></Field><Field label="Bộ môn"><select required value={form.subjectId || ''} onChange={(e) => set('subjectId', e.target.value)}><option value="">Chọn bộ môn</option>{data?.subjects?.map((x) => <option key={x.subjectId} value={x.subjectId}>{x.subjectName}</option>)}</select></Field><Field label="Huấn luyện viên"><select required value={form.coachId || ''} onChange={(e) => set('coachId', e.target.value)}><option value="">Chọn HLV</option>{data?.coaches?.map((x) => <option key={x.userId} value={x.userId}>{x.fullName}</option>)}</select></Field><Field label="Phòng tập"><select required value={form.roomId || ''} onChange={(e) => set('roomId', e.target.value)}><option value="">Chọn phòng</option>{data?.rooms?.map((x) => <option key={x.roomId} value={x.roomId}>{x.roomName} ({x.capacity})</option>)}</select></Field><Field label="Sĩ số tối đa"><input required min="1" type="number" value={form.maxSlots || ''} onChange={(e) => set('maxSlots', e.target.value)} /></Field><Field label="Học phí"><input required min="0" step="1000" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field><Field label="Trạng thái"><select value={form.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)}><option value="ACTIVE">Hoạt động</option><option value="INACTIVE">Tạm dừng</option></select></Field></div>;
  if (type === 'schedule') return <div className="manager-form-grid"><Field label="Lớp học" wide><select required value={form.classId || ''} onChange={(e) => set('classId', e.target.value)}><option value="">Chọn lớp</option>{data?.classes?.filter((x) => x.status === 'ACTIVE').map((x) => <option key={x.classId} value={x.classId}>{x.className}</option>)}</select></Field><Field label="Bắt đầu"><input required type="datetime-local" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)} /></Field><Field label="Kết thúc"><input required type="datetime-local" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)} /></Field><Field label="Trạng thái" wide><select value={form.status || 'SCHEDULED'} onChange={(e) => set('status', e.target.value)}><option value="SCHEDULED">Đã xếp</option><option value="COMPLETED">Hoàn thành</option><option value="CANCELLED">Đã hủy</option></select></Field></div>;
  return <div className="manager-form-grid"><Field label="Tên gói" wide><input required value={form.packageName || ''} onChange={(e) => set('packageName', e.target.value)} /></Field><Field label="Loại gói"><select value={form.packageType || 'GYM_ACCESS'} onChange={(e) => set('packageType', e.target.value)}><option value="GYM_ACCESS">Gym access</option><option value="AI_ACCESS">AI access</option><option value="PREMIUM">Premium</option></select></Field><Field label="Thời hạn (ngày)"><input required min="1" type="number" value={form.durationDays || ''} onChange={(e) => set('durationDays', e.target.value)} /></Field><Field label="Giá bán" wide><input required min="0" step="1000" type="number" value={form.price ?? ''} onChange={(e) => set('price', e.target.value)} /></Field></div>;
}

function Field({ label, wide, children }) { return <label className={wide ? 'wide' : ''}><span>{label}</span>{children}</label>; }

export default ManagerDashboard;
