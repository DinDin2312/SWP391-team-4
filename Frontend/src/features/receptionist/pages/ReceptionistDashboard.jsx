import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';

const ReceptionistDashboard = () => (
  <DashboardLayout title="Staff Dashboard" roleName="Staff">
    <h2>Front Desk Portal</h2>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Check-in members, handle inquiries, and process new registrations.</p>
  </DashboardLayout>
);

export default ReceptionistDashboard;
