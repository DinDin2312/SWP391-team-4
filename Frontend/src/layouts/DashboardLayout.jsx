import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = ({ title, roleName, children }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Logged in as: {roleName}</p>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>
      <main className="glass-panel" style={{ padding: '2rem', minHeight: '400px' }}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
