import test from 'node:test';
import assert from 'node:assert/strict';
import { resourceImageUrl, validateResourceImage } from './resourceImages.js';

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
