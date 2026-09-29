import { roleLabel, roleTone } from './roleUtils';
import managerEn from '../i18n/en';

function RoleControl({ user, roles, disabled, onChange }) {
  return <div className={`manager-role-control is-${roleTone(user.roleName)}`} onClick={(event) => event.stopPropagation()}>
    <span>{roleLabel(user.roleName)}</span>
    <select
      aria-label={managerEn.staff.changeRoleFor(user.fullName)}
      disabled={disabled}
      value={user.roleId}
      onChange={(event) => onChange(user, Number(event.target.value))}
    >
      {roles.map((role) => <option key={role.roleId} value={role.roleId}>{roleLabel(role.roleName)}</option>)}
    </select>
  </div>;
}

export default RoleControl;
