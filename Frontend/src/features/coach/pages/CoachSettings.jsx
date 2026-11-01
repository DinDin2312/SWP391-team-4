import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, BookOpen, AlertTriangle, CheckCircle2,
  Award, FileText, Save, X, RefreshCw, Camera, Trash2,
  AlertCircle, Sparkles, ShieldCheck, Lock, Eye, EyeOff,
  Bell, Check, Copy, ChevronRight, Sliders, KeyRound
} from 'lucide-react';

const CoachSettings = () => {
  useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', title: '', message: '' });

  // Active Navigation Tab: 'profile' | 'specialty' | 'security' | 'preferences'
  const [activeTab, setActiveTab] = useState('profile');

  // Teaching Preferences (Notification alerts)
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('coach_notification_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      scheduleReminders: true,
      attendanceAlerts: true,
      assessmentReminders: true,
      systemNotices: true
    };
  });

  const handleTogglePreference = (key) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('coach_notification_preferences', JSON.stringify(updated));
      window.dispatchEvent(new Event('notificationUpdated'));
      return updated;
    });
    showToast('success', t('Preferences Updated'), t('Notification preferences saved successfully!'));
  };

  // Copy Coach ID feedback
  const [copiedId, setCopiedId] = useState(false);

  // Avatar Upload States
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Coach Profile Data
  const [profile, setProfile] = useState({
    userId: null,
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    avatarUrl: null,
    avatarPath: null,
    currentSubjectId: null,
    currentSubjectName: '',
    currentSubjectDescription: '',
    availableSubjects: [],
    activeClassesCount: 0,
    activeClassNames: [],
    canChangeSubject: true,
    warningMessage: ''
  });

  // Selected subject for editing
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Email Update States (OTP Flow)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Password Change States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const showToast = (type, title, message) => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  const fetchCoachProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/v1/coach/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      if (data.avatarPath) {
        data.avatarUrl = '/api/avatars/' + data.avatarPath;
        const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (savedInfo.avatarUrl !== data.avatarUrl) {
          localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: data.avatarUrl }));
          window.dispatchEvent(new Event('userProfileUpdated'));
        }
      }
      setProfile(data);
      setSelectedSubjectId(data.currentSubjectId || (data.availableSubjects?.[0]?.subjectId ?? null));
    } catch (err) {
      console.error('Failed to fetch coach profile', err);
      showToast('error', t('Error'), err.response?.data?.message || t('Failed to load coach profile.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachProfile();
  }, []);

  const handleCopyId = () => {
    const idText = profile.userId ? `COACH-${profile.userId}` : 'COACH-PORTAL';
    navigator.clipboard?.writeText(idText);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', t('Notice'), t('Avatar image must be 2MB or smaller.'));
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setAvatarUploading(true);
      const res = await axios.post('http://localhost:8080/api/v1/user/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const newUrl = res.data?.avatarUrl || res.data;
      setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
      const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: newUrl }));
      window.dispatchEvent(new Event('userProfileUpdated'));
      showToast('success', t('Success'), t('Avatar updated successfully!'));
    } catch (err) {
      showToast('error', t('Error'), err.response?.data?.message || t('Failed to upload avatar.'));
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    const token = localStorage.getItem('token');
    try {
      setAvatarUploading(true);
      await axios.delete('http://localhost:8080/api/v1/user/avatar', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(prev => ({ ...prev, avatarUrl: null, avatarPath: null }));
      const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: null }));
      window.dispatchEvent(new Event('userProfileUpdated'));
      showToast('success', t('Success'), t('Avatar removed successfully!'));
    } catch (err) {
      showToast('error', t('Error'), err.response?.data?.message || t('Failed to remove avatar.'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleInputChange = (e) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isChangingSubject = selectedSubjectId !== null && selectedSubjectId !== profile.currentSubjectId;
  const isSubjectChangeBlocked = isChangingSubject && !profile.canChangeSubject;

  const handleSave = async () => {
    if (isSubjectChangeBlocked) {
      showToast(
        'error',
        t('Specialty Locked'),
        profile.warningMessage || t('Subject locked: You have active teaching classes. Please complete or hand over classes before switching.')
      );
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const payload = {
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio,
        subjectId: selectedSubjectId ? Number(selectedSubjectId) : null
      };

      await axios.put('http://localhost:8080/api/v1/coach/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('coach_notification_preferences', JSON.stringify(preferences));
      showToast('success', t('Success'), t('Coach profile and specialty updated successfully!'));
      window.dispatchEvent(new Event('notificationUpdated'));
      await fetchCoachProfile();
    } catch (err) {
      console.error('Failed to update coach profile', err);
      showToast('error', t('Error'), err.response?.data?.message || t('Failed to update coach profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchCoachProfile();
    showToast('info', t('Notice'), t('Profile changes discarded.'));
  };

  // ==================== EMAIL UPDATE (OTP) ====================
  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError(t('Please enter a valid email address.'));
      return;
    }
    try {
      setEmailLoading(true);
      setEmailError('');
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/v1/user/email-change/send-otp', { newEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStep(2);
    } catch (err) {
      setEmailError(err.response?.data?.message || t('Failed to send verification OTP code.'));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setEmailLoading(true);
      setEmailError('');
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/v1/user/email-change/verify', { newEmail, otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailStep(3);
      showToast('success', t('Success'), t('Email updated successfully! Redirecting to login...'));
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2500);
    } catch (err) {
      setEmailError(err.response?.data?.message || t('Invalid or expired OTP code.'));
      setEmailLoading(false);
    }
  };

  // ==================== PASSWORD CHANGE ====================
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setPasswordError(t('Please fill in all password fields.'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError(t('New password must be at least 6 characters long.'));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('Confirm password does not match.'));
      return;
    }

    try {
      setSavingPassword(true);
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:8080/api/v1/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', t('Success'), t('Password updated successfully!'));
    } catch (err) {
      setPasswordError(err.response?.data?.message || t('Failed to update password. Please check your credentials.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const selectedSubjectObj = profile.availableSubjects?.find(
    s => s.subjectId === Number(selectedSubjectId)
  );

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'CH';

  const SIDEBAR_TABS = [
    {
      id: 'profile',
      label: t('Personal Profile'),
      description: t('Full name, contact info, and coach bio'),
      icon: User,
      tileColor: 'bg-[#0071E3]'
    },
    {
      id: 'specialty',
      label: t('Specialty & Subjects'),
      description: t('Teaching specialty and class constraints'),
      icon: BookOpen,
      tileColor: 'bg-gradient-to-tr from-amber-500 to-orange-400'
    },
    {
      id: 'security',
      label: t('Security & Login'),
      description: t('Email verification and password access'),
      icon: Lock,
      tileColor: 'bg-emerald-500'
    },
    {
      id: 'preferences',
      label: t('Teaching Preferences'),
      description: t('Schedule and attendance alert toggles'),
      icon: Bell,
      tileColor: 'bg-indigo-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[460px] gap-3">
        <RefreshCw className="w-8 h-8 text-[#0071E3] animate-spin" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-tight">
          {t('Loading coach settings...')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto pb-16 px-3 sm:px-6">

      {/* =========================================================================
          APPLE NAVIGATION TOP HEADER
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#0A84FF] text-[11px] font-semibold tracking-tight border border-[#0071E3]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('Verified Coach')}</span>
            </span>

            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />

            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium transition-all cursor-pointer active:scale-95"
              title={t('Click to copy ID')}
            >
              <span>{profile.userId ? `NX • COACH • 0${profile.userId}` : 'NX • COACH • PORTAL'}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-60" />}
            </button>

            {profile.currentSubjectName && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                  <Award className="w-3 h-3" />
                  <span>{profile.currentSubjectName}</span>
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('Coach Settings')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('Manage personal details, contact information, and teaching subject assignments.')}
          </p>
        </div>

        {/* Header Summary Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-xs text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 dark:text-slate-200">
              {profile.activeClassesCount} {t('Active Classes')}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          APPLE SPLIT-VIEW SYSTEM SETTINGS WINDOW FRAME
          ========================================================================= */}
      <div className="w-full rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-3xl border border-black/[0.08] dark:border-white/[0.1] shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">

        {/* -----------------------------------------------------------------------
            LEFT SIDEBAR: APPLE COACH ACCOUNT & CUPERTINO NAVIGATION
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 xl:col-span-3.5 bg-slate-50/80 dark:bg-slate-950/60 border-b lg:border-b-0 lg:border-r border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Apple Coach Identity Card */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs mb-5 flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-black/[0.08] dark:border-white/[0.1] flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-lg shadow-inner relative">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `http://localhost:8080${profile.avatarUrl}`}
                      alt={profile.fullName || 'Coach'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: profile.avatarUrl ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                    {initials}
                  </div>
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Camera upload floating trigger */}
                <label
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-md transition-transform active:scale-90 cursor-pointer"
                  title={t('Upload photo')}
                >
                  <Camera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={avatarUploading}
                  />
                </label>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {profile.fullName || t('Huấn luyện viên')}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile.email || 'coach@nexus.com'}
                </span>
                {profile.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarDelete}
                    disabled={avatarUploading}
                    className="text-[11px] text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer flex items-center gap-1 mt-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>{t('Remove photo')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cupertino Navigation List */}
            <div className="space-y-1">
              {SIDEBAR_TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:border-white/[0.06]'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg ${tab.tileColor} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold truncate leading-tight">
                          {tab.label}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                          {tab.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isActive ? 'text-[#0071E3] dark:text-[#0A84FF] translate-x-0.5' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar System Telemetry Footer */}
          <div className="pt-4 mt-6 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              NEXUS Coach Core v2.4
            </span>
            <span className="font-mono text-[10px]">ID: #{profile.userId || '00'}</span>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT MAIN PANE: ACTIVE SETTINGS SECTION
            ----------------------------------------------------------------------- */}
        <div className="lg:col-span-8 xl:col-span-8.5 p-5 sm:p-7 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col gap-6"
            >

              {/* ===================================================================
                  TAB 1: PERSONAL PROFILE (HỒ SƠ CÁ NHÂN)
                  =================================================================== */}
              {activeTab === 'profile' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {t('Personal Profile')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Update your legal name, contact phone, and professional bio displayed to trainees.')}
                    </p>
                  </div>

                  {/* Cupertino Grouped Card */}
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
                    {/* Full Name Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="sm:w-1/3">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {t('Full Legal Name')}
                        </label>
                        <p className="text-[11px] text-slate-400">{t('Display name on class rosters')}</p>
                      </div>
                      <div className="sm:w-2/3 relative">
                        <input
                          type="text"
                          name="fullName"
                          value={profile.fullName || ''}
                          onChange={handleInputChange}
                          placeholder={t('Enter coach full name')}
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs font-medium rounded-xl px-3.5 py-2.5 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Contact Phone Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="sm:w-1/3">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {t('Contact Phone Number')}
                        </label>
                        <p className="text-[11px] text-slate-400">{t('Member support hotline')}</p>
                      </div>
                      <div className="sm:w-2/3 relative">
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone || ''}
                          onChange={handleInputChange}
                          placeholder={t('Enter phone number')}
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs font-medium rounded-xl px-3.5 py-2.5 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all"
                        />
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {/* Bio / Coaching Philosophy Row */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="sm:w-1/3 pt-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {t('Bio & Coaching Experience')}
                        </label>
                        <p className="text-[11px] text-slate-400">{t('Certifications and style')}</p>
                      </div>
                      <div className="sm:w-2/3 relative">
                        <textarea
                          rows={4}
                          name="bio"
                          value={profile.bio || ''}
                          onChange={handleInputChange}
                          placeholder={t('Describe your coaching philosophy, certifications, and teaching background...')}
                          className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs font-medium rounded-xl p-3 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all resize-y"
                        />
                        <span className="text-[10px] text-slate-400 flex justify-end mt-1">
                          {(profile.bio || '').length} / 500 {t('characters')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Profile Telemetry Mini Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-black/[0.05] dark:border-white/[0.06] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('Specialty Subject')}</span>
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {profile.currentSubjectName || t('Chưa gán')}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-black/[0.05] dark:border-white/[0.06] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('Active Classes')}</span>
                        <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {profile.activeClassesCount} {t('lớp')}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-black/[0.05] dark:border-white/[0.06] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">{t('Authorization')}</span>
                        <strong className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {t('Verified Coach')}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  TAB 2: SPECIALTY & SUBJECTS (CHUYÊN MÔN & BỘ MÔN)
                  =================================================================== */}
              {activeTab === 'specialty' && (
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {t('Specialty & Subjects')}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('Select your primary coaching subject and inspect teaching capacity rules.')}
                      </p>
                    </div>

                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-[11px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-black/[0.04] dark:border-white/[0.06]">
                      {t('System Constraint Rules')}
                    </span>
                  </div>

                  {/* System Constraint Banner (Apple Callout) */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    profile.canChangeSubject
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}>
                    <div className="flex items-start gap-3">
                      {profile.canChangeSubject ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex flex-col gap-1 text-xs">
                        <strong className="font-bold text-sm">
                          {profile.canChangeSubject
                            ? t('Eligible to Switch')
                            : t('Specialty Locked')}
                        </strong>
                        <p className="leading-relaxed opacity-90">
                          {profile.canChangeSubject ? (
                            t('Eligible to switch: You currently have no ongoing classes in this subject.')
                          ) : (
                            <>
                              {t('Subject locked: You have active teaching classes. Please complete or hand over classes before switching.')}{' '}
                              <strong>({profile.activeClassesCount} {t('lớp')}: {profile.activeClassNames?.join(', ') || ''})</strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Apple Interactive Subject Selection Grid */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>{t('Select Teaching Subject')}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {t('Subjects automatically synced from gym system')}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {profile.availableSubjects && profile.availableSubjects.length > 0 ? (
                        profile.availableSubjects.map((sub) => {
                          const isSelected = Number(selectedSubjectId) === sub.subjectId;
                          const isCurrent = sub.subjectId === profile.currentSubjectId;

                          return (
                            <button
                              key={sub.subjectId}
                              type="button"
                              onClick={() => setSelectedSubjectId(sub.subjectId)}
                              className={`p-4 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between gap-3 relative cursor-pointer active:scale-[0.98] ${
                                isSelected
                                  ? 'bg-[#0071E3]/10 border-[#0071E3] shadow-sm'
                                  : 'bg-white/80 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border-black/[0.06] dark:border-white/[0.08]'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'bg-[#0071E3] text-white shadow-xs'
                                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'
                                  }`}>
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                      {sub.subjectName}
                                    </h4>
                                    {isCurrent && (
                                      <span className="text-[10px] text-amber-500 font-semibold">
                                        • {t('Current Assigned')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'border-[#0071E3] bg-[#0071E3] text-white'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {sub.description || t('Standard training curriculum at Sports Center.')}
                              </p>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-2 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-400">
                          {t('No subjects registered on system.')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================================================================
                  TAB 3: SECURITY & LOGIN (BẢO MẬT & ĐĂNG NHẬP)
                  =================================================================== */}
              {activeTab === 'security' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {t('Security & Login')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Manage your sign-in email address and update your account password.')}
                    </p>
                  </div>

                  {/* Email Section */}
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-xs p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {t('Login Email Address')}
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            {profile.email || 'coach@nexus.com'}
                          </p>
                        </div>
                      </div>

                      {!showEmailModal && (
                        <button
                          type="button"
                          onClick={() => { setShowEmailModal(true); setEmailStep(1); }}
                          className="px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-xs font-semibold text-[#0071E3] dark:text-[#0A84FF] transition-all cursor-pointer active:scale-95"
                        >
                          {t('Change Email')}
                        </button>
                      )}
                    </div>

                    {/* Inline Apple OTP Flow */}
                    {showEmailModal ? (
                      <div className="mt-4 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[#0071E3]/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
                            {t('Verify New Login Email')}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setShowEmailModal(false); setEmailStep(1); }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {emailError && (
                          <div className="text-xs text-rose-600 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                            {emailError}
                          </div>
                        )}

                        {emailStep === 1 && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder={t('Enter new email address...')}
                              className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3]"
                            />
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={emailLoading || !newEmail}
                              className="px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shrink-0 active:scale-95"
                            >
                              {emailLoading ? t('Sending...') : t('Send OTP Code')}
                            </button>
                          </div>
                        )}

                        {emailStep === 2 && (
                          <div className="flex flex-col gap-2.5">
                            <p className="text-xs text-slate-500">
                              {t('Enter 6-digit verification OTP sent to')} <strong>{newEmail}</strong>
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full sm:w-48 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center tracking-widest text-base font-bold rounded-xl px-3.5 py-2 border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:border-[#0071E3]"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={emailLoading || otp.length < 6}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer shrink-0 active:scale-95"
                              >
                                {emailLoading ? t('Verifying...') : t('Verify & Update Email')}
                              </button>
                            </div>
                          </div>
                        )}

                        {emailStep === 3 && (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold p-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t('Email updated successfully! Redirecting to login...')}</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Change Password Group */}
                  <form onSubmit={handlePasswordChange} className="rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-xs p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          {t('Change Account Password')}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {t('Ensure your account uses a strong, unique password.')}
                        </p>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="text-xs text-rose-600 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                        {passwordError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Current Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {t('Current Password')}
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder={t('Enter current password')}
                            className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {t('New Password')}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder={t('Enter new password')}
                            className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {t('Confirm New Password')}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder={t('Confirm new password')}
                            className="w-full bg-black/[0.03] dark:bg-white/[0.05] text-slate-900 dark:text-white text-xs rounded-xl px-3 py-2.5 border border-black/[0.06] dark:border-white/[0.08] focus:outline-none focus:border-[#0071E3]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={savingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                        className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        {savingPassword && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{savingPassword ? t('Updating...') : t('Update Password')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===================================================================
                  TAB 4: TEACHING PREFERENCES (TÙY CHỌN THÔNG BÁO)
                  =================================================================== */}
              {activeTab === 'preferences' && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {t('Teaching Preferences')}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {t('Configure how you receive session alerts, check-in updates, and evaluation notices.')}
                    </p>
                  </div>

                  {/* Cupertino Grouped Card with iOS Toggle Switches */}
                  <div className="rounded-2xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border border-black/[0.06] dark:border-white/[0.08] shadow-xs divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden">
                    
                    {/* Toggle 1: Class Schedule Reminders */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#0A84FF] flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t('Class Schedule Reminders')}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('Receive notifications for upcoming classes and schedule adjustments')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.scheduleReminders}
                          onChange={() => handleTogglePreference('scheduleReminders')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0071E3]" />
                      </label>
                    </div>

                    {/* Toggle 2: Attendance & Check-in Alerts */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t('Attendance & Check-in Alerts')}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('Alert when trainees scan at front desk or miss class check-in')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.attendanceAlerts}
                          onChange={() => handleTogglePreference('attendanceAlerts')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0071E3]" />
                      </label>
                    </div>

                    {/* Toggle 3: Student Assessment Reminders */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t('Student Assessment Reminders')}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('Remind to evaluate trainee progress after completed training sessions')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.assessmentReminders}
                          onChange={() => handleTogglePreference('assessmentReminders')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0071E3]" />
                      </label>
                    </div>

                    {/* Toggle 4: System & Security Notices */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {t('System & Security Notices')}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t('Important updates regarding gym facilities and account access')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={preferences.systemNotices}
                          onChange={() => handleTogglePreference('systemNotices')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0071E3]" />
                      </label>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ===================================================================
              APPLE BOTTOM ACTION BAR (STICKY DOCK)
              =================================================================== */}
          <div className="mt-8 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 hidden sm:flex">
              <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>{t('All changes are encrypted and safely stored in the NEXUS system.')}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
              >
                {t('Discard Changes')}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || isSubjectChangeBlocked}
                className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-xs ${
                  isSubjectChangeBlocked
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-blue-500/20'
                }`}
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? t('Saving...') : t('Save Settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          APPLE DYNAMIC ISLAND TOAST NOTIFICATION
          ========================================================================= */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border border-black/[0.08] dark:border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.12)] max-w-sm ${
          toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-600'
            : toast.type === 'error'
              ? 'bg-rose-500/10 text-rose-600'
              : 'bg-[#0071E3]/10 text-[#0071E3]'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </div>
        <div className="flex flex-col text-xs pr-2 min-w-0">
          <strong className="font-semibold text-slate-900 dark:text-white truncate">
            {toast.title || (toast.type === 'success' ? t('Success') : t('Notice'))}
          </strong>
          <span className="text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {toast.message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoachSettings;
