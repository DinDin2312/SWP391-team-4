import { useLanguage } from '../i18n/useLanguage';
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  useLanguage();
  const { userRole } = useContext(AuthContext);

  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Return generic fallback or home if unauthorized
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
