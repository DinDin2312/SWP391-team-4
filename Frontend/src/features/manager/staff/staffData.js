const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export function enrichStaffUser(user, index) {
  // TODO: Replace deterministic fallback fields when staff detail metadata is exposed by the API.
  const seed = Number(user.userId || index + 1);
  const joinedAt = user.joinedAt || daysAgo(seed % 5 === 0 ? seed % 25 : 45 + (seed % 600));
  const proposedPlanStart = new Date(daysAgo(60 + (seed % 90))).getTime();
  const planStartedAt = new Date(Math.max(new Date(joinedAt).getTime(), proposedPlanStart)).toISOString();
  return {
    ...user,
    joinedAt,
    lastLoginAt: user.lastLoginAt || daysAgo(seed % 45),
    currentPlan: user.currentPlan || (user.roleName === 'Member' ? ['Premium', 'Gym Access', 'AI Access'][seed % 3] : ''),
    planHistory: user.planHistory || (user.roleName === 'Member' ? [{
      name: ['Premium', 'Gym Access', 'AI Access'][seed % 3],
      status: managerEn.staff.drawer.activePlan,
      startedAt: planStartedAt,
      endedAt: new Date(new Date(planStartedAt).setDate(new Date(planStartedAt).getDate() + 30)).toISOString(),
      price: [499000, 299000, 699000][seed % 3],
    }] : []),
    activity: user.activity || [{ label: managerEn.staff.drawer.signedIn, occurredAt: daysAgo(seed % 12) }, { label: managerEn.staff.drawer.profileReviewed, occurredAt: daysAgo(15 + (seed % 30)) }],
  };
}

export const isCurrentMonth = (value) => {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

export const staffDate = (value) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '—';

export const staffInitials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();

export const displayStaffName = (name = '') => name.replace(/^HLV\s+/i, '').trim();

export const relativeDate = (value) => {
  if (!value) return 'Never';
  const difference = new Date(value).getTime() - Date.now();
  const absolute = Math.abs(difference);
  const units = [[86400000, 'day'], [3600000, 'hour'], [60000, 'minute']];
  const [duration, unit] = units.find(([size]) => absolute >= size) || [1000, 'second'];
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round(difference / duration), unit);
};

export const staffAvatarTone = (user = {}) => {
  const seed = Number(user.userId) || [...String(user.fullName || '')].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Math.abs(seed) % 6;
};

export const staffAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const path = avatarPath.startsWith('/') ? avatarPath : `/api/avatars/${avatarPath}`;
  return new URL(path, apiBase).href;
};

export const validateAvatarFile = (file) => {
  if (!file) return '';
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Choose a PNG or JPEG image.';
  if (file.size > 2 * 1024 * 1024) return 'Avatar images must be 2 MB or smaller.';
  return '';
};

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
