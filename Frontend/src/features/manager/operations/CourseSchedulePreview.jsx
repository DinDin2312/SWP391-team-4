import { CalendarDays, CheckCircle2, AlertTriangle, MapPin, UserRound } from 'lucide-react';
import { t } from '../../../i18n/useLanguage';
import { formatDate } from '../../../utils/displayFormat';
import { addDays } from './operationsUtils';
import { courseWeeks } from './courseReviewUtils';

const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function CourseSchedulePreview({plan,form,selected,labelFor,onAlternative,durationMinutes=90}) {
  const weeks=courseWeeks(plan,form.excludedDates,form.fromDate);
  const requested=plan.requestedSessions || plan.sessions;
  const dates=requested.map(s=>s.startTime.slice(0,10)).sort();
  const columns=[...new Set([...form.weekdays,...requested.map(s=>(new Date(`${s.startTime.slice(0,10)}T12:00:00`).getDay()+6)%7+1),...weeks.flatMap(w=>w.sessions.filter(s=>s.excluded).map(s=>(new Date(`${s.date}T12:00:00`).getDay()+6)%7+1))])].sort();
  const makeups=new Map(Object.entries(form.overrides).map(([date,start])=>[start,date]));
  return <section className="course-review" aria-label={t('Proposed sessions')}>
    <div className="course-review-summary">
      <span className="course-review-eyebrow"><CalendarDays size={16} aria-hidden="true"/>{t('Course overview')}</span>
      <h3>{selected?.className}</h3>
      <div className="course-review-resources"><span><UserRound size={15} aria-hidden="true"/>{selected?.coachName}</span><span><MapPin size={15} aria-hidden="true"/>{selected?.roomName}</span></div>
      <div className="course-review-facts"><div><span>{t('Total course sessions')}</span><strong>{form.sessions} {t('sessions')}</strong></div><div><span>{t('Course dates')}</span><strong>{dates.length?`${formatDate(dates[0])} → ${formatDate(dates.at(-1))}`:'—'}</strong></div></div>
      <div className="course-review-pattern">{form.weekdays.map(day=><span key={day}><strong>{t(weekdays[day-1])}</strong> · {labelFor(`2000-01-01T${form.weekdaySlots[day]}:00`)}</span>)}</div>
    </div>
    <div role="status" className={`course-review-status ${plan.missing?'needs-attention':'is-ready'}`}>
      {plan.missing?<AlertTriangle size={22} aria-hidden="true"/>:<CheckCircle2 size={22} aria-hidden="true"/>}
      <div><strong>{plan.missing?t('{0} sessions need attention',[plan.missing]):t('{0}/{1} sessions ready',[plan.sessions.length,form.sessions])}</strong><p>{t(plan.missing?'Resolve conflicts or adjust the weekly rules before saving.':'All sessions fit. Review the dates before confirming.')}</p></div>
    </div>
    {!!plan.conflicts?.length && <section aria-label={t('Sessions needing attention')}><h4>{t('Sessions needing attention')}</h4>{plan.conflicts.map(conflict=><div className="ops-course-conflict" key={conflict.originalDate}>
      <strong>{formatDate(conflict.startTime.slice(0,10))} · {labelFor(conflict.startTime)}</strong><p>{t(conflict.reason)}</p>
      <label className="ops-field">{t('Choose a make-up session')}<select value="" onChange={e=>onAlternative(conflict.originalDate,e.target.value)}><option value="">{t('Select an alternative')}</option>{conflict.alternatives.map(s=><option key={s.startTime} value={s.startTime}>{formatDate(s.startTime.slice(0,10))} · {labelFor(s.startTime)}</option>)}</select></label>
      {!conflict.alternatives.length && <p>{t('No suggested alternative in the next 7 days. Change the weekly rules or excluded dates.')}</p>}
    </div>)}</section>}
    <div className="course-review-calendar-heading"><h4>{t('Weekly course schedule')}</h4><span>{t('{0} minutes per session',[durationMinutes])}</span></div>
    <div className="course-review-weeks" role="table" aria-label={t('Weekly course schedule')} style={{'--course-days':columns.length}}>
      <div className="course-review-week-header" role="row"><span role="columnheader">{t('Week')}</span>{columns.map(day=><span role="columnheader" key={day}>{t(weekdays[day-1])}</span>)}</div>
      {weeks.map((week,index)=><div className="course-review-week" role="row" key={week.start}>
        <div className="course-review-week-label" role="rowheader"><strong>{t('Week {0}',[index+1])}</strong><span>{formatDate(week.start)}<br/>– {formatDate(week.end)}</span></div>
        {columns.map(day=>{const date=addDays(week.start,day-1),sessions=week.sessions.filter(s=>(s.date || s.startTime.slice(0,10))===date);return <div className="course-review-day" role="cell" key={day} data-day={t(weekdays[day-1])}>{sessions.length?sessions.map((s,i)=><div key={s.startTime || i} className={`course-review-lesson ${s.excluded?'is-excluded':s.conflict?'is-conflict':makeups.has(s.startTime)?'is-makeup':''}`}>
          <strong>{formatDate(date)}</strong><span>{s.excluded?t('Day off'):labelFor(s.startTime)}</span>
          {s.conflict && <em>{t('Conflict')}</em>}{makeups.has(s.startTime) && <em>{t('Make-up for {0}',[formatDate(makeups.get(s.startTime))])}</em>}
        </div>):<span className="course-review-empty">—</span>}</div>;})}
      </div>)}
    </div>
    <p className="ops-note course-review-footnote">{t('All sessions and current teaching slots are checked again when saving; one conflict prevents the entire batch.')}</p>
  </section>;
}
