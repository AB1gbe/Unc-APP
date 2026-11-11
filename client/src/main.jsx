import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { LanguageProvider } from './i18n.jsx';
import { api } from './api.js';
import { registerServiceWorker } from './push.js';
import App from './App.jsx';
// Fonts are bundled with the app (no requests to font sites). Session 72,
// chosen by the owner from four samples: Plus Jakarta Sans for English and
// Almarai (a Saudi-designed font used by many Gulf apps) for Arabic. Only
// Almarai's Arabic letters are loaded, so English always uses Jakarta.
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/almarai/arabic-400.css';
import '@fontsource/almarai/arabic-700.css';
import '@fontsource/almarai/arabic-800.css';
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
