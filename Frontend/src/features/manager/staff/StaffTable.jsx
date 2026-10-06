import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import managerEn from '../i18n/en';
import { RoleBadge, StatusBadge } from './AccountBadge';
import ManagerSelect from './ManagerSelect';
import StaffActionsMenu from './StaffActionsMenu';
import StaffAvatar from './StaffAvatar';
import { displayStaffName } from './staffData';

const valueFor = (user, key) => ({ member: user.fullName, contact: user.email, phone: user.phone, role: user.roleName, status: user.status }[key] || '');

function SortHeader({ column, sort, setSort }) {
  const label = managerEn.staff.table.columns[column];
  const active = sort.key === column;
  return <th><button type="button" className="manager-sort" aria-label={managerEn.staff.table.sortBy(label)} onClick={() => setSort({ key: column, direction: active && sort.direction === 'asc' ? 'desc' : 'asc' })}>{label}{active ? <ChevronDown className={sort.direction === 'asc' ? 'is-asc' : ''} size={13} /> : <ChevronsUpDown size={13} />}</button></th>;
}

function StaffTable({ users, selected, setSelected, pending, protectedIds, onDetails, onEdit, onResetPassword, onToggleLock, onViewLogs, onRowClick }) {
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
  const columns = ['member', 'contact', 'phone', 'role', 'status'];

  return <div className="manager-staff-table">
    <table><thead><tr><th className="manager-check-cell"><input type="checkbox" checked={pageSelected} aria-label={managerEn.staff.table.selectAll} onChange={togglePage} /></th>{columns.map((column) => <SortHeader key={column} column={column} sort={sort} setSort={setSort} />)}<th><span className="sr-only">{managerEn.staff.table.columns.actions}</span></th></tr></thead><tbody>{pageRows.map((user) => <tr key={user.userId} onClick={() => onRowClick(user)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') onRowClick(user); }}>
      <td className="manager-check-cell"><input type="checkbox" checked={selected.has(user.userId)} aria-label={managerEn.staff.table.selectUser(user.fullName)} onClick={(event) => event.stopPropagation()} onChange={() => toggleOne(user.userId)} /></td>
      <td><div className="manager-person"><StaffAvatar user={user} className="manager-table-avatar" /><div><strong>{displayStaffName(user.fullName)}</strong><small>UID-{String(user.userId).padStart(4, '0')}</small></div></div></td>
      <td>{user.email}</td>
      <td className={user.phone ? 'manager-phone-cell' : 'manager-phone-cell manager-empty-value'}>{user.phone || '—'}</td>
      <td><RoleBadge role={user.roleName} /></td>
      <td><StatusBadge status={user.status} /></td>
      <td><StaffActionsMenu user={user} disabled={pending} lockDisabled={protectedIds.has(user.userId)} onDetails={onDetails} onEdit={onEdit} onResetPassword={onResetPassword} onToggleLock={onToggleLock} onViewLogs={onViewLogs} /></td>
    </tr>)}{pageRows.length === 0 && <tr><td colSpan={columns.length + 2}><div className="manager-empty"><strong>{managerEn.staff.feedback.emptyTitle}</strong><span>{managerEn.staff.feedback.emptyBody}</span></div></td></tr>}</tbody></table>
    <div className="manager-pagination"><label>{managerEn.staff.table.rowsPerPage}<ManagerSelect value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</ManagerSelect></label><span>{managerEn.staff.table.page(currentPage, totalPages)}</span><button type="button" title={managerEn.staff.table.previous} aria-label={managerEn.staff.table.previous} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><button type="button" title={managerEn.staff.table.next} aria-label={managerEn.staff.table.next} disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div>
  </div>;
}

export default StaffTable;
