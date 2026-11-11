import React, { useState, useEffect, useContext } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import axiosClient from '../../../services/axiosClient';
import { AuthContext } from '../../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Camera,
  Trash2,
  Sparkles,
  FileText,
  ChevronRight,
  Sliders,
  Bell,
  Volume2,
  Clock,
  Check,
  Copy,
  Laptop,
  Layers,
} from 'lucide-react';
import { API_ORIGIN } from '../../../config/apiBase.js';

const ReceptionistSettingsView = () => {
  useLanguage();
  const { userInfo, updateUserInfo } = useContext(AuthContext);

  // Active Sidebar Tab: 'profile' | 'security' | 'desk_preferences' | 'notifications'
  const [activeTab, setActiveTab] = useState('profile');

  // Floating Toast Notification
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });
  const showToast = (type, title, message) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Profile Form State
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    userId: null,
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: null,
  });

  // Avatar Upload States
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  // Desk Operational Preferences (localStorage)
  const [deskPrefs, setDeskPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('receptionist_desk_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      turnstileChime: true,
      autoRefreshInterval: 30, // seconds: 0, 15, 30, 60
      tableDensity: 'comfortable', // 'comfortable' | 'compact'
      soundVolume: 'normal',
    };
  });

  // Notification Preferences (localStorage)
  const [notifyPrefs, setNotifyPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('receptionist_notification_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      expiringMembershipAlert: true,
      pendingInvoiceAlert: true,
      checkinSuccessBanner: true,
      shiftHandoverReminder: true,
    };
  });

  // Front Desk Station Info
  const [copiedBadge, setCopiedBadge] = useState(false);

  // Play synthetic Web Audio chime for test
  const playTestChime = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (err) {
      console.warn('AudioContext not allowed or not supported', err);
    }
  };

  // Handle Desk Preference Toggle
  const handleToggleDeskPref = (key, val) => {
    setDeskPrefs((prev) => {
      const updated = { ...prev, [key]: val !== undefined ? val : !prev[key] };
      localStorage.setItem('receptionist_desk_preferences', JSON.stringify(updated));
      return updated;
    });
    showToast('success', t('Preferences Updated'), t('Front desk configuration saved!'));
  };

  // Handle Notification Preference Toggle
  const handleToggleNotifyPref = (key) => {
    setNotifyPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('receptionist_notification_preferences', JSON.stringify(updated));
      window.dispatchEvent(new Event('receptionistNotificationUpdated'));
      return updated;
    });
    showToast('success', t('Notifications Saved'), t('Reception alert preferences updated.'));
  };

  // Fetch Current Profile
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await axiosClient.get('/v1/user/profile');
      if (data) {
        setProfileData({
          userId: data.userId || null,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || (data.avatarPath ? '/api/avatars/' + data.avatarPath : null),
        });
      }
    } catch (err) {
      console.error('Error fetching receptionist profile:', err);
      showToast('error', t('Failed to Load'), err.response?.data?.message || t('Unable to load receptionist profile.'));
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', t('File Too Large'), t('Avatar image must be 2MB or smaller.'));
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setAvatarUploading(true);
      const res = await axiosClient.post('/v1/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.avatarUrl;
      setProfileData((prev) => ({ ...prev, avatarUrl: newUrl }));
      if (updateUserInfo) updateUserInfo({ avatarUrl: newUrl });
      else {
        const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: newUrl }));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
      showToast('success', t('Photo Updated'), t('Avatar updated successfully!'));
    } catch (err) {
      showToast('error', t('Upload Error'), err.response?.data?.message || t('Failed to upload avatar.'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Handle Avatar Delete
  const handleAvatarDelete = async () => {
    try {
      setAvatarUploading(true);
      await axiosClient.delete('/v1/user/avatar');
      setProfileData((prev) => ({ ...prev, avatarUrl: null }));
      if (updateUserInfo) updateUserInfo({ avatarUrl: null });
      else {
        const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: null }));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
      showToast('success', t('Photo Removed'), t('Avatar removed successfully!'));
    } catch (err) {
      showToast('error', t('Error'), err.response?.data?.message || t('Failed to remove avatar.'));
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!profileData.fullName.trim()) {
      showToast('error', t('Validation Error'), t('Please enter your full name.'));
      return;
    }

    try {
      setSavingProfile(true);
      const res = await axiosClient.put('/v1/user/profile', {
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim(),
        bio: profileData.bio.trim(),
      });

      showToast('success', t('Profile Saved'), res?.message || t('Profile updated successfully!'));

      if (updateUserInfo) {
        updateUserInfo({
          ...userInfo,
          fullName: profileData.fullName.trim(),
          phone: profileData.phone.trim(),
        });
      } else {
        const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        localStorage.setItem(
          'userInfo',
          JSON.stringify({
            ...savedInfo,
            fullName: profileData.fullName.trim(),
            phone: profileData.phone.trim(),
          })
        );
        window.dispatchEvent(new Event('userProfileUpdated'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('error', t('Error'), err.response?.data?.message || t('Error saving profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', message: t('Please enter current password.') });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: t('New password must be at least 6 characters.') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: t('Confirm password does not match.') });
      return;
    }

    try {
      setChangingPassword(true);
      const res = await axiosClient.put('/v1/user/change-password', {
        currentPassword,
        newPassword,
      });

      showToast('success', t('Password Updated'), res?.message || t('Password changed successfully!'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ type: 'success', message: t('Password changed successfully!') });
      setTimeout(() => setPasswordFeedback(null), 3500);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Incorrect current password or an error occurred.'),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Password Strength Calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-700' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: t('Weak'), color: 'bg-rose-500' };
    if (score <= 4) return { score: 2, label: t('Medium'), color: 'bg-amber-500' };
    return { score: 3, label: t('Strong'), color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const fullName = profileData.fullName || userInfo?.fullName || 'Lễ Tân Thúy Kiều';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const avatarSrc = profileData.avatarUrl
    ? profileData.avatarUrl.startsWith('http')
      ? profileData.avatarUrl
      : `${API_ORIGIN}${profileData.avatarUrl}`
    : null;

  const staffId = profileData.userId ? `REC-${String(profileData.userId).padStart(4, '0')}` : 'REC-0012';

  const copyStaffBadge = () => {
    navigator.clipboard?.writeText(staffId);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
    showToast('success', t('Copied'), `${staffId} ${t('copied to clipboard')}`);
  };

  // Sidebar Tabs Config
  const SIDEBAR_TABS = [
    {
      id: 'profile',
      label: t('Personal Profile'),
      subtitle: t('Name, contact & shift notes'),
      icon: User,
      tileColor: 'bg-[#0071E3]',
    },
    {
      id: 'security',
      label: t('Security & Password'),
      subtitle: t('Password & credentials'),
      icon: Lock,
      tileColor: 'bg-emerald-500',
    },
    {
      id: 'desk_preferences',
      label: t('Front Desk Preferences'),
      subtitle: t('Turnstile chime & auto-refresh'),
      icon: Sliders,
      tileColor: 'bg-amber-500',
    },
    {
      id: 'notifications',
      label: t('Notification Preferences'),
      subtitle: t('Turnstile & invoice alerts'),
      icon: Bell,
      tileColor: 'bg-rose-500',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* =========================================================================
          DYNAMIC FLOATING TOAST (APPLE DYNAMIC ISLAND STYLE)
          ========================================================================= */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-xl max-w-sm"
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight">{toast.title}</p>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          TOP HEADER BAR
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            <span>{t('Front Desk Control')}</span>
            <span>•</span>
            <span className="text-[#0071E3] font-bold">macOS Sequoia HIG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {t('Receptionist Settings')}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 text-[#0071E3] dark:text-blue-400 border border-blue-500/20 text-xs font-bold flex items-center gap-1.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('Front Desk Specialist')}</span>
          </div>

          <button
            type="button"
            onClick={fetchProfile}
            disabled={profileLoading}
            className="px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-black/[0.04] dark:border-white/[0.06]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${profileLoading ? 'animate-spin text-[#0071E3]' : ''}`} />
            <span>{t('Refresh')}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MACOS SPLIT-VIEW SYSTEM SETTINGS WINDOW FRAME
          ========================================================================= */}
      <div className="w-full rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* -----------------------------------------------------------------------
            LEFT SIDEBAR: CUPERTINO NAVIGATION MENU
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-slate-50/80 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between">
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
              {/* Avatar with Halo & Green Verification Dot */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 p-[2px] shadow-sm">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center font-black text-sm text-[#0071E3] relative">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: avatarSrc ? 'none' : 'flex' }}
                      className="w-full h-full items-center justify-center bg-blue-500/10 text-[#0071E3] font-bold"
                    >
                      {initials}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>

              {/* Account Details */}
              <div className="min-w-0 flex-1 text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {fullName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {profileData.email || userInfo?.email || 'receptionist@sport.com'}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#0071E3]/10 text-[#0071E3] dark:text-blue-400 border border-[#0071E3]/20 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{t('RECEPTIONIST')}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Section Title */}
            <div className="px-2 mb-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                {t('PREFERENCES')}
              </span>
            </div>

            {/* Cupertino Navigation List */}
            <div className="space-y-1">
              {SIDEBAR_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-[#0071E3] text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 ${
                          isActive ? 'bg-white/20' : tab.tileColor
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <span className="truncate text-left" title={tab.label}>
                        {tab.label}
                      </span>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 opacity-60 ${isActive ? 'text-white' : 'text-slate-400'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="pt-4 mt-6 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>{t('Front Desk Station')}</span>
            <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('Online')}
            </span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT DETAIL PANE: INSET GROUPED CONTENT AREA
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 p-5 sm:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* ===================================================================
                TAB 1: PERSONAL PROFILE & DUTY SHIFT
                =================================================================== */}
            {activeTab === 'profile' && (
              <motion.div
                key="tab-profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t('Personal Profile')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Update your receptionist credentials, contact number, and duty notes.')}
                    </p>
                  </div>
                </div>

                {/* Avatar Studio Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border-2 border-black/[0.06] dark:border-white/[0.1] shadow-inner flex items-center justify-center text-[#0071E3] font-black text-2xl relative">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: avatarSrc ? 'none' : 'flex' }}
                        className="w-full h-full items-center justify-center"
                      >
                        {initials}
                      </div>

                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <label
                      className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#0071E3] hover:bg-blue-600 text-white shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      title={t('Upload photo')}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={avatarUploading}
                      />
                    </label>
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {t('Profile Photo')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('Upload an official portrait image. Max size: 2MB (PNG, JPG).')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <label className="px-3 py-1.5 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] dark:text-blue-400 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 active:scale-95">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('Change Photo')}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={avatarUploading}
                        />
                      </label>

                      {avatarSrc && (
                        <button
                          type="button"
                          onClick={handleAvatarDelete}
                          disabled={avatarUploading}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('Remove')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields: Inset Grouped */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                    {/* Full Name */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-44 shrink-0 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#0071E3]" />
                        <span>{t('Full Name')} *</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        required
                        placeholder={t('Please enter your full name.')}
                        className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all"
                      />
                    </div>

                    {/* Email (Read-Only) */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="w-44 shrink-0">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('Login Email')}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t('Secured account')}</span>
                      </div>
                      <div className="w-full max-w-md relative">
                        <input
                          type="email"
                          value={profileData.email || 'receptionist@sport.com'}
                          disabled
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono opacity-80"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {t('Locked')}
                        </span>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-44 shrink-0 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('Phone Number')}</span>
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="0901 234 567"
                        className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all"
                      />
                    </div>

                    {/* Duty Shift Notes / Bio */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="w-44 shrink-0 pt-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('Duty Shift Notes / Bio')}</span>
                        </label>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t('Visible on staff handover')}</span>
                      </div>
                      <textarea
                        rows={3}
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        placeholder={t('Example: Front Desk Counter A • Morning Shift (06:00 - 14:00)...')}
                        className="w-full max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Staff Station Info Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800/40 dark:to-slate-800/20 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 text-[#0071E3] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {t('Terminal Badge')}: {staffId}
                          </span>
                          <button
                            type="button"
                            onClick={copyStaffBadge}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                            title={t('Copy Staff ID')}
                          >
                            {copiedBadge ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t('Main Lobby Turnstile Desk')} • <span className="text-emerald-500 font-semibold">{t('On Duty')}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{savingProfile ? t('Saving...') : t('Save Changes')}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ===================================================================
                TAB 2: SECURITY & PASSWORD
                =================================================================== */}
            {activeTab === 'security' && (
              <motion.div
                key="tab-security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t('Security & Password')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Update password regularly to safeguard front desk terminal operations.')}
                    </p>
                  </div>
                </div>

                {passwordFeedback && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 border ${
                      passwordFeedback.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {passwordFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                    {/* Current Password */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-44 shrink-0 flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t('Current Password')} *</span>
                      </label>
                      <div className="w-full max-w-md relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          placeholder={t('Enter current password')}
                          className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="w-44 shrink-0">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-[#0071E3]" />
                          <span>{t('New Password')} *</span>
                        </label>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{t('Min 6 characters')}</span>
                      </div>
                      <div className="w-full max-w-md space-y-2">
                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder={t('Enter new password')}
                            className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Meter */}
                        {newPassword && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">{t('Password Strength')}:</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300">{strength.label}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 h-1.5">
                              <div
                                className={`rounded-full transition-all ${
                                  strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                              <div
                                className={`rounded-full transition-all ${
                                  strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                              <div
                                className={`rounded-full transition-all ${
                                  strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-44 shrink-0 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t('Confirm Password')} *</span>
                      </label>
                      <div className="w-full max-w-md relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder={t('Re-enter new password')}
                          className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.06] dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0071E3] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Callout */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{t('Front Desk Security Guideline')}</p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                        {t(
                          'Always lock your screen when leaving the front desk counter. Never disclose employee credentials to members.'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      {changingPassword ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <KeyRound className="w-4 h-4" />
                      )}
                      <span>{changingPassword ? t('Updating...') : t('Update Password')}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ===================================================================
                TAB 3: FRONT DESK & CHECK-IN PREFERENCES
                =================================================================== */}
            {activeTab === 'desk_preferences' && (
              <motion.div
                key="tab-desk-prefs"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t('Front Desk Preferences')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Configure audio feedback, turnstile refresh rate, and counter workflow.')}
                    </p>
                  </div>
                </div>

                {/* Preferences List: Inset Grouped */}
                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                  {/* Turnstile Audio Chime */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Turnstile Check-in Audio Feedback')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Play pleasant chime sound when turnstile check-in succeeds.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={playTestChime}
                        className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t('Test Audio')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDeskPref('turnstileChime')}
                        className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer relative ${
                          deskPrefs.turnstileChime ? 'bg-[#0071E3]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            deskPrefs.turnstileChime ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Auto-Refresh Frequency */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Auto-Refresh Attendance Logs')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Periodically fetch new check-in events at the turnstile gate.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {[
                        { label: t('15s'), value: 15 },
                        { label: t('30s'), value: 30 },
                        { label: t('60s'), value: 60 },
                        { label: t('Off'), value: 0 },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleToggleDeskPref('autoRefreshInterval', opt.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            deskPrefs.autoRefreshInterval === opt.value
                              ? 'bg-[#0071E3] text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table Density */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Member List Density')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Adjust row height and spacing for compact front desk screens.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {[
                        { label: t('Comfortable'), value: 'comfortable' },
                        { label: t('Compact'), value: 'compact' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleToggleDeskPref('tableDensity', item.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            deskPrefs.tableDensity === item.value
                              ? 'bg-[#0071E3] text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts Reference */}
                <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#0071E3]" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {t('Receptionist Quick Shortcuts')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'F2', desc: t('Scan QR Pass') },
                      { key: 'F4', desc: t('Find Member') },
                      { key: 'F8', desc: t('Manage Invoices') },
                      { key: 'Esc', desc: t('Close Modal') },
                    ].map((shortcut) => (
                      <div
                        key={shortcut.key}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-black/[0.04] dark:border-white/[0.06] flex flex-col gap-1"
                      >
                        <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs w-fit">
                          {shortcut.key}
                        </kbd>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {shortcut.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===================================================================
                TAB 4: NOTIFICATION PREFERENCES
                =================================================================== */}
            {activeTab === 'notifications' && (
              <motion.div
                key="tab-notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {t('Notification Preferences')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Control which alerts and warnings are shown during front desk shifts.')}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-hidden">
                  {/* Expiring Membership Alert */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Expiring Package Warning')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Alert receptionist when member package has less than 3 days or 1 session left.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotifyPref('expiringMembershipAlert')}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer relative shrink-0 ${
                        notifyPrefs.expiringMembershipAlert ? 'bg-[#0071E3]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifyPrefs.expiringMembershipAlert ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Pending Invoice Alerts */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Pending Invoice Notifications')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Notify when new unpaid checkout cart is transferred to front desk.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotifyPref('pendingInvoiceAlert')}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer relative shrink-0 ${
                        notifyPrefs.pendingInvoiceAlert ? 'bg-[#0071E3]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifyPrefs.pendingInvoiceAlert ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Turnstile Check-in Success Banner */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Turnstile Check-in Toast Banner')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Display instant toast on screen when a member scans successfully.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotifyPref('checkinSuccessBanner')}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer relative shrink-0 ${
                        notifyPrefs.checkinSuccessBanner ? 'bg-[#0071E3]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifyPrefs.checkinSuccessBanner ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Shift Handover Reminder */}
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#0071E3] flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Shift Handover Checklist')}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t('Show shift handover reminder at the end of receptionist working session.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleNotifyPref('shiftHandoverReminder')}
                      className={`w-11 h-6 rounded-full transition-colors p-1 cursor-pointer relative shrink-0 ${
                        notifyPrefs.shiftHandoverReminder ? 'bg-[#0071E3]' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          notifyPrefs.shiftHandoverReminder ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Card Footer */}
          <div className="pt-6 mt-6 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>{t('Sports Center Management System • Front Desk Edition')}</span>
            <span className="font-mono">{t('Terminal Encrypted')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistSettingsView;
