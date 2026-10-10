const namePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

export function resourceImageUrl(path, base = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api') {
  if (!path || !namePattern.test(path)) return '';
  return `${base.replace(/\/$/, '')}/resource-images/${path}`;
}

export function validateResourceImage(file) {
  if (!file || !file.size) return 'Select an image.';
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Choose a valid PNG or JPEG image.';
  if (file.size > 2 * 1024 * 1024) return 'Images must be 2 MB or smaller.';
  return '';
}
