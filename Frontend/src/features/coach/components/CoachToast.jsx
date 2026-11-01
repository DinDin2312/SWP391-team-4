import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, CalendarSync,
  Sparkles, X, ChevronRight, Clock
} from 'lucide-react';
import { t } from '../../../i18n/useLanguage';

/**
 * CoachToast - Apple Dynamic Island style animated floating toast for Coach Portal
 *
 * @param {boolean} isOpen - Visibility state
 * @param {Function} onClose - Callback triggered upon closing
 * @param {('success'|'error'|'info'|'reschedule')} type - Variant styling
 * @param {string} title - Header title
 * @param {string} message - Descriptive notification message
 * @param {string} [actionLabel] - Optional call-to-action button label
 * @param {Function} [onAction] - Action callback when CTA button clicked
 * @param {number} [duration=5000] - Auto-dismiss timeout in ms
 * @param {React.ReactNode} [icon] - Custom icon override
 */
const CoachToast = ({
  isOpen,
  onClose,
  type = 'success',
  title = '',
  message = '',
  actionLabel = '',
  onAction = null,
  duration = 5000,
  icon = null
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  const renderIcon = () => {
    if (icon) return icon;
    if (type === 'error') return <AlertCircle className="w-5 h-5" />;
    if (type === 'reschedule') return <CalendarSync className="w-5 h-5" />;
    if (type === 'info') return <Sparkles className="w-5 h-5" />;
    return <CheckCircle2 className="w-5 h-5" />;
  };

  const isReschedule = type === 'reschedule' || (type === 'success' && Boolean(actionLabel));

  const borderGlowClass = type === 'error'
    ? 'border-rose-500/30 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(244,63,94,0.18)]'
    : type === 'info'
      ? 'border-blue-500/30 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(59,130,246,0.18)]'
      : isReschedule
        ? 'border-emerald-500/40 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/20'
        : 'border-emerald-500/30 text-slate-900 dark:text-white shadow-[0_20px_50px_rgba(16,185,129,0.18)]';

  const iconPillClass = type === 'error'
    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
    : type === 'info'
      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
      : isReschedule
        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';

  const titleColorClass = type === 'error'
    ? 'text-rose-600 dark:text-rose-400'
    : type === 'info'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const progressBarClass = type === 'error'
    ? 'bg-rose-500'
    : type === 'info'
      ? 'bg-blue-500'
      : 'bg-emerald-500';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed top-6 z-[100] pointer-events-none flex justify-center px-4 transition-[left] duration-200 ease-out"
          style={{
            left: 'var(--role-sidebar-width, 0px)',
            right: 0,
          }}
        >
          <motion.div
            initial={{ y: -50, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={`pointer-events-auto w-full max-w-lg rounded-2xl overflow-hidden backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 border ${borderGlowClass} transition-all`}
          >
            <div className="p-4 sm:p-4.5 flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconPillClass}`}>
                {renderIcon()}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${titleColorClass}`}>
                    {title || (type === 'error' ? t('Notification') : t('Success'))}
                  </h4>
                  {isReschedule && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{t('Pending Approval')}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-200 mt-1">
                  {message}
                </p>

                {actionLabel && (
                  <button
                    type="button"
                    onClick={() => {
                      onAction && onAction();
                      onClose && onClose();
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-xs group"
                  >
                    <span>{actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                aria-label={t('Close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Laser Progress Bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <motion.div
                key={title + message}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                className={`h-full ${progressBarClass}`}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CoachToast;
