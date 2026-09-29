import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import managerEn from '../i18n/en';
import { apiError } from '../managerUtils';
import managerService from '../services/managerService';
import { downloadStaffCsv, enrichStaffUser, userUpdatePayload } from './staffData';
import StaffBulkActions from './StaffBulkActions';
import StaffDrawer from './StaffDrawer';
import LockAccountModal from './LockAccountModal';
import StaffStats from './StaffStats';
import StaffTable from './StaffTable';

function StaffPage({ data, filters, setFilters, reload, openModal, selectPage, currentUser, notify }) {
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [lockTargets, setLockTargets] = useState([]);
  const firstSearchRender = useRef(true);
  const searchRequest = useRef({ filters, reload });
  const users = useMemo(() => (data?.users || []).map(enrichStaffUser), [data?.users]);
  useEffect(() => { searchRequest.current = { filters, reload }; }, [filters, reload]);
  useEffect(() => {
    if (firstSearchRender.current) { firstSearchRender.current = false; return undefined; }
    const timer = window.setTimeout(() => searchRequest.current.reload({ ...searchRequest.current.filters }), 300);
    return () => window.clearTimeout(timer);
  }, [filters.keyword]);
  const changeFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    reload(next);
  };
  const clearFilters = () => {
    const next = { ...filters, keyword: '', role: 'ALL', status: 'ALL' };
    setFilters(next);
    reload(next);
  };
  const setStatus = async (user, status, reason = '') => {
    setActionError(''); setPendingId(user.userId);
    try { await managerService.updateUserStatus(user.userId, status, reason); notify(managerEn.staff.feedback.accountUnlocked); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  const changeRole = async (user, roleId) => {
    if (roleId === Number(user.roleId)) return;
    setActionError(''); setPendingId(user.userId);
    try {
      await managerService.updateUser(user.userId, userUpdatePayload(user, { roleId }));
      notify(managerEn.staff.feedback.roleUpdated);
      reload();
    } catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  const selectedUsers = users.filter((user) => selected.has(user.userId));
  const activeManagers = users.filter((user) => user.roleName === 'Center Manager' && user.status === 'ACTIVE');
  const protectedIds = new Set(users.filter((user) => user.email?.toLowerCase() === currentUser?.email?.toLowerCase() || (activeManagers.length === 1 && user.userId === activeManagers[0].userId)).map((user) => user.userId));
  const hasProtectedTarget = (targets) => targets.some((user) => protectedIds.has(user.userId));
  const requestToggleLock = (user) => user.status === 'INACTIVE' ? setStatus(user, 'ACTIVE') : setLockTargets([user]);
  const requestBulkLock = () => {
    const targets = selectedUsers.filter((user) => user.status !== 'INACTIVE');
    if (hasProtectedTarget(targets)) { setActionError(managerEn.staff.protection.selfOrLastManager); return; }
    setLockTargets(targets);
  };
  const confirmLock = async (reason) => {
    setPendingId('bulk'); setActionError('');
    try { await Promise.all(lockTargets.map((user) => managerService.updateUserStatus(user.userId, 'INACTIVE', reason))); notify(managerEn.staff.feedback.accountsLocked(lockTargets.length)); setSelected(new Set()); setLockTargets([]); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  const bulkRole = async (roleId) => {
    if (hasProtectedTarget(selectedUsers)) { setActionError(managerEn.staff.protection.selfOrLastManager); return; }
    setPendingId('bulk'); setActionError('');
    try { await Promise.all(selectedUsers.map((user) => managerService.updateUser(user.userId, userUpdatePayload(user, { roleId })))); notify(managerEn.staff.feedback.rolesUpdated(selectedUsers.length)); setSelected(new Set()); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };

  return <>
    <div className="manager-page-header manager-staff-header"><div><span>{managerEn.staff.eyebrow}</span></div><div className="manager-header-actions"><button className="manager-primary" onClick={() => openModal({ type: 'user' })}><Plus size={17} /> {managerEn.staff.addAccount}</button></div></div>
    <StaffStats users={users} />
    {actionError && <div className="manager-alert" role="alert">{actionError}</div>}
    <div className="manager-filterbar">
      <label className="manager-search"><Search size={17} /><input value={filters.keyword} onChange={(event) => setFilters({ ...filters, keyword: event.target.value })} placeholder={managerEn.staff.filters.searchPlaceholder} /></label>
      <select value={filters.role} onChange={(event) => changeFilter('role', event.target.value)}><option value="ALL">{managerEn.staff.filters.allRoles}</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleName}>{role.roleName}</option>)}</select>
      <select value={filters.status} onChange={(event) => changeFilter('status', event.target.value)}><option value="ALL">{managerEn.staff.filters.allStatuses}</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></select>
      <button className="manager-clear-filter" type="button" onClick={clearFilters}>{managerEn.staff.filters.clear}</button>
      <output className="manager-result-count" aria-live="polite">{managerEn.staff.filters.resultCount(users.length)}</output>
    </div>
    <StaffBulkActions count={selected.size} roles={data?.roles || []} disabled={pendingId !== null} onLock={requestBulkLock} onChangeRole={bulkRole} onExport={() => { downloadStaffCsv(selectedUsers, managerEn.staff.bulk.csvFile); notify(managerEn.staff.feedback.exported(selectedUsers.length)); }} />
    <StaffTable users={users} roles={data?.roles || []} selected={selected} setSelected={setSelected} pending={pendingId !== null} protectedIds={protectedIds} onRoleChange={changeRole} onDetails={setSelectedUser} onEdit={(item) => openModal({ type: 'user', item })} onResetPassword={(item) => openModal({ type: 'user', item })} onToggleLock={requestToggleLock} onViewLogs={() => selectPage('audit')} onRowClick={setSelectedUser} />
    <StaffDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    {lockTargets.length > 0 && <LockAccountModal users={lockTargets} busy={pendingId !== null} onClose={() => setLockTargets([])} onConfirm={confirmLock} />}
  </>;
}

export default StaffPage;
