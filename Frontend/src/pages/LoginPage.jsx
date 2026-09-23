import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BriefcaseBusiness,
  Dumbbell,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ROLE_ROUTES } from '../config/roles';

const DEMO_ROLES = [
  { id: 'customer', label: 'Customer', description: 'Book & manage activities', icon: UserRound },
  { id: 'staff', label: 'Staff', description: 'Operate the sports center', icon: BriefcaseBusiness },
  { id: 'trainer', label: 'Trainer', description: 'Coach & track members', icon: Dumbbell },
  { id: 'admin', label: 'Admin', description: 'Manage the entire system', icon: ShieldCheck },
];

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleRoleLogin = (role) => {
    login(role);
    navigate(ROLE_ROUTES[role]);
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
            <p>Choose a portal below to explore the Nexus demo.</p>
          </div>

          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <div className="field-group">
              <label htmlFor="username">Username</label>
              <input id="username" type="text" placeholder="Enter your username" />
            </div>
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="text-link">Forgot password?</button>
              </div>
              <input id="password" type="password" placeholder="Enter your password" />
            </div>
            <div className="api-note">
              <LockKeyhole size={14} />
              <span>Real sign-in will be available when the API is connected.</span>
            </div>
            <button type="submit" className="sign-in-button">Sign in</button>
          </form>

          <div className="auth-links">
            <span>New to Nexus?</span>
            <button type="button" className="text-link" onClick={() => navigate('/register')}>Sign up</button>
          </div>

          <div className="or-divider"><span>or</span></div>
          <button type="button" className="google-button">
            <span className="google-mark">G</span>
            <span>Sign in with Google</span>
          </button>

          <div className="section-divider"><span>Continue demo as</span></div>

          <div className="role-grid">
            {DEMO_ROLES.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`role-button role-${id}`}
                onClick={() => handleRoleLogin(id)}
                aria-label={`Continue as ${label}`}
              >
                <span className="role-icon"><Icon size={22} /></span>
                <span className="role-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <ArrowRight className="role-arrow" size={18} />
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
