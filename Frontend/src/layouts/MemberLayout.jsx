import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';

import React, { useContext, useState, useEffect, Suspense } from 'react';
import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bot } from 'lucide-react';
import NexusAiChat from '../features/member/components/NexusAiChat';
import {
  LayoutDashboard, CalendarDays, CreditCard, Dumbbell,
  Bell, Settings, LogOut, ShoppingCart, Receipt, ClipboardList
} from 'lucide-react';

const MemberLayout = () => {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOutlet = useOutlet();
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

  const fullName = userInfo?.fullName || 'Active Member';
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
                <span className="font-extrabold tracking-wider text-base text-[var(--text)]">{t("NEXUS")}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
              </div>
              <p className="text-[10px] tracking-widest text-[var(--text-muted)] font-semibold uppercase">{t("SPORTS LAB")}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="auto-sidebar-nav px-3 space-y-1 mt-2">
            <button onClick={() => navigate("/member/dashboard")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/dashboard') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                <LayoutDashboard className="w-4 h-4" />
                <span>{t("Dashboard")}</span>
              </button>

            <button onClick={() => navigate("/member/schedule")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/schedule') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <CalendarDays className="w-4 h-4" />
              <span>{t("My Schedule")}</span>
            </button>

            <button onClick={() => navigate("/member/memberships")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/memberships') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4" />
                <span>{t("My Packages")}</span>
              </div>

            </button>

            <button onClick={() => navigate("/member/package-store")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/package-store') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4" />
                <span>{t("Package Store")}</span>
              </div>
              <span className="text-[10px] font-bold bg-[var(--surface)] text-[var(--success-text)] px-1.5 py-0.5 rounded">{t("NEW")}</span>
            </button>

            <button onClick={() => navigate("/member/book-class")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/book-class') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                <Dumbbell className="w-4 h-4" />
                <span>{t("Book a Class")}</span>
              </button>

            <button onClick={() => navigate("/member/notifications")} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/notifications') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>{t("Notifications")}</span>
              </div>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[color:var(--on-primary)] text-[11px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate("/member/billing")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/billing') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <Receipt className="w-4 h-4" />
              <span>{t("Billing & Invoices")}</span>
            </button>

            <button onClick={() => navigate("/member/attendance")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/attendance') ? 'bg-blue-600/15 border border-blue-500/30 text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-slate-200 hover:bg-[var(--surface)]'}`}>
              <ClipboardList className="w-4 h-4" />
              <span>{t("Attendance History")}</span>
            </button>

            <button onClick={() => navigate("/member/settings")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/settings') ? 'bg-blue-600/15 border border-blue-500/30 text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-slate-200 hover:bg-[var(--surface)]'}`}>
                <Settings className="w-4 h-4" />
                <span>{t("Settings")}</span>
              </button>
          </nav>
        </div>

        {/* Member Profile Footer */}
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
                <p className="text-[10px] text-[var(--primary)]">{t("Elite Pro Member")}</p>
              </div>
            </div>
            <button onClick={handleLogout} title={t("Logout")} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </AutoSidebar>

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="flex-1 overflow-y-auto p-8 max-w-[1440px] mx-auto space-y-6">
        {/* Top Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <nav className="role-breadcrumb" aria-label={t("Breadcrumb")}><span>{t("Member portal")}</span><span aria-hidden="true">/</span><strong>{t(getPageTitle())}</strong></nav>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text)]">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
              <span className="text-[var(--text-muted)]">{t("Next Session:")}</span>
              <span className="font-semibold text-[var(--text)]">{t("HIIT Endurance in 1h 45m")}</span>
            </div>

            <button onClick={() => { if (hasAiAccess) setIsChatOpen(!isChatOpen); else { setToast({ visible: true, message: t('Please purchase an AI package in the Package Store to unlock this feature.') }); setTimeout(() => setToast({ visible: false, message: '' }), 4000); } }} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-[color:var(--on-primary)] font-semibold text-xs flex items-center gap-2 shadow-[var(--shadow)] transition-all">
                <Bot className="w-4 h-4" />
                <span>{t("Ask NEXUS AI")}</span>
              </button>

            {/* Shopping Cart Button */}
            <button onClick={() => navigate('/member/cart')} className="relative p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--success-soft)] hover:text-[var(--success-text)] text-[var(--text)] transition-colors" title={t("View Cart")}>
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--success-hover)] text-[color:var(--on-primary)] text-[9px] font-bold flex items-center justify-center border-2 border-[var(--border)]">
                  {cartCount}
                </span>
              )}
            </button>

            <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] text-xs font-medium transition-colors">{t("Logout")}</button>
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
              <Suspense fallback={<div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><p className="text-sm">{t("Loading module...")}</p></div>}>{currentOutlet && React.cloneElement(currentOutlet, { key: location.pathname })}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 bg-[var(--surface)] text-[var(--text)] px-4 py-3 rounded-lg shadow-[var(--shadow)] border border-[var(--border)] flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <p className="text-sm font-medium">{t(toast.message)}</p>
        </div>
      )}
      <NexusAiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
};

export default MemberLayout;

