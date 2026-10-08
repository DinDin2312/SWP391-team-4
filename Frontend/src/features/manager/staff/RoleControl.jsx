import { t, useLanguage } from '../../../i18n/useLanguage';
import { roleLabel, roleTone } from './roleUtils';

function RoleControl({ user }) {
  useLanguage();
  return <div className={`manager-role-control is-${roleTone(user.roleName)}`}>
    <span>{t(roleLabel(user.roleName))}</span>
  </div>;
}

export default RoleControl;
