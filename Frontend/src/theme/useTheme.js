import { useState, useEffect } from 'react';
import { getTheme, subscribeTheme, toggleTheme, setTheme } from './themeStore';

export function useTheme() {
  const [theme, setLocalTheme] = useState(getTheme);

  useEffect(() => {
    setLocalTheme(getTheme());
    return subscribeTheme(setLocalTheme);
  }, []);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };
}

export default useTheme;
