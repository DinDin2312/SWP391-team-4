import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultPackageCoverUrl, resourceImageUrl, validateResourceImage } from './resourceImages.js';

test('defaultPackageCoverUrl maps package tiers to distinct curated cover images', () => {
  assert.equal(defaultPackageCoverUrl(null), '');
  assert.equal(defaultPackageCoverUrl({}), '');
  assert.equal(defaultPackageCoverUrl({ packageType: 'GYM_ACCESS', durationDays: 1 }), '/images/crossfit-poster.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'GYM_ACCESS', durationDays: 30 }), '/images/bright-modern-gym.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'GYM_ACCESS', durationDays: 90 }), '/images/bright-gym.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'GYM_ACCESS', durationDays: 365 }), '/images/register-athlete.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'AI_ACCESS', durationDays: 30 }), '/images/pkg-ai-personal.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'AI_ACCESS', durationDays: 90 }), '/images/pkg-ai-premium.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'AI_ACCESS', durationDays: 365 }), '/images/pkg-ai-vip.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'POOL_ACCESS', durationDays: 30 }), '/images/swimming-poster.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'SAUNA_ACCESS', durationDays: 30 }), '/images/studio-poster.jpg');
  assert.equal(defaultPackageCoverUrl({ packageType: 'COMBO', durationDays: 30 }), '/images/pkg-combo-ai.jpg');
});

test('resource images use the configured API and accept only generated filenames', () => {
  const name = '12345678-1234-1234-1234-123456789abc.jpg';
  assert.equal(resourceImageUrl(name, 'https://api.example.test/api/'), `https://api.example.test/api/resource-images/${name}`);
  for (const value of ['', '../secret.jpg', 'https://example.test/x.jpg', '<svg>', '123.png']) assert.equal(resourceImageUrl(value), '');
});

test('image selection checks type, empty files and the shared upload limit', () => {
  assert.equal(validateResourceImage({type:'image/png',size:2048}), '');
  assert.equal(validateResourceImage({type:'image/jpeg',size:2*1024*1024}), '');
  assert.ok(validateResourceImage({type:'image/svg+xml',size:10}));
  assert.ok(validateResourceImage({type:'image/png',size:2*1024*1024+1}));
  assert.ok(validateResourceImage({type:'image/png',size:0}));
});
