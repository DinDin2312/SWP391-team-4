import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAvatarUrl } from './avatarUtils.js';

test('resolveAvatarUrl handles null, undefined, empty, and invalid types', () => {
  assert.equal(resolveAvatarUrl(null), null);
  assert.equal(resolveAvatarUrl(undefined), null);
  assert.equal(resolveAvatarUrl(''), null);
  assert.equal(resolveAvatarUrl('   '), null);
  assert.equal(resolveAvatarUrl(123), null);
});

test('resolveAvatarUrl handles full http and https urls', () => {
  assert.equal(resolveAvatarUrl('https://example.com/user.png'), 'https://example.com/user.png');
  assert.equal(resolveAvatarUrl('http://cdn.sport.com/coach.jpg'), 'http://cdn.sport.com/coach.jpg');
});

test('resolveAvatarUrl handles filenames and relative paths', () => {
  const result1 = resolveAvatarUrl('user_123.jpg');
  assert.ok(result1.endsWith('/api/avatars/user_123.jpg'));

  const result2 = resolveAvatarUrl('/api/avatars/user_123.jpg');
  assert.ok(result2.endsWith('/api/avatars/user_123.jpg'));
  assert.ok(!result2.includes('/api/avatars/api/avatars/'));

  const result3 = resolveAvatarUrl('/custom/path/img.png');
  assert.ok(result3.endsWith('/custom/path/img.png'));
});
