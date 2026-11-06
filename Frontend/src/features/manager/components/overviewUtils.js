export const LOW_REGISTRATION_THRESHOLD = 0.25;
export const URGENT_WINDOW_HOURS = 6;
export const parseCenterTime = value => new Date(typeof value === 'string' && !/Z$|[+-]\d\d:\d\d$/.test(value) ? `${value}+07:00` : value);
export const centerDate = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parseCenterTime(value));
export const isLowRegistration = (row, now) => ['SCHEDULED','SUBSTITUTE_ASSIGNED','RESCHEDULED'].includes(row.status) && parseCenterTime(row.startTime) >= now && Number(row.booked || 0) / Math.max(1, Number(row.maxSlots)) < LOW_REGISTRATION_THRESHOLD;
export function sessionDisplayStatus(row, now) {
  if (['SCHEDULED','SUBSTITUTE_ASSIGNED','RESCHEDULED'].includes(row.status)) return parseCenterTime(row.startTime) <= now && now < parseCenterTime(row.endTime) ? 'Ongoing' : null;
  return row.status === 'COMPLETED' ? 'Completed' : row.status === 'CANCELLED' ? 'Cancelled' : null;
}
// Today and urgent arrays are complete. Attention is a server total, never a page length.
export function lowRegistrationBreakdown(data, now) {
  if (!Array.isArray(data?.todaySessions) || !Array.isArray(data?.urgentSessions) || !Number.isFinite(Number(data?.attentionPage?.total))) return null;
  const urgentIds = new Set(data.urgentSessions.map(row => row.scheduleId));
  const urgent = urgentIds.size;
  const today = new Set(data.todaySessions.filter(row => !urgentIds.has(row.scheduleId) && isLowRegistration(row, now)).map(row => row.scheduleId)).size;
  const upcoming = Number(data.attentionPage.total);
  if (urgent + today + upcoming !== Number(data.lowRegistrationSessions)) return null;
  return { urgent, today, upcoming };
}
export function relativeActivityTime(value, now) {
  const minutes = Math.max(0, Math.floor((now - parseCenterTime(value)) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes > 30 * 1440) return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(parseCenterTime(value));
  return `${Math.floor(minutes / 1440)}d ago`;
}
export function sessionCountdown(value, now) {
  const minutes = Math.max(0, Math.ceil((parseCenterTime(value) - now) / 60000));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

// Overview redesign helpers.
const ratio = (a, b) => (Number(b) > 0 ? Math.round((Number(a) / Number(b)) * 100) : 0);
export const fillPercent = pulse => ratio(pulse?.bookedSeatsToday, pulse?.totalSeatsToday);
// Past sessions collapse; the rest keep their order and the first non-finished one is "next".
export function splitTodaySchedule(rows, now) {
  const sorted = [...(rows || [])].filter(r => r.status !== 'CANCELLED').sort((a, b) => parseCenterTime(a.startTime) - parseCenterTime(b.startTime));
  const done = sorted.filter(r => r.status === 'COMPLETED' || parseCenterTime(r.endTime) <= now);
  const live = sorted.filter(r => !done.includes(r));
  const nowIndex = live.findIndex(r => parseCenterTime(r.startTime) > now);
  return { done, live, nowIndex: nowIndex === -1 ? live.length : nowIndex };
}
export function decisionLink(item, today) {
  if (item.type === 'RESCHEDULE') return '/admin/dashboard?view=reschedule';
  if (item.type === 'ESCALATION') return '/admin/dashboard?view=support';
  if (item.type === 'PAYMENT_REVIEW') return '/admin/dashboard?view=transactions&mode=invoices&status=REVIEW';
  const day = item.dueAt ? centerDate(item.dueAt) : today;
  return `/admin/dashboard?view=operations&tab=schedules&from=${day}&to=${day}&lowRegistration=true&status=SCHEDULED`;
}
