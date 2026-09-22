import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

const CustomerDashboard = () => (
  <DashboardLayout title="Customer Dashboard" roleName="Customer">
    <h2>Welcome to your Sports Center Portal</h2>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Here you can view your class schedules, membership status, and book new sessions.</p>
  </DashboardLayout>
);

export default CustomerDashboard;
