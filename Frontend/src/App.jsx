import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import LanguageProvider from './i18n/LanguageContext';

function App() {
  return (
    <LanguageProvider><AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider></LanguageProvider>
  );
}

export default App;
