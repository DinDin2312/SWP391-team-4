import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Send, X, Users, School, User, Bell, CheckCircle2, AlertCircle, Loader2, MessageSquare, Layers
} from 'lucide-react';

const SendNotificationModal = ({ isOpen, onClose, initialTargetType = 'ALL', initialStudent = null, initialClassId = null, onSuccess }) => {
  useLanguage();
  const [targetType, setTargetType] = useState(initialTargetType);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId || '');
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudent ? initialStudent.userId : '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('COACH');

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTargetType(initialTargetType);
      const studentId = initialStudent ? (typeof initialStudent === 'object' ? initialStudent.userId : initialStudent) : '';
      const classId = initialClassId || '';

      setSelectedClassId(classId);
      setSelectedStudentId(studentId);
      setErrorMsg('');
      setSuccessMsg('');
      fetchModalData(classId, studentId);
    }
  }, [isOpen, initialTargetType, initialStudent, initialClassId]);

  const fetchModalData = async (currentClassId, currentStudentId) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [classRes, studentRes] = await Promise.all([
        axios.get('http://localhost:8080/api/v1/coach/classes', { headers }),
        axios.get('http://localhost:8080/api/v1/coach/students', { headers })
      ]);

      const fetchedClasses = classRes.data || [];
      const fetchedStudents = studentRes.data || [];

      setClasses(fetchedClasses);
      setStudents(fetchedStudents);

      if (fetchedClasses.length > 0 && !currentClassId) {
        setSelectedClassId(fetchedClasses[0].classId);
      }
      if (fetchedStudents.length > 0 && !currentStudentId) {
        setSelectedStudentId(fetchedStudents[0].userId);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu cho modal thông báo:', err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề thông báo.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Vui lòng nhập nội dung thông báo.');
      return;
    }
    if (targetType === 'CLASS' && !selectedClassId) {
      setErrorMsg('Vui lòng chọn lớp học.');
      return;
    }
    if (targetType === 'INDIVIDUAL' && !selectedStudentId) {
      setErrorMsg('Vui lòng chọn học viên.');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const payload = {
        targetType,
        classId: targetType === 'CLASS' ? Number(selectedClassId) : null,
        recipientUserId: targetType === 'INDIVIDUAL' ? Number(selectedStudentId) : null,
        title: title.trim(),
        message: message.trim(),
        type: notificationType
      };

      const response = await axios.post(
        'http://localhost:8080/api/v1/coach/notifications/send',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMsg(response.data?.message || 'Gửi thông báo thành công!');

      setTimeout(() => {
        setTitle('');
        setMessage('');
        setSuccessMsg('');
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi gửi thông báo:', err);
      const serverErr = err.response?.data?.message || err.response?.data || 'Không thể gửi thông báo. Vui lòng thử lại sau.';
      setErrorMsg(typeof serverErr === 'string' ? serverErr : 'Đã có lỗi xảy ra.');
    } finally {
      setSending(false);
    }
  };

  // Compute recipient summary text
  const getRecipientSummary = () => {
    if (targetType === 'ALL') {
      return `Gửi chung cho toàn bộ ${students.length} học viên của bạn.`;
    }
    if (targetType === 'CLASS') {
      const cls = classes.find(c => String(c.classId) === String(selectedClassId));
      return cls ? `Gửi tới ${cls.enrolledCount} học viên đăng ký lớp "${cls.className}".` : 'Gửi cho lớp được chọn.';
    }
    if (targetType === 'INDIVIDUAL') {
      const st = students.find(s => String(s.userId) === String(selectedStudentId));
      return st ? `Gửi riêng cho học viên ${st.fullName} (${st.email || 'No email'}).` : 'Gửi cho 1 học viên cụ thể.';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto transition-colors">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[var(--surface)] via-[var(--surface-hover)] to-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">{t("Gửi Thông Báo Cho Học Viên")}</h3>
              <p className="text-xs text-[var(--text-muted)]">{t("Tạo & truyền tải thông báo trực tiếp đến học viên")}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-5 text-xs overflow-y-auto max-h-[80vh]">

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{t(errorMsg)}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Recipient Scope Selection */}
          <div className="space-y-2">
            <label className="block text-[var(--text)] font-bold uppercase tracking-wider text-[11px]">{t("1. Phạm vi người nhận thông báo")}</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType('ALL')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'ALL'
                  ? 'bg-blue-600/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-md shadow-blue-500/10'
                  : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] hover:border-slate-400 dark:hover:border-slate-600 hover:text-[var(--text)]'
                  }`}
              >
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-center text-[11px]">{t("Tất cả học viên")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('CLASS')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'CLASS'
                  ? 'bg-blue-600/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-md shadow-blue-500/10'
                  : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] hover:border-slate-400 dark:hover:border-slate-600 hover:text-[var(--text)]'
                  }`}
              >
                <School className="w-5 h-5 text-emerald-500" />
                <span className="text-center text-[11px]">{t("Theo lớp học")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('INDIVIDUAL')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${targetType === 'INDIVIDUAL'
                  ? 'bg-blue-600/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-md shadow-blue-500/10'
                  : 'bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-muted)] hover:border-slate-400 dark:hover:border-slate-600 hover:text-[var(--text)]'
                  }`}
              >
                <User className="w-5 h-5 text-amber-500" />
                <span className="text-center text-[11px]">{t("Học viên cá nhân")}</span>
              </button>
            </div>
          </div>

          {/* Conditional Input: Select Class */}
          {targetType === 'CLASS' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-[var(--text-muted)] font-semibold">{t("Chọn lớp học:")}</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {classes.length === 0 ? (
                  <option value="">{t("-- Chưa có lớp học nào --")}</option>
                ) : (
                  classes.map((cls) => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className} ({cls.enrolledCount}{' '}{t("học viên | Phòng:")}{' '}{cls.roomName})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Conditional Input: Select Individual Student */}
          {targetType === 'INDIVIDUAL' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-[var(--text-muted)] font-semibold">{t("Chọn học viên nhận thông báo:")}</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {students.length === 0 ? (
                  <option value="">{t("-- Chưa có học viên nào --")}</option>
                ) : (
                  students.map((st) => (
                    <option key={st.userId} value={st.userId}>
                      {st.fullName} - {st.email || st.phone || `ID #${st.userId}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* 2. Notification Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-[var(--text)] font-bold uppercase tracking-wider text-[11px]">{t("Loại thông báo")}</label>
              <select
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="COACH">{t("💬 Lời nhắn HLV")}</option>
                <option value="ANNOUNCEMENT">{t("📢 Thông báo chung")}</option>
                <option value="SCHEDULE">{t("📅 Nhắc lịch học")}</option>
                <option value="URGENT">{t("⚠️ Thông báo khẩn")}</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-[var(--text)] font-bold uppercase tracking-wider text-[11px]">{t("Tiêu đề thông báo")}<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("VD: Thay đổi lịch tập tuần tới / Nhắc nhở bài tập...")}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* 3. Notification Message Content */}
          <div className="space-y-1.5">
            <label className="block text-[var(--text)] font-bold uppercase tracking-wider text-[11px]">{t("Nội dung thông báo")}<span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("Nhập nội dung chi tiết muốn truyền tải tới học viên...")}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 resize-none leading-relaxed transition-all"
            />
          </div>

          {/* Summary Preview Banner */}
          <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>{t(getRecipientSummary())}</span>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--border)] hover:bg-[var(--border)] text-[var(--text)] font-semibold text-xs transition-all cursor-pointer"
            >{t("Hủy")}</button>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("Đang gửi...")}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t("Gửi thông báo")}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SendNotificationModal;