import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axiosClient from '../../../services/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  User, 
  CheckCircle2, 
  BadgeCheck, 
  X, 
  Mail, 
  Shield, 
  Smartphone, 
  Info, 
  CheckCheck,
  Award,
  Crown,
  QrCode,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
  Check,
  Copy,
  ShieldCheck,
  CreditCard,
  Flame,
  Radio,
  Clock,
  CalendarCheck,
  Gift,
  FileCheck2
} from 'lucide-react';

const TIER_CONFIG = {
  MEMBER: {
    name: 'MEMBER',
    label: 'Standard Member',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40',
    cardBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    cardGradient: 'from-slate-900 via-stone-900 to-slate-950 border-amber-600/30',
    accentText: 'text-amber-700 dark:text-amber-400',
    progressColor: 'bg-amber-500',
    minPoints: 0,
    nextTier: 'SILVER',
    nextThreshold: 500,
    perks: [
      'Full account access with QR Check-in Pass at Reception & Turnstile',
      'Access to facility rooms and equipment according to purchased packages',
      'Track training progress and InBody assessment history from Coach',
      'Standard pricing on all memberships, packages, and classes (0% Discount)'
    ]
  },
  SILVER: {
    name: 'SILVER',
    label: 'Silver Member',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-500/30 dark:border-slate-500/40',
    cardBadgeClass: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
    cardGradient: 'from-slate-900 via-slate-800 to-slate-950 border-slate-400/40',
    accentText: 'text-slate-700 dark:text-slate-300',
    progressColor: 'bg-slate-300',
    minPoints: 500,
    nextTier: 'GOLD',
    nextThreshold: 1500,
    perks: [
      'Automatic 5% discount applied directly to all checkout cart invoices',
      'Includes all Standard Member QR pass and tracking privileges',
      'Accumulate +1 Pt per Reception check-in and +10 Pts per attended class',
      'Priority support desk handling for class retention and voucher requests'
    ]
  },
  GOLD: {
    name: 'GOLD',
    label: 'Gold Elite Member',
    badgeClass: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-500/35 dark:border-yellow-500/40',
    cardBadgeClass: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40',
    cardGradient: 'from-amber-950/40 via-slate-900 to-yellow-950/30 border-amber-400/50',
    accentText: 'text-yellow-700 dark:text-yellow-400',
    progressColor: 'bg-amber-400',
    minPoints: 1500,
    nextTier: 'PLATINUM',
    nextThreshold: 3000,
    perks: [
      'Automatic 10% discount applied directly to all checkout cart invoices',
      'Includes all Silver Member benefits and automated checkout perks',
      'Real-time room occupancy and schedule monitoring before check-in',
      'Personalized AI fitness coaching guidance via NEXUS AI Assistant'
    ]
  },
  PLATINUM: {
    name: 'PLATINUM',
    label: 'Platinum VIP Member',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-500/40',
    cardBadgeClass: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/50',
    cardGradient: 'from-cyan-950/40 via-slate-900 to-blue-950/40 border-cyan-400/60 shadow-cyan-500/10',
    accentText: 'text-cyan-700 dark:text-cyan-300',
    progressColor: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    minPoints: 3000,
    nextTier: null,
    nextThreshold: 3000,
    perks: [
      'Maximum lifetime 15% discount applied directly to all cart checkouts',
      'Highest membership tier in NEXUS Sports Center (Max Tier)',
      'Includes all Gold Member perks, AI coaching, and real-time insights',
      'Comprehensive multi-package stacking duration & cross-facility access'
    ]
  }
};

