import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userRole } = useContext(AuthContext);

  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Return generic fallback or home if unauthorized
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
