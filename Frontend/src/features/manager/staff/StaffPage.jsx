import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import managerEn from '../i18n/en';
import ManagerPageHeader from '../components/ManagerPageHeader';
import { apiError } from '../managerUtils';
import managerService from '../services/managerService';
import { downloadStaffCsv, enrichStaffUser, isCurrentMonth } from './staffData';
import ConfirmDialog from './ConfirmDialog';
import ManagerSelect from './ManagerSelect';
import StaffBulkActions from './StaffBulkActions';
import StaffDrawer from './StaffDrawer';
import LockAccountModal from './LockAccountModal';
import StaffStats from './StaffStats';
import StaffTable from './StaffTable';

function StaffPage({ data, filters, setFilters, reload, openModal, selectPage, currentUser, notify, page }) {
  const [actionError, setActionError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [lockTargets, setLockTargets] = useState([]);
  const [searchTerm, setSearchTerm] = useState(filters.keyword);
  const [quickFilter, setQuickFilter] = useState('ALL');
  const [confirmation, setConfirmation] = useState(null);
  const searchRequest = useRef({ filters, reload });
  const users = useMemo(() => (data?.users || []).map(enrichStaffUser), [data?.users]);
  useEffect(() => { searchRequest.current = { filters, reload }; }, [filters, reload]);
  useEffect(() => {
    if (searchTerm === searchRequest.current.filters.keyword) return undefined;
    const timer = window.setTimeout(() => {
      const next = { ...searchRequest.current.filters, keyword: searchTerm };
      setFilters(next);
      searchRequest.current.reload(next);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm, setFilters]);
  const changeFilter = (key, value) => {
    const next = { ...filters, keyword: searchTerm, [key]: value };
    setFilters(next);
    reload(next);
  };
  const clearFilters = () => {
    const next = { ...filters, keyword: '', role: 'ALL', status: 'ALL' };
    setSearchTerm('');
    setQuickFilter('ALL');
    setFilters(next);
    reload(next);
  };
  const selectQuickFilter = (value) => {
    setQuickFilter(value);
    if (value !== 'NEW') changeFilter('status', value === 'ALL' ? 'ALL' : value);
    else changeFilter('status', 'ALL');
  };
  const setStatus = async (user, status, reason = '') => {
    setActionError(''); setPendingId(user.userId);
    try { await managerService.updateUserStatus(user.userId, status, reason); notify(managerEn.staff.feedback.accountUnlocked); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  const visibleUsers = quickFilter === 'NEW' ? users.filter((user) => isCurrentMonth(user.joinedAt)) : users;
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
  const deleteSelected = async () => {
    setPendingId('delete'); setActionError('');
    try { await Promise.all(selectedUsers.map((user) => managerService.deleteUser(user.userId))); notify(`${selectedUsers.length} account${selectedUsers.length === 1 ? '' : 's'} deleted.`); setSelected(new Set()); setConfirmation(null); reload(); }
    catch (err) { setActionError(apiError(err)); }
    finally { setPendingId(null); }
  };
  const requestReset = (user) => setConfirmation({ type: 'reset', user });
  const requestDelete = () => {
    if (hasProtectedTarget(selectedUsers)) { setActionError(managerEn.staff.protection.selfOrLastManager); return; }
    setConfirmation({ type: 'delete' });
  };
  const hasFilters = Boolean(searchTerm || filters.role !== 'ALL' || filters.status !== 'ALL' || quickFilter !== 'ALL');

  return <>
    <ManagerPageHeader title={page.title} description={page.description} actions={<button className="manager-primary manager-add-account" onClick={() => openModal({ type: 'user' })}><Plus size={17} /> {managerEn.staff.addAccount}</button>} />
    <StaffStats users={users} activeFilter={quickFilter} onFilter={selectQuickFilter} />
    {actionError && <div className="manager-alert" role="alert">{actionError}</div>}
    <div className="manager-filterbar">
      <label className="manager-search"><Search size={17} /><input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={managerEn.staff.filters.searchPlaceholder} aria-label={managerEn.staff.filters.searchLabel} autoComplete="off" /></label>
      <ManagerSelect value={filters.role} onChange={(event) => changeFilter('role', event.target.value)}><option value="ALL">{managerEn.staff.filters.allRoles}</option>{data?.roles?.map((role) => <option key={role.roleId} value={role.roleName}>{role.roleName}</option>)}</ManagerSelect>
      <ManagerSelect value={filters.status} onChange={(event) => { setQuickFilter(event.target.value === 'ALL' ? 'ALL' : event.target.value); changeFilter('status', event.target.value); }}><option value="ALL">{managerEn.staff.filters.allStatuses}</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="PENDING">Pending</option></ManagerSelect>
      <button className={`manager-clear-filter ${hasFilters ? 'is-active' : ''}`} type="button" disabled={!hasFilters} onClick={clearFilters}>{managerEn.staff.filters.clear}</button>
      <output className="manager-result-count" aria-live="polite">{managerEn.staff.filters.resultCount(visibleUsers.length)}</output>
    </div>
    <StaffBulkActions count={selected.size} disabled={pendingId !== null} onLock={requestBulkLock} onExport={() => { downloadStaffCsv(selectedUsers, managerEn.staff.bulk.csvFile); notify(managerEn.staff.feedback.exported(selectedUsers.length)); }} onDelete={requestDelete} />
    <StaffTable users={visibleUsers} selected={selected} setSelected={setSelected} pending={pendingId !== null} protectedIds={protectedIds} onDetails={setSelectedUser} onEdit={(item) => openModal({ type: 'user', item })} onResetPassword={requestReset} onToggleLock={requestToggleLock} onViewLogs={() => selectPage('audit')} onRowClick={setSelectedUser} />
    <StaffDrawer user={selectedUser} onClose={() => setSelectedUser(null)} onEdit={(item) => { setSelectedUser(null); openModal({ type: 'user', item }); }} onResetPassword={requestReset} onToggleLock={requestToggleLock} onViewLogs={() => { setSelectedUser(null); selectPage('audit'); }} lockDisabled={selectedUser ? protectedIds.has(selectedUser.userId) : false} />
    {lockTargets.length > 0 && <LockAccountModal users={lockTargets} busy={pendingId !== null} onClose={() => setLockTargets([])} onConfirm={confirmLock} />}
    <ConfirmDialog open={confirmation?.type === 'reset'} title="Reset password?" message={`You will be asked to set a new password for ${confirmation?.user?.fullName || 'this account'}.`} confirmLabel="Continue" tone="warning" busy={pendingId !== null} onClose={() => setConfirmation(null)} onConfirm={() => { const item = confirmation.user; setConfirmation(null); openModal({ type: 'user', item, focusPassword: true }); }} />
    <ConfirmDialog open={confirmation?.type === 'delete'} title="Delete selected accounts?" message={`Permanently delete ${selectedUsers.length} selected account${selectedUsers.length === 1 ? '' : 's'}. This cannot be undone.`} confirmLabel="Delete" busy={pendingId !== null} onClose={() => setConfirmation(null)} onConfirm={deleteSelected} />
  </>;
}

export default StaffPage;
