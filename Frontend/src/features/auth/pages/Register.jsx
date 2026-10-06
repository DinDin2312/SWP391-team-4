import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function Register() {
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setToastMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (!isAgreed) {
      alert("You must agree to the Terms of Service!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/register', formData);
      setToastMessage({ type: 'success', text: response.data.message || 'Member account registered successfully!' });

      // Redirect to OTP verification page
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: formData.email } });
      }, 1500);
    } catch (error) {
      setToastMessage({ type: 'error', text: error.response?.data?.message || 'An error occurred, please try again!' });
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3200);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[var(--surface)] text-[var(--text)] font-sans antialiased min-h-screen selection:bg-blue-500/30 selection:text-[var(--text)]"
    >
      <div className="min-h-screen w-full flex flex-col lg:flex-row relative">
        <div className="auth-hero relative w-full lg:w-[52%] xl:w-[54%] min-h-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-[var(--border)]">
          <img alt="NEXUS High Performance" className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 hover:scale-100" src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" />
          <div className="absolute inset-0 auth-hero-shade"></div>
          <div className="absolute inset-0 auth-hero-shade"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-hover)] to-[var(--primary-hover)] flex items-center justify-center text-[color:var(--on-primary)] shadow-[var(--shadow)]">
                <span className="material-symbols-outlined text-[22px]">bolt</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[22px] tracking-wider text-[var(--hero-text)] leading-tight uppercase">NEXUS</span>
                <span className="text-[10px] tracking-[0.2em] font-semibold text-[var(--hero-text)] uppercase">Performance Lab</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[var(--hero-overlay)] backdrop-blur-md border border-[var(--hero-line)] text-[var(--hero-text)] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-[var(--shadow)]">
              <span className="w-2 h-2 rounded-full bg-[var(--surface)] animate-ping"></span> SPORTS CENTER
            </span>
          </div>

          <div className="relative z-10 mt-20 lg:mt-auto pt-10">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-[var(--hero-text)] tracking-tight leading-[1.15] mb-5 max-w-xl">
              Unleash Your <span className="bg-gradient-to-r from-[var(--hero-text)] via-[var(--hero-accent)] to-[var(--hero-accent)] bg-clip-text text-transparent">Potential</span>.
            </h2>
            <p className="text-base lg:text-lg text-[var(--hero-text)] font-normal leading-relaxed max-w-lg mb-8">
              Book courts, join classes, and track your athletic performance with real-time biometric integration at NEXUS.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[var(--surface)] relative overflow-y-auto">
          <div className="w-full flex items-center justify-end gap-6 text-sm text-[var(--text-muted)] z-10 pb-4 lg:pb-0">
            <span className="hidden sm:inline">Already have an account?</span>
            <a className="inline-flex items-center gap-1.5 text-[var(--primary)] hover:text-[var(--text)] font-semibold transition-colors" href="/login">
              <span>Sign in</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>

          <div className="w-full max-w-[500px] mx-auto my-auto py-6 relative z-10">
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-2">
                <h1 className="text-3xl lg:text-[34px] font-bold text-[var(--text)] tracking-tight leading-tight">Join NEXUS</h1>
                <span className="material-symbols-outlined text-[var(--primary)] text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Start your fitness journey and access live court bookings, class schedules, and elite personal coaching.
              </p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-6 sm:p-7 border border-[var(--border)] shadow-[var(--shadow)] relative">
              <form className="space-y-4" onSubmit={handleRegistration}>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)] flex justify-between" htmlFor="fullName">
                    <span>Full Name</span><span className="text-[var(--text)] text-[11px] font-medium">Required</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-muted)] text-[20px]">person</span>
                    <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                      id="fullName" placeholder="Alex Morgan" required value={formData.fullName} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="email">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-muted)] text-[20px]">mail</span>
                    <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                      type="email" id="email" placeholder="alex@nexus.com" required value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="phone">Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-muted)] text-[20px]">call</span>
                    <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                      type="tel" id="phone" placeholder="+1 (555) 019-2834" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]" htmlFor="password">Password</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[var(--text-muted)] text-[20px]">lock</span>
                    <input className="w-full bg-[var(--surface)] text-[var(--text)] text-sm pl-11 pr-11 py-3 rounded-xl border border-[var(--border)] outline-none focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)]"
                      type={showPassword ? "text" : "password"} id="password" placeholder="Minimum 8 characters" required value={formData.password} onChange={handleInputChange} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-[var(--text-muted)] hover:text-[var(--text)]">
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
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
                  <span className="text-xs font-semibold text-[var(--text-muted)] block">Primary Athletic Focus</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Gym', 'Courts', 'Aquatics'].map(sport => (
                      <button key={sport} type="button" onClick={() => setSelectedSport(sport)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 border ${selectedSport === sport ? 'bg-[var(--primary)] text-[color:var(--on-primary)] border-[var(--primary-soft)] shadow-[var(--shadow)]' : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]'}`}>
                        <span className={`material-symbols-outlined text-[16px] ${selectedSport === sport ? 'text-[color:var(--on-primary)]' : 'text-[var(--primary)]'}`}>
                          {sport === 'Gym' ? 'fitness_center' : sport === 'Courts' ? 'sports_tennis' : 'pool'}
                        </span> {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 cursor-pointer select-none" onClick={toggleAgreement}>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 ${isAgreed ? 'bg-[var(--primary)] border-[var(--primary-soft)] text-[color:var(--on-primary)]' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                    {isAgreed && <span className="material-symbols-outlined text-[15px] font-bold">check</span>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    I accept the <span className="text-[var(--text)] underline hover:text-[var(--text)]">Terms of Service</span>, safety protocols, and health liability waivers.
                  </p>
                </div>

                <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 px-5 bg-[var(--primary)] hover:bg-[var(--primary)] active:scale-[0.99] text-[color:var(--on-primary)] font-semibold text-sm rounded-xl shadow-[var(--shadow)] transition-all flex items-center justify-center gap-2">
                  {loading ? (
                    <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Creating Account...</span></>
                  ) : (
                    <><span>Create NEXUS Account</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed bottom-8 right-8 z-50 bg-[var(--surface)] border ${toastMessage?.type === 'error' ? 'border-[var(--danger-soft)]' : 'border-[var(--primary-soft)]'} text-[var(--text)] rounded-xl p-4 shadow-[var(--shadow)] transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'} flex items-center gap-3.5 max-w-sm`}>
        <div className={`w-9 h-9 rounded-full ${toastMessage?.type === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'} flex items-center justify-center text-[var(--text)]`}>
          <span className="material-symbols-outlined text-[20px]">{toastMessage?.type === 'error' ? 'close' : 'check'}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--text)]">{toastMessage?.type === 'error' ? 'Error!' : 'Success!'}</span>
          <span className="text-xs text-[var(--text-muted)]">{toastMessage?.text}</span>
        </div>
      </div>
    </motion.main>
  );
}
