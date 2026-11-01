import React from 'react';

/**
 * Tokenizes and parses inline markdown syntax (bold, italic, code, links).
 * Safely escapes all HTML since text nodes are rendered directly by React.
 * Links are strictly validated to permit only http: and https: protocols.
 */
function parseInline(text, keyPrefix = 'inline') {
  if (!text) return [];

  const elements = [];
  let remaining = text;
  let index = 0;

  // Regex patterns for inline formatting
  const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/;

  while (remaining.length > 0) {
    const match = tokenRegex.exec(remaining);
    if (!match) {
      elements.push(remaining);
      break;
    }

    const matchStart = match.index;
    if (matchStart > 0) {
      elements.push(remaining.substring(0, matchStart));
    }

    const fullMatch = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (fullMatch.startsWith('[') && match[2] && match[3]) {
      // Markdown link [text](url)
      const linkText = match[2];
      const linkUrl = match[3].trim();
      const isSafeHttp = /^https?:\/\//i.test(linkUrl);

      if (isSafeHttp) {
        elements.push(
          <a
            key={key}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline font-medium"
          >
            {parseInline(linkText, `${key}-text`)}
          </a>
        );
      } else {
        // Unsafe or unsupported protocol (e.g. javascript:) - render text only without executable href
        elements.push(
          <span key={key} className="text-[var(--text-muted)] font-medium">
            {parseInline(linkText, `${key}-text`)}
          </span>
        );
      }
    } else if (fullMatch.startsWith('**') && match[4]) {
      // Bold **text**
      elements.push(
        <strong key={key} className="font-semibold text-[var(--text)]">
          {parseInline(match[4], `${key}-b`)}
        </strong>
      );
    } else if (fullMatch.startsWith('*') && match[5]) {
      // Italic *text*
      elements.push(
        <em key={key} className="italic">
          {parseInline(match[5], `${key}-i`)}
        </em>
      );
    } else if (fullMatch.startsWith('`') && match[6]) {
      // Inline code `code`
      elements.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-xs font-mono">
          {match[6]}
        </code>
      );
    } else {
      elements.push(fullMatch);
    }

    remaining = remaining.substring(matchStart + fullMatch.length);
  }

  return elements;
}

/**
 * Line-based safe Markdown parser for AI chat responses.
 * Converts headings, unordered/ordered lists, and paragraphs into React elements.
 */
export function renderChatMarkdown(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/);
  const elements = [];
  let blockKey = 0;

  let currentListType = null; // 'ul' | 'ol'
  let currentListItems = [];
  let currentParagraph = [];

  const flushList = () => {
    if (!currentListType || currentListItems.length === 0) return;
    const ListTag = currentListType;
    const className = currentListType === 'ul'
      ? 'list-disc list-inside space-y-1 my-1.5 pl-1'
      : 'list-decimal list-inside space-y-1 my-1.5 pl-1';

    elements.push(
      <ListTag key={`list-${blockKey++}`} className={className}>
        {currentListItems.map((item, idx) => (
          <li key={`li-${idx}`} className="text-[13.5px]">
            {item}
          </li>
        ))}
      </ListTag>
    );
    currentListType = null;
    currentListItems = [];
  };

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return;
    elements.push(
      <p key={`p-${blockKey++}`} className="my-1.5 leading-relaxed text-[13.5px]">
        {currentParagraph.map((line, idx) => (
          <React.Fragment key={`p-line-${idx}`}>
            {idx > 0 && <br />}
            {parseInline(line, `p-${blockKey}-${idx}`)}
          </React.Fragment>
        ))}
      </p>
    );
    currentParagraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Blank line indicates paragraph / block separation
    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    // Heading 1-3
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      flushParagraph();
      const level = headingMatch[1].length;
      const headingContent = headingMatch[2];
      const headingKey = `h-${blockKey++}`;

      if (level === 1) {
        elements.push(
          <h1 key={headingKey} className="text-base font-bold my-2 text-[var(--text)]">
            {parseInline(headingContent, headingKey)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={headingKey} className="text-sm font-bold my-1.5 text-[var(--text)]">
            {parseInline(headingContent, headingKey)}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={headingKey} className="text-sm font-semibold my-1 text-[var(--text)]">
            {parseInline(headingContent, headingKey)}
          </h3>
        );
      }
      continue;
    }

    // Unordered list item (- item or * item)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (currentListType && currentListType !== 'ul') {
        flushList();
      }
      currentListType = 'ul';
      currentListItems.push(parseInline(ulMatch[1], `ul-${blockKey}-${currentListItems.length}`));
      continue;
    }

    // Ordered list item (1. item)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (currentListType && currentListType !== 'ol') {
        flushList();
      }
      currentListType = 'ol';
      currentListItems.push(parseInline(olMatch[2], `ol-${blockKey}-${currentListItems.length}`));
      continue;
    }

    // Regular line inside a paragraph
    flushList();
    currentParagraph.push(rawLine);
  }

  // Flush remaining blocks
  flushList();
  flushParagraph();

  return elements;
}

/**
 * Convenient React component for rendering AI Markdown content safely.
 */
export default function ChatMarkdown({ content, className = '' }) {
  return (
    <div className={`chat-markdown-container space-y-1 ${className}`}>
      {renderChatMarkdown(content)}
    </div>
  );
}
export { ChatMarkdown };
