import React, { useState, useEffect } from 'react';
import {
  X,
  Scale,
  Activity,
  Flame,
  Dumbbell,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { memberService } from '../services/memberService';

const SelfAssessmentModal = ({ isOpen, onClose, onSuccess }) => {
  useLanguage();

  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    bodyFatPercentage: '',
    muscleMass: '',
    feedbackNote: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  // Real-time BMI calculation
  const weightNum = parseFloat(formData.weight);
  const heightNum = parseFloat(formData.height);
  let bmi = null;
  let bmiLabel = '';
  let bmiColor = '';

  if (weightNum > 0 && heightNum > 0) {
    const hMeters = heightNum / 100;
    bmi = (weightNum / (hMeters * hMeters)).toFixed(1);
    if (bmi < 18.5) {
      bmiLabel = t('Underweight');
      bmiColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    } else if (bmi >= 18.5 && bmi < 23) {
      bmiLabel = t('Normal Weight');
      bmiColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    } else if (bmi >= 23 && bmi < 25) {
      bmiLabel = t('Overweight');
      bmiColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    } else {
      bmiLabel = t('Needs Fat Loss');
      bmiColor = 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.weight || isNaN(formData.weight) || Number(formData.weight) <= 0) {
      setErrorMsg(t('Please enter a valid weight (kg)'));
      return;
    }
    if (!formData.height || isNaN(formData.height) || Number(formData.height) <= 0) {
      setErrorMsg(t('Please enter a valid height (cm)'));
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        weight: Number(formData.weight),
        height: Number(formData.height),
        bodyFatPercentage: formData.bodyFatPercentage ? Number(formData.bodyFatPercentage) : null,
        muscleMass: formData.muscleMass ? Number(formData.muscleMass) : null,
        feedbackNote: formData.feedbackNote.trim() || t('Self-recorded InBody metrics.')
      };

      await memberService.createSelfAssessment(payload);
      setSuccessMsg(t('Body metrics updated successfully!'));

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error saving self-assessment:', err);
      setErrorMsg(err.response?.data?.message || t('Failed to save metrics. Please try again!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text)]">
                {t('Update Personal InBody Metrics')}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('Enter your real measurements to track physical progress')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Core Metrics: Weight & Height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Weight */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{t('Weight (kg)')} <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="68.5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] text-sm font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-bold pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('Height (cm)')} <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="250"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="175"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] text-sm font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-bold pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>

          {/* Real-time BMI Display Card */}
          {bmi && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-amber-500/10 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-[var(--text)]">{t('Estimated BMI:')}</span>
                <span className="text-base font-black text-[var(--text)]">{bmi}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${bmiColor}`}>
                {bmiLabel}
              </span>
            </div>
          )}

          {/* Secondary InBody Metrics: Body Fat & Muscle Mass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Body Fat */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('Body Fat (% Fat)')}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">({t('Optional')})</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="3"
                  max="60"
                  name="bodyFatPercentage"
                  value={formData.bodyFatPercentage}
                  onChange={handleChange}
                  placeholder="16.5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] text-sm font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-bold pointer-events-none">
                  %
                </span>
              </div>
            </div>

            {/* Muscle Mass */}
            <div>
              <label className="block text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('Muscle Mass (kg)')}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">({t('Optional')})</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="150"
                  name="muscleMass"
                  value={formData.muscleMass}
                  onChange={handleChange}
                  placeholder="33.2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] text-sm font-semibold text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-bold pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Note / Goal */}
          <div>
            <label className="block text-xs font-bold text-[var(--text)] mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('Personal Goal / Note')}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal">({t('Optional')})</span>
            </label>
            <textarea
              name="feedbackNote"
              rows={2}
              value={formData.feedbackNote}
              onChange={handleChange}
              placeholder={t('e.g. Weighed after morning workout, goal to lose 1kg fat this month...')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-hover)]/60 border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--border)] transition-colors cursor-pointer"
            >
              {t('Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('Saving...')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('Save InBody Metrics')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SelfAssessmentModal;
