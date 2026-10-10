import { useEffect, useRef, useState } from 'react';
import { t, useLanguage } from '../../i18n/useLanguage';
import { formatMoney } from '../../utils/displayFormat';
import ResourcePhoto from './ResourcePhoto';
import PackageBenefits from './PackageBenefits';
import './package-detail.css';
import { auditValue } from './packageAudit';

export default function PackageDetailDialog({id,load,loadHistory,onClose,onEdit}){
  useLanguage();
  const [data,setData]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  const [historyState,setHistoryState]=useState(null),[page,setPage]=useState(1),[historyAttempt,setHistoryAttempt]=useState(0);
  const history=historyState?.page===page&&historyState?.attempt===historyAttempt?historyState.data:null;
  const historyError=historyState?.page===page&&historyState?.attempt===historyAttempt?historyState.error:'';
  const dialog=useRef(null);
  useEffect(()=>{let active=true;load(id).then(response=>{if(active)setData(response.data);}).catch(()=>{if(active)setError('Unable to load package details.');});return()=>{active=false;};},[id,load,attempt]);
  useEffect(()=>{if(!loadHistory)return;let active=true;loadHistory(id,page).then(response=>{if(active)setHistoryState({page,attempt:historyAttempt,data:response.data});}).catch(()=>{if(active)setHistoryState({page,attempt:historyAttempt,error:'Unable to load change history.'});});return()=>{active=false;};},[id,loadHistory,page,historyAttempt]);
  useEffect(()=>{const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[]);
  const keyDown=event=>{
    if(event.key==='Escape'){event.stopPropagation();onClose();}
    if(event.key==='Tab'){const nodes=[...dialog.current.querySelectorAll('button:not(:disabled),a[href]')];const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  };
  return <div className="package-detail-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} onKeyDown={keyDown}>
    <section className="package-detail-panel" role="dialog" aria-modal="true" aria-label={t('Package details')} ref={dialog} tabIndex={-1}>
      <header><h2>{t('Package details')}</h2><button type="button" onClick={onClose} aria-label={t('Close')}>×</button></header>
      {!data&&!error&&<p role="status">{t('Loading package details...')}</p>}
      {error&&<div role="alert"><p>{t(error)}</p><button type="button" onClick={()=>{setError('');setData(null);setAttempt(n=>n+1);}}>{t('Retry')}</button></div>}
      {data&&<>
        <h3>{data.packageName}</h3>
        <ResourcePhoto imagePath={data.imagePath} name={data.packageName} variant="cover"/>
        <dl><dt>{t('Package type')}</dt><dd>{t(data.packageTypeName||data.packageType)}</dd><dt>{t('Duration (days)')}</dt><dd>{data.durationDays}</dd><dt>{t('Price')}</dt><dd>{formatMoney(data.price)}</dd>
          {data.sellingStatus&&<><dt>{t('Selling status')}</dt><dd>{t(data.sellingStatus==='SELLING'?'Selling':'Stopped')}</dd><dt>{t('Purchase limit per member')}</dt><dd>{data.purchaseLimitPerMember??t('Unlimited')}</dd></>}
          {data.endDate&&<><dt>{t('End Date')}</dt><dd>{data.endDate}</dd></>}
        </dl>
        <PackageBenefits benefits={data.benefits} remaining={Boolean(data.membershipId)}/>
        <section><h3>{t('Description')}</h3><p className="package-detail-text">{data.description||t('No description provided.')}</p></section>
        <section><h3>{t('Terms')}</h3><p className="package-detail-text">{data.terms||t('No terms provided.')}</p></section>
        {data.activeSubscribers!=null&&<section><h3>{t('Active registrations')}</h3><strong>{data.activeSubscribers}</strong><p>{t('Counts active registration records. A member with several registrations is counted several times.')}</p></section>}
        {data.purchaseBlockReason&&<p role="status">{t(data.purchaseBlockReason)}</p>}
        {onEdit&&<button type="button" onClick={()=>onEdit(data)}>{t('Edit')}</button>}
      </>}
      {loadHistory&&<section><h3>{t('Change history')}</h3>{!history&&!historyError&&<p role="status">{t('Loading...')}</p>}{historyError&&<div role="alert">{t(historyError)} <button type="button" onClick={()=>setHistoryAttempt(n=>n+1)}>{t('Retry')}</button></div>}
        {history&&<>{!history.items.length&&<p>{t('No changes recorded.')}</p>}<ol className="package-history">{history.items.map((entry,index)=><li key={`${page}-${index}`}><strong>{entry.actor}</strong><time>{String(entry.createdAt).replace('T',' ')}</time>{entry.changes?.fields?<ul>{Object.entries(entry.changes.fields).map(([field,change])=><li key={field}><b>{t(field)}</b>: {field==='image'?t('Image changed'):`${auditValue(field,change.before)} → ${auditValue(field,change.after)}`}</li>)}</ul>:<p>{entry.details}</p>}</li>)}</ol><div className="package-history-paging"><button disabled={page<=1} onClick={()=>setPage(n=>n-1)}>{t('Previous')}</button><span>{page}</span><button disabled={page*20>=history.total} onClick={()=>setPage(n=>n+1)}>{t('Next')}</button></div></>}
      </section>}
    </section>
  </div>;
}
