export const actionLabels = { CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted', STATUS_CHANGE: 'Status changed', UPDATE_IMAGE: 'Image updated', REMOVE_IMAGE: 'Image removed', UPDATE_AVATAR: 'Avatar updated', PAYMENT_REVIEW: 'Payment needs review' };
export const entityLabels = { USER: 'Account', SUBJECT: 'Subject', ROOM: 'Room', CLASS: 'Class', SCHEDULE: 'Session', PACKAGE: 'Membership package', PACKAGE_TYPE: 'Package type', INVOICE: 'Invoice' };
export function entityKey(value = '') { const code = String(value).toUpperCase(); return ({ PACKAGES: 'PACKAGE', SUBJECTS: 'SUBJECT', ROOMS: 'ROOM', CLASSES: 'CLASS', USERS: 'USER' })[code] || code; }
export function changeFields(log) {
  try { const json = typeof log.changesJson === 'string' ? JSON.parse(log.changesJson) : log.changesJson; return json?.fields && typeof json.fields === 'object' && !Array.isArray(json.fields) ? Object.entries(json.fields) : []; } catch { return []; }
}
const normalized = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
export function filterLogs(logs, filters, translate = value => value) {
  const keyword = normalized(filters.keyword).trim();
  return logs.filter(log => {
    const date = String(log.createdAt || '').slice(0, 10), resource = entityKey(log.entityType);
    return (!filters.action || log.action === filters.action) && (!filters.entity || resource === filters.entity)
      && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
      && (!keyword || normalized([log.auditId, log.actorEmail, log.action, translate(actionLabels[log.action] || log.action), log.entityType, translate(entityLabels[resource] || resource), log.entityId, log.details].join(' ')).includes(keyword));
  }).sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || Number(b.auditId) - Number(a.auditId));
}
export function changeValue(value, translate = value => value) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return translate(value ? 'Yes' : 'No');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
