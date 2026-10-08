import { useLanguage, t } from './useLanguage';
import { setLanguage } from './languageStore';
export default function LanguageSwitcher({ floating = false }) {
  const language = useLanguage();
  return <div className={`language-switcher${floating ? ' is-floating' : ''}`} role="group" aria-label={t('Interface language')}>{['en','vi'].map(value => <button key={value} type="button" lang={value} aria-pressed={language === value} title={value === 'en' ? 'English' : 'Tiếng Việt'} onClick={() => setLanguage(value)}>{value.toUpperCase()}</button>)}</div>;
}
