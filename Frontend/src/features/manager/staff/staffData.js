const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export function enrichStaffUser(user, index) {
  // TODO: Replace deterministic fallback fields when staff detail metadata is exposed by the API.
  const seed = Number(user.userId || index + 1);
  return {
    ...user,
    joinedAt: user.joinedAt || daysAgo(seed % 5 === 0 ? seed % 25 : 45 + (seed % 600)),
    lastLoginAt: user.lastLoginAt || daysAgo(seed % 45),
    currentPlan: user.currentPlan || (user.roleName === 'Member' ? ['Premium', 'Gym Access', 'AI Access'][seed % 3] : '—'),
    planHistory: user.planHistory || (user.roleName === 'Member' ? [{ name: ['Premium', 'Gym Access', 'AI Access'][seed % 3], status: managerEn.staff.drawer.activePlan, startedAt: daysAgo(60 + (seed % 90)) }] : []),
    activity: user.activity || [{ label: managerEn.staff.drawer.signedIn, occurredAt: daysAgo(seed % 12) }, { label: managerEn.staff.drawer.profileReviewed, occurredAt: daysAgo(15 + (seed % 30)) }],
  };
}

export const isCurrentMonth = (value) => {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

export const staffDate = (value) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '—';

export const userUpdatePayload = (user, overrides = {}) => ({
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  roleId: user.roleId,
  status: user.status,
  password: '',
  ...overrides,
});

export function downloadStaffCsv(users, fileName) {
  const cell = (value) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    managerEn.staff.bulk.csvHeaders,
    ...users.map((user) => [user.userId, user.fullName, user.email, user.phone || '', user.roleName, user.status, user.joinedAt, user.lastLoginAt, user.currentPlan]),
  ];
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = fileName; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
import managerEn from '../i18n/en';
