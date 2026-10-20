import { useEffect, useRef, useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { useTeachingSlots, slotLabel } from './teachingSlots';
import { Drawer } from './OperationsDrawers';
import managerService from '../services/managerService';
import { addDays } from './operationsUtils';
import { formatDate } from '../../../utils/displayFormat';

import CourseSchedulePreview from './CourseSchedulePreview';

const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export default function CourseScheduleDialog({config,data,onClose,onSaved}) {
  useLanguage();
  const tomorrow=addDays(new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),1);
  const [form,setForm]=useState({classId:config.initial?.classId || '',fromDate:config.initial?.fromDate && config.initial.fromDate>=tomorrow?config.initial.fromDate:tomorrow,sessions:12,weekdays:[2,4],weekdaySlots:{},excludedDates:[],overrides:{}});
  const {policy,error:policyError}=useTeachingSlots(form.classId || undefined);
  const [excluded,setExcluded]=useState(''),[plan,setPlan]=useState(null),[previewRules,setPreviewRules]=useState(null);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[created,setCreated]=useState(false);
  const [availability,setAvailability]=useState(null),[availabilityError,setAvailabilityError]=useState('');
  const [allowPartial,setAllowPartial]=useState(false);
  const [step,setStep]=useState('setup');
  const stepHeading=useRef(null);
  useEffect(()=>{stepHeading.current?.focus();},[step]);
  const selected=data.classes.find(row=>String(row.classId)===String(form.classId));
  const change=(key,value)=>{setForm(current=>({...current,[key]:value,...(key==='classId'?{weekdaySlots:{}}:{}),overrides:{}}));setPlan(null);setPreviewRules(null);setError('');};
  const rules=current=>({classId:Number(current.classId),fromDate:current.fromDate,toDate:addDays(current.fromDate,365),sessions:Number(current.sessions),durationMinutes:policy.durationMinutes,breakMinutes:policy.breakMinutes,
    weekdays:current.weekdays,weekdaySlots:Object.fromEntries(current.weekdays.map(day=>[day,current.weekdaySlots[day] || policy.starts[0].slice(0,5)])),availableFrom:policy.opensAt,availableTo:policy.closesAt,preferredTime:policy.starts[0],excludedDates:current.excludedDates,overrides:current.overrides});
  const availabilityKey=policy && form.classId && form.fromDate && Number(form.sessions)>=1 && Number(form.sessions)<=52 && form.weekdays.length
    ? JSON.stringify({...rules(form),overrides:{}}):'';
  useEffect(()=>{
    let active=true;
    if(!availabilityKey)return;
    const timer=setTimeout(async()=>{
      setAvailabilityError('');
      try {
        const response=await managerService.scheduleAvailability(JSON.parse(availabilityKey));
        if(active)setAvailability({key:availabilityKey,slots:response.slots});
      } catch(err) {if(active){setAvailability(null);setAvailabilityError(err.response?.data?.message || 'Unable to check slot availability.');}}
    },300);
    return ()=>{active=false;clearTimeout(timer);};
  },[availabilityKey]);
  const availabilityReady=!!availabilityKey && availability?.key===availabilityKey;
  const slotState=(day,time)=>availabilityReady?availability.slots.find(s=>s.weekday===day && s.time.slice(0,5)===time.slice(0,5)):null;
  const blocked=slot=>!slot || slot.total===0 || (slot.conflictDates.length>0 && (!allowPartial || slot.conflictDates.length===slot.total));
  const selectionBlocked=!availabilityReady || form.weekdays.some(day=>blocked(slotState(day,form.weekdaySlots[day] || policy.starts[0])));
  async function preview(current=form) {
    if(busy || !policy || !current.classId || !current.weekdays.length || selectionBlocked)return;
    setBusy(true);setError('');setPlan(null);setPreviewRules(null);
    try {const payload=rules(current);setPlan(await managerService.previewSchedulePlan(payload));setPreviewRules(payload);setStep('review');}
    catch(err){setError(err.response?.data?.message || 'Unable to generate a plan. Please try again.');setStep('setup');}
    finally{setBusy(false);}
  }
  async function save() {
    if(busy || created || !plan || plan.missing || !previewRules || selectionBlocked)return;
    setBusy(true);setError('');
    try {await managerService.commitSchedulePlan({rules:previewRules,coachId:plan.coachId,roomId:plan.roomId,sessions:plan.sessions});setCreated(true);await onSaved(t('{0} sessions created. Change the date range to view the full plan.',[plan.sessions.length]));}
    catch(err){setError(err.response?.data?.message || 'Unable to save. Please try again.');setPlan(null);setPreviewRules(null);setStep('setup');}
    finally{setBusy(false);}
  }
  function chooseAlternative(originalDate,startTime) {
    if(!startTime)return;
    const next={...form,overrides:{...form.overrides,[originalDate]:startTime}};
    setForm(next);preview(next);
  }
  const labelFor=start=>{const index=policy?.starts.findIndex(time=>time.slice(0,5)===start.slice(11,16));return index>=0?slotLabel(policy.starts[index],index,policy.durationMinutes):start.slice(11,16);};
  return <Drawer className="ops-auto-drawer" title="Schedule course" subtitle={t('Choose weekly slots once. Review the whole course before saving.')} onClose={onClose} busy={busy}>
    <form onSubmit={e=>{e.preventDefault();if(step==='setup')preview();}}><div className="ops-drawer-body">
      <ol className="course-schedule-steps" aria-label={t('Scheduling steps')}><li aria-current={step==='setup'?'step':undefined}><span>1</span>{t('Set up schedule')}</li><li aria-current={step==='review'?'step':undefined}><span>2</span>{t('Review and confirm')}</li></ol>
      <h3 className="course-step-heading" tabIndex={-1} ref={stepHeading}>{t(step==='setup'?'Set up schedule':'Review and confirm')}</h3>
      {(policyError || error) && <div role="alert" className="manager-alert">{t(policyError || error)}</div>}
      {step==='review' && busy && !plan && <p role="status">{t('Generating plan…')}</p>}
      <fieldset disabled={busy || created || !policy} hidden={step!=='setup'}>
        <label className="ops-field">{t('Class')}<select required value={form.classId} onChange={e=>change('classId',e.target.value)}><option value="">{t('Select a class')}</option>{data.classes.filter(row=>row.status==='ACTIVE').map(row=><option key={row.classId} value={row.classId}>{row.className}</option>)}</select></label>
        {selected && <div className="ops-assignment"><strong>{selected.coachName}</strong><span>{selected.roomName}</span></div>}
        <p className="ops-note">{t('Schedule the full course before accepting registrations. Use supplementary sessions for make-up lessons afterwards.')}</p>
        <div className="ops-plan-grid">
          <label className="ops-field">{t('Course start date')}<input required type="date" min={tomorrow} value={form.fromDate} onInput={e=>change('fromDate',e.target.value)} onChange={e=>change('fromDate',e.target.value)}/></label>
          <label className="ops-field">{t('Total course sessions')}<input required type="number" min="1" max="52" step="1" value={form.sessions} onInput={e=>change('sessions',e.target.value)} onChange={e=>change('sessions',e.target.value)}/></label>
        </div>
        <fieldset className="ops-course-week"><legend>{t('Weekly teaching slots')}</legend>
          <p role="status" className="ops-note">{t(!availabilityKey?'Select a class, start date and session count to check slots.':availabilityReady?'Availability checked across the entire course.':'Checking slots across the entire course…')}</p>
          {availabilityError && <p role="alert" className="ops-warning">{t(availabilityError)}</p>}
          <label className="ops-partial-toggle"><input type="checkbox" checked={allowPartial} onChange={e=>{setAllowPartial(e.target.checked);setPlan(null);setPreviewRules(null);}}/>{t('Allow slots that require make-up sessions')}</label>
          {days.map((day,index)=>{const number=index+1,checked=form.weekdays.includes(number);return <div className="ops-course-week-row" key={day}>
            <label><input type="checkbox" checked={checked} onChange={e=>change('weekdays',e.target.checked?[...form.weekdays,number].sort():form.weekdays.filter(d=>d!==number))}/>{t(day)}</label>
            <div><select aria-label={t('Slot for {0}',[t(day)])} disabled={!checked || !availabilityReady} value={form.weekdaySlots[number] || policy?.starts[0]?.slice(0,5) || ''} onChange={e=>change('weekdaySlots',{...form.weekdaySlots,[number]:e.target.value})}>{policy?.starts.map((time,i)=>{const state=slotState(number,time),count=state?.conflictDates.length;return <option key={time} disabled={checked && blocked(state)} value={time.slice(0,5)}>{slotLabel(time,i,policy.durationMinutes)}{state?` · ${state.total===0?t('No lessons on this weekday'):count?t('Conflicts: {0}/{1}',[count,state.total]):t('Free for the whole course')}`:''}</option>;})}</select>
            {checked && availabilityReady && (()=>{const state=slotState(number,form.weekdaySlots[number] || policy.starts[0]);return state?.conflictDates.length>0?<p className="ops-warning">{t('Coach or room occupied on:')} {state.conflictDates.map(date=>formatDate(date)).join(', ')}. {blocked(state)?t('Choose another slot.'):t('Make-up sessions must be resolved before saving.')}</p>:null;})()}</div>
          </div>;})}
        </fieldset>
        <p className="ops-note">{t('{0} minutes per session',[policy?.durationMinutes || '—'])} · {policy?.breakMinutes} {t('minutes changeover')}. {t('Weekly slots stay fixed. Conflicts require your decision; times never change automatically.')}</p>
        <label className="ops-field">{t('Days off / room maintenance')}<div className="ops-plan-date-entry"><input aria-label={t('Excluded date')} type="date" min={form.fromDate} max={form.fromDate?addDays(form.fromDate,365):undefined} value={excluded} onInput={e=>setExcluded(e.target.value)} onChange={e=>setExcluded(e.target.value)}/><button type="button" className="manager-secondary" disabled={!excluded || excluded<form.fromDate} onClick={()=>{change('excludedDates',[...new Set([...form.excludedDates,excluded])].sort());setExcluded('');}}>{t('Exclude date')}</button></div></label>
        <div className="ops-plan-exclusions">{form.excludedDates.map(date=><button type="button" className="manager-secondary" key={date} aria-label={t('Restore date {0}',[formatDate(date)])} onClick={()=>change('excludedDates',form.excludedDates.filter(d=>d!==date))}>{formatDate(date)} ×</button>)}</div>
      </fieldset>
      {step==='review' && plan && <fieldset disabled={busy || created}><CourseSchedulePreview plan={plan} form={{...form,weekdaySlots:previewRules?.weekdaySlots || rules(form).weekdaySlots}} selected={selected} labelFor={labelFor} onAlternative={chooseAlternative} durationMinutes={policy.durationMinutes}/></fieldset>}
    </div><footer>
      <button type="button" className="manager-secondary" disabled={busy} onClick={()=>step==='review'?setStep('setup'):onClose()}>{t(step==='review'?'Back to schedule settings':'Cancel')}</button>
      {step==='setup'?<button className="manager-primary" type="submit" disabled={busy || created || selectionBlocked}>{t(busy?'Generating plan…':'Preview course schedule')}</button>:<button type="button" className="manager-primary" disabled={busy || created || !plan || plan.missing>0 || selectionBlocked} onClick={save}>{busy?t('Saving…'):t('Confirm {0} sessions',[plan?.sessions.length || 0])}</button>}
    </footer></form>
  </Drawer>;
}
