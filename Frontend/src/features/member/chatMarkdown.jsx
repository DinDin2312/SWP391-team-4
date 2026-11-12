import React from 'react';

/**
 * Tokenizes and parses inline markdown syntax (bold, italic, code, links).
 * Safely escapes all HTML since text nodes are rendered directly by React.
 * Links are validated: permits safe external http(s) protocols and internal app routes starting with '/'.
 */
function parseInline(text, keyPrefix = 'inline', options = {}) {
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
      const isInternalPath = linkUrl.startsWith('/');
      const isSafeHttp = /^https?:\/\//i.test(linkUrl);

      if (isInternalPath) {
        const isActionButtonLink = linkUrl.includes('/member/book-class') || linkUrl.includes('/member/package-store');
        elements.push(
          <a
            key={key}
            href={linkUrl}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof options?.onNavigate === 'function') {
                options.onNavigate(linkUrl);
              }
            }}
            className={isActionButtonLink
              ? "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-transform active:scale-95 cursor-pointer no-underline whitespace-nowrap"
              : "text-blue-500 hover:text-blue-600 underline font-medium cursor-pointer"
            }
          >
            {parseInline(linkText, `${key}-text`, options)}
            {isActionButtonLink && <span aria-hidden="true" className="text-[10px] ml-0.5">➔</span>}
          </a>
        );
      } else if (isSafeHttp) {
        elements.push(
          <a
            key={key}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline font-medium"
          >
            {parseInline(linkText, `${key}-text`, options)}
          </a>
        );
      } else {
        // Unsafe or unsupported protocol (e.g. javascript:) - render text only without executable href
        elements.push(
          <span key={key} className="text-[var(--text-muted)] font-medium">
            {parseInline(linkText, `${key}-text`, options)}
          </span>
        );
      }
    } else if (fullMatch.startsWith('**') && match[4]) {
      // Bold **text**
      elements.push(
        <strong key={key} className="font-semibold text-[var(--text)]">
          {parseInline(match[4], `${key}-b`, options)}
        </strong>
      );
    } else if (fullMatch.startsWith('*') && match[5]) {
      // Italic *text*
      elements.push(
        <em key={key} className="italic">
          {parseInline(match[5], `${key}-i`, options)}
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
 * Handles <br> or <br/> tags inside markdown table cells.
 */
function parseInlineWithBreaks(text, keyPrefix, options) {
  if (!text) return [];
  const parts = String(text).split(/<br\s*\/?>/i);
  if (parts.length === 1) {
    return parseInline(text, keyPrefix, options);
  }
  const result = [];
  parts.forEach((part, idx) => {
    if (idx > 0) {
      result.push(<br key={`${keyPrefix}-br-${idx}`} />);
    }
    result.push(...parseInline(part, `${keyPrefix}-p-${idx}`, options));
  });
  return result;
}

const isTableLine = (line) => {
  if (!line) return false;
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 2;
};

const isTableSeparator = (line) => {
  if (!line) return false;
  const t = line.trim();
  return /^\|(\s*:?-+:?\s*\|)+$/.test(t);
};

/**
 * Line-based safe Markdown parser for AI chat responses.
 * Converts headings, unordered/ordered lists, interactive tables, and paragraphs into React elements.
 */
export function renderChatMarkdown(text, options = {}) {
  if (!text || typeof text !== 'string') return [];

  // Auto-close unclosed bold markers during streaming so raw asterisks are not exposed
  let normalizedText = text;
  const boldCount = (normalizedText.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) {
    normalizedText += '**';
  }

  const lines = normalizedText.split(/\r?\n/);
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
            {parseInline(line, `p-${blockKey}-${idx}`, options)}
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

    // Markdown Table Check
    if (isTableLine(rawLine) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushList();
      flushParagraph();

      const headerCells = rawLine.split('|').slice(1, -1).map(c => c.trim());
      const rows = [];
      i += 2; // Jump past header line and separator line

      while (i < lines.length && isTableLine(lines[i])) {
        const rowCells = lines[i].split('|').slice(1, -1).map(c => c.trim());
        rows.push(rowCells);
        i++;
      }
      i--; // Adjust for loop increment

      elements.push(
        <div key={`table-wrapper-${blockKey++}`} className="w-full my-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-[var(--surface)] shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[340px]">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-[var(--text-muted)] font-bold border-b border-slate-200 dark:border-white/10 text-[11px] uppercase tracking-wider">
              <tr>
                {headerCells.map((h, hIdx) => (
                  <th key={hIdx} className="py-2 px-2.5 whitespace-nowrap font-semibold">
                    {parseInlineWithBreaks(h, `th-${blockKey}-${hIdx}`, options)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-xs">
              {rows.map((rowCells, rIdx) => {
                const rowRaw = rowCells.join(' ');
                const rowLinkMatch = rowRaw.match(/\[([^\]]+)\]\((\/member\/(?:book-class|package-store)[^)]*)\)/);
                const rowTargetUrl = rowLinkMatch ? rowLinkMatch[2] : null;

                return (
                  <tr
                    key={rIdx}
                    onClick={() => {
                      if (rowTargetUrl && typeof options?.onNavigate === 'function') {
                        options.onNavigate(rowTargetUrl);
                      }
                    }}
                    className={`transition-colors ${
                      rowTargetUrl
                        ? 'cursor-pointer hover:bg-blue-500/10 dark:hover:bg-blue-500/20 active:bg-blue-500/15 group'
                        : ''
                    }`}
                    title={rowTargetUrl ? 'Bấm vào hàng để xem và đăng ký lớp này' : undefined}
                  >
                    {rowCells.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-2.5 align-middle text-[12px] text-[var(--text)]">
                        {parseInlineWithBreaks(cell, `td-${blockKey}-${rIdx}-${cIdx}`, options)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
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
            {parseInline(headingContent, headingKey, options)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={headingKey} className="text-sm font-bold my-1.5 text-[var(--text)]">
            {parseInline(headingContent, headingKey, options)}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={headingKey} className="text-sm font-semibold my-1 text-[var(--text)]">
            {parseInline(headingContent, headingKey, options)}
          </h3>
        );
      }
      continue;
    }

    // Unordered list item (- item or * item)
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (currentListType && currentListType !== 'ul') {
        flushList();
      }
      currentListType = 'ul';
      currentListItems.push(parseInline(ulMatch[1], `ul-${blockKey}-${currentListItems.length}`, options));
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
      currentListItems.push(parseInline(olMatch[2], `ol-${blockKey}-${currentListItems.length}`, options));
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
export default function ChatMarkdown({ content, className = '', onNavigate }) {
  return (
    <div className={`chat-markdown-container space-y-1 ${className}`}>
      {renderChatMarkdown(content, { onNavigate })}
    </div>
  );
}
export { ChatMarkdown };
