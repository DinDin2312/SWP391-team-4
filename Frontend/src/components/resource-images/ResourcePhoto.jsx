import { Image } from 'lucide-react';
import { useState } from 'react';
import { t, useLanguage } from '../../i18n/useLanguage';
import { resourceImageUrl } from './resourceImages';
import './resource-images.css';

export default function ResourcePhoto({ imagePath, name, source, fallbackSource = '', variant = 'thumbnail', fallback }) {
  useLanguage();
  const primary = source || resourceImageUrl(imagePath);
  const [failed, setFailed] = useState('');
  const url = primary && failed !== primary ? primary : (fallbackSource && failed !== fallbackSource ? fallbackSource : '');
  const available = Boolean(url);
  return <span className={`resource-photo resource-photo-${variant}`}>
    {available ? <img src={url} alt={variant === 'thumbnail' ? '' : t('Photo of {0}', [name])} loading="lazy" decoding="async" width="1600" height="1000" onError={() => setFailed(url)} /> : <span className="resource-photo-placeholder">{fallback || <><Image size={variant === 'thumbnail' ? 18 : 30} aria-hidden="true" />{variant !== 'thumbnail' && <span>{t('No photo yet')}</span>}</>}</span>}
  </span>;
}
