import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, BookOpen, AlertTriangle, CheckCircle,
  Award, FileText, Save, X, RefreshCw, Camera, Trash2, AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';

const CoachSettings = () => {
  useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });

  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('error', t("Avatar image must be 2MB or smaller."));
      return;
    }
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      setAvatarUploading(true);
      const res = await axios.post('http://localhost:8080/api/v1/user/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      const newUrl = res.data.avatarUrl;
      setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
      const savedInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...savedInfo, avatarUrl: newUrl }));
      window.dispatchEvent(new Event('userProfileUpdated'));
      showToast('success', t("Avatar updated successfully!"));
    } catch (err) {
      showToast('error', err.response?.data?.message || t("Failed to upload avatar."));
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
      showToast('success', t("Avatar removed successfully!"));
    } catch (err) {
      showToast('error', err.response?.data?.message || t("Failed to remove avatar."));
    } finally {
      setAvatarUploading(false);
    }
  };


  // Coach Profile Data
  const [profile, setProfile] = useState({
    userId: null,
    fullName: '',
    email: '',
    phone: '',
    bio: '',
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

  // Email Update States (matching user settings OTP flow)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailStep, setEmailStep] = useState(1);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

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
      showToast('error', err.response?.data?.message || 'Không thể tải thông tin hồ sơ huấn luyện viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachProfile();
  }, []);

  const showToast = (type, message) => {
    setToast({ visible: true, type, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4500);
  };

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const isChangingSubject = selectedSubjectId !== null && selectedSubjectId !== profile.currentSubjectId;
  const isSubjectChangeBlocked = isChangingSubject && !profile.canChangeSubject;

  const handleSave = async () => {
    if (isSubjectChangeBlocked) {
      showToast('error', profile.warningMessage || 'Bạn không thể đổi bộ môn vì vẫn còn lớp học đang phụ trách!');
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

      showToast('success', t('Cập nhật thông tin và chuyên môn thành công!'));
      window.dispatchEvent(new Event('notificationUpdated'));
      // Reload profile to refresh constraint counters and names
      await fetchCoachProfile();
    } catch (err) {
      console.error('Failed to update coach profile', err);
      showToast('error', err.response?.data?.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    fetchCoachProfile();
  };

  // ==================== EMAIL UPDATE (OTP) ====================
  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError('Vui lòng nhập địa chỉ email hợp lệ.');
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
      setEmailError(err.response?.data?.message || 'Không thể gửi mã OTP xác nhận');
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
      showToast('success', 'Email đã được cập nhật thành công!');
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 2500);
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn');
      setEmailLoading(false);
    }
  };

  const selectedSubjectObj = profile.availableSubjects?.find(
    s => s.subjectId === Number(selectedSubjectId)
  );

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'HL';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-80 gap-3">
        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <span className="text-sm font-semibold text-[var(--text-muted)]">{t("Đang tải thông tin cài đặt huấn luyện viên...")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] text-[var(--primary)] uppercase tracking-wider font-extrabold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {t("Coach Profile & Specialty")}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></span>
            <span className="text-[11px] text-[var(--text-muted)] font-bold">
              {profile.userId ? `ID: COACH-${profile.userId}` : 'COACH-PORTAL'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
            {t("Cài đặt tài khoản & Chuyên môn")}
          </h1>
          <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
            {t("Quản lý thông tin cá nhân, liên hệ và điều chỉnh bộ môn giảng dạy được phân công.")}
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Summary Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[var(--primary-soft)] blur-2xl pointer-events-none"></div>

            {/* Avatar Circle */}
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--primary-soft)] border-2 border-[var(--primary)] text-[var(--primary)] text-3xl font-black flex items-center justify-center shadow-lg relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `http://localhost:8080${profile.avatarUrl}`}
                    alt={profile.fullName || 'Coach'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div style={{ display: profile.avatarUrl ? 'none' : 'flex' }} className="w-full h-full items-center justify-center">
                  {initials}
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label
                className="absolute -bottom-2 -right-2 p-2 rounded-full bg-[var(--primary)] text-white shadow-md hover:scale-110 transition-transform cursor-pointer"
                title={t("Upload photo")}
              >
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/png,image/jpeg" onChange={handleAvatarUpload} className="hidden" disabled={avatarUploading} />
              </label>
            </div>

            {profile.avatarUrl && (
              <button
                type="button"
                onClick={handleAvatarDelete}
                disabled={avatarUploading}
                className="text-xs text-[var(--danger-text,#ef4444)] hover:underline mb-3 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t("Remove photo")}</span>
              </button>
            )}

            {/* Verified Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[11px] font-bold tracking-wider mb-2 border border-[var(--primary-soft)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t("VERIFIED COACH")}</span>
            </div>

            <h3 className="text-xl font-extrabold text-[var(--text)]">{profile.fullName || t("Huấn luyện viên")}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-4">{profile.email}</p>

            {/* Mini Telemetry Strip */}
            <div className="w-full grid grid-cols-2 gap-2 p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-left">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Bộ môn hiện tại")}</span>
                <span className="text-sm font-extrabold text-[var(--primary)] truncate" title={profile.currentSubjectName || 'Chưa gán'}>
                  {profile.currentSubjectName || t("Chưa gán")}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t("Lớp đang dạy")}</span>
                <span className={`text-sm font-extrabold flex items-center gap-1 ${profile.activeClassesCount > 0 ? 'text-[var(--warning-text)]' : 'text-[var(--success-text)]'}`}>
                  {profile.activeClassesCount} {t("lớp")}
                </span>
              </div>
            </div>

            {/* Status explanation */}
            <div className="mt-4 w-full p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] text-left">
              <div className="flex items-start gap-2">
                {profile.canChangeSubject ? (
                  <CheckCircle className="w-4 h-4 text-[var(--success-text)] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[var(--warning-text)] shrink-0 mt-0.5" />
                )}
                <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {profile.canChangeSubject ? (
                    <span className="text-[var(--success-text)] font-semibold">
                      {t("Đủ điều kiện đổi môn: Hiện tại bạn không có lớp học nào đang hoạt động thuộc môn này.")}
                    </span>
                  ) : (
                    <span className="text-[var(--warning-text)] font-semibold">
                      {t("Đang bị khóa đổi môn: Bạn đang có lớp học giảng dạy dở. Vui lòng kết thúc hoặc bàn giao lớp.")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Forms */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* CARD 1: Chuyên môn & Đổi bộ môn (Coach Specialty Section) */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">{t("Bộ môn giảng dạy (Specialty Subject)")}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{t("Lựa chọn bộ môn bạn trực tiếp tham gia giảng dạy và mở lớp.")}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]">
                {t("Ràng buộc hệ thống")}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Current subject display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">{t("Bộ môn hiện tại:")}</span>
                  <span className="px-3 py-1 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs border border-[var(--primary-soft)]">
                    {profile.currentSubjectName || t("Chưa thiết lập")}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <span>{t("Số lớp đang phụ trách:")}</span>
                  <strong className={profile.activeClassesCount > 0 ? "text-[var(--warning-text)]" : "text-[var(--success-text)]"}>
                    {profile.activeClassesCount} {t("lớp")}
                  </strong>
                </div>
              </div>

              {/* Subject Selection Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text)] flex items-center justify-between">
                  <span>{t("Chọn bộ môn mới")}</span>
                  <span className="text-[11px] font-normal text-[var(--text-muted)]">
                    {t("Danh sách tải tự động từ hệ thống")}
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedSubjectId || ''}
                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                    className="w-full bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-xl px-4 py-3 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                  >
                    {profile.availableSubjects && profile.availableSubjects.length > 0 ? (
                      profile.availableSubjects.map((sub) => (
                        <option key={sub.subjectId} value={sub.subjectId} className="bg-[var(--surface)] text-[var(--text)]">
                          {sub.subjectName} {sub.subjectId === profile.currentSubjectId ? `(${t("Hiện tại")})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">{t("Không có bộ môn nào trên hệ thống")}</option>
                    )}
                  </select>
                </div>

                {selectedSubjectObj && (
                  <p className="text-xs text-[var(--text-muted)] italic px-1 mt-0.5">
                    {selectedSubjectObj.description || t("Môn học tiêu chuẩn của trung tâm.")}
                  </p>
                )}
              </div>

              {/* Dynamic Live Constraint Status */}
              {isChangingSubject && (
                <div className={`p-4 rounded-xl border transition-all ${
                  profile.canChangeSubject
                    ? 'bg-[var(--success-soft)] border-[var(--success-hover)] text-[var(--success-text)]'
                    : 'bg-[var(--rose-soft)] border-[var(--rose)] text-[var(--rose)]'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {profile.canChangeSubject ? (
                      <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col gap-1 text-xs">
                      <strong className="font-bold text-sm">
                        {profile.canChangeSubject
                          ? t("Đủ điều kiện chuyển đổi bộ môn")
                          : t("Không thể chuyển đổi bộ môn!")}
                      </strong>
                      <p className="leading-relaxed">
                        {profile.canChangeSubject ? (
                          t("Bạn không có lớp học nào đang diễn ra thuộc môn hiện tại. Bạn có thể nhấn 'Lưu thay đổi' để cập nhật môn mới.")
                        ) : (
                          <>
                            {t("Bạn đang có")}{' '}
                            <strong className="underline font-bold">
                              {profile.activeClassesCount} {t("lớp học đang phụ trách")}
                            </strong>
                            {profile.activeClassNames && profile.activeClassNames.length > 0 && (
                              <span> ({profile.activeClassNames.join(', ')})</span>
                            )}
                            .{' '}
                            {t("Chỉ được phép đổi bộ môn khi bạn đã hoàn thành hoặc bàn giao toàn bộ các lớp học này cho HLV khác.")}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: Personal Details Form */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">{t("Thông tin cá nhân & Liên hệ")}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{t("Cập nhật họ tên, số điện thoại và tiểu sử hiển thị.")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Full Legal Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text)]">{t("Họ và tên")}</label>
                <div className="relative">
                  <input
                    name="fullName"
                    value={profile.fullName || ''}
                    onChange={handleInputChange}
                    className="w-full bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-xl px-4 py-3 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all"
                    type="text"
                    placeholder={t("Nhập họ và tên huấn luyện viên")}
                  />
                  <User className="w-4 h-4 absolute right-3.5 top-3.5 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Linked Email Address with OTP change modal */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[var(--text)]">{t("Địa chỉ Email đăng nhập")}</label>
                  {!showEmailModal && (
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="text-xs text-[var(--primary)] font-bold hover:underline"
                    >
                      {t("Đổi Email")}
                    </button>
                  )}
                </div>

                {showEmailModal ? (
                  <div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--primary)] flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[var(--primary)]" />
                        {t("Cập nhật Email đăng nhập mới")}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setShowEmailModal(false); setEmailStep(1); }}
                        className="text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {emailError && (
                      <div className="text-xs text-[var(--rose)] bg-[var(--rose-soft)] p-2 rounded-lg">
                        {emailError}
                      </div>
                    )}

                    {emailStep === 1 && (
                      <>
                        <input
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder={t("Nhập địa chỉ email mới...")}
                          className="w-full bg-[var(--surface)] text-[var(--text)] text-sm rounded-lg px-3 py-2 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                          type="email"
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={emailLoading || !newEmail}
                          className="w-full py-2 rounded-lg bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {emailLoading ? t("Đang gửi...") : t("Gửi mã OTP xác nhận")}
                        </button>
                      </>
                    )}

                    {emailStep === 2 && (
                      <>
                        <p className="text-xs text-[var(--text-muted)]">
                          {t("Nhập mã OTP 6 chữ số đã được gửi tới")} <strong>{newEmail}</strong>
                        </p>
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="000000"
                          maxLength={6}
                          className="w-full bg-[var(--surface)] text-[var(--text)] text-center tracking-widest text-lg font-bold rounded-lg px-3 py-2 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                          type="text"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={emailLoading || otp.length < 6}
                          className="w-full py-2 rounded-lg bg-[var(--success-hover)] text-white text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {emailLoading ? t("Đang xác nhận...") : t("Xác nhận & Cập nhật")}
                        </button>
                      </>
                    )}

                    {emailStep === 3 && (
                      <div className="flex flex-col items-center justify-center p-3 text-center gap-1">
                        <CheckCircle className="w-8 h-8 text-[var(--success-text)]" />
                        <span className="text-xs font-bold text-[var(--text)]">{t("Email đã được cập nhật thành công!")}</span>
                        <span className="text-[11px] text-[var(--text-muted)]">{t("Đang chuyển hướng về trang đăng nhập...")}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={profile.email || ''}
                      disabled
                      className="w-full bg-[var(--bg)] text-[var(--text-muted)] text-sm font-medium rounded-xl px-4 py-3 border border-[var(--border)] cursor-not-allowed opacity-80"
                      type="email"
                    />
                    <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                )}
                <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
                  {t("Đổi email cần xác thực qua mã OTP và hệ thống sẽ tự động đăng xuất để bảo mật.")}
                </p>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text)]">{t("Số điện thoại liên hệ")}</label>
                <div className="relative">
                  <input
                    name="phone"
                    value={profile.phone || ''}
                    onChange={handleInputChange}
                    className="w-full bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-xl px-4 py-3 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all"
                    type="tel"
                    placeholder={t("Nhập số điện thoại")}
                  />
                  <Phone className="w-4 h-4 absolute right-3.5 top-3.5 text-[var(--text-muted)] pointer-events-none" />
                </div>
              </div>

              {/* Bio / Tiểu sử chuyên môn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text)]">{t("Tiểu sử & Kinh nghiệm huấn luyện")}</label>
                <div className="relative">
                  <textarea
                    name="bio"
                    rows={4}
                    value={profile.bio || ''}
                    onChange={handleInputChange}
                    className="w-full bg-[var(--bg)] text-[var(--text)] text-sm font-medium rounded-xl p-3.5 border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all resize-y"
                    placeholder={t("Mô tả kinh nghiệm, chứng chỉ chuyên môn và phong cách giảng dạy của bạn...")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-20 w-full p-4 rounded-2xl bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] hidden sm:flex">
          <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          <span>{t("Dữ liệu hồ sơ huấn luyện viên được lưu trữ bảo mật trên hệ thống NEXUS.")}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--surface-hover)] text-[var(--text)] hover:bg-[var(--border)] transition-all text-xs font-semibold cursor-pointer"
          >
            {t("Hủy bỏ")}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isSubjectChangeBlocked}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              isSubjectChangeBlocked
                ? 'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
                : 'bg-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] text-[color:var(--on-primary)] active:scale-95'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? t("Đang lưu...") : t("Lưu thay đổi")}</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-20 right-6 z-50 transform transition-all duration-300 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'
        } ${
          toast.type === 'success'
            ? 'bg-[var(--surface)] border-[var(--success-hover)] text-[var(--text)]'
            : 'bg-[var(--surface)] border-[var(--rose)] text-[var(--rose)]'
        }`}
      >
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0">
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-[var(--success-text)]" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[var(--rose)]" />
          )}
        </div>
        <div className="flex flex-col text-xs pr-2">
          <strong className="font-bold">
            {toast.type === 'success' ? t("Thành công") : t("Thông báo")}
          </strong>
          <span className="text-[var(--text-muted)] mt-0.5">{toast.message}</span>
        </div>
      </div>
    </div>
  );
};

export default CoachSettings;
