import { Moon, Sun } from 'lucide-react';
import '../styles/role-theme.css';

const RoleThemeToggle = ({ theme, onToggle, floating = false }) => (
  <button
    type="button"
    className={`role-theme-toggle${floating ? ' is-floating' : ''}`}
    onClick={onToggle}
    title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    aria-label={theme === 'dark' ? 'Bật giao diện sáng' : 'Bật giao diện tối'}
    aria-pressed={theme === 'light'}
  >
    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
  </button>
);

export default RoleThemeToggle;
