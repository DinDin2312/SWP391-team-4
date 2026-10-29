import { useLanguage } from '../i18n/useLanguage';
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  useLanguage();
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const handleProfileUpdated = () => {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        try {
          setUserInfo(JSON.parse(stored));
        } catch {}
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdated);
  }, []);

  const login = ({ token, role, email, fullName, avatarUrl }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    const info = { email, fullName, role, avatarUrl };
    localStorage.setItem('userInfo', JSON.stringify(info));
    setUserRole(role);
    setUserInfo(info);
  };

  const updateUserInfo = (updates) => {
    setUserInfo((prev) => {
      const next = { ...(prev || {}), ...updates };
      localStorage.setItem('userInfo', JSON.stringify(next));
      return next;
    });
    window.dispatchEvent(new Event('userProfileUpdated'));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    setUserRole(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ userRole, userInfo, login, logout, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};
