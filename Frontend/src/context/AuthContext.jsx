import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));

  const login = (role) => {
    localStorage.setItem('userRole', role);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem('userRole');
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
