import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSseChunk, stripPartialActionTag } from './chatStream.js';

test('parseSseChunk parses complete SSE events', () => {
  const buffer = 'event: delta\ndata: Xin chào bạn\n\n';
  const result = parseSseChunk(buffer);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].event, 'delta');
  assert.equal(result.events[0].data, 'Xin chào bạn');
  assert.equal(result.rest, '');
});

test('parseSseChunk handles chunk split across two packets', () => {
  // First chunk has incomplete block
  const chunk1 = 'event: delta\ndata: {"text":"Phần';
  const res1 = parseSseChunk(chunk1);
  assert.equal(res1.events.length, 0);
  assert.equal(res1.rest, chunk1);

  // Second chunk arrives and completes the block
  const chunk2 = res1.rest + ' 1"}\n\nevent: delta\ndata: {"text":"Phần 2"}\n\n';
  const res2 = parseSseChunk(chunk2);
  assert.equal(res2.events.length, 2);
  assert.equal(res2.events[0].event, 'delta');
  assert.equal(res2.events[0].data, '{"text":"Phần 1"}');
  assert.equal(res2.events[1].data, '{"text":"Phần 2"}');
  assert.equal(res2.rest, '');
});

test('parseSseChunk handles done event with sources json payload', () => {
  const buffer = 'event: done\ndata: {"sources":[{"index":1,"title":"Nội quy"}]}\n\n';
  const result = parseSseChunk(buffer);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].event, 'done');
  assert.ok(result.events[0].data.includes('Nội quy'));
});

test('stripPartialActionTag hides trailing incomplete action tags', () => {
  const text1 = 'Chào bạn nha! [ACTION:ADD_CA';
  assert.equal(stripPartialActionTag(text1), 'Chào bạn nha!');

  const text2 = 'Đang kiểm tra lớp... [ACTION:';
  assert.equal(stripPartialActionTag(text2), 'Đang kiểm tra lớp...');

  const text3 = 'Không có action nào ở đây.';
  assert.equal(stripPartialActionTag(text3), 'Không có action nào ở đây.');

  const text4 = 'Đã đặt xong [ACTION:BOOK_CLASS:12] và chào bạn';
  assert.equal(stripPartialActionTag(text4), 'Đã đặt xong [ACTION:BOOK_CLASS:12] và chào bạn');
});

test('parseSseChunk handles empty inputs and CRLF line endings', () => {
  assert.deepEqual(parseSseChunk(null), { events: [], rest: '' });
  assert.deepEqual(parseSseChunk(''), { events: [], rest: '' });

  const crlfBuffer = 'event: delta\r\ndata: Hello\r\n\r\n';
  const res = parseSseChunk(crlfBuffer);
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].data, 'Hello');
});
