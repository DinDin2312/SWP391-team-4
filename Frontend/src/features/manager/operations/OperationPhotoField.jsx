import { ImagePlus } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import ResourcePhoto from '../../../components/resource-images/ResourcePhoto';
import { validateResourceImage } from '../../../components/resource-images/resourceImages';
import { t } from '../../../i18n/useLanguage';

export default function OperationPhotoField({imagePath,name,value,onChange,onError}) {
  const [preview,setPreview]=useState(''),[error,setError]=useState('');
  const input=useRef(null),id=useId();
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
  const reset=(next)=>{setPreview('');setError('');onError('');onChange(next);};
  const hasPhoto=value.file || (imagePath && !value.remove);
  return <section className="ops-editor-photo" aria-label={t('Photo')}>
    <ResourcePhoto imagePath={value.remove?null:imagePath} source={value.file?preview:''} name={name || t('Photo')} variant="hero"/>
    <div><strong>{t('Photo')}</strong><p className="ops-note">{t('This photo is shown in resource details and as a small list thumbnail.')}</p>
      <input id={id} ref={input} hidden type="file" accept="image/png,image/jpeg" aria-label={t('Choose photo')} onChange={event=>{
        const file=event.target.files?.[0];event.target.value='';if(!file)return;
        const invalid=validateResourceImage(file);setError(invalid);onError(invalid);
        if(!invalid){setPreview(URL.createObjectURL(file));onChange({file,remove:false});}
      }}/>
      <div className="ops-editor-photo-actions"><button type="button" className="manager-secondary" onClick={()=>input.current?.click()}><ImagePlus size={16} aria-hidden="true"/>{t(hasPhoto?'Replace photo':'Choose photo')}</button>
      {hasPhoto && <button type="button" className="manager-secondary" onClick={()=>reset({file:null,remove:Boolean(imagePath)})}>{t('Remove photo')}</button>}
      {(value.file || value.remove || error) && <button type="button" className="manager-secondary" onClick={()=>reset({file:null,remove:false})}>{t('Undo photo change')}</button>}</div>
      {value.file && <small className="ops-note">{value.file.name}</small>}
      <small className="ops-note">{t('PNG or JPEG · max 2 MB. Photos are optimized on upload; transparent areas become white.')}</small>
      {error && <p role="alert" className="manager-field-error">{t(error)}</p>}
    </div>
  </section>;
}
