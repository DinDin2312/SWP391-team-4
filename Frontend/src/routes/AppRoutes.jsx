import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLE_ROUTES } from '../config/roles';

// Auth Pages
import LoginPage from '../features/auth/pages/LoginPage';
import Register from '../features/auth/pages/Register';
import OTPVerification from '../features/auth/pages/OTPVerification';
import ForgotPassword from '../features/auth/pages/ForgotPassword';

// Dashboard Pages
import CoachDashboard from '../pages/CoachDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import ReceptionistDashboard from '../pages/ReceptionistDashboard';

const DASHBOARD_ROUTES = [
  { role: 'Member', path: ROLE_ROUTES.customer, component: CustomerDashboard },
  { role: 'Receptionist', path: ROLE_ROUTES.staff, component: ReceptionistDashboard },
  { role: 'Coach', path: ROLE_ROUTES.trainer, component: CoachDashboard },
  { role: 'Admin', path: ROLE_ROUTES.admin, component: ManagerDashboard },
];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {DASHBOARD_ROUTES.map(({ role, path, component: Dashboard }) => (
        <Route
          key={role}
          path={path}
          element={
            <ProtectedRoute allowedRoles={[role]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
