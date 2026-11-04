import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Video,
  ExternalLink,
  MessageSquare,
  Star,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { memberService } from '../services/memberService';
import { t, useLanguage } from '../../../i18n/useLanguage';

const SubmitWorkoutModal = ({
  isOpen,
  onClose,
  workoutPlan,
  exercise,
  existingSubmission = null,
  onSubmissionSuccess
}) => {
  useLanguage();
  const [videoUrl, setVideoUrl] = useState('');
  const [studentNote, setStudentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingSubmission) {
        setVideoUrl(existingSubmission.videoUrl || '');
        setStudentNote(existingSubmission.studentNote || '');
        setIsEditing(false);
      } else {
        setVideoUrl('');
        setStudentNote('');
        setIsEditing(true);
      }
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, existingSubmission]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!videoUrl || !videoUrl.trim()) {
      setError(t('Vui lòng nhập đường dẫn video bài tập của bạn.'));
      return;
    }

    try {
      setLoading(true);
      const planId = workoutPlan?.planId;
      if (!planId) {
        throw new Error(t('Không tìm thấy mã giáo án.'));
      }

      const payload = {
        detailId: exercise?.detailId || null,
        videoUrl: videoUrl.trim(),
        studentNote: studentNote.trim() || null
      };

      await memberService.submitWorkout(planId, payload);
      setSuccessMsg(t('Nộp bài tập thành công! HLV sẽ sớm xem và nhận xét cho bạn.'));
      setIsEditing(false);
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (err) {
      console.error('Lỗi khi nộp bài tập:', err);
      setError(err?.response?.data?.message || err.message || t('Đã xảy ra lỗi khi nộp bài.'));
    } finally {
      setLoading(false);
    }
  };

  const exerciseTitle = exercise?.exerciseName || workoutPlan?.title || t('Bài tập thực hành');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-[var(--shadow)] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-[var(--primary)]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <span>{t('Nộp Bài Tập / Video')}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold border border-blue-500/20">
                  {t('Học viên')}
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">{exerciseTitle}</p>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Existing Coach Feedback if any */}
          {existingSubmission && !isEditing && (
            <div className="p-4 rounded-xl bg-[var(--surface-hover)]/80 border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{t('Trạng thái đánh giá từ HLV')}</span>
                </span>

                {existingSubmission.status === 'APPROVED' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('Đạt chuẩn')}
                  </span>
                )}
                {existingSubmission.status === 'REVISION_REQUESTED' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('Cần tập lại')}
                  </span>
                )}
                {existingSubmission.status === 'REVIEWED' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t('Đã nhận xét')}
                  </span>
                )}
                {existingSubmission.status === 'SUBMITTED' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {t('Chờ HLV xem')}
                  </span>
                )}
              </div>

              {existingSubmission.rating && (
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= existingSubmission.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold ml-1.5 text-[var(--text)]">
                    {existingSubmission.rating} / 5
                  </span>
                </div>
              )}

              {existingSubmission.coachFeedback && (
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] space-y-1">
                  <p className="font-semibold text-blue-500 flex items-center gap-1 text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{t('Lời nhận xét từ HLV:')}</span>
                  </p>
                  <p className="leading-relaxed whitespace-pre-wrap">{existingSubmission.coachFeedback}</p>
                </div>
              )}

              {/* Submitted Video URL with Direct Link */}
              {existingSubmission.videoUrl && (
                <div className="pt-1">
                  <a
                    href={existingSubmission.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-xs transition-all border border-blue-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>{t('Mở xem lại video đã nộp')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-[color:var(--on-primary)] text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('Nộp lại bài tập mới')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Submission Form */}
          {(!existingSubmission || isEditing) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Đường dẫn Video bài tập (Google Drive, YouTube, TikTok, v.v.)')} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... hoặc https://drive.google.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all pr-10"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                    <Video className="w-4 h-4" />
                  </div>
                </div>

                {/* Direct Link Verification Button */}
                {videoUrl && videoUrl.trim() && (
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {t('Hãy đảm bảo video đã được mở quyền xem (Công khai hoặc Bất kỳ ai có đường liên kết).')}
                    </p>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold transition-all shrink-0 border border-blue-500/20"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{t('Mở liên kết để kiểm tra')}</span>
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                  {t('Ghi chú / Cảm nhận của bạn khi tập')}
                </label>
                <textarea
                  rows={3}
                  value={studentNote}
                  onChange={(e) => setStudentNote(e.target.value)}
                  placeholder={t('Ví dụ: Em hoàn thành 3 hiệp, hiệp cuối hơi mỏi cổ tay, nhờ HLV xem giúp tư thế...')}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-xs focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {existingSubmission && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Quay lại xem nhận xét')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[color:var(--on-primary)] hover:opacity-90 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? t('Đang gửi bài...') : t('Gửi bài tập cho HLV')}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitWorkoutModal;

