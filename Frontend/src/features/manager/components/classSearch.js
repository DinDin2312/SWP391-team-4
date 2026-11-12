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
  return match ? { code: match[1].trim(), name: match[2].trim() } : { code: '', name: String(className ?? '').trim() };
}

const SUBJECT_PREFIXES = [
  ['gym', 'GYM'],
  ['the hinh', 'GYM'],
  ['yoga', 'YOGA'],
  ['zumba', 'ZUMBA'],
  ['boi', 'SWIM'],
  ['swim', 'SWIM'],
  ['dap xe', 'SPIN'],
  ['spin', 'SPIN'],
  ['cycling', 'SPIN'],
  ['box', 'BOX'],
  ['kickfit', 'BOX'],
  ['pilates', 'PILATES'],
  ['dance', 'DANCE'],
  ['aerobic', 'DANCE'],
];

export function subjectCodePrefix(subjectName) {
  const folded = fold(subjectName).replace(/[^a-z0-9\s]/g, ' ').trim();
  if (!folded) return 'CLS';
  for (const [keyword, prefix] of SUBJECT_PREFIXES) {
    if (folded.includes(keyword)) return prefix;
  }
  const firstWord = folded.split(/\s+/).find(token => token.length >= 2) || folded.replace(/\s+/g, '');
  return (firstWord.slice(0, 8) || 'CLS').toUpperCase();
}

export function classLevelFromCode(code) {
  const match = String(code ?? '').trim().match(/-(\d+)$/);
  if (!match) return '';
  const num = Number(match[1]);
  if (num >= 100 && num < 200) return '1';
  if (num >= 200 && num < 300) return '2';
  if (num >= 300 && num < 400) return '3';
  return '';
}

export function nextClassCode(classes = [], subjects = [], subjectId, levelBand = 1) {
  const subject = subjects.find(s => String(s.subjectId) === String(subjectId));
  if (!subject) return '';
  const prefix = subjectCodePrefix(subject.subjectName);
  const band = [1, 2, 3].includes(Number(levelBand)) ? Number(levelBand) : 1;
  const bandStart = band * 100;
  const bandEnd = bandStart + 99;
  const usedNumbers = new Set();
  let maxInBand = bandStart;
  const codePattern = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  for (const row of classes) {
    const { code } = splitCode(row?.className);
    const match = code.match(codePattern);
    if (!match) continue;
    const num = Number(match[1]);
    if (!Number.isFinite(num)) continue;
    usedNumbers.add(num);
    if (num >= bandStart && num <= bandEnd && num > maxInBand) {
      maxInBand = num;
    }
  }

  let candidate = maxInBand + 1;
  while (usedNumbers.has(candidate)) {
    candidate += 1;
  }
  return `${prefix}-${candidate}`;
}

export function formatClassNameWithCode(code, title) {
  const cleanCode = String(code ?? '').trim().replace(/^\[+|\]+$/g, '').toUpperCase();
  const cleanTitle = splitCode(title).name.trim();
  if (!cleanCode) return cleanTitle;
  return cleanTitle ? `[${cleanCode}] ${cleanTitle}` : `[${cleanCode}]`;
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

// Generic option search for SearchSelect: options are { value, label, hint?, group? }.
// Every token must match label or hint; label-prefix matches rank first; group order is kept.
export function searchOptions(options, query, limit = 50) {
  const tokens = fold(query).split(/\s+/).filter(Boolean);
  const matched = [];
  options.forEach((option, order) => {
    const label = fold(option.label), hay = `${label} ${fold(option.hint)}`;
    if (!tokens.every(token => hay.includes(token))) return;
    const score = tokens.reduce((sum, token) => sum + (label.startsWith(token) ? 3 : label.includes(token) ? 1 : 0), 0);
    matched.push({ option, order, score });
  });
  if (tokens.length) matched.sort((a, b) => (a.option.group ?? 0) - (b.option.group ?? 0) || b.score - a.score || a.order - b.order);
  return { total: matched.length, items: matched.slice(0, limit).map(item => item.option) };
}
