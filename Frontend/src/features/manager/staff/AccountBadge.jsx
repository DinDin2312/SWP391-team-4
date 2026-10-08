import { t, useLanguage } from '../../../i18n/useLanguage';
import { roleLabel, roleTone } from './roleUtils';

const statusLabel = { ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending' };

export function RoleBadge({ role }) {
  useLanguage();
  return <span className={`manager-badge manager-role-badge is-${roleTone(role)}`}>{t(roleLabel(role))}</span>;
}

export function StatusBadge({ status }) {
  useLanguage();
  return <span className={`manager-badge manager-status-badge is-${String(status).toLowerCase()}`}><i />{t(statusLabel[status] || status)}</span>;
}
