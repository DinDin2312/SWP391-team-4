import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import './styles/role-theme.css'
import App from './App.jsx'

// Retire stored dark preferences without touching authentication or other settings.
try {
  localStorage.setItem('nexusTheme', 'light');
  localStorage.removeItem('managerTheme');
} catch {
  // The CSS theme remains light when storage is unavailable.
}
document.documentElement.classList.remove('dark');
document.documentElement.dataset.theme = 'light';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="724916827221-vrkorpui62iqienis43719eaqq8vth0a.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
