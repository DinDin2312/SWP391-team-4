import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 phút = 300 giây
  
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy email truyền từ trang Đăng ký sang (hoặc dùng email mặc định nếu truy cập trực tiếp)
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

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Tự động nhảy sang ô tiếp theo
    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Nhấn Backspace để quay lại ô trước
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
      setToastMessage({ type: 'error', text: 'Vui lòng nhập đủ 6 số OTP!' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      // Gọi API Verify OTP
      const response = await axios.post('http://localhost:8080/api/v1/auth/verify-otp', { email, otp: otpCode });
      
      setToastMessage({ type: 'success', text: response.data.message || 'Xác thực thành công! Tài khoản đã được kích hoạt.' });
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      setToastMessage({ type: 'error', text: error.response?.data?.message || 'Mã OTP không hợp lệ!' });
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="h-full bg-[#0b1326] text-slate-100 font-sans antialiased flex flex-col justify-between overflow-x-hidden min-h-screen">
      <main className="min-h-screen w-full flex flex-col lg:flex-row relative">
        
        <section className="relative w-full lg:w-1/2 min-h-[520px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none border-b lg:border-b-0 lg:border-r border-[#222f4c]/40">
          <img alt="Nexus Gym Facility" className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 filter brightness-90 contrast-110" 
               src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1326]/45 via-[#0b1326]/85 to-[#0b1326] backdrop-blur-[1px]"></div>
          
          <header className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/30">
                <svg aria-hidden="true" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <div>
                <span className="block text-base font-extrabold tracking-wider text-white">NEXUS</span>
                <span className="block text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Performance Lab</span>
              </div>
            </div>
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#131b2e]/80 border border-[#31394d] backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Sports Center</span>
            </div>
          </header>

          <div className="relative z-10 mt-24 lg:mt-auto pt-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#131b2e]/90 border border-blue-500/30 backdrop-blur-md mb-5">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span className="text-xs font-bold tracking-wide text-slate-200 uppercase">Security Protocol</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono font-medium">STEP 2 OF 3</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Verify Your <span className="text-blue-500">Identity</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal max-w-xl leading-relaxed">
              Protecting your personal athletic metrics, biometric data, and facility access reservations across our network.
            </p>
            
            <div className="w-full h-px bg-slate-800/80 my-8"></div>
            
            <div className="grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono">256-Bit</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">SSL Encrypted</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono">Live Sync</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Instant Access</div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-white font-mono">Biometric</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">ID Protected</div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-[#0b1326] relative z-10">
          <nav className="flex items-center justify-between sm:justify-end gap-3 w-full pb-8 sm:pb-0">
            <span className="text-sm text-slate-400">Already verified?</span>
            <button onClick={() => navigate('/login')} className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors gap-1 group">
              Sign in
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </nav>

          <div className="max-w-md w-full mx-auto my-auto py-8">
            <div className="text-center sm:text-left mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#131b2e] border border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] mb-6">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Check your email</h2>
                <span className="text-blue-500 inline-block">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </span>
              </div>
              <p className="mt-3 text-slate-400 text-sm leading-relaxed">
                We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>. Enter the code below to confirm your account.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Security PIN Code</label>
                  <button type="button" className="text-xs text-blue-400 hover:text-blue-300 font-medium">Change email</button>
                </div>
                
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onFocus={(e) => e.target.select()}
                      className="w-full h-13 sm:h-14 bg-[#131b2e] border border-[#31394d] text-white text-center text-xl sm:text-2xl font-mono font-bold rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Code expires in <span className={`font-mono font-medium ${timeLeft < 60 ? 'text-red-400' : 'text-slate-200'}`}>{formatTime(timeLeft)}</span></span>
                  </div>
                  <span className="text-blue-400 font-medium">Secure Delivery</span>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full py-3.5 px-4 bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-150 flex items-center justify-center gap-2 group text-base disabled:opacity-70">
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Verifying...</span></>
                ) : (
                  <>
                    <span>Verify Account</span>
                    <svg className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-sm text-slate-400">
                Didn't receive the code? 
                <button type="button" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors focus:underline ml-1">
                  Resend Code
                </button>
              </div>
            </form>

            <div className="mt-8 p-3.5 rounded-xl bg-[#131b2e] border border-[#222f4c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75m-2.18-7.228a2.25 2.25 0 00-.946-.867 2.25 2.25 0 00-2.234.334L5.688 9.5a2.25 2.25 0 00-.688 1.6V18a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0020 18v-6.9a2.25 2.25 0 00-.688-1.6l-3.208-2.512z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Instant Access Portal</p>
                  <p className="text-[11px] text-slate-400">Synchronizes with your smart sports membership.</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/15 border border-blue-500/25 px-2 py-0.5 rounded tracking-wider uppercase">
                PENDING
              </span>
            </div>
          </div>

          <footer className="pt-8 border-t border-[#222f4c]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>© 2026 NEXUS Sports Technology Inc.</div>
            <div className="flex items-center gap-4">
              <button className="hover:text-slate-300 transition-colors">Privacy Policy</button>
              <button className="hover:text-slate-300 transition-colors">Safety Code</button>
              <button className="hover:text-slate-300 transition-colors">Contact</button>
            </div>
          </footer>
        </section>
      </main>

      {toastMessage && (
        <div className={`fixed bottom-8 right-8 z-50 bg-[#171F33] border ${toastMessage.type === 'error' ? 'border-red-500' : 'border-blue-500'} text-white rounded-xl p-4 shadow-2xl animate-fade-in-up flex items-center gap-3.5 max-w-sm`}>
          <div className={`w-9 h-9 rounded-full ${toastMessage.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center text-white`}>
            <span className="material-symbols-outlined text-[20px]">{toastMessage.type === 'error' ? 'close' : 'check'}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white">{toastMessage.type === 'error' ? 'Lỗi!' : 'Thành công!'}</span>
            <span className="text-xs text-[#C2C6D6]">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
