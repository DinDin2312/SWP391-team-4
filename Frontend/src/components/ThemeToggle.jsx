import React, { useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/useTheme';
import { t } from '../i18n/useLanguage';

export default function ThemeToggle({ className = '', floating = false }) {
  const { isDark, toggleTheme } = useTheme();
  const [pressed, setPressed] = useState(false);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPressed(true);
    setTimeout(() => setPressed(false), 180);
    toggleTheme(buttonRef.current);
  };

  const label = isDark ? t('Switch to Light Mode') : t('Switch to Dark Mode');

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)] active:scale-95 transition-all duration-150 shadow-xs cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
        pressed ? 'scale-95' : ''
      } ${floating ? 'fixed right-24 top-4 z-40' : ''} ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden pointer-events-none">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 shrink-0 transform transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0 transform transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>
    </button>
  );
}
