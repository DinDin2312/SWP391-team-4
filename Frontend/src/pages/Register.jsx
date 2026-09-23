import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    if (len < 6) return { text: 'Weak', m1: 'bg-red-400', m2: '', m3: '', m4: '', textClass: 'text-red-400' };
    if (len < 9) return { text: 'Fair', m1: 'bg-[#009BD1]', m2: 'bg-[#009BD1]', m3: '', m4: '', textClass: 'text-[#009BD1]' };
    if (len < 12) return { text: 'Good', m1: 'bg-blue-500', m2: 'bg-blue-500', m3: 'bg-blue-500', m4: '', textClass: 'text-blue-500' };
    return { text: 'Elite', m1: 'bg-blue-500', m2: 'bg-blue-500', m3: 'bg-blue-500', m4: 'bg-blue-500', textClass: 'text-blue-300 font-bold' };
  };

  const strength = getPasswordStrength();

  const handleRegistration = async (e) => {
    e.preventDefault();
    if (!isAgreed) {
      alert("Bạn phải đồng ý với Điều khoản dịch vụ!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/register', formData);
      setToastMessage({ type: 'success', text: response.data.message || 'Đăng ký tài khoản Member thành công!' });
      
      // Chuyển hướng sang trang nhập OTP, truyền theo email vừa đăng ký
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: formData.email } });
      }, 1500);
    } catch (error) {
      setToastMessage({ type: 'error', text: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại!' });
    } finally {
      setLoading(false);
      setTimeout(() => setToastMessage(null), 3200);
    }
  };

  return (
    <div className="bg-[#0B1326] text-[#DAE2FD] font-sans antialiased min-h-screen selection:bg-blue-500/30 selection:text-white">
      <div className="min-h-screen w-full flex flex-col lg:flex-row relative">
        <div className="relative w-full lg:w-[52%] xl:w-[54%] min-h-[460px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1e293b]/70">
          <img alt="NEXUS High Performance" className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000 hover:scale-100" src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1326] via-[#0B1326]/75 to-[#0B1326]/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1326]/90 via-[#0B1326]/40 to-transparent"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-[0_0_20px_-2px_rgba(59,130,246,0.6)]">
                <span className="material-symbols-outlined text-[22px]">bolt</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[22px] tracking-wider text-white leading-tight uppercase">NEXUS</span>
                <span className="text-[10px] tracking-[0.2em] font-semibold text-[#7BD0FF] uppercase">Performance Lab</span>
              </div>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[#131B2E]/75 backdrop-blur-md border border-white/10 text-[#7BD0FF] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#7BD0FF] animate-ping"></span> SPORTS CENTER
            </span>
          </div>

          <div className="relative z-10 mt-20 lg:mt-auto pt-10">
            <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5 max-w-xl">
              Unleash Your <span className="bg-gradient-to-r from-white via-[#DAE2FD] to-blue-500 bg-clip-text text-transparent">Potential</span>.
            </h2>
            <p className="text-base lg:text-lg text-[#C2C6D6] font-normal leading-relaxed max-w-lg mb-8">
              Book courts, join classes, and track your athletic performance with real-time biometric integration at NEXUS.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[48%] xl:w-[46%] min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#0B1326] relative overflow-y-auto">
          <div className="w-full flex items-center justify-end gap-6 text-sm text-[#C2C6D6] z-10 pb-4 lg:pb-0">
            <span className="hidden sm:inline">Already have an account?</span>
            <a className="inline-flex items-center gap-1.5 text-blue-500 hover:text-white font-semibold transition-colors" href="/login">
              <span>Sign in</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>

          <div className="w-full max-w-[500px] mx-auto my-auto py-6 relative z-10">
            <div className="mb-7">
              <div className="flex items-center gap-2.5 mb-2">
                <h1 className="text-3xl lg:text-[34px] font-bold text-white tracking-tight leading-tight">Join NEXUS</h1>
                <span className="material-symbols-outlined text-blue-500 text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              </div>
              <p className="text-sm text-[#C2C6D6] leading-relaxed">
                Start your fitness journey and access live court bookings, class schedules, and elite personal coaching.
              </p>
            </div>

            <div className="bg-[#131B2E]/90 rounded-2xl p-6 sm:p-7 border border-[#1e293b] shadow-2xl relative">
              <form className="space-y-4" onSubmit={handleRegistration}>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#C2C6D6] flex justify-between" htmlFor="fullName">
                    <span>Full Name</span><span className="text-[#7BD0FF] text-[11px] font-medium">Required</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8C909F] text-[20px]">person</span>
                    <input className="w-full bg-[#060E20] text-white text-sm pl-11 pr-4 py-3 rounded-xl border border-[#1e293b] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      id="fullName" placeholder="Alex Morgan" required value={formData.fullName} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#C2C6D6]" htmlFor="email">Email Address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8C909F] text-[20px]">mail</span>
                    <input className="w-full bg-[#060E20] text-white text-sm pl-11 pr-4 py-3 rounded-xl border border-[#1e293b] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      type="email" id="email" placeholder="alex@nexus.com" required value={formData.email} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#C2C6D6]" htmlFor="phone">Phone Number</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8C909F] text-[20px]">call</span>
                    <input className="w-full bg-[#060E20] text-white text-sm pl-11 pr-4 py-3 rounded-xl border border-[#1e293b] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      type="tel" id="phone" placeholder="+1 (555) 019-2834" value={formData.phone} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#C2C6D6]" htmlFor="password">Password</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-[#8C909F] text-[20px]">lock</span>
                    <input className="w-full bg-[#060E20] text-white text-sm pl-11 pr-11 py-3 rounded-xl border border-[#1e293b] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" 
                      type={showPassword ? "text" : "password"} id="password" placeholder="Minimum 8 characters" required value={formData.password} onChange={handleInputChange} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-[#8C909F] hover:text-white">
                      <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 pt-1.5 px-0.5">
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m1 || 'bg-[#2D3449]'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m2 || 'bg-[#2D3449]'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m3 || 'bg-[#2D3449]'}`}></div>
                    <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.m4 || 'bg-[#2D3449]'}`}></div>
                    <span className={`text-[11px] ml-2 min-w-[50px] text-right ${strength.textClass}`}>{strength.text}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-[#C2C6D6] block">Primary Athletic Focus</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Gym', 'Courts', 'Aquatics'].map(sport => (
                      <button key={sport} type="button" onClick={() => setSelectedSport(sport)} 
                        className={`py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-200 border ${selectedSport === sport ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-[#171F33] border-[#1e293b] text-[#DAE2FD]'}`}>
                        <span className={`material-symbols-outlined text-[16px] ${selectedSport === sport ? 'text-white' : 'text-blue-500'}`}>
                          {sport === 'Gym' ? 'fitness_center' : sport === 'Courts' ? 'sports_tennis' : 'pool'}
                        </span> {sport}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 cursor-pointer select-none" onClick={toggleAgreement}>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 ${isAgreed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-[#060E20] border-[#1e293b]'}`}>
                    {isAgreed && <span className="material-symbols-outlined text-[15px] font-bold">check</span>}
                  </div>
                  <p className="text-xs text-[#C2C6D6] leading-relaxed">
                    I accept the <span className="text-[#7BD0FF] underline hover:text-white">Terms of Service</span>, safety protocols, and health liability waivers.
                  </p>
                </div>

                <button type="submit" disabled={loading} className="w-full mt-4 py-3.5 px-5 bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-[0_4px_24px_-2px_rgba(59,130,246,0.45)] transition-all flex items-center justify-center gap-2">
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
      
      <div className={`fixed bottom-8 right-8 z-50 bg-[#171F33] border ${toastMessage?.type === 'error' ? 'border-red-500' : 'border-blue-500'} text-white rounded-xl p-4 shadow-2xl transition-all duration-300 ${toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'} flex items-center gap-3.5 max-w-sm`}>
        <div className={`w-9 h-9 rounded-full ${toastMessage?.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center text-white`}>
          <span className="material-symbols-outlined text-[20px]">{toastMessage?.type === 'error' ? 'close' : 'check'}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white">{toastMessage?.type === 'error' ? 'Lỗi!' : 'Thành công!'}</span>
          <span className="text-xs text-[#C2C6D6]">{toastMessage?.text}</span>
        </div>
      </div>
    </div>
  );
}
