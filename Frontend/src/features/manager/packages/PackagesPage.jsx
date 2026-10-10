import PackageDetailDialog from '../../../components/resource-images/PackageDetailDialog';
import ConfirmDialog from '../staff/ConfirmDialog';
import PackageBenefits from '../../../components/resource-images/PackageBenefits';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Grid2X2, Info, List, Package, Plus, Search, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { formatMoney } from '../../../utils/displayFormat';
import ManagerPageHeader from '../components/ManagerPageHeader';
import ManagerPagination from '../components/ManagerPagination';
import OverviewRowMenu from '../components/OverviewRowMenu';
import managerService from '../services/managerService';
import PackageType from './PackageType';
import { typeMeta } from './packageTypes';
import PackageEditor from './PackageEditor';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import { duplicatePackage, PACKAGE_SIZES, patchPackagesQuery, readPackagesState, selectPackages } from './packagesState';
import '../operations/operations.css';
import '../components/operational-overview.css';
import './packages.css';

const EMPTY = [];
const sorts = { packageName: 'Package name', price: 'Price', durationDays: 'Duration', activeSubscribers: 'Active registrations' };
const number = value => new Intl.NumberFormat('vi-VN').format(value);
const preference = () => { try { return localStorage.getItem('nexusPackagesView') || 'table'; } catch { return 'table'; } };
const countExplanation = 'Counts active registration records. A member with several registrations is counted several times.';
function approximateDuration(days) {
  if (days === 365) return t('Approximately 1 year');
  if (days === 30) return t('Approximately 1 month');
  if (days === 7) return t('Approximately 1 week');
  if (days > 0 && days % 30 === 0) return t('Approximately {0} months', [days / 30]);
  if (days > 0 && days % 7 === 0) return t('Approximately {0} weeks', [days / 7]);
  return undefined;
}
function DebouncedSearch({ value, onChange }) {
  const [local, setLocal] = useState({ source: value, draft: value });
  const timer = useRef();
  const callback = useRef(onChange);
  useEffect(() => { callback.current = onChange; }, [onChange]);
  if (local.source !== value) setLocal({ source: value, draft: value });
  useEffect(() => { clearTimeout(timer.current); return () => clearTimeout(timer.current); }, [value]);
  return <label className="pkg-search"><Search size={18} aria-hidden="true" /><span className="pkg-sr-only">{t('Search packages by name')}</span><input type="search" placeholder={t('Search packages by name')} value={local.source === value ? local.draft : value} onChange={event => {
    const text = event.target.value;
    setLocal({ source: value, draft: text }); clearTimeout(timer.current);
    timer.current = setTimeout(() => callback.current(text), 300);
  }} /></label>;
}
export function PackagesSkeleton() {
  useLanguage();
  return <div className="pkg-skeleton" role="status" aria-label={t('Loading membership packages')}><div />{Array.from({ length: 6 }, (_, index) => <div key={index} />)}</div>;
}

