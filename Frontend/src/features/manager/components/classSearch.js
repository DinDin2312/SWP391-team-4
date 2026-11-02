// Pure helpers for the searchable class picker (kept framework-free so they can be unit-tested).

// Lower-case and strip Vietnamese diacritics one character at a time, so index i of the result
// still points at character i of the original text (needed to highlight matches).
export function foldChar(char) {
  if (char === 'đ' || char === 'Đ') return 'd';
  const folded = char.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return folded.length === 1 ? folded : char.toLowerCase();
}
export const fold = text => Array.from(String(text ?? ''), foldChar).join('');

// "[YOGA-101] Yoga Giãn Cơ" -> { code: 'YOGA-101', name: 'Yoga Giãn Cơ' }
export function splitCode(className) {
  const match = String(className ?? '').match(/^\s*\[([^\]]+)\]\s*(.*)$/);
  return match ? { code: match[1], name: match[2] } : { code: '', name: String(className ?? '') };
}

const fields = row => [row.className, row.subjectName, row.coachName, row.roomName];

// Every query token must appear somewhere in the class; better matches (code/name prefix) rank first.
export function searchClasses(rows, query, { subjectId = '', limit = 50 } = {}) {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  const scored = [];
  for (const row of rows) {
    if (subjectId && String(row.subjectId) !== String(subjectId)) continue;
    const haystack = fold(fields(row).join(' '));
    if (!tokens.every(token => haystack.includes(token))) continue;
    const { code, name } = splitCode(row.className);
    const foldedCode = fold(code), foldedName = fold(name);
    let score = 0;
    for (const token of tokens) {
      if (foldedCode.startsWith(token)) score += 6;
      else if (foldedCode.includes(token)) score += 4;
      if (foldedName.startsWith(token)) score += 3;
      else if (foldedName.includes(token)) score += 2;
    }
    scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score || String(a.row.subjectName ?? '').localeCompare(String(b.row.subjectName ?? ''), 'vi') || String(a.row.className).localeCompare(String(b.row.className), 'vi'));
  return { total: scored.length, items: scored.slice(0, limit).map(item => item.row) };
}

// Split text into [{ text, match }] parts for highlighting the query tokens (diacritic-insensitive).
export function highlightParts(text, query) {
  const source = String(text ?? '');
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  if (!tokens.length || !source) return [{ text: source, match: false }];
  const folded = fold(source);
  const marks = new Array(source.length).fill(false);
  for (const token of tokens) {
    let from = folded.indexOf(token);
    while (from !== -1) { marks.fill(true, from, from + token.length); from = folded.indexOf(token, from + token.length); }
  }
  const parts = [];
  for (let i = 0; i < source.length; i += 1) {
    const last = parts[parts.length - 1];
    if (last && last.match === marks[i]) last.text += source[i]; else parts.push({ text: source[i], match: marks[i] });
  }
  return parts;
}

export function subjectOptions(rows) {
  const subjects = new Map();
  rows.forEach(row => { if (row.subjectId != null) { const entry = subjects.get(row.subjectId) || { subjectId: row.subjectId, subjectName: row.subjectName, count: 0 }; entry.count += 1; subjects.set(row.subjectId, entry); } });
  return [...subjects.values()].sort((a, b) => String(a.subjectName ?? '').localeCompare(String(b.subjectName ?? ''), 'vi'));
}
