import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LockKeyhole } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

const ROLE_ROUTES = {
  Member: '/customer/dashboard',
  Receptionist: '/staff/dashboard',
  Coach: '/trainer/dashboard',
  Admin: '/admin/dashboard',
};

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await axios.post('http://localhost:8080/api/v1/auth/google', {
          token: tokenResponse.access_token,
        });
        
        const { token, role, email: userEmail, fullName } = res.data;
        login({ token, role, email: userEmail, fullName });
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
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/login', {
        email,
        password,
      });

      const { token, role, email: userEmail, fullName } = response.data;

      login({ token, role, email: userEmail, fullName });

      const route = ROLE_ROUTES[role] || '/customer/dashboard';
      navigate(route);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="hero-panel" aria-label="Nexus Sports Center introduction">
        <div className="hero-photo" aria-hidden="true" />
        <div className="hero-streak hero-streak-one" aria-hidden="true" />
        <div className="hero-streak hero-streak-two" aria-hidden="true" />
        <div className="hero-copy">
          <div className="hero-kicker"><span /> Performance, connected</div>
          <h2>NEXUS:<br /><em>Redefining</em><br />Sports Center<br />Management.</h2>
          <p>One intelligent space for every athlete, coach, and team.</p>
        </div>
        <div className="hero-footer"><span>01</span><i /><span>MOVE WITH PURPOSE</span></div>
      </section>

      <section className="login-shell" aria-labelledby="login-title">
        <header className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Dumbbell size={25} strokeWidth={2.3} />
          </div>
          <div>
            <p className="brand-name">NEXUS</p>
            <p className="brand-subtitle">SPORTS CENTER</p>
          </div>
        </header>

        <div className="login-card">
          <div className="login-heading">
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to your account to continue.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="text-link" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <LockKeyhole size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
              <span style={{ padding: '0 10px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
            </div>

            <button type="button" className="sign-in-button" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', boxShadow: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} onClick={() => googleLogin()}>
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <div className="auth-links">
            <span>New to Nexus?</span>
            <button type="button" className="text-link" onClick={() => navigate('/register')}>Sign up</button>
          </div>

          <div className="or-divider"><span>or</span></div>

          <div className="section-divider"><span>Continue demo as</span></div>

          <div className="role-grid">
            {[
              { id: 'Member', label: 'Customer', description: 'Book & manage activities', route: '/customer/dashboard' },
              { id: 'Receptionist', label: 'Staff', description: 'Operate the sports center', route: '/staff/dashboard' },
              { id: 'Coach', label: 'Trainer', description: 'Coach & track members', route: '/trainer/dashboard' },
              { id: 'Admin', label: 'Admin', description: 'Manage the entire system', route: '/admin/dashboard' },
            ].map(({ id, label, description, route }) => (
              <button
                key={id}
                type="button"
                className={`role-button role-${id.toLowerCase()}`}
                onClick={() => {
                  login({ token: 'demo', role: id, email: 'demo@nexus.com', fullName: `Demo ${label}` });
                  navigate(route);
                }}
                aria-label={`Continue as ${label}`}
              >
                <span className="role-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <footer className="login-footer">
          <span>Secure access</span><i aria-hidden="true" /><span>Nexus Sports Center</span>
        </footer>
      </section>
    </main>
  );
}

export default LoginPage;
