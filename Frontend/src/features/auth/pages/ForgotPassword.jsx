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

  const handleOtpChange = (index, val) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // 1. API Gửi OTP Khôi phục mật khẩu
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
      await axios.post('http://localhost:8080/api/v1/auth/forgot-password/send-otp', { email });
      setStep(2);
      setTimeLeft(300);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Lỗi khi gửi OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. API Xác thực OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.some((digit) => digit === '')) {
      setErrorMsg('Vui lòng nhập đầy đủ 6 chữ số mã OTP.');
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
      setErrorMsg(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. API Đổi mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
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
      setErrorMsg(err.response?.data?.message || 'Lỗi khi đổi mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const strengthScore = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#060b17] text-slate-200 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      <header className="border-b border-[#15203b] bg-[#091124]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold tracking-wider text-sm text-white">NEXUS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            </div>
            <p className="text-[9px] tracking-widest text-slate-400 font-bold uppercase">SPORTS CENTER</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 hidden sm:inline">Need assistance?</span>
          <a href="#support" className="text-blue-400 hover:text-blue-300 font-semibold">IT Support Desk</a>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          {/* CỘT TRÁI */}
          <div className="lg:col-span-5 rounded-3xl bg-[#0b1326] border border-[#172545] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Security Protocol · Auth Gateway v4.9</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Restore Access to Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Athletic Command.</span>
                </h1>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  Verify your registered credentials to instantly sync your training telemetry, smart court reservations, and biometric baseline data.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t border-[#162547]">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-[#111e3b] text-blue-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>256-Bit Encrypted Dynamic OTP Verification</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-[#111e3b] text-blue-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span>Instant Biometric & RFID Locker Re-sync</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="w-7 h-7 rounded-lg bg-[#111e3b] text-blue-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span>Zero Telemetry Loss Across Active Workouts</span>
                </div>
              </div>
            </div>
            <div className="relative z-10 pt-6 mt-8 border-t border-[#162547] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Auth Node: Operational
              </span>
              <span>Latency: 18ms</span>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-7 rounded-3xl bg-[#0b1326] border border-[#172545] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
            <div>
              <div className="grid grid-cols-3 gap-2 pb-6 border-b border-[#172545] mb-6">
                {[
                  { num: 1, label: 'Email' },
                  { num: 2, label: 'Verify OTP' },
                  { num: 3, label: 'New Password' },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isDone = step > s.num;
                  return (
                    <div key={s.num} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${isActive ? 'bg-blue-600/10 border-blue-500/40 text-blue-400' : isDone ? 'bg-[#111d38] border-slate-700 text-slate-300' : 'bg-[#091124] border-transparent text-slate-500'}`}>
                      <div className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-[#162340] text-slate-400'}`}>
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span className="text-xs font-semibold">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* BƯỚC 1 */}
              {step === 1 && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Reset Account Password</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the email associated with your NEXUS membership. We will send a 6-digit dynamic authentication PIN.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="athlete@nexus.com" className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>Send Verification Code</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* BƯỚC 2 */}
              {step === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Check Your Inbox</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        We sent a 6-digit verification code to <span className="text-blue-400 font-semibold">{email}</span>.
                      </p>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white underline">Change email</button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Security PIN Code</label>
                    <div className="flex justify-between gap-2 sm:gap-3">
                      {otp.map((digit, index) => (
                        <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold bg-[#0e172a] border border-[#1a2947] focus:border-blue-500 focus:bg-blue-950/20 text-white rounded-xl outline-none transition-all shadow-inner" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> Code expires in: <strong className="text-white font-mono">{formatTimer(timeLeft)}</strong></span>
                    <button type="button" onClick={handleSendOtp} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Resend Code</button>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><span>Verify Code & Continue</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {/* BƯỚC 3 */}
              {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Create New Password</h2>
                    <p className="text-xs text-slate-400 mt-1">Your identity has been verified. Enter a strong, fresh security phrase.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">New Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="pt-1.5 space-y-1">
                        <div className="flex gap-1 h-1">
                          <span className={`flex-1 rounded-full ${strengthScore >= 1 ? 'bg-rose-500' : 'bg-[#1a2947]'}`}></span>
                          <span className={`flex-1 rounded-full ${strengthScore >= 2 ? 'bg-amber-400' : 'bg-[#1a2947]'}`}></span>
                          <span className={`flex-1 rounded-full ${strengthScore >= 3 ? 'bg-emerald-400' : 'bg-[#1a2947]'}`}></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-[#0e172a] border border-[#1a2947] rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 px-4 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50">
                    {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /><span>Update Password & Sign In</span></>}
                  </button>
                </form>
              )}

              {/* BƯỚC 4 */}
              {step === 4 && (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Password Successfully Updated!</h2>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Your NEXUS account credentials have been synchronized. You can now log into your member dashboard.</p>
                  </div>
                  <Link to="/login" className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all">
                    <span>Proceed to Member Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#172545] flex items-center justify-between text-xs text-slate-400">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Member Sign In</span>
              </Link>
              <span className="text-[11px] text-slate-500">256-Bit SSL Encrypted Protocol</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
