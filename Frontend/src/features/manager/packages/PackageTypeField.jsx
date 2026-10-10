import { useEffect, useId, useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import managerService from '../services/managerService';

export default function PackageTypeField({value,onChange,onCatalog,inputProps}) {
  useLanguage();const id=useId();
  const [types,setTypes]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const [draft,setDraft]=useState(null),[name,setName]=useState(''),[required,setRequired]=useState(true),[saving,setSaving]=useState(false);
  useEffect(()=>{let active=true;managerService.packageTypes().then(({data})=>{if(active){setTypes(data||[]);onCatalog(data||[]);setLoading(false);}}).catch(()=>{if(active){setError('Package types could not be loaded.');setLoading(false);}});return()=>{active=false;};},[attempt,onCatalog]);
  const selected=types.find(type=>type.typeCode===value);
  const save=async()=>{
    if(saving)return;
    if(!name.trim() || name.trim().length>255){setError('Package type name must contain 1 to 255 characters.');return;}
    setSaving(true);setError('');
    try {
      const {data}=await managerService.savePackageType({...(draft?.typeCode?{typeCode:draft.typeCode}:{}),typeName:name.trim(),requiresSubjects:required});
      const response=await managerService.packageTypes();setTypes(response.data);onCatalog(response.data);onChange(data.typeCode);setDraft(null);
    } catch(failure){setError(failure.response?.data?.message||'Unable to save the package type.');}
    finally {setSaving(false);}
  };
  return <>
    <select {...inputProps} required value={value} disabled={loading||saving} onChange={event=>onChange(event.target.value)}>
      {!selected && <option value={value}>{t(loading?'Loading package types...':'Select a package type')}</option>}
      {types.map(type=><option key={type.typeCode} value={type.typeCode}>{t(type.typeName)}</option>)}
    </select>
    <div className="pkg-photo-buttons" style={{marginTop:8}}>
      <button type="button" className="manager-secondary" disabled={loading||saving} onClick={()=>{setDraft({});setName('');setRequired(true);setError('');}}>{t('Add package type')}</button>
      {selected && <button type="button" className="manager-secondary" disabled={saving} onClick={()=>{setDraft(selected);setName(selected.typeName);setRequired(selected.requiresSubjects);setError('');}}>{t('Rename package type')}</button>}
    </div>
    {draft && <div className="pkg-type-draft">
      <label htmlFor={id}>{t('Package type name')}<input id={id} value={name} maxLength={255} disabled={saving} onChange={event=>setName(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();save();}}}/></label>
      {!draft.typeCode && <label className="pkg-type-required"><input type="checkbox" checked={required} disabled={saving} onChange={event=>setRequired(event.target.checked)}/>{t('Require subject benefits for packages of this type')}</label>}
      <small>{t('Package types are shared categories. Benefits are configured separately for each package.')}</small>
      <div className="pkg-photo-buttons"><button type="button" className="manager-primary" disabled={saving} onClick={save}>{t(saving?'Saving...':'Save package type')}</button><button type="button" className="manager-secondary" disabled={saving} onClick={()=>{setDraft(null);setError('');}}>{t('Cancel')}</button></div>
    </div>}
    {error && <div className="manager-field-error" role="alert">{t(error)}{!types.length && <button type="button" className="manager-secondary" onClick={()=>{setError('');setLoading(true);setAttempt(n=>n+1);}}>{t('Retry')}</button>}</div>}
  </>;
}
