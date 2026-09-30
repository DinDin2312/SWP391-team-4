import { roleLabel, roleTone } from './roleUtils';

const statusLabel = { ACTIVE: 'Active', INACTIVE: 'Inactive', PENDING: 'Pending' };

export function RoleBadge({ role }) {
  return <span className={`manager-badge manager-role-badge is-${roleTone(role)}`}>{roleLabel(role)}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`manager-badge manager-status-badge is-${String(status).toLowerCase()}`}><i />{statusLabel[status] || status}</span>;
}
