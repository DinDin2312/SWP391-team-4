import { t, useLanguage } from '../../../i18n/useLanguage';
import { setLanguage } from '../../../i18n/languageStore';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  ArrowRight, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Dumbbell, 
  Activity, 
  Waves, 
  Check, 
  RefreshCw, 
  X,
  Globe,
  Sparkles,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function Register() {
  const currentLang = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Courts');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const toggleAgreement = () => setIsAgreed(!isAgreed);

  const toggleLanguage = () => {
    setLanguage(currentLang === 'en' ? 'vi' : 'en');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return { text: '', m1: 'bg-slate-200', m2: 'bg-slate-200', m3: 'bg-slate-200', m4: 'bg-slate-200', textClass: 'text-slate-400' };
    if (len < 6) return { text: t("Weak"), m1: 'bg-rose-500', m2: 'bg-slate-200', m3: 'bg-slate-200', m4: 'bg-slate-200', textClass: 'text-rose-600 font-extrabold' };
    if (len < 9) return { text: t("Fair"), m1: 'bg-amber-500', m2: 'bg-amber-500', m3: 'bg-slate-200', m4: 'bg-slate-200', textClass: 'text-amber-600 font-extrabold' };
    if (len < 12) return { text: t("Good"), m1: 'bg-blue-600', m2: 'bg-blue-600', m3: 'bg-blue-600', m4: 'bg-slate-200', textClass: 'text-blue-600 font-extrabold' };
    return { text: t("Elite"), m1: 'bg-emerald-600', m2: 'bg-emerald-600', m3: 'bg-emerald-600', m4: 'bg-emerald-600', textClass: 'text-emerald-600 font-extrabold' };
  };

  const strength = getPasswordStrength();

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!isAgreed) {
      setToastMessage({ type: 'error', text: t("Please accept the terms to proceed.") });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      };

      await authService.register(payload);
      sessionStorage.setItem('nexus_pending_email', formData.email);

      setToastMessage({ type: 'success', text: t("Registration successful! Verify your email.") });
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: formData.email } });
      }, 1500);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || t("Registration failed. Email or phone may already exist.");
      setToastMessage({ type: 'error', text: errMsg });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main 
      className="relative w-full min-h-screen overflow-x-hidden overflow-y-auto select-none bg-transparent flex items-center justify-center py-6 sm:py-8 lg:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 2. TOP BAR: Back to Sign in Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
        <button 
          onClick={() => navigate('/login')} 
          className="flex items-center gap-2 text-slate-800 hover:text-slate-950 bg-white/75 hover:bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border border-white/80 shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t("Back to Sign in")}</span>
        </button>
      </div>

      {/* 3. FOREGROUND 2-COLUMN LAYOUT */}
      <div className="relative z-10 w-full flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-20 my-auto">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* LEFT COLUMN: Hero Athletic Branding & Features */}
          <motion.div 
            className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center text-white pr-4 xl:pr-10"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Kicker badge */}
            <div className="flex items-center gap-2.5 text-sky-300 font-extrabold text-xs uppercase tracking-widest mb-3">
              <span className="w-7 h-[2.5px] bg-sky-400 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
              <span>{t("START YOUR JOURNEY")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-white leading-[1.04] tracking-tight mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              <span>{t("NEXUS:")}</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200">
                {t("Elevate")}
              </span><br />
              <span>{t("Your Training")}</span><br />
              <span>{t("Today.")}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm xl:text-base text-slate-100 max-w-lg leading-relaxed font-normal mb-7 drop-shadow-md">
              {t("Join an elite community of athletes, coaches, and sports enthusiasts.")}
            </p>

            {/* 3 High-Contrast Feature Pillars */}
            <div className="space-y-3 max-w-md mb-8">
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 text-xs font-bold text-white shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-sky-500/30 text-sky-200 flex items-center justify-center shrink-0 border border-sky-400/40">
                  <Calendar className="w-4 h-4" />
                </div>
                <span>{t("Real-time court bookings & class schedules")}</span>
              </div>
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 text-xs font-bold text-white shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 text-emerald-200 flex items-center justify-center shrink-0 border border-emerald-400/40">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>{t("Certified coaches & tailored training roadmaps")}</span>
              </div>
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 text-xs font-bold text-white shadow-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-500/30 text-amber-200 flex items-center justify-center shrink-0 border border-amber-400/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>{t("Smart attendance & performance tracking")}</span>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="flex items-center gap-3 text-xs font-extrabold tracking-widest text-slate-200 uppercase drop-shadow-sm">
              <span className="text-sky-300 font-black">02</span>
              <span className="w-12 h-px bg-white/40" />
              <span>{t("BEGIN WITH PASSION")}</span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Crisp High-Contrast Translucent Frosted Glass Card */}
          <motion.div 
            className="col-span-1 lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Luminous High-Contrast Frosted White Card */}
            <div className="relative w-full max-w-[440px] rounded-2xl bg-white/75 hover:bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-5 sm:p-6 text-slate-900 transition-all">

              {/* Header Row: Brand + Language Toggle */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/70">
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

              {/* Card Title */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {t("Create Account")}
                  </h3>
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {t("Start your journey at Nexus Sports Center")}
                </p>
              </div>

              {/* Form */}
              <form className="space-y-2.5" onSubmit={handleRegistration}>

                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-800 mb-1">
                    {t("Full Name")} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder={t("Alex Morgan")}
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Email Address Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-800 mb-1">
                    {t("Email Address")} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      placeholder={t("alex@nexus.com")}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Phone Number Field */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-800 mb-1">
                    {t("Phone Number")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+84 901 234 567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-bold text-slate-800 mb-1">
                    {t("Password")} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("Minimum 8 characters")}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-2 sm:py-2.5 rounded-xl border border-slate-300/80 bg-white/80 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-600 transition-all font-mono shadow-2xs"
                    />
                    <button
                      type="button"
                      aria-label={t(showPassword ? 'Hide password' : 'Show password')}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* High-Contrast Password Strength Indicator */}
                  {formData.password && (
                    <div className="flex items-center gap-1.5 pt-1.5 px-0.5">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.m1}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.m2}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.m3}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength.m4}`}></div>
                      <span className={`text-xs ml-2 min-w-[50px] text-right ${strength.textClass}`}>{strength.text}</span>
                    </div>
                  )}
                </div>

                {/* Primary Athletic Focus */}
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">
                    {t("Primary Athletic Focus")}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Gym', label: t('Gym'), icon: Dumbbell },
                      { name: 'Courts', label: t('Courts'), icon: Activity },
                      { name: 'Aquatics', label: t('Aquatics'), icon: Waves }
                    ].map(({ name, label, icon: SportIcon }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSelectedSport(name)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${
                          selectedSport === name 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30' 
                            : 'bg-white/70 hover:bg-white border-slate-300/80 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <SportIcon className={`w-3.5 h-3.5 shrink-0 ${selectedSport === name ? 'text-white' : 'text-blue-600'}`} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terms Agreement Checkbox */}
                <div className="flex items-start gap-2.5 pt-0.5 cursor-pointer select-none" onClick={toggleAgreement}>
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center mt-0.5 transition-colors shrink-0 ${
                    isAgreed ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/80 border-slate-300'
                  }`}>
                    {isAgreed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-normal">
                    <span>{t("I accept the")} </span>
                    <span className="text-blue-600 font-extrabold hover:underline">{t("Terms of Service")}</span>
                    <span>{t(", safety protocols, and health liability waivers.")}</span>
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1.5 py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{t("Creating Account...")}</span>
                    </>
                  ) : (
                    <>
                      <span>{t("Create NEXUS Account")}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </>
                  )}
                </button>
              </form>

              {/* Already have an account prompt */}
              <div className="mt-3 text-center text-xs text-slate-700 font-medium">
                <span>{t("Already have an account?")} </span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 font-extrabold hover:underline cursor-pointer ml-1"
                >
                  {t("Sign in")}
                </button>
              </div>

              {/* Footer Support Info */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/70 text-center text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1.5 flex-wrap">
                <span>{t("Support")}:</span>
                <a href="mailto:support@nexus.com" className="hover:text-blue-600 transition-colors font-semibold">support@nexus.com</a>
                <span>•</span>
                <span>024 3771 2088</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>

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
