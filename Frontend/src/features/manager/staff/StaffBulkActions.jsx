import { Download, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import managerEn from '../i18n/en';
import { roleLabel } from './roleUtils';

function StaffBulkActions({ count, roles, disabled, onLock, onChangeRole, onExport }) {
  const [roleId, setRoleId] = useState('');
  if (!count) return null;
  const copy = managerEn.staff.bulk;
  return <div className="manager-bulkbar" role="toolbar" aria-label={copy.selected(count)}>
    <strong>{copy.selected(count)}</strong>
    <button type="button" disabled={disabled} onClick={onLock}><LockKeyhole size={15} />{copy.lock}</button>
    <label><span className="sr-only">{copy.role}</span><ShieldCheck size={15} /><select value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">{copy.role}</option>{roles.map((role) => <option key={role.roleId} value={role.roleId}>{roleLabel(role.roleName)}</option>)}</select></label>
    <button type="button" disabled={disabled || !roleId} onClick={() => onChangeRole(Number(roleId))}>{copy.changeRole}</button>
    <button type="button" disabled={disabled} onClick={onExport}><Download size={15} />{copy.exportCsv}</button>
  </div>;
}

export default StaffBulkActions;
