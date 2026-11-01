import React, { useState, useEffect, useRef } from 'react';
import { t, useLanguage } from '../../../i18n/useLanguage';
import { memberService } from '../services/memberService';
import {
  HEALTH_CONDITIONS,
  PARQ_QUESTIONS,
  calcAge,
  visibleConditions,
} from '../healthProfileUtils';
import {
  Activity,
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Save,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function HealthProfileSection({ initialProfile = null }) {
  const currentLang = useLanguage();
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [gender, setGender] = useState(initialProfile?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialProfile?.dateOfBirth || '');
  const [parq, setParq] = useState(
    Array.isArray(initialProfile?.parq) && initialProfile.parq.length === 7
      ? initialProfile.parq
      : [false, false, false, false, false, false, false]
  );
  const [conditions, setConditions] = useState(initialProfile?.conditions || []);
  const [notes, setNotes] = useState(initialProfile?.notes || '');
  const [consent, setConsent] = useState(Boolean(initialProfile?.consentAt || initialProfile?.consent));
  const [hasExistingProfile, setHasExistingProfile] = useState(Boolean(initialProfile?.completed));

  // Field-level error messages
  const [errors, setErrors] = useState({ gender: null, dateOfBirth: null, consent: null });
  const [bottomError, setBottomError] = useState(null);

  // Element refs for smooth scrolling & auto-focus
  const genderSectionRef = useRef(null);
  const dobInputRef = useRef(null);
  const consentSectionRef = useRef(null);

  useEffect(() => {
    if (initialProfile) return;

    let isMounted = true;
    async function fetchHealthProfile() {
      try {
        setLoading(true);
        const res = await memberService.getHealthProfile();
        if (!isMounted) return;
        const data = res?.data || res;
        if (data) {
          if (data.gender) setGender(data.gender);
          if (data.dateOfBirth) setDateOfBirth(data.dateOfBirth);
          if (Array.isArray(data.parq) && data.parq.length === 7) {
            setParq(data.parq);
          }
          if (Array.isArray(data.conditions)) {
            setConditions(data.conditions);
          }
          if (data.notes) setNotes(data.notes);
          if (data.consentAt) setConsent(true);
          if (data.completed) setHasExistingProfile(true);
        }
      } catch (err) {
        // If 404 or empty profile, ignore error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHealthProfile();
    return () => { isMounted = false; };
  }, [initialProfile]);

  const age = calcAge(dateOfBirth);
  const isParqFlagged = parq.some(Boolean);
  const availableConditions = visibleConditions(gender);

  const validateField = (field, value) => {
    if (field === 'gender') {
      if (!value) return t('Please select a gender.');
      return null;
    }
    if (field === 'dateOfBirth') {
      if (!value) return t('Please select your date of birth.');
      const computedAge = calcAge(value);
      if (computedAge == null) return t('Invalid date of birth (members must be 12 to 100 years old).');
      if (computedAge < 12) return t('Member must be at least 12 years old.');
      if (computedAge > 100) return t('Invalid date of birth (members must be 12 to 100 years old).');
      return null;
    }
    if (field === 'consent') {
      if (!value) return t('Please consent to the health data sharing terms.');
      return null;
    }
    return null;
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setErrors(prev => ({ ...prev, gender: null }));
    setBottomError(null);
    if (newGender === 'MALE' && conditions.includes('PREGNANCY')) {
      setConditions(conditions.filter(c => c !== 'PREGNANCY'));
    }
  };

  const handleDobChange = (newDob) => {
    setDateOfBirth(newDob);
    const err = validateField('dateOfBirth', newDob);
    setErrors(prev => ({ ...prev, dateOfBirth: err }));
    setBottomError(null);
  };

  const handleConsentChange = (newConsent) => {
    setConsent(newConsent);
    setErrors(prev => ({
      ...prev,
      consent: newConsent ? null : t('Please consent to the health data sharing terms.')
    }));
    setBottomError(null);
  };

  const handleParqToggle = (index, value) => {
    const updated = [...parq];
    updated[index] = value;
    setParq(updated);
  };

  const handleConditionToggle = (code) => {
    if (conditions.includes(code)) {
      setConditions(conditions.filter(c => c !== code));
    } else {
      setConditions([...conditions, code]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const genderErr = validateField('gender', gender);
    const dobErr = validateField('dateOfBirth', dateOfBirth);
    const consentErr = validateField('consent', consent);

    const newErrors = { gender: genderErr, dateOfBirth: dobErr, consent: consentErr };
    setErrors(newErrors);

    if (genderErr || dobErr || consentErr) {
      const firstErrorMsg = genderErr || dobErr || consentErr;
      setBottomError(firstErrorMsg);
      setToast({ type: 'error', text: firstErrorMsg });

      // Auto smooth scroll directly to the first invalid field and focus it!
      if (genderErr && genderSectionRef.current) {
        genderSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (dobErr && dobInputRef.current) {
        dobInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        dobInputRef.current.focus?.();
      } else if (consentErr && consentSectionRef.current) {
        consentSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setSaving(true);
      setBottomError(null);
      const payload = {
        gender,
        dateOfBirth,
        parq,
        conditions,
        notes: notes.trim(),
        consent: true
      };
      await memberService.saveHealthProfile(payload);
      setHasExistingProfile(true);
      setToast({ type: 'success', text: t('Health profile saved successfully!') });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || t('Unable to save health profile. Please try again.');
      setBottomError(msg);
      setToast({ type: 'error', text: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      await memberService.withdrawHealthProfile();
      setHasExistingProfile(false);
      setParq([false, false, false, false, false, false, false]);
      setConditions([]);
      setNotes('');
      setConsent(false);
      setShowWithdrawModal(false);
      setBottomError(null);
      setErrors({ gender: null, dateOfBirth: null, consent: null });
      setToast({ type: 'success', text: t('Health data has been withdrawn and deleted.') });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      const msg = err.response?.data?.message || t('Error withdrawing data.');
      setToast({ type: 'error', text: msg });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <Activity className="w-6 h-6 animate-spin text-[#0071E3] mr-2" />
        <span>{t('Loading health profile...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FLOATING NOTIFICATION TOAST (Always in view regardless of scroll position) */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] sm:w-96 p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold leading-snug">{toast.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-xs opacity-70 hover:opacity-100 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-blue-500/5 to-transparent border border-teal-500/20">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {t('Health & Physiology Profile')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              {t('Complete your health profile so Coaches and AI can tailor safe workouts for you.')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: DEMOGRAPHICS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1E293B]/70 border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <Calendar className="w-4 h-4 text-[#0071E3]" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {t('Demographics & Physiology')}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Gender selection */}
            <div ref={genderSectionRef}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                {t('Gender')} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'MALE', label: t('Male') },
                  { value: 'FEMALE', label: t('Female') },
                  { value: 'OTHER', label: t('Other') },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleGenderChange(item.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      gender === item.value
                        ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-xs font-semibold'
                        : errors.gender
                        ? 'border-rose-500/50 bg-rose-500/5 text-slate-600 dark:text-slate-300 hover:bg-rose-500/10'
                        : 'border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.gender}</span>
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('Date of birth')} <span className="text-rose-500">*</span>
                </label>
                {age != null && !errors.dateOfBirth && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-[#0071E3]">
                    {t('Age')}: {age}
                  </span>
                )}
              </div>
              <input
                ref={dobInputRef}
                type="date"
                value={dateOfBirth}
                onChange={(e) => handleDobChange(e.target.value)}
                onBlur={() => {
                  const err = validateField('dateOfBirth', dateOfBirth);
                  setErrors(prev => ({ ...prev, dateOfBirth: err }));
                }}
                max={new Date().toISOString().slice(0, 10)}
                className={`w-full px-3.5 py-2 rounded-xl text-xs sm:text-sm border transition-all ${
                  errors.dateOfBirth
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/30 bg-rose-500/5 text-slate-800 dark:text-white'
                    : 'border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="text-[11px] text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.dateOfBirth}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: PAR-Q */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1E293B]/70 border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                {t('Physical Activity Readiness Questionnaire (PAR-Q)')}
              </h4>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('Answer 7 international screening questions to detect any exercise-related risks.')}
          </p>

          {/* Yellow warning banner if any PAR-Q answered YES */}
          {isParqFlagged && (
            <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                {t('Warning: PAR-Q indicates you should consult a doctor before starting vigorous exercise.')}
              </span>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {PARQ_QUESTIONS.map((q) => {
              const isYes = parq[q.index] === true;
              return (
                <div key={q.index} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700 dark:text-slate-200 flex-1 pr-2">
                    <span className="font-semibold mr-1.5">{q.index + 1}.</span>
                    {currentLang === 'vi' ? q.vi : q.en}
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleParqToggle(q.index, false)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        !isYes
                          ? 'bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 font-semibold'
                          : 'border-slate-200 dark:border-white/[0.1] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {t('No')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleParqToggle(q.index, true)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                        isYes
                          ? 'bg-amber-500 text-white border-amber-500 font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-white/[0.1] text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {t('Yes')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: CONDITIONS & INJURIES */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1E293B]/70 border border-slate-200 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center gap-2.5 mb-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              {t('Pre-existing Medical Conditions & Injuries')}
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {t('Select conditions that apply to you so exercises can be filtered.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
            {availableConditions.map((cond) => {
              const selected = conditions.includes(cond.code);
              return (
                <button
                  key={cond.code}
                  type="button"
                  onClick={() => handleConditionToggle(cond.code)}
                  className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                    selected
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{currentLang === 'vi' ? cond.vi : cond.en}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 ml-1.5" />}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {t('Specific notes / Pre-existing injuries')}
              </label>
              <span className={`text-[11px] font-mono ${notes.length > 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                {notes.length}/500
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={3}
              placeholder={t('Describe specific injuries or doctor advice (max 500 characters)...')}
              className="w-full p-3 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-black/20 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
          </div>
        </div>

        {/* SECTION 4: CONSENT DISCLAIMER (ND 13/2023) */}
        <div
          ref={consentSectionRef}
          className={`p-4 rounded-xl border text-xs transition-all ${
            errors.consent
              ? 'border-rose-500/50 bg-rose-500/10'
              : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08]'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => handleConsentChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-[#0071E3] focus:ring-[#0071E3]"
            />
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-white block mb-0.5">
                {t('Consent & Privacy (Decree 13/2023/ND-CP)')}
              </span>
              {t('I agree to share my physiological and health data with NEXUS Coaches and AI solely for workout personalization and exercise safety.')}
            </div>
          </label>
          {errors.consent && (
            <p className="text-[11px] text-rose-500 font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.consent}</span>
            </p>
          )}
        </div>

        {/* BOTTOM ERROR BANNER (Immediately visible above submit button) */}
        {bottomError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bottomError}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {hasExistingProfile ? (
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('Withdraw Health Data')}</span>
            </button>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              saving
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm active:scale-95'
            }`}
          >
            {saving ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? t('Saving...') : t('Save Health Profile')}</span>
          </button>
        </div>
      </form>

      {/* WITHDRAW CONFIRMATION MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/[0.1] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-white">
                {t('Withdraw Health Data')}
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('Are you sure you want to withdraw and delete your health data?')}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                disabled={withdrawing}
                onClick={handleWithdraw}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {withdrawing && <Activity className="w-3.5 h-3.5 animate-spin" />}
                <span>{withdrawing ? t('Deleting...') : t('Confirm Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
