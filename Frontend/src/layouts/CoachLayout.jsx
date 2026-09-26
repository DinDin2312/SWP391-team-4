import React, { useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, Users, Dumbbell,
  Bell, Settings, LogOut, ShieldCheck, Award
} from 'lucide-react';

const CoachLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, logout } = useContext(AuthContext);

  const fullName = userInfo?.fullName || 'Coach Trainer';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/coach/dashboard': return 'Coach Dashboard';
      case '/coach/schedule': return 'Teaching Schedule';
      case '/coach/settings': return 'Settings';
      default: return 'Coach Portal';
    }
  };

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-200 flex font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* ===================== SIDEBAR ===================== */}
      <aside className="w-64 border-r border-[#15203b] bg-[#091124] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-base text-white">NEXUS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              </div>
              <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">COACH PORTAL</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <button 
              onClick={() => navigate("/coach/dashboard")} 
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/dashboard') 
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button 
              onClick={() => navigate("/coach/schedule")} 
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/schedule') 
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Teaching Schedule</span>
            </button>

            <button 
              onClick={() => navigate("/coach/settings")} 
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive('/coach/settings') 
                  ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Coach Profile Footer */}
        <div className="p-4 border-t border-[#15203b]">
          <div className="p-2.5 rounded-xl bg-[#0f1b33] border border-[#1b2b4f] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0f1b33]"></span>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">{fullName}</p>
                <p className="text-[10px] text-blue-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400 inline" /> Senior Coach
                </p>
              </div>
            </div>
            <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-white transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 overflow-y-auto p-8 max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{getPageTitle()}</h1>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Logged in as: Certified Coach
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Welcome back, {firstName}! Manage your active classes and trainees</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-3.5 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="animate-fade-in mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CoachLayout;
