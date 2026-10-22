// "Notifications on this phone" card (Account page, and on the
// Notifications page while they are off).
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { currentSubscription, disablePush, enablePush, pushSupport } from '../push.js';
import { ErrorBox } from './ui.jsx';
import { t } from '../i18n.jsx';

export default function PushSettings({ hideWhenOn = false }) {
  const support = pushSupport();
  const [state, setState] = useState('loading'); // loading | off | on | denied
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    if (support !== 'ok') return;
    if (Notification.permission === 'denied') { setState('denied'); return; }
    currentSubscription().then((s) => setState(s ? 'on' : 'off')).catch(() => setState('off'));
  }, [support]);

  const run = (fn) => async () => {
    setBusy(true);
    setError(null);
    try { await fn(); } catch (err) { setError(err); } finally { setBusy(false); }
  };

  if (hideWhenOn && (state === 'on' || state === 'loading' || support === 'unsupported')) return null;

  return (
    <div className="card push-card">
      <h2>{t('Notifications on this phone')}</h2>
      <p className="muted small">{t('Get a notification the moment a seller makes an offer on your request, or a member who favourited you posts a request, even when Unc is closed.')}</p>
      <ErrorBox error={error} />
      {support === 'ios-install' && (
        <div className="alert info">{t('On iPhone: tap the Share button, then “Add to Home Screen”, open Unc from your home screen, and come back here.')}</div>
      )}
      {support === 'insecure' && (
        <div className="alert info">{t('Phone notifications need a secure (https) address. They work once Unc is online, or on this computer at localhost.')}</div>
      )}
      {support === 'unsupported' && <div className="alert info">{t("This browser can't show notifications. Try Chrome, Edge, Firefox or Safari.")}</div>}
      {support === 'ok' && state === 'denied' && (
        <div className="alert warn">{t('Notifications are blocked for Unc. Allow them in your browser or phone settings, then reload this page.')}</div>
      )}
      {support === 'ok' && state === 'off' && (
        <button className="btn" disabled={busy} onClick={run(async () => setState(await enablePush()))}>{t('🔔 Turn on notifications')}</button>
      )}
      {support === 'ok' && state === 'on' && (
        <div className="row">
          <span className="badge ok">{t('✓ On for this device')}</span>
          <button className="btn sm secondary" disabled={busy} onClick={run(async () => { await api('/push/test', { method: 'POST' }); setTested(true); })}>{t('Send a test')}</button>
          <button className="btn sm secondary" disabled={busy} onClick={run(async () => { await disablePush(); setState('off'); setTested(false); })}>{t('Turn off')}</button>
        </div>
      )}
      {tested && <p className="small muted" style={{ marginBottom: 0 }}>{t('Sent. It should appear in a few seconds.')}</p>}
    </div>
  );
}
