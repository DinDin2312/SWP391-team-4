import React, { useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/useTheme';
import { t } from '../i18n/useLanguage';

export default function ThemeToggle({ className = '', floating = false }) {
  const { isDark, toggleTheme } = useTheme();
  const [bouncing, setBouncing] = useState(false);
  const buttonRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    setBouncing(true);
    toggleTheme(buttonRef.current);
  };

  const label = isDark ? t('Switch to Light Mode') : t('Switch to Dark Mode');

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBouncing(false)}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)] transition-colors shadow-xs cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${
        bouncing ? 'theme-toggle-spring' : ''
      } ${floating ? 'fixed right-24 top-4 z-40' : ''} ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* Sun Icon (shown when in Dark mode, clicking turns to Light) */}
        <Sun
          className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 ease-out transform ${
            isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
          }`}
        />
        {/* Moon Icon (shown when in Light mode, clicking turns to Dark) */}
        <Moon
          className={`w-4 h-4 text-slate-700 dark:text-slate-300 absolute transition-all duration-300 ease-out transform ${
            !isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
          }`}
        />
      </div>
    </button>
  );
}
