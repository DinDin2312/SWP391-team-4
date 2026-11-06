// Everything in the app is shown and entered in Vietnam time (UTC+7), whatever the device clock says.
export const VN_TZ = 'Asia/Ho_Chi_Minh';
const pad = n => String(n).padStart(2, '0');
const parts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: VN_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(p => [p.type, p.value]));

/** yyyy-mm-dd for a moment (default now) in Vietnam. */
export const vnDateKey = (date = new Date()) => { const p = parts(date); return `${p.year}-${p.month}-${p.day}`; };
export const vnToday = () => vnDateKey();
/** yyyy-mm-ddTHH:mm for a moment in Vietnam, the format datetime inputs and the API use. */
export const vnDateTimeKey = (date = new Date()) => { const p = parts(date); return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`; };
/** Adds days to a yyyy-mm-dd key without touching time zones. */
export const addDaysKey = (key, days) => { const [y, m, d] = key.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + days)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };

// Display helpers: day/month/year and 24-hour time.
export const isoToVnDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
export const isoToVnDateTime = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : ''; };

function validDate(y, m, d) { const t = new Date(Date.UTC(y, m - 1, d)); return y >= 1900 && y <= 2100 && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }
/** Parses what a person typed (dd/mm/yyyy, HH:mm or both) into the ISO value; '' when blank, null when incomplete or invalid. */
export function parseVnInput(text, type) {
  const s = String(text || '').trim();
  if (!s) return '';
  if (type === 'time') { const m = /^(\d{1,2}):(\d{2})$/.exec(s); return m && +m[1] < 24 && +m[2] < 60 ? `${pad(m[1])}:${m[2]}` : null; }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(s);
  if (!m || !validDate(+m[3], +m[2], +m[1])) return null;
  const date = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  if (type === 'date') return m[4] === undefined ? date : null;
  if (m[4] === undefined || +m[4] > 23 || +m[5] > 59) return null;
  return `${date}T${pad(m[4])}:${m[5]}`;
}
/** ISO value → text shown in the box. */
export function formatVnInput(value, type) {
  if (!value) return '';
  if (type === 'time') return String(value).slice(0, 5);
  return type === 'date' ? isoToVnDate(value) : isoToVnDateTime(value);
}
/** Inserts / : and the space as digits are typed. */
export function maskVnInput(text, type) {
  const digits = String(text).replace(/\D/g, '');
  if (type === 'time') { const d = digits.slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d; }
  const d = digits.slice(0, type === 'date' ? 8 : 12);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `/${d.slice(2, 4)}`;
  if (d.length > 4) out += `/${d.slice(4, 8)}`;
  if (d.length > 8) out += ` ${d.slice(8, 10)}`;
  if (d.length > 10) out += `:${d.slice(10, 12)}`;
  return out;
}
