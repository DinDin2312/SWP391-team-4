import { filterSchedules, sessionDay } from './operationsUtils.js';
const oneOf = (value, options, fallback) => options.includes(value) ? value : fallback;
const positive = value => Math.max(1, parseInt(value,10) || 1);
export function normalizeOperationsQuery(query) {
  const next = new URLSearchParams(query);
  const resource = oneOf(next.get('catalog'), ['subjects', 'rooms'], 'subjects');
  if (next.get('tab') === 'catalog') next.set('tab', resource);
  for (const [legacy, current] of [['catalogQuery', `${resource}Query`], ['catalogPage', `${resource}Page`]]) {
    if (next.has(legacy) && !next.has(current)) next.set(current, next.get(legacy));
    next.delete(legacy);
  }
  next.delete('catalog');
  return next;
}
export function readOperationsState(query, narrow = false, savedView = '') {
  query = normalizeOperationsQuery(query);
  const tab = oneOf(query.get('tab'), ['schedules', 'classes', 'subjects', 'rooms'], 'schedules');
  return {
    tab,
    view:oneOf(query.get('scheduleView'),['calendar','list'],oneOf(savedView,['calendar','list'],query.has('lowRegistration') || query.has('excludeCancelled') || narrow ? 'list' : 'calendar')),
    group:oneOf(query.get('group'),['room','coach'],'room'),
    selection:{subject:query.get('sSubject') || '',coach:query.get('sCoach') || '',room:query.get('sRoom') || '',status:query.get('status') || ''},
    classes:{search:query.get('cQuery') || '',subject:query.get('cSubject') || '',coach:query.get('cCoach') || '',room:query.get('cRoom') || '',status:oneOf(query.get('cStatus'),['ACTIVE','INACTIVE','ALL'],'ACTIVE'),sort:oneOf(query.get('cSort'),['className','coachName','maxSlots','price'],'className'),dir:oneOf(query.get('cDir'),['asc','desc'],'asc'),page:positive(query.get('cPage')),size:Number(oneOf(query.get('cSize'),['20','50','100'],'20'))},
    schedulePage:positive(query.get('sPage')), resource:{page:positive(query.get(`${tab}Page`)), search:query.get(`${tab}Query`) || ''},
  };
}
export function patchOperationsQuery(query, patch) {
  const next = normalizeOperationsQuery(query);
  Object.entries(patch).forEach(([key,value])=>value===null || value==='' || value===undefined ? next.delete(key) : next.set(key,String(value)));
  return next;
}
// Interim: endpoint returns a complete array; client paging does not reduce network/SQL work.
export function matchingClasses(rows, state, language = 'en') {
  const text=state.search.trim().toLocaleLowerCase();
  const collator=new Intl.Collator(language==='vi'?'vi':'en',{numeric:true,sensitivity:'base'});
  return rows.filter(row=>(state.status==='ALL' || row.status===state.status) && (!state.subject || String(row.subjectId)===state.subject) && (!state.coach || String(row.coachId)===state.coach) && (!state.room || String(row.roomId)===state.room) && `${row.className} ${row.subjectName} ${row.coachName} ${row.roomName}`.toLocaleLowerCase().includes(text)).sort((a,b)=>{
    const result=['price','maxSlots'].includes(state.sort) ? Number(a[state.sort])-Number(b[state.sort]) : collator.compare(a[state.sort] || '',b[state.sort] || '');
    return (state.dir==='desc'?-result:result) || Number(a.classId)-Number(b.classId);
  });
}
export function pageItems(rows, page, size) {
  const pages=Math.max(1,Math.ceil(rows.length/size));const current=Math.min(Math.max(1,page),pages);
  return {items:rows.slice((current-1)*size,current*size),page:current,pages,total:rows.length,start:rows.length?(current-1)*size+1:0,end:Math.min(current*size,rows.length)};
}
export function visibleSchedules(rows, classes, state, range, query) {
  return filterSchedules(rows,classes,state.selection).filter(row=>sessionDay(row.startTime)>=range.from && sessionDay(row.startTime)<=range.to && (query.get('excludeCancelled')!=='true' || row.status!=='CANCELLED'));
}
export function operationCounts(rows, classes) { return {schedules:rows.length,classes:classes.length}; }
