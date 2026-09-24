import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';

const ManagerDashboard = () => (
  <DashboardLayout title="Admin Dashboard" roleName="Admin">
    <h2>Management Dashboard</h2>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>View center analytics, manage staff, and oversee operations.</p>
  </DashboardLayout>
);

export default ManagerDashboard;

