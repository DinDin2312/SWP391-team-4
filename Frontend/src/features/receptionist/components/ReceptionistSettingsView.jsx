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
  Sparkles,
  FileText,
} from 'lucide-react';

const ReceptionistSettingsView = () => {
  useLanguage();
  const { userInfo, updateUserInfo } = useContext(AuthContext);

  // Profile Form State
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    userId: null,
    fullName: '',
    email: '',
    phone: '',
    bio: '',
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
        });
      }
    } catch (err) {
      console.error('Error fetching receptionist profile:', err);
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Không thể tải thông tin hồ sơ lễ tân.'),
      });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!profileData.fullName.trim()) {
      setProfileFeedback({ type: 'error', message: t('Vui lòng nhập họ và tên.') });
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
        message: res?.message || t('Cập nhật thông tin thành công!'),
      });

      // Update auth context if method exists
      if (updateUserInfo) {
        updateUserInfo({
          ...userInfo,
          fullName: profileData.fullName.trim(),
          phone: profileData.phone.trim(),
        });
      }

      setTimeout(() => {
        setProfileFeedback(null);
      }, 4000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Có lỗi xảy ra khi lưu thông tin.'),
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
      setPasswordFeedback({ type: 'error', message: t('Vui lòng nhập mật khẩu hiện tại.') });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: t('Mật khẩu mới phải có ít nhất 6 ký tự.') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: t('Mật khẩu xác nhận không khớp.') });
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
        message: res?.message || t('Đổi mật khẩu thành công!'),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setPasswordFeedback(null);
      }, 4000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordFeedback({
        type: 'error',
        message: err.response?.data?.message || t('Mật khẩu hiện tại không chính xác hoặc có lỗi xảy ra.'),
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const fullName = profileData.fullName || userInfo?.fullName || 'Lễ Tân Thúy Kiều';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[var(--text)]">{fullName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-soft)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{t('Front Desk Staff')}</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {profileData.email || userInfo?.email || 'receptionist@sport.com'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchProfile}
          disabled={profileLoading}
          className="px-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-all flex items-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${profileLoading ? 'animate-spin text-[var(--primary)]' : ''}`} />
          <span>{t('Làm mới')}</span>
        </button>
      </div>

      {profileLoading ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 text-xs text-[var(--text-muted)]">
          <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>{t('Đang tải thông tin cài đặt...')}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ===================== CARD 1: THÔNG TIN CÁ NHÂN ===================== */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <User className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--text)]">{t('Thông tin cá nhân')}</h3>
            </div>

            {profileFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  profileFeedback.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
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

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Họ và tên')} *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    required
                    placeholder={t('Nhập họ và tên')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-muted)]">{t('Email đăng nhập')}</label>
                  <span className="text-[10px] text-[var(--text-muted)]">{t('(Chỉ xem - bảo mật)')}</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)] cursor-not-allowed opacity-80"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Số điện thoại')}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder={t('0901 234 567')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] font-semibold placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              {/* Bio / Ghi chú ca trực */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Ghi chú ca trực / Giới thiệu')}</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    placeholder={t('Ví dụ: Trực ca sáng quầy lễ tân A...')}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingProfile}
                className="mt-2 w-full py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {savingProfile ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savingProfile ? t('Đang lưu...') : t('Lưu thay đổi')}</span>
              </button>
            </form>
          </div>

          {/* ===================== CARD 2: BẢO MẬT & ĐỔI MẬT KHẨU ===================== */}
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
              <Lock className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--text)]">{t('Bảo mật & Đổi mật khẩu')}</h3>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
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

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Mật khẩu hiện tại')} *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder={t('Nhập mật khẩu đang dùng')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Mật khẩu mới')} *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder={t('Tối thiểu 6 ký tự')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-muted)]">{t('Xác nhận mật khẩu mới')} *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder={t('Nhập lại mật khẩu mới')}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
                <span>{t('Nên sử dụng mật khẩu mạnh bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn quầy lễ tân.')}</span>
              </div>

              {/* Change Password Button */}
              <button
                type="submit"
                disabled={changingPassword}
                className="mt-1 w-full py-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary)] text-[var(--text)] hover:text-[color:var(--on-primary)] font-bold text-xs flex items-center justify-center gap-2 border border-[var(--border)] hover:border-[var(--primary)] transition-all cursor-pointer disabled:opacity-50"
              >
                {changingPassword ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>{changingPassword ? t('Đang cập nhật...') : t('Cập nhật mật khẩu')}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistSettingsView;
