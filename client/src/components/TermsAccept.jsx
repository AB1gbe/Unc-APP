// "I agree to the Terms" for members who joined before them (session 40).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ErrorBox } from './ui.jsx';
import { t, tj } from '../i18n.jsx';

export default function TermsAccept({ banner = false }) {
  const { setUser } = useAuth();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function accept() {
    setBusy(true);
    setError(null);
    try {
      setUser((await api('/auth/terms', { method: 'POST', body: { accept: true } })).user);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={banner ? 'terms-banner' : 'terms-accept'} role="status">
      <ErrorBox error={error} />
      <span>{tj('We have new {terms}, including: deals agreed on Unc are finished on Unc. Please read and accept them to keep posting and making offers.', { terms: <Link to="/terms">{t('Terms of use')}</Link> })}</span>
      <button type="button" className="btn sm" onClick={accept} disabled={busy}>{t('I agree')}</button>
    </div>
  );
}
