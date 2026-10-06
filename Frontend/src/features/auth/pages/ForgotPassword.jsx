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
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
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

  // 1. API: Send Forgot Password OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await axios.post(`http://localhost:8080/api/v1/auth/forgot-password/send-otp?email=${encodeURIComponent(email)}`);
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
      await axios.post('http://localhost:8080/api/v1/auth/forgot-password/verify-otp', {
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
      await axios.post('http://localhost:8080/api/v1/auth/forgot-password/reset', {
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
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text)] flex flex-col font-sans antialiased selection:bg-[var(--primary)] selection:text-[color:var(--on-primary)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[color:var(--on-primary)] shadow-[var(--shadow)]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold tracking-wider text-sm text-[var(--text)]">NEXUS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>
            </div>
            <p className="text-[9px] tracking-widest text-[var(--text-muted)] font-bold uppercase">SPORTS CENTER</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--text-muted)] hidden sm:inline">Need assistance?</span>
          <a href="#support" className="text-[var(--primary)] hover:text-[var(--primary)] font-semibold">IT Support Desk</a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-8 flex flex-col justify-between relative overflow-hidden shadow-[var(--shadow)]">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-[var(--primary-soft)] rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-[var(--success-soft)] rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary-soft)] text-[var(--primary)] text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Security Protocol &middot; Auth Gateway v4.9</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight leading-tight">
                  Restore Access to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--cyan)]">Athletic Command.</span>
                </h1>
                <p className="text-xs text-[var(--text-muted)] mt-3 leading-relaxed">
                  Verify your registered credentials to instantly sync your training telemetry, smart court reservations, and biometric baseline data.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 text-xs text-[var(--text)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>256-Bit Encrypted Dynamic OTP Verification</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span>Instant Biometric & RFID Locker Re-sync</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--surface)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Zero Telemetry Loss Across Active Workouts</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 pt-6 mt-8 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--success-hover)] animate-pulse"></span>
                Auth Node: Operational
              </span>
              <span>Latency: 18ms</span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 sm:p-8 flex flex-col justify-between shadow-[var(--shadow)] relative">
            <div>
              <div className="grid grid-cols-3 gap-2 pb-6 border-b border-[var(--border)] mb-6">
                {[
                  { num: 1, label: 'Email' },
                  { num: 2, label: 'Verify OTP' },
                  { num: 3, label: 'New Password' },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div key={s.num} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${isActive ? 'bg-[var(--primary-soft)] border-[var(--primary-soft)] text-[var(--primary)]' : isDone ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)]' : 'bg-[var(--surface)] border-transparent text-[var(--text-muted)]'}`}>
                      <div className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${isActive ? 'bg-[var(--primary)] text-[color:var(--on-primary)]' : isDone ? 'bg-[var(--success-hover)] text-[color:var(--on-primary)]' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span className="text-xs font-semibold">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[var(--rose-soft)] border border-[var(--rose-soft)] text-[var(--rose)] text-xs flex items-center gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1 */}
              {step === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text)]">Reset Account Password</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Enter the email associated with your NEXUS membership. We will send a 6-digit dynamic authentication PIN.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="********" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm flex items-center justify-center gap-2 shadow-[var(--shadow)] transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--text)]">Check Your Inbox</h2>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        We sent a 6-digit verification code to <span className="text-[var(--primary)] font-semibold">{email}</span>.
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] underline">Change email</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text)]">Security PIN Code</label>
                    <div className="flex justify-between gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="tel" value={digit} autoComplete="off" onChange={(e) => handleOtpChange(index, e.target.value)}
                        onPaste={handlePaste} onKeyDown={(e) => handleKeyDown(index, e)} className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] focus:bg-[var(--primary-soft)] text-[var(--text)] rounded-xl outline-none transition-all shadow-inner" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[var(--primary)]" /> Code expires in: <strong className="text-[var(--text)] font-mono">{formatTimer(timeLeft)}</strong></span>
                    <button type="button" onClick={handleSendOtp} disabled={timeLeft > 0} className={`font-semibold transition-colors ${timeLeft > 0 ? 'text-[var(--text-muted)] cursor-not-allowed' : 'text-[var(--primary)] hover:text-[var(--primary)]'}`}>Resend Code</button>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm flex items-center justify-center gap-2 shadow-[var(--shadow)] transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>Verify Code & Continue</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text)]">Create New Password</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Your identity has been verified. Enter a strong, fresh security phrase.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">New Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex gap-1 h-1">
                          <span className={`flex-1 rounded-full ${strengthScore >= 1 ? 'bg-[var(--rose)]' : 'bg-[var(--surface)]'}`}></span>
                          <span className={`flex-1 rounded-full ${strengthScore >= 2 ? 'bg-[var(--warning-text)]' : 'bg-[var(--surface)]'}`}></span>
                          <span className={`flex-1 rounded-full ${strengthScore >= 3 ? 'bg-[var(--success-hover)]' : 'bg-[var(--surface)]'}`}></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text)]">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-10 pr-10 py-3 text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 mt-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm flex items-center justify-center gap-2 shadow-[var(--shadow)] transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /><span>Update Password & Sign In</span></>}
                  </button>
                </form>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--success-soft)] border border-[var(--success-soft)] text-[var(--success-text)] mx-auto flex items-center justify-center shadow-[var(--shadow)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text)]">Password Successfully Updated!</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">Your NEXUS account credentials have been synchronized. You can now log into your member dashboard.</p>
                  </div>
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[color:var(--on-primary)] font-semibold text-sm shadow-[var(--shadow)] transition-all">
                    <span>Proceed to Member Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-[var(--text)] hover:text-[var(--text)] transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Member Sign In</span>
              </Link>
              <span className="text-[11px] text-[var(--text-muted)]">256-Bit SSL Encrypted Protocol</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
