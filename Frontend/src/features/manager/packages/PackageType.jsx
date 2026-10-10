import { t, useLanguage } from '../../../i18n/useLanguage';
import { typeMeta } from './packageTypes';

export default function PackageType({ type, name, iconOnly = false }) {
  useLanguage();
  const { icon: Icon, tone, label } = typeMeta(type);
  return <span className={`pkg-type pkg-type-${tone}`}><Icon size={18} aria-hidden="true" />{!iconOnly && <span>{t(name||label)}</span>}</span>;
}
