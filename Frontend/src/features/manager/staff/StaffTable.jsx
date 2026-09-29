import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import managerEn from '../i18n/en';
import RoleControl from './RoleControl';
import StaffActionsMenu from './StaffActionsMenu';
import { staffDate } from './staffData';

const statusLabel = { ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending' };
const valueFor = (user, key) => ({ member: user.fullName, contact: user.email, role: user.roleName, status: user.status, joined: user.joinedAt, lastLogin: user.lastLoginAt, currentPlan: user.currentPlan }[key] || '');

function SortHeader({ column, sort, setSort }) {
  const label = managerEn.staff.table.columns[column];
  const active = sort.key === column;
  return <th><button type="button" className="manager-sort" aria-label={managerEn.staff.table.sortBy(label)} onClick={() => setSort({ key: column, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' })}>{label}{active ? <ChevronDown className={sort.direction === 'asc' ? 'is-asc' : ''} size={13} /> : <ChevronsUpDown size={13} />}</button></th>;
}

function StaffTable({ users, roles, selected, setSelected, pending, protectedIds, onRoleChange, onDetails, onEdit, onResetPassword, onToggleLock, onViewLogs, onRowClick }) {
  const [sort, setSort] = useState({ key: 'member', direction: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => [...users].sort((a, b) => String(valueFor(a, sort.key)).localeCompare(String(valueFor(b, sort.key)), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1)), [users, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageSelected = pageRows.length > 0 && pageRows.every((user) => selected.has(user.userId));
  const togglePage = () => setSelected((current) => {
    const next = new Set(current);
    pageRows.forEach((user) => pageSelected ? next.delete(user.userId) : next.add(user.userId));
    return next;
  });
  const toggleOne = (id) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const columns = ['member', 'contact', 'role', 'status', 'joined', 'lastLogin', 'currentPlan'];

  return <div className="manager-staff-table">
    <div className="manager-table-wrap"><table><thead><tr><th className="manager-check-cell"><input type="checkbox" checked={pageSelected} aria-label={managerEn.staff.table.selectAll} onChange={togglePage} /></th>{columns.map((column) => <SortHeader key={column} column={column} sort={sort} setSort={setSort} />)}<th><span className="sr-only">{managerEn.staff.table.columns.actions}</span></th></tr></thead><tbody>{pageRows.map((user) => <tr key={user.userId} onClick={() => onRowClick(user)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') onRowClick(user); }}>
      <td className="manager-check-cell"><input type="checkbox" checked={selected.has(user.userId)} aria-label={managerEn.staff.table.selectUser(user.fullName)} onClick={(event) => event.stopPropagation()} onChange={() => toggleOne(user.userId)} /></td>
      <td><div className="manager-person"><span className={`avatar-tone-${Number(user.userId) % 6}`}>{user.fullName?.[0]}</span><div><strong>{user.fullName}</strong><small>UID-{String(user.userId).padStart(4, '0')}</small></div></div></td>
      <td><strong>{user.email}</strong><small className={`manager-cell-sub ${user.phone ? '' : 'is-empty'}`}>{user.phone || '—'}</small></td>
      <td><RoleControl user={user} roles={roles} disabled={pending || protectedIds.has(user.userId)} onChange={onRoleChange} /></td>
      <td><span className={`manager-status is-${String(user.status).toLowerCase()}`}>{statusLabel[user.status] || user.status}</span></td>
      <td>{staffDate(user.joinedAt)}</td><td>{staffDate(user.lastLoginAt)}</td><td>{user.currentPlan}</td>
      <td><StaffActionsMenu user={user} disabled={pending} lockDisabled={protectedIds.has(user.userId)} onDetails={onDetails} onEdit={onEdit} onResetPassword={onResetPassword} onToggleLock={onToggleLock} onViewLogs={onViewLogs} /></td>
    </tr>)}{pageRows.length === 0 && <tr><td colSpan="9"><div className="manager-empty"><strong>{managerEn.staff.feedback.emptyTitle}</strong><span>{managerEn.staff.feedback.emptyBody}</span></div></td></tr>}</tbody></table></div>
    <div className="manager-pagination"><label>{managerEn.staff.table.rowsPerPage}<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label><span>{managerEn.staff.table.page(currentPage, totalPages)}</span><button type="button" title={managerEn.staff.table.previous} aria-label={managerEn.staff.table.previous} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><button type="button" title={managerEn.staff.table.next} aria-label={managerEn.staff.table.next} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div>
  </div>;
}

export default StaffTable;
