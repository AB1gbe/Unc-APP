import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { LanguageProvider } from './i18n.jsx';
import { api } from './api.js';
import { registerServiceWorker } from './push.js';
import App from './App.jsx';
import './styles.css';

registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* Remember a logged-in member's language so emails use it too
            (ignored when logged out). */}
        <LanguageProvider onChange={(language) => api('/auth/language', { method: 'PUT', body: { language } }).catch(() => {})}>
          <App />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
