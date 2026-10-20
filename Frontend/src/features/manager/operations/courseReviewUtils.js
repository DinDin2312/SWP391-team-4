import { addDays } from './operationsUtils';

export function courseWeeks(plan,excludedDates=[],fromDate) {
  const entries=(plan.requestedSessions || plan.sessions).map(session=>({...session,
    conflict:plan.conflicts?.some(c=>c.startTime===session.startTime)}));
  if(!entries.length)return [];
  const dates=entries.map(s=>s.startTime.slice(0,10)).sort();
  const first=fromDate || dates[0],last=dates.at(-1);
  const monday=date=>addDays(date,-((new Date(`${date}T12:00:00`).getDay()+6)%7));
  const weeks=new Map();
  const add=(date,entry)=>{const key=monday(date);if(!weeks.has(key))weeks.set(key,[]);weeks.get(key).push(entry);};
  entries.forEach(s=>add(s.startTime.slice(0,10),s));
  excludedDates.filter(date=>date>=first && date<=last).forEach(date=>add(date,{date,excluded:true}));
  return [...weeks].sort(([a],[b])=>a.localeCompare(b)).map(([start,sessions])=>({start,end:addDays(start,6),sessions:sessions.sort((a,b)=>(a.date || a.startTime).localeCompare(b.date || b.startTime))}));
}

