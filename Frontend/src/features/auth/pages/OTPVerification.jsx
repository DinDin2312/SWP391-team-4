import { t, useLanguage } from '../../../i18n/useLanguage';
import { setLanguage } from '../../../i18n/languageStore';
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw, 
  Check, 
  X, 
  Mail, 
  Dumbbell, 
  Globe, 
  Clock, 
  ShieldCheck, 
  Edit3 
} from 'lucide-react';

export default function OTPVerification() {
  const currentLang = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve email from route state or fallback to sessionStorage
  const initialEmail = location.state?.email || sessionStorage.getItem('nexus_pending_email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail);
  const [tempEmail, setTempEmail] = useState(initialEmail);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 5 minutes total OTP validity
  const [timeLeft, setTimeLeft] = useState(300);
  // 60 seconds cooldown for resend button
  const [resendCooldown, setResendCooldown] = useState(60);

  const inputRefs = useRef([]);

  // Timer for OTP validity
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Timer for Resend button cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [resendCooldown]);

  // Focus first input box on initial load
  useEffect(() => {
    if (inputRefs.current[0] && !isEditingEmail) {
      inputRefs.current[0].focus();
    }
  }, [isEditingEmail]);

  const toggleLanguage = () => {
    setLanguage(currentLang === 'en' ? 'vi' : 'en');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOtpChange = (e, index) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Always take the last digit entered
    val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto advance to next box
    if (val !== '' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);

      const nextFocusIndex = Math.min(pastedData.length, 5);
      if (inputRefs.current[nextFocusIndex]) {
        inputRefs.current[nextFocusIndex].focus();
      }
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    if (!email) {
      setToastMessage({ type: 'error', text: t('Please enter a valid email address.') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      setResending(true);
      await authService.resendOtp(email);
      setTimeLeft(300); // Reset OTP expiration to 5 mins
      setResendCooldown(60); // Reset cooldown to 60s
      setOtp(['', '', '', '', '', '']); // Clear input boxes
      if (inputRefs.current[0]) inputRefs.current[0].focus();

      setToastMessage({ type: 'success', text: t('A new OTP code has been sent to your email.') });
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data || t('Failed to resend code.');
      setToastMessage({ type: 'error', text: typeof msg === 'string' ? msg : t('Failed to resend code.') });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) {
      setToastMessage({ type: 'error', text: t('Please provide an email address.') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setToastMessage({ type: 'error', text: t('Please enter all 6 digits of the OTP code!') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, otpCode);
      const successMsg = res?.data?.message || res?.message || t('Verification successful! Your account has been activated.');
      setToastMessage({ type: 'success', text: successMsg });

      // Clean up backup storage
      sessionStorage.removeItem('nexus_pending_email');

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.response?.data || t('Invalid OTP code!');
      setToastMessage({ type: 'error', text: typeof errMsg === 'string' ? errMsg : t('Invalid OTP code!') });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      setToastMessage({ type: 'error', text: t('Please enter a valid email address.') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setEmail(tempEmail);
    sessionStorage.setItem('nexus_pending_email', tempEmail);
    setIsEditingEmail(false);
    // Trigger resend to the new email
    setResendCooldown(0);
  };

  return (
    <motion.main 
      className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto select-none bg-slate-100 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 1. BRIGHT DAYLIGHT ATHLETIC STATIC BACKGROUND */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/images/register-static-bg.jpg"
          alt="Nexus Athletic Track"
          className="w-full h-full object-cover object-center filter contrast-[1.02] saturate-[1.08] brightness-[0.98]"
        />

        {/* Airy daylight gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/45 via-slate-950/20 to-white/10" />
        <div className="absolute inset-0 bg-sky-400/[0.04] mix-blend-overlay" />
      </div>

      {/* 2. TOP BAR: Back to Register / Back to Sign In Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
        <button 
          onClick={() => navigate('/register')} 
          className="flex items-center gap-2 text-slate-800 hover:text-slate-950 bg-white/75 hover:bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border border-white/80 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t("Back to Register")}</span>
        </button>
      </div>

      {/* 3. CENTER FROSTED GLASS CARD */}
      <motion.div 
        className="relative z-10 w-full max-w-[450px] mx-auto my-auto"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full rounded-3xl bg-white/80 hover:bg-white/85 backdrop-blur-2xl border border-white/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22)] p-6 sm:p-8 text-slate-900 transition-all">
          
          {/* Header Row: Logo & Language Switcher */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-500/20 shadow-xs">
                <Dumbbell className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div className="leading-tight">
                <h2 className="font-black text-sm text-slate-900 tracking-wider">{t("NEXUS")}</h2>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{t("SPORTS CENTER")}</p>
              </div>
            </div>

            {/* Language Switcher Pill */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={currentLang === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLang.toUpperCase()}</span>
            </button>
          </div>

          {/* Mail Icon & Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm mx-auto mb-3.5">
              <Mail className="w-7 h-7" strokeWidth={2.2} />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t("Verify Your Email")}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
              {t("We sent a 6-digit verification code to")}
            </p>

            {/* Email display / Edit mode */}
            {isEditingEmail ? (
              <form onSubmit={handleSaveEmail} className="mt-2.5 flex items-center gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer shadow-2xs"
                >
                  {t("Save")}
                </button>
                {email && (
                  <button
                    type="button"
                    onClick={() => { setTempEmail(email); setIsEditingEmail(false); }}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
            ) : (
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/60 text-xs font-bold text-blue-700">
                <span className="truncate max-w-[240px]">{email || 'alex@nexus.com'}</span>
                <button 
                  type="button" 
                  onClick={() => { setTempEmail(email); setIsEditingEmail(true); }}
                  title={t("Change email")}
                  className="p-0.5 hover:text-blue-950 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* OTP Input Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {t("Security PIN Code")}
                </label>
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("Code expires in")}: </span>
                  <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-blue-600'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* 6 OTP Input Boxes */}
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    className="w-full h-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black text-slate-900 bg-white/90 hover:bg-white focus:bg-white border-2 border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 rounded-xl outline-none shadow-xs transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Resend Code Section */}
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>{t("Didn't receive the code?")}</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50 disabled:no-underline cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                    <span>{t("Sending...")}</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>{t("Resend code in")} ({resendCooldown}s)</span>
                ) : (
                  <span>{t("Resend Code")}</span>
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>{t("Verifying...")}</span>
                </>
              ) : (
                <>
                  <span>{t("Verify Account")}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance Badge */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t("256-Bit SSL Encrypted Verification")}</span>
            </div>
            <span className="font-mono font-bold text-[10px] text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
              {t("PENDING")}
            </span>
          </div>

          {/* Navigation link to Sign In */}
          <div className="mt-4 text-center text-xs text-slate-700 font-medium">
            <span>{t("Already verified?")} </span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-600 font-extrabold hover:underline cursor-pointer ml-1"
            >
              {t("Sign in")}
            </button>
          </div>

        </div>
      </motion.div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-2xl p-4 shadow-xl backdrop-blur-xl border flex items-center gap-3.5 max-w-sm ${
              toastMessage.type === 'error' 
                ? 'bg-rose-600 text-white border-rose-500' 
                : 'bg-emerald-600 text-white border-emerald-500'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
              {toastMessage.type === 'error' ? (
                <X className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold">{t(toastMessage.type === 'error' ? 'Error!' : 'Success!')}</span>
              <span className="text-xs text-white/95 leading-tight">{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