export default function PackagesPage({ data, loading, loadError, refresh, notify = () => {}, savePackage = managerService.savePackage }) {
  const language = useLanguage();
  const [query, setQuery] = useSearchParams();
  const [preferredView] = useState(preference);
  const state = useMemo(() => readPackagesState(query, preferredView), [query, preferredView]);
  const records = data || EMPTY;
  const block = useMemo(() => selectPackages(records, state, language), [records, state, language]);
  const [editor, setEditor] = useState(null);
  const [editLoading,setEditLoading]=useState(false),[selling,setSelling]=useState(null),[statusSaving,setStatusSaving]=useState(false);
  const detailId=/^[1-9]\d*$/.test(query.get('pkg')||'')?Number(query.get('pkg')):null;
  const openDetail=item=>setQuery(current=>{const next=new URLSearchParams(current);next.set('pkg',item.packageId);return next;});
  const closeDetail=()=>setQuery(current=>{const next=new URLSearchParams(current);next.delete('pkg');return next;});
  const changeSelling=async()=>{if(statusSaving)return;setStatusSaving(true);try{await managerService.packageSelling(selling.packageId,selling.sellingStatus==='STOPPED'?'SELLING':'STOPPED');setSelling(null);notify('Changes saved.');await refresh?.();}catch(e){notify(e.response?.data?.message||'Unable to save changes.');}finally{setStatusSaving(false);}};
  const [catalog,setCatalog]=useState([]);
  useEffect(()=>{let active=true;managerService.packageTypes().then(({data})=>{if(active)setCatalog(data||[]);}).catch(()=>{});return()=>{active=false;};},[]);
  const typeName=type=>catalog.find(row=>row.typeCode===type)?.typeName || records.find(row=>row.packageType===type)?.packageTypeName || typeMeta(type).label;
  const typeCodes=[...new Set([...catalog.map(row=>row.typeCode),...records.map(row=>row.packageType)])];
  const patch = (values, replace = false) => setQuery(current => patchPackagesQuery(current, values), { replace });
  useEffect(() => {
    if (!query.has('pkgView')) setQuery(current => patchPackagesQuery(current, { display: preferredView }), { replace: true });
  }, [query, setQuery, preferredView]);
  useEffect(() => {
    if (!loading && !loadError && data && state.page !== block.page) setQuery(current => patchPackagesQuery(current, { page: block.page }), { replace: true });
  }, [loading, loadError, data, state.page, block.page, setQuery]);
  useEffect(() => {
    const previous = document.title;
    document.title = `${t('Membership Packages')} – NEXUS`;
    return () => { document.title = previous; };
  }, [language]);
  const changeDisplay = display => { try { localStorage.setItem('nexusPackagesView', display); } catch { /* Optional storage. */ } patch({ display, page: 1 }); };
  const edit = async item => {setEditLoading(true);try{const {data}=await managerService.packageDetail(item.packageId);closeDetail();setEditor({item:data});}catch{notify('Unable to load package details.');}finally{setEditLoading(false);}};
  const duplicate = async item => {setEditLoading(true);try{const {data}=await managerService.packageDetail(item.packageId);setEditor({initial:duplicatePackage(data,t('(copy)'))});}catch{notify('Unable to load package details.');}finally{setEditLoading(false);}};
  const create = () => setEditor({});
  const clear = () => patch({ search: '', type: '', selling:'', page: 1 });
  const isFiltered = Boolean(state.search || state.type || state.selling);
  const actions = row => <OverviewRowMenu buttonLabel={state.display==='table'?'Actions':undefined} row={{ className: row.packageName }} items={[{ label: 'Edit', run: () => edit(row) }, { label: 'Duplicate', run: () => duplicate(row) },{label:row.sellingStatus==='STOPPED'?'Resume selling':'Stop selling',run:()=>setSelling(row)}]} />;
  const changeSort = key => patch({ sort: key, direction: state.sort === key && state.direction === 'asc' ? 'desc' : 'asc', page: 1 });
  const header = key => <th scope="col" aria-sort={state.sort === key ? state.direction === 'asc' ? 'ascending' : 'descending' : 'none'}><button type="button" className="pkg-sort-header" onClick={() => changeSort(key)}>{t(key==='activeSubscribers'?'Number of active registrations':sorts[key])}{state.sort === key && (state.direction === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />)}</button></th>;
  const price = row => Number(row.price) === 0 ? t('Free') : formatMoney(row.price);
  const duration = row => <span title={approximateDuration(Number(row.durationDays))}>{Number(row.durationDays) === 1 ? t('1 day') : t('{0} days', [number(row.durationDays)])}</span>;
  const rowClick = (event, row) => { if (!event.target.closest('button, a, input, select, [role="menu"]')) { event.currentTarget.focus(); openDetail(row); } };
  return <div className="packages-page">
    <ManagerPageHeader title="Membership Packages" description="Manage membership plans, durations, and pricing." actions={<button type="button" className="manager-primary" onClick={create}><Plus size={17} aria-hidden="true" />{t('Add Package')}</button>} />
    <div className="pkg-toolbar">
      <DebouncedSearch value={state.search} onChange={search => patch({ search, page: 1 })} />
      <label>{t('Package type')}<select value={state.type} onChange={event => patch({ type: event.target.value, page: 1 })}><option value="">{t('All ({0})', [number(block.allCount)])}</option>{typeCodes.map(type => <option key={type} value={type}>{t('{0} ({1})', [t(typeName(type)), number(block.counts[type]||0)])}</option>)}</select></label>
      <label>{t('Selling status')}<select value={state.selling} onChange={e=>patch({selling:e.target.value,page:1})}><option value="">{t('All')}</option><option value="SELLING">{t('Selling')}</option><option value="STOPPED">{t('Stopped')}</option></select></label>
      <label>{t('Sort by')}<select value={`${state.sort}:${state.direction}`} onChange={event => { const [sort, direction] = event.target.value.split(':'); patch({ sort, direction, page: 1 }); }}>{Object.entries(sorts).flatMap(([key, label]) => ['asc', 'desc'].map(direction => <option key={`${key}:${direction}`} value={`${key}:${direction}`}>{t('{0} · {1}', [t(label), t(direction === 'asc' ? 'Ascending' : 'Descending')])}</option>))}</select></label>
      <div className="pkg-view-switch" role="group" aria-label={t('Package display mode')}><button type="button" aria-pressed={state.display === 'table'} aria-label={t('Table view')} title={t('Table view')} onClick={() => changeDisplay('table')}><List size={18} aria-hidden="true" /></button><button type="button" aria-pressed={state.display === 'cards'} aria-label={t('Card view')} title={t('Card view')} onClick={() => changeDisplay('cards')}><Grid2X2 size={18} aria-hidden="true" /></button></div>
    </div>
    {isFiltered && <div className="pkg-filter-chips" aria-label={t('Active filters')}>
      {state.search && <button type="button" aria-label={t('Remove search filter')} onClick={() => patch({ search: '', page: 1 })}>{t('Search: {0}', [state.search])}<X size={14} aria-hidden="true" /></button>}
      {state.type && <button type="button" aria-label={t('Remove package type filter')} onClick={() => patch({ type: '', page: 1 })}>{t(typeName(state.type))}<X size={14} aria-hidden="true" /></button>}
      <button type="button" className="pkg-clear" onClick={clear}>{t('Clear filters')}</button>
    </div>}
    <p className="pkg-count-note"><Info size={15} aria-hidden="true" /><span title={t(countExplanation)}>{t('Active registrations')}: {t(countExplanation)}</span><span className="pkg-help" tabIndex={0} aria-label={t(countExplanation)}><Info size={14} aria-hidden="true" /><span role="tooltip">{t(countExplanation)}</span></span></p>
    {loadError ? <div className="pkg-empty" role="alert"><Package size={28} aria-hidden="true" /><strong>{t('Membership packages could not be loaded.')}</strong><p>{t(loadError)}</p><button type="button" className="manager-secondary" onClick={refresh}>{t('Retry')}</button></div> : loading && !data ? <PackagesSkeleton /> : block.total === 0 ? <div className="pkg-empty"><Package size={30} aria-hidden="true" /><h2>{t(records.length ? 'No packages match your filters' : 'No packages yet')}</h2><p>{t(records.length ? 'Try a different search or package type.' : 'Create a membership package to get started.')}</p><button type="button" className="manager-primary" onClick={records.length ? clear : create}>{t(records.length ? 'Clear filters' : 'Create package')}</button></div> : <>
      <div aria-busy={loading || undefined}>
        {state.display === 'table' ? <div className="manager-table-wrap pkg-table-wrap"><table aria-label={t('Membership Packages')}><thead><tr>{header('packageName')}<th scope="col">{t('Package type')}</th><th scope="col">{t('Selling status')}</th>{header('durationDays')}{header('price')}{header('activeSubscribers')}<th scope="col">{t('Actions')}</th></tr></thead><tbody>{block.items.map(row => <tr key={row.packageId} tabIndex={0} aria-label={t('View package {0}', [row.packageName])} onClick={event => rowClick(event, row)} onKeyDown={event => { if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) { event.preventDefault(); openDetail(row); } }}><td><div className="pkg-name"><PackageType type={row.packageType} iconOnly /><button type="button" aria-label={t('View package {0}', [row.packageName])} onClick={() => openDetail(row)}>{row.packageName}</button></div></td><td>{t(typeName(row.packageType))}<PackageBenefits benefits={row.benefits}/></td><td><span className={'pkg-selling-badge '+(row.sellingStatus==='STOPPED'?'stopped':'')}>{t(row.sellingStatus==='STOPPED'?'Stopped':'Selling')}</span></td><td>{duration(row)}</td><td className="pkg-price">{price(row)}</td><td className="pkg-registration-count">{number(row.activeSubscribers || 0)}</td><td className="pkg-actions-cell">{actions(row)}</td></tr>)}</tbody></table></div> : <div className="pkg-card-grid">{block.items.map(row => <article className="pkg-card" key={row.packageId}><div className="pkg-card-cover"><ResourcePhoto imagePath={row.imagePath} name={row.packageName} variant="cover" fallback={<PackageType type={row.packageType} iconOnly />} /></div><div className="pkg-card-top"><PackageType type={row.packageType} name={typeName(row.packageType)} />{actions(row)}</div><h2><button type="button" aria-label={t('View package {0}', [row.packageName])} onClick={() => openDetail(row)}>{row.packageName}</button></h2><span className={'pkg-selling-badge '+(row.sellingStatus==='STOPPED'?'stopped':'')}>{t(row.sellingStatus==='STOPPED'?'Stopped':'Selling')}</span><strong className="pkg-card-price">{price(row)}</strong><PackageBenefits benefits={row.benefits}/><div className="pkg-card-details">{duration(row)}<span>{t('{0} active registrations', [number(row.activeSubscribers || 0)])}</span></div></article>)}</div>}
      </div>
      <ManagerPagination block={block} size={state.size} sizes={PACKAGE_SIZES} formatNumber={number} onPage={page => patch({ page })} onSize={state.display === 'table' ? size => patch({ size, page: 1 }) : undefined} />
    </>}
    {editLoading&&<p role="status">{t('Loading package details...')}</p>}
    {detailId&&!editor&&<PackageDetailDialog key={detailId} id={detailId} load={managerService.packageDetail} loadHistory={managerService.packageHistory} onClose={closeDetail} onEdit={data=>{closeDetail();setEditor({item:data});}}/>}
    <ConfirmDialog busy={statusSaving} open={Boolean(selling)} title={selling?.sellingStatus==='STOPPED'?'Resume selling':'Stop selling'} message={selling?.sellingStatus==='STOPPED'?t('This package will become available for new purchases again.'):t('New purchases and renewals will be blocked. Existing registrations keep their benefits. Valid checkouts already issued can still complete. Active registrations: {0}',[selling?.activeSubscribers||0])} confirmLabel={statusSaving?'Saving...':'Confirm'} onClose={()=>{if(!statusSaving)setSelling(null);}} onConfirm={changeSelling}/>
    {editor && <PackageEditor {...editor} onCatalog={setCatalog} onClose={() => setEditor(null)} onSave={savePackage} onSaved={() => { setEditor(null); notify('Changes saved.'); refresh?.(); }} />}
  </div>;
}
