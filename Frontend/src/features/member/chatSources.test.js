import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChatResponse } from './chatSources.js';

test('normalizeChatResponse handles string responses', () => {
  const result = normalizeChatResponse('Câu trả lời dạng chuỗi thuần');
  assert.equal(result.text, 'Câu trả lời dạng chuỗi thuần');
  assert.deepEqual(result.sources, []);
});

test('normalizeChatResponse handles object responses with sources', () => {
  const input = {
    text: 'Câu trả lời có trích dẫn [1]',
    sources: [
      { index: 1, title: 'Chính sách trung tâm', category: 'POLICY' }
    ]
  };
  const result = normalizeChatResponse(input);
  assert.equal(result.text, 'Câu trả lời có trích dẫn [1]');
  assert.equal(result.sources.length, 1);
  assert.equal(result.sources[0].title, 'Chính sách trung tâm');
});

test('normalizeChatResponse handles object responses with missing sources', () => {
  const input = { text: 'Câu trả lời không có sources' };
  const result = normalizeChatResponse(input);
  assert.equal(result.text, 'Câu trả lời không có sources');
  assert.deepEqual(result.sources, []);
});

test('normalizeChatResponse handles null and undefined gracefully', () => {
  assert.deepEqual(normalizeChatResponse(null), { text: '', sources: [] });
  assert.deepEqual(normalizeChatResponse(undefined), { text: '', sources: [] });
  assert.deepEqual(normalizeChatResponse(123), { text: '123', sources: [] });
});
