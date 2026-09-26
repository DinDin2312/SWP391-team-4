import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem('userInfo');
    return stored ? JSON.parse(stored) : null;
  });

  const login = ({ token, role, email, fullName }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userInfo', JSON.stringify({ email, fullName, role }));
    setUserRole(role);
    setUserInfo({ email, fullName, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    setUserRole(null);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ userRole, userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
