import { useState } from 'react';

const STORAGE_KEY = 'nexusTheme';

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('managerTheme');
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const useRoleTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, nextTheme);
      localStorage.removeItem('managerTheme');
      return nextTheme;
    });
  };

  return { theme, toggleTheme };
};
