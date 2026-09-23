import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, LockKeyhole } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

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
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng!';
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
                <button type="button" className="text-link">Forgot password?</button>
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
              {loading ? 'Đang đăng nhập...' : 'Sign in'}
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
              { id: 'customer', label: 'Customer', description: 'Book & manage activities', route: '/customer/dashboard' },
              { id: 'staff', label: 'Staff', description: 'Operate the sports center', route: '/staff/dashboard' },
              { id: 'trainer', label: 'Trainer', description: 'Coach & track members', route: '/trainer/dashboard' },
              { id: 'admin', label: 'Admin', description: 'Manage the entire system', route: '/admin/dashboard' },
            ].map(({ id, label, description, route }) => (
              <button
                key={id}
                type="button"
                className={`role-button role-${id}`}
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
