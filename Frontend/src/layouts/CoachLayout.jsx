import AutoSidebar from '../components/AutoSidebar';
import React, { useContext, useState, Suspense } from 'react';
import { useOutlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, Users, Dumbbell,
  Settings, LogOut, Award, Bell
} from 'lucide-react';
import SendNotificationModal from '../features/coach/components/SendNotificationModal';

const CoachLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentOutlet = useOutlet();
  const { userInfo, logout } = useContext(AuthContext);

  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);



  const fullName = userInfo?.fullName || 'Coach Trainer';
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/coach/dashboard': return 'Coach Dashboard';
      case '/coach/schedule': return 'Teaching Schedule & Trainees';
      case '/coach/students': return 'Assigned Trainees';
      case '/coach/settings': return 'Settings';
      default: return 'Coach Portal';
    }
  };

  return (
    <div className={`role-shell min-h-screen bg-[var(--bg)] text-[var(--text)] flex font-sans antialiased selection:bg-[var(--primary)] selection:text-[color:var(--on-primary)]`}>
      {/* ===================== SIDEBAR ===================== */}
      <AutoSidebar className="w-64 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="auto-sidebar-brand p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-[var(--shadow)] text-[color:var(--on-primary)]">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-[var(--text)]">NEXUS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
              </div>
              <p className="text-[10px] tracking-widest text-[var(--text-muted)] font-semibold uppercase">COACH PORTAL</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="auto-sidebar-nav px-3 space-y-1 mt-2">
            <button
              onClick={() => navigate("/coach/dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/dashboard')
                  ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/coach/schedule")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/schedule')
                  ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Teaching Schedule</span>
            </button>

            <button
              onClick={() => navigate("/coach/students")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/students')
                  ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Assigned Trainees</span>
            </button>

            <button
              onClick={() => navigate("/coach/settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/settings')
                  ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Coach Profile Footer */}
        <div className="auto-sidebar-footer p-4 border-t border-[var(--border)]">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--success-hover)] border-2 border-[var(--border)]"></span>
              </div>
              <div className="auto-sidebar-profile-text text-left">
                <p className="text-xs font-bold text-[var(--text)] leading-tight">{fullName}</p>
                <p className="text-[10px] text-[var(--primary)] flex items-center gap-1">
                  <Award className="w-3 h-3 text-[var(--warning-text)] inline" /> Senior Coach
                </p>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AutoSidebar>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 overflow-y-auto p-8 max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <nav className="role-breadcrumb" aria-label="Breadcrumb"><span>Coach portal</span><span aria-hidden="true">/</span><strong>{getPageTitle()}</strong></nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNotifModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Gá»­i thĂ´ng bĂ¡o</span>
            </button>
            <button onClick={handleLogout} className="px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-slate-600 text-[var(--text)] hover:text-[var(--text)] text-xs font-medium transition-colors flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <p className="text-sm">Loading module...</p>
                </div>
              }>
                {currentOutlet && React.cloneElement(currentOutlet, { key: location.pathname })}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Notification Modal for Coach Portal */}
      <SendNotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
      />
    </div>
  );
};

export default CoachLayout;

