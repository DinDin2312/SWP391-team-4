import { t, useLanguage } from '../i18n/useLanguage';
import { useEffect, useRef, useState } from 'react';
import './auto-sidebar.css';

export default function AutoSidebar({ children, className = '', style }) {
  const language = useLanguage();
  const [collapsed, setCollapsed] = useState(true);
  const sidebar = useRef(null);
  useEffect(() => {
    sidebar.current?.querySelectorAll('button').forEach((button) => {
      const label = t(button.getAttribute('aria-label') || button.title || button.textContent.trim());
      if (label) { button.setAttribute('aria-label', label); button.title = label; }
    });
  }, [children, language]);
  return <aside ref={sidebar} className={`auto-sidebar ${collapsed ? 'is-collapsed' : ''} ${className}`}
    style={{ ...style, width: 'var(--role-sidebar-width)' }}
    onMouseEnter={() => setCollapsed(false)} onMouseLeave={() => setCollapsed(true)}
    onFocus={() => setCollapsed(false)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) setCollapsed(true); }}>
    {children}
  </aside>;
}
