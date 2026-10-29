import { t, useLanguage } from '../../../i18n/useLanguage';
import { setLanguage } from '../../../i18n/languageStore';
import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Mail, 
  LockKeyhole, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ArrowRight, 
  Globe 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../../../context/AuthContext';
import authService from '../services/authService';
import { useGoogleLogin } from '@react-oauth/google';

const ROLE_ROUTES = {
  Member: '/member/dashboard',
  Receptionist: '/staff/dashboard',
  Coach: '/coach/dashboard',
  'Center Manager': '/admin/dashboard',
};

function LoginPage() {
  const currentLang = useLanguage();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('nexus_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem('nexus_remembered_email');
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await authService.googleLogin(tokenResponse.access_token);

        const { token, role, email: userEmail, fullName, avatarUrl } = data;
        login({ token, role, email: userEmail, fullName, avatarUrl });
        const route = ROLE_ROUTES[role] || '/customer/dashboard';
        navigate(route);
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed!');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed!');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Strict email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login({
        email,
        password,
      });

      const { token, role, email: userEmail, fullName, avatarUrl } = data;

      if (rememberMe) {
        try { localStorage.setItem('nexus_remembered_email', email); } catch {}
      } else {
        try { localStorage.removeItem('nexus_remembered_email'); } catch {}
      }

      login({ token, role, email: userEmail, fullName, avatarUrl });

      const route = ROLE_ROUTES[role] || '/customer/dashboard';
      navigate(route);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(currentLang === 'en' ? 'vi' : 'en');
  };

  return (
    <motion.main 
      className="relative w-full h-screen max-h-screen overflow-hidden select-none bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Dynamic velocity sweep animation across the screen on entry (GetLayers.ai style) */}
      <motion.div
        className="absolute top-0 bottom-0 w-64 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-24deg] pointer-events-none z-1"
        initial={{ left: '-40%' }}
        animate={{ left: '140%' }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      />

      {/* 2. TOP BAR: Back to Home Button (Solid Crisp Pill) */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-900 hover:text-blue-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border border-slate-300 shadow-md cursor-pointer hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4 text-slate-800" strokeWidth={2.2} />
          <span>{t("Back to Home")}</span>
        </button>
      </div>

      {/* 3. FOREGROUND 2-COLUMN LAYOUT */}
      <div className="relative z-10 w-full h-full max-h-screen flex items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-20 py-4">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* LEFT COLUMN: Hero Athletic Branding */}
          <motion.div 
            className="hidden lg:flex lg:col-span-7 flex-col justify-center text-white pr-4 xl:pr-10"
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Kicker badge */}
            <div className="flex items-center gap-2.5 text-sky-300 font-bold text-xs uppercase tracking-widest mb-3">
              <span className="w-7 h-[2px] bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
              <span>{t("Performance, connected")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-white leading-[1.04] tracking-tight mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
              <span>{t("NEXUS:")}</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-200 drop-shadow-sm">
                {t("Redefining")}
              </span><br />
              <span>{t("Sports Center")}</span><br />
              <span>{t("Management.")}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm xl:text-base text-slate-100 max-w-lg leading-relaxed font-normal mb-8 drop-shadow-md">
              {t("One intelligent space for every athlete, coach, and team.")}
            </p>

            {/* Footer Tag */}
            <div className="flex items-center gap-3 text-xs font-bold tracking-widest text-slate-200 uppercase drop-shadow-sm">
              <span className="text-sky-300 font-extrabold">01</span>
              <span className="w-12 h-px bg-white/40" />
              <span>{t("MOVE WITH PURPOSE")}</span>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Bright Translucent Frosted Glass Login Card */}
          {/* RIGHT COLUMN: Metamorphosis Glass to Pure White Card */}
          <motion.div 
            className="col-span-1 lg:col-span-5 flex justify-center lg:justify-end"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* 3-Stage Metamorphosis Card: Trong suốt (0s) -> Đục mờ sương (1s) -> Trắng tinh hoàn toàn (2s) */}
            <div className="relative w-full max-w-[420px] rounded-2xl animate-card-glass-to-white p-6 sm:p-7 text-slate-900">

              {/* Header Row: Brand + Language Toggle */}
              <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                    <Dumbbell className="w-5 h-5" strokeWidth={2.4} />
                  </div>
                  <div className="leading-tight">
                    <h2 className="font-black text-sm text-slate-950 tracking-wider">{t("NEXUS")}</h2>
                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{t("SPORTS CENTER")}</p>
                  </div>
                </div>

                {/* Language Switcher Pill (Solid & Bold) */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  title={currentLang === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-blue-600" strokeWidth={2.2} />
                  <span>{currentLang.toUpperCase()}</span>
                </button>
              </div>

              {/* Card Title */}
              <div className="mb-3.5">
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {t("Sign in")}
                </h3>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  {t("Sign in to your account to continue.")}
                </p>
              </div>

              {/* Form */}
              <form className="space-y-3" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-xs font-extrabold text-slate-900 mb-1">
                    {t("Email")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" strokeWidth={2.2} />
                    <input
                      id="email"
                      type="email"
                      placeholder={t("Enter your email")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-xs font-extrabold text-slate-900 mb-1">
                    {t("Password")} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 pointer-events-none" strokeWidth={2.2} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("Enter your password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm text-slate-900 font-mono font-semibold placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      aria-label={t(showPassword ? 'Hide password' : 'Show password')}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={17} strokeWidth={2.2} /> : <Eye size={17} strokeWidth={2.2} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 font-bold hover:text-slate-950 transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-400 bg-white text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                    />
                    <span>{t("Remember me")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-blue-600 hover:text-blue-700 font-bold transition-colors cursor-pointer hover:underline"
                  >
                    {t("Forgot password?")}
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs flex items-center gap-2 font-medium">
                    <LockKeyhole size={14} className="shrink-0" />
                    <span className="leading-tight">{t(error)}</span>
                  </div>
                )}

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-1"
                >
                  {loading ? (
                    <span>{t("Signing in...")}</span>
                  ) : (
                    <>
                      <span>{t("Sign in")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* OR Divider */}
                <div className="relative flex items-center justify-center my-2.5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative px-3 py-0.5 rounded-full bg-white text-[10px] font-extrabold text-slate-600 uppercase tracking-widest border border-slate-200 shadow-2xs">
                    {t("or")}
                  </span>
                </div>

                {/* Google Sign-in - Solid White Button */}
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.99] text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-xs hover:border-slate-400 cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{t("Sign in with Google")}</span>
                </button>
              </form>

              {/* Sign up prompt */}
              <div className="mt-3.5 text-center text-xs text-slate-800 font-semibold">
                <span>{t("No account yet?")} </span>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-blue-600 font-extrabold hover:underline cursor-pointer ml-1"
                >
                  {t("Sign up")}
                </button>
              </div>

              {/* Footer Support Info */}
              <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-center text-[11px] text-slate-600 font-medium flex items-center justify-center gap-1.5 flex-wrap">
                <span>{t("Support")}:</span>
                <a href="mailto:support@nexus.com" className="hover:text-blue-600 transition-colors font-bold text-slate-900">support@nexus.com</a>
                <span>•</span>
                <span className="font-bold text-slate-900">024 3771 2088</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </motion.main>
  );
}

export default LoginPage;
