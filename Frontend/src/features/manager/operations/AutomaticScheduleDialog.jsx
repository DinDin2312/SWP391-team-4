import { useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { Drawer } from './OperationsDrawers';
import managerService from '../services/managerService';
import { addDays } from './operationsUtils';
import { formatDate, formatDateTime } from '../../../utils/displayFormat';

export default function AutomaticScheduleDialog({ config, data, onClose, onSaved }) {
  useLanguage();
  const tomorrow=addDays(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),1);
  const [form,setForm]=useState({classId:config.initial?.classId || '',fromDate:tomorrow,toDate:addDays(tomorrow,90),sessions:12,durationMinutes:60,weekdays:[2,4],availableFrom:'08:00',availableTo:'20:00',preferredTime:'18:00',breakMinutes:15,excludedDates:[]});
  const [excluded,setExcluded]=useState(''),[confirmed,setConfirmed]=useState(false),[plan,setPlan]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[created,setCreated]=useState(false);
  const selected=data.classes.find(row=>String(row.classId)===String(form.classId));
  const set=(key,value)=>{setForm(current=>({...current,[key]:value}));setPlan(null);setError('');if(key==='classId')setConfirmed(false);};
  const rules=()=>({...form,classId:Number(form.classId),sessions:Number(form.sessions),durationMinutes:Number(form.durationMinutes),breakMinutes:Number(form.breakMinutes)});
  const preview=async event=>{
    event.preventDefault();if(busy)return;
    if(!confirmed || !form.classId || !form.weekdays.length){setError('Choose a class and confirm its availability.');return;}
    setBusy(true);setError('');setPlan(null);
    try {const response=await managerService.previewSchedulePlan(rules());setPlan(response.data);}
    catch(err){setError(err.response?.data?.message || 'Unable to generate a plan. Please try again.');}
    finally{setBusy(false);}
  };
  const save=async()=>{
    if(busy || created || !plan || plan.missing || plan.sessions.length!==Number(form.sessions))return;
    setBusy(true);setError('');
    try {
      await managerService.commitSchedulePlan({rules:rules(),coachId:plan.coachId,roomId:plan.roomId,sessions:plan.sessions});
      setCreated(true);await onSaved(t('{0} sessions created. Change the date range to view the full plan.',[plan.sessions.length]));
    }catch(err){setError(err.response?.data?.message || 'Unable to save. Please try again.');}
    finally{setBusy(false);}
  };
  const field=(key,label,type,attrs={})=><label key={key} className="ops-field">{t(label)}<input required type={type} {...attrs} value={form[key]} onInput={e=>set(key,e.target.value)} onChange={e=>set(key,e.target.value)}/></label>;
  const editSession=(index,startTime)=>{
    const start=new Date(startTime);const end=new Date(start.getTime()+Number(form.durationMinutes)*60000);
    const localEnd=Number.isNaN(end.getTime())?'':`${end.getFullYear()}-${String(end.getMonth()+1).padStart(2,'0')}-${String(end.getDate()).padStart(2,'0')}T${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
    setPlan(current=>({...current,sessions:current.sessions.map((s,i)=>i===index?{startTime,endTime:localEnd}:s)}));setError('');
  };
  return <Drawer className="ops-auto-drawer" title="Automatic scheduling" subtitle={t('Generate a whole teaching period, then review and confirm once.')} onClose={onClose} busy={busy}>
    <form onSubmit={preview}><div className="ops-drawer-body">
      {error && <div role="alert" className="manager-alert">{t(error)}</div>}
      <fieldset disabled={busy || created}>
        <label className="ops-field">{t('Class')}<select required value={form.classId} onChange={e=>set('classId',e.target.value)}><option value="">{t('Select a class')}</option>{data.classes.filter(r=>r.status==='ACTIVE').map(r=><option key={r.classId} value={r.classId}>{r.className}</option>)}</select></label>
        {selected && <div className="ops-assignment"><strong>{selected.coachName}</strong><span>{selected.roomName}</span></div>}
        <p className="ops-note">{t('For classes without registrations. One session per eligible day; existing schedules are additional occupied time.')}</p>
        <div className="ops-plan-grid">{field('sessions','Sessions to schedule','number',{min:1,max:52})}{field('durationMinutes','Minutes per session','number',{min:15,max:240})}{field('fromDate','First possible date','date',{min:tomorrow})}{field('toDate','Last possible date','date',{min:form.fromDate,max:addDays(form.fromDate || tomorrow,365)})}</div>
        <fieldset className="ops-plan-weekdays"><legend>{t('Available weekdays')}</legend>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,i)=><label key={day}><input type="checkbox" checked={form.weekdays.includes(i+1)} onChange={e=>set('weekdays',e.target.checked?[...form.weekdays,i+1].sort():form.weekdays.filter(d=>d!==i+1))}/>{t(day)}</label>)}</fieldset>
        <div className="ops-plan-grid">{field('availableFrom','Available from','time')}{field('availableTo','Available until','time')}{field('preferredTime','Preferred start time','time')}{field('breakMinutes','Rest between sessions (minutes)','number',{min:0,max:120})}</div>
        <label className="ops-field">{t('Days off / room maintenance')}<div className="ops-plan-date-entry"><input type="date" min={form.fromDate} max={form.toDate} value={excluded} onInput={e=>setExcluded(e.target.value)} onChange={e=>setExcluded(e.target.value)}/><button type="button" className="manager-secondary" disabled={!excluded} onClick={()=>{set('excludedDates',[...new Set([...form.excludedDates,excluded])].sort());setExcluded('');}}>{t('Exclude date')}</button></div></label>
        <div className="ops-plan-exclusions">{form.excludedDates.map(date=><button type="button" className="manager-secondary" key={date} aria-label={t('Restore date {0}',[formatDate(date)])} onClick={()=>set('excludedDates',form.excludedDates.filter(d=>d!==date))}>{formatDate(date)} ×</button>)}</div>
        <label className="ops-plan-confirm"><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setPlan(null);}}/>{t('I confirm these days and hours are available for both the coach and the room, excluding the dates above.')}</label>
        <p className="ops-note">{t('The system tries your preferred time, then nearby 15-minute slots. It checks all existing coach and room schedules, including outside the visible week.')}</p>
        <button className="manager-secondary" type="submit" disabled={!confirmed || !form.classId}>{t(busy?'Generating plan…':'Generate preview')}</button>
        {plan && <section className="ops-plan-preview" aria-label={t('Proposed sessions')}>
          <h3>{t('Proposed sessions')} · {plan.sessions.length}/{form.sessions}</h3>
          <p role="status" className={plan.missing?'ops-warning':'ops-note'}>{t(plan.missing?'Not enough slots: {0} sessions still need scheduling. Extend the date range or availability.':'All sessions fit. Review the dates before confirming.',[plan.missing])}</p>
          {plan.sessions.map((s,i)=><div className="ops-plan-session" key={i}><label>{t('Session {0}',[i+1])}<input type="datetime-local" step="60" required value={s.startTime.slice(0,16)} onInput={e=>editSession(i,e.target.value)} onChange={e=>editSession(i,e.target.value)}/></label><small>{t('Ends at')} {s.endTime?formatDateTime(s.endTime):'—'}</small></div>)}
          {plan.skipped.length>0 && <details><summary>{t('Skipped days')} ({plan.skipped.length})</summary><ul>{plan.skipped.map(s=><li key={s.date}>{formatDate(s.date)} · {t(s.reason)}</li>)}</ul></details>}
          <p className="ops-note">{t('Edited dates must remain inside the rules. All sessions are checked again when saving; one conflict prevents the entire batch.')}</p>
        </section>}
      </fieldset>
    </div><footer><button type="button" className="manager-secondary" disabled={busy} onClick={onClose}>{t('Cancel')}</button><button type="button" className="manager-primary" disabled={busy || created || !confirmed || !plan || plan.missing>0 || plan.sessions.some(s=>!s.startTime || !s.endTime)} onClick={save}>{t(busy?'Saving…':'Confirm schedule')}</button></footer></form>
  </Drawer>;
}
