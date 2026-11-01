/**
 * Pure utility functions for parsing Server-Sent Events (SSE) streams and handling partial action tags.
 */

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
    // Find double newline marking end of an SSE block
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
      // Incomplete block, keep remaining in rest
      break;
    }

    const block = remaining.substring(0, delimiterIndex);
    remaining = remaining.substring(delimiterIndex + delimiterLength);

    let eventType = 'message';
    let dataLines = [];

    const lines = block.split(/\r?\n/);
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('event:')) {
        eventType = trimmedLine.substring(6).trim();
      } else if (line.startsWith('data:')) {
        // preserve leading whitespace in data if any, or trim start
        dataLines.push(line.substring(5).replace(/^\s/, ''));
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
 * Strips an unfinished trailing [ACTION:... tag so that it doesn't flash raw to the user while streaming.
 * Complete tags like [ACTION:BOOK_CLASS:5] are kept intact for later parsing on 'done'.
 * @param {string} text
 * @returns {string}
 */
export function stripPartialActionTag(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\[ACTION:[^\]]*$/, '').trimEnd();
}
