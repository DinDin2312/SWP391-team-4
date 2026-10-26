import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Smartphone,
  Check,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';

export default function ForgotPassword() {
  useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [timeLeft, setTimeLeft] = useState(298);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleOtpChange = (index, val) => {
    val = val.replace(/\D/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }
    val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val !== '' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // 1. API: Send Forgot Password OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await authService.sendForgotPasswordOtp(email);
      setStep(2);
      setTimeLeft(300);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. API: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.some((digit) => digit === '')) {
      setErrorMsg('Please enter all 6 digits of the OTP code.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await authService.verifyForgotPasswordOtp({
        email,
        otp: otp.join('')
      });
      setStep(3);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. API: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await authService.resetPassword({
        email,
        otp: otp.join(''),
        newPassword
      });
      setStep(4);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <motion.div 
      className="relative min-h-screen flex flex-col font-sans antialiased overflow-x-hidden selection:bg-blue-600 selection:text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 1. ATHLETIC WALLPAPER BACKGROUND WITH BALANCED TINTED OVERLAY */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/images/gym-poster.jpg"
          alt="Nexus Athletic Wallpaper"
          className="w-full h-full object-cover object-center filter brightness-[0.62] contrast-[1.08] saturate-[1.15]"
        />
        {/* Soft, rich colored athletic overlay to let white cards stand out crisp and clear */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-900/60 to-slate-950/80" />
        <div className="absolute inset-0 bg-sky-500/[0.04] mix-blend-overlay" />
      </div>

      {/* Dynamic light velocity sweep across the screen on entry */}
      <motion.div
        className="absolute top-0 bottom-0 w-72 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-22deg] pointer-events-none z-2"
        initial={{ left: '-50%' }}
        animate={{ left: '150%' }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />

      {/* 2. HEADER */}
      <motion.header 
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 border-b border-white/15 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between"
      >
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-blue-600 transition-all bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-white/80 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.4} />
          <span>{t("Back to Sign In")}</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black tracking-wider text-sm text-white drop-shadow-sm">{t("NEXUS")}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></span>
            </div>
            <p className="text-[9px] tracking-widest text-slate-200 font-bold uppercase drop-shadow-sm">{t("SPORTS CENTER")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-300 hidden sm:inline">{t("Need assistance?")}</span>
          <a href="#support" className="text-sky-300 hover:text-white font-bold transition-colors">{t("IT Support Desk")}</a>
        </div>
      </motion.header>

      {/* 3. MAIN CONTENT: BRIGHT CRISP CARDS ON COLORED WALLPAPER */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">

          {/* LEFT COLUMN: Bright Security & Protocol Card with smooth slide-in */}
          <motion.div 
            initial={{ x: -35, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl text-slate-900"
          >
            {/* Ambient soft glow inside card */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-sky-100/70 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{t("Security Protocol · Auth Gateway v4.9")}</span>
              </div>

              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {t("Restore Access to Your")}{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                    {t("Athletic Command.")}
                  </span>
                </h1>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed font-normal">
                  {t("Verify your registered credentials to instantly sync your training telemetry, smart court reservations, and biometric baseline data.")}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200/80">
                <div className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>{t("256-Bit Encrypted Dynamic OTP Verification")}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span>{t("Instant Biometric & RFID Locker Re-sync")}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-800 font-medium">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>{t("Zero Telemetry Loss Across Active Workouts")}</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-8 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                {t("Auth Node: Operational")}
              </span>
              <span className="font-mono text-slate-500">{t("Latency: 18ms")}</span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Bright Reset Password Card with smooth slide-in */}
          <motion.div 
            initial={{ x: 35, opacity: 0, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative text-slate-900"
          >
            <div>
              {/* Step indicator */}
              <div className="grid grid-cols-3 gap-2 pb-6 border-b border-slate-200/80 mb-6">
                {[
                  { num: 1, label: t('Email') },
                  { num: 2, label: t('Verify OTP') },
                  { num: 3, label: t('New Password') },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div 
                      key={s.num} 
                      className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                        isActive 
                          ? 'bg-blue-50/90 border-blue-200 text-blue-700 shadow-xs' 
                          : isDone 
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
                          : 'bg-slate-50/80 border-slate-200/60 text-slate-400'
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : isDone 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                      </div>
                      <span className="text-xs font-bold">{t(s.label)}</span>
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2"
                >
                  <span>{t(errorMsg)}</span>
                </motion.div>
              )}

              {/* SMOOTH STEP TRANSITIONS */}
              <AnimatePresence mode="wait">
                {/* STEP 1: Email Form */}
                {step === 1 && (
                  <motion.form 
                    key="step1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSendOtp} 
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{t("Reset Account Password")}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t("Enter the email associated with your NEXUS membership. We will send a 6-digit dynamic authentication PIN.")}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">{t("Registered Email Address")}</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="email" 
                          required 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          placeholder={t("name@example.com")} 
                          className="w-full bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all shadow-inner outline-none" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>{t("Send Verification Code")}</span><ArrowRight className="w-4 h-4 stroke-[2.2]" /></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 2: OTP Verification */}
                {step === 2 && (
                  <motion.form 
                    key="step2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleVerifyOtp} 
                    className="space-y-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">{t("Check Your Inbox")}</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          {t("We sent a 6-digit verification code to")}{" "}
                          <span className="text-blue-600 font-bold">{email}</span>.
                        </p>
                      </div>
                      <button type="button" onClick={() => setStep(1)} className="text-xs text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer">{t("Change email")}</button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800">{t("Security PIN Code")}</label>
                      <div className="flex justify-between gap-2 sm:gap-3">
                        {otp.map((digit, index) => (
                          <input 
                            key={index} 
                            ref={(el) => (inputRefs.current[index] = el)} 
                            type="tel" 
                            value={digit} 
                            autoComplete="off" 
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onPaste={handlePaste} 
                            onKeyDown={(e) => handleKeyDown(index, e)} 
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-900 rounded-xl outline-none transition-all shadow-inner" 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {t("Code expires in:")}{" "}
                        <strong className="text-slate-900 font-mono font-bold">{formatTimer(timeLeft)}</strong>
                      </span>
                      <button 
                        type="button" 
                        onClick={handleSendOtp} 
                        disabled={timeLeft > 0} 
                        className={`font-bold transition-colors ${timeLeft > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800 cursor-pointer'}`}
                      >
                        {t("Resend Code")}
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>{t("Verify Code & Continue")}</span><ArrowRight className="w-4 h-4 stroke-[2.2]" /></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 3: Create New Password */}
                {step === 3 && (
                  <motion.form 
                    key="step3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleResetPassword} 
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{t("Create New Password")}</h2>
                      <p className="text-xs text-slate-500 mt-1">{t("Your identity has been verified. Enter a strong, fresh security phrase.")}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">{t("New Password")}</label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type={showPassword ? 'text' : 'password'} 
                          required 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder={t("********")} 
                          className="w-full bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all shadow-inner outline-none" 
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {newPassword && (
                        <div className="pt-1.5 space-y-1">
                          <div className="flex gap-1 h-1.5">
                            <span className={`flex-1 rounded-full ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-slate-200'}`}></span>
                            <span className={`flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`}></span>
                            <span className={`flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-800">{t("Confirm New Password")}</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          required 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder={t("********")} 
                          className="w-full bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all shadow-inner outline-none" 
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full py-3.5 px-4 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /><span>{t("Update Password & Sign In")}</span></>}
                    </button>
                  </motion.form>
                )}

                {/* STEP 4: Success Message */}
                {step === 4 && (
                  <motion.div 
                    key="step4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="py-8 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{t("Password Successfully Updated!")}</h2>
                      <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">{t("Your NEXUS account credentials have been synchronized. You can now log into your member dashboard.")}</p>
                    </div>
                    <Link to="/login" className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      <span>{t("Proceed to Member Portal")}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-bold transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("Return to Member Sign In")}</span>
              </Link>
              <span className="text-[11px] text-slate-400 font-medium">{t("256-Bit SSL Encrypted Protocol")}</span>
            </div>
          </motion.div>

        </div>
      </main>
    </motion.div>
  );
}
