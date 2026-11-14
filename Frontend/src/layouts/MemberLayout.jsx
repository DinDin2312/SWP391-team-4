import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import MemberTierAvatar from '../components/MemberTierAvatar';
import { API_ORIGIN } from '../config/apiBase.js';

import React, { useContext, useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import NexusAiChat from '../features/member/components/NexusAiChat';
import CyberFoxMascot, { CyberFoxAvatar } from '../components/CyberFoxMascot';
import MemberNotificationDropdown from '../features/member/components/MemberNotificationDropdown';
import { getSavedMemberNotificationPreferences, getMemberUnreadCount } from '../features/member/memberUtils';
import {
  LayoutDashboard, CalendarDays, CreditCard, Dumbbell,
  Bell, Settings, LogOut, ShoppingCart, Receipt, ClipboardList, HelpCircle,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const MemberLayout = () => {
  useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const currentOutlet = useOutlet();
  const auth = useContext(AuthContext) || {};
  const { userInfo, logout = () => {}, updateUserInfo } = auth;
  const [cartCount, setCartCount] = useState(0);
  const [isCartHighlighted, setIsCartHighlighted] = useState(false);
  // 3-state AI lifecycle: 'minimized' (default Fox at bottom-right) | 'open' | 'docked' (hidden in topbar after [x])
  const [chatMode, setChatMode] = useState('minimized');
  const [chatOrigin, setChatOrigin] = useState('fox');
  const [isTopbarDockGlow, setIsTopbarDockGlow] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifBellRef = useRef(null);
  const hasAiAccess = true;
  const [aiNoticeVisible, setAiNoticeVisible] = useState(false);
  const aiPopoverRef = useRef(null);
  const aiNoticeTimerRef = useRef(null);
  const [receptionModal, setReceptionModal] = useState({
    visible: false,
    type: 'success',
    invoiceId: null,
    title: '',
    message: ''
  });

  useEffect(() => {
    const checkAwaitingInvoice = async () => {
      const invId = sessionStorage.getItem('awaitingInvoiceId');
      if (!invId) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_ORIGIN}/api/v1/payment/vietqr-info/${invId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const status = res.data?.status;
        if (status === 'PAID') {
          sessionStorage.removeItem('awaitingInvoiceId');
          setReceptionModal({
            visible: true,
            type: 'success',
            invoiceId: invId,
            title: t('Payment Approved!'),
            message: t('Your order #{id} has been approved by the Receptionist. Your memberships and classes are now active!').replace('{id}', `#INV-${invId}`)
          });
          window.dispatchEvent(new Event('cartUpdated'));
          window.dispatchEvent(new Event('notificationUpdated'));
        } else if (status === 'CANCELLED' || status === 'FAILED') {
          sessionStorage.removeItem('awaitingInvoiceId');
          setReceptionModal({
            visible: true,
            type: 'cancelled',
            invoiceId: invId,
            title: t('Order Cancelled'),
            message: t('Your order #{id} was cancelled by Reception. Please contact the front desk if you have already transferred.').replace('{id}', `#INV-${invId}`)
          });
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch  {
        // Ignore background polling errors
      }
    };

    const interval = setInterval(checkAwaitingInvoice, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleAskNexusAi = (origin = 'topbar') => {
    if (hasAiAccess) {
      setChatOrigin(origin);
      setChatMode(prev => (prev === 'open' ? 'minimized' : 'open'));
      setAiNoticeVisible(false);
    } else {
      setAiNoticeVisible(prev => {
        const next = !prev;
        if (aiNoticeTimerRef.current) clearTimeout(aiNoticeTimerRef.current);
        if (next) {
          aiNoticeTimerRef.current = setTimeout(() => {
            setAiNoticeVisible(false);
          }, 5000);
        }
        return next;
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiPopoverRef.current && !aiPopoverRef.current.contains(event.target)) {
        setAiNoticeVisible(false);
      }
    };
    if (aiNoticeVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [aiNoticeVisible]);

  useEffect(() => {
    return () => {
      if (aiNoticeTimerRef.current) clearTimeout(aiNoticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let highlightTimer;
    const handleAiCartHighlight = () => {
      setIsCartHighlighted(false);
      requestAnimationFrame(() => setIsCartHighlighted(true));
      clearTimeout(highlightTimer);
      highlightTimer = setTimeout(() => setIsCartHighlighted(false), 8000);
    };
    window.addEventListener('aiCartHighlight', handleAiCartHighlight);
    return () => {
      window.removeEventListener('aiCartHighlight', handleAiCartHighlight);
      clearTimeout(highlightTimer);
    };
  }, []);

  useEffect(() => {
    const handleProfileSync = () => {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && updateUserInfo) {
            updateUserInfo(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('userProfileUpdated', handleProfileSync);
    return () => window.removeEventListener('userProfileUpdated', handleProfileSync);
  }, [updateUserInfo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const [cartRes, notifRes, profileRes] = await Promise.all([
            axios.get(`${API_ORIGIN}/api/v1/payment/cart`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { items: [] } })),
            axios.get(`${API_ORIGIN}/api/v1/notifications`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: [] })),
            axios.get(`${API_ORIGIN}/api/v1/user/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: null }))
          ]);

          setCartCount(cartRes.data.items?.length || 0);
          const memberNotifPrefs = getSavedMemberNotificationPreferences();
          setUnreadCount(getMemberUnreadCount(notifRes.data, memberNotifPrefs));

          if (profileRes?.data) {
            const p = profileRes.data;
            updateUserInfo({
              ...(p.userId != null ? { userId: p.userId } : {}),
              avatarUrl: p.avatarUrl,
              fullName: p.fullName || userInfo?.fullName,
              memberTier: p.memberTier || 'MEMBER',
              loyaltyPoints: p.loyaltyPoints ?? 0
            });
          }
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

  const fullName = userInfo?.fullName || 'Active Member';
  const _initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

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
          case '/member/support': return 'Help & Support Desk';
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

            <button onClick={() => navigate("/member/attendance")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/attendance') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <ClipboardList className="w-4 h-4" />
              <span>{t("Attendance History")}</span>
            </button>

            <button onClick={() => navigate("/member/support")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/support') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
              <HelpCircle className="w-4 h-4" />
              <span>{t("Help & Support")}</span>
            </button>

            <button onClick={() => navigate("/member/settings")} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/member/settings') ? 'bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'}`}>
                <Settings className="w-4 h-4" />
                <span>{t("Settings")}</span>
              </button>
          </nav>
        </div>

        {/* Member Profile Footer */}
        <div className="auto-sidebar-footer p-4 border-t border-[var(--border)]">
          <div className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
            <div 
              onClick={() => navigate("/member/settings")}
              className="flex items-center gap-3 cursor-pointer group"
              title={t("Settings & Avatar")}
            >
              <MemberTierAvatar
                avatarUrl={userInfo?.avatarUrl}
                fullName={fullName}
                memberTier={userInfo?.memberTier || 'MEMBER'}
                size="sm"
              />
              <div className="auto-sidebar-profile-text text-left min-w-0">
                <p className="text-xs font-bold text-[var(--text)] leading-tight group-hover:text-[var(--primary)] transition-colors truncate max-w-[120px]">{fullName}</p>
                <p className="text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                  {userInfo?.memberTier === 'PLATINUM' ? (
                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-extrabold tracking-tight">
                      {t("VIP Platinum • PRO")}
                    </span>
                  ) : userInfo?.memberTier === 'GOLD' ? (
                    <span className="text-amber-500 font-bold">{t("Gold Elite")}</span>
                  ) : userInfo?.memberTier === 'SILVER' ? (
                    <span className="text-slate-400 font-bold">{t("Silver Member")}</span>
                  ) : (
                    <span className="text-[var(--text-muted)]">{t("Standard Member")}</span>
                  )}
                </p>
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
        <header className="role-page-topbar">
          <nav className="role-breadcrumb" aria-label={t("Breadcrumb")}><span>{t("Member portal")}</span><span aria-hidden="true">/</span><strong>{t(getPageTitle())}</strong></nav>

          <div className="role-header-actions">
            <div className="relative inline-block shrink-0" ref={aiPopoverRef}>
              <button
                type="button"
                onClick={() => handleAskNexusAi('topbar')}
                className={`px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-[color:var(--on-primary)] font-semibold text-xs flex items-center gap-2 shadow-[var(--shadow)] transition-all cursor-pointer active:scale-95 ${
                  isTopbarDockGlow ? 'ring-4 ring-cyan-400/75 scale-105 shadow-[0_0_24px_rgba(34,211,238,0.75)]' : ''
                }`}
              >
                <CyberFoxAvatar direction="DIRECT_HOVER" className="w-5 h-5 -my-0.5" />
                <span>{t("Ask NEXUS AI")}</span>
              </button>

              {/* Animated Popover Jumping Down Directly Under Ask NEXUS AI Button */}
              <AnimatePresence>
                {aiNoticeVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 26,
                      mass: 0.8
                    }}
                    className="absolute top-full mt-2.5 left-0 max-sm:left-auto max-sm:right-0 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 dark:border-blue-400/30 shadow-[0_16px_40px_rgba(0,113,227,0.18)] p-3.5 z-50 text-slate-800 dark:text-slate-100"
                  >
                    {/* Beak / Triangle pointing up into the Ask NEXUS AI button */}
                    <div className="absolute -top-1.5 left-8 max-sm:left-auto max-sm:right-8 w-3 h-3 bg-white dark:bg-slate-900 border-t border-l border-blue-500/30 dark:border-blue-400/30 rotate-45 z-10" />

                    <div className="relative z-20">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-900 border border-cyan-400/40 flex items-center justify-center shrink-0">
                            <CyberFoxAvatar direction="DIRECT_HOVER" className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              <span>{t("NEXUS AI Assistant")}</span>
                              <Sparkles className="w-3 h-3 text-amber-500" />
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiNoticeVisible(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md transition-colors cursor-pointer"
                          title={t("Close")}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                        {t('Please purchase an AI package in the Package Store to unlock this feature.')}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setAiNoticeVisible(false);
                          navigate('/member/package-store');
                        }}
                        className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#0071E3] to-blue-700 hover:from-[#0077ED] hover:to-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      >
                        <span>{t('Explore Package Store')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Shopping Cart Button */}
            <button
              onClick={() => {
                setIsCartHighlighted(false);
                navigate('/member/cart');
              }}
              className={`relative p-2.5 rounded-xl transition-all duration-300 transform ${
                isCartHighlighted
                  ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white border-transparent shadow-[0_0_28px_rgba(59,130,246,0.9),0_10px_25px_rgba(0,0,0,0.35)] ring-4 ring-cyan-400/70 scale-125 z-30'
                  : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text)] hover:scale-105'
              }`}
              title={t("View Cart")}
            >
              {isCartHighlighted && (
                <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-amber-400 opacity-80 blur-md animate-pulse pointer-events-none" />
              )}
              <ShoppingCart className="relative z-10 w-4 h-4" />
              {cartCount > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 z-20 min-w-[18px] h-[18px] px-0.5 rounded-full text-[10px] font-black flex items-center justify-center border-2 ${
                  isCartHighlighted
                    ? 'bg-amber-400 text-slate-950 border-white shadow-sm'
                    : 'bg-[var(--success-hover)] text-white border-[var(--surface)]'
                }`}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* Topbar Notification Bell */}
            <div className="relative" ref={notifBellRef}>
              <button
                type="button"
                onClick={() => setIsNotifDropdownOpen((prev) => !prev)}
                className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isNotifDropdownOpen
                    ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text)] hover:scale-105'
                }`}
                title={t("Notifications")}
                aria-label={t("Notifications")}
                aria-expanded={isNotifDropdownOpen}
              >
                <Bell className={`w-4 h-4 transition-transform duration-300 ${isNotifDropdownOpen ? 'rotate-12 scale-110' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 z-20 min-w-[18px] h-[18px] px-0.5 rounded-full text-[10px] font-black bg-[#0071E3] text-white flex items-center justify-center border-2 border-[var(--surface)] animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotifDropdownOpen && (
                  <MemberNotificationDropdown
                    isOpen={isNotifDropdownOpen}
                    onClose={() => setIsNotifDropdownOpen(false)}
                    onUnreadChange={(cnt) => setUnreadCount(cnt)}
                    anchorRef={notifBellRef}
                  />
                )}
              </AnimatePresence>
            </div>

            <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] text-xs font-medium transition-colors">{t("Logout")}</button>
            <ThemeToggle />
            <LanguageSwitcher />
            <button type="button" onClick={() => navigate("/member/settings")} title={t("Settings & Avatar")} className="p-0.5 rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0">
              <MemberTierAvatar avatarUrl={userInfo?.avatarUrl} fullName={fullName} memberTier={userInfo?.memberTier || 'MEMBER'} size="xs" showBadge={false} />
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
              <Suspense fallback={<div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><p className="text-sm">{t("Loading module...")}</p></div>}>{currentOutlet && React.cloneElement(currentOutlet, { key: location.pathname })}</Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
        <NexusAiChat
          isOpen={chatMode === 'open'}
          openOrigin={chatOrigin}
          onMinimize={() => setChatMode('minimized')}
          onClose={() => {
            setChatMode('docked');
            setIsTopbarDockGlow(true);
            setTimeout(() => setIsTopbarDockGlow(false), 1200);
          }}
        />
        <CyberFoxMascot
          isVisible={chatMode === 'minimized'}
          onActivate={() => handleAskNexusAi('fox')}
          label={t("Ask NEXUS AI")}
        />

      {/* Global Reception Approval / Rejection Pop-up Modal */}
      {receptionModal.visible && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${
              receptionModal.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}>
              {receptionModal.type === 'success' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              ) : (
                <AlertCircle className="w-10 h-10 text-rose-500" />
              )}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-mono font-bold mb-3">
              #{receptionModal.invoiceId ? `INV-${receptionModal.invoiceId}` : 'INVOICE'}
            </div>
            <h3 className="text-xl font-black text-[var(--text)] mb-2">
              {receptionModal.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
              {receptionModal.message}
            </p>
            <button
              onClick={() => {
                setReceptionModal(prev => ({ ...prev, visible: false }));
                window.dispatchEvent(new Event('cartUpdated'));
              }}
              className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all shadow-md cursor-pointer ${
                receptionModal.type === 'success'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/20'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default MemberLayout;

