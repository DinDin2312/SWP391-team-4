import { t, useLanguage } from '../../i18n/useLanguage';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  isDestructive = true,
  icon: CustomIcon
}) {
  useLanguage();
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", duration: 0.28, bounce: 0 }}
            className="relative bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-2xl w-full max-w-md p-6 overflow-hidden z-10"
          >
            {/* Background glowing orb */}
            <div className={`absolute -top-20 -right-20 w-44 h-44 rounded-full blur-3xl opacity-15 pointer-events-none ${isDestructive ? 'bg-red-500' : 'bg-primary'}`} />

            <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isDestructive ? 'bg-red-500/10 text-red-500 ring-4 ring-red-500/5' : 'bg-primary/10 text-primary ring-4 ring-primary/5'}`}>
                {CustomIcon ? <CustomIcon className="w-6 h-6" /> : (isDestructive ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-lg font-extrabold text-[var(--text)] tracking-tight mb-1.5">{t(title)}</h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {t(message)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
              >
                {t(cancelText)}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-95 cursor-pointer ${
                  isDestructive 
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/25 hover:shadow-red-500/40' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25 hover:shadow-blue-500/40'
                }`}
              >
                {t(confirmText)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
