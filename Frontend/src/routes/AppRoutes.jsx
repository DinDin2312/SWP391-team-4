import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLE_ROUTES } from '../config/roles';

// Auth Pages
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const Register = lazy(() => import('../features/auth/pages/Register'));
const OTPVerification = lazy(() => import('../features/auth/pages/OTPVerification'));
const ForgotPassword = lazy(() => import('../features/auth/pages/ForgotPassword'));

// Layouts & Pages
import MemberLayout from '../layouts/MemberLayout';
const CustomerDashboard = lazy(() => import('../features/member/pages/CustomerDashboard'));
const MySchedule = lazy(() => import('../features/member/pages/MySchedule'));
const Memberships = lazy(() => import('../features/member/pages/Memberships'));
const BookClass = lazy(() => import('../features/member/pages/BookClass'));
const Notifications = lazy(() => import('../features/member/pages/Notifications'));
const Settings = lazy(() => import('../features/member/pages/Settings'));

import CoachLayout from '../layouts/CoachLayout';
const CoachDashboard = lazy(() => import('../features/coach/pages/CoachDashboard'));
const CoachSchedule = lazy(() => import('../features/coach/pages/CoachSchedule'));
const CoachStudents = lazy(() => import('../features/coach/pages/CoachStudents'));
const ManagerDashboard = lazy(() => import('../features/manager/pages/ManagerDashboard'));
const ReceptionistDashboard = lazy(() => import('../features/receptionist/pages/ReceptionistDashboard'));

function AppRoutes() {
  return (
    <Suspense fallback={<div role="status" style={{ padding: 32 }}>Đang tải trang...</div>}><Routes>
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

      {/* Coach Routes wrapped in CoachLayout */}
      <Route path="/coach" element={
        <ProtectedRoute allowedRoles={['Coach']}>
          <CoachLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<CoachDashboard />} />
        <Route path="schedule" element={<CoachSchedule />} />
        <Route path="students" element={<CoachStudents />} />
      </Route>

      {/* Legacy role path mappings */}
      <Route path={ROLE_ROUTES.customer} element={<Navigate to="/member/dashboard" replace />} />
      <Route path={ROLE_ROUTES.staff} element={<ProtectedRoute allowedRoles={['Receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />
      <Route path={ROLE_ROUTES.trainer} element={<Navigate to="/coach/dashboard" replace />} />
      <Route path={ROLE_ROUTES.admin} element={<ProtectedRoute allowedRoles={['Center Manager']}><ManagerDashboard /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Suspense>
  );
}

export default AppRoutes;
