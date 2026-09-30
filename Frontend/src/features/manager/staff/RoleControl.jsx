import { roleLabel, roleTone } from './roleUtils';

function RoleControl({ user }) {
  return <div className={`manager-role-control is-${roleTone(user.roleName)}`}>
    <span>{roleLabel(user.roleName)}</span>
  </div>;
}

export default RoleControl;
