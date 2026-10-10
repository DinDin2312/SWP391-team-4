import { useEffect, useId, useState } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import managerService from '../services/managerService';

export default function PackageBenefitsEditor({ value, onChange }) {
  useLanguage();
  const id=useId();
  const [rooms,setRooms]=useState([]),[roomSearch,setRoomSearch]=useState({});
  const [subjects,setSubjects]=useState([]),[search,setSearch]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    Promise.all([managerService.subjects(),managerService.rooms()]).then(([subjects,rooms])=>{if(active){setSubjects(subjects);setRooms(rooms);setLoading(false);}}).catch(()=>{if(active){setError('Subjects could not be loaded.');setLoading(false);}});
    return ()=>{active=false;};
  },[attempt]);
  const change=(subjectId,sessionLimit)=>onChange(value.map(row=>row.subjectId===subjectId?{...row,sessionLimit}:row));
  const setRoomsFor=(subjectId,roomIds)=>onChange(value.map(row=>row.subjectId===subjectId?{...row,roomIds}:row));
  const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('đ','d').replaceAll('Đ','D').toLowerCase();
  const available=subjects.filter(subject=>!value.some(row=>Number(row.subjectId)===Number(subject.subjectId))&&normalize(subject.subjectName).includes(normalize(search)));
  return <section className="pkg-benefits-editor" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{t('Subject benefits')}</h3>
    <p>{t('Set a separate session allowance for each subject. Package duration applies to every benefit.')}</p>
    {value.length>0 && <div className="pkg-benefit-selected">{value.map(row=><div key={row.subjectId} className="pkg-benefit-row">
      <strong>{subjects.find(s=>Number(s.subjectId)===Number(row.subjectId))?.subjectName || row.subjectName || t('Subject {0}',[row.subjectId])}</strong>
      <label>{t('Sessions')}<input type="number" min="1" max="10000" step="1" required value={row.sessionLimit} onChange={event=>change(row.subjectId,event.target.value)} /></label>
      <fieldset className="pkg-benefit-scope"><legend>{t('Applicable locations')}</legend>
        <button type="button" className="manager-secondary" aria-pressed={!row.roomIds?.length} disabled={loading||Boolean(error)} onClick={()=>setRoomsFor(row.subjectId,[])}>{t('All locations')}</button>
        <label>{t('Search locations')}<input type="search" aria-label={t('Search locations for {0}',[row.subjectName])} value={roomSearch[row.subjectId]||''} onChange={event=>setRoomSearch(current=>({...current,[row.subjectId]:event.target.value}))}/></label>
        <div className="pkg-scope-options">{rooms.filter(room=>normalize(room.roomName).includes(normalize(roomSearch[row.subjectId]||''))).map(room=><label key={room.roomId} data-room-name={room.roomName}><input type="checkbox" disabled={loading||Boolean(error)} checked={(row.roomIds||[]).includes(Number(room.roomId))} onChange={event=>setRoomsFor(row.subjectId,event.target.checked?[...(row.roomIds||[]),Number(room.roomId)]:(row.roomIds||[]).filter(id=>id!==Number(room.roomId)))}/>{room.roomName}</label>)}</div>
        <small>{t('Sessions are shared across the selected locations. No selection means all locations.')}</small>
      </fieldset>
      <button type="button" className="manager-secondary" aria-label={t('Remove subject {0}',[row.subjectName || subjects.find(s=>Number(s.subjectId)===Number(row.subjectId))?.subjectName || row.subjectId])} onClick={()=>onChange(value.filter(item=>item.subjectId!==row.subjectId))}>{t('Remove')}</button>
    </div>)}</div>}
    {loading ? <p role="status">{t('Loading subjects...')}</p> : error ? <div role="alert"><p>{t(error)}</p><button type="button" className="manager-secondary" onClick={()=>{setError('');setLoading(true);setAttempt(n=>n+1);}}>{t('Retry')}</button></div> : <>
      <label className="pkg-benefit-search">{t('Search subjects')}<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={t('Search subjects')}/></label>
      <div className="pkg-benefit-options" role="group" aria-label={t('Available subjects')}>
        {available.map(subject=><button type="button" className="manager-secondary" key={subject.subjectId} disabled={value.length>=100} onClick={()=>{onChange([...value,{subjectId:Number(subject.subjectId),subjectName:subject.subjectName,sessionLimit:'1',roomIds:[]}]);}}>{t('Add {0}',[subject.subjectName])}</button>)}
        {!available.length && <small>{t(subjects.length?'No more subjects match.':'Create subjects in Center Operations first.')}</small>}
      </div>
    </>}
  </section>;
}
