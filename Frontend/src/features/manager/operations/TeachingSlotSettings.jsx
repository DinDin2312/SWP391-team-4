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
    try { const p=await managerService.saveSchedulePolicy({opensAt:current.opensAt,closesAt:current.closesAt,breakMinutes:Number(current.breakMinutes)});setDraft(p);setSaved(true); }
    catch(e){setError(e.response?.data?.message || 'Unable to save. Please try again.');}
    finally{setBusy(false);}
  }
  return <details className="manager-panel" style={{padding:16,marginBottom:16}}>
    <summary style={{cursor:'pointer',fontWeight:600}}>{t('Teaching slot settings')} · {t('Duration and slots are configured per subject')}</summary>
    <p className="ops-note">{t('Changes apply to new or rescheduled sessions only. Existing sessions keep their times and reserved changeover.')}</p>
    {(loadError || error) && <p role="alert" className="manager-alert">{t(loadError || error)}</p>}
    {current && <form onSubmit={save}><fieldset disabled={busy} style={{border:0,padding:0}}>
      <div className="ops-plan-grid">{[['opensAt','Opening time','time'],['closesAt','Closing time','time'],['breakMinutes','Changeover (minutes)','number']].map(([key,label,type])=><label className="ops-field" key={key}>{t(label)}<input required type={type} min={type==='number'?0:undefined} max={type==='number'?120:undefined} value={current[key]} onChange={e=>{setDraft({...current,[key]:e.target.value});setSaved(false);}}/></label>)}</div>
      <button type="submit" className="manager-secondary">{t(busy?'Saving…':'Save settings')}</button>
      {saved && <p role="status">{t('Settings saved. Reopen scheduling forms to load the new slots.')}</p>}
    </fieldset></form>}
  </details>;
}
