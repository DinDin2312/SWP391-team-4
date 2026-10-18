import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { motion } from 'framer-motion';
import { 
  Zap, 
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
  X 
} from 'lucide-react';

export default function Register() {
  useLanguage();
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const getPasswordStrength = () => {
    const len = formData.password.length;
    if (len === 0) return { text: 'Weak', m1: '', m2: '', m3: '', m4: '', textClass: 'text-outline' };
    if (len < 6) return { text: 'Weak', m1: 'bg-[var(--danger)]', m2: '', m3: '', m4: '', textClass: 'text-[var(--danger-text)]' };
    if (len < 9) return { text: 'Fair', m1: 'bg-[var(--surface)]', m2: 'bg-[var(--surface)]', m3: '', m4: '', textClass: 'text-[var(--text)]' };
    if (len < 12) return { text: 'Good', m1: 'bg-[var(--primary)]', m2: 'bg-[var(--primary)]', m3: 'bg-[var(--primary)]', m4: '', textClass: 'text-[var(--primary)]' };
    return { text: 'Elite', m1: 'bg-[var(--primary)]', m2: 'bg-[var(--primary)]', m3: 'bg-[var(--primary)]', m4: 'bg-[var(--primary)]', textClass: 'text-[var(--primary)] font-bold' };
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[var(--bg)] text-[var(--text)] min-h-screen flex flex-col justify-between selection:bg-[var(--primary)] selection:text-[color:var(--on-primary)] relative"
    >
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full flex flex-col lg:flex-row min-h-screen">
          <div className="auth-hero relative w-full lg:w-[52%] xl:w-[54%] min-h-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border)]">
            <img alt="NEXUS High Performance" className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 hover:scale-100" src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" />
            <div className="absolute inset-0 auth-hero-shade"></div>
            <div className="absolute inset-0 auth-hero-shade"></div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-hover)] to-[var(--primary-hover)] flex items-center justify-center text-[color:var(--on-primary)] shadow-[var(--shadow)]">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[22px] tracking-wider text-[var(--hero-text)] leading-tight uppercase">{t("NEXUS")}</span>
                  <span className="text-[10px] tracking-[0.2em] font-semibold text-[var(--hero-text)] uppercase">{t("Performance Lab")}</span>
                </div>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[var(--hero-overlay)] backdrop-blur-md border border-[var(--hero-line)] text-[var(--hero-text)] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[var(--shadow)]">
                <span className="w-2 h-2 rounded-full bg-[var(--surface)] animate-ping"></span>{t("SPORTS CENTER")}</span>
            </div>

            <div className="relative z-10 mt-20 lg:mt-auto pt-10">
              <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[var(--hero-text)] tracking-tight leading-[1.15] mb-5 max-w-xl">{t("Unleash Your")}<span className="bg-gradient-to-r from-[var(--hero-text)] via-[var(--hero-accent)] to-[var(--hero-accent)] bg-clip-text text-transparent">{t("Potential")}</span>.
              </h2>
              <p className="text-base lg:text-lg text-[var(--hero-text)] font-normal leading-relaxed max-w-lg mb-8">{t("Book courts, join classes, and track your athletic performance with real-time biometric integration at NEXUS.")}</p>
            </div>
          </div>

          <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[var(--surface)] relative overflow-y-auto">
            <div className="w-full flex items-center justify-end gap-6 text-sm text-[var(--text-muted)] z-10 pb-4 lg:pb-0">
              <span className="hidden sm:inline">{t("Already have an account?")}</span>
              <a className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--text)] font-semibold transition-colors" href="/login">
                <span>{t("Sign in")}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="w-full max-w-[500px] mx-auto my-auto py-6 relative z-10">
              <div className="mb-7">
                <div className="flex items-center gap-2.5 mb-2">
                  <h1 className="text-3xl lg:text-[34px] font-bold text-[var(--text)] tracking-tight leading-tight">{t("Join NEXUS")}</h1>
                  <CheckCircle2 className="w-6 h-6 text-[var(--primary)] shrink-0" />
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{t("Start your fitness journey and access live court bookings, class schedules, and elite personal coaching.")}</p>
              </div>

              <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-7 border border-[var(--border)] shadow-[var(--shadow)] relative">
                <form className="space-y-4" onSubmit={handleRegistration}>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)] flex justify-between" htmlFor="fullName">
                      <span>{t("Full Name")}</span><span className="text-[var(--text)] text-[11px] font-medium">{t("Required")}</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5" />
                      <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                        id="fullName" placeholder={t("Alex Morgan")} required value={formData.fullName} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="email">{t("Email Address")}</label>
                    <div className="relative flex items-center">
                      <Mail className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5" />
                      <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                        type="email" id="email" placeholder={t("alex@nexus.com")} required value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="phone">{t("Phone Number")}</label>
                    <div className="relative flex items-center">
                      <Phone className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5" />
                      <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                        type="tel" id="phone" placeholder={t("+1 (555) 019-2834")} value={formData.phone} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="password">{t("Password")}</label>
                    <div className="relative flex items-center">
                      <Lock className="w-5 h-5 text-[var(--text-muted)] absolute left-3.5" />
                      <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-11 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                        type={showPassword ? "text" : "password"} id="password" placeholder={t("Minimum 8 characters")} required value={formData.password} onChange={handleInputChange} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1.5 px-0.5">
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m1 || 'bg-[var(--surface)]'}`}></div>
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m2 || 'bg-[var(--surface)]'}`}></div>
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m3 || 'bg-[var(--surface)]'}`}></div>
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m4 || 'bg-[var(--surface)]'}`}></div>
                      <span className={`text-[11px] ml-2 min-w-[50px] text-right ${strength.textClass}`}>{strength.text}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-[var(--text-muted)] block">{t("Primary Athletic Focus")}</span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { name: 'Gym', icon: Dumbbell },
                        { name: 'Courts', icon: Activity },
                        { name: 'Aquatics', icon: Waves }
                      ].map(({ name, icon: SportIcon }) => (
                        <button key={name} type="button" onClick={() => setSelectedSport(name)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 border cursor-pointer ${selectedSport === name ? 'bg-[var(--primary)] text-[color:var(--on-primary)] border-[var(--primary-soft)] shadow-[var(--shadow)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]'}`}>
                          <SportIcon className={`w-4 h-4 shrink-0 ${selectedSport === name ? 'text-[color:var(--on-primary)]' : 'text-[var(--primary)]'}`} />
                          <span>{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-2 cursor-pointer select-none" onClick={toggleAgreement}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 ${isAgreed ? 'bg-[var(--primary)] border-[var(--primary-soft)] text-[color:var(--on-primary)]' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                      {isAgreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t("I accept the")}<span className="text-[var(--text)] underline hover:text-[var(--text)]">{t("Terms of Service")}</span>{t(", safety protocols, and health liability waivers.")}</p>
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 px-5 bg-[var(--primary)] hover:bg-[var(--primary)] active:scale-[0.99] text-[color:var(--on-primary)] font-semibold text-sm rounded-xl shadow-[var(--shadow)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-8 right-8 z-50 bg-[var(--surface)] border ${toastMessage?.type === 'error' ? 'border-[var(--danger-soft)]' : 'border-[var(--primary-soft)]'} text-[var(--text)] rounded-xl p-4 shadow-[var(--shadow)] transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'} flex items-center gap-3.5 max-w-sm`}>
        <div className={`w-9 h-9 rounded-full ${toastMessage?.type === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'} flex items-center justify-center text-[var(--text)] shrink-0`}>
          {toastMessage?.type === 'error' ? (
            <X className="w-5 h-5" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--text)]">{t(toastMessage?.type === 'error' ? t('Error!') : t('Success!'))}</span>
          <span className="text-xs text-[var(--text-muted)]">{toastMessage?.text}</span>
        </div>
      </div>
    </motion.main>
  );
}
