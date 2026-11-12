import { API_BASE_URL } from '../../config/apiBase.js';
const namePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

export function resourceImageUrl(path, base = API_BASE_URL) {
  if (!path || !namePattern.test(path)) return '';
  return `${base.replace(/\/$/, '')}/resource-images/${path}`;
}

export function defaultPackageCoverUrl(pkg) {
  if (!pkg || (!pkg.packageType && !pkg.durationDays)) return '';
  const type = String(pkg.packageType || '').toUpperCase();
  const days = Number(pkg.durationDays || 0);
  if (type === 'AI_ACCESS') {
    if (days >= 300) return '/images/pkg-ai-vip.jpg';
    if (days >= 60) return '/images/pkg-ai-premium.jpg';
    return '/images/pkg-ai-personal.jpg';
  }
  if (type === 'COMBO') return '/images/pkg-combo-ai.jpg';
  if (days > 0 && days <= 7) return '/images/crossfit-poster.jpg';
  if (days >= 300) return '/images/register-athlete.jpg';
  if (days >= 60) return '/images/bright-gym.jpg';
  return '/images/bright-modern-gym.jpg';
}

export function validateResourceImage(file) {
  if (!file || !file.size) return 'Select an image.';
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Choose a valid PNG or JPEG image.';
  if (file.size > 2 * 1024 * 1024) return 'Images must be 2 MB or smaller.';
  return '';
}
