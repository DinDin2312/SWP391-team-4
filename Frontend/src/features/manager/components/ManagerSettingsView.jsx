import React, { useState, useEffect, useContext } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import axiosClient from '../../../services/axiosClient';
import { AuthContext } from '../../../context/AuthContext';
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
  Check,
  Activity,
  Layers,
  Shield,
  Sliders,
  Database,
  Award,
} from 'lucide-react';

export default function ManagerSettingsView() {
  useLanguage();
  const { userInfo, updateUserInfo } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'privileges'

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
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const [avatarUploading, setAvatarUploading] = useState(false);

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
      console.error('Error fetching manager profile:', err);
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Unable to load profile.'),
      });
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
      setProfileFeedback({ type: 'error', message: t('Avatar image must be 2MB or smaller.') });
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
      setProfileFeedback({ type: 'success', message: t('Avatar updated successfully!') });
      setTimeout(() => setProfileFeedback(null), 3000);
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Failed to upload avatar.'),
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  // Handle Avatar Removal
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
      setProfileFeedback({ type: 'success', message: t('Avatar removed successfully!') });
      setTimeout(() => setProfileFeedback(null), 3000);
    } catch (err) {
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Failed to remove avatar.'),
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!profileData.fullName.trim()) {
      setProfileFeedback({ type: 'error', message: t('Please enter your full name.') });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await axiosClient.put('/v1/user/profile', {
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim(),
        bio: profileData.bio.trim(),
      });

      setProfileFeedback({
        type: 'success',
        message: res?.message || t('Profile updated successfully!'),
      });

      if (updateUserInfo) {
        updateUserInfo({
          ...userInfo,
          fullName: profileData.fullName.trim(),
          phone: profileData.phone.trim(),
        });
      }

      setTimeout(() => setProfileFeedback(null), 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Error saving profile.'),
      });
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

      setPasswordFeedback({
        type: 'success',
        message: res?.message || t('Password changed successfully!'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordFeedback(null), 4000);
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

  const fullName = profileData.fullName || userInfo?.fullName || 'Center Manager';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Password rules validation
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto flex flex-col gap-6 text-[var(--text)]">
      {/* Enterprise Header Banner */}
      <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with Upload Badge */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-black text-2xl flex items-center justify-center shadow-inner relative">
              {profileData.avatarUrl ? (
                <img
                  src={
                    profileData.avatarUrl.startsWith('http')
                      ? profileData.avatarUrl
                      : `http://localhost:8080${profileData.avatarUrl}`
                  }
                  alt={fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                style={{ display: profileData.avatarUrl ? 'none' : 'flex' }}
                className="w-full h-full items-center justify-center select-none"
              >
                {initials}
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <label
              className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-[var(--primary)] text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
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

          {/* User Details */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">{fullName}</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('Center Manager')}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success-hover,#10b981)]"></span>
                <span>{t('Level 5 Full Access')}</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{profileData.email || userInfo?.email || 'admin@sport.com'}</span>
              <span className="text-[var(--border)]">•</span>
              <span>UID #{profileData.userId || userInfo?.userId || '1'}</span>
            </p>
            {profileData.avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={avatarUploading}
                className="text-[11px] text-[var(--danger-text,#ef4444)] hover:underline mt-1.5 cursor-pointer flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('Remove photo')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Refresh Profile Trigger */}
        <button
          type="button"
          onClick={fetchProfile}
          disabled={profileLoading}
          className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-all flex items-center gap-2 cursor-pointer self-start md:self-center shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${profileLoading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>{t('Refresh Profile')}</span>
        </button>
      </div>

      {/* Enterprise Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'profile'
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft)] shadow-xs'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{t('Personal Profile')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'security'
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft)] shadow-xs'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{t('Security & Password')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privileges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'privileges'
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-soft)] shadow-xs'
              : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{t('Role Privileges & Authority')}</span>
        </button>
      </div>

      {/* ================= TAB 1: PROFILE INFORMATION ================= */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">{t('General Information')}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('Update your administrator display name, contact phone, and administrative notes.')}
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            </div>

            {profileFeedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                  profileFeedback.type === 'success'
                    ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#047857)] border border-[var(--success-soft,#a7f3d0)]'
                    : 'bg-[var(--danger-soft,#fef2f2)] text-[var(--danger-text,#b91c1c)] border border-[var(--danger-soft,#fecaca)]'
                }`}
              >
                {profileFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Full Name')} <span className="text-[var(--danger-text,#ef4444)]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    placeholder={t('Enter full name')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[var(--text)]">
                    {t('Primary Email Address')}
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                    <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                    <span>{t('Managed by System')}</span>
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={profileData.email}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text-muted)] cursor-not-allowed select-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Phone Number')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder={t('e.g. 0901234567')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Bio & Operational Responsibilities')}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder={t('Specialties, direct escalation contact, or manager office hours...')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className={`w-4 h-4 ${savingProfile ? 'animate-spin' : ''}`} />
                  <span>{savingProfile ? t('Saving Changes...') : t('Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Sidecard */}
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  {t('Administrative Status')}
                </h3>
              </div>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">{t('Account Status')}</span>
                  <span className="font-bold text-[var(--success-text,#10b981)] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--success-text,#10b981)]"></span>
                    <span>{t('Active')}</span>
                  </span>
                </li>
                <li className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">{t('Clearance Tier')}</span>
                  <span className="font-bold text-[var(--primary)]">Level 5 (Admin)</span>
                </li>
                <li className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                  <span className="text-[var(--text-muted)]">{t('System Audit Scope')}</span>
                  <span className="font-bold text-[var(--text)]">{t('Full Center')}</span>
                </li>
                <li className="flex items-center justify-between py-1.5">
                  <span className="text-[var(--text-muted)]">{t('Multi-Branch ID')}</span>
                  <span className="font-bold text-[var(--text)]">NEXUS-01-HCM</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-xs text-[var(--text)] space-y-2">
              <h4 className="font-bold flex items-center gap-1.5 text-[var(--primary)]">
                <ShieldCheck className="w-4 h-4" />
                <span>{t('Security Notice')}</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                {t(
                  'As Center Manager, updates to your administrative profile are automatically logged in the System Audit Trail for enterprise accountability.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SECURITY & PASSWORD ================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">{t('Change Administrator Password')}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('Ensure your account uses a strong, complex passphrase to safeguard center operations.')}
                </p>
              </div>
              <KeyRound className="w-4 h-4 text-[var(--primary)]" />
            </div>

            {passwordFeedback && (
              <div
                className={`mb-5 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                  passwordFeedback.type === 'success'
                    ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#047857)] border border-[var(--success-soft,#a7f3d0)]'
                    : 'bg-[var(--danger-soft,#fef2f2)] text-[var(--danger-text,#b91c1c)] border border-[var(--danger-soft,#fecaca)]'
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
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Current Password')} <span className="text-[var(--danger-text,#ef4444)]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t('Enter current password')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('New Password')} <span className="text-[var(--danger-text,#ef4444)]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('Enter new password (min. 6 characters)')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Confirm New Password')} <span className="text-[var(--danger-text,#ef4444)]">*</span>
                </label>
                <div className="relative">
                  <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('Confirm your new password')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className={`w-4 h-4 ${changingPassword ? 'animate-spin' : ''}`} />
                  <span>{changingPassword ? t('Updating Password...') : t('Update Password')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password Strength Requirements */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  {t('Password Security Standard')}
                </h3>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-4">
                {t('Administrative passphrases must fulfill the enterprise security baseline before activation.')}
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      hasMinLength
                        ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#10b981)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={hasMinLength ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {t('Minimum 6 characters')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      hasLetter
                        ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#10b981)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={hasLetter ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {t('Contains alphabet letters (A-Z, a-z)')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      hasNumber
                        ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#10b981)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={hasNumber ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {t('Contains at least one number (0-9)')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      passwordsMatch
                        ? 'bg-[var(--success-soft,#ecfdf5)] text-[var(--success-text,#10b981)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span className={passwordsMatch ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {t('Confirm password matches new password')}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
              {t('Tip: Use a memorable passphrase or password manager. Never share manager credentials.')}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ROLE PRIVILEGES & AUTHORITY ================= */}
      {activeTab === 'privileges' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">
                  {t('Center Manager RBAC Governance Matrix')}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t(
                    'Pre-authorized privileges assigned to the Center Manager role in the Nexus Sports Lab system.'
                  )}
                </p>
              </div>
              <Activity className="w-4 h-4 text-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pillar 1 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <User className="w-4 h-4" />
                  <span>{t('Staff & RBAC Control')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Create, activate, deactivate, or assign system roles to Receptionists, Coaches, and administrative staff members.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Full Grant')}
                  </span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>{t('Membership Plans & Pricing')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Author and publish Gym Access, AI Access, and Combo packages with customized durations and pricing tiers.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Full Grant')}
                  </span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <Sliders className="w-4 h-4" />
                  <span>{t('Facility Operations')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Supervise subjects, training rooms, capacity caps, teaching slots, and coach schedule assignments across the 3 floors.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Full Grant')}
                  </span>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <Database className="w-4 h-4" />
                  <span>{t('Financial & Revenue Audits')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Comprehensive date-range financial reporting, cashflow analysis, payment transactions, and invoice ledger oversight.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Full Grant')}
                  </span>
                </div>
              </div>

              {/* Pillar 5 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('Escalations & Credit Passes')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Sole authority to review escalated cancellation appeals, approve credit passes, and adjudicate member refunds.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Exclusive Authority')}
                  </span>
                </div>
              </div>

              {/* Pillar 6 */}
              <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                  <FileText className="w-4 h-4" />
                  <span>{t('System Audit Log Inspection')}</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t(
                    'Immutable change tracking recording timestamped IP addresses, user actions, and security state modifications.'
                  )}
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[var(--success-text,#10b981)] uppercase tracking-wider">
                    {t('Read & Audit')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
