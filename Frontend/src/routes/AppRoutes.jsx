import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { ROLE_ROUTES } from '../config/roles';
import CoachDashboard from '../pages/CoachDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import LoginPage from '../pages/LoginPage';
import ManagerDashboard from '../pages/ManagerDashboard';
import ReceptionistDashboard from '../pages/ReceptionistDashboard';
import Register from '../pages/Register';
import OTPVerification from '../pages/OTPVerification';

const DASHBOARD_ROUTES = [
  { role: 'customer', path: ROLE_ROUTES.customer, component: CustomerDashboard },
  { role: 'staff', path: ROLE_ROUTES.staff, component: ReceptionistDashboard },
  { role: 'trainer', path: ROLE_ROUTES.trainer, component: CoachDashboard },
  { role: 'admin', path: ROLE_ROUTES.admin, component: ManagerDashboard },
];

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OTPVerification />} />
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
