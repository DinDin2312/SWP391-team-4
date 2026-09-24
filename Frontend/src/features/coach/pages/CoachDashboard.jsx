import React from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout';

const CoachDashboard = () => (
  <DashboardLayout title="Trainer Dashboard" roleName="Trainer">
    <h2>Trainer Portal</h2>
    <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Manage your trainees, update your availability, and view upcoming classes.</p>
  </DashboardLayout>
);

export default CoachDashboard;
