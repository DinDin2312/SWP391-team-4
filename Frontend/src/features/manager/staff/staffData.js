import { locale } from '../../../i18n/languageStore.js';
import { formatDate } from '../../../utils/displayFormat.js';
// Missing metadata stays unknown; never invent dates, plans or account activity.
export function enrichStaffUser(user) {
  return {...user,joinedAt:user.joinedAt || null,lastLoginAt:user.lastLoginAt || null,
    currentPlan:user.currentPlan || '',planHistory:user.planHistory || [],activity:user.activity || []};
}

export const isCurrentMonth = (value) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
};

export const staffDate = formatDate;

export const staffInitials = (name = '') => name.trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join('').toUpperCase();

export const displayStaffName = (name = '') => name.replace(/^HLV\s+/i, '').trim();

export const relativeDate = (value) => {
  if (!value) return 'Never';
  const difference = new Date(value).getTime() - Date.now();
  const absolute = Math.abs(difference);
  const units = [[86400000, 'day'], [3600000, 'hour'], [60000, 'minute']];
  const [duration, unit] = units.find(([size]) => absolute >= size) || [1000, 'second'];
  return new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(Math.round(difference / duration), unit);
};

export const staffAvatarTone = (user = {}) => {
  const seed = Number(user.userId) || [...String(user.fullName || '')].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Math.abs(seed) % 6;
};

export const staffAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '';
  if (/^https?:\/\//i.test(avatarPath)) return avatarPath;
  const apiBase = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
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
import managerEn from '../i18n/en.js';
