import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Info, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import ConfirmDialog from '../staff/ConfirmDialog';
import PackageType from './PackageType';
import PackageTypeField from './PackageTypeField';
import { packageForm, parsePriceInput, priceInput, validatePackage } from './packagesState';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import { validateResourceImage } from '../../../components/resource-images/resourceImages';
import PackageBenefitsEditor from './PackageBenefitsEditor';

const fields = ['packageName', 'packageType', 'durationDays', 'price', 'benefits', 'description', 'terms', 'purchaseLimitPerMember'];
function trapTab(event, element) {
  if (event.key !== 'Tab') return;
  const controls = [...element.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')].filter(node=>node.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && (document.activeElement === last || document.activeElement === element)) { event.preventDefault(); first?.focus(); }
}

export default function PackageEditor({ item, initial, onClose, onSave, onSaved, onCatalog }) {
  useLanguage();
  const editing = Boolean(item?.packageId);
  const [original] = useState(() => packageForm(initial || item));
  const [form, setForm] = useState(original);
  const [types,setTypes]=useState(null);
  const updateCatalog=useCallback(values=>{setTypes(values);onCatalog?.(values);},[onCatalog]);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [photoFile,setPhotoFile]=useState(null),[removePhoto,setRemovePhoto]=useState(false),[photoError,setPhotoError]=useState(''),[preview,setPreview]=useState('');
  const photoInput=useRef(null);
  const dialog = useRef(null), backdrop = useRef(null), nameInput = useRef(null);
  const id = useId();
  const errors = { ...validatePackage(form,types), ...serverErrors };
  const dirty = JSON.stringify(form) !== JSON.stringify(original) || Boolean(photoFile) || removePhoto;
  const requestClose = useCallback(() => { if (!saving) { if (dirty) setDiscard(true); else onClose(); } }, [saving, dirty, onClose]);
  const cancelDiscard = useCallback(() => setDiscard(false), []);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameInput.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  const choosePhoto=event=>{
    const selected=event.target.files?.[0];event.target.value='';if(!selected)return;
    const invalid=validateResourceImage(selected);setPhotoError(invalid);
    if(!invalid){setPhotoFile(selected);setPreview(URL.createObjectURL(selected));setRemovePhoto(false);}
  };
  const change = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
    setServerErrors(current => { const next = { ...current }; delete next[key]; return next; });
  };
  const invalid = key => Boolean(touched[key] && errors[key]);
  const inputProps = key => ({ id: `${id}-${key}`, 'aria-invalid': invalid(key), 'aria-describedby': `${id}-${key}-help${invalid(key) ? ` ${id}-${key}-error` : ''}`, onBlur: () => setTouched(current => ({ ...current, [key]: true })) });
  const fieldError = key => invalid(key) && <small className="manager-field-error" id={`${id}-${key}-error`}>{t(errors[key])}</small>;
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setTouched(Object.fromEntries(fields.map(key => [key, true])));
    if (!types || Object.keys(validatePackage(form,types)).length || photoError) return;
    setSaving(true); setError(''); setServerErrors({});
    try {
      await onSave({ ...form, purchaseLimitPerMember:form.purchaseLimitPerMember?Number(form.purchaseLimitPerMember):null,updatePurchaseLimit:true, benefits:form.benefits.map(row=>({subjectId:Number(row.subjectId),sessionLimit:Number(row.sessionLimit),roomIds:row.roomIds||[]})), ...(editing ? { packageId: item.packageId } : {}), durationDays: Number(form.durationDays), price: Number(form.price) },{file:photoFile,remove:removePhoto});
      onSaved();
    } catch (failure) {
      const response = failure.response?.data;
      setError(response?.message || failure.message || 'Unable to save changes.');
      // Only explicit field errors are attached to inputs; generic 409 stays at form level.
      setServerErrors(Object.fromEntries(Object.entries(response?.errors || {}).filter(([key]) => fields.includes(key))));
    } finally { setSaving(false); }
  };
  return <div ref={backdrop} className="manager-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !discard) requestClose(); }} onKeyDown={event => {
    if (discard) { trapTab(event, backdrop.current.querySelector('[role="alertdialog"]')); return; }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestClose(); }
    trapTab(event, dialog.current);
  }}>
    <section ref={dialog} className="manager-modal pkg-editor" role="dialog" aria-modal={discard ? undefined : 'true'} aria-hidden={discard || undefined} inert={discard || undefined} aria-labelledby={`${id}-title`} tabIndex={-1}>
      <header><h2 id={`${id}-title`}>{t(editing ? 'Edit membership package' : 'Create membership package')}</h2><button type="button" disabled={saving} aria-label={t('Close')} onClick={requestClose}><X size={20} aria-hidden="true" /></button></header>
      <form noValidate onSubmit={submit}>
        {error && <div className="manager-form-error" role="alert">{t(error)}</div>}
        {editing && Number(item.activeSubscribers) > 0 && <p className="pkg-edit-note"><Info size={18} aria-hidden="true" />{t('Purchased package benefits, price and duration are preserved. Changes apply to new purchases.')}</p>}
        <fieldset disabled={saving}>
          <section className="pkg-photo-field" aria-labelledby={`${id}-photo-title`}>
            <h3 id={`${id}-photo-title`}>{t('Package photo')}</h3>
            <div className="pkg-photo-row">
              <ResourcePhoto imagePath={removePhoto?null:item?.imagePath} source={preview} name={form.packageName || t('Membership package')} variant="cover" fallback={<PackageType type={form.packageType} iconOnly/>}/>
              <div className="pkg-photo-controls">
                <input ref={photoInput} hidden type="file" accept="image/png,image/jpeg" aria-label={t('Choose photo')} onChange={choosePhoto}/>
                <div className="pkg-photo-buttons"><button type="button" className="manager-secondary" onClick={()=>photoInput.current?.click()}><ImagePlus size={16} aria-hidden="true"/>{t(photoFile || (item?.imagePath && !removePhoto)?'Replace photo':'Choose photo')}</button>
                {(photoFile || (item?.imagePath && !removePhoto)) && <button type="button" className="manager-secondary" onClick={()=>{setPhotoFile(null);setPreview('');setRemovePhoto(Boolean(item?.imagePath));setPhotoError('');}}>{t('Remove photo')}</button>}
                {(photoFile || removePhoto || photoError) && <button type="button" className="manager-secondary" onClick={()=>{setPhotoFile(null);setPreview('');setRemovePhoto(false);setPhotoError('');}}>{t('Undo photo change')}</button>}</div>
                {photoFile && <small className="pkg-photo-filename">{photoFile.name}</small>}
                {removePhoto && <small>{t('The photo will be removed when you save changes.')}</small>}
                <small>{t('PNG or JPEG · max 2 MB. Photos are optimized on upload; transparent areas become white.')}</small>
                {photoError && <small className="manager-field-error" role="alert">{t(photoError)}</small>}
              </div>
            </div>
          </section>
          <div className="manager-form-grid">
            <div className="pkg-field wide"><label htmlFor={`${id}-packageName`}>{t('Package name')}<b aria-hidden="true"> *</b></label><input ref={nameInput} {...inputProps('packageName')} required value={form.packageName} placeholder={t('Enter package name')} onChange={event => change('packageName', event.target.value)} /><small id={`${id}-packageName-help`}>{t('Up to 255 characters.')}</small>{fieldError('packageName')}</div>
            <div className="pkg-field wide"><label htmlFor={`${id}-packageType`}>{t('Package type')}<b aria-hidden="true"> *</b></label><PackageTypeField value={form.packageType} onChange={value=>change('packageType',value)} onCatalog={updateCatalog} inputProps={inputProps('packageType')} /><small id={`${id}-packageType-help`}>{t('Package types are shared categories. Benefits are configured separately for each package.')}</small>{fieldError('packageType')}</div>
            <div className="pkg-field wide"><label htmlFor={`${id}-durationDays`}>{t('Duration (days)')}<b aria-hidden="true"> *</b></label><div className="pkg-duration-presets" role="group" aria-label={t('Quick duration choices')}>{[7, 30, 90, 180, 365].map(days => <button type="button" key={days} aria-pressed={Number(form.durationDays) === days} onClick={() => change('durationDays', String(days))}>{t('{0} days', [days])}</button>)}</div><input {...inputProps('durationDays')} required type="number" min="1" step="1" value={form.durationDays} placeholder={t('Enter number of days')} onChange={event => change('durationDays', event.target.value)} /><small id={`${id}-durationDays-help`}>{t('Enter a positive whole number of days.')}</small>{fieldError('durationDays')}</div>
            <div className="pkg-field wide"><label htmlFor={`${id}-price`}>{t('Price')}<b aria-hidden="true"> *</b></label><div className="pkg-price-input"><input {...inputProps('price')} required type="text" inputMode="decimal" value={priceInput(form.price)} placeholder="0" onChange={event => {
              const input = event.target, position = input.selectionStart || 0;
              const significant = input.value.slice(0, position).replaceAll('.', '').length;
              const raw = parsePriceInput(input.value);
              change('price', raw);
              // Preserve caret position when grouping separators are inserted during typing.
              requestAnimationFrame(() => { const display = priceInput(raw); let index = 0, count = 0; while (index < display.length && count < significant) { if (display[index] !== '.') count++; index++; } if (document.activeElement === input) input.setSelectionRange(index, index); });
            }} /><span aria-hidden="true">₫</span></div><small id={`${id}-price-help`}>{t('0 is free. Use a comma for decimals; up to 99,999,999.99 ₫.')}</small>{fieldError('price')}</div>
          </div>
          <div className="pkg-content-fields">
            <label htmlFor={id+'-description'}>{t('Description')}<textarea {...inputProps('description')} maxLength={1000} rows={3} value={form.description} onChange={e=>change('description',e.target.value)}/><small id={`${id}-description-help`}>{form.description.length}/1000 · {t('Plain text, optional.')}</small>{fieldError('description')}</label>
            <label htmlFor={id+'-terms'}>{t('Terms')}<textarea {...inputProps('terms')} maxLength={10000} rows={5} value={form.terms} onChange={e=>change('terms',e.target.value)}/><small id={`${id}-terms-help`}>{form.terms.length}/10000 · {t('Line breaks are preserved. Plain text, optional.')}</small>{fieldError('terms')}</label>
            <label htmlFor={id+'-purchaseLimitPerMember'}>{t('Purchase limit per member')}<input {...inputProps('purchaseLimitPerMember')} type="number" min="1" step="1" value={form.purchaseLimitPerMember} onChange={e=>change('purchaseLimitPerMember',e.target.value)}/><small id={`${id}-purchaseLimitPerMember-help`}>{t('Leave blank for unlimited. Set 1 for a one-time trial. Completed purchases count even after the package expires.')}</small>{fieldError('purchaseLimitPerMember')}</label>
          </div>
          <PackageBenefitsEditor value={form.benefits} onChange={benefits=>change('benefits',benefits)} />
          {invalid('benefits') && <div role="alert">{fieldError('benefits')}</div>}

        </fieldset>
        <footer><button type="button" className="manager-secondary" disabled={saving} onClick={requestClose}>{t('Cancel')}</button><button className="manager-primary" disabled={saving}>{t(saving ? 'Saving...' : editing ? 'Save Changes' : 'Create package')}</button></footer>
      </form>
    </section>
    <ConfirmDialog open={discard} title="Discard unsaved changes?" message="Your package changes have not been saved." confirmLabel="Discard changes" onClose={cancelDiscard} onConfirm={onClose} />
  </div>;
}
