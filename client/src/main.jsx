import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { LanguageProvider } from './i18n.jsx';
import { api } from './api.js';
import { registerServiceWorker } from './push.js';
import App from './App.jsx';
// Fonts are bundled with the app (no requests to font sites). Session 69:
// Readex Pro for headings (drawn for Arabic and English together), IBM Plex
// Sans and IBM Plex Sans Arabic for text. Replaces Fraunces + Inter, a very
// common pairing on AI-made sites.
import '@fontsource-variable/readex-pro';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/500.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/ibm-plex-sans-arabic/700.css';
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
