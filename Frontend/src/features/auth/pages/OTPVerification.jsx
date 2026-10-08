import { t, useLanguage } from '../../../i18n/useLanguage';
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function OTPVerification() {
  useLanguage();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds

  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Get email passed from registration page (or use default if accessed directly)
  const email = location.state?.email || 'alex@nexus.com';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
      const targetInput = e.target.parentNode.children[Math.min(pastedData.length, 5)];
      if (targetInput) targetInput.focus();
    }
  };


  const handleResend = async () => {
    if (timeLeft > 0) return; // Prevent resend if timer hasn't expired (5 minutes)
    try {
      setLoading(true);
      await axios.post(`http://localhost:8080/api/v1/auth/resend-otp?email=${encodeURIComponent(email)}`);
      setTimeLeft(300); // Reset timer to 5 minutes
      setOtp(['', '', '', '', '', '']); // Clear input boxes
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, index) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Get the last typed digit to override telex composition
    val = val.slice(-1);

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Focus next
    if (val !== '' && e.target.nextElementSibling) {
      e.target.nextElementSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Press Backspace to go to the previous input
    if (e.key === 'Backspace') {
      if (otp[index] === '' && e.target.previousSibling) {
        e.target.previousSibling.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setToastMessage({ type: 'error', text: t('Please enter all 6 digits of the OTP code!') });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      // Call Verify OTP API
      const response = await axios.post(`http://localhost:8080/api/v1/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otpCode)}`);

      setToastMessage({ type: 'success', text: response.data.message || 'Verification successful! Your account has been activated.' });
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setToastMessage({ type: 'error', text: error.response?.data?.message || 'Invalid OTP code!' });
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="h-full bg-[var(--surface)] text-[var(--text)] font-sans antialiased flex flex-col justify-between overflow-x-hidden min-h-screen">
      <main className="min-h-screen w-full flex flex-col lg:flex-row relative">

        <section className="auth-hero relative w-full lg:w-1/2 min-h-[520px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-[var(--border)]">
          <img alt="Nexus Gym Facility" className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-90 contrast-110"
               src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" />
          <div className="absolute inset-0 auth-hero-shade"></div>

          <header className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary-hover)] to-[var(--primary-hover)] flex items-center justify-center shadow-[var(--shadow)] border border-[var(--primary-soft)]">
                <svg aria-hidden="true" className="w-5 h-5 text-[var(--hero-text)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <div>
                <span className="block text-base font-extrabold tracking-wider text-[var(--hero-text)]">{t("NEXUS")}</span>
                <span className="block text-[10px] font-semibold tracking-widest text-[var(--hero-text)] uppercase">{t("Performance Lab")}</span>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--hero-overlay)] border border-[var(--hero-line)] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
              </span>
              <span className="text-xs font-semibold tracking-wider text-[var(--hero-text)] uppercase">{t("Sports Center")}</span>
            </div>
          </header>

          <div className="relative z-10 mt-24 lg:mt-auto pt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--hero-overlay)] border border-[var(--hero-line)] backdrop-blur-md mb-5">
              <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-xs font-bold tracking-wide text-[var(--hero-text)] uppercase">{t("Security Protocol")}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)] font-mono font-medium">{t("STEP 2 OF 3")}</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold text-[var(--hero-text)] tracking-tight leading-[1.15]">{t("Verify Your")}<span className="text-[var(--hero-accent)]">{t("Identity")}</span>.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[var(--hero-text)] font-normal max-w-xl leading-relaxed">{t("Protecting your personal athletic metrics, biometric data, and facility access reservations across our network.")}</p>

            <div className="w-full h-px bg-[var(--surface)] my-8"></div>

            <div className="grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-2xl font-bold tracking-tight text-[var(--hero-text)] font-mono">{t("256-Bit")}</div>
                <div className="text-xs text-[var(--hero-text)] font-medium mt-0.5">{t("SSL Encrypted")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[var(--hero-text)] font-mono">{t("Live Sync")}</div>
                <div className="text-xs text-[var(--hero-text)] font-medium mt-0.5">{t("Instant Access")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-[var(--hero-text)] font-mono">{t("Biometric")}</div>
                <div className="text-xs text-[var(--hero-text)] font-medium mt-0.5">{t("ID Protected")}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-[var(--surface)] relative z-10">
          <nav className="flex items-center justify-between sm:justify-end gap-3 w-full pb-8 sm:pb-0">
            <span className="text-sm text-[var(--text-muted)]">{t("Already verified?")}</span>
            <button onClick={() => navigate('/login')} className="inline-flex items-center text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary)] transition-colors gap-1 group">{t("Sign in")}<svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </nav>

          <div className="max-w-md w-full mx-auto my-auto py-8">
            <div className="text-center sm:text-left mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--surface)] border border-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow)] mb-6">
                <svg className="w-7 h-7 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-tight">{t("Check your email")}</h1>
                <span className="text-[var(--primary)] inline-block">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-[var(--text-muted)] text-sm leading-relaxed">{t("We sent a 6-digit verification code to")}<span className="text-[var(--text)] font-medium">{email}</span>{t(". Enter the code below to confirm your account.")}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">{t("Security PIN Code")}</label>
                  <button type="button" className="text-xs text-[var(--primary)] hover:text-[var(--primary)] font-medium">{t("Change email")}</button>
                </div>

                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="tel"
                      autoComplete="off"
                      value={data}
                      onChange={(e) => handleChange(e, index)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-13 sm:h-14 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-center text-xl sm:text-2xl font-mono font-bold rounded-xl focus:border-[var(--primary)] focus:ring-2 ring-[var(--focus-ring)] focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                    <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>{t("Code expires in")}<span className={`font-mono font-medium ${timeLeft < 60 ? 'text-[var(--danger-text)]' : 'text-[var(--text)]'}`}>{formatTime(timeLeft)}</span></span>
                  </div>
                  <span className="text-[var(--primary)] font-medium">{t("Secure Delivery")}</span>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-[var(--primary)] hover:bg-[var(--primary)] active:scale-[0.99] text-[color:var(--on-primary)] font-bold rounded-xl shadow-[var(--shadow)] transition-all duration-150 flex items-center justify-center gap-2 group text-base disabled:opacity-70">
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>{t("Verifying...")}</span></>
                ) : (
                  <>
                    <span>{t("Verify Account")}</span>
                    <svg className="w-4 h-4 text-[var(--text)] transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-sm text-[var(--text-muted)]">{t("Didn't receive the code?")}<button type="button" className="text-[var(--primary)] hover:text-[var(--primary)] font-semibold transition-colors focus:underline ml-1">{t("Resend Code")}</button>
              </div>
            </form>

            <div className="mt-8 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--primary-soft)] border border-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75m-2.18-7.228a2.25 2.25 0 00-.946-.867 2.25 2.25 0 00-2.234.334L5.688 9.5a2.25 2.25 0 00-.688 1.6V18a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0020 18v-6.9a2.25 2.25 0 00-.688-1.6l-3.208-2.512z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text)]">{t("Instant Access Portal")}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{t("Synchronizes with your smart sports membership.")}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary-soft)] border border-[var(--primary-soft)] px-2 py-0.5 rounded tracking-wider uppercase">{t("PENDING")}</span>
            </div>
          </div>

          <footer className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <div>{t("Â© 2026 NEXUS Sports Technology Inc.")}</div>
            <div className="flex items-center gap-4">
              <button className="hover:text-[var(--text)] transition-colors">{t("Privacy Policy")}</button>
              <button className="hover:text-[var(--text)] transition-colors">{t("Safety Code")}</button>
              <button className="hover:text-[var(--text)] transition-colors">{t("Contact")}</button>
            </div>
          </footer>
        </section>
      </main>

      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-50 bg-[var(--surface)] border ${toastMessage.type === 'error' ? 'border-[var(--danger-soft)]' : 'border-[var(--primary-soft)]'} text-[var(--text)] rounded-xl p-4 shadow-[var(--shadow)] animate-fade-in-up flex items-center gap-3.5 max-w-sm`}>
          <div className={`w-9 h-9 rounded-full ${toastMessage.type === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'} flex items-center justify-center text-[var(--text)]`}>
            <span className="material-symbols-outlined text-[20px]">{t(toastMessage.type === 'error' ? t('close') : t('check'))}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-[var(--text)]">{t(toastMessage.type === 'error' ? t('Error!') : t('Success!'))}</span>
            <span className="text-xs text-[var(--text-muted)]">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
