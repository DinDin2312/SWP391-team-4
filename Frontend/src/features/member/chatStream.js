/**
 * Shared SSE stream parsing, action-tag sanitization, and 60fps smooth typewriter
 * utilities used by both Member and Coach NEXUS AI chat widgets.
 */

const defaultScheduleFrame = (cb) => {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return globalThis.requestAnimationFrame(cb);
  }
  return setTimeout(cb, 16);
};

const defaultCancelFrame = (id) => {
  if (typeof globalThis.cancelAnimationFrame === 'function') {
    globalThis.cancelAnimationFrame(id);
    return;
  }
  clearTimeout(id);
};

/**
 * Parses a buffer of SSE text into discrete events and returns any incomplete trailing rest.
 * @param {string} buffer
 * @returns {{ events: Array<{event: string, data: string}>, rest: string }}
 */
export function parseSseChunk(buffer) {
  if (!buffer || typeof buffer !== 'string') {
    return { events: [], rest: '' };
  }

  const events = [];
  let remaining = buffer;

  while (true) {
    const crlfIndex = remaining.indexOf('\r\n\r\n');
    const lfIndex = remaining.indexOf('\n\n');

    let delimiterIndex = -1;
    let delimiterLength = 2;

    if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
      delimiterIndex = crlfIndex;
      delimiterLength = 4;
    } else if (lfIndex !== -1) {
      delimiterIndex = lfIndex;
      delimiterLength = 2;
    }

    if (delimiterIndex === -1) {
      break;
    }

    const block = remaining.substring(0, delimiterIndex);
    remaining = remaining.substring(delimiterIndex + delimiterLength);

    let eventType = 'message';
    const dataLines = [];

    const lines = block.split(/\r?\n/);
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('event:')) {
        eventType = trimmedLine.substring(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.startsWith('data: ') ? line.slice(6) : line.slice(5));
      }
    }

    if (dataLines.length > 0 || eventType !== 'message') {
      events.push({
        event: eventType,
        data: dataLines.join('\n')
      });
    }
  }

  return { events, rest: remaining };
}

/**
 * Decodes an SSE delta payload (supports both JSON {"text":"..."} and plain text).
 */
export function parseDeltaPayload(rawData) {
  if (typeof rawData !== 'string' || !rawData) return '';
  if (rawData.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed.text === 'string') {
        return parsed.text;
      }
    } catch {
      // Plain text chunk starting with '{' falls back as-is.
    }
  }
  return rawData;
}

/**
 * Decodes an SSE status payload into a stage identifier ("searching" | "generating").
 */
export function parseStatusPayload(rawData) {
  if (typeof rawData !== 'string' || !rawData) return '';
  if (rawData.startsWith('{')) {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed.stage === 'string') {
        return parsed.stage;
      }
    } catch {
      return '';
    }
  }
  return rawData.trim();
}

/**
 * Strips an unfinished trailing [ACTION:... tag so that it doesn't flash raw to the user while streaming.
 * Complete tags like [ACTION:BOOK_CLASS:5] are kept intact for callers expecting trailing-only stripping.
 * @param {string} text
 * @returns {string}
 */
export function stripPartialActionTag(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\[ACTION:[^\]]*$/, '').trimEnd();
}

/**
 * Removes BOTH completed [ACTION:...] blocks (with balanced bracket & string awareness)
 * and incomplete trailing [ACTION:... blocks so raw commands/JSON never flash during streaming.
 */
export function stripActionTagsForDisplay(text) {
  if (!text || typeof text !== 'string') return '';
  let result = '';
  let cursor = 0;

  while (cursor < text.length) {
    const idx = text.indexOf('[ACTION:', cursor);
    if (idx === -1) {
      result += text.slice(cursor);
      break;
    }

    result += text.slice(cursor, idx);

    let depth = 0;
    let inString = false;
    let escaped = false;
    let endIdx = -1;

    for (let i = idx; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
      } else if (ch === '[') {
        depth++;
      } else if (ch === ']') {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx === -1) {
      break;
    }
    cursor = endIdx + 1;
  }

  return result.trimEnd();
}

/**
 * Slices UTF-16 text cleanly without splitting high/low emoji surrogate pairs.
 */
export function sliceSafeText(text, targetLen) {
  if (!text || targetLen <= 0) return '';
  if (targetLen >= text.length) return text;

  let safeEnd = targetLen;
  const lastCode = text.charCodeAt(safeEnd - 1);
  if (lastCode >= 0xd800 && lastCode <= 0xdbff && safeEnd < text.length) {
    safeEnd += 1;
  }
  return text.slice(0, safeEnd);
}

/**
 * Calculates how many characters to advance on the next animation frame.
 */
export function nextTypewriterStep(revealedLength, targetLength, isStreamDone) {
  const remaining = targetLength - revealedLength;
  if (remaining <= 0) return 0;
  if (isStreamDone) {
    return Math.min(18, Math.max(2, Math.ceil(remaining / 20)));
  }
  return Math.min(10, Math.max(2, Math.ceil(remaining / 16)));
}

/**
 * Smooth progressive text buffer driven by requestAnimationFrame (with setTimeout fallback).
 */