const Settings = () => {
  useLanguage();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'membership' | 'security' | 'notifications'
  
  // Profile State
  const [profile, setProfile] = useState({
    userId: null,
    fullName: '',
    email: '',
    phone: '',
    loyaltyPoints: 0,
    memberTier: 'MEMBER',
    hasSetPassword: true
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // Email Update States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password Update States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Notification Preferences State (saved in localStorage per user)
  const [notifPrefs, setNotifPrefs] = useState({
    workoutReminder: true,
    membershipExpiry: true,
    coachFeedback: true,
    clubPromotions: false
  });

  // Turnstile QR Code Modal State
  const [qrZoomOpen, setQrZoomOpen] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await axiosClient.get('/v1/user/profile');
        setProfile(data);

        // Load local notification preferences for this user
        if (data.userId) {
          const savedPrefs = localStorage.getItem(`nexus_member_notifs_${data.userId}`);
          if (savedPrefs) {
            try {
              setNotifPrefs(JSON.parse(savedPrefs));
            } catch (e) {
              console.error('Failed to parse saved notification preferences', e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        showToast(t("Failed to load profile data."), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Handle Profile Changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await axiosClient.put('/v1/user/profile', {
        fullName: profile.fullName,
        phone: profile.phone
      });
      showToast(t("Personal profile saved successfully!"));
    } catch (err) {
      console.error("Failed to save profile", err);
      showToast(err.response?.data?.message || t("Error saving profile information."), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Email Update with OTP
  const handleSendEmailOtp = async () => {
    try {
      setEmailLoading(true);
      setEmailError('');
      await axiosClient.post('/v1/user/email-change/send-otp', { newEmail });
      setEmailStep(2);
    } catch (err) {
      console.error("Failed to send OTP", err);
      setEmailError(err.response?.data?.message || t("Failed to send OTP to new email."));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    try {
      setEmailLoading(true);
      setEmailError('');
      await axiosClient.post('/v1/user/email-change/verify', { newEmail, otp });
      setEmailStep(3);
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error("Failed to verify OTP", err);
      setEmailError(err.response?.data?.message || t("Invalid or expired OTP code."));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: t('Not entered'), color: 'bg-slate-200', textClass: 'text-slate-400' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, text: t('Weak'), color: 'bg-rose-500', textClass: 'text-rose-500' };
      case 2:
        return { score: 2, text: t('Fair'), color: 'bg-amber-500', textClass: 'text-amber-500' };
      case 3:
        return { score: 3, text: t('Good'), color: 'bg-blue-500', textClass: 'text-blue-500' };
      case 4:
        return { score: 4, text: t('Strong'), color: 'bg-emerald-500', textClass: 'text-emerald-500' };
      default:
        return { score: 0, text: t('Weak'), color: 'bg-rose-500', textClass: 'text-rose-500' };
    }
  };

  const passStrength = calculatePasswordStrength(passwordData.newPassword);

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword.length < 8) {
      setPasswordError(t("New password must be at least 8 characters."));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t("Confirmation password does not match."));
      return;
    }
    // If not a Google OAuth initial setup, currentPassword is required
    if (profile.hasSetPassword && !passwordData.currentPassword) {
      setPasswordError(t("Please enter your current password."));
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordError('');
      await axiosClient.put('/v1/user/change-password', {
        currentPassword: passwordData.currentPassword || '',
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(profile.hasSetPassword ? t("Password changed successfully!") : t("New password set successfully!"));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfile(prev => ({ ...prev, hasSetPassword: true }));
      showToast(t("Account password updated successfully!"));
    } catch (err) {
      console.error("Failed to change password", err);
      setPasswordError(err.response?.data?.message || t("Current password is incorrect."));
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Notification Preference Toggle
  const toggleNotification = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (profile.userId) {
      localStorage.setItem(`nexus_member_notifs_${profile.userId}`, JSON.stringify(updated));
    }
    showToast(t("Notification preferences saved."));
  };

  // Copy Member UID
  const handleCopyUid = () => {
    const uidStr = profile.userId ? `NX-0${profile.userId}-VN` : 'NX-088071-VN';
    navigator.clipboard.writeText(uidStr);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
    showToast(t("Member ID copied to clipboard"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-[400px]">
        <div className="text-on-surface-variant flex items-center gap-3 font-semibold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
          <span>{t("Loading account settings...")}</span>
        </div>
      </div>
    );
  }

  // Tier metadata calculation
  const currentTierKey = (profile.memberTier && TIER_CONFIG[profile.memberTier]) ? profile.memberTier : 'MEMBER';
  const tierInfo = TIER_CONFIG[currentTierKey];
  const points = profile.loyaltyPoints || 0;
  
  let progressPercent = 100;
  let pointsNeeded = 0;
  if (tierInfo.nextTier) {
    const prevThreshold = tierInfo.minPoints;
    const nextThreshold = tierInfo.nextThreshold;
    const range = nextThreshold - prevThreshold;
    const earnedInRange = Math.max(0, points - prevThreshold);
    progressPercent = Math.min(100, Math.round((earnedInRange / range) * 100));
    pointsNeeded = Math.max(0, nextThreshold - points);
  }

  const memberUid = profile.userId ? `NX-0${profile.userId}-VN` : 'NX-088071-VN';
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NEXUS-PASS-${memberUid}-${encodeURIComponent(profile.email || '')}&color=0f172a`;

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-container">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-primary uppercase tracking-widest font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>{t("Account Settings")}</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
            <button 
              onClick={handleCopyUid}
              className="text-[11px] font-mono text-on-surface-variant font-bold hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              title={t("Click to copy ID")}
            >
              <span>{memberUid}</span>
              {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl text-on-surface tracking-tight font-black">{t("Member Settings")}</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            {t("Manage your profile, digital pass, security, and notification reminders.")}
          </p>
        </div>

        {/* Quick Member Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 shadow-xs ${tierInfo.badgeClass}`}>
            <Crown className="w-4 h-4 shrink-0" />
            <span>{t(tierInfo.label)}</span>
          </div>
          <button
            onClick={() => setActiveTab('membership')}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{t("Digital Pass")}</span>
          </button>
        </div>
      </div>

      {/* 4-Tab Navigation Bar */}
      <div className="w-full bg-surface-container-lowest border border-surface-container rounded-2xl p-1.5 my-6 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: t('Personal Profile'), icon: User },
          { id: 'membership', label: t('Membership & QR Pass'), icon: Award, highlight: true },
          { id: 'security', label: t('Security & Password'), icon: ShieldCheck },
          { id: 'notifications', label: t('Notification Preferences'), icon: Bell }
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/25'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/70'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <AnimatePresence mode="wait">

        {/* =========================================================================
            TAB 1: HỒ SƠ CÁ NHÂN (PERSONAL PROFILE)
            ========================================================================= */}
        {activeTab === 'profile' && (
          <motion.div
            key="tab-profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Card: Avatar & Quick Summary */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-low rounded-2xl p-6 shadow-xs border border-surface-container flex flex-col items-center text-center relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-on-primary text-3xl font-black flex items-center justify-center shadow-lg shadow-primary/20 mb-3 border-4 border-surface">
                  {profile.fullName ? profile.fullName.substring(0, 2).toUpperCase() : 'NX'}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold tracking-wider mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t("ACCOUNT ACTIVE")}</span>
                </div>

                <h3 className="text-xl text-on-surface font-black">{profile.fullName || t("NEXUS Member")}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{profile.email}</p>

                {/* Point & Tier Mini Strip */}
                <div className="w-full grid grid-cols-2 gap-2 mt-5 p-3 rounded-xl bg-surface-container text-left border border-surface-container-high">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("Nexus Points")}</span>
                    <span className="text-lg font-black text-primary mt-0.5">{points} <span className="text-xs font-normal text-on-surface-variant">{t("pts")}</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("Current Tier")}</span>
                    <span className={`text-xs font-extrabold mt-1 ${tierInfo.accentText}`}>{tierInfo.name}</span>
                  </div>
                </div>

                {/* Quick Link to Digital Pass */}
                <button
                  type="button"
                  onClick={() => setActiveTab('membership')}
                  className="w-full mt-4 py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all flex items-center justify-center gap-2 border border-surface-container-high cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>{t("View Digital Pass & QR Code")}</span>
                </button>
              </div>
            </div>

            {/* Right Card: Personal Details Form */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-surface-container-low rounded-2xl p-6 sm:p-7 shadow-xs border border-surface-container">
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-surface-container">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg text-on-surface font-extrabold">{t("Personal Details")}</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t("Update your full name and official contact info.")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Full Name Field */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      {t("Full Name")} <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="fullName"
                        name="fullName"
                        value={profile.fullName || ''}
                        onChange={handleProfileChange}
                        type="text"
                        placeholder={t("Enter your full name")}
                        className="w-full bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl px-4 py-3 border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                      <BadgeCheck className="w-4 h-4 text-primary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      {t("Phone Number")}
                    </label>
                    <div className="relative">
                      <input
                        id="phone"
                        name="phone"
                        value={profile.phone || ''}
                        onChange={handleProfileChange}
                        type="tel"
                        placeholder="+84 901 234 567"
                        className="w-full bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl px-4 py-3 border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                      />
                      <Smartphone className="w-4 h-4 text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Linked Email Address (with OTP Modal) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="email" className="text-xs font-bold text-on-surface-variant">
                        {t("Linked Email")}
                      </label>
                      {!showEmailModal && (
                        <button
                          type="button"
                          onClick={() => setShowEmailModal(true)}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          {t("Change Email")}
                        </button>
                      )}
                    </div>

                    {showEmailModal ? (
                      <div className="p-4 rounded-xl bg-surface-container border border-primary/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-on-surface">{t("Update Email Address")}</span>
                          <button 
                            type="button" 
                            onClick={() => { setShowEmailModal(false); setEmailStep(1); }} 
                            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {emailError && (
                          <div className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-medium">
                            {emailError}
                          </div>
                        )}

                        {emailStep === 1 && (
                          <>
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder={t("Enter new email address")}
                              className="w-full bg-surface-container-lowest p-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-surface-container-high focus:outline-none focus:border-primary text-on-surface"
                            />
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={emailLoading || !newEmail}
                              className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                            >
                              {emailLoading ? t("Sending OTP...") : t("Send Verification OTP")}
                            </button>
                          </>
                        )}

                        {emailStep === 2 && (
                          <>
                            <p className="text-xs text-on-surface-variant">
                              {t("We sent a 6-digit code to")}: <strong className="text-on-surface">{newEmail}</strong>
                            </p>
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder={t("Enter 6-digit OTP")}
                              className="w-full bg-surface-container-lowest p-2.5 rounded-xl text-center text-sm font-mono tracking-widest font-bold border border-surface-container-high focus:outline-none focus:border-primary text-on-surface"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={emailLoading || otp.length < 6}
                              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                            >
                              {emailLoading ? t("Verifying...") : t("Verify & Update Email")}
                            </button>
                          </>
                        )}

                        {emailStep === 3 && (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                            <span className="text-sm font-bold text-on-surface">{t("Email updated successfully!")}</span>
                            <span className="text-xs text-on-surface-variant mt-1">{t("Automatically logging out for security...")}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="email"
                          value={profile.email || ''}
                          disabled
                          className="w-full bg-surface-container text-on-surface-variant text-sm font-semibold rounded-xl px-4 py-3 cursor-not-allowed border border-surface-container-high"
                          type="email"
                        />
                        <Mail className="w-4 h-4 text-primary absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}
                    <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{t("Email changes require OTP verification sent to the new mailbox.")}</span>
                    </p>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="mt-6 pt-5 border-t border-surface-container flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>{t("Saving...")}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{t("Save Changes")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            TAB 2: HẠNG HỘI VIÊN & THẺ SỐ QR (MEMBERSHIP & DIGITAL PASS)
            ========================================================================= */}
        {activeTab === 'membership' && (
          <motion.div
            key="tab-membership"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Top Grid: Digital Pass + Tier Progress Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Column: Digital Sports Member Pass (Athletic Metal Card) */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-2.5 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>{t("Digital Sports Member Pass")}</span>
                </div>

                {/* The 3D Athletic Card */}
                <div className={`w-full min-h-[220px] sm:min-h-[240px] rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border bg-gradient-to-br ${tierInfo.cardGradient}`}>
                  {/* Background Accents */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
                  
                  {/* Card Top Row: Logo & Chip */}
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/40">
                        N
                      </div>
                      <div className="leading-tight">
                        <span className="font-black text-sm text-white tracking-wider block">NEXUS</span>
                        <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase block">SPORTS CENTER</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-slate-400 rotate-90" />
                      <div className="w-8 h-6 rounded-md bg-amber-400/80 border border-amber-300 shadow-inner flex items-center justify-center">
                        <div className="w-6 h-4 border border-amber-600/60 rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Card Center: Member UID */}
                  <div className="my-3 relative z-10">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase">{t("MEMBER ID (UID)")}</span>
                    <span className="text-xl sm:text-2xl font-mono font-black text-white tracking-wider drop-shadow-sm">
                      {memberUid}
                    </span>
                  </div>

                  {/* Card Bottom Row: Name & Tier Badge */}
                  <div className="flex items-end justify-between relative z-10 pt-2 border-t border-white/10">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">{t("ATHLETE NAME")}</span>
                      <span className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                        {profile.fullName || t("NEXUS Member")}
                      </span>
                    </div>

                    <div className={`px-3 py-1 rounded-xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${tierInfo.cardBadgeClass || tierInfo.badgeClass}`}>
                      <Crown className="w-3.5 h-3.5" />
                      <span>{tierInfo.name}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Quick Bar */}
                <div className="flex items-center gap-2.5 mt-3">
                  <button
                    type="button"
                    onClick={() => setQrZoomOpen(true)}
                    className="flex-1 py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface border border-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <QrCode className="w-4 h-4 text-primary" />
                    <span>{t("Expand QR Code for Turnstile Scan")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyUid}
                    className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface border border-surface-container-high transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title={t("Copy Card UID")}
                  >
                    {copiedUid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-on-surface-variant" />}
                  </button>
                </div>
              </div>

              {/* Right Column: Loyalty Points & Tier Progress */}
              <div className="lg:col-span-6 flex flex-col">
                <div className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-2.5 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{t("Tier Progress & Points")}</span>
                </div>

                <div className="h-full bg-surface-container-low rounded-3xl p-6 shadow-xs border border-surface-container flex flex-col justify-between">
                  <div>
                    {/* Points Total Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                      <div>
                        <span className="text-xs text-on-surface-variant font-bold block">{t("Accumulated Points")}</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-3xl font-black text-primary">{points}</span>
                          <span className="text-xs font-bold text-on-surface-variant">{t("Nexus Points")}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-on-surface-variant font-bold block">{t("Next Tier")}</span>
                        <span className="text-sm font-extrabold text-on-surface block mt-0.5">
                          {tierInfo.nextTier ? TIER_CONFIG[tierInfo.nextTier].name : t('Max Tier (Top)')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-on-surface">{t("Tier Progress")}</span>
                        <span className="text-primary font-mono">{progressPercent}%</span>
                      </div>

                      <div className="w-full h-3 rounded-full bg-surface-container-highest overflow-hidden p-0.5 border border-surface-container-high">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${tierInfo.progressColor}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <p className="text-xs text-on-surface-variant font-medium mt-2.5">
                        {tierInfo.nextTier ? (
                          <>
                            {t("You need")} <strong className="text-primary font-black">{pointsNeeded} {t("points")}</strong> {t("more to reach")}{' '}
                            <strong className="text-on-surface">{t(TIER_CONFIG[tierInfo.nextTier].label)}</strong>.
                          </>
                        ) : (
                          t("Congratulations! You have reached Platinum VIP, the highest tier at NEXUS.")
                        )}
                      </p>
                    </div>

                    {/* 4 Tier Milestones Pill Strip */}
                    <div className="grid grid-cols-4 gap-1.5 mt-5 pt-4 border-t border-surface-container text-center">
                      {[
                        { key: 'MEMBER', label: t('Member'), pts: '0 ' + t('pts') },
                        { key: 'SILVER', label: t('Silver'), pts: '500 ' + t('pts') },
                        { key: 'GOLD', label: t('Gold'), pts: '1.5k ' + t('pts') },
                        { key: 'PLATINUM', label: t('Platinum'), pts: '3k ' + t('pts') }
                      ].map(tItem => {
                        const isReached = points >= (TIER_CONFIG[tItem.key].minPoints);
                        return (
                          <div 
                            key={tItem.key} 
                            className={`p-2 rounded-xl text-center border transition-all ${
                              isReached 
                                ? 'bg-primary/10 border-primary/30 text-primary font-extrabold shadow-2xs' 
                                : 'bg-surface-container border-surface-container-high text-on-surface-variant font-semibold opacity-70'
                            }`}
                          >
                            <span className="text-[11px] block">{tItem.label}</span>
                            <span className="text-[9px] block font-mono mt-0.5">{tItem.pts}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <span>{t("Points are automatically earned upon check-in, completing coaching sessions, or purchasing packages.")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Detailed Tier Perks List */}
            <div className="bg-surface-container-low rounded-3xl p-6 sm:p-7 shadow-xs border border-surface-container">
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-surface-container">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-on-surface">{t("Your Exclusive NEXUS Perks")} ({t(tierInfo.label)})</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t("Priority benefits applied directly to your account.")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {tierInfo.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container border border-surface-container-high/60 shadow-2xs">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-on-surface leading-snug">
                      {t(perk)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            TAB 3: BẢO MẬT & ĐỔI MẬT KHẨU (SECURITY & PASSWORD)
            ========================================================================= */}
        {activeTab === 'security' && (
          <motion.div
            key="tab-security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Security Overview & Linked Account Status */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-surface-container-low rounded-2xl p-6 shadow-xs border border-surface-container space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-surface-container">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-on-surface">{t("Security Overview")}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{t("Account safety status")}</p>
                  </div>
                </div>

                {/* Security Cards */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">{t("Email Verified")}</span>
                        <span className="text-[11px] text-on-surface-variant block font-mono">{profile.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 uppercase">
                      {t("Verified")}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">{t("Password Encryption")}</span>
                        <span className="text-[11px] text-on-surface-variant block">{t("BCrypt 256-bit Security Standard")}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 uppercase">
                      {t("Secure")}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-high flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block">{t("Google OAuth 2.0")}</span>
                        <span className="text-[11px] text-on-surface-variant block">
                          {profile.hasSetPassword ? t("Account linked") : t("Google Account (No password set)")}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-primary/15 text-primary uppercase">
                      {t("Supported")}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-on-surface-variant leading-relaxed">
                  <p>{t("Security recommendation: Change your password every 90 days and avoid reusing passwords across multiple services.")}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Change Password Form */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <form onSubmit={handleSavePassword} className="bg-surface-container-low rounded-2xl p-6 sm:p-7 shadow-xs border border-surface-container space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-surface-container">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-on-surface">
                      {profile.hasSetPassword ? t("Change Account Password") : t("Set Account Password (Google Account)")}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {profile.hasSetPassword 
                        ? t("Enter current password and create a secure new password.") 
                        : t("Your account was created via Google. Create a password to enable email login.")}
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Current Password (Only required if user has a set password) */}
                {profile.hasSetPassword && (
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      {t("Current Password")} <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPass ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder={t("Enter current password")}
                        className="w-full bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl pl-4 pr-11 py-3 border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-xs font-bold text-on-surface-variant mb-1.5">
                    {t("New Password")} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPass ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder={t("Minimum 8 characters, with uppercase, numbers, and symbols")}
                      className="w-full bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl pl-4 pr-11 py-3 border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="flex items-center gap-1.5 pt-2 px-0.5">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 1 ? passStrength.color : 'bg-surface-container-highest'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 2 ? passStrength.color : 'bg-surface-container-highest'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 3 ? passStrength.color : 'bg-surface-container-highest'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 4 ? passStrength.color : 'bg-surface-container-highest'}`} />
                      <span className={`text-xs ml-2 min-w-[65px] text-right font-bold ${passStrength.textClass}`}>
                        {passStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-bold text-on-surface-variant mb-1.5">
                    {t("Confirm New Password")} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      placeholder={t("Re-enter new password")}
                      className="w-full bg-surface-container-lowest text-on-surface text-sm font-semibold rounded-xl pl-4 pr-11 py-3 border border-surface-container-high focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && (
                    <div className="mt-1.5 text-xs font-semibold flex items-center gap-1.5">
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("Passwords match")}</span>
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" />
                          <span>{t("Passwords do not match")}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Change Password Button */}
                <div className="pt-4 border-t border-surface-container flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      savingPassword || 
                      (profile.hasSetPassword && !passwordData.currentPassword) || 
                      !passwordData.newPassword || 
                      passwordData.newPassword !== passwordData.confirmPassword
                    }
                    className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/25 disabled:opacity-50 cursor-pointer"
                  >
                    {savingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>{t("Updating...")}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 shrink-0" />
                        <span>{profile.hasSetPassword ? t("Update Password") : t("Set Password")}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* =========================================================================
            TAB 4: CÀI ĐẶT THÔNG BÁO (NOTIFICATION PREFERENCES)
            ========================================================================= */}
        {activeTab === 'notifications' && (
          <motion.div
            key="tab-notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto w-full bg-surface-container-low rounded-3xl p-6 sm:p-8 shadow-xs border border-surface-container space-y-6"
          >
            <div className="flex items-center gap-3 pb-5 border-b border-surface-container">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-on-surface">{t("Notification & Reminder Preferences")}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{t("Customize notifications sent to your app and email so you never miss a workout.")}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toggle 1: Workout Reminder */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-container border border-surface-container-high/80 transition-all">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">{t("30-minute workout reminder")}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {t("Send a reminder notification 30 minutes before your scheduled coaching session so you have time to prepare.")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification('workoutReminder')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    notifPrefs.workoutReminder ? 'bg-primary' : 'bg-surface-container-highest border border-surface-container-high'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      notifPrefs.workoutReminder ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Membership Expiry Reminder */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-container border border-surface-container-high/80 transition-all">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">{t("Membership package expiry alert")}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {t("Notify you 7 days before your membership package expires so you can renew in time and maintain your tier rank.")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification('membershipExpiry')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    notifPrefs.membershipExpiry ? 'bg-primary' : 'bg-surface-container-highest border border-surface-container-high'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      notifPrefs.membershipExpiry ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Coach Feedback */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-container border border-surface-container-high/80 transition-all">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">{t("Coach feedback & workout evaluations")}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {t("Get notified instantly when your Coach updates your InBody metrics or issues a new workout plan.")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification('coachFeedback')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    notifPrefs.coachFeedback ? 'bg-primary' : 'bg-surface-container-highest border border-surface-container-high'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      notifPrefs.coachFeedback ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Club News & Promos */}
              <div className="flex items-start justify-between p-4 rounded-2xl bg-surface-container border border-surface-container-high/80 transition-all">
                <div className="flex items-start gap-3.5 pr-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-on-surface">{t("Club news & tournament events")}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                      {t("Receive updates on swimming tournaments, fitness competitions, and birthday promotions.")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotification('clubPromotions')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 ${
                    notifPrefs.clubPromotions ? 'bg-primary' : 'bg-surface-container-highest border border-surface-container-high'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      notifPrefs.clubPromotions ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-3 text-[11px] text-on-surface-variant flex items-center gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>{t("Notification preferences are automatically saved on your device.")}</span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* FULLSCREEN QR CODE MODAL FOR TURNSTILE CHECK-IN */}
      {qrZoomOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setQrZoomOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-6 sm:p-7 shadow-2xl border border-surface-container-high text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setQrZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-on-surface">{t("Member Check-in QR Code")}</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-4">
                {t("Present this code at the Turnstile scanner or Reception desk")}
              </p>

              {/* QR Image Frame */}
              <div className="p-4 rounded-2xl bg-white shadow-inner border border-slate-200 mb-4 inline-block">
                <img
                  src={qrDataUrl}
                  alt="Member QR Pass"
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>

              {/* Member UID Pill */}
              <div className="px-4 py-2 rounded-xl bg-surface-container border border-surface-container-high font-mono text-sm font-black text-on-surface tracking-wider mb-2 flex items-center gap-2">
                <span>{memberUid}</span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                  title={t("Copy")}
                >
                  {copiedUid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("Valid Member")} • {t(tierInfo.label)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION */}
      <div 
        className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 flex items-center gap-3.5 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-xl border ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
            : 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
        } ${toast.visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          {toast.type === 'error' ? <X className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
        </div>
        <span className="text-xs sm:text-sm font-bold leading-tight">{toast.message}</span>
      </div>
    </div>
  );
};

export default Settings;
