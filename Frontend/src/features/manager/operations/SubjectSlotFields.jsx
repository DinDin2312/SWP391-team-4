import { useState } from 'react';
import { t } from '../../../i18n/useLanguage';
import { slotLabel } from './teachingSlots';

export default function SubjectSlotFields({form,set,policy}) {
  const [time,setTime]=useState('');
  const duration=Number(form.durationMinutes || 90),starts=form.slotStarts || [];
  const generate=()=>{
    if(!policy)return;
    const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3,5));
    const result=[];
    for(let start=minutes(policy.opensAt);start+duration+policy.breakMinutes<=minutes(policy.closesAt);start+=duration+policy.breakMinutes)
      result.push(`${String(Math.floor(start/60)).padStart(2,'0')}:${String(start%60).padStart(2,'0')}`);
    set('slotStarts',result);
  };
  return <section className="ops-subject-slots" aria-label={t('Subject teaching slots')}>
    <h3>{t('Subject teaching slots')}</h3>
    <p className="ops-note">{t('Classes inherit these slots. Saved sessions keep their original times.')}</p>
    <label className="ops-field">{t('Session duration (minutes)')}<input type="number" min="15" max="240" step="1" required value={form.durationMinutes ?? 90} onChange={e=>set('durationMinutes',e.target.value)}/></label>
    <div className="ops-editor-photo-actions">{[60,90,120,135].map(value=><button type="button" className="manager-secondary" aria-pressed={duration===value} key={value} onClick={()=>set('durationMinutes',value)}>{value} {t('minutes')}</button>)}</div>
    <p className="ops-note">{t('Changeover (minutes)')}: {policy?.breakMinutes ?? '—'} · {policy?.opensAt?.slice(0,5)}–{policy?.closesAt?.slice(0,5)}</p>
    <div className="ops-plan-date-entry"><input type="time" aria-label={t('Slot start time')} value={time} onChange={e=>setTime(e.target.value)}/><button type="button" className="manager-secondary" disabled={!time || starts.includes(time)} onClick={()=>{set('slotStarts',[...new Set([...starts.map(s=>s.slice(0,5)),time])].sort());setTime('');}}>{t('Add slot')}</button></div>
    <div className="ops-editor-photo-actions"><button type="button" className="manager-secondary" disabled={!policy || duration<15 || duration>240} onClick={generate}>{t('Generate slots from operating hours')}</button><button type="button" className="manager-secondary" disabled={!starts.length} onClick={()=>set('slotStarts',[])}>{t('Use automatic slots')}</button></div>
    {!starts.length && <p className="ops-note">{t('Automatic slots follow opening time, session duration and changeover.')}</p>}
    <ol className="ops-subject-slot-list">{starts.map((start,index)=><li key={start}><span>{slotLabel(start,index,duration)}</span><button type="button" className="manager-secondary" aria-label={t('Remove slot {0}',[index+1])} onClick={()=>set('slotStarts',starts.filter(s=>s!==start))}>×</button></li>)}</ol>
  </section>;
}
