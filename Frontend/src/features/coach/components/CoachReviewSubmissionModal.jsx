import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Video,
  ExternalLink,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Send
} from 'lucide-react';
import { coachService } from '../services/coachService';
import { t, useLanguage } from '../../../i18n/useLanguage';

const CoachReviewSubmissionModal = ({
  isOpen,
  onClose,
  submission,
  onReviewSuccess
}) => {
  useLanguage();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState('APPROVED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && submission) {
      setFeedback(submission.coachFeedback || '');
      setRating(submission.rating || 5);
      setStatus(submission.status && submission.status !== 'SUBMITTED' ? submission.status : 'APPROVED');
      setError('');
    }
  }, [isOpen, submission]);

  if (!isOpen || !submission) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!feedback || !feedback.trim()) {
      setError(t('Vui lòng nhập lời nhận xét hoặc góp ý cho học viên.'));
      return;
    }

    try {
      setLoading(true);
      const payload = {
        coachFeedback: feedback.trim(),
        rating: rating,
        status: status
      };

      await coachService.submitFeedback(submission.submissionId, payload);
      if (onReviewSuccess) {
        onReviewSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Lỗi khi lưu nhận xét bài nộp:', err);
      setError(err?.response?.data?.message || err.message || t('Đã xảy ra lỗi khi gửi đánh giá.'));
    } finally {
      setLoading(false);
    }
  };

  const exerciseTitle = submission.exerciseName || submission.planTitle || t('Bài tập thực hành');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-[var(--shadow)] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-[var(--primary)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <span>{t('Đánh Giá Bài Nộp Học Viên')}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold border border-amber-500/20">
                  {t('Huấn luyện viên')}
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                {exerciseTitle} {submission.className ? `• ${t('Class:')} ${submission.className}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Card */}
          <div className="p-4 rounded-xl bg-[var(--surface-hover)]/70 border border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold flex items-center justify-center text-sm border border-[var(--primary)]/20">
                {submission.studentName ? submission.studentName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">{submission.studentName || t('Học viên')}</p>
                <p className="text-xs text-[var(--text-muted)]">{submission.studentEmail || ''}</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('vi-VN') : ''}</span>
            </div>
          </div>

          {/* Video External Link Button */}
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span>{t('Video thực hành của học viên')}</span>
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {t('Xem toàn màn hình trên tab mới')}
              </span>
            </div>

            {submission.videoUrl ? (
              <a
                href={submission.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span className="line-clamp-1">{t('Mở xem video bài nộp')}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">{t('Học viên chưa đính kèm link video.')}</p>
            )}
          </div>

          {/* Student Note */}
          {submission.studentNote && (
            <div className="p-3.5 rounded-xl bg-[var(--surface-hover)]/40 border border-[var(--border)] text-xs space-y-1">
              <p className="font-bold text-[var(--text-muted)] text-[11px]">
                {t('Ghi chú / Cảm nhận của học viên:')}
              </p>
              <p className="text-[var(--text)] italic leading-relaxed whitespace-pre-wrap">
                "{submission.studentNote}"
              </p>
            </div>
          )}

          {/* Review Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Status Selection */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-2">
                {t('Trạng thái đánh giá')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('APPROVED')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'APPROVED'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('Đạt chuẩn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('REVIEWED')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'REVIEWED'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{t('Góp ý')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('REVISION_REQUESTED')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    status === 'REVISION_REQUESTED'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{t('Tập lại')}</span>
                </button>
              </div>
            </div>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                {t('Chấm điểm kỹ thuật (1 - 5 sao)')}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-[var(--text)] ml-2">
                  {rating} / 5 {t('sao')}
                </span>
              </div>
            </div>

            {/* Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                {t('Nhận xét chuyên môn & Góp ý kỹ thuật')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('Ví dụ: Sải tay vươn đều, tư thế thân người thẳng. Cần chú ý thở ra đều dưới nước...')}
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
                required
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] text-xs font-bold transition-all cursor-pointer"
              >
                {t('Hủy bỏ')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] hover:opacity-90 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? t('Đang lưu...') : t('Gửi nhận xét cho học viên')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoachReviewSubmissionModal;

