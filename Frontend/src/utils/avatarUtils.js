import { API_BASE_URL } from '../config/apiBase.js';
/**
 * Resolves an avatar file path or URL to an absolute URL suitable for <img src="..." />.
 * Handles:
 * - null / undefined / empty -> null
 * - Absolute HTTP/HTTPS URLs -> returned as-is
 * - Full relative paths starting with /api/avatars/ -> prepended with API server host
 * - Relative filenames (e.g. "avatar_123.jpg") -> prepended with API host + /api/avatars/
 */
export const resolveAvatarUrl = (avatarPathOrUrl) => {
  if (!avatarPathOrUrl || typeof avatarPathOrUrl !== 'string') return null;
  const clean = avatarPathOrUrl.trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;

  const rawBase = API_BASE_URL;
  const host = rawBase.replace(/\/api\/?$/, '');

  if (clean.startsWith('/api/avatars/')) {
    return `${host}${clean}`;
  }
  if (clean.startsWith('/')) {
    return `${host}${clean}`;
  }
  return `${host}/api/avatars/${clean}`;
};

export default resolveAvatarUrl;
