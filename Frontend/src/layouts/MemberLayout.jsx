
import React, { useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import RoleThemeToggle from '../components/RoleThemeToggle';
import { useRoleTheme } from '../hooks/useRoleTheme';
import { Bot } from 'lucide-react';
import NexusAiChat from '../features/member/components/NexusAiChat';
import {
  LayoutDashboard, CalendarDays, CreditCard, Dumbbell,
  Bell, Settings, LogOut, ShoppingCart, Receipt, ClipboardList
} from 'lucide-react';

const MemberLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const cartRes = await axios.get('http://localhost:8080/api/v1/payment/cart', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCartCount(cartRes.data.items?.length || 0);

          const notifRes = await axios.get('http://localhost:8080/api/v1/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUnreadCount(notifRes.data.filter(n => !n.read).length || 0);

          const myPkgsRes = await axios.get('http://localhost:8080/api/v1/member/my-packages', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const hasAi = myPkgsRes.data.some(p => (p.packageType === 'AI_ACCESS' || p.packageType === 'COMBO') && p.status === 'ACTIVE');
          setHasAiAccess(hasAi);
        }
      } catch (err) {
        console.error("Data fetch error", err);
      }
    };
    fetchData();
    
    window.addEventListener('cartUpdated', fetchData);
    window.addEventListener('notificationUpdated', fetchData);
    return () => {
        window.removeEventListener('cartUpdated', fetchData);
        window.removeEventListener('notificationUpdated', fetchData);
    };
  }, [location.pathname]); // Refresh when navigating

  const { userInfo, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useRoleTheme();

  const fullName = userInfo?.fullName || 'Active Member';
  const firstName = fullName.split(' ')[0];
  const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  
  const getPageTitle = () => {
      switch(location.pathname) {
          case '/member/dashboard': return 'Customer Dashboard';
          case '/member/schedule': return 'My Schedule';
          case '/member/memberships': return 'Memberships';
          case '/member/book-class': return 'Book a Class';
          case '/member/notifications': return 'Notifications';
          case '/member/settings': return 'Settings';
          case '/member/cart': return 'Checkout Cart';
          case '/member/billing': return 'Billing & Invoices';
          default: return 'Nexus Portal';
      }
  };

  return (
    <div className={`role-shell is-${theme} min-h-screen bg-[#060b17] text-slate-200 flex font-sans antialiased selection:bg-blue-600 selection:text-white`}>
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
              <p className="text-[10px] tracking-widest text-slate-400 font-semibold uppercase">SPORTS LAB</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <button onClick={() => navigate("/member/dashboard")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/dashboard') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

            <button onClick={() => navigate("/member/schedule")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/schedule') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <CalendarDays className="w-4 h-4" />
              <span>My Schedule</span>
            </button>

            <button onClick={() => navigate("/member/memberships")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/memberships') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>My Packages</span>
              </div>
              
            </button>

            <button onClick={() => navigate("/member/package-store")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/package-store') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                <span>Package Store</span>
              </div>
              <span className="text-[10px] font-bold bg-[#1a2b50] text-emerald-300 px-1.5 py-0.5 rounded">NEW</span>
            </button>

            <button onClick={() => navigate("/member/book-class")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/book-class') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
                <Dumbbell className="w-4 h-4" />
                <span>Book a Class</span>
              </button>

            <button onClick={() => navigate("/member/notifications")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/notifications') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate("/member/billing")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/billing') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <Receipt className="w-4 h-4" />
              <span>Billing & Invoices</span>
            </button>

            <button onClick={() => navigate("/member/attendance")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/attendance') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
              <ClipboardList className="w-4 h-4" />
              <span>Attendance History</span>
            </button>

            <button onClick={() => navigate("/member/settings")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/settings') ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-[#111d38]'}`}>
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
          </nav>
        </div>

        {/* Member Profile Footer */}
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
                <p className="text-[10px] text-blue-400">Elite Pro Member</p>
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
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Logged in as: Active Member
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Welcome back, {firstName}! System synced at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>

          <div className="flex items-center gap-3">
            <RoleThemeToggle theme={theme} onToggle={toggleTheme} />
            <div className="px-3.5 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-400">Next Session:</span>
              <span className="font-semibold text-white">HIIT Endurance in 1h 45m</span>
            </div>

            <button onClick={() => { if (hasAiAccess) setIsChatOpen(!isChatOpen); else { setToast({ visible: true, message: 'Please purchase an AI package in the Package Store to unlock this feature.' }); setTimeout(() => setToast({ visible: false, message: '' }), 4000); } }} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all">
                <Bot className="w-4 h-4" />
                <span>Ask NEXUS AI</span>
              </button>

            {/* Shopping Cart Button */}
            <button onClick={() => navigate('/member/cart')} className="relative p-2.5 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-emerald-500 hover:text-emerald-400 text-slate-300 transition-colors" title="View Cart">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-[#060b17]">
                  {cartCount}
                </span>
              )}
            </button>

            <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-[#0e172a] border border-[#1a2947] hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors">
              Logout
            </button>
          </div>
        </header>

        <div className="animate-fade-in mt-6">
          <Outlet />
        </div>
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}
      <NexusAiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
};

export default MemberLayout;

