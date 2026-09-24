import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLE_ROUTES } from '../config/roles';

// Auth Pages
import LoginPage from '../features/auth/pages/LoginPage';
import Register from '../features/auth/pages/Register';
import OTPVerification from '../features/auth/pages/OTPVerification';
import ForgotPassword from '../features/auth/pages/ForgotPassword';

// Layouts & Pages
import MemberLayout from '../layouts/MemberLayout';
import CustomerDashboard from '../features/member/pages/CustomerDashboard';
import MySchedule from '../features/member/pages/MySchedule';
import Memberships from '../features/member/pages/Memberships';
import BookClass from '../features/member/pages/BookClass';
import Notifications from '../features/member/pages/Notifications';
import Settings from '../features/member/pages/Settings';

import CoachDashboard from '../features/coach/pages/CoachDashboard';
import ManagerDashboard from '../features/manager/pages/ManagerDashboard';
import ReceptionistDashboard from '../features/receptionist/pages/ReceptionistDashboard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Member Routes wrapped in MemberLayout */}
      <Route path="/member" element={
        <ProtectedRoute allowedRoles={['Member']}>
          <MemberLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="memberships" element={<Memberships />} />
        <Route path="book-class" element={<BookClass />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Legacy role path mappings */}
      <Route path={ROLE_ROUTES.customer} element={<Navigate to="/member/dashboard" replace />} />
      <Route path={ROLE_ROUTES.staff} element={<ProtectedRoute allowedRoles={['Receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path={ROLE_ROUTES.trainer} element={<ProtectedRoute allowedRoles={['Coach']}><CoachDashboard /></ProtectedRoute>} />
      <Route path={ROLE_ROUTES.admin} element={<ProtectedRoute allowedRoles={['Admin']}><ManagerDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
