import { useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import managerService from '../services/managerService';
import { useTeachingSlots } from './teachingSlots';

export default function TeachingSlotSettings() {
  useLanguage();
  const {policy,error:loadError}=useTeachingSlots();
  const [draft,setDraft]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
  const current=draft || policy;
  async function save(event) {
    event.preventDefault();setBusy(true);setError('');setSaved(false);
    try { await managerService.saveSchedulePolicy({opensAt:current.opensAt,closesAt:current.closesAt,breakMinutes:Number(current.breakMinutes)});const p=await managerService.saveCourseLeadDays(Number(current.courseLeadDays ?? 30));setDraft(p);setSaved(true); }
    catch(e){setError(e.response?.data?.message || 'Unable to save. Please try again.');}
    finally{setBusy(false);}
  }
  // Center-wide frame every subject's slots must fit in; set once, rarely edited.
  return <details className="ops-hours">
    <summary>{current ? <><strong>{t('Opening hours')}</strong><span>{String(current.opensAt).slice(0,5)}–{String(current.closesAt).slice(0,5)}</span><span>{t('Changeover {0} minutes',[current.breakMinutes])}</span>{current.courseLeadDays!=null && <span>{t('New courses {0} days ahead',[current.courseLeadDays])}</span>}</> : <strong>{t('Opening hours')}</strong>}<em>{t('Edit')}</em></summary>
    <p className="ops-note">{t('Every subject’s teaching slots must fit inside these hours.')}</p>
    <p className="ops-note">{t('Changes apply to new or rescheduled sessions only. Existing sessions keep their times and reserved changeover.')}</p>
    {(loadError || error) && <p role="alert" className="manager-alert">{t(loadError || error)}</p>}
    {current && <form onSubmit={save}><fieldset disabled={busy} style={{border:0,padding:0}}>
      <div className="ops-plan-grid">{[['opensAt','Opening time','time'],['closesAt','Closing time','time'],['breakMinutes','Changeover (minutes)','number',120],['courseLeadDays','Notice for new courses (days)','number',180]].map(([key,label,type,max])=><label className="ops-field" key={key}>{t(label)}<input required type={type} min={type==='number'?0:undefined} max={max} value={current[key]} onChange={e=>{setDraft({...current,[key]:e.target.value});setSaved(false);}}/></label>)}</div>
      <button type="submit" className="manager-secondary">{t(busy?'Saving…':'Save settings')}</button>
      {saved && <p role="status">{t('Settings saved. Reopen scheduling forms to load the new slots.')}</p>}
    </fieldset></form>}
  </details>;
}
