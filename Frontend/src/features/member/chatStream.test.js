import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSseChunk,
  parseDeltaPayload,
  parseStatusPayload,
  stripPartialActionTag,
  stripActionTagsForDisplay,
  sliceSafeText,
  nextTypewriterStep,
  createSmoothTypewriter,
  runSmoothAiChat
} from './chatStream.js';

function createSseResponse(chunks, ok = true, status = 200) {
  const encoder = new TextEncoder();
  let index = 0;
  return {
    ok,
    status,
    body: {
      getReader() {
        return {
          async read() {
            if (index >= chunks.length) {
              return { value: undefined, done: true };
            }
            return { value: encoder.encode(chunks[index++]), done: false };
          }
        };
      }
    }
  };
}

function createImmediateFrameScheduler() {
  let nextId = 1;
  const timers = new Map();
  return {
    scheduleFrame(cb) {
      const id = nextId++;
      const handle = setTimeout(cb, 0);
      timers.set(id, handle);
      return id;
    },
    cancelFrame(id) {
      const handle = timers.get(id);
      if (handle) clearTimeout(handle);
      timers.delete(id);
    }
  };
}

test('parseSseChunk parses complete SSE events', () => {
  const buffer = 'event: delta\ndata: Xin chào bạn\n\n';
  const result = parseSseChunk(buffer);

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].event, 'delta');
  assert.equal(result.events[0].data, 'Xin chào bạn');
  assert.equal(result.rest, '');
});

