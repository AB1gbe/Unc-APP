// "Your account will be deleted on 30 October. Keep my account" (session 37).
import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { formatDate, t } from '../i18n.jsx';

// Also shown at the top of every page (Layout) while a deletion is waiting.
export default function DeletePending({ banner = false }) {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    setBusy(true);
    try {
      setUser((await api('/auth/me/delete/cancel', { method: 'POST' })).user);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={banner ? 'delete-banner' : 'small'} role="status">
      {t('Your account will be deleted on {date}.', { date: formatDate(new Date(user.deleteAt), { day: 'numeric', month: 'long' }) })}{' '}
      <button type="button" className="btn sm secondary" onClick={cancel} disabled={busy}>{t('Keep my account')}</button>
    </div>
  );
}

