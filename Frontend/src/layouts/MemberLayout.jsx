import { t, useLanguage } from '../i18n/useLanguage';
import AutoSidebar from '../components/AutoSidebar';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import MemberTierAvatar from '../components/MemberTierAvatar';

import React, { useContext, useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate, useLocation, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Bot, Sparkles, X, ArrowRight } from 'lucide-react';
import NexusAiChat from '../features/member/components/NexusAiChat';
import { getSavedMemberNotificationPreferences, getMemberUnreadCount } from '../features/member/memberUtils';
import {
  LayoutDashboard, CalendarDays, CreditCard, Dumbbell,
  Bell, Settings, LogOut, ShoppingCart, Receipt, ClipboardList, HelpCircle
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAiAccess, setHasAiAccess] = useState(false);
  const [aiNoticeVisible, setAiNoticeVisible] = useState(false);
  const [aiNoticeKey, setAiNoticeKey] = useState(0);
  const aiPopoverRef = useRef(null);
  const aiNoticeTimerRef = useRef(null);

  const handleAskNexusAi = () => {
    if (hasAiAccess) {
      setIsChatOpen(prev => !prev);
      setAiNoticeVisible(false);
    } else {
      setAiNoticeKey(Date.now());
      setAiNoticeVisible(true);
      if (aiNoticeTimerRef.current) clearTimeout(aiNoticeTimerRef.current);
      aiNoticeTimerRef.current = setTimeout(() => {
        setAiNoticeVisible(false);
      }, 5000);
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
          const [cartRes, notifRes, myPkgsRes, profileRes] = await Promise.all([
            axios.get('http://localhost:8080/api/v1/payment/cart', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { items: [] } })),
            axios.get('http://localhost:8080/api/v1/notifications', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: [] })),
            axios.get('http://localhost:8080/api/v1/member/my-packages', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: [] })),
            axios.get('http://localhost:8080/api/v1/user/profile', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: null }))
          ]);

          setCartCount(cartRes.data.items?.length || 0);
          const memberNotifPrefs = getSavedMemberNotificationPreferences();
          setUnreadCount(getMemberUnreadCount(notifRes.data, memberNotifPrefs));
          const hasAi = myPkgsRes.data.some(p => (p.packageType === 'AI_ACCESS' || p.packageType === 'COMBO') && p.status === 'ACTIVE');
          setHasAiAccess(hasAi);

          if (profileRes?.data) {
            const p = profileRes.data;
            updateUserInfo({
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
            <div className="relative" ref={aiPopoverRef}>
              <button
                type="button"
                onClick={handleAskNexusAi}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--primary-hover)] to-[var(--primary-hover)] hover:from-[var(--primary-hover)] hover:to-[var(--primary-hover)] text-[color:var(--on-primary)] font-semibold text-xs flex items-center gap-2 shadow-[var(--shadow)] transition-all cursor-pointer active:scale-95"
              >
                <Bot className="w-4 h-4" />
                <span>{t("Ask NEXUS AI")}</span>
              </button>

              {/* Animated Popover Jumping Down Directly Under Button */}
              <AnimatePresence>
                {aiNoticeVisible && (
                  <motion.div
                    key={aiNoticeKey}
                    initial={{ opacity: 0, y: -14, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      y: [-14, 4, -2, 0],
                      scale: [0.9, 1.02, 0.99, 1]
                    }}
                    exit={{ opacity: 0, y: -10, scale: 0.92 }}
                    transition={{
                      duration: 0.35,
                      times: [0, 0.55, 0.8, 1],
                      ease: "easeOut"
                    }}
                    className="absolute top-full mt-2.5 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 dark:border-blue-400/30 shadow-[0_16px_40px_rgba(0,113,227,0.18)] p-3.5 z-50 text-slate-800 dark:text-slate-100"
                  >
                    {/* Beak / Triangle pointing up to the Ask NEXUS AI button */}
                    <div className="absolute -top-1.5 right-12 sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-t border-l border-blue-500/30 dark:border-blue-400/30 rotate-45 z-10" />

                    <div className="relative z-20">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] border border-blue-500/20 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4" />
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
      <NexusAiChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </main>
    </div>
  );
};

export default MemberLayout;