export function createSmoothTypewriter({
  onUpdate,
  scheduleFrame = defaultScheduleFrame,
  cancelFrame = defaultCancelFrame
}) {
  let targetText = '';
  let revealedLen = 0;
  let streamEnded = false;
  let frameId = null;
  let cancelled = false;
  const doneResolvers = [];

  const resolveWaiters = () => {
    while (doneResolvers.length > 0) {
      doneResolvers.shift()();
    }
  };

  const step = () => {
    frameId = null;
    if (cancelled) return;

    const advance = nextTypewriterStep(revealedLen, targetText.length, streamEnded);
    if (advance > 0) {
      const nextSlice = sliceSafeText(targetText, revealedLen + advance);
      revealedLen = nextSlice.length;
      onUpdate(nextSlice);
    }

    if (revealedLen < targetText.length) {
      frameId = scheduleFrame(step);
    } else if (streamEnded) {
      resolveWaiters();
    }
  };

  const ensureScheduled = () => {
    if (!cancelled && frameId === null && revealedLen < targetText.length) {
      frameId = scheduleFrame(step);
    }
  };

  return {
    push(nextText) {
      if (cancelled) return;
      const safeNext = typeof nextText === 'string' ? nextText : '';
      if (safeNext.length < revealedLen) {
        revealedLen = safeNext.length;
      }
      targetText = safeNext;
      ensureScheduled();
    },

    finish(finalText) {
      if (cancelled) return Promise.resolve();
      if (typeof finalText === 'string') {
        if (finalText.length < revealedLen) {
          revealedLen = finalText.length;
        }
        targetText = finalText;
      }
      streamEnded = true;

      if (revealedLen >= targetText.length) {
        onUpdate(targetText);
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        doneResolvers.push(resolve);
        ensureScheduled();
      });
    },

    cancel() {
      cancelled = true;
      if (frameId !== null) {
        cancelFrame(frameId);
        frameId = null;
      }
      resolveWaiters();
    }
  };
}

/**
 * Orchestrates live SSE streaming + REST fallback, always draining text through
 * the smooth progressive typewriter so text glides out evenly without sudden jumps.
 */
export async function runSmoothAiChat({
  streamUrl,
  fallbackUrl,
  token,
  message,
  history,
  normalizeFallback,
  onStartBubble,
  onStage,
  onText,
  onFinalize,
  onError,
  signal,
  fetchFn = globalThis.fetch,
  scheduleFrame,
  cancelFrame
}) {
  onStartBubble();

  const typewriter = createSmoothTypewriter({
    onUpdate: onText,
    scheduleFrame,
    cancelFrame
  });

  const handleAbort = () => typewriter.cancel();
  signal?.addEventListener?.('abort', handleAbort, { once: true });

  let streamedAnyChunk = false;
  let accumulatedRaw = '';

  const processEvents = (events, state) => {
    for (const evt of events) {
      if (evt.event === 'status') {
        const stage = parseStatusPayload(evt.data);
        if (stage) onStage(stage);
      } else if (evt.event === 'delta') {
        streamedAnyChunk = true;
        onStage('generating');
        accumulatedRaw += parseDeltaPayload(evt.data);
        typewriter.push(stripActionTagsForDisplay(accumulatedRaw));
      } else if (evt.event === 'done') {
        try {
          state.donePayload = JSON.parse(evt.data);
        } catch {
          // Ignore malformed done payload.
        }
      } else if (evt.event === 'error') {
        throw new Error(evt.data || 'Stream error');
      }
    }
  };

  try {
    const response = await fetchFn(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ message, history }),
      signal
    });

    if (!response.ok || !response.body) {
      throw new Error('Stream request not ok: ' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamBuffer = '';
    const state = { donePayload: null };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamBuffer += decoder.decode(value, { stream: true });
      const parsed = parseSseChunk(streamBuffer);
      streamBuffer = parsed.rest;
      processEvents(parsed.events, state);
    }

    streamBuffer += decoder.decode();
    if (streamBuffer.trim()) {
      const trailing = parseSseChunk(streamBuffer + '\n\n');
      processEvents(trailing.events, state);
    }

    const fullText = (state.donePayload && state.donePayload.fullText) || accumulatedRaw;
    const sources = (state.donePayload && state.donePayload.sources) || [];

    await typewriter.finish(stripActionTagsForDisplay(fullText));
    if (signal?.aborted) return;

    await onFinalize({ fullText, sources, interrupted: false });
  } catch (streamErr) {
    if (signal?.aborted || streamErr?.name === 'AbortError') {
      typewriter.cancel();
      return;
    }

    if (!streamedAnyChunk) {
      try {
        onStage('generating');
        const fallbackRes = await fetchFn(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ message, history }),
          signal
        });

        if (!fallbackRes.ok) {
          throw new Error('Fallback request failed: ' + fallbackRes.status);
        }

        const payload = await fallbackRes.json();
        const normalized = normalizeFallback(payload);
        const rawText = normalized.text || '';
        const sources = normalized.sources || [];

        typewriter.push(stripActionTagsForDisplay(rawText));
        await typewriter.finish(stripActionTagsForDisplay(rawText));
        if (signal?.aborted) return;

        await onFinalize({ fullText: rawText, sources, interrupted: false });
      } catch (fallbackErr) {
        typewriter.cancel();
        if (signal?.aborted || fallbackErr?.name === 'AbortError') return;
        onError(fallbackErr);
      }
      return;
    }

    await typewriter.finish(stripActionTagsForDisplay(accumulatedRaw));
    if (!signal?.aborted) {
      await onFinalize({ fullText: accumulatedRaw, sources: [], interrupted: true });
    }
  } finally {
    signal?.removeEventListener?.('abort', handleAbort);
  }
}