test('parseSseChunk handles chunk split across two packets', () => {
  const chunk1 = 'event: delta\ndata: {"text":"Phần';
  const res1 = parseSseChunk(chunk1);
  assert.equal(res1.events.length, 0);
  assert.equal(res1.rest, chunk1);

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

test('parseSseChunk handles empty inputs, CRLF, and no-space data prefix', () => {
  assert.deepEqual(parseSseChunk(null), { events: [], rest: '' });
  assert.deepEqual(parseSseChunk(''), { events: [], rest: '' });

  const crlfBuffer = 'event: delta\r\ndata:Hello\r\n\r\n';
  const res = parseSseChunk(crlfBuffer);
  assert.equal(res.events.length, 1);
  assert.equal(res.events[0].data, 'Hello');
});

test('parseDeltaPayload decodes JSON text and preserves plain strings', () => {
  assert.equal(parseDeltaPayload(''), '');
  assert.equal(parseDeltaPayload(null), '');
  assert.equal(parseDeltaPayload('{"text":"Xin chào\\n\\nCoach!"}'), 'Xin chào\n\nCoach!');
  assert.equal(parseDeltaPayload('{"other":1}'), '{"other":1}');
  assert.equal(parseDeltaPayload('{broken json'), '{broken json');
  assert.equal(parseDeltaPayload('plain delta'), 'plain delta');
});

test('parseStatusPayload decodes stage identifier cleanly', () => {
  assert.equal(parseStatusPayload(''), '');
  assert.equal(parseStatusPayload(null), '');
  assert.equal(parseStatusPayload('{"stage":"searching"}'), 'searching');
  assert.equal(parseStatusPayload('{invalid'), '');
  assert.equal(parseStatusPayload(' generating '), 'generating');
});

test('stripPartialActionTag preserves legacy behavior for trailing incomplete tags', () => {
  assert.equal(stripPartialActionTag(null), '');
  assert.equal(stripPartialActionTag('Chào bạn nha! [ACTION:ADD_CA'), 'Chào bạn nha!');
  assert.equal(stripPartialActionTag('Đang kiểm tra lớp... [ACTION:'), 'Đang kiểm tra lớp...');
  assert.equal(stripPartialActionTag('Không có action nào ở đây.'), 'Không có action nào ở đây.');
  assert.equal(
    stripPartialActionTag('Đã đặt xong [ACTION:BOOK_CLASS:12] và chào bạn'),
    'Đã đặt xong [ACTION:BOOK_CLASS:12] và chào bạn'
  );
});

test('stripActionTagsForDisplay hides both completed nested JSON actions and partial trailing actions', () => {
  assert.equal(stripActionTagsForDisplay(null), '');
  assert.equal(stripActionTagsForDisplay('Văn bản bình thường'), 'Văn bản bình thường');

  const coachStreaming =
    'Đã soạn xong giáo án!\n[ACTION:PREFILL_TRAINING_PLAN:{"title":"Tuần [1] \\"Nâng cao\\"","days":[{"ex":["Bench"]}]}]';
  assert.equal(stripActionTagsForDisplay(coachStreaming), 'Đã soạn xong giáo án!');

  const partial = 'Đang tạo lệnh... [ACTION:BOOK_CLASS:9';
  assert.equal(stripActionTagsForDisplay(partial), 'Đang tạo lệnh...');
});

test('sliceSafeText never splits emoji surrogate pairs', () => {
  const txt = 'Cố lên 💪 nhé';
  assert.equal(sliceSafeText(txt, 0), '');
  assert.equal(sliceSafeText(txt, 99), txt);
  // Index 8 splits high/low surrogate of '💪' (at indices 7-8)
  assert.equal(sliceSafeText(txt, 8), 'Cố lên 💪');
});

test('nextTypewriterStep adapts step speed smoothly', () => {
  assert.equal(nextTypewriterStep(10, 10, false), 0);
  assert.ok(nextTypewriterStep(0, 20, false) >= 2);
  assert.ok(nextTypewriterStep(0, 500, false) <= 10);
  assert.ok(nextTypewriterStep(0, 500, true) <= 18);
});

test('createSmoothTypewriter reveals progressively and resolves on finish and cancel', async () => {
  const frames = createImmediateFrameScheduler();
  const snapshots = [];
  const tw = createSmoothTypewriter({
    onUpdate: (text) => snapshots.push(text),
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });

  tw.push('Xin chào thành viên mới của NEXUS Sports Lab!');
  await tw.finish('Xin chào thành viên mới của NEXUS Sports Lab!');

  assert.ok(snapshots.length > 1, 'should emit multiple progressive text frames');
  assert.equal(snapshots[snapshots.length - 1], 'Xin chào thành viên mới của NEXUS Sports Lab!');

  // Subsequent shrink push + immediate finish when already caught up
  tw.push('Ngắn');
  await tw.finish('Ngắn');
  assert.equal(snapshots[snapshots.length - 1], 'Ngắn');

  // Cancel cleans pending frames cleanly
  const tw2 = createSmoothTypewriter({
    onUpdate: () => {},
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });
  tw2.push('Một đoạn văn bản rất dài đang chạy dở trên màn hình');
  tw2.cancel();
  await tw2.finish('ignored');
});

test('runSmoothAiChat streams SSE deltas smoothly through typewriter', async () => {
  const frames = createImmediateFrameScheduler();
  const stages = [];
  const texts = [];
  let finalized = null;
  let started = false;

  const mockFetch = async () =>
    createSseResponse([
      'event: status\ndata: {"stage":"searching"}\n\n',
      'event: delta\ndata: {"text":"Chào **bạn**! "}\n\n',
      'event: delta\ndata: {"text":"Lịch tập hôm nay rất tuyệt vời! [ACTION:BOOK_CLASS:5]"}\n\nevent: done\ndata: {"fullText":"Chào **bạn**! Lịch tập hôm nay rất tuyệt vời! [ACTION:BOOK_CLASS:5]","sources":[{"index":1,"title":"FAQ"}]}'
    ]);

  await runSmoothAiChat({
    streamUrl: '/api/v1/member/ai/chat/stream',
    fallbackUrl: '/api/v1/member/ai/chat',
    token: 'tok',
    message: 'Hi',
    history: [],
    normalizeFallback: (d) => d,
    onStartBubble: () => { started = true; },
    onStage: (s) => stages.push(s),
    onText: (t) => texts.push(t),
    onFinalize: async (res) => { finalized = res; },
    onError: () => { throw new Error('Should not error'); },
    fetchFn: mockFetch,
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });

  assert.equal(started, true);
  assert.ok(stages.includes('searching'));
  assert.ok(stages.includes('generating'));
  assert.ok(texts.every((t) => !t.includes('[ACTION:')), 'must never flash raw action tag while streaming');
  assert.equal(texts[texts.length - 1], 'Chào **bạn**! Lịch tập hôm nay rất tuyệt vời!');
  assert.deepEqual(finalized, {
    fullText: 'Chào **bạn**! Lịch tập hôm nay rất tuyệt vời! [ACTION:BOOK_CLASS:5]',
    sources: [{ index: 1, title: 'FAQ' }],
    interrupted: false
  });
});

test('runSmoothAiChat falls back to REST and STILL reveals text progressively', async () => {
  const frames = createImmediateFrameScheduler();
  const texts = [];
  let finalized = null;

  const mockFetch = async (url) => {
    if (url.endsWith('/stream')) {
      return createSseResponse(['event: error\ndata: temporary error\n\n']);
    }
    return {
      ok: true,
      async json() {
        return {
          text: 'Đây là phản hồi từ chế độ dự phòng được gõ ra mượt mà!',
          sources: [{ index: 1, title: 'Policy' }]
        };
      }
    };
  };

  await runSmoothAiChat({
    streamUrl: '/stream',
    fallbackUrl: '/chat',
    token: 'tok',
    message: 'Hi',
    history: [],
    normalizeFallback: (d) => ({ text: d.text || '', sources: d.sources || [] }),
    onStartBubble: () => {},
    onStage: () => {},
    onText: (t) => texts.push(t),
    onFinalize: async (res) => { finalized = res; },
    onError: () => { throw new Error('Should not error'); },
    fetchFn: mockFetch,
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });

  assert.ok(texts.length > 1, 'fallback response should animate across multiple progressive steps');
  assert.equal(texts[texts.length - 1], 'Đây là phản hồi từ chế độ dự phòng được gõ ra mượt mà!');
  assert.equal(finalized.sources[0].title, 'Policy');
});

test('runSmoothAiChat handles partial interruption, abort signal, and double failure cleanly', async () => {
  const frames = createImmediateFrameScheduler();

  // 1. Mid-stream interruption after emitting partial chunk
  let partialResult = null;
  let callCount = 0;
  await runSmoothAiChat({
    streamUrl: '/stream',
    fallbackUrl: '/chat',
    token: 'tok',
    message: 'Hi',
    history: [],
    normalizeFallback: (d) => d,
    onStartBubble: () => {},
    onStage: () => {},
    onText: () => {},
    onFinalize: async (res) => { partialResult = res; },
    onError: () => { throw new Error('Should recover partial stream'); },
    fetchFn: async () => ({
      ok: true,
      body: {
        getReader() {
          return {
            async read() {
              callCount++;
              if (callCount === 1) {
                return { value: new TextEncoder().encode('event: delta\ndata: {"text":"Một phần nội dung"}\n\n'), done: false };
              }
              throw new Error('Network dropped');
            }
          };
        }
      }
    }),
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });
  assert.equal(partialResult.interrupted, true);
  assert.equal(partialResult.fullText, 'Một phần nội dung');

  // 2. Both stream & fallback fail -> calls onError
  let caughtErr = null;
  await runSmoothAiChat({
    streamUrl: '/stream',
    fallbackUrl: '/chat',
    token: 'tok',
    message: 'Hi',
    history: [],
    normalizeFallback: (d) => d,
    onStartBubble: () => {},
    onStage: () => {},
    onText: () => {},
    onFinalize: async () => {},
    onError: (err) => { caughtErr = err; },
    fetchFn: async () => ({ ok: false, status: 503 }),
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });
  assert.ok(caughtErr instanceof Error);

  // 3. Abort signal cancels cleanly without calling onError or onFinalize
  const ac = new AbortController();
  let abortedFinalize = false;
  let abortedErr = false;
  ac.abort();
  await runSmoothAiChat({
    streamUrl: '/stream',
    fallbackUrl: '/chat',
    token: 'tok',
    message: 'Hi',
    history: [],
    signal: ac.signal,
    normalizeFallback: (d) => d,
    onStartBubble: () => {},
    onStage: () => {},
    onText: () => {},
    onFinalize: async () => { abortedFinalize = true; },
    onError: () => { abortedErr = true; },
    fetchFn: async () => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    },
    scheduleFrame: frames.scheduleFrame,
    cancelFrame: frames.cancelFrame
  });
  assert.equal(abortedFinalize, false);
  assert.equal(abortedErr, false);
});
