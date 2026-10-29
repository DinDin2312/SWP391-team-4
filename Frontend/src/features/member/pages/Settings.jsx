import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import MemberTierAvatar from '../../../components/MemberTierAvatar';
import axiosClient from '../../../services/axiosClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Camera, Trash2, 
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
  FileCheck2,
  ChevronRight
} from 'lucide-react';

const EmvChipSvg = ({ variant = 'gold' }) => {
  const isSilver = variant === 'silver';
  return (
    <svg className="w-11 h-8 sm:w-12 sm:h-9 rounded-md shadow-md shrink-0" viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="36" rx="5" fill={isSilver ? "url(#chipSilver)" : "url(#chipGold)"} />
      <rect x="0.5" y="0.5" width="47" height="35" rx="4.5" stroke={isSilver ? "#94A3B8" : "#B45309"} strokeWidth="0.75" opacity="0.6" />
      {/* Circuit traces */}
      <path d="M0 13H15M0 23H15M33 13H48M33 23H48M15 0V36M33 0V36M15 18H33" stroke={isSilver ? "#64748B" : "#78350F"} strokeWidth="0.8" opacity="0.7" />
      <rect x="19" y="11" width="10" height="14" rx="2.5" fill={isSilver ? "url(#chipInnerSilver)" : "url(#chipInnerGold)"} stroke={isSilver ? "#64748B" : "#78350F"} strokeWidth="0.8" opacity="0.8" />
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="60%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="chipInnerGold" x1="19" y1="11" x2="29" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="chipSilver" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="40%" stopColor="#CBD5E1" />
          <stop offset="70%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="chipInnerSilver" x1="19" y1="11" x2="29" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const ContactlessSvg = () => (
  <svg className="w-5 h-5 text-white/80 shrink-0 drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M8.5 16.5a6 6 0 0 1 0-9" />
    <path d="M12 19a10 10 0 0 1 0-14" />
    <path d="M15.5 21.5a14 14 0 0 1 0-19" />
  </svg>
);

const HolographicSeal = () => (
  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/40 shadow-inner flex items-center justify-center shrink-0 bg-gradient-to-tr from-rose-500/30 via-cyan-400/30 to-amber-300/40 backdrop-blur-md">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent_60%)]" />
    <ShieldCheck className="w-3.5 h-3.5 text-white drop-shadow-md relative z-10" />
  </div>
);

const TIER_CONFIG = {
  MEMBER: {
    name: 'MEMBER',
    label: 'Standard Member',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 dark:border-amber-500/30',
    cardBadgeClass: 'bg-amber-400/20 text-amber-200 border-amber-400/40 shadow-inner',
    cardSurface: 'border-white/15 ring-1 ring-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)]',
    cardGradient: 'from-[#1c1c1f] via-[#121214] to-[#09090b]',
    glowColor: 'bg-amber-500/10',
    chipVariant: 'gold',
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
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-200 border-slate-400/20 dark:border-slate-400/30',
    cardBadgeClass: 'bg-slate-300/25 text-slate-100 border-slate-300/50 shadow-inner',
    cardSurface: 'border-slate-300/40 ring-1 ring-slate-400/20 shadow-[0_25px_60px_-15px_rgba(100,116,139,0.3)]',
    cardGradient: 'from-[#2e3138] via-[#1f2229] to-[#121418]',
    glowColor: 'bg-slate-300/15',
    chipVariant: 'silver',
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
    badgeClass: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/25 dark:border-yellow-500/30',
    cardBadgeClass: 'bg-amber-400/25 text-amber-200 border-amber-300/60 shadow-inner',
    cardSurface: 'border-amber-400/50 ring-1 ring-yellow-400/30 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.3)]',
    cardGradient: 'from-[#352510] via-[#211606] to-[#120c02]',
    glowColor: 'bg-amber-400/20',
    chipVariant: 'gold',
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
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25 dark:border-cyan-500/35',
    cardBadgeClass: 'bg-cyan-400/25 text-cyan-100 border-cyan-300/60 shadow-inner',
    cardSurface: 'border-cyan-400/50 ring-1 ring-blue-400/30 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.3)]',
    cardGradient: 'from-[#0d1e3d] via-[#09152b] to-[#020712]',
    glowColor: 'bg-cyan-400/25',
    chipVariant: 'silver',
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Avatar Upload Handlers
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(t("Avatar image must be 2MB or smaller."), "error");
      return;
    }
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      setAvatarUploading(true);
      const res = await axiosClient.post('/v1/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrl = res.avatarUrl;
      setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
      const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: newUrl }));
      window.dispatchEvent(new Event('userProfileUpdated'));
      showToast(t("Avatar updated successfully!"), "success");
    } catch (err) {
      showToast(err.response?.data?.message || t("Failed to upload avatar."), "error");
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    try {
      setAvatarUploading(true);
      await axiosClient.delete('/v1/user/avatar');
      setProfile(prev => ({ ...prev, avatarUrl: null, avatarPath: null }));
      const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: null }));
      window.dispatchEvent(new Event('userProfileUpdated'));
      showToast(t("Avatar removed successfully!"), "success");
    } catch (err) {
      showToast(err.response?.data?.message || t("Failed to remove avatar."), "error");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Toast Trigger Helper
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Load Profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get('/v1/user/profile');
        if (res) {
          setProfile({
            userId: res.userId,
            fullName: res.fullName || '',
            email: res.email || '',
            phone: res.phone || '',
            loyaltyPoints: res.loyaltyPoints || 0,
            memberTier: res.memberTier || 'MEMBER',
            hasSetPassword: res.hasSetPassword !== false,
            avatarUrl: res.avatarUrl || null
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        showToast(t("Failed to load profile data."), "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    try {
      const savedPrefs = localStorage.getItem('nexus_notification_prefs');
      if (savedPrefs) {
        setNotifPrefs(JSON.parse(savedPrefs));
      }
    } catch {
      // Keep defaults
    }
  }, []);

  // Handle Profile Inputs
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Save Profile Details
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

  // Handle Email Change - Step 1: Send OTP
  const handleSendEmailOtp = async () => {
    setEmailError('');
    if (!newEmail || !newEmail.includes('@')) {
      setEmailError(t("Please enter a valid email address."));
      return;
    }
    if (newEmail.trim().toLowerCase() === profile.email.toLowerCase()) {
      setEmailError(t("New email must be different from current email."));
      return;
    }

    try {
      setEmailLoading(true);
      await axiosClient.post('/v1/user/email/otp', { newEmail });
      setEmailStep(2);
    } catch (err) {
      setEmailError(err.response?.data?.message || t("Failed to send OTP to new email."));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Email Change - Step 2: Verify OTP
  const handleVerifyEmailOtp = async () => {
    setEmailError('');
    if (!otp || otp.length < 6) {
      setEmailError(t("Please enter the complete 6-digit OTP code."));
      return;
    }

    try {
      setEmailLoading(true);
      await axiosClient.put('/v1/user/email', { newEmail, otp });
      setEmailStep(3);
      setProfile(prev => ({ ...prev, email: newEmail }));
      showToast(t("Email updated successfully!"));
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setEmailError(err.response?.data?.message || t("Invalid or expired OTP code."));
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle Password Inputs
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Password Strength Calculation (Apple standard)
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-transparent', textClass: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 1, text: t('Weak'), color: 'bg-rose-500', textClass: 'text-rose-500' };
      case 2:
        return { score: 2, text: t('Medium'), color: 'bg-amber-500', textClass: 'text-amber-500' };
      case 3:
        return { score: 3, text: t('Good'), color: 'bg-blue-500', textClass: 'text-blue-500' };
      case 4:
        return { score: 4, text: t('Strong'), color: 'bg-emerald-500', textClass: 'text-emerald-500' };
      default:
        return { score: 0, text: '', color: 'bg-transparent', textClass: '' };
    }
  };

  const passStrength = calculatePasswordStrength(passwordData.newPassword);

  // Handle Change Password Submit
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (profile.hasSetPassword && !passwordData.currentPassword) {
      setPasswordError(t("Please enter your current password."));
      return;
    }
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      setPasswordError(t("New password must be at least 8 characters long."));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t("Password confirmation does not match."));
      return;
    }

    try {
      setSavingPassword(true);
      await axiosClient.put('/v1/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(t("Password updated successfully!"));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfile(prev => ({ ...prev, hasSetPassword: true }));
      showToast(t("Account password updated successfully!"));
    } catch (err) {
      setPasswordError(err.response?.data?.message || t("Failed to update password. Please check your credentials."));
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Notification Toggle
  const toggleNotification = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      localStorage.setItem('nexus_notification_prefs', JSON.stringify(updated));
    } catch {
      // LocalStorage access fallback
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
      <div className="flex items-center justify-center w-full min-h-[460px]">
        <div className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0071E3]" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
            {t("Loading account settings...")}
          </span>
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
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=NEXUS-PASS-${memberUid}&color=0f172a`;
  const formattedCardUid = profile.userId 
    ? `NX • ${String(profile.userId).padStart(2, '0')} • 8807 • VN` 
    : 'NX • 06 • 8807 • VN';

  const SIDEBAR_TABS = [
    { id: 'profile', label: t('Personal Profile'), icon: User, tileColor: 'bg-[#0071E3]' },
    { id: 'membership', label: t('Membership & QR Pass'), icon: Crown, tileColor: 'bg-gradient-to-tr from-amber-500 to-yellow-400' },
    { id: 'security', label: t('Security & Password'), icon: Lock, tileColor: 'bg-emerald-500' },
    { id: 'notifications', label: t('Notification Preferences'), icon: Bell, tileColor: 'bg-rose-500' }
  ];

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 px-3 sm:px-6">
      
      {/* =========================================================================
          MEMBER SYSTEM SETTINGS TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-blue-400 text-[11px] font-semibold tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("Verified Account")}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <button 
              onClick={handleCopyUid}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium transition-all cursor-pointer active:scale-95"
              title={t("Click to copy ID")}
            >
              <span>{memberUid}</span>
              {copiedUid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("Member Settings")}
          </h1>
        </div>

        {/* Status Pill Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-2 backdrop-blur-md shadow-xs ${tierInfo.badgeClass}`}>
            <Crown className="w-3.5 h-3.5 shrink-0" />
            <span>{t(tierInfo.label)}</span>
          </div>

          <button
            onClick={() => setActiveTab('membership')}
            className="px-3.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-black/[0.04] dark:border-white/[0.06]"
          >
            <QrCode className="w-3.5 h-3.5 text-[#0071E3]" />
            <span>{t("Digital Pass")}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MACOS SYSTEM SETTINGS SPLIT-VIEW WINDOW FRAME (SIGNATURE APPLE HIG)
          ========================================================================= */}
      <div className="w-full rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* -----------------------------------------------------------------------
            LEFT SIDEBAR: MACOS APPLE ACCOUNT & SETTINGS NAVIGATION MENU
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3 bg-slate-50/80 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Top Mini Apple Account Card */}
            <div 
              onClick={() => setActiveTab('profile')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 mb-5 active:scale-[0.98] ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 border-[#0071E3]/30 shadow-[0_4px_16px_rgba(0,113,227,0.08)]'
                  : 'bg-white/60 dark:bg-slate-900/60 border-black/[0.04] dark:border-white/[0.06] hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <MemberTierAvatar
                avatarUrl={profile.avatarUrl}
                fullName={profile.fullName}
                memberTier={profile.memberTier}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {profile.fullName || t("NEXUS Member")}
                </h4>
                <span className="text-[11px] text-slate-400 truncate block mt-0.5 font-medium">
                  {profile.email}
                </span>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-semibold">
                  <Crown className="w-3 h-3" />
                  <span>{tierInfo.name}</span>
                </div>
              </div>
            </div>

            {/* macOS Grouped Settings Navigation Menu with Colored Tiles */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 block">
                Preferences
              </span>

              {SIDEBAR_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#0071E3] text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs ${
                        isActive ? 'bg-white/20' : tab.tileColor
                      }`}>
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="pt-4 mt-6 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>macOS Sequoia HIG</span>
            <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT DETAIL PANE: MACOS INSET GROUPED CONTENT AREA
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-9 p-5 sm:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between">
          <AnimatePresence mode="wait">

            {/* TAB 1: PERSONAL PROFILE */}
            {activeTab === 'profile' && (
              <motion.div
                key="apple-tab-profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t("Personal Details")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("Update your full name and official contact info.")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{t("Save Changes")}</span>
                  </button>
                </div>

                {/* Hero Avatar & Photo Management Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <MemberTierAvatar
                      avatarUrl={profile.avatarUrl}
                      fullName={profile.fullName}
                      memberTier={profile.memberTier}
                      size="xl"
                    >
                      {/* Hover Camera Overlay inside Avatar (Google style) */}
                      {!avatarUploading && (
                        <label
                          className="absolute inset-0 z-20 rounded-full bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-200 backdrop-blur-[2px]"
                          title={t("Change photo")}
                        >
                          <Camera className="w-6 h-6 drop-shadow-md text-white" />
                          <span className="text-[10px] font-bold mt-1 text-white drop-shadow-sm tracking-tight">{t("Change photo")}</span>
                          <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
                        </label>
                      )}

                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center rounded-full z-20">
                          <RefreshCw className="w-7 h-7 text-white animate-spin" />
                        </div>
                      )}
                    </MemberTierAvatar>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {profile.fullName || t("NEXUS Member")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {profile.email} • <span className="font-mono">{memberUid}</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                      <label className="px-3.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.07] text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#0071E3]" />
                        <span>{t("Upload photo")}</span>
                        <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
                      </label>
                      {profile.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          disabled={avatarUploading}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-xs font-semibold text-rose-500 cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t("Remove photo")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cupertino Inset Form Fields */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      {t("Full Name")} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="fullName"
                        name="fullName"
                        value={profile.fullName || ''}
                        onChange={handleProfileChange}
                        type="text"
                        placeholder={t("Enter your full name")}
                        className="w-full bg-black/[0.02] dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 transition-all"
                      />
                      <BadgeCheck className="w-4 h-4 text-[#0071E3] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
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
                        className="w-full bg-black/[0.02] dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 transition-all font-mono"
                      />
                      <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Email & OTP verification */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {t("Linked Email")}
                      </label>
                      {!showEmailModal && (
                        <button
                          type="button"
                          onClick={() => setShowEmailModal(true)}
                          className="text-xs text-[#0071E3] font-semibold hover:underline cursor-pointer"
                        >
                          {t("Change Email")}
                        </button>
                      )}
                    </div>

                    {showEmailModal ? (
                      <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[#0071E3]/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{t("Update Email Address")}</span>
                          <button 
                            type="button" 
                            onClick={() => { setShowEmailModal(false); setEmailStep(1); }} 
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
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
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-lg text-xs sm:text-sm font-medium border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3]"
                            />
                            <button
                              type="button"
                              onClick={handleSendEmailOtp}
                              disabled={emailLoading || !newEmail}
                              className="w-full py-2 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              {emailLoading ? t("Sending OTP...") : t("Send Verification OTP")}
                            </button>
                          </>
                        )}

                        {emailStep === 2 && (
                          <>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {t("We sent a 6-digit code to")}: <strong className="text-slate-900 dark:text-white">{newEmail}</strong>
                            </p>
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder={t("Enter 6-digit OTP")}
                              className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 rounded-lg text-center text-sm font-mono tracking-widest font-bold border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3]"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyEmailOtp}
                              disabled={emailLoading || otp.length < 6}
                              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                              {emailLoading ? t("Verifying...") : t("Verify & Update Email")}
                            </button>
                          </>
                        )}

                        {emailStep === 3 && (
                          <div className="flex flex-col items-center justify-center p-3 text-center">
                            <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-1.5" />
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{t("Email updated successfully!")}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{t("Automatically logging out for security...")}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          id="email"
                          value={profile.email || ''}
                          disabled
                          className="w-full bg-black/[0.02] dark:bg-white/[0.03] text-slate-400 text-sm font-medium rounded-xl px-4 py-3 cursor-not-allowed border border-black/[0.04] dark:border-white/[0.06]"
                          type="email"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-2">
                      <Shield className="w-3.5 h-3.5 shrink-0 text-[#0071E3]" />
                      <span>{t("Email changes require OTP verification sent to the new mailbox.")}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: MEMBERSHIP & APPLE WALLET PASS */}
            {activeTab === 'membership' && (
              <motion.div
                key="apple-tab-membership"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t("Membership & QR Pass")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t("Digital card, check-in QR code, and tier progress.")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQrZoomOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{t("Expand QR Code for Turnstile Scan")}</span>
                  </button>
                </div>

                {/* The Realistic Luxury Metallic Membership Card */}
                <div className="w-full flex justify-center py-2">
                  <div
                    className={`relative w-full max-w-xl min-h-[230px] sm:min-h-[250px] rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border flex flex-col justify-between overflow-hidden group select-none transition-all duration-300 bg-gradient-to-br ${tierInfo.cardGradient} ${tierInfo.cardSurface}`}
                  >
                    {/* Realistic Specular Sheen Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-white/[0.02] pointer-events-none" />
                    <div className={`absolute -top-24 -left-20 w-80 h-80 rounded-full ${tierInfo.glowColor} blur-[90px] pointer-events-none`} />
                    <div className={`absolute -bottom-24 -right-20 w-72 h-72 rounded-full ${tierInfo.glowColor} blur-[90px] pointer-events-none`} />
                    
                    {/* Micro-texture & Hover Dynamic Reflection */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                    {/* Top Row: Brand & Hardware Chip */}
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 text-white flex items-center justify-center font-black shadow-inner tracking-tighter text-base">
                          N
                        </div>
                        <div className="leading-tight">
                          <span className="font-extrabold text-sm sm:text-base text-white tracking-[0.2em] block drop-shadow-sm">
                            NEXUS
                          </span>
                          <span className="text-[8px] font-bold text-white/60 tracking-[0.25em] uppercase block">
                            SPORTS CENTER • VIP PASS
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ContactlessSvg />
                        <EmvChipSvg variant={tierInfo.chipVariant} />
                      </div>
                    </div>

                    {/* Center: Embossed Card UID */}
                    <div className="my-auto py-3 relative z-10">
                      <span className="text-[9px] font-mono tracking-[0.22em] text-white/50 block uppercase font-semibold mb-1">
                        {t("MEMBER ID (UID)")}
                      </span>
                      <div className="font-mono font-bold tracking-[0.22em] text-xl sm:text-2xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex items-center gap-3 select-all">
                        <span>{formattedCardUid}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Cardholder, Expiry & Tier Emblem */}
                    <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/10">
                      <div className="min-w-0 pr-4">
                        <span className="text-[8px] text-white/50 block uppercase font-bold tracking-[0.2em]">
                          {t("CARDHOLDER")}
                        </span>
                        <span className="text-sm sm:text-base font-mono font-bold text-white tracking-wider block truncate uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {profile.fullName || t("NEXUS Member")}
                        </span>
                      </div>

                      <div className="hidden sm:block text-left px-3">
                        <span className="text-[8px] text-white/50 block uppercase font-bold tracking-[0.2em]">
                          {t("VALID THRU")}
                        </span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-white/90 tracking-widest block drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          12/28
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <HolographicSeal />
                        <div
                          className={`px-3 py-1 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-md ${tierInfo.cardBadgeClass || tierInfo.badgeClass}`}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{tierInfo.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apple Health Style Tier Progress Card */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold block">{t("Accumulated Points")}</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{points}</span>
                        <span className="text-xs font-medium text-slate-400">{t("Nexus Points")}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">{t("Next Tier")}</span>
                      <span className="text-sm font-bold text-[#0071E3] dark:text-blue-400 block mt-0.5">
                        {tierInfo.nextTier ? TIER_CONFIG[tierInfo.nextTier].name : t('Max Tier (Top)')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-slate-700 dark:text-slate-300">{t("Tier Progress")}</span>
                      <span className="text-[#0071E3] dark:text-blue-400 font-mono">{progressPercent}%</span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${tierInfo.progressColor}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2.5">
                      {tierInfo.nextTier ? (
                        <>
                          {t("You need")} <strong className="text-[#0071E3] font-bold">{pointsNeeded} {t("points")}</strong> {t("more to reach")}{' '}
                          <strong className="text-slate-900 dark:text-white">{t(TIER_CONFIG[tierInfo.nextTier].label)}</strong>.
                        </>
                      ) : (
                        t("Congratulations! You have reached Platinum VIP, the highest tier at NEXUS.")
                      )}
                    </p>
                  </div>
                </div>

                {/* Exclusive Perks List */}
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-4 h-4 text-[#0071E3]" />
                    <span>{t("Your Exclusive NEXUS Perks")} ({t(tierInfo.label)})</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {tierInfo.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
                          {t(perk)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SECURITY & PASSWORD */}
            {activeTab === 'security' && (
              <motion.div
                key="apple-tab-security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t("Security & Password")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {profile.hasSetPassword ? t("Update current password and manage encryption.") : t("Set your account password for email login.")}
                    </p>
                  </div>
                </div>

                {/* Apple Settings Grouped List */}
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">{t("Email Verified")}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{profile.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 uppercase">
                      {t("Verified")}
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/15 text-[#0071E3] flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block">{t("Password Encryption")}</span>
                        <span className="text-[11px] text-slate-400">{t("BCrypt 256-bit Security Standard")}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3] uppercase">
                      {t("Secure")}
                    </span>
                  </div>
                </div>

                {/* Password Form */}
                <form onSubmit={handleSavePassword} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-4">
                  {passwordError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
                      <X className="w-4 h-4 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {profile.hasSetPassword && (
                    <div>
                      <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        {t("Current Password")} <span className="text-rose-500">*</span>
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
                          className="w-full bg-black/[0.02] dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-11 py-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      {t("New Password")} <span className="text-rose-500">*</span>
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
                        className="w-full bg-black/[0.02] dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-11 py-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {passwordData.newPassword && (
                      <div className="flex items-center gap-1.5 pt-2 px-0.5">
                        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 1 ? passStrength.color : 'bg-black/[0.06] dark:bg-white/[0.08]'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 2 ? passStrength.color : 'bg-black/[0.06] dark:bg-white/[0.08]'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 3 ? passStrength.color : 'bg-black/[0.06] dark:bg-white/[0.08]'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${passStrength.score >= 4 ? passStrength.color : 'bg-black/[0.06] dark:bg-white/[0.08]'}`} />
                        <span className={`text-xs ml-2 min-w-[65px] text-right font-semibold ${passStrength.textClass}`}>
                          {passStrength.text}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      {t("Confirm New Password")} <span className="text-rose-500">*</span>
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
                        className="w-full bg-black/[0.02] dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium rounded-xl pl-4 pr-11 py-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        savingPassword || 
                         (profile.hasSetPassword && !passwordData.currentPassword) || 
                         !passwordData.newPassword || 
                         passwordData.newPassword !== passwordData.confirmPassword
                      }
                      className="px-6 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {savingPassword ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5" />
                      )}
                      <span>{profile.hasSetPassword ? t("Update Password") : t("Set Password")}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* TAB 4: NOTIFICATION PREFERENCES */}
            {activeTab === 'notifications' && (
              <motion.div
                key="apple-tab-notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("Notification Preferences")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("Customize notifications sent to your app and email so you never miss a workout.")}
                  </p>
                </div>

                {/* iOS Settings Group with Real UISwitches */}
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                  
                  {/* Item 1 */}
                  <div className="flex items-center justify-between p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-[#0071E3] flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{t("30-minute workout reminder")}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t("Send a reminder notification 30 minutes before your scheduled coaching session so you have time to prepare.")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(notifPrefs.workoutReminder)}
                      onClick={() => toggleNotification('workoutReminder')}
                      className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-300 ease-in-out cursor-pointer shrink-0 focus:outline-hidden active:scale-95 ${
                        notifPrefs.workoutReminder ? 'bg-[#34C759]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-in-out pointer-events-none ${
                          notifPrefs.workoutReminder ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-center justify-between p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <CalendarCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{t("Membership package expiry alert")}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t("Notify you 7 days before your membership package expires so you can renew in time and maintain your tier rank.")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(notifPrefs.membershipExpiry)}
                      onClick={() => toggleNotification('membershipExpiry')}
                      className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-300 ease-in-out cursor-pointer shrink-0 focus:outline-hidden active:scale-95 ${
                        notifPrefs.membershipExpiry ? 'bg-[#34C759]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-in-out pointer-events-none ${
                          notifPrefs.membershipExpiry ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{t("Coach feedback & workout evaluations")}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t("Get notified instantly when your Coach updates your InBody metrics or issues a new workout plan.")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(notifPrefs.coachFeedback)}
                      onClick={() => toggleNotification('coachFeedback')}
                      className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-300 ease-in-out cursor-pointer shrink-0 focus:outline-hidden active:scale-95 ${
                        notifPrefs.coachFeedback ? 'bg-[#34C759]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-in-out pointer-events-none ${
                          notifPrefs.coachFeedback ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between p-4 hover:bg-black/[0.01] transition-colors">
                    <div className="flex items-center gap-3.5 pr-4">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{t("Club news & tournament events")}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {t("Receive updates on swimming tournaments, fitness competitions, and birthday promotions.")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(notifPrefs.clubPromotions)}
                      onClick={() => toggleNotification('clubPromotions')}
                      className={`w-12 h-7 rounded-full p-0.5 flex items-center transition-colors duration-300 ease-in-out cursor-pointer shrink-0 focus:outline-hidden active:scale-95 ${
                        notifPrefs.clubPromotions ? 'bg-[#34C759]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`block w-6 h-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2),0_0_1px_rgba(0,0,0,0.15)] transform transition-transform duration-300 ease-in-out pointer-events-none ${
                          notifPrefs.clubPromotions ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#0071E3] shrink-0" />
                  <span>{t("Notification preferences are automatically saved on your device.")}</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* =========================================================================
          APPLE CUPERTINO SHEET MODAL FOR QR CODE
          ========================================================================= */}
      {qrZoomOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 animate-in fade-in duration-200"
          onClick={() => setQrZoomOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-7 shadow-2xl border border-black/[0.08] dark:border-white/[0.12] text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center mb-3 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t("Member Check-in QR Code")}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 font-normal">
                {t("Present this code at the Turnstile scanner or Reception desk")}
              </p>

              <div className="p-4 rounded-3xl bg-white shadow-sm border border-slate-200/80 mb-4 inline-block">
                <img
                  src={qrDataUrl}
                  alt="Member QR Pass"
                  className="w-48 h-48 rounded-2xl object-contain"
                />
              </div>

              <div className="px-4 py-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] font-mono text-sm font-bold text-slate-900 dark:text-white tracking-wider mb-2.5 flex items-center gap-2">
                <span>{memberUid}</span>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="text-[#0071E3] hover:opacity-80 transition-opacity cursor-pointer"
                  title={t("Copy")}
                >
                  {copiedUid ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t("Valid Member")} • {t(tierInfo.label)}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          APPLE DYNAMIC ISLAND TOAST NOTIFICATION
          ========================================================================= */}
      <div 
        className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.18)] backdrop-blur-2xl border ${
          toast.type === 'error'
            ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
            : 'bg-slate-950/90 dark:bg-slate-900/95 text-white border-white/10 dark:border-white/20'
        } ${toast.visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"}`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          toast.type === 'error' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <X className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-tight leading-tight">{toast.message}</span>
      </div>

    </div>
  );
};

export default Settings;
