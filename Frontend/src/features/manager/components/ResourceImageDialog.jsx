import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import { validateResourceImage } from '../../../components/resource-images/resourceImages';
import managerService from '../services/managerService';
import ConfirmDialog from '../staff/ConfirmDialog';

export default function ResourceImageDialog({ config, onClose, onSaved, upload = managerService.uploadResourceImage, remove = managerService.removeResourceImage }) {
  useLanguage();
  const { resource, id, name, imagePath } = config;
  const [file, setFile] = useState(null), [preview, setPreview] = useState(''), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [confirm, setConfirm] = useState(null);
  const dialog = useRef(null), wrapper = useRef(null), input = useRef(null);
  const titleId = useId();
  const close = useCallback(() => { if (!busy) { if (file) setConfirm('discard'); else onClose(); } }, [busy, file, onClose]);
  const cancelConfirm = useCallback(() => setConfirm(null), []);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const select = event => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    const invalid = validateResourceImage(selected);
    setError(invalid);
    if (!invalid) { setFile(selected); setPreview(URL.createObjectURL(selected)); }
    else { setFile(null); setPreview(''); }
  };
  const save = async deleting => {
    if (busy || (!deleting && !file)) return;
    setBusy(true); setError('');
    try {
      if (deleting) await remove(resource, id); else await upload(resource, id, file);
      onSaved(deleting ? 'Photo removed.' : 'Photo saved.');
    } catch (failure) { setError(failure.response?.data?.message || 'Unable to save the photo. Please try again.'); }
    finally { setBusy(false); setConfirm(null); }
  };
  return <div ref={wrapper} className="manager-modal-backdrop" onMouseDown={event => { if (!confirm && event.target === event.currentTarget) close(); }} onKeyDown={event => {
    if (event.key === 'Escape' && !confirm) { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key !== 'Tab') return;
    const region = confirm ? wrapper.current.querySelector('[role="alertdialog"]') : dialog.current;
    const controls = [...region.querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter(node => node.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (!first) event.preventDefault();
    else if (event.shiftKey && (document.activeElement === first || document.activeElement === region)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === region)) { event.preventDefault(); first.focus(); }
  }}>
    <section ref={dialog} className="manager-modal resource-image-dialog" role="dialog" tabIndex={-1} aria-labelledby={titleId} aria-modal={confirm ? undefined : 'true'} aria-hidden={Boolean(confirm) || undefined} inert={Boolean(confirm) || undefined}>
      <header><div><h2 id={titleId}>{t('Manage photo')}</h2><p>{name}</p></div><button type="button" disabled={busy} aria-label={t('Close')} onClick={close}><X size={20} aria-hidden="true" /></button></header>
      <div className="resource-image-dialog-body">
        {error && <div className="manager-form-error" role="alert">{t(error)}</div>}
        <ResourcePhoto imagePath={imagePath} source={preview} name={name} variant="hero" />
        <p className="resource-image-help">{t(resource === 'packages' ? 'This photo is shown on admin package cards and in the member package store.' : resource === 'subjects' ? 'This photo is shown beside the subject name in the subjects list.' : 'This photo is shown in resource details and as a small list thumbnail.')}</p>
        <input ref={input} hidden type="file" accept="image/png,image/jpeg" aria-label={t('Choose photo')} onChange={select} disabled={busy} />
        <button type="button" className="manager-secondary" disabled={busy} onClick={() => input.current?.click()}><ImagePlus size={17} aria-hidden="true" />{t(imagePath || file ? 'Replace photo' : 'Choose photo')}</button>
        {file && <div className="resource-image-selection"><span>{file.name}</span><button type="button" disabled={busy} onClick={() => { setFile(null); setPreview(''); setError(''); }}>{t('Clear selection')}</button></div>}
        <small className="resource-image-help">{t('PNG or JPEG · max 2 MB. Photos are optimized on upload; transparent areas become white.')}</small>
      </div>
      <footer>{imagePath && <button type="button" className="resource-image-remove" disabled={busy} onClick={() => setConfirm('remove')}>{t('Remove photo')}</button>}<button type="button" className="manager-secondary" disabled={busy} onClick={close}>{t('Cancel')}</button><button type="button" className="manager-primary" disabled={busy || !file} onClick={() => save(false)}>{t(busy ? 'Saving...' : 'Save photo')}</button></footer>
    </section>
    <ConfirmDialog open={Boolean(confirm)} title={confirm === 'remove' ? 'Remove this photo?' : 'Discard unsaved changes?'} message={confirm === 'remove' ? 'The subject, room, class or package will remain available.' : 'The selected photo has not been saved.'} confirmLabel={confirm === 'remove' ? 'Remove photo' : 'Discard changes'} busy={busy} onClose={cancelConfirm} onConfirm={confirm === 'remove' ? () => save(true) : onClose} />
  </div>;
}
