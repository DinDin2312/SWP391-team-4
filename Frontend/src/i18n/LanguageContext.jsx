import { useEffect, useState } from 'react';
import { getLanguage, subscribeLanguage } from './languageStore';
import { LanguageContext } from './useLanguage';
import './language.css';
export default function LanguageProvider({ children }) {
  const [language, update] = useState(getLanguage);
  useEffect(() => subscribeLanguage(update), []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}
